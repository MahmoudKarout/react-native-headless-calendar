/**
 * Jalali (Persian / Solar Hijri / Khorshidi / Shamsi) calendar plugin.
 *
 * Pre-configured. Install the optional peer dependency once and import the
 * ready-to-use `jalaliSystem` directly:
 *
 *   yarn add moment-jalaali
 *
 *   import { jalaliSystem } from "react-native-fast-calendar/systems/jalali";
 *   import { gregorianSystem } from "react-native-fast-calendar";
 *
 *   <SimpleCalendar systems={[gregorianSystem, jalaliSystem]} />
 *
 * Importing this module without `moment-jalaali` installed throws a clear,
 * install-pointing error at access time — the message you see is the one
 * below in `MISSING_CONVERTER_ERROR`.
 *
 * Need a different converter (`jalaali-js`, `Intl.DateTimeFormat` with
 * `ca-persian`, custom astronomical tables, …)? Wrap it in the
 * `JalaliConverter` shape and pass it to `createJalaliSystem({ converter })`.
 * The auto-load only fires when you omit the option, so a custom converter
 * never triggers the require.
 *
 * To write a calendar system without going through this plugin at all,
 * implement the `CalendarSystem<T>` interface from
 * `react-native-fast-calendar` directly. See README ("Add your own
 * calendar") for the recipe.
 */
import type { CalendarSystem } from '../types';

import {
  gregorianJulianDay,
  gregorianSunday0Weekday,
} from './gregorianJulianMath';

// ---------------------------------------------------------------------------
// Converter contract — what the plugin needs from any Jalali converter.
//
// Both inputs and outputs use 1-based months, matching `jalaali-js`'s
// native API (the most common convention for Jalali libraries). The
// built-in `moment-jalaali` adapter below translates between this 1-based
// contract and `moment-jalaali`'s 0-based public API internally, so a
// consumer wrapping a different converter only needs to think in 1-based.
// ---------------------------------------------------------------------------

export interface JalaliConverter {
  gregorianToJalali(input: { year: number; month: number; day: number }): {
    year: number;
    month: number;
    day: number;
  };
  jalaliToGregorian(input: { year: number; month: number; day: number }): {
    year: number;
    month: number;
    day: number;
  };
}

// ---------------------------------------------------------------------------
// Internal date representation — paired Jalali + Gregorian tuple.
// Same strategy as the Hijri adapter: cache both sides so weekday lookups
// and `toNativeDate` round-trips are O(1) without a converter call.
// ---------------------------------------------------------------------------

export interface JalaliDate {
  /** Jalali year. */
  readonly jy: number;
  /** Jalali month, 0-based (0 = Farvardin, 11 = Esfand). */
  readonly jm: number;
  /** Jalali day, 1-based. */
  readonly jd: number;
  /** Cached Gregorian year. */
  readonly gy: number;
  /** Cached Gregorian month, 0-based. */
  readonly gm: number;
  /** Cached Gregorian day, 1-based. */
  readonly gd: number;
}

// ---------------------------------------------------------------------------
// Default labels — Latin-script transliteration. Override at construction
// for Persian script (`فروردین`, `اردیبهشت`, …) or any other locale.
// ---------------------------------------------------------------------------

const DEFAULT_JALALI_MONTHS = Object.freeze([
  'Farvardin',
  'Ordibehesht',
  'Khordad',
  'Tir',
  'Mordad',
  'Shahrivar',
  'Mehr',
  'Aban',
  'Azar',
  'Dey',
  'Bahman',
  'Esfand',
] as const);

// Sun..Sat order matches the rest of the library — `weekday()` is
// Gregorian-rooted (0 = Sunday). In Iran the working week starts on
// Saturday; consumers who want Saturday-first columns set
// `firstDayOfWeek` on `<Calendar.Root>` rather than re-ordering this list.
const DEFAULT_WEEKDAYS = Object.freeze([
  'Yek',
  'Do',
  'Se',
  'Cha',
  'Pan',
  'Jom',
  'Sha',
] as const);

// ---------------------------------------------------------------------------
// Factory options — every field is optional. Pass `converter` to plug in a
// custom implementation; omit it to auto-load `moment-jalaali`.
// ---------------------------------------------------------------------------

