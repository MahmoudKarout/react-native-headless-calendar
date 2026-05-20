import type { CalendarDateValue } from '../types';

/** Fields every day-grid cell shares across selection modes. */
export interface BaseDayCellFields<T = CalendarDateValue> {
  date: T;
  nativeDate: Date;
  label: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isDisabled: boolean;
  modifiers: Readonly<Record<string, boolean>>;
}

/** Pre-derived day-grid view — identical shape for single / range / multiple. */
export interface CalendarDaysView<TCell> {
  weekdayLabels: readonly string[];
  cells: readonly TCell[];
  displayedMonthLabel: string;
  displayedYearLabel: string;
}
