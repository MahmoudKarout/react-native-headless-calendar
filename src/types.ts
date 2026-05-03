/**
 * Public type surface for react-native-fast-calendar.
 *
 * The package is intentionally agnostic about:
 *   - which calendar system you use (Gregorian, Hijri, Chinese, ...)
 *   - how strings are localised
 *   - how state is themed
 *
 * Everything is injected through the <Calendar.Root> provider.
 */

import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// CalendarDateValue — opaque per-system date value.
//
// The calendar core never inspects this directly. It is passed through the
// CalendarSystem adapter for every operation. A system implementor decides
// what shape best represents a date in their calendar (an immutable class,
// a tuple, a plain object, etc.).
// ---------------------------------------------------------------------------

export type CalendarDateValue = unknown;

// ---------------------------------------------------------------------------
// CalendarSystem — the adapter interface every calendar implementation
// must satisfy. The default Gregorian adapter is shipped at
// `react-native-fast-calendar/systems/gregorian`. A Hijri adapter
// is shipped at `react-native-fast-calendar/systems/hijri` — it
// has no converter dependency; you install + inject one (see that file).
//
// Consumers can implement their own (Chinese, Ethiopian, Persian, ...) by
// providing this interface to <Calendar.Root systems={[...]}>.
// ---------------------------------------------------------------------------

export interface CalendarSystem<T = CalendarDateValue> {
  /** Stable identifier, e.g. "gregorian", "hijri", "chinese". */
  readonly id: string;

  /** Human-readable label for the system switcher. */
  readonly label: string;

  // -- construction -------------------------------------------------------

  /** Today, in this system. */
  today(): T;

  /** Construct from a native JS Date. */
  fromNativeDate(d: Date): T;

  /**
   * Best-effort construction from any external value the consumer may pass
   * to props (Date, Moment, Dayjs, ISO string, ...). Implementors may
   * narrow this to whatever subset they support.
   */
  from(input: unknown): T;

  // -- accessors ----------------------------------------------------------

  /** Year number, in this system. */
  year(d: T): number;
  /** Month index (0-based: 0 = first month). */
  month(d: T): number;
  /** Day-of-month (1-based). */
  day(d: T): number;
  /** Day-of-week (0 = Sunday, 6 = Saturday). */
  weekday(d: T): number;
  /** Number of days in `d`'s month. */
  daysInMonth(d: T): number;

  // -- navigation ---------------------------------------------------------

  withYear(d: T, year: number): T;
  withMonth(d: T, month: number): T;
  withDay(d: T, day: number): T;
  addMonths(d: T, n: number): T;
  addYears(d: T, n: number): T;

  // -- comparison (day granularity) --------------------------------------

  isSame(a: T, b: T): boolean;
  isBefore(a: T, b: T): boolean;
  isAfter(a: T, b: T): boolean;

  // -- labels (already localised by the consumer) ------------------------

  /** Localised month names, ordered 0..N-1. */
  monthLabels(): readonly string[];

  /** Localised short weekday labels, indexed by `weekday()` (0..6). */
  weekdayLabels(): readonly string[];

  /** Cell label for a day (usually `String(day(d))`). */
  formatDay(d: T): string;

  /** Full label for the header, e.g. "May 2024" or "Ramadan 1446". */
  formatMonthYear(d: T): string;

  // -- conversion ---------------------------------------------------------

  /** Convert to a native JS Date for external callbacks. */
  toNativeDate(d: T): Date;
}

// ---------------------------------------------------------------------------
// View / mode types
// ---------------------------------------------------------------------------

export type CalendarView = 'day' | 'month' | 'year';

export type CalendarMode = 'single' | 'range';

/**
 * Day-of-week index, matching `CalendarSystem.weekday()`:
 *   0 = Sunday, 1 = Monday, …, 6 = Saturday.
 *
 * Use as the `firstDayOfWeek` prop on `<Calendar.Root>` to pick which
 * column the day grid (and its header) starts at — Sunday in the US,
 * Monday in most of Europe, Saturday in many MENA locales, etc.
 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DateRange<T = CalendarDateValue> {
  start: T;
  end: T;
}

// ---------------------------------------------------------------------------
// Theme tokens — small, opinionated set covering everything a calendar needs.
// Override per-installation. No design-system coupling.
// ---------------------------------------------------------------------------

export interface CalendarTheme {
  colors: {
    background: string;
    primary: string;
    onPrimary: string;
    text: string;
    textMuted: string;
    todayBorder: string;
    rangeBackground: string;
    disabled: string;
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  cellSize: number;
  borderRadius: number;
  fontSize: {
    day: number;
    weekday: number;
    header: number;
  };
}

/**
 * Deep-partial of {@link CalendarTheme}. The nested `colors`, `spacing`,
 * and `fontSize` records are merged with the defaults at the leaf level,
 * so consumers can override a single token (e.g. `{ colors: { primary } }`)
 * without restating every other one.
 */
export interface CalendarThemeOverride {
  colors?: Partial<CalendarTheme['colors']>;
  spacing?: Partial<CalendarTheme['spacing']>;
  fontSize?: Partial<CalendarTheme['fontSize']>;
  cellSize?: number;
  borderRadius?: number;
}

// ---------------------------------------------------------------------------
// Labels — every user-facing string. Inject your translations.
// ---------------------------------------------------------------------------

export interface CalendarLabels {
  prev: string;
  next: string;
  confirm: string;
  clear: string;
  selectMonth: string;
  selectYear: string;
}

// ---------------------------------------------------------------------------
// External callbacks
// ---------------------------------------------------------------------------

export interface CalendarSelectionPayload {
  /** Native JS Date for the selected day in single mode. */
  date?: Date;
  /** Native JS Date for the start of the selected range. */
  startDate?: Date;
  /** Native JS Date for the end of the selected range. */
  endDate?: Date;
  /** Identifier of the active calendar system at the time of selection. */
  systemId: string;
}

export type OnConfirm = (payload: CalendarSelectionPayload) => void;
export type OnClear = () => void;
export type OnSystemChange = (systemId: string) => void;

// ---------------------------------------------------------------------------
// Disabled dates — accept anything the active system can normalise.
// ---------------------------------------------------------------------------

export type DisabledDateInput = unknown;

export interface DisabledDateRangeInput {
  start: DisabledDateInput;
  end: DisabledDateInput;
}

// ---------------------------------------------------------------------------
// Day cell metadata exposed to custom renderers via render props.
// ---------------------------------------------------------------------------

export interface DayCellInfo<T = CalendarDateValue> {
  /** Date value in the active calendar system. */
  date: T;
  /** Native JS Date — convenient for downstream comparisons. */
  nativeDate: Date;
  /** Label to show inside the cell (e.g. "12"). */
  label: string;
  /** True if the cell falls within the currently displayed month. */
  isCurrentMonth: boolean;
  /** True if the cell represents today. */
  isToday: boolean;
  /** True if the cell is selected (single mode or one of range endpoints). */
  isSelected: boolean;
  /** True if the cell is between range endpoints (range mode only). */
  inRange: boolean;
  /** True if the cell is the start of a selected range. */
  isRangeStart: boolean;
  /** True if the cell is the end of a selected range. */
  isRangeEnd: boolean;
  /** True if the cell is disabled (min/max bound or explicit disable list). */
  isDisabled: boolean;
}

export type DayRenderer<T = CalendarDateValue> = (
  info: DayCellInfo<T>
) => ReactNode;
