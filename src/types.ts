/**
 * Public type surface for react-native-headless-calendar.
 *
 * The package is a hooks-only library: there are no opinions about UI,
 * theming, labels, or copy. Everything is computed from the active
 * `CalendarSystem` and exposed as plain values via the public hooks.
 */

export type CalendarDateValue = unknown;

export interface CalendarSystem<T = CalendarDateValue> {
  readonly id: string;
  readonly label: string;

  today(): T;
  fromNativeDate(d: Date): T;
  from(input: unknown): T;

  year(d: T): number;
  month(d: T): number;
  day(d: T): number;
  weekday(d: T): number;
  daysInMonth(d: T): number;

  withYear(d: T, year: number): T;
  withMonth(d: T, month: number): T;
  withDay(d: T, day: number): T;
  addMonths(d: T, n: number): T;
  addYears(d: T, n: number): T;

  isSame(a: T, b: T): boolean;
  isBefore(a: T, b: T): boolean;
  isAfter(a: T, b: T): boolean;

  monthLabels(): readonly string[];
  weekdayLabels(): readonly string[];
  formatDay(d: T): string;
  formatMonthYear(d: T): string;

  weekNumber?(d: T): number;

  toNativeDate(d: T): Date;
}

export type CalendarView = 'day' | 'month' | 'year';

/** 0 = Sunday, 1 = Monday, …, 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Calendar-system-native date components surfaced on selection payloads.
 * `month` is 0-based to match JavaScript's `Date#getMonth()`.
 */
export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export type DisabledDateInput = unknown;

export interface DisabledDateRangeInput {
  start: DisabledDateInput;
  end: DisabledDateInput;
}

/**
 * Predicate or list of dates that selects a subset of the calendar's days.
 * Used by provider `disabled` / `modifiers` props.
 */
export type CalendarMatcher =
  | readonly DisabledDateInput[]
  | readonly DisabledDateRangeInput[]
  | ((nativeDate: Date) => boolean);

export type CalendarModifiers = Readonly<Record<string, CalendarMatcher>>;

interface CalendarMonthEntry {
  index: number;
  label: string;
}

export interface CalendarMonths {
  months: readonly CalendarMonthEntry[];
  activeMonth: number;
}

export interface CalendarYears {
  years: readonly number[];
  activeYear: number;
}
