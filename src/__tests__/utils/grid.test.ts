import {
  buildMonthGrid,
  COLS,
  DEFAULT_FIRST_DAY_OF_WEEK,
  getYearPage,
  isBetween,
  isExplicitlyDisabled,
  isoWeekNumber,
  matchDate,
  rotateWeekdayLabels,
  ROWS,
  TOTAL_CELLS,
  usedRows,
  YEAR_PAGE_SIZE,
} from '../../utils/grid';
import {
  createGregorianSystem,
  type GregorianDate,
} from '../../systems/gregorian';

const sys = createGregorianSystem();

describe('grid constants', () => {
  it('exposes the expected canonical sizes', () => {
    expect(ROWS).toBe(6);
    expect(COLS).toBe(7);
    expect(TOTAL_CELLS).toBe(42);
    expect(YEAR_PAGE_SIZE).toBe(12);
  });
});

describe('buildMonthGrid()', () => {
  it('always yields exactly TOTAL_CELLS cells', () => {
    const grid = buildMonthGrid(sys, sys.fromNativeDate(new Date(2024, 4, 15)));
    expect(grid).toHaveLength(TOTAL_CELLS);
  });

  it('flags only current-month days as isCurrentMonth', () => {
    const may2024 = sys.fromNativeDate(new Date(2024, 4, 15));
    const grid = buildMonthGrid(sys, may2024);
    const inMonth = grid.filter((c) => c.isCurrentMonth);
    expect(inMonth).toHaveLength(31);
    inMonth.forEach((c) => {
      const d = c.date as GregorianDate;
      expect(d.m).toBe(4);
      expect(d.y).toBe(2024);
    });
  });

  it('handles a month whose first day is Sunday — no previous-month tail', () => {
    const sept2024 = sys.fromNativeDate(new Date(2024, 8, 1));
    const grid = buildMonthGrid(sys, sept2024, 0);
    expect(grid[0]?.isCurrentMonth).toBe(true);
    expect((grid[0]?.date as GregorianDate).d).toBe(1);
  });

  it('fills the previous-month tail when the month starts mid-week', () => {
    const may2024 = sys.fromNativeDate(new Date(2024, 4, 1));
    const grid = buildMonthGrid(sys, may2024, 0);
    const offset = sys.weekday(sys.withDay(may2024, 1));
    for (let i = 0; i < offset; i += 1) {
      const cell = grid[i];
      if (!cell) throw new Error('missing cell');
      expect(cell.isCurrentMonth).toBe(false);
      expect((cell.date as GregorianDate).m).toBe(3);
    }
    expect((grid[offset]?.date as GregorianDate).d).toBe(1);
  });

  it('fills the next-month head when the displayed month ends before the grid does', () => {
    const feb2025 = sys.fromNativeDate(new Date(2025, 1, 15));
    const grid = buildMonthGrid(sys, feb2025);
    const consumed = sys.weekday(sys.withDay(feb2025, 1)) + 28;
    for (let i = consumed; i < TOTAL_CELLS; i += 1) {
      const cell = grid[i];
      if (!cell) throw new Error('missing cell');
      expect(cell.isCurrentMonth).toBe(false);
      expect((cell.date as GregorianDate).m).toBe(2);
    }
  });

  it('produces sequential indexes 0..41', () => {
    const grid = buildMonthGrid(sys, sys.today());
    grid.forEach((c, i) => {
      expect(c.index).toBe(i);
    });
  });

  it('skips the next-month head when the displayed month exactly fills the grid', () => {
    // Construct a 42-day month with weekday(1)===0 — buildMonthGrid skips the
    // next-month head branch entirely.
    const fakeSys = {
      ...sys,
      withDay: (_: GregorianDate, _day: number) =>
        sys.withDay(_, _day) as GregorianDate,
      weekday: () => 0,
      daysInMonth: () => 42,
      addMonths: sys.addMonths.bind(sys),
    };
    const grid = buildMonthGrid(
      fakeSys as unknown as typeof sys,
      sys.fromNativeDate(new Date(2024, 4, 1)),
      0
    );
    expect(grid).toHaveLength(TOTAL_CELLS);
    // Last cell is still in the current month — never overflows to next.
    grid.forEach((c) => expect(c.isCurrentMonth).toBe(true));
  });

  // -- firstDayOfWeek -----------------------------------------------------

  it('uses DEFAULT_FIRST_DAY_OF_WEEK when no offset is provided', () => {
    const may2024 = sys.fromNativeDate(new Date(2024, 4, 15));
    const a = buildMonthGrid(sys, may2024);
    const b = buildMonthGrid(sys, may2024, DEFAULT_FIRST_DAY_OF_WEEK);
    expect(a).toEqual(b);
  });

  it('shifts the previous-month tail when firstDayOfWeek=1 (Monday)', () => {
    // May 1, 2024 is a Wednesday (weekday=3).
    //   Sunday-first  → 3 leading cells from April (28, 29, 30).
    //   Monday-first  → 2 leading cells from April (29, 30).
    const may2024 = sys.fromNativeDate(new Date(2024, 4, 1));
    const grid = buildMonthGrid(sys, may2024, 1);
    const prevTail = grid.filter(
      (c) => !c.isCurrentMonth && (c.date as GregorianDate).m === 3
    );
    expect(prevTail).toHaveLength(2);
    expect((grid[0]?.date as GregorianDate).d).toBe(29);
    expect((grid[1]?.date as GregorianDate).d).toBe(30);
    expect((grid[2]?.date as GregorianDate).d).toBe(1);
  });

  it('produces zero leading cells when the month starts on firstDayOfWeek', () => {
    // April 1, 2024 is a Monday (weekday=1). With firstDayOfWeek=1, the
    // grid starts directly on day 1 and there is no previous-month tail.
    const apr2024 = sys.fromNativeDate(new Date(2024, 3, 1));
    const grid = buildMonthGrid(sys, apr2024, 1);
    expect(grid[0]?.isCurrentMonth).toBe(true);
    expect((grid[0]?.date as GregorianDate).d).toBe(1);
  });

  it.each([2, 3, 4, 5] as const)(
    'lines up day 1 with the expected column for firstDayOfWeek=%i',
    (firstDayOfWeek) => {
      // May 1, 2024 is Wednesday (weekday=3).
      // Expected offset = (3 - firstDayOfWeek + 7) % 7.
      const may2024 = sys.fromNativeDate(new Date(2024, 4, 1));
      const grid = buildMonthGrid(sys, may2024, firstDayOfWeek);
      const expectedOffset = (3 - firstDayOfWeek + 7) % 7;
      expect((grid[expectedOffset]?.date as GregorianDate).d).toBe(1);
      expect(grid[expectedOffset]?.isCurrentMonth).toBe(true);
      // Cells before the offset come from the previous month.
      for (let i = 0; i < expectedOffset; i += 1) {
        expect(grid[i]?.isCurrentMonth).toBe(false);
        expect((grid[i]?.date as GregorianDate).m).toBe(3);
      }
    }
  );

  it('handles firstDayOfWeek=6 (Saturday) by wrapping the offset', () => {
    // May 1, 2024 is Wednesday (weekday=3). With Saturday as the first column,
    // the offset should wrap to (3 - 6 + 7) % 7 = 4 leading cells.
    const may2024 = sys.fromNativeDate(new Date(2024, 4, 1));
    const grid = buildMonthGrid(sys, may2024, 6);
    const prevTail = grid.filter(
      (c) => !c.isCurrentMonth && (c.date as GregorianDate).m === 3
    );
    expect(prevTail).toHaveLength(4);
    expect((grid[4]?.date as GregorianDate).d).toBe(1);
  });
});

