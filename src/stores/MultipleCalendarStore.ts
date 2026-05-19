/**
 * MultipleCalendarStore — external store for multi-day selection.
 *
 * Snapshot fields and methods that only apply to single / range mode
 * are absent (no `selectedDate`, `rangeStart`, `rangeEnd`,
 * `allowSameDay`, `min/maxRangeDays`). Cell metadata uses
 * `MultipleDayCellInfo` — range fields are absent; `isSelected`
 * reflects membership in `selectedDates`. Selection callbacks receive
 * `MultipleSelectionPayload` (`dates: Date[]` + `systemId`).
 *
 * Selection semantics:
 *   - `selectDate(d)` toggles membership (set-like, ordered by tap).
 *   - `maxSelected` caps the set; further additions are silently
 *     ignored. Consumers wanting LRU eviction can subscribe to
 *     `onChange` and dispatch their own clear-then-select sequence.
 *   - `toggleDate(d)` is an alias surfaced for intent clarity.
 *
 * Shared navigation, view derivation, bounds evaluation, and
 * `useSyncExternalStore` plumbing live on `BaseCalendarStore`.
 */
import type { CalendarDateValue, CalendarSystem } from '../types';
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

export interface MultipleSelectionPayload {
  /** Native JS Dates for every selected day. Empty array when none. */
  dates: readonly Date[];
  /** Identifier of the active calendar system at the time of selection. */
  systemId: string;
}

export type MultipleOnConfirm = (payload: MultipleSelectionPayload) => void;
export type MultipleOnClear = () => void;
export type MultipleOnChange = (payload: MultipleSelectionPayload) => void;

// ── Cell + derived view shapes ────────────────────────────────────────────

export interface MultipleDayCellInfo<T = CalendarDateValue> {
  date: T;
  nativeDate: Date;
  label: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  /** True if the cell is a member of the current selection. */
  isSelected: boolean;
  isDisabled: boolean;
  modifiers: Readonly<Record<string, boolean>>;
}

export interface MultipleCalendarDays<T = CalendarDateValue> {
  weekdayLabels: readonly string[];
  cells: readonly MultipleDayCellInfo<T>[];
  displayedMonthLabel: string;
  displayedYearLabel: string;
}

// ── Snapshot + options ─────────────────────────────────────────────────────

export interface MultipleCalendarSnapshot<T = CalendarDateValue>
  extends BaseCalendarSnapshotShared<T> {
  /** Discriminant — always `'multiple'` for this store. */
  readonly mode: 'multiple';
  /** Selection set, ordered by tap. Append-only with `maxSelected` cap. */
  selectedDates: readonly T[];
  /** Inclusive cap on the number of dates that can be selected. */
  maxSelected: number | undefined;
  days: MultipleCalendarDays<T>;
}

export interface MultipleCalendarStoreOptions<T = CalendarDateValue>
  extends BaseCalendarStoreOptions<T> {
  /** Initial selection set. Read on the first `configure` call only. */
  initialDates?: readonly unknown[];

  /** Inclusive cap on the number of dates that can be selected. */
  maxSelected?: number;

  /** External callbacks. May change identity across configure calls
   *  without triggering a snapshot bump. */
  onConfirm?: MultipleOnConfirm;
  onClear?: MultipleOnClear;
  onChange?: MultipleOnChange;
}

// ── Internal helpers ───────────────────────────────────────────────────────

