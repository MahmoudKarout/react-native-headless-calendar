import {
  createHijriSystem,
  type HijriConverter,
  type HijriDate,
} from '../../systems/hijri';

/**
 * Deterministic stub converter — uses a fixed reference epoch so the entire
 * suite runs without depending on third-party tables.
 *
 * 2024-05-15 (Gregorian) is treated as 1445-11-07 (Hijri); ±1 day in
 * Gregorian corresponds to ±1 day in Hijri. Hijri months are 30 days. This
 * is enough to exercise the system surface deterministically.
 */
const REF_GREG = { year: 2024, month: 5, day: 15 };
const REF_HIJRI = { year: 1445, month: 11, day: 7 };
const HIJRI_MONTH_LEN = 30;

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
const hijriToOrdinal = (y: number, m: number, d: number): number =>
  ((y - REF_HIJRI.year) * 12 + (m - REF_HIJRI.month)) * HIJRI_MONTH_LEN +
  (d - REF_HIJRI.day);

const stubConverter: HijriConverter = {
  hijriToGregorian({ year, month, day }) {
    const julian = refJulian + hijriToOrdinal(year, month, day);
    return gregFromJulian(julian);
  },
  gregorianToHijri({ year, month, day }) {
    const julian = julianFromGreg(year, month, day);
    const ordinal = julian - refJulian;
    let total =
      (REF_HIJRI.year * 12 + (REF_HIJRI.month - 1)) * HIJRI_MONTH_LEN +
      (REF_HIJRI.day - 1) +
      ordinal;
    const hd = (total % HIJRI_MONTH_LEN) + 1;
    total = Math.floor(total / HIJRI_MONTH_LEN);
    const hm = (total % 12) + 1;
    const hy = Math.floor(total / 12);
    return { year: hy, month: hm, day: hd };
  },
};

describe('createHijriSystem() — guard rails', () => {
  it('throws when called without options', () => {
    expect(() =>
      // Deliberately wrong call to exercise the early return.
      createHijriSystem(
        undefined as unknown as Parameters<typeof createHijriSystem>[0]
      )
    ).toThrow(/createHijriSystem/);
  });

  it('throws when called without a converter', () => {
    expect(() =>
      createHijriSystem(
        {} as unknown as Parameters<typeof createHijriSystem>[0]
      )
    ).toThrow(/converter/);
  });

  it('throws when the converter is missing gregorianToHijri', () => {
    expect(() =>
      createHijriSystem({
        converter: {
          hijriToGregorian: stubConverter.hijriToGregorian,
        } as unknown as HijriConverter,
      })
    ).toThrow(/converter/);
  });

  it('throws when the converter is missing hijriToGregorian', () => {
    expect(() =>
      createHijriSystem({
        converter: {
          gregorianToHijri: stubConverter.gregorianToHijri,
        } as unknown as HijriConverter,
      })
    ).toThrow(/converter/);
  });
});