describe('rotateWeekdayLabels()', () => {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

  it('returns the input array unchanged for firstDayOfWeek=0', () => {
    expect(rotateWeekdayLabels(labels, 0)).toBe(labels);
  });

  it('uses DEFAULT_FIRST_DAY_OF_WEEK when no offset is provided', () => {
    expect(rotateWeekdayLabels(labels)).toEqual(
      rotateWeekdayLabels(labels, DEFAULT_FIRST_DAY_OF_WEEK)
    );
  });

  it('rotates to Monday-first', () => {
    expect(rotateWeekdayLabels(labels, 1)).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ]);
  });

  it('rotates to Saturday-first', () => {
    expect(rotateWeekdayLabels(labels, 6)).toEqual([
      'Sat',
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
    ]);
  });
});

describe('getYearPage()', () => {
  it('returns YEAR_PAGE_SIZE consecutive years', () => {
    expect(getYearPage(2024)).toHaveLength(YEAR_PAGE_SIZE);
  });

  it('contains the requested year in the middle of a page', () => {
    const page = getYearPage(2024);
    expect(page).toContain(2024);
    expect(page[0]).toBe(2016);
    expect(page[page.length - 1]).toBe(2027);
  });

  it('uses the requested year as the page end when it is divisible by the page size', () => {
    const page = getYearPage(2028);
    expect(page[0]).toBe(2028);
    expect(page[page.length - 1]).toBe(2039);
  });

  it('clamps the start to 0 for tiny years', () => {
    const page = getYearPage(5);
    expect(page[0]).toBe(0);
    expect(page[page.length - 1]).toBe(11);
  });

  it('clamps the start to 0 for negative years', () => {
    const page = getYearPage(-5);
    expect(page[0]).toBe(0);
    expect(page[page.length - 1]).toBe(11);
  });
});

