/**
 * Hooks-only public surface.
 *
 * This module wires the underlying CalendarStore into the five hooks that
 * make up the entire library API:
 *
 *   - useCalendarSelector   — granular subscription to any store slice
 *   - useCalendarDays       — day grid data + actions for a custom UI
 *   - useCalendarMonths     — 12-cell month chooser data + actions
 *   - useCalendarYears      — paginated year chooser data + actions
 *   - useCalendarActions    — confirm / clear / canConfirm
 *
 * Two contexts are kept internal to this module:
 *
 *   1. CalendarStoreContext  — the store INSTANCE (stable identity).
 *   2. CalendarConfigContext — primitives (`firstDayOfWeek`, `modifiers`,
 *                              `onConfirm`, `onClear`, `onSelectHaptic`).
 */
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';

import type { CalendarStore, CalendarSnapshot } from './store';
import type {
  CalendarDateValue,
  DayCellInfo,
  CalendarModifiers,
  OnConfirm,
  OnClear,
  Weekday,
} from './types';
import {
  YEAR_PAGE_SIZE,
  buildMonthGrid,
  getYearPage,
  isBetween,
  isExplicitlyDisabled,
  matchDate,
  rotateWeekdayLabels,
} from './utils/grid';

// ---------------------------------------------------------------------------
// Internal contexts — not exported from the package entry point. Consumers
// only ever interact with the five hooks below.
// ---------------------------------------------------------------------------

export const CalendarStoreContext = createContext<CalendarStore | null>(null);

function useCalendarStore(): CalendarStore {
  const store = use(CalendarStoreContext);
  if (!store) {
    throw new Error('[Calendar] hooks must be used within <CalendarProvider>');
  }
  return store;
}

export interface CalendarConfig {
  /** Which weekday occupies the first column of the day grid. */
  firstDayOfWeek: Weekday;
  /** Named modifiers — see CalendarProviderProps.modifiers. */
  modifiers?: CalendarModifiers;
  onConfirm?: OnConfirm;
  onClear?: OnClear;
  /** Optional haptic hook fired on day selection. */
  onSelectHaptic?: () => void;
}

export const CalendarConfigContext = createContext<CalendarConfig | null>(null);

function useCalendarConfig(): CalendarConfig {
  const config = use(CalendarConfigContext);
  if (!config) {
    throw new Error('[Calendar] hooks must be used within <CalendarProvider>');
  }
  return config;
}

// ---------------------------------------------------------------------------
// useCalendarSelector — subscribe to any slice of state.
// ---------------------------------------------------------------------------

/**
 * Subscribe to a slice of calendar state.
 *
 * The component re-renders only when the selector's return value differs
 * (Object.is). Prefer primitive returns (number, string, boolean) for
 * maximum stability — e.g. select `s.system.id` instead of `s.system`.
 */
export function useCalendarSelector<T>(
  selector: (snapshot: CalendarSnapshot) => T
): T {
  const store = useCalendarStore();
  return useSyncExternalStore(store.subscribe, () =>
    selector(store.getSnapshot())
  );
}

// ---------------------------------------------------------------------------
// useCalendarActions — confirm / clear / canConfirm.
// ---------------------------------------------------------------------------

export interface CalendarActions {
  /**
   * Fire the configured `onConfirm` (passed to <CalendarProvider>) with
   * the current selection payload. No-op when `onConfirm` was not given.
   */
  confirm: () => void;
  /**
   * Wipe all selection state (single date, range endpoints, and multi
   * list) and fire the configured `onClear` callback.
   */
  clear: () => void;
  /**
   * `true` when the current selection is confirmable:
   *   - single   mode: a date is selected.
   *   - multiple mode: at least one date is selected.
   *   - range    mode: both endpoints are selected.
   */
  canConfirm: boolean;
}