describe('createHijriSystem() — surface', () => {
  const sys = createHijriSystem({ converter: stubConverter });

  it('uses the canonical id "hijri" and the default label', () => {
    expect(sys.id).toBe('hijri');
    expect(sys.label).toBe('Hijri');
  });

  it('honours a custom label', () => {
    expect(
      createHijriSystem({ converter: stubConverter, label: 'هـ' }).label
    ).toBe('هـ');
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
    expect(sys.year(d)).toBe(REF_HIJRI.year);
    expect(sys.month(d)).toBe(REF_HIJRI.month - 1);
    expect(sys.day(d)).toBe(REF_HIJRI.day);
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
      expect(sys.year(d)).toBe(REF_HIJRI.year);
    });

    it('passes Hijri-shaped objects through the converter', () => {
      const d = sys.from({
        hy: REF_HIJRI.year,
        hm: REF_HIJRI.month - 1,
        hd: REF_HIJRI.day,
      });
      expect(sys.year(d)).toBe(REF_HIJRI.year);
      expect(sys.month(d)).toBe(REF_HIJRI.month - 1);
      expect(sys.day(d)).toBe(REF_HIJRI.day);
    });

    it('honours objects with toDate()', () => {
      const d = sys.from({
        toDate: () => new Date(REF_GREG.year, REF_GREG.month - 1, REF_GREG.day),
      });
      expect(sys.day(d)).toBe(REF_HIJRI.day);
    });

    it('parses ISO strings', () => {
      const d = sys.from('2024-05-15T00:00:00');
      expect(sys.year(d)).toBe(REF_HIJRI.year);
    });

    it('parses numeric timestamps', () => {
      const ms = new Date(
        REF_GREG.year,
        REF_GREG.month - 1,
        REF_GREG.day
      ).getTime();
      const d = sys.from(ms);
      expect(sys.day(d)).toBe(REF_HIJRI.day);
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
      expect(sys.daysInMonth(ref)).toBe(HIJRI_MONTH_LEN);
    });

    it('withYear preserves month, clamps day', () => {
      const d = sys.withYear(ref, REF_HIJRI.year + 1);
      expect(sys.year(d)).toBe(REF_HIJRI.year + 1);
      expect(sys.month(d)).toBe(REF_HIJRI.month - 1);
    });

    it('withMonth wraps positive month values into the next year', () => {
      const d = sys.withMonth(ref, 14);
      expect(sys.year(d)).toBe(REF_HIJRI.year + 1);
      expect(sys.month(d)).toBe(2);
    });

    it('withMonth wraps negative month values into the previous year', () => {
      const d = sys.withMonth(ref, -2);
      expect(sys.year(d)).toBe(REF_HIJRI.year - 1);
      expect(sys.month(d)).toBe(10);
    });

    it('withDay clamps zero/negative days to 1', () => {
      expect(sys.day(sys.withDay(ref, 0))).toBe(1);
      expect(sys.day(sys.withDay(ref, -5))).toBe(1);
    });

    it('withDay clamps days greater than month length to max', () => {
      expect(sys.day(sys.withDay(ref, 99))).toBe(HIJRI_MONTH_LEN);
    });

    it('addMonths walks forward across years', () => {
      const d = sys.addMonths(ref, 14);
      // ref: hy=1445, hm=10 (Dhul-Qa'dah). +14 months = 1447-Muharram (hm=0).
      expect(sys.year(d)).toBe(REF_HIJRI.year + 2);
      expect(sys.month(d)).toBe(0);
    });

    it('addMonths walks backward across years', () => {
      const d = sys.addMonths(ref, -(REF_HIJRI.month - 1) - 2);
      expect(sys.year(d)).toBe(REF_HIJRI.year - 1);
      expect(sys.month(d)).toBe(10);
    });

    it('addYears moves the year and clamps the day', () => {
      const d = sys.addYears(ref, 2);
      expect(sys.year(d)).toBe(REF_HIJRI.year + 2);
      expect(sys.day(d)).toBe(REF_HIJRI.day);
    });

    it('daysInMonth() rolls into next year when computing the last month', () => {
      // Set hm = 11 (Dhul-Hijjah, the 12th month) — exercises the
      // `if (nextHm >= 12)` branch inside hijriMonthLength().
      const last = sys.withMonth(ref, 11);
      expect(sys.daysInMonth(last)).toBe(HIJRI_MONTH_LEN);
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
    it('exposes the default Hijri month names', () => {
      expect(sys.monthLabels()[0]).toBe('Muharram');
      expect(sys.monthLabels()[8]).toBe('Ramadan');
    });

    it('exposes the default short weekday names', () => {
      expect(sys.weekdayLabels()).toEqual([
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
      ]);
    });

    it('honours custom label arrays', () => {
      const custom = createHijriSystem({
        converter: stubConverter,
        monthLabels: ['m1', 'm2'],
        weekdayLabels: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      });
      expect(custom.monthLabels()).toEqual(['m1', 'm2']);
      expect(custom.weekdayLabels()[6]).toBe('g');
    });

    it('formatDay defaults to String(hd)', () => {
      const d = sys.fromNativeDate(
        new Date(REF_GREG.year, REF_GREG.month - 1, REF_GREG.day)
      );
      expect(sys.formatDay(d)).toBe(String(REF_HIJRI.day));
    });

    it('formatDay honours overrides', () => {
      const custom = createHijriSystem({
        converter: stubConverter,
        formatDay: (d: HijriDate) => `${d.hy}-${d.hm}-${d.hd}`,
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
        new RegExp(String(REF_HIJRI.year))
      );
    });

    it('formatMonthYear handles month indexes outside the array gracefully', () => {
      const sparse = createHijriSystem({
        converter: stubConverter,
        monthLabels: ['only-one'],
      });
      const d = sparse.fromNativeDate(
        new Date(REF_GREG.year, REF_GREG.month - 1, REF_GREG.day)
      );
      expect(sparse.formatMonthYear(d)).toMatch(/^ \d+$/);
    });

    it('formatMonthYear honours overrides', () => {
      const custom = createHijriSystem({
        converter: stubConverter,
        formatMonthYear: (d: HijriDate) => `${d.hy}/${d.hm + 1}`,
      });
      const d = custom.fromNativeDate(
        new Date(REF_GREG.year, REF_GREG.month - 1, REF_GREG.day)
      );
      expect(custom.formatMonthYear(d)).toBe(
        `${REF_HIJRI.year}/${REF_HIJRI.month}`
      );
    });
  });
});