describe('isBetween()', () => {
  const a = sys.fromNativeDate(new Date(2024, 0, 1));
  const b = sys.fromNativeDate(new Date(2024, 0, 10));
  const inside = sys.fromNativeDate(new Date(2024, 0, 5));
  const before = sys.fromNativeDate(new Date(2023, 11, 31));
  const after = sys.fromNativeDate(new Date(2024, 0, 11));

  it('returns false when start is missing', () => {
    expect(isBetween(sys, inside, undefined, b)).toBe(false);
  });

  it('returns false when end is missing', () => {
    expect(isBetween(sys, inside, a, undefined)).toBe(false);
  });

  it('returns false when neither bound is provided', () => {
    expect(isBetween(sys, inside, undefined, undefined)).toBe(false);
  });

  it('returns true for endpoints (inclusive)', () => {
    expect(isBetween(sys, a, a, b)).toBe(true);
    expect(isBetween(sys, b, a, b)).toBe(true);
  });

  it('returns true strictly inside the range', () => {
    expect(isBetween(sys, inside, a, b)).toBe(true);
  });

  it('returns false outside the range', () => {
    expect(isBetween(sys, before, a, b)).toBe(false);
    expect(isBetween(sys, after, a, b)).toBe(false);
  });
});

describe('isExplicitlyDisabled()', () => {
  const target = sys.fromNativeDate(new Date(2024, 5, 15));

  it('returns false when both inputs are undefined', () => {
    expect(isExplicitlyDisabled(sys, target, undefined, undefined)).toBe(false);
  });

  it('returns false when both inputs are empty arrays', () => {
    expect(isExplicitlyDisabled(sys, target, [], [])).toBe(false);
  });

  it('matches an explicit disabled date', () => {
    const list = [target];
    expect(isExplicitlyDisabled(sys, target, list, undefined)).toBe(true);
  });

  it('does not match when no explicit date matches', () => {
    const list = [sys.fromNativeDate(new Date(2024, 5, 20))];
    expect(isExplicitlyDisabled(sys, target, list, undefined)).toBe(false);
  });

  it('matches a disabled inclusive range', () => {
    const ranges = [
      {
        start: sys.fromNativeDate(new Date(2024, 5, 14)),
        end: sys.fromNativeDate(new Date(2024, 5, 16)),
      },
    ];
    expect(isExplicitlyDisabled(sys, target, undefined, ranges)).toBe(true);
  });

  it('does not match when the target falls outside all ranges', () => {
    const ranges = [
      {
        start: sys.fromNativeDate(new Date(2024, 5, 1)),
        end: sys.fromNativeDate(new Date(2024, 5, 10)),
      },
    ];
    expect(isExplicitlyDisabled(sys, target, undefined, ranges)).toBe(false);
  });

  it('honours a date list AND a range list together', () => {
    const list = [sys.fromNativeDate(new Date(2024, 5, 99))];
    const ranges = [
      {
        start: sys.fromNativeDate(new Date(2024, 5, 14)),
        end: sys.fromNativeDate(new Date(2024, 5, 16)),
      },
    ];
    expect(isExplicitlyDisabled(sys, target, list, ranges)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// usedRows() — fixedWeeks={false} support
// ---------------------------------------------------------------------------

describe('usedRows()', () => {
  it('returns 6 for a month that fills all rows (May 2026 — Sun 1st row)', () => {
    const grid = buildMonthGrid(
      sys,
      sys.fromNativeDate(new Date(2026, 4, 15)),
      0
    );
    // May 2026 starts on a Friday and ends on Sunday — covers 6 rows.
    expect(usedRows(grid)).toBe(6);
  });

  it('returns 5 for a typical month (May 2024 — Wed 1st)', () => {
    const grid = buildMonthGrid(
      sys,
      sys.fromNativeDate(new Date(2024, 4, 15)),
      0
    );
    expect(usedRows(grid)).toBe(5);
  });

  it('returns 4 for a 28-day February that starts on the first column', () => {
    // Feb 2026 starts on a Sunday — exactly 4 rows of current-month cells.
    const grid = buildMonthGrid(
      sys,
      sys.fromNativeDate(new Date(2026, 1, 15)),
      0
    );
    expect(usedRows(grid)).toBe(4);
  });

  it('always returns at least 1 (defensive)', () => {
    expect(
      usedRows([{ date: sys.today(), isCurrentMonth: false, index: 0 }])
    ).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// isoWeekNumber()
// ---------------------------------------------------------------------------

describe('isoWeekNumber()', () => {
  it('returns the ISO 8601 week for known dates', () => {
    expect(isoWeekNumber(new Date(2024, 0, 1))).toBe(1); // Mon Jan 1 2024
    expect(isoWeekNumber(new Date(2024, 4, 15))).toBe(20); // Wed May 15 2024
    expect(isoWeekNumber(new Date(2024, 11, 30))).toBe(1); // Mon Dec 30 2024 → ISO week 1 of 2025
  });

  it('puts Jan 1 2023 (a Sunday) in week 52 of 2022', () => {
    expect(isoWeekNumber(new Date(2023, 0, 1))).toBe(52);
  });
});

// ---------------------------------------------------------------------------
// matchDate()
// ---------------------------------------------------------------------------

describe('matchDate()', () => {
  const target = sys.fromNativeDate(new Date(2024, 5, 15));

  it('matches against an explicit list of dates', () => {
    expect(
      matchDate(sys, target, [new Date(2024, 5, 14), new Date(2024, 5, 15)])
    ).toBe(true);
    expect(matchDate(sys, target, [new Date(2024, 5, 14)])).toBe(false);
  });

  it('matches against an inclusive range list', () => {
    expect(
      matchDate(sys, target, [
        { start: new Date(2024, 5, 10), end: new Date(2024, 5, 20) },
      ])
    ).toBe(true);
    expect(
      matchDate(sys, target, [
        { start: new Date(2024, 6, 1), end: new Date(2024, 6, 5) },
      ])
    ).toBe(false);
  });

  it('matches against a function predicate (receives a native Date)', () => {
    const predicate = jest.fn((d: Date) => d.getMonth() === 5);
    expect(matchDate(sys, target, predicate)).toBe(true);
    expect(predicate.mock.calls[0]?.[0]).toBeInstanceOf(Date);
  });

  it('returns false (instead of crashing) when the predicate throws', () => {
    expect(
      matchDate(sys, target, () => {
        throw new Error('boom');
      })
    ).toBe(false);
  });

  it('returns false on an empty matcher array', () => {
    expect(matchDate(sys, target, [])).toBe(false);
  });
});
