/**
 * Hooks-only public surface — *two* hooks, plus a small set of named
 * selectors.
 *
 *   - useCalendarSelector(selector) — universal, narrow read primitive.
 *     `Object.is` semantics on the selector output.
 *   - useCalendarActions()          — every mutator. Subscription-free,
 *     identity-stable for the lifetime of the provider.
 *
 * Bundled "data shapes" (the day grid, the month chooser, the year page)
 * live on the snapshot itself — see `CalendarSnapshot.days/months/years`
 * — and are reached via the `selectDays / selectMonths / selectYears`
 * selectors. Their references stay stable across commits that don't
 * touch the underlying inputs, so consumers can pass them straight to
 * `React.memo`'d children.
 */
import { createContext, use, useMemo } from 'react';
import { useSyncExternalStore } from 'react';

import type {
  CalendarDays,
  CalendarMonths,
  CalendarSnapshot,
  CalendarStore,
  CalendarYears,
} from './store';
import type { CalendarDateValue } from './types';

// ---------------------------------------------------------------------------
// Internal context — the store instance. Not exported from the package
// entry point. Consumers only ever interact with the two hooks below.
// ---------------------------------------------------------------------------

export const CalendarStoreContext = createContext<CalendarStore | null>(null);

function useCalendarStore(): CalendarStore {
  const store = use(CalendarStoreContext);
  if (!store) {
    throw new Error('[Calendar] hooks must be used within <CalendarProvider>');
  }
  return store;
}

// ---------------------------------------------------------------------------
// useCalendarSelector — the universal read primitive.
// ---------------------------------------------------------------------------

export function useCalendarSelector<T>(
  selector: (snapshot: CalendarSnapshot) => T
): T {
  const store = useCalendarStore();
  return useSyncExternalStore(store.subscribe, () =>
    selector(store.getSnapshot())
  );
}

// ---------------------------------------------------------------------------
// Built-in selectors. All return identity-stable values across commits
// that don't touch their inputs, so they're safe under `Object.is`.
// ---------------------------------------------------------------------------

/**
 * Render-time predicate: `true` when the current selection is
 * confirmable (single→date set, multiple→non-empty, range→both ends).
 */
export const selectCanConfirm = (s: CalendarSnapshot): boolean => {
  if (s.mode === 'single') return !!s.selectedDate;
  if (s.mode === 'multiple') return s.selectedDates.length > 0;
  return !!(s.rangeStart && s.rangeEnd);
};

/** Day-grid view (cells, weekday labels, header labels). */
export const selectDays = (s: CalendarSnapshot): CalendarDays => s.days;

/** 12-cell month chooser view. */
export const selectMonths = (s: CalendarSnapshot): CalendarMonths => s.months;

/** Paginated year chooser view. */
export const selectYears = (s: CalendarSnapshot): CalendarYears => s.years;

// ---------------------------------------------------------------------------
// useCalendarActions — every mutator, zero subscriptions.
// ---------------------------------------------------------------------------

/**
 * Actions surface returned by `useCalendarActions`. Every method is a
 * stable reference for the lifetime of the enclosing <CalendarProvider>,
 * so it's safe to pass straight to memoised components, useEffect deps,
 * or out-of-tree event handlers. The hook never subscribes to any store
 * slice — it never re-renders.
 */
export interface CalendarActions {
  /** Tap a day — behaviour depends on `mode`. Coerces native Date / ISO. */
  selectDate: (date: CalendarDateValue | Date | string | number) => void;
  /** Wipe selection state and fire `onClear` / `onChange`. */
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
   * `useCalendarSelector(selectCanConfirm)` instead.
   */
  isConfirmable: () => boolean;
}

export function useCalendarActions(): CalendarActions {
  const store = useCalendarStore();
  return useMemo<CalendarActions>(
    () => ({
      selectDate: store.selectDate as CalendarActions['selectDate'],
      clear: store.clear,
      confirm: store.confirm,
      goPrevMonth: store.prevMonth,
      goNextMonth: store.nextMonth,
      setDisplayedDate:
        store.setDisplayedDate as CalendarActions['setDisplayedDate'],
      selectMonth: store.goToMonth,
      selectYear: store.goToYear,
      prevYearPage: store.prevYearPage,
      nextYearPage: store.nextYearPage,
      isConfirmable: store.isConfirmable,
    }),
    [store]
  );
}
