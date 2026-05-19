/**
 * Public type surface for react-native-fast-calendar.
 *
 * The package is a hooks-only library: there are no opinions about UI,
 * theming, labels, or copy. Everything is computed from the active
 * `CalendarSystem` and exposed as plain values via the public hooks.
 */

// ---------------------------------------------------------------------------
// CalendarDateValue — opaque per-system date value.
// ---------------------------------------------------------------------------

export type CalendarDateValue = unknown;

// ---------------------------------------------------------------------------
// CalendarSystem — adapter every calendar implementation must satisfy.
// ---------------------------------------------------------------------------

export interface CalendarSystem<T = CalendarDateValue> {
  /** Stable identifier, e.g. "gregorian", "hijri", "chinese". */
  readonly id: string;

  /** Human-readable label (used by consumers building system switchers). */
  readonly label: string;

  // -- construction -------------------------------------------------------
  today(): T;
  fromNativeDate(d: Date): T;
  from(input: unknown): T;

  // -- accessors ----------------------------------------------------------
  year(d: T): number;
  month(d: T): number;
  day(d: T): number;
  weekday(d: T): number;
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
  monthLabels(): readonly string[];
  weekdayLabels(): readonly string[];
  formatDay(d: T): string;
  formatMonthYear(d: T): string;

  /** Optional ISO-8601-style week number for `d`. */
  weekNumber?(d: T): number;

  // -- conversion ---------------------------------------------------------
  toNativeDate(d: T): Date;
}

// ---------------------------------------------------------------------------
// View / mode types
// ---------------------------------------------------------------------------

export type CalendarView = 'day' | 'month' | 'year';

export type CalendarMode = 'single' | 'range' | 'multiple';

/** 0 = Sunday, 1 = Monday, …, 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DateRange<T = CalendarDateValue> {
  start: T;
  end: T;
}

/**
 * Calendar-system-native date components surfaced on selection
 * payloads. Timezone-free and calendar-aware: values are the
 * `year` / `month` / `day` of the active `CalendarSystem` at the time
 * of the callback (i.e. for Hijri this is the Hijri year/month/day,
 * not the underlying Gregorian projection). Pair with `systemId` on
 * the payload to disambiguate.
 *
 * `month` is 0-based to match JavaScript's `Date#getMonth()`.
 */
export interface DateParts {
  /** Year in the active calendar system. */
  year: number;
  /** Month in the active calendar system, 0-based (0 = first month). */
  month: number;
  /** Day of the month in the active calendar system, 1-based. */
  day: number;
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
  /** Native JS Dates for every selected day in multiple mode. */
  dates?: Date[];
  /** Identifier of the active calendar system at the time of selection. */
  systemId: string;
}

export type OnConfirm = (payload: CalendarSelectionPayload) => void;
export type OnClear = () => void;
/**
 * Fires whenever the selection changes (any successful `selectDate` or
 * `clear`). Receives the full selection payload so consumers can wire it
 * directly into form state without a separate `useCalendarSelector`.
 */
export type OnChange = (payload: CalendarSelectionPayload) => void;

// ---------------------------------------------------------------------------
// Disabled dates / matchers
// ---------------------------------------------------------------------------

export type DisabledDateInput = unknown;

export interface DisabledDateRangeInput {
  start: DisabledDateInput;
  end: DisabledDateInput;
}

/**
 * Predicate or list of dates that selects a subset of the calendar's days.
 *
 * Used by the `disabled` prop on `<CalendarProvider>` and by every entry in
 * the `modifiers` map. Three shapes are supported uniformly:
 *
 *   - `readonly DisabledDateInput[]`        — match if any element is the same day
 *   - `readonly DisabledDateRangeInput[]`   — match if any inclusive range covers it
 *   - `(nativeDate: Date) => boolean`       — fully dynamic predicate
 */
export type CalendarMatcher =
  | readonly DisabledDateInput[]
  | readonly DisabledDateRangeInput[]
  | ((nativeDate: Date) => boolean);

/**
 * Map of named modifiers, e.g. `{ booked: [...], holiday: (d) => ... }`.
 * The store evaluates each matcher per cell and exposes the resulting
 * boolean flags on `DayCellInfo.modifiers` (reachable via
 * `useCalendarSelector(selectDays).cells`).
 */
export type CalendarModifiers = Readonly<Record<string, CalendarMatcher>>;

// ---------------------------------------------------------------------------
// Day cell metadata reachable via `useCalendarSelector(selectDays).cells`.
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
  /** True if the cell is selected (single, range endpoint, or multiple member). */
  isSelected: boolean;
  /** True if the cell is between range endpoints (range mode only). */
  inRange: boolean;
  /** True if the cell is the start of a selected range. */
  isRangeStart: boolean;
  /** True if the cell is the end of a selected range. */
  isRangeEnd: boolean;
  /** True if the cell is disabled (min/max bound, list, or `disabled` predicate). */
  isDisabled: boolean;
  /** Per-modifier flags. Empty `{}` when no modifiers are configured. */
  modifiers: Readonly<Record<string, boolean>>;
}

export interface CalendarMonthEntry {
  /** 0-based month index expected by `useCalendarActions().selectMonth`. */
  index: number;
  /** Localised name for that month, in the active system. */
  label: string;
}

export interface CalendarMonths {
  /** All 12 months for the active system. Identity-stable per system. */
  months: readonly CalendarMonthEntry[];
  /** 0-based index of the currently displayed month. */
  activeMonth: number;
}

export interface CalendarYears {
  /** Years on the page containing `activeYear` (length = YEAR_PAGE_SIZE). */
  years: readonly number[];
  /** Currently displayed year. */
  activeYear: number;
}
