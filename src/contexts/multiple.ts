/**
 * Hooks for multi-day selection — parallel surface to the legacy
 * `useCalendarSelector` / `useCalendarActions` but typed against
 * `MultipleCalendarSnapshot`. Consumers reach `selectedDates` directly,
 * and TS won't suggest single- / range-only fields.
 *
 *   - useMultipleCalendarSelector(selector) — read primitive.
 *   - useMultipleCalendarActions()          — every mutator.
 *
 * Pre-built selectors mirror the original set: `selectMultipleDays`,
 * `selectMultipleMonths`, `selectMultipleYears`,
 * `selectMultipleCanConfirm`.
 */
import { createContext, use, useMemo } from 'react';
import { useSyncExternalStore } from 'react';

import type {
  MultipleCalendarDays,
  MultipleCalendarSnapshot,
} from '../stores/MultipleCalendarStore';
import { MultipleCalendarStore } from '../stores/MultipleCalendarStore';
import type {
  CalendarDateValue,
  CalendarMonths,
  CalendarYears,
} from '../types';

// ---------------------------------------------------------------------------
// Internal context — the store instance.
// ---------------------------------------------------------------------------

export const MultipleCalendarStoreContext =
  createContext<MultipleCalendarStore | null>(null);

function useMultipleStore(): MultipleCalendarStore {
  const store = use(MultipleCalendarStoreContext);
  if (!store) {
    throw new Error(
      '[Calendar] multiple-mode hooks must be used within <MultipleDateProvider>'
    );
  }
  return store;
}

// ---------------------------------------------------------------------------
// useMultipleCalendarSelector — the read primitive.
// ---------------------------------------------------------------------------

export function useMultipleCalendarSelector<T>(
  selector: (snapshot: MultipleCalendarSnapshot) => T
): T {
  const store = useMultipleStore();
  return useSyncExternalStore(store.subscribe, () =>
    selector(store.getSnapshot())
  );
}

// ---------------------------------------------------------------------------
// Built-in selectors.
// ---------------------------------------------------------------------------

/** Render-time predicate: `true` when at least one date is selected. */
export const selectMultipleCanConfirm = (
  s: MultipleCalendarSnapshot
): boolean => s.selectedDates.length > 0;

/** Day-grid view (cells, weekday labels, header labels). */
export const selectMultipleDays = (
  s: MultipleCalendarSnapshot
): MultipleCalendarDays => s.days;

/** 12-cell month chooser view. */
export const selectMultipleMonths = (
  s: MultipleCalendarSnapshot
): CalendarMonths => s.months;

/** Paginated year chooser view. */
export const selectMultipleYears = (
  s: MultipleCalendarSnapshot
): CalendarYears => s.years;

// ---------------------------------------------------------------------------
// useMultipleCalendarActions — every mutator, zero subscriptions.
// ---------------------------------------------------------------------------

export interface MultipleCalendarActions {
  /**
   * Toggle a day in the selection set. Coerces native Date / ISO
   * string. No-op on disabled days; silently ignores adds when the
   * `maxSelected` cap is reached.
   */
  selectDate: (date: CalendarDateValue | Date | string | number) => void;
  /** Alias for `selectDate` — surfaced for intent clarity. */
  toggleDate: (date: CalendarDateValue | Date | string | number) => void;
  /** Empty the selection and fire `onClear` / `onChange`. */
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
   * (warned in dev). The selection set, the displayed month, and
   * bounds are carried across by absolute instant — day-of-month may
   * change between calendars (e.g. Hijri → Gregorian for the same
   * point).
   */
  setActiveSystem: (id: string) => void;
  /**
   * Synchronously read confirmability from inside an event handler.
   * Render-time consumers should subscribe via
   * `useMultipleCalendarSelector(selectMultipleCanConfirm)` instead.
   */
  isConfirmable: () => boolean;
}

export function useMultipleCalendarActions(): MultipleCalendarActions {
  const store = useMultipleStore();
  return useMemo<MultipleCalendarActions>(
    () => ({
      selectDate: store.selectDate as MultipleCalendarActions['selectDate'],
      toggleDate: store.toggleDate as MultipleCalendarActions['toggleDate'],
      clear: store.clear,
      confirm: store.confirm,
      goPrevMonth: store.prevMonth,
      goNextMonth: store.nextMonth,
      setDisplayedDate:
        store.setDisplayedDate as MultipleCalendarActions['setDisplayedDate'],
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
