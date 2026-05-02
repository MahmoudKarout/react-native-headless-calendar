/**
 * Hijri (Umm al-Qura) calendar plugin.
 *
 * **This plugin requires a Hijri ↔ Gregorian converter that you supply.**
 * The `react-native-fast-calendar` package itself has ZERO
 * converter dependency.
 *
 * Recommended converter — `@tabby_ai/hijri-converter` (~2KB, zero deps,
 * Umm al-Qura lookup tables):
 *
 *   yarn add @tabby_ai/hijri-converter
 *
 *   import * as converter from "@tabby_ai/hijri-converter";
 *   import { createHijriSystem } from "react-native-fast-calendar/systems/hijri";
 *
 *   const hijri = createHijriSystem({ converter });
 *
 * Any object satisfying the `HijriConverter` interface works — wrap
 * `moment-hijri`, an `Intl.DateTimeFormat`-based implementation, custom
 * Umm al-Qura tables, etc. Calling `createHijriSystem` without a converter
 * throws a clear error pointing at this docstring.
 *
 * To write a custom calendar system without using this Hijri plugin,
 * implement the `CalendarSystem<T>` interface from
 * `react-native-fast-calendar` directly. See README
 * ("Add your own calendar") for the recipe.
 */
import type { CalendarSystem } from '../types';

// ---------------------------------------------------------------------------
// Converter contract — what the plugin needs from any Hijri converter.
//
// Both inputs and outputs use 1-based months, matching `@tabby_ai/hijri-
// converter`'s native API. If you wrap a converter that uses a different
// convention, do the +/-1 mapping inside your wrapper.
// ---------------------------------------------------------------------------

export interface HijriConverter {
  gregorianToHijri(input: { year: number; month: number; day: number }): {
    year: number;
    month: number;
    day: number;
  };
  hijriToGregorian(input: { year: number; month: number; day: number }): {
    year: number;
    month: number;
    day: number;
  };
}

// ---------------------------------------------------------------------------
// Internal date representation — paired Hijri + Gregorian tuple.
// We cache both so day-of-week and native-Date conversion are O(1) without
// re-running the converter.
// ---------------------------------------------------------------------------

export interface HijriDate {
  /** Hijri year. */
  readonly hy: number;
  /** Hijri month, 0-based (0 = Muharram, 11 = Dhul-Hijjah). */
  readonly hm: number;
  /** Hijri day, 1-based. */
  readonly hd: number;
  /** Cached Gregorian year. */
  readonly gy: number;
  /** Cached Gregorian month, 0-based. */
  readonly gm: number;
  /** Cached Gregorian day, 1-based. */
  readonly gd: number;
}

// ---------------------------------------------------------------------------
// Default labels — English transliteration. Override at construction.
// ---------------------------------------------------------------------------

