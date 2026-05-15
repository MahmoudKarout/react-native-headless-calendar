/**
 * Vertical horoscope calendar — infinite month list where every day is
 * tinted by its zodiac sign, and each sign's *start* and *end* day gets
 * a small overlay badge showing the sign's symbol. Tap any day to see
 * which sign rules it.
 *
 * Architecture follows the project's vertical-list recipe:
 *   - One `<CalendarProvider mode="single">` at the top.
 *   - A `FlashList` of months, each rendering its own grid via
 *     `buildMonthGrid` + `gregorianSystem` (no per-cell store
 *     subscriptions in `MonthGrid` — only the focused-day card
 *     reads from the store).
 *   - `MonthGrid` is `memo`'d and receives only stable refs, so a tap
 *     re-renders the focused-day card but not the whole list.
 *
 * Why bake the zodiac coloring into the cell renderer here instead of
 * using `modifiers` like the grid version? `modifiers` work great on a
 * single rendered month, but on a 60-month vertical list with the
 * per-day predicate running on every visible cell, the indirection
 * adds nothing. We already have the `Date` in hand inside the cell,
 * and a single lookup table beats twelve predicates.
 */
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import {
  CalendarProvider,
  buildMonthGrid,
  gregorianSystem,
  useCalendarActions,
  useCalendarSelector,
  type CalendarActions,
} from 'react-native-fast-calendar';

const MONTHS_BEFORE = 12;
const MONTHS_AFTER = 24;
const FIRST_DAY_OF_WEEK = 0;
const CELL_SIZE = 44;

const MONTH_NAMES = [
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
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Zodiac data ────────────────────────────────────────────────────────────
// Order matters: signs run Capricorn (Dec 22) → Sagittarius (Nov 22).
// Each sign's window is half-open `[start, nextStart)` so cusp days
// belong to exactly one sign. Capricorn wraps the year boundary.

interface Sign {
  id: string;
  name: string;
  symbol: string;
  start: { month: number; day: number }; // 0-indexed month
  tintClass: string; // soft background on every day of the band
  badgeClass: string; // saturated background on the start/end badges
  textClass: string; // foreground for badge symbol
}

const ZODIAC: Sign[] = [
  {
    id: 'capricorn',
    name: 'Capricorn',
    symbol: '\u2651',
    start: { month: 11, day: 22 },
    tintClass: 'bg-[#e0e7ff] dark:bg-[#1e1b4b]',
    badgeClass: 'bg-[#6366f1]',
    textClass: 'text-white',
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    symbol: '\u2652',
    start: { month: 0, day: 20 },
    tintClass: 'bg-[#cffafe] dark:bg-[#164e63]',
    badgeClass: 'bg-[#06b6d4]',
    textClass: 'text-white',
  },
  {
    id: 'pisces',
    name: 'Pisces',
    symbol: '\u2653',
    start: { month: 1, day: 19 },
    tintClass: 'bg-[#dbeafe] dark:bg-[#1e3a8a]',
    badgeClass: 'bg-[#3b82f6]',
    textClass: 'text-white',
  },
  {
    id: 'aries',
    name: 'Aries',
    symbol: '\u2648',
    start: { month: 2, day: 21 },
    tintClass: 'bg-[#fee2e2] dark:bg-[#7f1d1d]',
    badgeClass: 'bg-[#ef4444]',
    textClass: 'text-white',
  },
  {
    id: 'taurus',
    name: 'Taurus',
    symbol: '\u2649',
    start: { month: 3, day: 20 },
    tintClass: 'bg-[#dcfce7] dark:bg-[#14532d]',
    badgeClass: 'bg-[#22c55e]',
    textClass: 'text-white',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    symbol: '\u264A',
    start: { month: 4, day: 21 },
    tintClass: 'bg-[#fef9c3] dark:bg-[#713f12]',
    badgeClass: 'bg-[#eab308]',
    textClass: 'text-[#1f1300]',
  },
  {
    id: 'cancer',
    name: 'Cancer',
    symbol: '\u264B',
    start: { month: 5, day: 21 },
    tintClass: 'bg-[#e0f2fe] dark:bg-[#0c4a6e]',
    badgeClass: 'bg-[#0ea5e9]',
    textClass: 'text-white',
  },
  {
    id: 'leo',
    name: 'Leo',
    symbol: '\u264C',
    start: { month: 6, day: 23 },
    tintClass: 'bg-[#ffedd5] dark:bg-[#7c2d12]',
    badgeClass: 'bg-[#f97316]',
    textClass: 'text-white',
  },
  {
    id: 'virgo',
    name: 'Virgo',
    symbol: '\u264D',
    start: { month: 7, day: 23 },
    tintClass: 'bg-[#ecfccb] dark:bg-[#3f6212]',
    badgeClass: 'bg-[#84cc16]',
    textClass: 'text-[#1a2a00]',
  },
  {
    id: 'libra',
    name: 'Libra',
    symbol: '\u264E',
    start: { month: 8, day: 23 },
    tintClass: 'bg-[#fce7f3] dark:bg-[#831843]',
    badgeClass: 'bg-[#ec4899]',
    textClass: 'text-white',
  },
  {
    id: 'scorpio',
    name: 'Scorpio',
    symbol: '\u264F',
    start: { month: 9, day: 23 },
    tintClass: 'bg-[#fae8ff] dark:bg-[#581c87]',
    badgeClass: 'bg-[#a855f7]',
    textClass: 'text-white',
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius',
    symbol: '\u2650',
    start: { month: 10, day: 22 },
    tintClass: 'bg-[#ffe4e6] dark:bg-[#881337]',
    badgeClass: 'bg-[#f43f5e]',
    textClass: 'text-white',
  },
];

const ZODIAC_BY_ID: Record<string, Sign> = ZODIAC.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<string, Sign>
);