export function useCalendarActions(): CalendarActions {
  const store = useCalendarStore();
  const { onConfirm, onClear } = useCalendarConfig();

  const canConfirm = useCalendarSelector((s) => {
    if (s.mode === 'single') return !!s.selectedDate;
    if (s.mode === 'multiple') return s.selectedDates.length > 0;
    return !!(s.rangeStart && s.rangeEnd);
  });

  const confirm = useCallback(() => {
    if (!onConfirm) return;
    const s = store.getSnapshot();
    onConfirm({
      date: s.selectedDate ? s.system.toNativeDate(s.selectedDate) : undefined,
      startDate: s.rangeStart ? s.system.toNativeDate(s.rangeStart) : undefined,
      endDate: s.rangeEnd ? s.system.toNativeDate(s.rangeEnd) : undefined,
      dates: s.selectedDates.length
        ? s.selectedDates.map((d) => s.system.toNativeDate(d))
        : undefined,
      systemId: s.system.id,
    });
  }, [onConfirm, store]);

  const clear = useCallback(() => {
    store.clear();
    onClear?.();
  }, [store, onClear]);

  return { confirm, clear, canConfirm };
}

// ---------------------------------------------------------------------------
// useCalendarDays — everything required to render a day grid.
// ---------------------------------------------------------------------------

export interface CalendarDays {
  /** Weekday labels rotated to the active `firstDayOfWeek`. */
  weekdayLabels: readonly string[];
  /** Cells for the displayed month grid (length = ROWS * COLS). */
  cells: readonly DayCellInfo[];
  /** Localised month name for the displayed month. */
  displayedMonthLabel: string;
  /** Year of the displayed month, as a string. */
  displayedYearLabel: string;
  /** Step the displayed month one back. */
  goPrevMonth: () => void;
  /** Step the displayed month one forward. */
  goNextMonth: () => void;
  /** Jump the displayed month to the given date. */
  setDisplayedDate: (date: CalendarDateValue) => void;
  /** Tap a day — behaviour depends on `mode`. */
  selectDate: (date: CalendarDateValue) => void;
}

