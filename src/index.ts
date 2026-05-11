/**
 * react-native-fast-calendar — public surface.
 *
 *   // Simple usage (zero config, batteries included):
 *   import { SimpleCalendar } from 'react-native-fast-calendar';
 *   <SimpleCalendar mode="single" onConfirm={({ date }) => console.log(date)} />
 *
 *   // Headless usage (full control over UI):
 *   import { Calendar, useCalendarNavigation } from 'react-native-fast-calendar';
 *   import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
 *
 * The library is headless by design, but ships `SimpleCalendar` for the 80%
 * use case. For full control, use `<Calendar.Root>` with the `useCalendar*`
 * hooks to wire your own buttons, layouts, and icons.
 */
export { Calendar } from './Calendar';
export type { CalendarNamespace } from './Calendar';

// SimpleCalendar — batteries-included calendar for quick usage.
// Also a compound component: SimpleCalendar.Header, .Footer, .Content
// for custom layouts that still use the themed primitives.
export { SimpleCalendar } from './components/SimpleCalendar';
export type {
  SimpleCalendarProps,
  SimpleCalendarContentProps,
} from './components/SimpleCalendar';

// The two stable rendered components — also exported individually for
// consumers that prefer named imports over the namespace.
export { Root } from './components/Root';
export {
  DayCell,
  DayGrid,
  SwipeableDayGrid,
  dayCellPropsEqual,
} from './components/DayGrid';

// Hooks — the headless surface. Compose into whatever UI you ship.
export {
  useCalendarActions,
  useCalendarComponents,
  useCalendarConfig,
  useCalendarFirstDayOfWeek,
  useCalendarHeader,
  useCalendarLabels,
  useCalendarMonthLabel,
  useCalendarMonthPicker,
  useCalendarNavigation,
  useCalendarSelectedDates,
  useCalendarSelector,
  useCalendarStore,
  useCalendarSystemSwitcher,
  useCalendarTheme,
  useCalendarWeekNumbers,
  useCalendarWeekdayLabels,
  useCalendarYearLabel,
  useCalendarYearPicker,
} from './context';
export type {
  CalendarActions,
  CalendarConfig,
  CalendarHeader,
  CalendarMonthLabel,
  CalendarMonthPicker,
  CalendarMonthPickerEntry,
  CalendarNavigation,
  CalendarSystemSwitcher,
  CalendarYearLabel,
  CalendarYearPicker,
} from './context';

// Store types for advanced consumers.
export type { CalendarSnapshot, CalendarStore } from './store';

// Defaults — re-exported so consumers can extend rather than reinvent.
export { darkTheme, defaultLabels, defaultTheme } from './defaults';

// Grid utilities for consumers building custom views.
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

// Calendar systems — also available via sub-exports for tree-shaking.
export {
  createGregorianSystem,
  gregorianSystem,
  type GregorianDate,
  type GregorianSystemOptions,
} from './systems/gregorian';

// Public types.
export type {
  CalendarComponents,
  CalendarDateValue,
  CalendarLabels,
  CalendarMatcher,
  CalendarMode,
  CalendarModifiers,
  CalendarSelectionPayload,
  CalendarSystem,
  CalendarTheme,
  CalendarThemeOverride,
  CalendarView,
  DateRange,
  DayCellInfo,
  DayRenderer,
  DisabledDateInput,
  DisabledDateRangeInput,
  MonthCaptionProps,
  OnClear,
  OnConfirm,
  OnSystemChange,
  Weekday,
  WeekdayCellProps,
  WeekdayHeaderProps,
  WeekNumberCellProps,
} from './types';

// Root prop type — useful when wrapping <Calendar.Root> in a project preset.
export type { CalendarRootProps } from './components/Root';

// DayGrid prop types.
export type {
  DayGridProps,
  SwipeableDayGridProps,
} from './components/DayGrid';
