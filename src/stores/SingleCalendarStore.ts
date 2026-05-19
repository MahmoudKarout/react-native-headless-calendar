/**
 * SingleCalendarStore — external store for single-date selection.
 *
 * Snapshot fields and methods that only apply to range / multiple mode
 * are absent (no `rangeStart`, `selectedDates`, `allowSameDay`,
 * `min/maxRangeDays`, `maxSelected`, `toggleDate`). Cell metadata is
 * narrowed to `SingleDayCellInfo` — no `inRange / isRangeStart /
 * isRangeEnd`. Selection callbacks receive `SingleSelectionPayload`
 * (a `date` plus the active `systemId`) so consumers get type-precise
 * payloads without runtime guards.
 *
 * Shared navigation, view derivation, bounds evaluation, and
 * `useSyncExternalStore` plumbing live on `BaseCalendarStore`. Only
 * selection state and its hooks remain here.
 */
import type {
  CalendarDateValue,
  CalendarModifiers,
  CalendarSystem,
  CalendarView,
  DateParts,
  Weekday,
} from '../types';
import {
  buildMonthGrid,
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

export interface SingleSelectionPayload {
  /**
   * Native JS Date for the selected day, at local-time midnight.
   * `undefined` after `clear()`. Beware: `toISOString()` and
   * `JSON.stringify()` print this in UTC, which can read as the
   * previous calendar day in negative-UTC-offset zones. Prefer
   * `parts` when timezone-free year/month/day values are needed.
   */
  date: Date | undefined;
  /**
   * Timezone-free, calendar-system-native components of the selected
   * day. Values are in the active system's namespace (e.g. Hijri
   * year/month/day when `systemId === 'hijri'`).
   */
  parts: DateParts | undefined;
  /** Identifier of the active calendar system at the time of selection. */
  systemId: string;
}

export type SingleOnConfirm = (payload: SingleSelectionPayload) => void;
export type SingleOnClear = () => void;
export type SingleOnChange = (payload: SingleSelectionPayload) => void;

// ── Cell + derived view shapes ────────────────────────────────────────────

export interface SingleDayCellInfo<T = CalendarDateValue> {
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
  /** True if the cell is the currently selected day. */
  isSelected: boolean;
  /** True if the cell is disabled (min/max bound, list, or `disabled`). */
  isDisabled: boolean;
  /** Per-modifier flags. Empty `{}` when no modifiers are configured. */
  modifiers: Readonly<Record<string, boolean>>;
}

export interface SingleCalendarDays<T = CalendarDateValue> {
  /** Weekday labels rotated to the active `firstDayOfWeek`. */
  weekdayLabels: readonly string[];
  /** Cells for the displayed month grid (length = ROWS * COLS = 42). */
  cells: readonly SingleDayCellInfo<T>[];
  /** Localised month name for the displayed month. */
  displayedMonthLabel: string;
  /** Year of the displayed month, as a string. */
  displayedYearLabel: string;
}

// ── Snapshot + options ─────────────────────────────────────────────────────

export interface SingleCalendarSnapshot<
  T = CalendarDateValue,
> extends BaseCalendarSnapshotShared<T> {
  /** Discriminant — always `'single'` for this store. */
  readonly mode: 'single';
  /** Currently selected day. `undefined` when nothing is selected. */
  selectedDate: T | undefined;
  /** Pre-derived day-grid view. Identity-stable across unrelated commits. */
  days: SingleCalendarDays<T>;
}

export interface SingleCalendarStoreOptions<
  T = CalendarDateValue,
> extends BaseCalendarStoreOptions<T> {
  /** Initial selection. Read on the first `configure` call only. */
  initialDate?: unknown;

  /** External callbacks. May change identity across configure calls
   *  without triggering a snapshot bump. */
  onConfirm?: SingleOnConfirm;
  onClear?: SingleOnClear;
  onChange?: SingleOnChange;
}

// ── Internal helpers ───────────────────────────────────────────────────────

function cellsAreEquivalent<T>(
  a: SingleDayCellInfo<T>,
  b: SingleDayCellInfo<T>
): boolean {
  return (
    a.label === b.label &&
    a.isCurrentMonth === b.isCurrentMonth &&
    a.isToday === b.isToday &&
    a.isSelected === b.isSelected &&
    a.isDisabled === b.isDisabled &&
    a.nativeDate.getTime() === b.nativeDate.getTime() &&
    shallowModifiersEqual(a.modifiers, b.modifiers)
  );
}

// ── The store ──────────────────────────────────────────────────────────────

export class SingleCalendarStore<
  T = CalendarDateValue,
> extends BaseCalendarStore<T, SingleCalendarSnapshot<T>> {
  // External callbacks held as fields so action methods can remain
  // referentially stable for the lifetime of the store. Updated by
  // every `configure(...)` call without bumping the snapshot.
  private onConfirmCb: SingleOnConfirm | undefined;
  private onClearCb: SingleOnClear | undefined;
  private onChangeCb: SingleOnChange | undefined;

  // Per-store cell-identity cache. Lets `days.cells[i]` keep the same
  // reference across commits when its observable state is unchanged.
  private cellCache = new Map<number, SingleDayCellInfo<T>>();

  // Flips to `true` after the first `configure(...)` completes. Initial-
  // only options (`initialDate`) are read while this is `false`; later
  // calls ignore them.
  private initialized = false;

  // -- construction ------------------------------------------------------

  /**
   * Run the first `configure(...)` synchronously so the snapshot is
   * populated by the time the constructor returns. This guarantees
   * that any consumer reading via `getSnapshot()` immediately after
   * construction (e.g. children rendering inside `<SingleDateProvider>`
   * before its commit-phase effect fires) observes a fully-built
   * snapshot.
   */
  constructor(opts: SingleCalendarStoreOptions<T>) {
    super();
    this.configure(opts);
  }

  // -- single entry point ------------------------------------------------

  /**
   * Apply provider props. Idempotent: a second call with reference-
   * equal slots emits zero notifications and produces zero snapshot
   * churn. The provider is expected to call this from one
   * `useLayoutEffect` per render and to memoise object/array/predicate
   * inputs so identity comparison can fire (consumers compose with
   * `useStableArray` / `useStableRecord` / `useStableCallback`).
   *
   * Order of operations:
   *   1. Callback slots are written through (no commit).
   *   2. On the first call: bootstrap the snapshot from `opts`.
   *   3. On subsequent calls: reconcile system + shared props inside a
   *      single `batch(...)` so any internal commits coalesce to one
   *      emit at the end.
   */
  configure(opts: SingleCalendarStoreOptions<T>): void {
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

  private bootstrap(opts: SingleCalendarStoreOptions<T>): void {
    this.systems = opts.systems;
    const { system, systemIndex } = resolveInitialSystem(opts);
    const displayed = opts.initialDate
      ? system.from(opts.initialDate)
      : system.today();
    const shared = normalizeSharedInputs(opts, system);

    const body: Omit<SingleCalendarSnapshot<T>, 'days' | 'months' | 'years'> = {
      mode: 'single',
      system,
      systemIndex,
      displayed,
      view: 'day',
      selectedDate: opts.initialDate
        ? system.from(opts.initialDate)
        : undefined,
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

  private reconcileSystem(opts: SingleCalendarStoreOptions<T>): void {
    this.systems = opts.systems;
    const s = this.snapshot;

    // Prefer the controlled `activeSystemId` when provided. Unknown ids
    // are warned + ignored by `setActiveSystem`, falling through to the
    // tracking logic below so a stale prop value doesn't strand the
    // store on a system that's no longer in `opts.systems`.
    if (opts.activeSystemId && opts.activeSystemId === s.system.id) {
      // Already in sync — still verify index parity below.
    } else if (opts.activeSystemId) {
      this.setActiveSystem(opts.activeSystemId);
    }

    // Re-resolve the active system inside the new `systems` array. The
    // `setActiveSystem` call above may have swapped, or the prop may be
    // omitted — either way, we keep tracking the current id.
    const currentId = this.snapshot.system.id;
    const idx = opts.systems.findIndex((sys) => sys.id === currentId);

    if (idx === -1) {
      // Active system is no longer in `systems` — fall back to index 0.
      const next = opts.systems[0];
      /* istanbul ignore if — bootstrap rejects empty `systems`. */
      if (!next) {
        throw new Error(
          '[Calendar] At least one CalendarSystem must be provided.'
        );
      }
      this.replaceSystem(next, 0);
      return;
    }

    /* istanbul ignore next — `idx` is in-bounds by construction. */
    const nextSystem = opts.systems[idx]!;
    if (nextSystem !== this.snapshot.system) {
      this.replaceSystem(nextSystem, idx);
    } else if (idx !== this.snapshot.systemIndex) {
      // Same system identity, just re-ordered within `systems`.
      this.commit({ ...this.snapshot, systemIndex: idx });
    }
  }

  protected replaceSystem(
    nextSystem: CalendarSystem<T>,
    nextSystemIndex: number
  ): void {
    const s = this.snapshot;
    if (s.system === nextSystem && s.systemIndex === nextSystemIndex) return;
    const prevSystem = s.system;
    const next = this.carrySharedSystemFields(s, nextSystem, nextSystemIndex);
    this.commit({
      ...next,
      selectedDate: s.selectedDate
        ? nextSystem.fromNativeDate(prevSystem.toNativeDate(s.selectedDate))
        : undefined,
    });
  }

  private reconcileSharedProps(opts: SingleCalendarStoreOptions<T>): void {
    const next = this.applySharedProps(this.snapshot, opts);
    if (next !== this.snapshot) this.commit(next);
  }

  // -- selection actions -------------------------------------------------

  selectDate = (input: unknown): void => {
    const s = this.snapshot;
    const date = s.system.from(input);
    if (this.isDateDisabled(date)) return;
    this.commit({
      ...s,
      selectedDate: date,
      displayed: date,
    });
    this.notifyChange();
  };

  clear = (): void => {
    const s = this.snapshot;
    const hadSelection = !!s.selectedDate;
    this.commit({ ...s, selectedDate: undefined });
    this.onClearCb?.();
    if (hadSelection) this.notifyChange();
  };

  confirm = (): void => {
    if (!this.onConfirmCb) return;
    this.onConfirmCb(this.buildPayload());
  };

  isConfirmable = (): boolean => !!this.snapshot.selectedDate;

  // -- payload ------------------------------------------------------------

  private buildPayload(): SingleSelectionPayload {
    const s = this.snapshot;
    const sel = s.selectedDate;
    return {
      date: sel ? s.system.toNativeDate(sel) : undefined,
      parts: sel
        ? {
            year: s.system.year(sel),
            month: s.system.month(sel),
            day: s.system.day(sel),
          }
        : undefined,
      systemId: s.system.id,
    };
  }

  private notifyChange(): void {
    if (!this.onChangeCb) return;
    this.onChangeCb(this.buildPayload());
  }

  // -- day-grid derivation -----------------------------------------------

  protected daysInputsChanged(
    a: SingleCalendarSnapshot<T>,
    b: SingleCalendarSnapshot<T>
  ): boolean {
    return (
      a.system !== b.system ||
      a.displayed !== b.displayed ||
      a.firstDayOfWeek !== b.firstDayOfWeek ||
      a.modifiers !== b.modifiers ||
      a.selectedDate !== b.selectedDate ||
      a.minDate !== b.minDate ||
      a.maxDate !== b.maxDate ||
      a.disabledDates !== b.disabledDates ||
      a.disabledRanges !== b.disabledRanges ||
      a.disabled !== b.disabled
    );
  }

  protected buildDays(
    s: Omit<SingleCalendarSnapshot<T>, 'days' | 'months' | 'years'>
  ): SingleCalendarDays<T> {
    const { system, displayed, firstDayOfWeek, modifiers } = s;
    const grid = buildMonthGrid(system, displayed, firstDayOfWeek);
    const today = system.today();
    const modifierEntries = modifiers ? Object.entries(modifiers) : null;
    const cache = this.cellCache;
    const nextCache = new Map<number, SingleDayCellInfo<T>>();
    const cells = grid.map((c) => {
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
      const computed: SingleDayCellInfo<T> = {
        date: c.date,
        nativeDate,
        label: system.formatDay(c.date),
        isCurrentMonth: c.isCurrentMonth,
        isToday: system.isSame(c.date, today),
        isSelected: !!s.selectedDate && system.isSame(c.date, s.selectedDate),
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
}

// Re-export shared types that consumers might compose against the
// store directly (e.g. when building custom selectors).
export type { CalendarView, Weekday, CalendarModifiers, CalendarSystem };
