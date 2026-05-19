/**
 * Hooks for single-date selection — parallel surface to the legacy
 * `useCalendarSelector` / `useCalendarActions` but typed against
 * `SingleCalendarSnapshot`. Consumers reach `selectedDate` directly,
 * and TS won't suggest range-/multiple-only fields.
 *
 *   - useSingleCalendarSelector(selector) — read primitive.
 *   - useSingleCalendarActions()          — every mutator.
 *
 * Pre-built selectors mirror the original set: `selectSingleDays`,
 * `selectSingleMonths`, `selectSingleYears`, `selectSingleCanConfirm`.
 */
import { createContext, use, useMemo } from 'react';
import { useSyncExternalStore } from 'react';

import type { CalendarMonths, CalendarYears } from '../store';
import type {
  SingleCalendarDays,
  SingleCalendarSnapshot,
} from '../stores/SingleCalendarStore';
import { SingleCalendarStore } from '../stores/SingleCalendarStore';
import type { CalendarDateValue } from '../types';

// ---------------------------------------------------------------------------
// Internal context — the store instance.
// ---------------------------------------------------------------------------

export const SingleCalendarStoreContext =
  createContext<SingleCalendarStore | null>(null);

function useSingleStore(): SingleCalendarStore {
  const store = use(SingleCalendarStoreContext);
  if (!store) {
    throw new Error(
      '[Calendar] single-mode hooks must be used within <SingleDateProvider>'
    );
  }
  return store;
}

// ---------------------------------------------------------------------------
// useSingleCalendarSelector — the read primitive.
// ---------------------------------------------------------------------------

export function useSingleCalendarSelector<T>(
  selector: (snapshot: SingleCalendarSnapshot) => T
): T {
  const store = useSingleStore();
  return useSyncExternalStore(store.subscribe, () =>
    selector(store.getSnapshot())
  );
}

// ---------------------------------------------------------------------------
// Built-in selectors.
// ---------------------------------------------------------------------------

/** Render-time predicate: `true` when a date has been selected. */
export const selectSingleCanConfirm = (s: SingleCalendarSnapshot): boolean =>
  !!s.selectedDate;

/** Day-grid view (cells, weekday labels, header labels). */
export const selectSingleDays = (
  s: SingleCalendarSnapshot
): SingleCalendarDays => s.days;

/** 12-cell month chooser view. */
export const selectSingleMonths = (s: SingleCalendarSnapshot): CalendarMonths =>
  s.months;

/** Paginated year chooser view. */
export const selectSingleYears = (s: SingleCalendarSnapshot): CalendarYears =>
  s.years;

// ---------------------------------------------------------------------------
// useSingleCalendarActions — every mutator, zero subscriptions.
// ---------------------------------------------------------------------------

export interface SingleCalendarActions {
  /** Pick a day. Coerces native Date / ISO string. No-op on disabled days. */
  selectDate: (date: CalendarDateValue | Date | string | number) => void;
  /** Wipe the current selection and fire `onClear` / `onChange`. */
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
   * Synchronously read confirmability from inside an event handler.
   * Render-time consumers should subscribe via
   * `useSingleCalendarSelector(selectSingleCanConfirm)` instead.
   */
  isConfirmable: () => boolean;
}

export function useSingleCalendarActions(): SingleCalendarActions {
  const store = useSingleStore();
  return useMemo<SingleCalendarActions>(
    () => ({
      selectDate: store.selectDate as SingleCalendarActions['selectDate'],
      clear: store.clear,
      confirm: store.confirm,
      goPrevMonth: store.prevMonth,
      goNextMonth: store.nextMonth,
      setDisplayedDate:
        store.setDisplayedDate as SingleCalendarActions['setDisplayedDate'],
      selectMonth: store.goToMonth,
      selectYear: store.goToYear,
      prevYearPage: store.prevYearPage,
      nextYearPage: store.nextYearPage,
      isConfirmable: store.isConfirmable,
    }),
    [store]
  );
}
