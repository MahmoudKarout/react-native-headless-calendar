/**
 * react-native-fast-calendar — public surface.
 *
 *   import { Calendar, useCalendarNavigation } from 'react-native-fast-calendar';
 *   import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
 *   // hijri lives in an opt-in sub-export — you bring the converter:
 *   import { createHijriSystem } from 'react-native-fast-calendar/systems/hijri';
 *
 * The library is headless: the only rendered components it ships are
 * `<Calendar.Root>` (the provider) and `<Calendar.DayGrid>` (the 6×7 day
 * matrix). Everything else — the system switcher, the prev/next buttons,
 * the month/year header labels, and the month/year pickers — is a hook,
 * so the developer brings their own UI and wires it to the same store.
 */
export { Calendar } from './Calendar';
export type { CalendarNamespace } from './Calendar';

// The two stable rendered components — also exported individually for
// consumers that prefer named imports over the namespace.
export { Root } from './components/Root';
export { DayCell, DayGrid } from './components/DayGrid';

// Hooks — the headless surface. Compose into whatever UI you ship.
export {
  useCalendarActions,
  useCalendarConfig,
  useCalendarFirstDayOfWeek,
  useCalendarLabels,
  useCalendarMonthLabel,
  useCalendarMonthPicker,
  useCalendarNavigation,
  useCalendarSelector,
  useCalendarStore,
  useCalendarSystemSwitcher,
  useCalendarTheme,
  useCalendarWeekdayLabels,
  useCalendarYearLabel,
  useCalendarYearPicker,
} from './context';
export type {
  CalendarActions,
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
export { defaultLabels, defaultPrimitives, defaultTheme } from './defaults';

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
  rotateWeekdayLabels,
} from './utils/grid';

// Public types.
export type {
  CalendarDateValue,
  CalendarLabels,
  CalendarMode,
  CalendarPrimitives,
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
  OnClear,
  OnConfirm,
  OnSystemChange,
  PressablePrimitive,
  TextPrimitive,
  ViewPrimitive,
  Weekday,
} from './types';

// Root prop type — useful when wrapping <Calendar.Root> in a project preset.
export type { CalendarRootProps } from './components/Root';
