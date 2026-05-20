/**
 * BaseCalendarStore — shared infrastructure for the per-mode stores.
 *
 * Hosts the bits that every selection mode needs identically:
 *   - useSyncExternalStore plumbing (subscribe / getSnapshot / emit).
 *   - Commit + batch with stable view-derivation reuse.
 *   - Calendar navigation (changeMonth / nextMonth / goToYear / …).
 *   - Month- and year-grid derivation (mode-agnostic).
 *   - Bounds + dynamic-disabled evaluation.
 *   - System resolution and shared input normalisation helpers used by
 *     subclass constructors.
 *
 * What stays in subclasses:
 *   - Selection-mode state and the day-grid cell shape.
 *   - selectDate / clear / confirm / isConfirmable / buildPayload.
 *   - Mode-specific prop syncing + system carry-over.
 *
 * Generic parameters:
 *   - `T` is the per-system date value (the active CalendarSystem<T>).
 *   - `S` is the concrete subclass snapshot. It must extend the shared
 *     base shape and contribute its own `days` view.
 */
import type {
  CalendarDateValue,
  CalendarModifiers,
  CalendarSystem,
  CalendarView,
  Weekday,
  CalendarMonths,
  CalendarYears,
} from '../types';
import {
  buildMonthGrid,
  DEFAULT_FIRST_DAY_OF_WEEK,
  getYearPage,
  matchDate,
  rotateWeekdayLabels,
  YEAR_PAGE_SIZE,
  type GridCell,
} from '../utils/grid';
import { cellsAreEquivalent } from './cellUtils';
import type { BaseDayCellFields, CalendarDaysView } from './storeTypes';

// ── Shared shapes ─────────────────────────────────────────────────────────

/** Snapshot fields every mode-specific snapshot must include. */
export interface BaseCalendarSnapshotShared<T = CalendarDateValue> {
  system: CalendarSystem<T>;
  systemIndex: number;
  displayed: T;
  view: CalendarView;
  minDate: T | undefined;
  maxDate: T | undefined;
  disabledDates: readonly T[] | undefined;
  disabledRanges: readonly { start: T; end: T }[] | undefined;
  disabled: ((nativeDate: Date) => boolean) | undefined;
  firstDayOfWeek: Weekday;
  modifiers: CalendarModifiers | undefined;
  months: CalendarMonths;
  years: CalendarYears;
}

/** Constructor options every mode-specific options interface must include. */
export interface BaseCalendarStoreOptions<T = CalendarDateValue> {
  systems: readonly CalendarSystem<T>[];
  /**
   * Live id of the active calendar system. Controlled: the store keeps
   * `snapshot.system.id` in sync with this value across every
   * `configure(...)` call. Unknown ids are ignored with a dev warning.
   * Omit to start on `systems[0]` and switch later via
   * `setActiveSystem(...)`.
   */
  activeSystemId?: string;
  minDate?: unknown;
  maxDate?: unknown;
  disabledDates?: readonly unknown[];
  disabledRanges?: readonly { start: unknown; end: unknown }[];
  disabled?: (nativeDate: Date) => boolean;
  firstDayOfWeek?: Weekday;
  modifiers?: CalendarModifiers;
}

/** Shared shape returned by `normalizeSharedInputs`. */
export interface NormalizedSharedInputs<T> {
  minDate: T | undefined;
  maxDate: T | undefined;
  disabledDates: readonly T[] | undefined;
  disabledRanges: readonly { start: T; end: T }[] | undefined;
  disabled: ((nativeDate: Date) => boolean) | undefined;
  firstDayOfWeek: Weekday;
  modifiers: CalendarModifiers | undefined;
}

// ── Helpers ───────────────────────────────────────────────────────────────

export type Listener = () => void;

/**
 * Two records of `Record<string, boolean>` are shallowly equal iff they
 * have the same keys with the same boolean values. The cell builder
 * only ever sets `true` for matched modifiers and omits unmatched ones,
 * so a value-mismatch is unreachable through the public API — kept as
 * a defensive check.
 */
export function shallowModifiersEqual(
  a: Record<string, boolean>,
  b: Record<string, boolean>
): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  /* istanbul ignore next */
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
}

// ── The base class ────────────────────────────────────────────────────────

type SnapshotBody<S> = Omit<S, 'days' | 'months' | 'years'>;

export abstract class BaseCalendarStore<
  T,
  S extends BaseCalendarSnapshotShared<T> & { days: unknown },
