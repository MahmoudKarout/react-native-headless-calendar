// ── Single-mode surface ────────────────────────────────────────────────────

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

// ── Range-mode surface ─────────────────────────────────────────────────────

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
  DisabledInRangeBehavior,
  RangeCalendarDays,
  RangeCalendarSnapshot,
  RangeDayCellInfo,
  RangeOnChange,
  RangeOnClear,
  RangeOnConfirm,
  RangeSelectionPayload,
} from './stores/RangeCalendarStore';

// ── Multiple-mode surface ──────────────────────────────────────────────────

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

// Shared types reused across modes.
export type {
  CalendarMatcher,
  CalendarModifiers,
  DateParts,
  DisabledDateInput,
  DisabledDateRangeInput,
  Weekday,
} from './types';

// Calendar systems — also available via sub-exports for tree-shaking.
export {
  createGregorianSystem,
  gregorianSystem,
  type GregorianDate,
  type GregorianSystemOptions,
} from './systems/gregorian';

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
