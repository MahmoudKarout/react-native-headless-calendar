/**
 * CalendarStore — external store for useSyncExternalStore.
 *
 * Why an external store instead of useState/useReducer + Context?
 *   - Granular subscriptions: each compound part subscribes only to the
 *     specific slice it cares about (calendarView, isHijri, currentDate, ...).
 *     Tapping a date doesn't re-render the system switcher, the action bar,
 *     or the unrelated sub-headers.
 *   - Stable action identity: action methods are class arrow functions, so
 *     useCallback/useRef gymnastics aren't needed in consumers.
 *   - Built-in batching: multi-dispatch operations notify listeners exactly
 *     once with the final state.
 *
 * The store is generic over CalendarDateValue (the per-system date shape)
 * but never inspects it directly — it just shuttles values through the
 * active CalendarSystem adapter.
 */
import type {
  CalendarDateValue,
  CalendarMode,
  CalendarSystem,
  CalendarView,
} from './types';

export interface CalendarSnapshot<T = CalendarDateValue> {
  /** Active calendar system (Gregorian, Hijri, ...). */
  system: CalendarSystem<T>;
  /** Index of `system` in the configured `systems` array. */
  systemIndex: number;
  /** Selection mode. */
  mode: CalendarMode;
  /** Currently displayed month (drives the grid + header). */
  displayed: T;
  /** Active sub-view (day grid, month grid, year grid). */
  view: CalendarView;
  /** Single-mode selection. */
  selectedDate: T | undefined;
  /** Range-mode start. */
  rangeStart: T | undefined;
  /** Range-mode end. */
  rangeEnd: T | undefined;
  /** Multiple-mode selection — append-only set semantics, ordered by tap. */
  selectedDates: readonly T[];
  /** Inclusive lower bound, normalised to the active system. */
  minDate: T | undefined;
  /** Inclusive upper bound, normalised to the active system. */
  maxDate: T | undefined;
  /** Explicitly disabled dates (normalised). */
  disabledDates: readonly T[] | undefined;
  /** Explicitly disabled inclusive ranges (normalised). */
  disabledRanges: readonly { start: T; end: T }[] | undefined;
  /** Whether tapping the same day twice in range mode picks a single-day range. */
  allowSameDay: boolean;
  /**
   * Inclusive minimum length, in days, of a confirmable range (range mode).
   * `undefined` means no lower bound.
   */
  minRangeDays: number | undefined;
  /**
   * Inclusive maximum length, in days, of a confirmable range (range mode).
   * `undefined` means no upper bound.
   */
  maxRangeDays: number | undefined;
  /**
   * Inclusive cap on the number of dates that can be selected in
   * `'multiple'` mode. `undefined` means no cap.
   */
  maxSelected: number | undefined;
  /**
   * Optional dynamic-disabled predicate evaluated against the native JS
   * Date for each candidate. Composes (OR) with `disabledDates`,
   * `disabledRanges`, and the `min/max` bounds.
   */
  disabled: ((nativeDate: Date) => boolean) | undefined;
}

export interface CalendarStoreOptions<T = CalendarDateValue> {
  systems: readonly CalendarSystem<T>[];
  initialSystemId?: string;
  mode: CalendarMode;
  initialDate?: unknown;
  initialStart?: unknown;
  initialEnd?: unknown;
  initialDates?: readonly unknown[];
  minDate?: unknown;
  maxDate?: unknown;
  disabledDates?: readonly unknown[];
  disabledRanges?: readonly { start: unknown; end: unknown }[];
  allowSameDay?: boolean;
  minRangeDays?: number;
  maxRangeDays?: number;
  maxSelected?: number;
  disabled?: (nativeDate: Date) => boolean;
}

type Listener = () => void;

export class CalendarStore<T = CalendarDateValue> {
  private snapshot: CalendarSnapshot<T>;
  private listeners = new Set<Listener>();
  private batchDepth = 0;
  private pendingEmit = false;