/** Day-of-year (0–365), leap-year safe. */
function doy(d: Date): number {
  const y = d.getFullYear();
  return Math.floor(
    (d.getTime() - new Date(y, 0, 1).getTime()) / (24 * 60 * 60 * 1000)
  );
}

/** Resolve the sign that *owns* a given date. */
function signForDate(d: Date): Sign {
  const y = d.getFullYear();
  const t = doy(d);
  // Iterate Aquarius → Sagittarius (indices 1..11). Capricorn fills the
  // residual: Jan 1–19 and Dec 22–31.
  for (let i = 1; i < ZODIAC.length; i++) {
    const cur = ZODIAC[i]!;
    const next = ZODIAC[i + 1] ?? ZODIAC[0]!; // wrap to Capricorn at end
    const curDoy = doy(new Date(y, cur.start.month, cur.start.day));
    const nextDoy =
      next.id === 'capricorn'
        ? doy(new Date(y, 11, 22))
        : doy(new Date(y, next.start.month, next.start.day));
    if (t >= curDoy && t < nextDoy) return cur;
  }
  return ZODIAC_BY_ID.capricorn!;
}

/** Pre-compute (memoized per year) the set of doy values where each sign
 *  begins or ends, so a cell renderer can answer "am I a start/end day?"
 *  with a single Set lookup. */
function buildBoundaryMaps(year: number) {
  const startDoy: Map<number, Sign> = new Map();
  const endDoy: Map<number, Sign> = new Map();
  for (const sign of ZODIAC) {
    const next = ZODIAC[(ZODIAC.indexOf(sign) + 1) % ZODIAC.length]!;
    // Start day: literal start within the calendar year. Capricorn has
    // two starts visible (Jan 1 conceptually, and Dec 22); we only show
    // the Dec 22 badge — Jan 1 is mid-band visually so a badge there
    // would look like a duplicate.
    const startDate = new Date(year, sign.start.month, sign.start.day);
    startDoy.set(doy(startDate), sign);
    // End day: the day before the next sign's start, in this year.
    // For Sagittarius → Capricorn this is Dec 21.
    // For Capricorn → Aquarius this is Jan 19 of the same year (the
    // band that *ends* on Jan 19 started in the prior Dec — that's the
    // boundary we surface).
    const nextStart = new Date(year, next.start.month, next.start.day);
    const endDate = new Date(nextStart);
    endDate.setDate(endDate.getDate() - 1);
    endDoy.set(doy(endDate), sign);
  }
  return { startDoy, endDoy };
}

// Cache boundary maps per year so months in the same year share work.
const BOUNDARY_CACHE = new Map<
  number,
  { startDoy: Map<number, Sign>; endDoy: Map<number, Sign> }
