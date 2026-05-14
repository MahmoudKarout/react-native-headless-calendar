/**
 * react-native-fast-calendar — hooks-first public surface.
 *
 * The library is intentionally headless: there is one provider component
 * (<CalendarProvider>) and two hooks — `useCalendarSelector` for reads
 * and `useCalendarActions` for writes. Pre-built selectors
 * (`selectDays`, `selectMonths`, `selectYears`, `selectCanConfirm`)
 * cover the common shapes. Consumers bring their own UI.
 */

// Provider — the only required boundary for every hook below.
export { Root as CalendarProvider } from './components/Root';
export type { CalendarRootProps as CalendarProviderProps } from './components/Root';

// Public hooks — there are exactly two. Everything readable goes through
// `useCalendarSelector(...)`; every mutator is on `useCalendarActions()`.
export { useCalendarActions, useCalendarSelector } from './context';
export type { CalendarActions } from './context';

// Built-in selectors. Pass these to `useCalendarSelector` for the common
// shapes; or write your own narrow `(s) => s.something` for anything bespoke.
export {
  selectCanConfirm,
  selectDays,
  selectMonths,
  selectYears,
} from './context';

// Snapshot + derived view types so consumers can type their own selectors.
export type {
  CalendarDays,
  CalendarMonthEntry,
  CalendarMonths,
  CalendarSnapshot,
  CalendarYears,
} from './store';

// Calendar systems — also available via sub-exports for tree-shaking.
export {
  createGregorianSystem,
  gregorianSystem,
  type GregorianDate,
  type GregorianSystemOptions,
} from './systems/gregorian';

// Public types.
export type {
  CalendarDateValue,
  CalendarMatcher,
  CalendarMode,
  CalendarModifiers,
  CalendarSelectionPayload,
  CalendarSystem,
  DateRange,
  DayCellInfo,
  DisabledDateInput,
  DisabledDateRangeInput,
  OnChange,
  OnClear,
  OnConfirm,
  Weekday,
} from './types';

// Optional grid utilities for advanced use cases.
export {
  ROWS,
  COLS,
  TOTAL_CELLS,
  YEAR_PAGE_SIZE,
  DEFAULT_FIRST_DAY_OF_WEEK,
  buildMonthGrid,
  getYearPage,
  isBetween,
  isExplicitlyDisabled,
  isoWeekNumber,
  matchDate,
  rotateWeekdayLabels,
  usedRows,
} from './utils/grid';