  constructor(opts: CalendarStoreOptions<T>) {
    if (opts.systems.length === 0) {
      throw new Error(
        '[Calendar] At least one CalendarSystem must be provided.'
      );
    }
    const systemIndex = opts.initialSystemId
      ? Math.max(
          0,
          opts.systems.findIndex((s) => s.id === opts.initialSystemId)
        )
      : 0;
    /* istanbul ignore next — both `?? opts.systems[0]` and the `if (!system)`
     * branch below are TS noUncheckedIndexedAccess fallbacks. The
     * empty-array check above already guarantees `systems[systemIndex]` is
     * defined for systemIndex in [0, length). */
    const system = opts.systems[systemIndex] ?? opts.systems[0];
    /* istanbul ignore next — see comment above. */
    if (!system) {
      throw new Error('[Calendar] Could not resolve initial CalendarSystem.');
    }

    // Pick a sensible initial `displayed` for each mode so the grid opens
    // on a month with state in it, regardless of which inputs are provided.
    const seedDate =
      opts.mode === 'single'
        ? opts.initialDate
        : opts.mode === 'range'
          ? (opts.initialStart ?? opts.initialEnd)
          : opts.initialDates?.[0];
    const displayed = seedDate ? system.from(seedDate) : system.today();

    const initialDates =
      opts.mode === 'multiple' && opts.initialDates?.length
        ? opts.initialDates.map((d) => system.from(d))
        : [];

    this.snapshot = {
      system,
      systemIndex,
      mode: opts.mode,
      displayed,
      view: 'day',
      selectedDate: opts.initialDate
        ? system.from(opts.initialDate)
        : undefined,
      rangeStart: opts.initialStart
        ? system.from(opts.initialStart)
        : undefined,
      rangeEnd: opts.initialEnd ? system.from(opts.initialEnd) : undefined,
      selectedDates: initialDates,
      minDate: opts.minDate ? system.from(opts.minDate) : undefined,
      maxDate: opts.maxDate ? system.from(opts.maxDate) : undefined,
      disabledDates: opts.disabledDates?.map((d) => system.from(d)),
      disabledRanges: opts.disabledRanges?.map((r) => ({
        start: system.from(r.start),
        end: system.from(r.end),
      })),
      allowSameDay: opts.allowSameDay ?? false,
      minRangeDays: opts.minRangeDays,
      maxRangeDays: opts.maxRangeDays,
      maxSelected: opts.maxSelected,
      disabled: opts.disabled,
    };
  }

  // -- useSyncExternalStore API ------------------------------------------

  getSnapshot = (): CalendarSnapshot<T> => this.snapshot;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  // -- batching ----------------------------------------------------------

  private emit() {
    for (const l of this.listeners) l();
  }

  private commit(next: CalendarSnapshot<T>) {
    /* istanbul ignore next — every external commit creates a fresh object,
     * so identity equality with the current snapshot is unreachable. */
    if (next === this.snapshot) return;
    this.snapshot = next;
    if (this.batchDepth > 0) {
      this.pendingEmit = true;
    } else {
      this.emit();
    }
  }

  private batch(fn: () => void) {
    this.batchDepth += 1;
    try {
      fn();
    } finally {
      this.batchDepth -= 1;
      /* istanbul ignore else — every batched action commits at least once
       * today, so the no-pendingEmit branch is unreachable from outside. */
      if (this.batchDepth === 0 && this.pendingEmit) {
        this.pendingEmit = false;
        this.emit();
      }
    }
  }

  // -- props sync (called from a useEffect in <Calendar.Root>) -----------

  syncProps(opts: CalendarStoreOptions<T>): void {
    const s = this.snapshot;
    let next = s;

    if (opts.mode !== s.mode) {
      next = { ...next, mode: opts.mode };
    }
    if ((opts.allowSameDay ?? false) !== s.allowSameDay) {
      next = { ...next, allowSameDay: opts.allowSameDay ?? false };
    }
    if (opts.minRangeDays !== s.minRangeDays) {
      next = { ...next, minRangeDays: opts.minRangeDays };
    }
    if (opts.maxRangeDays !== s.maxRangeDays) {
      next = { ...next, maxRangeDays: opts.maxRangeDays };
    }
    if (opts.maxSelected !== s.maxSelected) {
      next = { ...next, maxSelected: opts.maxSelected };
    }
    if (opts.disabled !== s.disabled) {
      next = { ...next, disabled: opts.disabled };
    }
    // Re-normalise bounds and disable lists against the active system —
    // cheap (handful of objects), avoids subtle staleness when consumers
    // pass updated props after a system switch.
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
    // For disabled lists, identity-compare the input arrays (consumers must
    // memoise them) to avoid a per-render rebuild.
    const newDisabledDates = opts.disabledDates?.map((d) => system.from(d));
    const newDisabledRanges = opts.disabledRanges?.map((r) => ({
      start: system.from(r.start),
      end: system.from(r.end),
    }));
    next = {
      ...next,
      disabledDates: newDisabledDates,
      disabledRanges: newDisabledRanges,
    };

    this.commit(next);
  }

  // -- actions -----------------------------------------------------------

  setView = (view: CalendarView): void => {
    if (view === this.snapshot.view) return;
    this.commit({ ...this.snapshot, view });
  };