>();
function getBoundaries(year: number) {
  let cached = BOUNDARY_CACHE.get(year);
  if (!cached) {
    cached = buildBoundaryMaps(year);
    BOUNDARY_CACHE.set(year, cached);
  }
  return cached;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface MonthData {
  firstOfMonth: Date;
  key: string;
}

function buildMonths(): MonthData[] {
  const today = new Date();
  today.setDate(1);
  today.setHours(0, 0, 0, 0);
  const out: MonthData[] = [];
  for (let i = -MONTHS_BEFORE; i <= MONTHS_AFTER; i += 1) {
    const d = new Date(today);
    d.setMonth(d.getMonth() + i);
    out.push({
      firstOfMonth: d,
      key: `${d.getFullYear()}-${d.getMonth()}`,
    });
  }
  return out;
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const keyExtractor = (item: MonthData) => item.key;

export default function HoroscopeCalendarExample() {
  return (
    <View className="flex-1 bg-background">
      <CalendarProvider mode="single">
        <FocusedHeader />
        <MonthList />
      </CalendarProvider>
    </View>
  );
}

function FocusedHeader() {
  // Return a primitive (epoch ms) so `useSyncExternalStore`'s snapshot
  // identity stays stable across reads — otherwise `toNativeDate`
  // mints a fresh `Date` every poll and React tears its hair out.
  const focusedMs = useCalendarSelector((s) =>
    s.mode === 'single' && s.selectedDate
      ? s.system.toNativeDate(s.selectedDate).getTime()
      : null
  );
  const focused = useMemo(
    () => (focusedMs !== null ? new Date(focusedMs) : null),
    [focusedMs]
  );
  const sign = focused ? signForDate(focused) : null;

  if (!focused || !sign) {
    return (
      <View className="px-4 pt-4 pb-3 border-b-hairline border-border bg-card">
        <Text className="text-muted text-[11px] font-semibold tracking-widest uppercase mb-0.5">
          Horoscope
        </Text>
        <Text className="text-foreground text-[15px] font-medium">
          Scroll the year. Tap any day to see its sign.
        </Text>
      </View>
    );
  }

  const dateLabel = focused.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View className="flex-row items-center gap-3 px-4 pt-4 pb-3 border-b-hairline border-border bg-card">
      <View
        className={`w-12 h-12 rounded-full items-center justify-center ${sign.badgeClass}`}
      >
        <Text className={`text-[22px] ${sign.textClass}`}>{sign.symbol}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-muted text-[11px] font-semibold tracking-widest uppercase">
          {dateLabel}
        </Text>
        <Text className="text-foreground text-base font-semibold">
          {sign.name}
        </Text>
        <Text className="text-muted text-[12px]">{rangeLabel(sign)}</Text>
      </View>
    </View>
  );
}

function rangeLabel(sign: Sign): string {
  const idx = ZODIAC.indexOf(sign);
  const next = ZODIAC[(idx + 1) % ZODIAC.length]!;
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const startDate = new Date(2001, sign.start.month, sign.start.day);
  const endDate = new Date(2001, next.start.month, next.start.day - 1);
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

function MonthList() {
  const months = useMemo(() => buildMonths(), []);
  const todayIndex = MONTHS_BEFORE;
  const listRef = useRef<FlashListRef<MonthData> | null>(null);
  const { selectDate } = useCalendarActions();

  useEffect(() => {
    const id = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: todayIndex,
        animated: false,
      });
    }, 0);
    return () => clearTimeout(id);
  }, [todayIndex]);

  const renderItem = useCallback(
    ({ item }: { item: MonthData }) => (
      <MonthGrid month={item.firstOfMonth} selectDate={selectDate} />
    ),
    [selectDate]
  );

  return (
    <FlashList
      ref={listRef}
      data={months}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
    />
  );
}

interface MonthGridProps {
  month: Date;
  selectDate: CalendarActions['selectDate'];
}

