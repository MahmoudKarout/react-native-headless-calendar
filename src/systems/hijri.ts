/**
 * Hijri (Umm al-Qura) calendar plugin.
 *
 * Pre-configured. Install the optional peer dependency once and import the
 * ready-to-use `hijriSystem` directly:
 *
 *   yarn add @tabby_ai/hijri-converter
 *
 *   import { hijriSystem } from "react-native-headless-calendar/systems/hijri";
 *   import { gregorianSystem } from "react-native-headless-calendar";
 *
 *   <SimpleCalendar systems={[gregorianSystem, hijriSystem]} />
 *
 * Importing this module without `@tabby_ai/hijri-converter` installed throws
 * a clear, install-pointing error at access time — the message you see is
 * the one below in `MISSING_CONVERTER_ERROR`.
 *
 * Need a different converter (`moment-hijri`, `Intl.DateTimeFormat`, custom
 * Umm al-Qura tables, …)? Wrap it in the `HijriConverter` shape and pass it
 * to `createHijriSystem({ converter })`. The auto-load only fires when you
 * omit the option, so a custom converter never triggers the require.
 *
 * To write a calendar system without going through this plugin at all,
 * implement the `CalendarSystem<T>` interface from
 * `react-native-headless-calendar` directly. See README ("Add your own
 * calendar") for the recipe.
 */
import type { CalendarSystem } from '../types';

import {
  gregorianJulianDay,
  gregorianSunday0Weekday,
} from './gregorianJulianMath';

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
// Factory options — every field is optional. Pass `converter` to plug in a
// custom implementation; omit it to auto-load `@tabby_ai/hijri-converter`.
// ---------------------------------------------------------------------------

export interface HijriSystemOptions {
  /**
   * Hijri ↔ Gregorian converter implementation.
   *
   * **Optional.** When omitted, the plugin tries to `require(
   * '@tabby_ai/hijri-converter')` and uses that. Provide your own to wrap
   * `moment-hijri`, an `Intl.DateTimeFormat`-based implementation, custom
   * Umm al-Qura tables, etc.
   *
   * Any object with `gregorianToHijri` and `hijriToGregorian` methods works.
   */
  converter?: HijriConverter;
  label?: string;
  monthLabels?: readonly string[];
  weekdayLabels?: readonly string[];
  formatDay?: (date: HijriDate) => string;
  formatMonthYear?: (date: HijriDate) => string;
}

const MISSING_CONVERTER_ERROR =
  '[react-native-headless-calendar/systems/hijri] could not load the default ' +
  'Hijri converter.\n\n' +
  'Either install the optional peer dependency:\n\n' +
  '    yarn add @tabby_ai/hijri-converter\n\n' +
  '…and use the ready-made instance:\n\n' +
  '    import { hijriSystem } from "react-native-headless-calendar/systems/hijri";\n\n' +
  '…or pass your own converter to the factory:\n\n' +
  '    import { createHijriSystem } from "react-native-headless-calendar/systems/hijri";\n' +
  '    const hijri = createHijriSystem({ converter: myConverter });\n\n' +
  'A custom converter only needs `gregorianToHijri` and `hijriToGregorian` ' +
  'methods (1-based months on both sides).';

// ---------------------------------------------------------------------------
// Default-converter loader — wraps the optional `require` so a missing
// peer dep surfaces as our friendly install-pointing error rather than
// Metro's terse "Unable to resolve module".
//
// The resolved value is shape-checked against `HijriConverter` before being
// returned; a partial / unexpected export throws the same friendly error
// instead of leaking deep into the system at first use.
// ---------------------------------------------------------------------------

const isHijriConverter = (mod: unknown): mod is HijriConverter =>
  typeof mod === 'object' &&
  mod !== null &&
  typeof (mod as HijriConverter).gregorianToHijri === 'function' &&
  typeof (mod as HijriConverter).hijriToGregorian === 'function';

const loadDefaultConverter = (): HijriConverter => {
  let mod: unknown;
  try {
    mod = require('@tabby_ai/hijri-converter');
  } catch {
    throw new Error(MISSING_CONVERTER_ERROR);
  }
  if (!isHijriConverter(mod)) {
    throw new Error(MISSING_CONVERTER_ERROR);
  }
  return mod;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const createHijriSystem = (
  options: HijriSystemOptions = {}
): CalendarSystem<HijriDate> => {
  // Resolve the converter: explicit override wins; otherwise auto-load the
  // optional peer dep. Both paths funnel through the same shape check so
  // an invalid converter never silently degrades to NaN-laced dates.
  const converter = options.converter ?? loadDefaultConverter();
  if (!isHijriConverter(converter)) {
    throw new Error(MISSING_CONVERTER_ERROR);
  }

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
      gregorianJulianDay(end.year, end.month, end.day) -
      gregorianJulianDay(start.year, start.month, start.day)
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
    weekday: (d) => gregorianSunday0Weekday(d.gy, d.gm, d.gd),
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

// ---------------------------------------------------------------------------
// Pre-configured instance — convenience export for the 80% case.
//
// Eager construction means a missing `@tabby_ai/hijri-converter` install
// throws with the friendly `MISSING_CONVERTER_ERROR` the moment this
// subpath is imported, instead of degrading silently or surfacing a
// terser bundler / runtime error at first use.
//
// Need overrides (custom labels, formatters, alternative converter)? Use
// `createHijriSystem(options)` instead — the eager instance only covers
// the zero-config path.
// ---------------------------------------------------------------------------

export const hijriSystem: CalendarSystem<HijriDate> = createHijriSystem();