export function useCalendarDays(): CalendarDays {
  const store = useCalendarStore();
  const { firstDayOfWeek, modifiers, onSelectHaptic } = useCalendarConfig();
  const system = useCalendarSelector((s) => s.system);
  const displayed = useCalendarSelector((s) => s.displayed);
  const mode = useCalendarSelector((s) => s.mode);
  const selectedDate = useCalendarSelector((s) => s.selectedDate);
  const selectedDates = useCalendarSelector((s) => s.selectedDates);
  const rangeStart = useCalendarSelector((s) => s.rangeStart);
  const rangeEnd = useCalendarSelector((s) => s.rangeEnd);
  const minDate = useCalendarSelector((s) => s.minDate);
  const maxDate = useCalendarSelector((s) => s.maxDate);
  const disabledDates = useCalendarSelector((s) => s.disabledDates);
  const disabledRanges = useCalendarSelector((s) => s.disabledRanges);
  const disabledPredicate = useCalendarSelector((s) => s.disabled);
  const monthLabels = useCalendarSelector((s) => s.system.monthLabels());
  const displayedYear = useCalendarSelector((s) => s.system.year(s.displayed));

  const weekdayLabels = useMemo(
    () => rotateWeekdayLabels(system.weekdayLabels(), firstDayOfWeek),
    [system, firstDayOfWeek]
  );

  const cells = useMemo<readonly DayCellInfo[]>(() => {
    const grid = buildMonthGrid(system, displayed, firstDayOfWeek);
    const today = system.today();
    const modifierEntries = modifiers ? Object.entries(modifiers) : null;
    return grid.map((c) => {
      const isStart = !!rangeStart && system.isSame(c.date, rangeStart);
      const isEnd = !!rangeEnd && system.isSame(c.date, rangeEnd);
      const isSingle =
        mode === 'single' &&
        !!selectedDate &&
        system.isSame(c.date, selectedDate);
      const isMulti =
        mode === 'multiple' &&
        selectedDates.some((d) => system.isSame(d, c.date));
      const inRange =
        mode === 'range' && isBetween(system, c.date, rangeStart, rangeEnd);
      const nativeDate = system.toNativeDate(c.date);
      let isDisabled =
        (!!minDate && system.isBefore(c.date, minDate)) ||
        (!!maxDate && system.isAfter(c.date, maxDate)) ||
        isExplicitlyDisabled(system, c.date, disabledDates, disabledRanges);
      if (!isDisabled && disabledPredicate) {
        try {
          if (disabledPredicate(nativeDate)) isDisabled = true;
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

      return {
        date: c.date,
        nativeDate,
        label: system.formatDay(c.date),
        isCurrentMonth: c.isCurrentMonth,
        isToday: system.isSame(c.date, today),
        isSelected: isSingle || isMulti || isStart || isEnd,
        inRange: inRange && !isStart && !isEnd,
        isRangeStart: isStart,
        isRangeEnd: isEnd,
        isDisabled,
        modifiers: cellModifiers,
      };
    });
  }, [
    system,
    displayed,
    firstDayOfWeek,
    modifiers,
    mode,
    selectedDate,
    selectedDates,
    rangeStart,
    rangeEnd,
    minDate,
    maxDate,
    disabledDates,
    disabledRanges,
    disabledPredicate,
  ]);

  const goPrevMonth = useCallback(() => store.changeMonth(-1), [store]);
  const goNextMonth = useCallback(() => store.changeMonth(1), [store]);
  const setDisplayedDate = useCallback(
    (date: CalendarDateValue) => {
      const next = system.from(date);
      const currentYear = system.year(displayed);
      const nextYear = system.year(next);
      if (currentYear !== nextYear) store.changeYear(nextYear - currentYear);
      const currentMonth = system.month(store.getSnapshot().displayed);
      const nextMonth = system.month(next);
      if (currentMonth !== nextMonth)
        store.changeMonth(nextMonth - currentMonth);
    },
    [store, system, displayed]
  );
  const selectDate = useCallback(
    (date: CalendarDateValue) => {
      store.selectDate(system.from(date));
      onSelectHaptic?.();
    },
    [store, system, onSelectHaptic]
  );

  const monthIndex = system.month(displayed);
  const displayedMonthLabel = monthLabels[monthIndex] ?? String(monthIndex + 1);

  return {
    weekdayLabels,
    cells,
    displayedMonthLabel,
    displayedYearLabel: String(displayedYear),
    goPrevMonth,
    goNextMonth,
    setDisplayedDate,
    selectDate,
  };
}

// ---------------------------------------------------------------------------
// useCalendarMonths — 12-cell month chooser data + actions.
// ---------------------------------------------------------------------------

export interface CalendarMonthEntry {
  /** 0-based month index expected by `selectMonth`. */
  index: number;
  /** Localised name for that month, in the active system. */
  label: string;
}

export interface CalendarMonths {
  /** All 12 months for the active system, identity-stable per system. */
  months: readonly CalendarMonthEntry[];
  /** 0-based index of the currently displayed month. */
  activeMonth: number;
  /** Jump to the given month (index 0..11). */
  selectMonth: (index: number) => void;
}

export function useCalendarMonths(): CalendarMonths {
  const store = useCalendarStore();
  const monthLabels = useCalendarSelector((s) => s.system.monthLabels());
  const activeMonth = useCalendarSelector((s) => s.system.month(s.displayed));
  const months = useMemo<readonly CalendarMonthEntry[]>(
    () => monthLabels.map((label, index) => ({ index, label })),
    [monthLabels]
  );
  const selectMonth = useCallback(
    (index: number) => store.goToMonth(index),
    [store]
  );
  return { months, activeMonth, selectMonth };
}

// ---------------------------------------------------------------------------
// useCalendarYears — paginated year chooser data + actions.
// ---------------------------------------------------------------------------

export interface CalendarYears {
  /** Years on the page containing `activeYear` (length = YEAR_PAGE_SIZE). */
  years: readonly number[];
  /** Currently displayed year. */
  activeYear: number;
  /** Jump to the given year. */
  selectYear: (year: number) => void;
  /** Step backward one full year-page. */
  goPrevPage: () => void;
  /** Step forward one full year-page. */
  goNextPage: () => void;
}

export function useCalendarYears(): CalendarYears {
  const store = useCalendarStore();
  const activeYear = useCalendarSelector((s) => s.system.year(s.displayed));
  const years = useMemo<readonly number[]>(
    () => getYearPage(activeYear),
    [activeYear]
  );
  const selectYear = useCallback(
    (year: number) => store.goToYear(year),
    [store]
  );
  const goPrevPage = useCallback(
    () => store.changeYear(-YEAR_PAGE_SIZE),
    [store]
  );
  const goNextPage = useCallback(
    () => store.changeYear(YEAR_PAGE_SIZE),
    [store]
  );
  return { years, activeYear, selectYear, goPrevPage, goNextPage };
}