const DEFAULT_HIJRI_MONTHS = Object.freeze([
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhul-Qa'dah",
  'Dhul-Hijjah',
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
// Factory options — `converter` is required. Everything else is optional.
// ---------------------------------------------------------------------------

export interface HijriSystemOptions {
  /**
   * Hijri ↔ Gregorian converter implementation. **Required.**
   *
   * Recommended:
   *
   *   yarn add @tabby_ai/hijri-converter
   *
   *   import * as converter from "@tabby_ai/hijri-converter";
   *   import { createHijriSystem } from "react-native-fast-calendar/systems/hijri";
   *   createHijriSystem({ converter });
   */
  converter: HijriConverter;
  label?: string;
  monthLabels?: readonly string[];
  weekdayLabels?: readonly string[];
  formatDay?: (date: HijriDate) => string;
  formatMonthYear?: (date: HijriDate) => string;
}

const MISSING_CONVERTER_ERROR =
  '[react-native-fast-calendar/systems/hijri] createHijriSystem ' +
  'requires a `converter` option.\n\n' +
  'Install a Hijri converter and pass it in:\n\n' +
  '  yarn add @tabby_ai/hijri-converter\n\n' +
  '  import * as converter from "@tabby_ai/hijri-converter";\n' +
  '  import { createHijriSystem } from "react-native-fast-calendar/systems/hijri";\n' +
  '  const hijri = createHijriSystem({ converter });\n\n' +
  'Any object with `gregorianToHijri` and `hijriToGregorian` methods works.';

// ---------------------------------------------------------------------------
// Pure-math helpers — only need the cached Gregorian components.
// ---------------------------------------------------------------------------

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

const julianDay = (y: number, m: number, d: number): number => {
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mo + 2) / 5) +
    365 * yr +
    Math.floor(yr / 4) -
    Math.floor(yr / 100) +
    Math.floor(yr / 400) -
    32045
  );
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const createHijriSystem = (
  options: HijriSystemOptions
): CalendarSystem<HijriDate> => {
  // Loud, helpful error if the consumer forgot to install + inject the
  // converter. Triggers at construction (module load time in most apps),
  // never deep inside a render.
  if (
    !options ||
    !options.converter ||
    typeof options.converter.gregorianToHijri !== 'function' ||
    typeof options.converter.hijriToGregorian !== 'function'
  ) {
    throw new Error(MISSING_CONVERTER_ERROR);
  }

  const { converter } = options;
  const months = options.monthLabels ?? DEFAULT_HIJRI_MONTHS;
  const weekdays = options.weekdayLabels ?? DEFAULT_WEEKDAYS;
  const formatDay = options.formatDay ?? ((d: HijriDate) => String(d.hd));
  const formatMonthYear =
    options.formatMonthYear ??
    ((d: HijriDate) => `${months[d.hm] ?? ''} ${d.hy}`);

  const fromHijriComponents = (
    hy: number,
    hm: number,
    hd: number
  ): HijriDate => {
    const g = converter.hijriToGregorian({ year: hy, month: hm + 1, day: hd });
    return Object.freeze({
      hy,
      hm,
      hd,
      gy: g.year,
      gm: g.month - 1,
      gd: g.day,
    });
  };

  const fromGregorianComponents = (
    gy: number,
    gm: number,
    gd: number
  ): HijriDate => {
    const h = converter.gregorianToHijri({ year: gy, month: gm + 1, day: gd });
    return Object.freeze({
      hy: h.year,
      hm: h.month - 1,
      hd: h.day,
      gy,
      gm,
      gd,
    });
  };

  const hijriMonthLength = (hy: number, hm: number): number => {
    const start = converter.hijriToGregorian({
      year: hy,
      month: hm + 1,
      day: 1,
    });
    let nextHy = hy;
    let nextHm = hm + 1;
    if (nextHm >= 12) {
      nextHm = 0;
      nextHy += 1;
    }
    const end = converter.hijriToGregorian({
      year: nextHy,
      month: nextHm + 1,
      day: 1,
    });
    return (
      julianDay(end.year, end.month, end.day) -
      julianDay(start.year, start.month, start.day)
    );
  };

  return {
    id: 'hijri',
    label: options.label ?? 'Hijri',

    today() {
      const now = new Date();
      return fromGregorianComponents(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
    },

    fromNativeDate(date) {
      return fromGregorianComponents(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
    },

    from(input) {
      if (input == null) return this.today();
      if (input instanceof Date) return this.fromNativeDate(input);
      if (
        typeof input === 'object' &&
        input !== null &&
        'hy' in input &&
        'hm' in input &&
        'hd' in input
      ) {
        const o = input as HijriDate;
        return fromHijriComponents(o.hy, o.hm, o.hd);
      }
      if (
        typeof input === 'object' &&
        input !== null &&
        typeof (input as { toDate?: () => Date }).toDate === 'function'
      ) {
        return this.fromNativeDate((input as { toDate(): Date }).toDate());
      }
      if (typeof input === 'string' || typeof input === 'number') {
        const parsed = new Date(input);
        if (!Number.isNaN(parsed.getTime())) return this.fromNativeDate(parsed);
      }
      return this.today();
    },

    year: (d) => d.hy,
    month: (d) => d.hm,
    day: (d) => d.hd,
    weekday: (d) => dayOfWeek(d.gy, d.gm, d.gd),
    daysInMonth: (d) => hijriMonthLength(d.hy, d.hm),

    withYear(d, year) {
      const max = hijriMonthLength(year, d.hm);
      return fromHijriComponents(year, d.hm, Math.min(d.hd, max));
    },

    withMonth(d, month) {
      let hy = d.hy;
      let hm = month;
      while (hm >= 12) {
        hm -= 12;
        hy += 1;
      }
      while (hm < 0) {
        hm += 12;
        hy -= 1;
      }
      const max = hijriMonthLength(hy, hm);
      return fromHijriComponents(hy, hm, Math.min(d.hd, max));
    },

    withDay(d, day) {
      const max = hijriMonthLength(d.hy, d.hm);
      return fromHijriComponents(d.hy, d.hm, Math.max(1, Math.min(day, max)));
    },

    addMonths(d, n) {
      const total = d.hy * 12 + d.hm + n;
      const hy = Math.floor(total / 12);
      const hm = ((total % 12) + 12) % 12;
      const max = hijriMonthLength(hy, hm);
      return fromHijriComponents(hy, hm, Math.min(d.hd, max));
    },

    addYears(d, n) {
      const max = hijriMonthLength(d.hy + n, d.hm);
      return fromHijriComponents(d.hy + n, d.hm, Math.min(d.hd, max));
    },

    isSame: (a, b) => a.gy === b.gy && a.gm === b.gm && a.gd === b.gd,
    isBefore: (a, b) => {
      if (a.gy !== b.gy) return a.gy < b.gy;
      if (a.gm !== b.gm) return a.gm < b.gm;
      return a.gd < b.gd;
    },
    isAfter: (a, b) => {
      if (a.gy !== b.gy) return a.gy > b.gy;
      if (a.gm !== b.gm) return a.gm > b.gm;
      return a.gd > b.gd;
    },

    monthLabels: () => months,
    weekdayLabels: () => weekdays,
    formatDay,
    formatMonthYear,

    toNativeDate: (d) => new Date(d.gy, d.gm, d.gd),
  };
};
