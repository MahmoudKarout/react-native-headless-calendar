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

// ── Single-mode dedicated surface ──────────────────────────────────────────
// A type-narrowed alternative to <CalendarProvider mode="single">. Props
// that don't apply to single selection are absent at the type level;
// snapshot / payload shapes drop range- and multiple-only fields.

export { SingleDateProvider } from './components/SingleDateProvider';
export type { SingleDateProviderProps } from './components/SingleDateProvider';

export {
  selectSingleCanConfirm,
  selectSingleDays,
  selectSingleMonths,
  selectSingleYears,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from './contexts/single';
export type { SingleCalendarActions } from './contexts/single';

export type {
  SingleCalendarDays,
  SingleCalendarSnapshot,
  SingleDayCellInfo,
  SingleOnChange,
  SingleOnClear,
  SingleOnConfirm,
  SingleSelectionPayload,
} from './stores/SingleCalendarStore';

// ── Range-mode dedicated surface ───────────────────────────────────────────
// A type-narrowed alternative to <CalendarProvider mode="range">. Props
// that don't apply to range selection are absent at the type level;
// snapshot / payload shapes drop single- and multiple-only fields.

export { RangeDateProvider } from './components/RangeDateProvider';
export type { RangeDateProviderProps } from './components/RangeDateProvider';

export {
  selectRangeCanConfirm,
  selectRangeDays,
  selectRangeMonths,
  selectRangeYears,
  useRangeCalendarActions,
  useRangeCalendarSelector,
} from './contexts/range';
export type { RangeCalendarActions } from './contexts/range';

export type {
  RangeCalendarDays,
  RangeCalendarSnapshot,
  RangeDayCellInfo,
  RangeOnChange,
  RangeOnClear,
  RangeOnConfirm,
  RangeSelectionPayload,
} from './stores/RangeCalendarStore';

// ── Multiple-mode dedicated surface ────────────────────────────────────────
// A type-narrowed alternative to <CalendarProvider mode="multiple">.
// Props that don't apply to multi-pick are absent at the type level;
// snapshot / payload shapes drop single- and range-only fields.

export { MultipleDateProvider } from './components/MultipleDateProvider';
export type { MultipleDateProviderProps } from './components/MultipleDateProvider';

export {
  selectMultipleCanConfirm,
  selectMultipleDays,
  selectMultipleMonths,
  selectMultipleYears,
  useMultipleCalendarActions,
  useMultipleCalendarSelector,
} from './contexts/multiple';
export type { MultipleCalendarActions } from './contexts/multiple';

export type {
  MultipleCalendarDays,
  MultipleCalendarSnapshot,
  MultipleDayCellInfo,
  MultipleOnChange,
  MultipleOnClear,
  MultipleOnConfirm,
  MultipleSelectionPayload,
} from './stores/MultipleCalendarStore';

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
