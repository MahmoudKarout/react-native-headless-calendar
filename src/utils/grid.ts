/**
 * Calendar-system-agnostic grid math.
 *
 * Given a CalendarSystem and a "currently displayed" date, computes the 6x7
 * day grid (42 cells) that the day-view should render. Works for any system —
 * Gregorian, Hijri, Chinese, anything that satisfies the CalendarSystem
 * contract.
 */
import type { CalendarSystem, Weekday } from '../types';

export const ROWS = 6;
export const COLS = 7;
export const TOTAL_CELLS = ROWS * COLS;

export const YEAR_PAGE_SIZE = 12;

/** Default first column of the day grid — Sunday, matching the US convention. */
export const DEFAULT_FIRST_DAY_OF_WEEK: Weekday = 0;

export interface GridCell<T> {
  date: T;
  /** True if this cell falls inside the displayed month. */
  isCurrentMonth: boolean;
  /** Sequential index 0..41. */
  index: number;
}

/**
 * Rotate a Sunday-first weekday array so that `firstDayOfWeek` is at index 0.
 *
 * Used by both the built-in `WeekdayHeader` and the public
 * `useCalendarWeekdayLabels` hook so consumers building their own grids get
 * exactly the same column order the day cells are laid out in.
 *
 * Returns the input array as-is when no rotation is needed, so consumers can
 * memoise downstream off the returned identity.
 */
export function rotateWeekdayLabels<T>(
  labels: readonly T[],
  firstDayOfWeek: Weekday = DEFAULT_FIRST_DAY_OF_WEEK
): readonly T[] {
  if (firstDayOfWeek === 0) return labels;
  return labels.slice(firstDayOfWeek).concat(labels.slice(0, firstDayOfWeek));
}

/**
 * Build the 6x7 grid for the month containing `displayed`.
 *
 * Strategy:
 *   - Find the first day of `displayed`'s month.
 *   - Walk back to the previous `firstDayOfWeek` column (Sunday by default,
 *     Monday for most of Europe, Saturday in many MENA locales).
 *   - Step forward TOTAL_CELLS times using `system.addMonths`/`withDay`.
 *
 * For systems where day stepping is cheap (most), we use `withDay(d, day+1)`
 * within a month and `addMonths(d, 1) -> withDay(d, 1)` at boundaries.
 */
export function buildMonthGrid<T>(
  system: CalendarSystem<T>,
  displayed: T,
  firstDayOfWeek: Weekday = DEFAULT_FIRST_DAY_OF_WEEK
): GridCell<T>[] {
  const firstOfMonth = system.withDay(displayed, 1);
  // Wrap the difference into [0,7) so any starting weekday lines up correctly.
  const offset = (system.weekday(firstOfMonth) - firstDayOfWeek + 7) % 7;
  const lastDay = system.daysInMonth(displayed);

  const cells: GridCell<T>[] = new Array(TOTAL_CELLS);

  // Phase 1: previous month tail.
  if (offset > 0) {
    const prevMonth = system.addMonths(firstOfMonth, -1);
    const prevLast = system.daysInMonth(prevMonth);
    for (let i = 0; i < offset; i += 1) {
      cells[i] = {
        date: system.withDay(prevMonth, prevLast - offset + 1 + i),
        isCurrentMonth: false,
        index: i,
      };
    }
  }

  // Phase 2: current month.
  for (let day = 1; day <= lastDay; day += 1) {
    const idx = offset + day - 1;
    cells[idx] = {
      date: system.withDay(firstOfMonth, day),
      isCurrentMonth: true,
      index: idx,
    };
  }

  // Phase 3: next month head.
  const consumed = offset + lastDay;
  if (consumed < TOTAL_CELLS) {
    const nextMonth = system.addMonths(firstOfMonth, 1);
    for (let i = consumed; i < TOTAL_CELLS; i += 1) {
      cells[i] = {
        date: system.withDay(nextMonth, i - consumed + 1),
        isCurrentMonth: false,
        index: i,
      };
    }
  }

  return cells;
}

/**
 * Compute the 12-year window that contains `year`, aligned to YEAR_PAGE_SIZE.
 * E.g. for year 2027 → [2016..2027], for year 2028 → [2028..2039].
 */
export function getYearPage(year: number): number[] {
  const end = YEAR_PAGE_SIZE * Math.ceil(year / YEAR_PAGE_SIZE);
  let start = end === year ? end : end - YEAR_PAGE_SIZE;
  if (start < 0) start = 0;
  return Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => start + i);
}

/**
 * Inclusive range check using day granularity.
 */
export function isBetween<T>(
  system: CalendarSystem<T>,
  date: T,
  start: T | undefined,
  end: T | undefined
): boolean {
  if (!start || !end) return false;
  return !system.isBefore(date, start) && !system.isAfter(date, end);
}

/**
 * Check whether `date` is disabled by either an explicit list of dates or by
 * inclusive ranges. All inputs are normalised through the calendar system.
 */
export function isExplicitlyDisabled<T>(
  system: CalendarSystem<T>,
  date: T,
  disabledDates: readonly T[] | undefined,
  disabledRanges: readonly { start: T; end: T }[] | undefined
): boolean {
  if (disabledDates?.length) {
    for (const d of disabledDates) {
      if (system.isSame(date, d)) return true;
    }
  }
  if (disabledRanges?.length) {
    for (const r of disabledRanges) {
      if (isBetween(system, date, r.start, r.end)) return true;
    }
  }
  return false;
}