export interface JalaliSystemOptions {
  /**
   * Jalali ↔ Gregorian converter implementation.
   *
   * **Optional.** When omitted, the plugin tries to `require(
   * 'moment-jalaali')` and adapts its API to this 1-based contract.
   * Provide your own to wrap `jalaali-js`, an `Intl.DateTimeFormat`
   * `ca-persian` implementation, custom astronomical tables, etc.
   *
   * Any object with `gregorianToJalali` and `jalaliToGregorian` methods
   * works. Both sides use 1-based months on input and output.
   */
  converter?: JalaliConverter;
  label?: string;
  monthLabels?: readonly string[];
  weekdayLabels?: readonly string[];
  formatDay?: (date: JalaliDate) => string;
  formatMonthYear?: (date: JalaliDate) => string;
}

const MISSING_CONVERTER_ERROR =
  '[react-native-fast-calendar/systems/jalali] could not load the default ' +
  'Jalali converter.\n\n' +
  'Either install the optional peer dependency:\n\n' +
  '    yarn add moment-jalaali\n\n' +
  '…and use the ready-made instance:\n\n' +
  '    import { jalaliSystem } from "react-native-fast-calendar/systems/jalali";\n\n' +
  '…or pass your own converter to the factory:\n\n' +
  '    import { createJalaliSystem } from "react-native-fast-calendar/systems/jalali";\n' +
  '    const jalali = createJalaliSystem({ converter: myConverter });\n\n' +
  'A custom converter only needs `gregorianToJalali` and `jalaliToGregorian` ' +
  'methods (1-based months on both sides).';

// ---------------------------------------------------------------------------
// `moment-jalaali` adapter — translates the 0-based public API exposed at
// `moment.jConvert.{toJalaali,toGregorian}` to our 1-based `JalaliConverter`
// contract. Only used by the auto-load path; consumers passing their own
// converter never hit this code.
// ---------------------------------------------------------------------------

// Property-style arrow signatures (rather than method shorthand) so the
// type definitions are unambiguously type-only — keeps istanbul from
// instrumenting them as if they were value-level methods.
interface MomentJalaaliShape {
  jConvert: {
    toJalaali: (
      gy: number,
      gm: number,
      gd: number
    ) => { jy: number; jm: number; jd: number };
    toGregorian: (
      jy: number,
      jm: number,
      jd: number
    ) => { gy: number; gm: number; gd: number };
  };
}

// `moment-jalaali` exports a callable moment-factory function with the
// `jConvert` namespace hung off it as a property — accept both `object`
// and `function` mods so the shape check matches reality.
const isMomentJalaali = (mod: unknown): mod is MomentJalaaliShape => {
  if (mod == null || (typeof mod !== 'object' && typeof mod !== 'function')) {
    return false;
  }
  const jConvert = (mod as MomentJalaaliShape).jConvert;
  return (
    jConvert != null &&
    typeof jConvert === 'object' &&
    typeof jConvert.toJalaali === 'function' &&
    typeof jConvert.toGregorian === 'function'
  );
};

const adaptMomentJalaali = (mod: MomentJalaaliShape): JalaliConverter => ({
  gregorianToJalali({ year, month, day }) {
    const j = mod.jConvert.toJalaali(year, month - 1, day);
    return { year: j.jy, month: j.jm + 1, day: j.jd };
  },
  jalaliToGregorian({ year, month, day }) {
    const g = mod.jConvert.toGregorian(year, month - 1, day);
    return { year: g.gy, month: g.gm + 1, day: g.gd };
  },
});

// ---------------------------------------------------------------------------
// User-supplied-converter shape check — same contract as `JalaliConverter`,
// just guarded at runtime so a malformed object surfaces the friendly
// install-pointing error instead of NaN-laced dates.
// ---------------------------------------------------------------------------

const isJalaliConverter = (mod: unknown): mod is JalaliConverter =>
  typeof mod === 'object' &&
  mod !== null &&
  typeof (mod as JalaliConverter).gregorianToJalali === 'function' &&
  typeof (mod as JalaliConverter).jalaliToGregorian === 'function';

