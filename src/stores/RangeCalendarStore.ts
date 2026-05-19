/**
 * RangeCalendarStore — external store for date-range selection.
 *
 * Snapshot fields and methods that only apply to single / multiple
 * mode are absent (no `selectedDate`, `selectedDates`, `maxSelected`).
 * Cell metadata uses `RangeDayCellInfo` — `isSelected` is absent
 * (a range cell is either `isRangeStart`, `isRangeEnd`, or `inRange`).
 *
 * Progressive-selection semantics:
 *   - first tap sets `rangeStart`
 *   - second tap either completes the range or relocates the start
 *   - tapping the same day twice clears (or single-day range if
 *     `allowSameDay`)
 *   - tapping again after both endpoints are set restarts the range
 *   - `minRangeDays` / `maxRangeDays` reject completion when violated
 *
 * Shared navigation, view derivation, bounds evaluation, and
 * `useSyncExternalStore` plumbing live on `BaseCalendarStore`. Only
 * range-specific state and its hooks remain here.
 */
import type { CalendarDateValue, CalendarSystem } from '../types';
import {
  buildMonthGrid,
  isBetween,
  isExplicitlyDisabled,
  matchDate,
  rotateWeekdayLabels,
} from '../utils/grid';
import {
  BaseCalendarStore,
  type BaseCalendarSnapshotShared,
  type BaseCalendarStoreOptions,
  normalizeSharedInputs,
  resolveInitialSystem,
  shallowModifiersEqual,
} from './BaseCalendarStore';

// ── Public payload + callback types ────────────────────────────────────────

export interface RangeSelectionPayload {
  /** Native JS Date for the range start. `undefined` after `clear()`. */
  startDate: Date | undefined;
  /** Native JS Date for the range end. `undefined` until the user picks both. */
  endDate: Date | undefined;
  /** Identifier of the active calendar system at the time of selection. */
  systemId: string;
}

export type RangeOnConfirm = (payload: RangeSelectionPayload) => void;
export type RangeOnClear = () => void;
export type RangeOnChange = (payload: RangeSelectionPayload) => void;

// ── Cell + derived view shapes ────────────────────────────────────────────

export interface RangeDayCellInfo<T = CalendarDateValue> {
  /** Date value in the active calendar system. */
  date: T;
  /** Native JS Date — convenient for downstream comparisons. */
  nativeDate: Date;
  /** Label to show inside the cell (e.g. "12"). */
  label: string;
  /** True if the cell falls within the currently displayed month. */
  isCurrentMonth: boolean;
  /** True if the cell represents today. */
  isToday: boolean;
  /** True if the cell is strictly between the two endpoints. */
  inRange: boolean;
  /** True if the cell is the start endpoint. */
  isRangeStart: boolean;
  /** True if the cell is the end endpoint. */
  isRangeEnd: boolean;
  /** True if the cell is disabled (min/max bound, list, or `disabled`). */
  isDisabled: boolean;
  /** Per-modifier flags. Empty `{}` when no modifiers are configured. */
  modifiers: Readonly<Record<string, boolean>>;
}

export interface RangeCalendarDays<T = CalendarDateValue> {
  weekdayLabels: readonly string[];
  cells: readonly RangeDayCellInfo<T>[];
  displayedMonthLabel: string;
  displayedYearLabel: string;
}

// ── Snapshot + options ─────────────────────────────────────────────────────

export interface RangeCalendarSnapshot<T = CalendarDateValue>
  extends BaseCalendarSnapshotShared<T> {
  /** Discriminant — always `'range'` for this store. */
  readonly mode: 'range';
  /** Range start endpoint. */
  rangeStart: T | undefined;
  /** Range end endpoint. `undefined` while only the start has been picked. */
  rangeEnd: T | undefined;
  /** Allow tapping the same day twice to pick a 1-day range. */
  allowSameDay: boolean;
  /** Inclusive minimum length, in days, of a confirmable range. */
  minRangeDays: number | undefined;
  /** Inclusive maximum length, in days, of a confirmable range. */
  maxRangeDays: number | undefined;
  days: RangeCalendarDays<T>;
}

export interface RangeCalendarStoreOptions<T = CalendarDateValue>
  extends BaseCalendarStoreOptions<T> {
  /** Initial range start. Read on the first `configure` call only. */
  initialStart?: unknown;
  /** Initial range end. Read on the first `configure` call only. */
  initialEnd?: unknown;

  /** Allow tapping the same day twice to pick a 1-day range. */
  allowSameDay?: boolean;
  /** Inclusive minimum confirmable range length, in days. */
  minRangeDays?: number;
  /** Inclusive maximum confirmable range length, in days. */
  maxRangeDays?: number;

  /** External callbacks. May change identity across configure calls
   *  without triggering a snapshot bump. */
  onConfirm?: RangeOnConfirm;
  onClear?: RangeOnClear;
  onChange?: RangeOnChange;
}

