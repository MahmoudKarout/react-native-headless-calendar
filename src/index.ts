/**
 * react-native-fast-calendar — public surface.
 *
 *   import { Calendar } from 'react-native-fast-calendar';
 *   import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
 *   // hijri lives in an opt-in sub-export — you bring the converter:
 *   import { createHijriSystem } from 'react-native-fast-calendar/systems/hijri';
 */
export { Calendar } from './Calendar';
export type { CalendarNamespace } from './Calendar';

// Compound parts — exported individually too, in case consumers prefer
// `import { Header } from 'react-native-fast-calendar'` over the namespace.
export { Root } from './components/Root';
export { Header } from './components/Header';
export { View } from './components/View';
export { DayCell, DayGrid } from './components/DayGrid';
export { MonthGrid } from './components/MonthGrid';
export { YearGrid } from './components/YearGrid';
export { SystemSwitcher } from './components/SystemSwitcher';

// Hooks for custom UI that needs to participate in calendar state.
export {
  useCalendarActions,
  useCalendarConfig,
  useCalendarLabels,
  useCalendarPrimitives,
  useCalendarSelector,
  useCalendarStore,
  useCalendarTheme,
} from './context';
export type { CalendarActions } from './context';

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
  buildMonthGrid,
  getYearPage,
  isBetween,
  isExplicitlyDisabled,
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
  IconProps,
  IconPrimitive,
  OnClear,
  OnConfirm,
  OnSystemChange,
  PressablePrimitive,
  TextPrimitive,
  ViewPrimitive,
} from './types';

// Root prop type — useful when wrapping <Calendar.Root> in a project preset.
export type { CalendarRootProps } from './components/Root';
