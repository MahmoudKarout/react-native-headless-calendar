/**
 * Default Gregorian calendar system.
 *
 * Zero dependencies — pure arithmetic. Internally represents a date as an
 * immutable [year, month, day] tuple. Hijri / Chinese / etc. systems live
 * in sibling files (or in consumer code) and never collide with this one.
 *
 * Pass `createGregorianSystem({ locale: 'en' })` to <Calendar.Root systems>.
 * Override `monthLabels` / `weekdayLabels` to plug in your own translations.
 */
import type { CalendarSystem } from '../types';

// ---------------------------------------------------------------------------
// Internal date representation — frozen tuple so no consumer can mutate.
// ---------------------------------------------------------------------------

export interface GregorianDate {
  readonly y: number;
  /** 0-based: 0 = January, 11 = December. */
  readonly m: number;
  /** 1-based day of month. */
  readonly d: number;
}

const make = (y: number, m: number, d: number): GregorianDate =>
  Object.freeze({ y, m, d });

// ---------------------------------------------------------------------------
// Pure-math helpers — no `new Date()` allocations on the hot path.
// ---------------------------------------------------------------------------

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const daysInMonth = (y: number, m: number): number => {
  if (m === 1) return isLeap(y) ? 29 : 28;
  /* istanbul ignore next — `?? 30` is a TS noUncheckedIndexedAccess fallback;
   * `m` is always 0..11 here. */
  return MONTH_LENGTHS[m] ?? 30;
};

// Sakamoto's algorithm — Sunday = 0, Saturday = 6.
const DOW_TABLE = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
const dayOfWeek = (y: number, m: number, d: number): number => {
  const yy = m < 2 ? y - 1 : y;
  /* istanbul ignore next — `?? 0` is a TS noUncheckedIndexedAccess fallback;
   * `m` is always 0..11 here. */
  const t = DOW_TABLE[m] ?? 0;
  return (
    (yy +
      Math.floor(yy / 4) -
      Math.floor(yy / 100) +
      Math.floor(yy / 400) +
      t +
      d) %
    7
  );
};

// ---------------------------------------------------------------------------
// Default labels (English). Override at construction for any other locale.
// ---------------------------------------------------------------------------

const DEFAULT_MONTHS = Object.freeze([
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const);

const DEFAULT_WEEKDAYS = Object.freeze([
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const);

// ---------------------------------------------------------------------------
// Factory — accepts overrides for label/format functions.
// ---------------------------------------------------------------------------

export interface GregorianSystemOptions {
  /** Override the human label for the system switcher. */
  label?: string;
  /** Override the 12 month names (ordered Jan..Dec). */
  monthLabels?: readonly string[];
  /** Override the 7 short weekday labels (ordered Sun..Sat). */
  weekdayLabels?: readonly string[];
  /** Override the day-cell text formatter (default: `String(day)`). */
  formatDay?: (date: GregorianDate) => string;
  /** Override the header label formatter (default: `"<MonthName> <Year>"`). */
  formatMonthYear?: (date: GregorianDate) => string;
}

export const createGregorianSystem = (
  options: GregorianSystemOptions = {}
): CalendarSystem<GregorianDate> => {
  const months = options.monthLabels ?? DEFAULT_MONTHS;
  const weekdays = options.weekdayLabels ?? DEFAULT_WEEKDAYS;
  const formatDay = options.formatDay ?? ((d) => String(d.d));
  const formatMonthYear =
    options.formatMonthYear ?? ((d) => `${months[d.m] ?? ''} ${d.y}`);

  return {
    id: 'gregorian',
    label: options.label ?? 'Gregorian',

    today() {
      const now = new Date();
      return make(now.getFullYear(), now.getMonth(), now.getDate());
    },

    fromNativeDate(date) {
      return make(date.getFullYear(), date.getMonth(), date.getDate());
    },

    from(input) {
      if (input == null) return this.today();
      if (input instanceof Date) return this.fromNativeDate(input);
      // Plain GregorianDate-shaped objects pass through.
      if (
        typeof input === 'object' &&
        input !== null &&
        'y' in input &&
        'm' in input &&
        'd' in input
      ) {
        const o = input as GregorianDate;
        return make(o.y, o.m, o.d);
      }
      // Anything with .toDate() (Moment, Dayjs, ...).
      if (
        typeof input === 'object' &&
        input !== null &&
        typeof (input as { toDate?: () => Date }).toDate === 'function'
      ) {
        return this.fromNativeDate((input as { toDate(): Date }).toDate());
      }
      // ISO strings and numeric timestamps.
      if (typeof input === 'string' || typeof input === 'number') {
        const parsed = new Date(input);
        if (!Number.isNaN(parsed.getTime())) return this.fromNativeDate(parsed);
      }
      return this.today();
    },

    year: (d) => d.y,
    month: (d) => d.m,
    day: (d) => d.d,
    weekday: (d) => dayOfWeek(d.y, d.m, d.d),
    daysInMonth: (d) => daysInMonth(d.y, d.m),

    withYear(d, year) {
      return make(year, d.m, Math.min(d.d, daysInMonth(year, d.m)));
    },

    withMonth(d, month) {
      let y = d.y;
      let m = month;
      while (m >= 12) {
        m -= 12;
        y += 1;
      }
      while (m < 0) {
        m += 12;
        y -= 1;
      }
      return make(y, m, Math.min(d.d, daysInMonth(y, m)));
    },

    withDay(d, day) {
      const max = daysInMonth(d.y, d.m);
      return make(d.y, d.m, Math.max(1, Math.min(day, max)));
    },

    addMonths(d, n) {
      const total = d.y * 12 + d.m + n;
      const y = Math.floor(total / 12);
      const m = ((total % 12) + 12) % 12;
      return make(y, m, Math.min(d.d, daysInMonth(y, m)));
    },

    addYears(d, n) {
      return make(d.y + n, d.m, Math.min(d.d, daysInMonth(d.y + n, d.m)));
    },

    isSame: (a, b) => a.y === b.y && a.m === b.m && a.d === b.d,
    isBefore: (a, b) => {
      if (a.y !== b.y) return a.y < b.y;
      if (a.m !== b.m) return a.m < b.m;
      return a.d < b.d;
    },
    isAfter: (a, b) => {
      if (a.y !== b.y) return a.y > b.y;
      if (a.m !== b.m) return a.m > b.m;
      return a.d > b.d;
    },

    monthLabels: () => months,
    weekdayLabels: () => weekdays,
    formatDay,
    formatMonthYear,

    toNativeDate: (d) => new Date(d.y, d.m, d.d),
  };
};

/** Convenience instance for consumers that don't need overrides. */
export const gregorianSystem = createGregorianSystem();