const loadDefaultConverter = (): JalaliConverter => {
  let mod: unknown;
  try {
    mod = require('moment-jalaali');
  } catch {
    throw new Error(MISSING_CONVERTER_ERROR);
  }
  if (!isMomentJalaali(mod)) {
    throw new Error(MISSING_CONVERTER_ERROR);
  }
  return adaptMomentJalaali(mod);
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const createJalaliSystem = (
  options: JalaliSystemOptions = {}
): CalendarSystem<JalaliDate> => {
  // Resolve the converter: explicit override wins; otherwise auto-load the
  // optional peer dep. Both paths funnel through the same shape check so
  // an invalid converter never silently degrades to NaN-laced dates.
  const converter = options.converter ?? loadDefaultConverter();
  if (!isJalaliConverter(converter)) {
    throw new Error(MISSING_CONVERTER_ERROR);
  }

  const months = options.monthLabels ?? DEFAULT_JALALI_MONTHS;
  const weekdays = options.weekdayLabels ?? DEFAULT_WEEKDAYS;
  const formatDay = options.formatDay ?? ((d: JalaliDate) => String(d.jd));
  const formatMonthYear =
    options.formatMonthYear ??
    ((d: JalaliDate) => `${months[d.jm] ?? ''} ${d.jy}`);

  const fromJalaliComponents = (
    jy: number,
    jm: number,
    jd: number
  ): JalaliDate => {
    const g = converter.jalaliToGregorian({ year: jy, month: jm + 1, day: jd });
    return Object.freeze({
      jy,
      jm,
      jd,
      gy: g.year,
      gm: g.month - 1,
      gd: g.day,
    });
  };

  const fromGregorianComponents = (
    gy: number,
    gm: number,
    gd: number
  ): JalaliDate => {
    const j = converter.gregorianToJalali({ year: gy, month: gm + 1, day: gd });
    return Object.freeze({
      jy: j.year,
      jm: j.month - 1,
      jd: j.day,
      gy,
      gm,
      gd,
    });
  };

  const jalaliMonthLength = (jy: number, jm: number): number => {
    const start = converter.jalaliToGregorian({
      year: jy,
      month: jm + 1,
      day: 1,
    });
    let nextJy = jy;
    let nextJm = jm + 1;
    if (nextJm >= 12) {
      nextJm = 0;
      nextJy += 1;
    }
    const end = converter.jalaliToGregorian({
      year: nextJy,
      month: nextJm + 1,
      day: 1,
    });
    return (
      gregorianJulianDay(end.year, end.month, end.day) -
      gregorianJulianDay(start.year, start.month, start.day)
    );
  };

  return {
    id: 'jalali',
    label: options.label ?? 'Jalali',

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
        'jy' in input &&
        'jm' in input &&
        'jd' in input
      ) {
        const o = input as JalaliDate;
        return fromJalaliComponents(o.jy, o.jm, o.jd);
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

    year: (d) => d.jy,
    month: (d) => d.jm,
    day: (d) => d.jd,
    weekday: (d) => gregorianSunday0Weekday(d.gy, d.gm, d.gd),
    daysInMonth: (d) => jalaliMonthLength(d.jy, d.jm),

    withYear(d, year) {
      const max = jalaliMonthLength(year, d.jm);
      return fromJalaliComponents(year, d.jm, Math.min(d.jd, max));
    },

    withMonth(d, month) {
      let jy = d.jy;
      let jm = month;
      while (jm >= 12) {
        jm -= 12;
        jy += 1;
      }
      while (jm < 0) {
        jm += 12;
        jy -= 1;
      }
      const max = jalaliMonthLength(jy, jm);
      return fromJalaliComponents(jy, jm, Math.min(d.jd, max));
    },

    withDay(d, day) {
      const max = jalaliMonthLength(d.jy, d.jm);
      return fromJalaliComponents(d.jy, d.jm, Math.max(1, Math.min(day, max)));
    },

    addMonths(d, n) {
      const total = d.jy * 12 + d.jm + n;
      const jy = Math.floor(total / 12);
      const jm = ((total % 12) + 12) % 12;
      const max = jalaliMonthLength(jy, jm);
      return fromJalaliComponents(jy, jm, Math.min(d.jd, max));
    },

    addYears(d, n) {
      const max = jalaliMonthLength(d.jy + n, d.jm);
      return fromJalaliComponents(d.jy + n, d.jm, Math.min(d.jd, max));
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
// Eager construction means a missing `moment-jalaali` install throws with
// the friendly `MISSING_CONVERTER_ERROR` the moment this subpath is
// imported, instead of degrading silently or surfacing a terser bundler /
// runtime error at first use.
//
// Need overrides (custom labels, formatters, alternative converter)? Use
// `createJalaliSystem(options)` instead — the eager instance only covers
// the zero-config path.
// ---------------------------------------------------------------------------

export const jalaliSystem: CalendarSystem<JalaliDate> = createJalaliSystem();
