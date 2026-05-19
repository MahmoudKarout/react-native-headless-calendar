/**
 * Hooks for date-range selection — parallel surface to the legacy
 * `useCalendarSelector` / `useCalendarActions` but typed against
 * `RangeCalendarSnapshot`. Consumers reach `rangeStart` / `rangeEnd`
 * directly, and TS won't suggest single- / multiple-only fields.
 *
 *   - useRangeCalendarSelector(selector) — read primitive.
 *   - useRangeCalendarActions()          — every mutator.
 *
 * Pre-built selectors mirror the original set: `selectRangeDays`,
 * `selectRangeMonths`, `selectRangeYears`, `selectRangeCanConfirm`.
 */
import { createContext, use, useMemo } from 'react';
import { useSyncExternalStore } from 'react';

import type {
  RangeCalendarDays,
  RangeCalendarSnapshot,
} from '../stores/RangeCalendarStore';
import { RangeCalendarStore } from '../stores/RangeCalendarStore';
import type {
  CalendarDateValue,
  CalendarMonths,
  CalendarYears,
} from '../types';

// ---------------------------------------------------------------------------
// Internal context — the store instance.
// ---------------------------------------------------------------------------

export const RangeCalendarStoreContext =
  createContext<RangeCalendarStore | null>(null);

function useRangeStore(): RangeCalendarStore {
  const store = use(RangeCalendarStoreContext);
  if (!store) {
    throw new Error(
      '[Calendar] range-mode hooks must be used within <RangeDateProvider>'
    );
  }
  return store;
}

// ---------------------------------------------------------------------------
// useRangeCalendarSelector — the read primitive.
// ---------------------------------------------------------------------------

export function useRangeCalendarSelector<T>(
  selector: (snapshot: RangeCalendarSnapshot) => T
): T {
  const store = useRangeStore();
  return useSyncExternalStore(store.subscribe, () =>
    selector(store.getSnapshot())
  );
}

// ---------------------------------------------------------------------------
// Built-in selectors.
// ---------------------------------------------------------------------------

/** Render-time predicate: `true` when both endpoints are picked. */
export const selectRangeCanConfirm = (s: RangeCalendarSnapshot): boolean =>
  !!(s.rangeStart && s.rangeEnd);

/** Day-grid view (cells, weekday labels, header labels). */
export const selectRangeDays = (s: RangeCalendarSnapshot): RangeCalendarDays =>
  s.days;

/** 12-cell month chooser view. */
export const selectRangeMonths = (s: RangeCalendarSnapshot): CalendarMonths =>
  s.months;

/** Paginated year chooser view. */
export const selectRangeYears = (s: RangeCalendarSnapshot): CalendarYears =>
  s.years;

// ---------------------------------------------------------------------------
// useRangeCalendarActions — every mutator, zero subscriptions.
// ---------------------------------------------------------------------------

export interface RangeCalendarActions {
  /**
   * Progressive range pick. Sets `rangeStart` on the first call, then
   * completes or relocates on subsequent calls. Coerces native Date /
   * ISO string. No-op on disabled days; rejects completions that
   * violate `minRangeDays` / `maxRangeDays`.
   */
  selectDate: (date: CalendarDateValue | Date | string | number) => void;
  /** Wipe both endpoints and fire `onClear` / `onChange`. */
  clear: () => void;
  /** Fire `onConfirm` with the current selection payload. No-op when unset. */
  confirm: () => void;
  /** Step the displayed month one back. */
  goPrevMonth: () => void;
  /** Step the displayed month one forward. */
  goNextMonth: () => void;
  /** Jump the displayed month to the given date. */
  setDisplayedDate: (date: CalendarDateValue | Date | string | number) => void;
  /** Jump to the given month (0-based) of the displayed year. */
  selectMonth: (index: number) => void;
  /** Jump directly to a specific year. */
  selectYear: (year: number) => void;
  /** Step the year-grid backward one full page. */
  prevYearPage: () => void;
  /** Step the year-grid forward one full page. */
  nextYearPage: () => void;
  /**
   * Switch the active calendar system by id. No-op when the id already
   * matches or is not present in the provider's `systems` array
   * (warned in dev). Both endpoints, the displayed month, and bounds
   * are carried across by absolute instant — day-of-month may change
   * between calendars (e.g. Hijri → Gregorian for the same point).
   */
  setActiveSystem: (id: string) => void;
  /**
   * Synchronously read confirmability from inside an event handler.
   * Render-time consumers should subscribe via
   * `useRangeCalendarSelector(selectRangeCanConfirm)` instead.
   */
  isConfirmable: () => boolean;
}

export function useRangeCalendarActions(): RangeCalendarActions {
  const store = useRangeStore();
  return useMemo<RangeCalendarActions>(
    () => ({
      selectDate: store.selectDate as RangeCalendarActions['selectDate'],
      clear: store.clear,
      confirm: store.confirm,
      goPrevMonth: store.prevMonth,
      goNextMonth: store.nextMonth,
      setDisplayedDate:
        store.setDisplayedDate as RangeCalendarActions['setDisplayedDate'],
      selectMonth: store.goToMonth,
      selectYear: store.goToYear,
      prevYearPage: store.prevYearPage,
      nextYearPage: store.nextYearPage,
      setActiveSystem: store.setActiveSystem,
      isConfirmable: store.isConfirmable,
    }),
    [store]
  );
}