> {
  // `snapshot` is assigned by the subclass constructor via `initSnapshot`.
  protected snapshot!: S;
  /**
   * Live `systems` array last applied via `configure(...)`. Cached so
   * `setActiveSystem(id)` can resolve an id to a system without going
   * through the snapshot (which only carries the active system, not the
   * full list). Subclass `configure` is responsible for keeping this in
   * sync on every call.
   */
  protected systems!: readonly CalendarSystem<T>[];
  private listeners = new Set<Listener>();
  protected batchDepth = 0;
  protected pendingEmit = false;

  /**
   * Identity of the raw inputs last applied via `applySharedProps`.
   * Lets reconciliation skip the per-element `system.from(...)` mapping
   * (and the resulting snapshot churn) when consumers pass the same
   * memoised array/record across renders. Comparison is identity-only —
   * consumers must memoise these props for the optimisation to fire.
   */
  protected lastSharedInputs: {
    disabledDates?: readonly unknown[];
    disabledRanges?: readonly { start: unknown; end: unknown }[];
    modifiers?: CalendarModifiers;
  } = {};

  // -- useSyncExternalStore API ------------------------------------------

  getSnapshot = (): S => this.snapshot;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  // -- subclass init -----------------------------------------------------

  /**
   * Set the initial snapshot. Subclass constructors call this exactly
   * once after building the full snapshot (selection state + derived
   * views). Separate from `commit` because there's no `prev` snapshot
   * to compare against on first commit and no listeners yet.
   */
  protected initSnapshot(snapshot: S): void {
    this.snapshot = snapshot;
  }

  // -- batching + commit -------------------------------------------------

  private emit(): void {
    for (const l of this.listeners) l();
  }

  /**
   * Persist `next` as the new snapshot, re-deriving views only when
   * their inputs reference-changed since the previous commit. Notifies
   * subscribers unless inside a `batch(...)` block.
   */
  protected commit(next: S): void {
    /* istanbul ignore next — every external commit creates a fresh object. */
    if (next === this.snapshot) return;
    const prev = this.snapshot;
    const days = this.daysInputsChanged(prev, next)
      ? this.buildDays(next)
      : prev.days;
    const months = this.monthsInputsChanged(prev, next)
      ? this.buildMonths(next)
      : prev.months;
    const years = this.yearsInputsChanged(prev, next)
      ? this.buildYears(next)
      : prev.years;
    this.snapshot = { ...next, days, months, years } as S;
    if (this.batchDepth > 0) {
      this.pendingEmit = true;
    } else {
      this.emit();
    }
  }

  /**
   * Run `fn`, coalescing any commits inside it into a single emit at
   * the end. Used by actions that perform multiple commits (e.g.
   * `goToYear` switches view + displayed in one go).
   */
  protected batch(fn: () => void): void {
    this.batchDepth += 1;
    try {
      fn();
    } finally {
      this.batchDepth -= 1;
      /* istanbul ignore else */
      if (this.batchDepth === 0 && this.pendingEmit) {
        this.pendingEmit = false;
        this.emit();
      }
    }
  }

  // -- shared navigation actions -----------------------------------------

  setView = (view: CalendarView): void => {
    if (view === this.snapshot.view) return;
    this.commit({ ...this.snapshot, view });
  };

  /** Step the displayed month forward (positive) or backward (negative). */
  changeMonth = (step: number): void => {
    const s = this.snapshot;
    this.commit({
      ...s,
      displayed: s.system.addMonths(s.displayed, step),
    });
  };

  prevMonth = (): void => this.changeMonth(-1);
  nextMonth = (): void => this.changeMonth(1);

  /** Step the displayed year forward (positive) or backward (negative). */
  changeYear = (step: number): void => {
    const s = this.snapshot;
    this.commit({
      ...s,
      displayed: s.system.addYears(s.displayed, step),
    });
  };

  goToYear = (year: number): void => {
    this.batch(() => {
      const s = this.snapshot;
      this.commit({
        ...s,
        displayed: s.system.withYear(s.displayed, year),
        view: 'day',
      });
    });
  };

  goToMonth = (month: number): void => {
    this.batch(() => {
      const s = this.snapshot;
      this.commit({
        ...s,
        displayed: s.system.withMonth(s.displayed, month),
        view: 'day',
      });
    });
  };

  setDisplayedDate = (input: unknown): void => {
    const s = this.snapshot;
    const next = s.system.from(input);
    if (s.system.isSame(next, s.displayed)) return;
    this.commit({ ...s, displayed: next });
  };

  prevYearPage = (): void => {
    this.changeYear(-YEAR_PAGE_SIZE);
  };

  nextYearPage = (): void => {
    this.changeYear(YEAR_PAGE_SIZE);
  };

  // -- shared view derivation --------------------------------------------

  /** Subclass hook — must return the day-grid view for `s`. */
  protected abstract buildDays(s: SnapshotBody<S>): S['days'];

  /**
   * Subclass hook — true iff the inputs that affect the day grid have
   * reference-changed between `a` and `b`. The subclass is responsible
   * for including its own selection state in this check.
   */
  protected abstract daysInputsChanged(a: S, b: S): boolean;

  protected monthsInputsChanged(a: S, b: S): boolean {
    if (a.system !== b.system) return true;
    return a.system.month(a.displayed) !== b.system.month(b.displayed);
  }

  protected yearsInputsChanged(a: S, b: S): boolean {
    if (a.system !== b.system) return true;
    return a.system.year(a.displayed) !== b.system.year(b.displayed);
  }

  protected buildMonths(s: SnapshotBody<S>): CalendarMonths {
    const labels = s.system.monthLabels();
    return {
      months: labels.map((label, index) => ({ index, label })),
      activeMonth: s.system.month(s.displayed),
    };
  }

  protected buildYears(s: SnapshotBody<S>): CalendarYears {
    const activeYear = s.system.year(s.displayed);
    return { years: getYearPage(activeYear), activeYear };
  }

  // -- shared validators -------------------------------------------------

  /**
   * Single source of truth for whether a date is disabled. Composed
   * from min/max bounds, the explicit lists, and the optional
   * `disabled` predicate (which receives the native JS Date).
   */
  protected isDateDisabled(
    date: T,
    snapshot: SnapshotBody<S> = this.snapshot
  ): boolean {
    const s = snapshot;
    const system = s.system;
    if (s.minDate && system.isBefore(date, s.minDate)) return true;
    if (s.maxDate && system.isAfter(date, s.maxDate)) return true;
    if (s.disabledDates?.some((d) => system.isSame(d, date))) return true;
    if (
      s.disabledRanges?.some(
        (r) => !system.isBefore(date, r.start) && !system.isAfter(date, r.end)
      )
    ) {
      return true;
    }
    if (s.disabled) {
      try {
        if (s.disabled(system.toNativeDate(date))) return true;
      } catch {
        // Be permissive — a buggy predicate must not crash the calendar.
        // The fallback is "not disabled" rather than "always disabled"
        // so a thrown predicate doesn't lock out every date.
      }
    }
    return false;
  }

  // -- shared syncProps logic --------------------------------------------

  /**
   * Apply the shared subset of `opts` to `s`, returning a new snapshot
   * with reference-different fields where the input changed.
   * Subclass `syncProps` calls this then layers its mode-specific
   * updates on top before committing.
   */
  protected applySharedProps(s: S, opts: BaseCalendarStoreOptions<T>): S {
    let next = s;
    if (opts.disabled !== s.disabled) {
      next = { ...next, disabled: opts.disabled };
    }
    const { system } = s;
    const newMin = opts.minDate ? system.from(opts.minDate) : undefined;
    const newMax = opts.maxDate ? system.from(opts.maxDate) : undefined;
    if (
      (newMin && (!s.minDate || !system.isSame(newMin, s.minDate))) ||
      (!newMin && s.minDate)
    ) {
      next = { ...next, minDate: newMin };
    }
    if (
      (newMax && (!s.maxDate || !system.isSame(newMax, s.maxDate))) ||
      (!newMax && s.maxDate)
    ) {
      next = { ...next, maxDate: newMax };
    }
    // Disable lists: identity-gate against the raw input we last saw
    // so memoised arrays don't trigger a rebuild + day-grid recompute.
    if (opts.disabledDates !== this.lastSharedInputs.disabledDates) {
      const newDisabledDates = opts.disabledDates?.map((d) => system.from(d));
      next = { ...next, disabledDates: newDisabledDates };
      this.lastSharedInputs.disabledDates = opts.disabledDates;
    }
    if (opts.disabledRanges !== this.lastSharedInputs.disabledRanges) {
      const newDisabledRanges = opts.disabledRanges?.map((r) => ({
        start: system.from(r.start),
        end: system.from(r.end),
      }));
      next = { ...next, disabledRanges: newDisabledRanges };
      this.lastSharedInputs.disabledRanges = opts.disabledRanges;
    }
    const nextFirstDay = opts.firstDayOfWeek ?? DEFAULT_FIRST_DAY_OF_WEEK;
    if (nextFirstDay !== s.firstDayOfWeek) {
      next = { ...next, firstDayOfWeek: nextFirstDay };
    }
    if (opts.modifiers !== s.modifiers) {
      next = { ...next, modifiers: opts.modifiers };
      this.lastSharedInputs.modifiers = opts.modifiers;
    }
    return next;
  }

  /**
   * Seed `lastSharedInputs` with the raw inputs used during initial
   * snapshot construction. Subclass bootstrap paths call this once
   * after `initSnapshot` so the first `applySharedProps` reconciliation
   * can correctly detect "no change" against memoised inputs.
   */
  protected seedSharedInputs(opts: BaseCalendarStoreOptions<T>): void {
    this.lastSharedInputs = {
      disabledDates: opts.disabledDates,
      disabledRanges: opts.disabledRanges,
      modifiers: opts.modifiers,
    };
  }

  // -- system replacement helpers ----------------------------------------

  /**
   * Switch the active calendar system by id. No-op when the id already
   * matches the current system, or when the id is not present in the
   * cached `systems` list (dev warning, lookup-only). Selection,
   * displayed month, and bounds are carried across by absolute instant
   * — day-of-month may change between calendars (e.g. Hijri → Gregorian
   * for the same point in time).
   */
  setActiveSystem = (id: string): void => {
    const s = this.snapshot;
    if (s.system.id === id) return;
    const idx = this.systems.findIndex((sys) => sys.id === id);
    if (idx === -1) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[Calendar] setActiveSystem: unknown system id "${id}". ` +
            `Known ids: ${this.systems.map((sys) => sys.id).join(', ')}`
        );
      }
      return;
    }
    /* istanbul ignore next — `idx` is in-bounds by construction. */
    const nextSystem = this.systems[idx]!;
    this.replaceSystem(nextSystem, idx);
  };

  /**
   * Subclass hook — commit a system swap, layering mode-specific
   * selection carry-over on top of `carrySharedSystemFields`. Called by
   * `setActiveSystem` and by `configure(...)` reconciliation.
   */
  protected abstract replaceSystem(
    nextSystem: CalendarSystem<T>,
    nextSystemIndex: number
  ): void;

  /**
   * Apply the shared subset of a system swap to `s`. Returns a new
   * snapshot with `displayed`, `minDate`, `maxDate`, and the disable
   * lists round-tripped through native Date. Subclass `replaceSystem`
   * then layers its mode-specific selection carry-over on top.
   */
  protected carrySharedSystemFields(
    s: S,
    nextSystem: CalendarSystem<T>,
    nextSystemIndex: number
  ): S {
    const prevSystem = s.system;
    const carry = (v: T | undefined): T | undefined =>
      v ? nextSystem.fromNativeDate(prevSystem.toNativeDate(v)) : undefined;
    return {
      ...s,
      system: nextSystem,
      systemIndex: nextSystemIndex,
      displayed: nextSystem.fromNativeDate(
        prevSystem.toNativeDate(s.displayed)
      ),
      minDate: carry(s.minDate),
      maxDate: carry(s.maxDate),
      disabledDates: s.disabledDates?.map((d) =>
        nextSystem.fromNativeDate(prevSystem.toNativeDate(d))
      ),
      disabledRanges: s.disabledRanges?.map((r) => ({
        start: nextSystem.fromNativeDate(prevSystem.toNativeDate(r.start)),
        end: nextSystem.fromNativeDate(prevSystem.toNativeDate(r.end)),
      })),
    };
  }

  /**
   * Keep the active system in sync with `opts.systems` and the controlled
   * `activeSystemId`. Subclass `configure` calls this inside `batch(...)`.
   */
  protected reconcileSystem(opts: BaseCalendarStoreOptions<T>): void {
    this.systems = opts.systems;
    const s = this.snapshot;

    if (opts.activeSystemId && opts.activeSystemId === s.system.id) {
      // Already in sync — still verify index parity below.
    } else if (opts.activeSystemId) {
      this.setActiveSystem(opts.activeSystemId);
    }

    const currentId = this.snapshot.system.id;
    const idx = opts.systems.findIndex((sys) => sys.id === currentId);

    if (idx === -1) {
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
      this.commit({ ...this.snapshot, systemIndex: idx });
    }
  }

  protected buildCellModifiers(
    system: CalendarSystem<T>,
    date: T,
    modifiers: CalendarModifiers | undefined
  ): Record<string, boolean> {
    if (!modifiers) return {};
    const cellModifiers: Record<string, boolean> = {};
    for (const [name, matcher] of Object.entries(modifiers)) {
      if (matchDate(system, date, matcher)) cellModifiers[name] = true;
    }
    return cellModifiers;
  }

  /**
   * Shared day-grid derivation: month grid, disabled state, modifiers,
   * identity-stable cell cache, and header labels.
   */
  protected buildDaysFromGrid<TCell extends BaseDayCellFields<T>>(
    s: SnapshotBody<S>,
    cellCache: Map<number, TCell>,
    buildCell: (
      gridCell: GridCell<T>,
      nativeDate: Date,
      isDisabled: boolean,
      modifiers: Readonly<Record<string, boolean>>
    ) => TCell,
    extraEqual?: (a: TCell, b: TCell) => boolean
  ): CalendarDaysView<TCell> {
    const { system, displayed, firstDayOfWeek, modifiers } = s;
    const grid = buildMonthGrid(system, displayed, firstDayOfWeek);
    const cache = cellCache;
    const nextCache = new Map<number, TCell>();
    const cells = grid.map((c) => {
      const nativeDate = system.toNativeDate(c.date);
      const isDisabled = this.isDateDisabled(c.date, s);
      const cellModifiers = this.buildCellModifiers(system, c.date, modifiers);
      const computed = buildCell(c, nativeDate, isDisabled, cellModifiers);
      const key = nativeDate.getTime();
      const prev = cache.get(key);
      const reused =
        prev && cellsAreEquivalent(prev, computed, extraEqual)
          ? prev
          : computed;
      nextCache.set(key, reused);
      return reused;
    });
    cellCache.clear();
    for (const [k, v] of nextCache) cellCache.set(k, v);

    const monthIndex = system.month(displayed);
    const labels = system.monthLabels();
    /* istanbul ignore next — `?? String(...)` is a noUncheckedIndexedAccess
     * fallback; well-formed systems return 12 labels. */
    const monthLabel = labels[monthIndex] ?? String(monthIndex + 1);
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

// ── Constructor-time helpers (static, generic) ────────────────────────────

/**
 * Resolve the initial `system` + `systemIndex` from constructor
 * options. Throws when no systems are configured.
 */
export function resolveInitialSystem<T>(opts: BaseCalendarStoreOptions<T>): {
  system: CalendarSystem<T>;
  systemIndex: number;
} {
  if (opts.systems.length === 0) {
    throw new Error('[Calendar] At least one CalendarSystem must be provided.');
  }
  const systemIndex = opts.activeSystemId
    ? Math.max(
        0,
        opts.systems.findIndex((s) => s.id === opts.activeSystemId)
      )
    : 0;
  /* istanbul ignore next — noUncheckedIndexedAccess fallback. */
  const system = opts.systems[systemIndex] ?? opts.systems[0];
  /* istanbul ignore next — see comment above. */
  if (!system) {
    throw new Error('[Calendar] Could not resolve initial CalendarSystem.');
  }
  return { system, systemIndex };
}

/**
 * Normalise the shared subset of constructor inputs against the
 * resolved `system`. Subclass constructors spread the result into
 * their snapshot's base object alongside the mode-specific selection
 * state.
 */
export function normalizeSharedInputs<T>(
  opts: BaseCalendarStoreOptions<T>,
  system: CalendarSystem<T>
): NormalizedSharedInputs<T> {
  return {
    minDate: opts.minDate ? system.from(opts.minDate) : undefined,
    maxDate: opts.maxDate ? system.from(opts.maxDate) : undefined,
    disabledDates: opts.disabledDates?.map((d) => system.from(d)),
    disabledRanges: opts.disabledRanges?.map((r) => ({
      start: system.from(r.start),
      end: system.from(r.end),
    })),
    disabled: opts.disabled,
    firstDayOfWeek: opts.firstDayOfWeek ?? DEFAULT_FIRST_DAY_OF_WEEK,
    modifiers: opts.modifiers,
  };
}