// ── Internal helpers ───────────────────────────────────────────────────────

function cellsAreEquivalent<T>(
  a: RangeDayCellInfo<T>,
  b: RangeDayCellInfo<T>
): boolean {
  return (
    a.label === b.label &&
    a.isCurrentMonth === b.isCurrentMonth &&
    a.isToday === b.isToday &&
    a.inRange === b.inRange &&
    a.isRangeStart === b.isRangeStart &&
    a.isRangeEnd === b.isRangeEnd &&
    a.isDisabled === b.isDisabled &&
    a.nativeDate.getTime() === b.nativeDate.getTime() &&
    shallowModifiersEqual(a.modifiers, b.modifiers)
  );
}

// ── The store ──────────────────────────────────────────────────────────────

export class RangeCalendarStore<T = CalendarDateValue> extends BaseCalendarStore<
  T,
  RangeCalendarSnapshot<T>
> {
  // External callbacks held as fields so action methods can remain
  // referentially stable for the lifetime of the store. Updated by
  // every `configure(...)` call without bumping the snapshot.
  private onConfirmCb: RangeOnConfirm | undefined;
  private onClearCb: RangeOnClear | undefined;
  private onChangeCb: RangeOnChange | undefined;

  private cellCache = new Map<number, RangeDayCellInfo<T>>();

  // Flips to `true` after the first `configure(...)` completes. Initial-
  // only options (`initialSystemId`, `initialStart`, `initialEnd`) are
  // read while this is `false`; later calls ignore them.
  private initialized = false;

  // -- construction ------------------------------------------------------

  /**
   * Run the first `configure(...)` synchronously so the snapshot is
   * populated by the time the constructor returns. This guarantees
   * that any consumer reading via `getSnapshot()` immediately after
   * construction (e.g. children rendering inside `<RangeDateProvider>`
   * before its commit-phase effect fires) observes a fully-built
   * snapshot.
   */
  constructor(opts: RangeCalendarStoreOptions<T>) {
    super();
    this.configure(opts);
  }

  // -- single entry point ------------------------------------------------

  /**
   * Apply provider props. Idempotent: a second call with reference-
   * equal slots emits zero notifications and produces zero snapshot
   * churn. Order of operations:
   *   1. Callback slots are written through (no commit).
   *   2. On the first call: bootstrap the snapshot from `opts`.
   *   3. On subsequent calls: reconcile system + shared + range-mode
   *      props inside a single `batch(...)` so any internal commits
   *      coalesce to one emit at the end.
   */
  configure(opts: RangeCalendarStoreOptions<T>): void {
    this.onConfirmCb = opts.onConfirm;
    this.onClearCb = opts.onClear;
    this.onChangeCb = opts.onChange;

    if (!this.initialized) {
      this.bootstrap(opts);
      this.initialized = true;
      return;
    }

    this.batch(() => {
      this.reconcileSystem(opts);
      this.reconcileSharedProps(opts);
    });
  }

  // -- first-call path ---------------------------------------------------

  private bootstrap(opts: RangeCalendarStoreOptions<T>): void {
    const { system, systemIndex } = resolveInitialSystem(opts);
    // Open on a month that contains state: prefer `initialStart`, then
    // `initialEnd`, else today.
    const seedDate = opts.initialStart ?? opts.initialEnd;
    const displayed = seedDate ? system.from(seedDate) : system.today();
    const shared = normalizeSharedInputs(opts, system);

    const body: Omit<RangeCalendarSnapshot<T>, 'days' | 'months' | 'years'> = {
      mode: 'range',
      system,
      systemIndex,
      displayed,
      view: 'day',
      rangeStart: opts.initialStart
        ? system.from(opts.initialStart)
        : undefined,
      rangeEnd: opts.initialEnd ? system.from(opts.initialEnd) : undefined,
      allowSameDay: opts.allowSameDay ?? false,
      minRangeDays: opts.minRangeDays,
      maxRangeDays: opts.maxRangeDays,
      ...shared,
    };
    this.initSnapshot({
      ...body,
      days: this.buildDays(body),
      months: this.buildMonths(body),
      years: this.buildYears(body),
    });
    this.seedSharedInputs(opts);
  }

  // -- subsequent-call paths --------------------------------------------

  private reconcileSystem(opts: RangeCalendarStoreOptions<T>): void {
    const s = this.snapshot;
    const currentId = s.system.id;
    const idx = opts.systems.findIndex((sys) => sys.id === currentId);

    if (idx === -1) {
      const next = opts.systems[0];
      /* istanbul ignore if — bootstrap rejects empty `systems`. */
      if (!next) {
        throw new Error(
          '[Calendar] At least one CalendarSystem must be provided.'
        );
      }
      this.commitSystemSwap(next, 0);
      return;
    }

    /* istanbul ignore next — `idx` is in-bounds by construction. */
    const nextSystem = opts.systems[idx]!;
    if (nextSystem !== s.system) {
      this.commitSystemSwap(nextSystem, idx);
    } else if (idx !== s.systemIndex) {
      this.commit({ ...s, systemIndex: idx });
    }
  }

  private commitSystemSwap(
    nextSystem: CalendarSystem<T>,
    nextSystemIndex: number
  ): void {
    const s = this.snapshot;
    const prevSystem = s.system;
    const carry = (v: T | undefined): T | undefined =>
      v ? nextSystem.fromNativeDate(prevSystem.toNativeDate(v)) : undefined;
    const next = this.carrySharedSystemFields(s, nextSystem, nextSystemIndex);
    this.commit({
      ...next,
      rangeStart: carry(s.rangeStart),
      rangeEnd: carry(s.rangeEnd),
    });
  }

  private reconcileSharedProps(opts: RangeCalendarStoreOptions<T>): void {
    let next = this.applySharedProps(this.snapshot, opts);
    if ((opts.allowSameDay ?? false) !== next.allowSameDay) {
      next = { ...next, allowSameDay: opts.allowSameDay ?? false };
    }
    if (opts.minRangeDays !== next.minRangeDays) {
      next = { ...next, minRangeDays: opts.minRangeDays };
    }
    if (opts.maxRangeDays !== next.maxRangeDays) {
      next = { ...next, maxRangeDays: opts.maxRangeDays };
    }
    if (next !== this.snapshot) this.commit(next);
  }

  // -- selection actions -------------------------------------------------

  selectDate = (input: unknown): void => {
    const s = this.snapshot;
    const system = s.system;
    const date = system.from(input);

    if (this.isDateDisabled(date)) return;

    const start = s.rangeStart;
    const end = s.rangeEnd;
    let nextStart = start;
    let nextEnd = end;

    if (!start && !end) {
      nextStart = date;
      nextEnd = undefined;
    } else if (start && !end) {
      if (system.isSame(start, date)) {
        nextStart = s.allowSameDay ? start : undefined;
        nextEnd = s.allowSameDay ? date : undefined;
      } else if (system.isBefore(date, start)) {
        nextStart = date;
        nextEnd = start;
      } else {
        nextStart = start;
        nextEnd = date;
      }
    } else if (!start && end) {
      if (system.isSame(end, date)) {
        nextStart = s.allowSameDay ? date : undefined;
        nextEnd = s.allowSameDay ? end : undefined;
      } else if (system.isBefore(date, end)) {
        nextStart = date;
        nextEnd = end;
      } else {
        nextStart = end;
        nextEnd = date;
      }
    } else {
      // Both endpoints present — start fresh.
      nextStart = date;
      nextEnd = undefined;
    }

    // Enforce min/max range-length only when the pick produced two
    // endpoints; partial ranges are always allowed so consumers can see
    // their selection grow.
    if (
      nextStart &&
      nextEnd &&
      !this.isRangeLengthAllowed(nextStart, nextEnd)
    ) {
      return;
    }

    this.commit({
      ...s,
      rangeStart: nextStart,
      rangeEnd: nextEnd,
      displayed: date,
    });
    this.notifyChange();
  };

  clear = (): void => {
    const s = this.snapshot;
    const hadSelection = !!s.rangeStart || !!s.rangeEnd;
    this.commit({ ...s, rangeStart: undefined, rangeEnd: undefined });
    this.onClearCb?.();
    if (hadSelection) this.notifyChange();
  };

  confirm = (): void => {
    if (!this.onConfirmCb) return;
    this.onConfirmCb(this.buildPayload());
  };

  isConfirmable = (): boolean => {
    const s = this.snapshot;
    return !!(s.rangeStart && s.rangeEnd);
  };

  // -- payload ------------------------------------------------------------

  private buildPayload(): RangeSelectionPayload {
    const s = this.snapshot;
    return {
      startDate: s.rangeStart
        ? s.system.toNativeDate(s.rangeStart)
        : undefined,
      endDate: s.rangeEnd ? s.system.toNativeDate(s.rangeEnd) : undefined,
      systemId: s.system.id,
    };
  }

  private notifyChange(): void {
    if (!this.onChangeCb) return;
    this.onChangeCb(this.buildPayload());
  }

  // -- day-grid derivation -----------------------------------------------

  protected daysInputsChanged(
    a: RangeCalendarSnapshot<T>,
    b: RangeCalendarSnapshot<T>
  ): boolean {
    return (
      a.system !== b.system ||
      a.displayed !== b.displayed ||
      a.firstDayOfWeek !== b.firstDayOfWeek ||
      a.modifiers !== b.modifiers ||
      a.rangeStart !== b.rangeStart ||
      a.rangeEnd !== b.rangeEnd ||
      a.minDate !== b.minDate ||
      a.maxDate !== b.maxDate ||
      a.disabledDates !== b.disabledDates ||
      a.disabledRanges !== b.disabledRanges ||
      a.disabled !== b.disabled
    );
  }

  protected buildDays(
    s: Omit<RangeCalendarSnapshot<T>, 'days' | 'months' | 'years'>
  ): RangeCalendarDays<T> {
    const { system, displayed, firstDayOfWeek, modifiers } = s;
    const grid = buildMonthGrid(system, displayed, firstDayOfWeek);
    const today = system.today();
    const modifierEntries = modifiers ? Object.entries(modifiers) : null;
    const cache = this.cellCache;
    const nextCache = new Map<number, RangeDayCellInfo<T>>();
    const cells = grid.map((c) => {
      const isStart = !!s.rangeStart && system.isSame(c.date, s.rangeStart);
      const isEnd = !!s.rangeEnd && system.isSame(c.date, s.rangeEnd);
      const inRange = isBetween(system, c.date, s.rangeStart, s.rangeEnd);
      const nativeDate = system.toNativeDate(c.date);
      let isDisabled =
        (!!s.minDate && system.isBefore(c.date, s.minDate)) ||
        (!!s.maxDate && system.isAfter(c.date, s.maxDate)) ||
        isExplicitlyDisabled(system, c.date, s.disabledDates, s.disabledRanges);
      if (!isDisabled && s.disabled) {
        try {
          if (s.disabled(nativeDate)) isDisabled = true;
        } catch {
          // Be permissive — never crash consumers for buggy predicates.
        }
      }
      const cellModifiers: Record<string, boolean> = {};
      if (modifierEntries) {
        for (const [name, matcher] of modifierEntries) {
          if (matchDate(system, c.date, matcher)) cellModifiers[name] = true;
        }
      }
      const computed: RangeDayCellInfo<T> = {
        date: c.date,
        nativeDate,
        label: system.formatDay(c.date),
        isCurrentMonth: c.isCurrentMonth,
        isToday: system.isSame(c.date, today),
        inRange: inRange && !isStart && !isEnd,
        isRangeStart: isStart,
        isRangeEnd: isEnd,
        isDisabled,
        modifiers: cellModifiers,
      };
      const key = nativeDate.getTime();
      const prev = cache.get(key);
      const reused =
        prev && cellsAreEquivalent(prev, computed) ? prev : computed;
      nextCache.set(key, reused);
      return reused;
    });
    this.cellCache = nextCache;
    const monthIndex = system.month(displayed);
    const monthLabel =
      system.monthLabels()[monthIndex] ?? String(monthIndex + 1);
    return {
      weekdayLabels: rotateWeekdayLabels(
        system.weekdayLabels(),
        firstDayOfWeek
      ),
      cells,
      displayedMonthLabel: monthLabel,
      displayedYearLabel: String(system.year(displayed)),
    };
  }

  // -- range-length validation -------------------------------------------

  private isRangeLengthAllowed(start: T, end: T): boolean {
    const { minRangeDays, maxRangeDays } = this.snapshot;
    if (minRangeDays === undefined && maxRangeDays === undefined) return true;
    const len = this.rangeLengthDays(start, end);
    if (minRangeDays !== undefined && len < minRangeDays) return false;
    if (maxRangeDays !== undefined && len > maxRangeDays) return false;
    return true;
  }

  private rangeLengthDays(start: T, end: T): number {
    const system = this.snapshot.system;
    const a = system.toNativeDate(start);
    const b = system.toNativeDate(end);
    // Normalise to midnight UTC to avoid DST off-by-one when
    // `toNativeDate` returns local-midnight Dates.
    const aUtc = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const bUtc = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    const ms = Math.abs(bUtc - aUtc);
    return Math.round(ms / 86_400_000) + 1;
  }
}
