import {
  createJalaliSystem,
  jalaliSystem,
  type JalaliConverter,
  type JalaliDate,
} from '../../systems/jalali';

/**
 * Deterministic stub converter — uses a fixed reference epoch so the entire
 * suite runs without depending on third-party tables.
 *
 * 2024-05-15 (Gregorian) is treated as 1403-02-26 (Jalali); ±1 day in
 * Gregorian corresponds to ±1 day in Jalali. Stub Jalali months are 30
 * days. This is enough to exercise the system surface deterministically
 * without coupling the test to the real `moment-jalaali` algorithm.
 */
const REF_GREG = { year: 2024, month: 5, day: 15 };
const REF_JALALI = { year: 1403, month: 2, day: 26 };
const JALALI_MONTH_LEN = 30;

const julianFromGreg = (y: number, m: number, d: number): number => {
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

const gregFromJulian = (
  j: number
): { year: number; month: number; day: number } => {
  const a = j + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
};

const refJulian = julianFromGreg(REF_GREG.year, REF_GREG.month, REF_GREG.day);
const jalaliToOrdinal = (y: number, m: number, d: number): number =>
  ((y - REF_JALALI.year) * 12 + (m - REF_JALALI.month)) * JALALI_MONTH_LEN +
  (d - REF_JALALI.day);

const stubConverter: JalaliConverter = {
  jalaliToGregorian({ year, month, day }) {
    const julian = refJulian + jalaliToOrdinal(year, month, day);
    return gregFromJulian(julian);
  },
  gregorianToJalali({ year, month, day }) {
    const julian = julianFromGreg(year, month, day);
    const ordinal = julian - refJulian;
    let total =
      (REF_JALALI.year * 12 + (REF_JALALI.month - 1)) * JALALI_MONTH_LEN +
      (REF_JALALI.day - 1) +
      ordinal;
    const jd = (total % JALALI_MONTH_LEN) + 1;
    total = Math.floor(total / JALALI_MONTH_LEN);
    const jm = (total % 12) + 1;
    const jy = Math.floor(total / 12);
    return { year: jy, month: jm, day: jd };
  },
};

describe('createJalaliSystem() — guard rails', () => {
  it('throws when the user-supplied converter is missing gregorianToJalali', () => {
    expect(() =>
      createJalaliSystem({
        converter: {
          jalaliToGregorian: stubConverter.jalaliToGregorian,
        } as unknown as JalaliConverter,
      })
    ).toThrow(/yarn add moment-jalaali/);
  });

  it('throws when the user-supplied converter is missing jalaliToGregorian', () => {
    expect(() =>
      createJalaliSystem({
        converter: {
          gregorianToJalali: stubConverter.gregorianToJalali,
        } as unknown as JalaliConverter,
      })
    ).toThrow(/yarn add moment-jalaali/);
  });
});

// `moment-jalaali` is installed as a (test-only) devDependency, so this
// suite exercises the zero-config `createJalaliSystem()` / `jalaliSystem`
// paths against the real converter module — the same path consumers hit
// when they install the optional peer dep. The deliberate missing-dep +
// malformed-dep scenarios live in the standalone `jalali.peer.test.ts`
// file because they need a top-level `jest.mock`.
describe('createJalaliSystem() — auto-loaded `moment-jalaali`', () => {
  it('builds a working system with no arguments', () => {
    const sys = createJalaliSystem();
    expect(sys.id).toBe('jalali');
    // 2024-03-20 is the canonical Nowruz of 1403 (Farvardin 1).
    const nowruz = sys.fromNativeDate(new Date(2024, 2, 20));
    expect(sys.year(nowruz)).toBe(1403);
    expect(sys.month(nowruz)).toBe(0);
    expect(sys.day(nowruz)).toBe(1);
  });

  it('exports a pre-configured `jalaliSystem` instance', () => {
    expect(jalaliSystem.id).toBe('jalali');
    expect(jalaliSystem.label).toBe('Jalali');
    const nowruz = jalaliSystem.fromNativeDate(new Date(2024, 2, 20));
    expect(jalaliSystem.year(nowruz)).toBe(1403);
  });

  // Round-tripping a Jalali-shaped date through the auto-loaded converter
  // exercises the `jalaliToGregorian` half of the `moment-jalaali` adapter
  // (the `fromNativeDate` test above only hits `gregorianToJalali`).
  it('round-trips Jalali → Gregorian via the auto-loaded adapter', () => {
    const sys = createJalaliSystem();
    // Farvardin 1, 1403 — Nowruz, the Persian new year.
    const nowruz = sys.from({ jy: 1403, jm: 0, jd: 1 });
    const native = sys.toNativeDate(nowruz);
    expect(native.getFullYear()).toBe(2024);
    expect(native.getMonth()).toBe(2);
    expect(native.getDate()).toBe(20);
  });
});

describe('createJalaliSystem() — surface', () => {
  const sys = createJalaliSystem({ converter: stubConverter });

  it('uses the canonical id "jalali" and the default label', () => {
    expect(sys.id).toBe('jalali');
    expect(sys.label).toBe('Jalali');
  });

  it('honours a custom label', () => {
    expect(
      createJalaliSystem({ converter: stubConverter, label: 'شمسی' }).label
    ).toBe('شمسی');
  });

  it('today() honours the current Date', () => {
    const t = sys.today();
    const real = new Date();
    const native = sys.toNativeDate(t);
    expect(native.getFullYear()).toBe(real.getFullYear());
    expect(native.getMonth()).toBe(real.getMonth());
    expect(native.getDate()).toBe(real.getDate());
  });

  it('fromNativeDate caches the gregorian components', () => {
    const d = sys.fromNativeDate(
      new Date(REF_GREG.year, REF_GREG.month - 1, REF_GREG.day)
    );
    expect(sys.year(d)).toBe(REF_JALALI.year);
    expect(sys.month(d)).toBe(REF_JALALI.month - 1);
    expect(sys.day(d)).toBe(REF_JALALI.day);
  });

  it('round-trips a date through toNativeDate / fromNativeDate', () => {
    const d = sys.fromNativeDate(new Date(2024, 4, 15));
    const native = sys.toNativeDate(d);
    const d2 = sys.fromNativeDate(native);
    expect(sys.isSame(d, d2)).toBe(true);
  });

  describe('from() coercion', () => {
    it('returns today() for nullish input', () => {
      const t = sys.today();
      expect(sys.isSame(sys.from(null), t)).toBe(true);
      expect(sys.isSame(sys.from(undefined), t)).toBe(true);
    });

    it('coerces native Dates', () => {
      const d = sys.from(new Date(2024, 4, 15));
      expect(sys.year(d)).toBe(REF_JALALI.year);
    });

    it('passes Jalali-shaped objects through the converter', () => {
      const d = sys.from({
        jy: REF_JALALI.year,
        jm: REF_JALALI.month - 1,
        jd: REF_JALALI.day,
      });
      expect(sys.year(d)).toBe(REF_JALALI.year);
      expect(sys.month(d)).toBe(REF_JALALI.month - 1);
      expect(sys.day(d)).toBe(REF_JALALI.day);
    });

    it('honours objects with toDate()', () => {
      const d = sys.from({
        toDate: () => new Date(REF_GREG.year, REF_GREG.month - 1, REF_GREG.day),
      });
      expect(sys.day(d)).toBe(REF_JALALI.day);
    });

    it('parses ISO strings', () => {
      const d = sys.from('2024-05-15T00:00:00');
      expect(sys.year(d)).toBe(REF_JALALI.year);
    });

    it('parses numeric timestamps', () => {
      const ms = new Date(
        REF_GREG.year,
        REF_GREG.month - 1,
        REF_GREG.day
      ).getTime();
      const d = sys.from(ms);
      expect(sys.day(d)).toBe(REF_JALALI.day);
    });

    it('falls back to today() for malformed strings', () => {
      const t = sys.today();
      expect(sys.isSame(sys.from('zzz'), t)).toBe(true);
    });

    it('falls back to today() for unrecognised objects', () => {
      const t = sys.today();
      expect(sys.isSame(sys.from({ random: true }), t)).toBe(true);
    });

    it('falls back to today() for primitives outside string|number', () => {
      const t = sys.today();
      expect(sys.isSame(sys.from(true), t)).toBe(true);
    });
  });

  describe('navigation & accessors', () => {
    const ref = sys.fromNativeDate(
      new Date(REF_GREG.year, REF_GREG.month - 1, REF_GREG.day)
    );

    it('weekday() uses the cached Gregorian components', () => {
      // 2024-05-15 was a Wednesday → 3.
      expect(sys.weekday(ref)).toBe(3);
    });

    it('weekday() handles Jan/Feb (the m<2 dayOfWeek branch)', () => {
      const jan = sys.fromNativeDate(new Date(2024, 0, 15));
      const feb = sys.fromNativeDate(new Date(2024, 1, 29));
      expect(typeof sys.weekday(jan)).toBe('number');
      expect(typeof sys.weekday(feb)).toBe('number');
    });

    it('daysInMonth() returns 30 with the stub converter', () => {
      expect(sys.daysInMonth(ref)).toBe(JALALI_MONTH_LEN);
    });

    it('withYear preserves month, clamps day', () => {
      const d = sys.withYear(ref, REF_JALALI.year + 1);
      expect(sys.year(d)).toBe(REF_JALALI.year + 1);
      expect(sys.month(d)).toBe(REF_JALALI.month - 1);
    });

    it('withMonth wraps positive month values into the next year', () => {
      const d = sys.withMonth(ref, 14);
      expect(sys.year(d)).toBe(REF_JALALI.year + 1);
      expect(sys.month(d)).toBe(2);
    });

    it('withMonth wraps negative month values into the previous year', () => {
      const d = sys.withMonth(ref, -2);
      expect(sys.year(d)).toBe(REF_JALALI.year - 1);
      expect(sys.month(d)).toBe(10);
    });

    it('withDay clamps zero/negative days to 1', () => {
      expect(sys.day(sys.withDay(ref, 0))).toBe(1);
      expect(sys.day(sys.withDay(ref, -5))).toBe(1);
    });

    it('withDay clamps days greater than month length to max', () => {
      expect(sys.day(sys.withDay(ref, 99))).toBe(JALALI_MONTH_LEN);
    });

    it('addMonths walks forward across years', () => {
      const d = sys.addMonths(ref, 14);
      // ref: jy=1403, jm=1 (0-based Ordibehesht). +14 months = 1404-Tir
      // (jm=3) under 12-month-per-year arithmetic.
      expect(sys.year(d)).toBe(REF_JALALI.year + 1);
      expect(sys.month(d)).toBe(3);
    });

    it('addMonths walks backward across years', () => {
      const d = sys.addMonths(ref, -(REF_JALALI.month - 1) - 2);
      expect(sys.year(d)).toBe(REF_JALALI.year - 1);
      expect(sys.month(d)).toBe(10);
    });

    it('addYears moves the year and clamps the day', () => {
      const d = sys.addYears(ref, 2);
      expect(sys.year(d)).toBe(REF_JALALI.year + 2);
      expect(sys.day(d)).toBe(REF_JALALI.day);
    });

    it('daysInMonth() rolls into next year when computing the last month', () => {
      // Set jm = 11 (Esfand, the 12th month) — exercises the
      // `if (nextJm >= 12)` branch inside jalaliMonthLength().
      const last = sys.withMonth(ref, 11);
      expect(sys.daysInMonth(last)).toBe(JALALI_MONTH_LEN);
    });
  });

  describe('comparison', () => {
    const a = sys.fromNativeDate(new Date(2024, 4, 15));
    const sameDay = sys.fromNativeDate(new Date(2024, 4, 15));
    const nextDay = sys.fromNativeDate(new Date(2024, 4, 16));
    const nextMonth = sys.fromNativeDate(new Date(2024, 5, 15));
    const nextYear = sys.fromNativeDate(new Date(2025, 4, 15));

    it('isSame compares day-granularity Gregorian components', () => {
      expect(sys.isSame(a, sameDay)).toBe(true);
      expect(sys.isSame(a, nextDay)).toBe(false);
    });

    it('isBefore covers all field paths', () => {
      expect(sys.isBefore(a, nextDay)).toBe(true);
      expect(sys.isBefore(nextDay, a)).toBe(false);
      expect(sys.isBefore(a, nextMonth)).toBe(true);
      expect(sys.isBefore(nextMonth, a)).toBe(false);
      expect(sys.isBefore(a, nextYear)).toBe(true);
      expect(sys.isBefore(nextYear, a)).toBe(false);
    });

    it('isAfter covers all field paths', () => {
      expect(sys.isAfter(nextDay, a)).toBe(true);
      expect(sys.isAfter(a, nextDay)).toBe(false);
      expect(sys.isAfter(nextMonth, a)).toBe(true);
      expect(sys.isAfter(a, nextMonth)).toBe(false);
      expect(sys.isAfter(nextYear, a)).toBe(true);
      expect(sys.isAfter(a, nextYear)).toBe(false);
    });
  });

  describe('labels & formatters', () => {
    it('exposes the default Jalali month names', () => {
      expect(sys.monthLabels()[0]).toBe('Farvardin');
      expect(sys.monthLabels()[8]).toBe('Azar');
    });

    it('exposes the default short weekday names', () => {
      expect(sys.weekdayLabels()).toEqual([
        'Yek',
        'Do',
        'Se',
        'Cha',
        'Pan',
        'Jom',
        'Sha',
      ]);
    });

    it('honours custom label arrays', () => {
      const custom = createJalaliSystem({
        converter: stubConverter,
        monthLabels: ['m1', 'm2'],
        weekdayLabels: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      });
      expect(custom.monthLabels()).toEqual(['m1', 'm2']);
      expect(custom.weekdayLabels()[6]).toBe('g');
    });

    it('formatDay defaults to String(jd)', () => {
      const d = sys.fromNativeDate(
        new Date(REF_GREG.year, REF_GREG.month - 1, REF_GREG.day)
      );
      expect(sys.formatDay(d)).toBe(String(REF_JALALI.day));
    });

    it('formatDay honours overrides', () => {
      const custom = createJalaliSystem({
        converter: stubConverter,
        formatDay: (d: JalaliDate) => `${d.jy}-${d.jm}-${d.jd}`,
      });
      const d = custom.fromNativeDate(
        new Date(REF_GREG.year, REF_GREG.month - 1, REF_GREG.day)
      );
      expect(custom.formatDay(d)).toContain('-');
    });

    it('formatMonthYear defaults to "<Month> <Year>"', () => {
      const d = sys.fromNativeDate(
        new Date(REF_GREG.year, REF_GREG.month - 1, REF_GREG.day)
      );
      expect(sys.formatMonthYear(d)).toMatch(
        new RegExp(String(REF_JALALI.year))
      );
    });

    it('formatMonthYear handles month indexes outside the array gracefully', () => {
      const sparse = createJalaliSystem({
        converter: stubConverter,
        monthLabels: ['only-one'],
      });
      const d = sparse.fromNativeDate(
        new Date(REF_GREG.year, REF_GREG.month - 1, REF_GREG.day)
      );
      expect(sparse.formatMonthYear(d)).toMatch(/^ \d+$/);
    });

    it('formatMonthYear honours overrides', () => {
      const custom = createJalaliSystem({
        converter: stubConverter,
        formatMonthYear: (d: JalaliDate) => `${d.jy}/${d.jm + 1}`,
      });
      const d = custom.fromNativeDate(
        new Date(REF_GREG.year, REF_GREG.month - 1, REF_GREG.day)
      );
      expect(custom.formatMonthYear(d)).toBe(
        `${REF_JALALI.year}/${REF_JALALI.month}`
      );
    });
  });
});