function cellsAreEquivalent<T>(
  a: MultipleDayCellInfo<T>,
  b: MultipleDayCellInfo<T>
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

export class MultipleCalendarStore<
  T = CalendarDateValue,
> extends BaseCalendarStore<T, MultipleCalendarSnapshot<T>> {
  // External callbacks held as fields so action methods can remain
  // referentially stable for the lifetime of the store. Updated by
  // every `configure(...)` call without bumping the snapshot.
  private onConfirmCb: MultipleOnConfirm | undefined;
  private onClearCb: MultipleOnClear | undefined;
  private onChangeCb: MultipleOnChange | undefined;

  private cellCache = new Map<number, MultipleDayCellInfo<T>>();

  // Flips to `true` after the first `configure(...)` completes. Initial-
  // only options (`initialSystemId`, `initialDates`) are read while
  // this is `false`; later calls ignore them.
  private initialized = false;

  // -- construction ------------------------------------------------------

  /**
   * Run the first `configure(...)` synchronously so the snapshot is
   * populated by the time the constructor returns. This guarantees
   * that any consumer reading via `getSnapshot()` immediately after
   * construction (e.g. children rendering inside
   * `<MultipleDateProvider>` before its commit-phase effect fires)
   * observes a fully-built snapshot.
   */
  constructor(opts: MultipleCalendarStoreOptions<T>) {
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
   *   3. On subsequent calls: reconcile system + shared + multiple-mode
   *      props inside a single `batch(...)` so any internal commits
   *      coalesce to one emit at the end.
   */
  configure(opts: MultipleCalendarStoreOptions<T>): void {
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

  private bootstrap(opts: MultipleCalendarStoreOptions<T>): void {
    const { system, systemIndex } = resolveInitialSystem(opts);
    const seedDate = opts.initialDates?.[0];
    const displayed = seedDate ? system.from(seedDate) : system.today();
    const shared = normalizeSharedInputs(opts, system);

    const initialDates = opts.initialDates?.length
      ? opts.initialDates.map((d) => system.from(d))
      : [];

    const body: Omit<
      MultipleCalendarSnapshot<T>,
      'days' | 'months' | 'years'
    > = {
      mode: 'multiple',
      system,
      systemIndex,
      displayed,
      view: 'day',
      selectedDates: initialDates,
      maxSelected: opts.maxSelected,
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

  private reconcileSystem(opts: MultipleCalendarStoreOptions<T>): void {
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
    const next = this.carrySharedSystemFields(s, nextSystem, nextSystemIndex);
    this.commit({
      ...next,
      selectedDates: s.selectedDates.map((d) =>
        nextSystem.fromNativeDate(prevSystem.toNativeDate(d))
      ),
    });
  }

  private reconcileSharedProps(opts: MultipleCalendarStoreOptions<T>): void {
    let next = this.applySharedProps(this.snapshot, opts);
    if (opts.maxSelected !== next.maxSelected) {
      next = { ...next, maxSelected: opts.maxSelected };
    }
    if (next !== this.snapshot) this.commit(next);
  }

  // -- selection actions -------------------------------------------------

  selectDate = (input: unknown): void => {
    const s = this.snapshot;
    const system = s.system;
    const date = system.from(input);

    if (this.isDateDisabled(date)) return;

    const idx = s.selectedDates.findIndex((d) => system.isSame(d, date));
    let nextDates: readonly T[];
    if (idx >= 0) {
      nextDates = [
        ...s.selectedDates.slice(0, idx),
        ...s.selectedDates.slice(idx + 1),
      ];
    } else {
      if (
        s.maxSelected !== undefined &&
        s.selectedDates.length >= s.maxSelected
      ) {
        // At cap — silently ignore the new pick. Consumers wanting LRU
        // eviction can subscribe to `onChange` and dispatch their own
        // clear-then-select sequence.
        return;
      }
      nextDates = [...s.selectedDates, date];
    }
    this.commit({
      ...s,
      selectedDates: nextDates,
      displayed: date,
    });
    this.notifyChange();
  };

  /** Alias for `selectDate` — surfaced for intent clarity. */
  toggleDate = (date: T): void => {
    this.selectDate(date);
  };

  clear = (): void => {
    const s = this.snapshot;
    const hadSelection = s.selectedDates.length > 0;
    this.commit({ ...s, selectedDates: [] });
    this.onClearCb?.();
    if (hadSelection) this.notifyChange();
  };

  confirm = (): void => {
    if (!this.onConfirmCb) return;
    this.onConfirmCb(this.buildPayload());
  };

  isConfirmable = (): boolean => this.snapshot.selectedDates.length > 0;

  // -- payload ------------------------------------------------------------

  private buildPayload(): MultipleSelectionPayload {
    const s = this.snapshot;
    return {
      dates: s.selectedDates.map((d) => s.system.toNativeDate(d)),
      systemId: s.system.id,
    };
  }

  private notifyChange(): void {
    if (!this.onChangeCb) return;
    this.onChangeCb(this.buildPayload());
  }

  // -- day-grid derivation -----------------------------------------------

  protected daysInputsChanged(
    a: MultipleCalendarSnapshot<T>,
    b: MultipleCalendarSnapshot<T>
  ): boolean {
    return (
      a.system !== b.system ||
      a.displayed !== b.displayed ||
      a.firstDayOfWeek !== b.firstDayOfWeek ||
      a.modifiers !== b.modifiers ||
      a.selectedDates !== b.selectedDates ||
      a.minDate !== b.minDate ||
      a.maxDate !== b.maxDate ||
      a.disabledDates !== b.disabledDates ||
      a.disabledRanges !== b.disabledRanges ||
      a.disabled !== b.disabled
    );
  }

  protected buildDays(
    s: Omit<MultipleCalendarSnapshot<T>, 'days' | 'months' | 'years'>
  ): MultipleCalendarDays<T> {
    const { system, displayed, firstDayOfWeek, modifiers } = s;
    const grid = buildMonthGrid(system, displayed, firstDayOfWeek);
    const today = system.today();
    const modifierEntries = modifiers ? Object.entries(modifiers) : null;
    const cache = this.cellCache;
    const nextCache = new Map<number, MultipleDayCellInfo<T>>();
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
      const computed: MultipleDayCellInfo<T> = {
        date: c.date,
        nativeDate,
        label: system.formatDay(c.date),
        isCurrentMonth: c.isCurrentMonth,
        isToday: system.isSame(c.date, today),
        isSelected: s.selectedDates.some((d) => system.isSame(d, c.date)),
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