const MonthGrid = memo(function MonthGrid({
  month,
  selectDate,
}: MonthGridProps) {
  const monthIndex = month.getMonth();
  const year = month.getFullYear();
  const monthLabel = `${MONTH_NAMES[monthIndex]} ${year}`;

  // Build cells once per (year, month). We compute zodiac metadata
  // here so the cell renderer stays a pure paint function.
  const cells = useMemo(() => {
    const grid = buildMonthGrid(
      gregorianSystem,
      gregorianSystem.fromNativeDate(month),
      FIRST_DAY_OF_WEEK
    );
    return grid.map((c) => {
      const nativeDate = gregorianSystem.toNativeDate(c.date);
      if (!c.isCurrentMonth) {
        return { nativeDate, day: 0, isCurrentMonth: false } as const;
      }
      const t = doy(nativeDate);
      const { startDoy, endDoy } = getBoundaries(nativeDate.getFullYear());
      const sign = signForDate(nativeDate);
      const startSign = startDoy.get(t);
      const endSign = endDoy.get(t);
      return {
        nativeDate,
        day: gregorianSystem.day(c.date),
        isCurrentMonth: true,
        sign,
        // A day is a "boundary" if it begins or ends a sign band. We
        // pass the sign object (not just the symbol) so the cell can
        // tint the badge with the sign that owns the badge — for an
        // *end* day, that's the same sign as the cell's tint; for a
        // *start* day, it's the new sign (which also matches the tint
        // since the new sign starts here).
        startSign: startSign ?? null,
        endSign: endSign ?? null,
      } as const;
    });
  }, [month]);

  return (
    <View className="px-4 pt-6 pb-4">
      <Text className="text-foreground text-[22px] font-bold tracking-tight mb-3">
        {monthLabel}
      </Text>
      <View className="h-px bg-border mb-3" />

      <View className="flex-row mb-1">
        {WEEKDAYS.map((label) => (
          <Text
            key={label}
            className="text-muted text-[11px] font-semibold tracking-widest text-center"
            style={{ width: CELL_SIZE }}
          >
            {label.toUpperCase()}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <View key={idx} style={{ width: CELL_SIZE, height: CELL_SIZE }} />
            );
          }
          return (
            <DayCell
              key={cell.nativeDate.toISOString()}
              date={cell.nativeDate}
              day={cell.day}
              tintClass={cell.sign.tintClass}
              startSign={cell.startSign}
              endSign={cell.endSign}
              selectDate={selectDate}
            />
          );
        })}
      </View>
    </View>
  );
});

interface DayCellProps {
  date: Date;
  day: number;
  tintClass: string;
  startSign: Sign | null;
  endSign: Sign | null;
  selectDate: CalendarActions['selectDate'];
}

const DayCell = memo(function DayCell({
  date,
  day,
  tintClass,
  startSign,
  endSign,
  selectDate,
}: DayCellProps) {
  const isSelected = useCalendarSelector((s) => {
    if (s.mode !== 'single' || !s.selectedDate) return false;
    return isSameDay(s.system.toNativeDate(s.selectedDate), date);
  });
  const isToday = isSameDay(date, new Date());
  const handlePress = useCallback(() => selectDate(date), [selectDate, date]);

  // The badge for a start-day floats top-right with the *new* sign's
  // symbol. The badge for an end-day floats bottom-right with the
  // *ending* sign's symbol. A day that is both start and end (only
  // happens in degenerate one-day bands, never in real zodiac data)
  // would show both; in practice we'll see at most one per cell.
  return (
    <Pressable
      onPress={handlePress}
      className="items-center justify-center"
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
    >
      <View
        className={`relative items-center justify-center rounded-full ${tintClass} ${
          isSelected ? 'border-2 border-foreground' : ''
        }`}
        style={{ width: CELL_SIZE - 6, height: CELL_SIZE - 6 }}
      >
        <Text
          className={`text-[15px] ${
            isToday ? 'font-bold text-foreground' : 'font-medium text-foreground'
          }`}
        >
          {day}
        </Text>

        {startSign ? (
          <View
            className={`absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full items-center justify-center ${startSign.badgeClass}`}
          >
            <Text className={`text-[10px] leading-none ${startSign.textClass}`}>
              {startSign.symbol}
            </Text>
          </View>
        ) : null}

        {endSign ? (
          <View
            className={`absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full items-center justify-center ${endSign.badgeClass}`}
          >
            <Text className={`text-[10px] leading-none ${endSign.textClass}`}>
              {endSign.symbol}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});