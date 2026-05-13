/**
 * react-native-fast-calendar — hooks-first public surface.
 *
 * The library is intentionally headless: there is one provider component
 * (<CalendarProvider>) and five hooks. Consumers bring their own UI.
 */

// Provider — the only required boundary for every hook below.
export { Root as CalendarProvider } from './components/Root';
export type { CalendarRootProps as CalendarProviderProps } from './components/Root';

// Public hooks.
export {
  useCalendarActions,
  useCalendarDays,
  useCalendarMonths,
  useCalendarSelector,
  useCalendarYears,
} from './context';
export type {
  CalendarActions,
  CalendarDays,
  CalendarMonthEntry,
  CalendarMonths,
  CalendarYears,
} from './context';

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