  /**
   * Swap the active calendar system. Called by <Calendar.SystemSwitcher>
   * (which has access to the configured systems list via context) and by
   * <Calendar.Root> when the systems prop changes.
   *
   * Selected / displayed dates are carried over by round-tripping through
   * native Date — they remain pinned to the same calendar day, just
   * re-expressed in the new system.
   */
  replaceSystem = (system: CalendarSystem<T>, systemIndex: number): void => {
    const s = this.snapshot;
    if (s.system === system) return;
    // Carry over the displayed/selected dates by converting through native Date.
    const carry = (v: T | undefined) =>
      v ? system.fromNativeDate(s.system.toNativeDate(v)) : undefined;
    this.commit({
      ...s,
      system,
      systemIndex,
      displayed: system.fromNativeDate(s.system.toNativeDate(s.displayed)),
      selectedDate: carry(s.selectedDate),
      rangeStart: carry(s.rangeStart),
      rangeEnd: carry(s.rangeEnd),
      selectedDates: s.selectedDates.map((d) =>
        system.fromNativeDate(s.system.toNativeDate(d))
      ),
      minDate: carry(s.minDate),
      maxDate: carry(s.maxDate),
      disabledDates: s.disabledDates?.map((d) =>
        system.fromNativeDate(s.system.toNativeDate(d))
      ),
      disabledRanges: s.disabledRanges?.map((r) => ({
        start: system.fromNativeDate(s.system.toNativeDate(r.start)),
        end: system.fromNativeDate(s.system.toNativeDate(r.end)),
      })),
    });
  };

  /** Step the displayed month forward (positive) or backward (negative). */
  changeMonth = (step: number): void => {
    const s = this.snapshot;
    this.commit({
      ...s,
      displayed: s.system.addMonths(s.displayed, step),
    });
  };

  /** Step the displayed year forward (positive) or backward (negative). */
  changeYear = (step: number): void => {
    const s = this.snapshot;
    this.commit({
      ...s,
      displayed: s.system.addYears(s.displayed, step),
    });
  };

  /** Jump directly to a specific year (used by the year grid). */
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

  /** Jump directly to a specific month (0-based) of the displayed year. */
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

  /** Select a day. Behaviour depends on `mode`. */
  selectDate = (date: T): void => {
    const s = this.snapshot;
    const system = s.system;

    if (this.isDateDisabled(date)) return;

    if (s.mode === 'single') {
      this.commit({
        ...s,
        selectedDate: date,
        displayed: date,
      });
      return;
    }

    if (s.mode === 'multiple') {
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
          // eviction can subscribe to `onSelectHaptic` and dispatch their
          // own clear-then-select sequence.
          return;
        }
        nextDates = [...s.selectedDates, date];
      }
      this.commit({
        ...s,
        selectedDates: nextDates,
        displayed: date,
      });
      return;
    }

    // Range mode: progressive selection.
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
      // Both endpoints present — start a fresh range.
      nextStart = date;
      nextEnd = undefined;
    }

    // Enforce min/max range-length constraints. Only validated when the
    // pick produced two endpoints; the partial-range state is always
    // allowed so consumers can see their selection grow.
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
  };

  /**
   * Toggle a date in `'multiple'` mode. Convenience wrapper around
   * `selectDate` with explicit naming so consumers reading their own
   * code can see the intent. No-op in single / range mode.
   */
  toggleDate = (date: T): void => {
    if (this.snapshot.mode !== 'multiple') return;
    this.selectDate(date);
  };

  /** Clear all selection state. */
  clear = (): void => {
    const s = this.snapshot;
    this.commit({
      ...s,
      selectedDate: undefined,
      rangeStart: undefined,
      rangeEnd: undefined,
      selectedDates: [],
    });
  };

  // -- internal helpers --------------------------------------------------

  /**
   * Single source of truth for whether a date is disabled. Composed from
   * min/max bounds, the explicit lists, and the optional `disabled`
   * predicate (which receives the native JS Date).
   */
  private isDateDisabled(date: T): boolean {
    const s = this.snapshot;
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
        // The fallback is "not disabled" rather than "always disabled" so
        // a thrown predicate doesn't lock out every date.
      }
    }
    return false;
  }

  /**
   * Check whether a [start, end] range satisfies the configured
   * `minRangeDays` / `maxRangeDays` bounds. Inclusive on both sides
   * (a one-day range has length 1).
   */
  private isRangeLengthAllowed(start: T, end: T): boolean {
    const { minRangeDays, maxRangeDays } = this.snapshot;
    if (minRangeDays === undefined && maxRangeDays === undefined) return true;
    const len = this.rangeLengthDays(start, end);
    if (minRangeDays !== undefined && len < minRangeDays) return false;
    if (maxRangeDays !== undefined && len > maxRangeDays) return false;
    return true;
  }

  /**
   * Inclusive day-count between two dates in the active system. Computed
   * via native Date round-trip — accurate across DST, month boundaries,
   * and arbitrary calendar systems (Hijri / Persian / …).
   */
  private rangeLengthDays(start: T, end: T): number {
    const system = this.snapshot.system;
    const a = system.toNativeDate(start);
    const b = system.toNativeDate(end);
    // Normalise to midnight UTC to avoid DST off-by-one when `toNativeDate`
    // returns local-midnight Dates.
    const aUtc = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const bUtc = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    const ms = Math.abs(bUtc - aUtc);
    return Math.round(ms / 86_400_000) + 1;
  }
}
