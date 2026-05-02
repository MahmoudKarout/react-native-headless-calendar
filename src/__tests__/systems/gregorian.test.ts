import {
  createGregorianSystem,
  gregorianSystem,
  type GregorianDate,
} from '../../systems/gregorian';

describe('createGregorianSystem()', () => {
  const sys = createGregorianSystem();

  describe('identity / metadata', () => {
    it('uses the canonical id "gregorian"', () => {
      expect(sys.id).toBe('gregorian');
    });

    it('falls back to the default English label', () => {
      expect(sys.label).toBe('Gregorian');
    });

    it('honours a custom label', () => {
      expect(createGregorianSystem({ label: 'Custom' }).label).toBe('Custom');
    });

    it('exposes the cached convenience instance with the same identity', () => {
      expect(gregorianSystem.id).toBe('gregorian');
    });
  });

  describe('today() / fromNativeDate()', () => {
    it('today() agrees with the system clock down to the day', () => {
      const real = new Date();
      const t = sys.today();
      expect(sys.year(t)).toBe(real.getFullYear());
      expect(sys.month(t)).toBe(real.getMonth());
      expect(sys.day(t)).toBe(real.getDate());
    });

    it('fromNativeDate copies y/m/d', () => {
      const d = sys.fromNativeDate(new Date(2024, 4, 15));
      expect(sys.year(d)).toBe(2024);
      expect(sys.month(d)).toBe(4);
      expect(sys.day(d)).toBe(15);
    });

    it('toNativeDate round-trips back to the same calendar day', () => {
      const d = sys.fromNativeDate(new Date(2024, 4, 15));
      const native = sys.toNativeDate(d);
      expect(native.getFullYear()).toBe(2024);
      expect(native.getMonth()).toBe(4);
      expect(native.getDate()).toBe(15);
    });
  });

  describe('from() — best-effort coercion', () => {
    it('falls back to today() when input is null', () => {
      const t = sys.today();
      const d = sys.from(null);
      expect(sys.isSame(d, t)).toBe(true);
    });

    it('falls back to today() when input is undefined', () => {
      const t = sys.today();
      const d = sys.from(undefined);
      expect(sys.isSame(d, t)).toBe(true);
    });

    it('coerces a native Date', () => {
      const d = sys.from(new Date(2024, 4, 15));
      expect(sys.year(d)).toBe(2024);
      expect(sys.day(d)).toBe(15);
    });

    it('passes plain GregorianDate-shaped objects through', () => {
      const d = sys.from({ y: 2024, m: 4, d: 15 });
      expect(sys.year(d)).toBe(2024);
      expect(sys.month(d)).toBe(4);
      expect(sys.day(d)).toBe(15);
    });

    it('honours objects exposing toDate() (Moment / Dayjs)', () => {
      const moment = { toDate: () => new Date(2024, 4, 15) };
      const d = sys.from(moment);
      expect(sys.year(d)).toBe(2024);
      expect(sys.day(d)).toBe(15);
    });

    it('parses ISO strings', () => {
      const d = sys.from('2024-05-15T12:00:00Z');
      expect(sys.year(d)).toBe(2024);
    });

    it('parses numeric timestamps', () => {
      const ms = new Date(2024, 4, 15).getTime();
      const d = sys.from(ms);
      expect(sys.year(d)).toBe(2024);
      expect(sys.month(d)).toBe(4);
      expect(sys.day(d)).toBe(15);
    });

    it('falls back to today() for malformed string input', () => {
      const t = sys.today();
      const d = sys.from('definitely-not-a-date');
      expect(sys.isSame(d, t)).toBe(true);
    });

    it('falls back to today() for unrecognised object inputs', () => {
      const t = sys.today();
      const d = sys.from({ random: 'object' });
      expect(sys.isSame(d, t)).toBe(true);
    });

    it('falls back to today() for boolean inputs', () => {
      const t = sys.today();
      const d = sys.from(true);
      expect(sys.isSame(d, t)).toBe(true);
    });
  });

  describe('weekday()', () => {
    it('treats Sunday as 0', () => {
      // 2024-05-05 is a Sunday.
      expect(sys.weekday(sys.fromNativeDate(new Date(2024, 4, 5)))).toBe(0);
    });

    it('treats Saturday as 6', () => {
      // 2024-05-11 is a Saturday.
      expect(sys.weekday(sys.fromNativeDate(new Date(2024, 4, 11)))).toBe(6);
    });

    it('uses the previous-year offset for January / February', () => {
      // 2024-02-29 is a Thursday (4).
      expect(sys.weekday(sys.fromNativeDate(new Date(2024, 1, 29)))).toBe(4);
      // 2024-01-01 is a Monday (1).
      expect(sys.weekday(sys.fromNativeDate(new Date(2024, 0, 1)))).toBe(1);
    });
  });

  describe('daysInMonth()', () => {
    it('handles 31-day months', () => {
      expect(
        sys.daysInMonth(sys.fromNativeDate(new Date(2024, 0, 1))) // Jan
      ).toBe(31);
    });

    it('handles 30-day months', () => {
      expect(
        sys.daysInMonth(sys.fromNativeDate(new Date(2024, 3, 1))) // Apr
      ).toBe(30);
    });

    it('returns 28 for non-leap February', () => {
      expect(sys.daysInMonth(sys.fromNativeDate(new Date(2023, 1, 1)))).toBe(
        28
      );
    });

    it('returns 29 for leap February (4-yearly rule)', () => {
      expect(sys.daysInMonth(sys.fromNativeDate(new Date(2024, 1, 1)))).toBe(
        29
      );
    });

    it('returns 28 for February in century-non-leap years', () => {
      expect(sys.daysInMonth(sys.fromNativeDate(new Date(1900, 1, 1)))).toBe(
        28
      );
    });

    it('returns 29 for February in 400-year leap years', () => {
      expect(sys.daysInMonth(sys.fromNativeDate(new Date(2000, 1, 1)))).toBe(
        29
      );
    });
  });

  describe('navigation', () => {
    it('withYear clamps the day to the new month length', () => {
      // 2024-02-29 -> 2023 should clamp to Feb 28.
      const d = sys.withYear(sys.fromNativeDate(new Date(2024, 1, 29)), 2023);
      expect(sys.day(d)).toBe(28);
    });

    it('withYear preserves the month', () => {
      const d = sys.withYear(sys.fromNativeDate(new Date(2024, 4, 1)), 2030);
      expect(sys.month(d)).toBe(4);
      expect(sys.year(d)).toBe(2030);
    });

    it('withMonth wraps positive month indexes into the next year', () => {
      const d = sys.withMonth(sys.fromNativeDate(new Date(2024, 0, 15)), 14);
      expect(sys.year(d)).toBe(2025);
      expect(sys.month(d)).toBe(2);
    });

    it('withMonth wraps negative month indexes into the previous year', () => {
      const d = sys.withMonth(sys.fromNativeDate(new Date(2024, 0, 15)), -2);
      expect(sys.year(d)).toBe(2023);
      expect(sys.month(d)).toBe(10);
    });

    it('withMonth clamps the day when moving to a shorter month', () => {
      const d = sys.withMonth(sys.fromNativeDate(new Date(2024, 0, 31)), 1);
      expect(sys.day(d)).toBe(29);
    });

    it('withDay clamps days greater than the month length', () => {
      const d = sys.withDay(sys.fromNativeDate(new Date(2024, 1, 1)), 99);
      expect(sys.day(d)).toBe(29);
    });

    it('withDay clamps zero / negative days to 1', () => {
      const d = sys.withDay(sys.fromNativeDate(new Date(2024, 4, 15)), 0);
      expect(sys.day(d)).toBe(1);
      const d2 = sys.withDay(sys.fromNativeDate(new Date(2024, 4, 15)), -3);
      expect(sys.day(d2)).toBe(1);
    });

    it('addMonths walks across year boundaries (positive)', () => {
      const d = sys.addMonths(sys.fromNativeDate(new Date(2024, 11, 15)), 2);
      expect(sys.year(d)).toBe(2025);
      expect(sys.month(d)).toBe(1);
    });

    it('addMonths walks across year boundaries (negative)', () => {
      const d = sys.addMonths(sys.fromNativeDate(new Date(2024, 0, 15)), -1);
      expect(sys.year(d)).toBe(2023);
      expect(sys.month(d)).toBe(11);
    });

    it('addMonths clamps day-of-month into shorter target months', () => {
      const d = sys.addMonths(sys.fromNativeDate(new Date(2024, 0, 31)), 1);
      expect(sys.day(d)).toBe(29);
    });

    it('addYears clamps Feb 29 into a non-leap year', () => {
      const d = sys.addYears(sys.fromNativeDate(new Date(2024, 1, 29)), 1);
      expect(sys.day(d)).toBe(28);
      expect(sys.year(d)).toBe(2025);
    });
  });

  describe('comparison', () => {
    const a = sys.fromNativeDate(new Date(2024, 4, 1));
    const b = sys.fromNativeDate(new Date(2024, 4, 2));
    const c = sys.fromNativeDate(new Date(2024, 5, 1));
    const d = sys.fromNativeDate(new Date(2025, 4, 1));

    it('isSame is true only for matching y/m/d', () => {
      expect(sys.isSame(a, sys.fromNativeDate(new Date(2024, 4, 1)))).toBe(
        true
      );
      expect(sys.isSame(a, b)).toBe(false);
    });

    it('isBefore covers all field differences', () => {
      expect(sys.isBefore(a, b)).toBe(true); // day diff
      expect(sys.isBefore(b, a)).toBe(false);
      expect(sys.isBefore(a, c)).toBe(true); // month diff
      expect(sys.isBefore(c, a)).toBe(false);
      expect(sys.isBefore(a, d)).toBe(true); // year diff
      expect(sys.isBefore(d, a)).toBe(false);
    });

    it('isAfter covers all field differences', () => {
      expect(sys.isAfter(b, a)).toBe(true); // day diff
      expect(sys.isAfter(a, b)).toBe(false);
      expect(sys.isAfter(c, a)).toBe(true); // month diff
      expect(sys.isAfter(a, c)).toBe(false);
      expect(sys.isAfter(d, a)).toBe(true); // year diff
      expect(sys.isAfter(a, d)).toBe(false);
    });
  });

  describe('labels & formatters', () => {
    it('returns the default English month names', () => {
      expect(sys.monthLabels()).toContain('January');
      expect(sys.monthLabels()[11]).toBe('December');
    });

    it('returns the default English short weekday names', () => {
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

    it('honours custom month labels', () => {
      const custom = createGregorianSystem({
        monthLabels: [
          'Ja',
          'Fe',
          'Ma',
          'Ap',
          'Ma',
          'Ju',
          'Ju',
          'Au',
          'Se',
          'Oc',
          'No',
          'De',
        ],
      });
      expect(custom.monthLabels()[0]).toBe('Ja');
    });

    it('honours custom weekday labels', () => {
      const custom = createGregorianSystem({
        weekdayLabels: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
      });
      expect(custom.weekdayLabels()[0]).toBe('D');
    });

    it('formatDay defaults to String(day)', () => {
      expect(sys.formatDay(sys.fromNativeDate(new Date(2024, 4, 9)))).toBe('9');
    });

    it('formatDay honours overrides', () => {
      const custom = createGregorianSystem({
        formatDay: (d) => `<${d.d}>`,
      });
      expect(
        custom.formatDay(custom.fromNativeDate(new Date(2024, 4, 1)))
      ).toBe('<1>');
    });

    it('formatMonthYear defaults to "<Month> <Year>"', () => {
      expect(
        sys.formatMonthYear(sys.fromNativeDate(new Date(2024, 4, 1)))
      ).toBe('May 2024');
    });

    it('formatMonthYear handles month indexes outside the array gracefully', () => {
      // Override with a too-short label list to exercise the `?? ''` branch.
      const sparse = createGregorianSystem({
        monthLabels: ['Jan'],
      });
      const d: GregorianDate = sparse.fromNativeDate(new Date(2024, 4, 1));
      // sparse default formatter looks at months[d.m] which is undefined.
      expect(sparse.formatMonthYear(d)).toBe(' 2024');
    });

    it('formatMonthYear honours overrides', () => {
      const custom = createGregorianSystem({
        formatMonthYear: (d) => `${d.y}/${d.m + 1}`,
      });
      expect(
        custom.formatMonthYear(custom.fromNativeDate(new Date(2024, 4, 1)))
      ).toBe('2024/5');
    });
  });
});
