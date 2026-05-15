---
sidebar_position: 12
title: Horoscope Calendar
description: Vertical infinite month list where every day is tinted by its zodiac sign and each sign's start and end days carry a corner badge. Built on @shopify/flash-list with one shared store.
keywords:
  - horoscope calendar react native
  - zodiac calendar
  - astrology date picker
  - vertical calendar bands
  - flash-list calendar
  - multi-band calendar
---

# Horoscope Calendar

A vertical, infinite-scrolling month list where every day is **tinted by its zodiac sign**, and the **start and end day of each sign's band** carries a corner badge with the sign's symbol. Tapping any day surfaces the sign that rules it in a header card above the list.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo horoscope />

## When to reach for it

- You're painting **multiple simultaneous bands** on a calendar — zodiac signs, fiscal quarters, sports seasons, school terms, mortgage windows. A single `range` selection only models one span; this recipe models twelve at once.
- You want a panoramic year view, not a single-month picker.
- The boundary days of each band carry meaning (a sign begins, a quarter ends) and should be visually called out.

If you only need *one* range, use the [Date Range Picker](./date-range-picker.md). If you need to toggle a set of unrelated days, use the [Multi-Date Picker](./multi-date-picker.md).

## Dependencies

```bash
yarn add @shopify/flash-list
```

## Implementation

The example renders a vertical `FlashList` of months. Each cell looks up its zodiac sign via a single function call (`signForDate`) and reads cached per-year boundary maps (`getBoundaries`) to decide whether to render the corner badge(s). Selection is stored in the library's `mode="single"` store so a tap re-renders only the focused cell and the header card — not the entire list.

```tsx
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

interface Sign {
  id: string;
  name: string;
  symbol: string;
  start: { month: number; day: number };
  tint: string;   // soft background painted on every day in the band
  badge: string;  // saturated chip behind the corner symbol
}

const ZODIAC: Sign[] = [
  { id: 'capricorn',   name: 'Capricorn',   symbol: '♑', start: { month: 11, day: 22 }, tint: '#e0e7ff', badge: '#6366f1' },
  { id: 'aquarius',    name: 'Aquarius',    symbol: '♒', start: { month: 0,  day: 20 }, tint: '#cffafe', badge: '#06b6d4' },
  { id: 'pisces',      name: 'Pisces',      symbol: '♓', start: { month: 1,  day: 19 }, tint: '#dbeafe', badge: '#3b82f6' },
  { id: 'aries',       name: 'Aries',       symbol: '♈', start: { month: 2,  day: 21 }, tint: '#fee2e2', badge: '#ef4444' },
  { id: 'taurus',      name: 'Taurus',      symbol: '♉', start: { month: 3,  day: 20 }, tint: '#dcfce7', badge: '#22c55e' },
  { id: 'gemini',      name: 'Gemini',      symbol: '♊', start: { month: 4,  day: 21 }, tint: '#fef9c3', badge: '#eab308' },
  { id: 'cancer',      name: 'Cancer',      symbol: '♋', start: { month: 5,  day: 21 }, tint: '#e0f2fe', badge: '#0ea5e9' },
  { id: 'leo',         name: 'Leo',         symbol: '♌', start: { month: 6,  day: 23 }, tint: '#ffedd5', badge: '#f97316' },
  { id: 'virgo',       name: 'Virgo',       symbol: '♍', start: { month: 7,  day: 23 }, tint: '#ecfccb', badge: '#84cc16' },
  { id: 'libra',       name: 'Libra',       symbol: '♎', start: { month: 8,  day: 23 }, tint: '#fce7f3', badge: '#ec4899' },
  { id: 'scorpio',     name: 'Scorpio',     symbol: '♏', start: { month: 9,  day: 23 }, tint: '#fae8ff', badge: '#a855f7' },
  { id: 'sagittarius', name: 'Sagittarius', symbol: '♐', start: { month: 10, day: 22 }, tint: '#ffe4e6', badge: '#f43f5e' },
];

const doy = (d: Date) =>
  Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000);

// Half-open window per sign so cusp days belong to exactly one band.
// Capricorn fills the wrap-around (Dec 22–31 and Jan 1–19).
function signForDate(d: Date): Sign {
  const y = d.getFullYear();
  const t = doy(d);
  for (let i = 1; i < ZODIAC.length; i += 1) {
    const cur = ZODIAC[i];
    const next = ZODIAC[i + 1] ?? ZODIAC[0];
    const curDoy = doy(new Date(y, cur.start.month, cur.start.day));
    const nextDoy =
      next.id === 'capricorn'
        ? doy(new Date(y, 11, 22))
        : doy(new Date(y, next.start.month, next.start.day));
    if (t >= curDoy && t < nextDoy) return cur;
  }
  return ZODIAC[0]; // Capricorn
}

// Per-year cache of doy → sign for boundary days. Twelve grids in
// the same year share one computation.
const BOUNDARY_CACHE = new Map<
  number,
  { startDoy: Map<number, Sign>; endDoy: Map<number, Sign> }
>();
function getBoundaries(year: number) {
  let cached = BOUNDARY_CACHE.get(year);
  if (!cached) {
    const startDoy = new Map<number, Sign>();
    const endDoy = new Map<number, Sign>();
    for (let i = 0; i < ZODIAC.length; i += 1) {
      const sign = ZODIAC[i];
      const next = ZODIAC[(i + 1) % ZODIAC.length];
      startDoy.set(doy(new Date(year, sign.start.month, sign.start.day)), sign);
      const nextStart = new Date(year, next.start.month, next.start.day);
      const endDate = new Date(nextStart);
      endDate.setDate(endDate.getDate() - 1);
      endDoy.set(doy(endDate), sign);
    }
    cached = { startDoy, endDoy };
    BOUNDARY_CACHE.set(year, cached);
  }
  return cached;
}

const MONTHS_BEFORE = 12;
const MONTHS_AFTER = 24;
const CELL_SIZE = 44;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

interface MonthData { firstOfMonth: Date; key: string }

function buildMonths(): MonthData[] {
  const today = new Date();
  today.setDate(1);
  today.setHours(0, 0, 0, 0);
  const out: MonthData[] = [];
  for (let i = -MONTHS_BEFORE; i <= MONTHS_AFTER; i += 1) {
    const d = new Date(today);
    d.setMonth(d.getMonth() + i);
    out.push({ firstOfMonth: d, key: `${d.getFullYear()}-${d.getMonth()}` });
  }
  return out;
}

export default function HoroscopeCalendar() {
  return (
    <View style={{ flex: 1 }}>
      <CalendarProvider mode="single">
        <FocusedHeader />
        <MonthList />
      </CalendarProvider>
    </View>
  );
}

function FocusedHeader() {
  // Return a primitive (epoch ms) so the snapshot's identity stays
  // stable — `toNativeDate` would mint a fresh Date every read and
  // trigger an infinite render loop via `useSyncExternalStore`.
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
      <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#e5e5e5' }}>
        <Text>Scroll the year. Tap any day to see its sign.</Text>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderColor: '#e5e5e5' }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: sign.badge }}>
        <Text style={{ color: '#fff', fontSize: 22 }}>{sign.symbol}</Text>
      </View>
      <View>
        <Text style={{ fontSize: 10, letterSpacing: 1, color: '#737373' }}>
          {focused.toDateString().toUpperCase()}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '600' }}>{sign.name}</Text>
      </View>
    </View>
  );
}

function MonthList() {
  const months = useMemo(() => buildMonths(), []);
  const listRef = useRef<FlashListRef<MonthData> | null>(null);
  const { selectDate } = useCalendarActions();

  useEffect(() => {
    const id = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: MONTHS_BEFORE, animated: false });
    }, 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <FlashList
      ref={listRef}
      data={months}
      keyExtractor={(m) => m.key}
      renderItem={({ item }) => (
        <MonthGrid month={item.firstOfMonth} selectDate={selectDate} />
      )}
    />
  );
}

interface MonthGridProps {
  month: Date;
  selectDate: CalendarActions['selectDate'];
}

const MonthGrid = memo(function MonthGrid({ month, selectDate }: MonthGridProps) {
  const monthLabel = `${MONTH_NAMES[month.getMonth()]} ${month.getFullYear()}`;
  const cells = useMemo(() => {
    const grid = buildMonthGrid(
      gregorianSystem,
      gregorianSystem.fromNativeDate(month),
      0
    );
    return grid.map((c) => {
      const nativeDate = gregorianSystem.toNativeDate(c.date);
      if (!c.isCurrentMonth) return { nativeDate, isCurrentMonth: false } as const;
      const t = doy(nativeDate);
      const { startDoy, endDoy } = getBoundaries(nativeDate.getFullYear());
      return {
        nativeDate,
        isCurrentMonth: true,
        day: gregorianSystem.day(c.date),
        sign: signForDate(nativeDate),
        startSign: startDoy.get(t) ?? null,
        endSign: endDoy.get(t) ?? null,
      } as const;
    });
  }, [month]);

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>{monthLabel}</Text>
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={{ width: CELL_SIZE, textAlign: 'center', fontSize: 11, color: '#737373' }}>
            {w}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((cell, idx) =>
          cell.isCurrentMonth ? (
            <DayCell
              key={cell.nativeDate.toISOString()}
              date={cell.nativeDate}
              day={cell.day}
              tint={cell.sign.tint}
              startSign={cell.startSign}
              endSign={cell.endSign}
              selectDate={selectDate}
            />
          ) : (
            <View key={idx} style={{ width: CELL_SIZE, height: CELL_SIZE }} />
          )
        )}
      </View>
    </View>
  );
});

interface DayCellProps {
  date: Date;
  day: number;
  tint: string;
  startSign: Sign | null;
  endSign: Sign | null;
  selectDate: CalendarActions['selectDate'];
}

const DayCell = memo(function DayCell({ date, day, tint, startSign, endSign, selectDate }: DayCellProps) {
  const isSelected = useCalendarSelector((s) => {
    if (s.mode !== 'single' || !s.selectedDate) return false;
    const d = s.system.toNativeDate(s.selectedDate);
    return d.getFullYear() === date.getFullYear()
      && d.getMonth() === date.getMonth()
      && d.getDate() === date.getDate();
  });
  const handlePress = useCallback(() => selectDate(date), [selectDate, date]);

  return (
    <Pressable onPress={handlePress} style={{ width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: CELL_SIZE - 6,
        height: CELL_SIZE - 6,
        borderRadius: (CELL_SIZE - 6) / 2,
        backgroundColor: tint,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: isSelected ? 2 : 0,
        borderColor: '#000',
      }}>
        <Text style={{ fontSize: 15 }}>{day}</Text>
        {startSign ? <CornerBadge sign={startSign} corner="top" /> : null}
        {endSign   ? <CornerBadge sign={endSign}   corner="bottom" /> : null}
      </View>
    </Pressable>
  );
});

function CornerBadge({ sign, corner }: { sign: Sign; corner: 'top' | 'bottom' }) {
  return (
    <View style={{
      position: 'absolute',
      right: -4,
      [corner === 'top' ? 'top' : 'bottom']: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: sign.badge,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontSize: 10 }}>{sign.symbol}</Text>
    </View>
  );
}
```

## Notes

- **`signForDate` collapses every year to a 0–365 scalar** with `doy()`. This sidesteps leap-year edge cases — Feb 29 doesn't shift any sign boundary.
- **Boundary maps are cached per year**, so twelve months in 2026 share one boundary computation rather than recomputing it twelve times.
- **The library's `mode="single"` store owns the selection**, not a local `useState`. This keeps `useCalendarActions().selectDate` as the single tap entry point and means a focused-day card subscribed via `useCalendarSelector` only re-renders when the focused day changes — not on scroll.
- **Selectors must return primitives.** `s.system.toNativeDate(s.selectedDate)` mints a fresh `Date` every read, which breaks `useSyncExternalStore`'s snapshot caching and triggers an infinite render loop. Return `.getTime()` (or another primitive identity) and reconstruct the `Date` once via `useMemo`.
- **Why not `modifiers`?** `modifiers` are great on a single rendered month, but on a 36-month list the per-cell predicate indirection adds no value: we already hold the `Date` in hand inside the cell, so a single `signForDate(date)` lookup beats twelve named predicates. Bake the band coloring into the cell renderer.
- **Why two corner badges instead of one?** A day that *starts* a sign (e.g. Mar 21 = Aries start) and the day that *ends* the previous sign (Mar 20 = Pisces end) are adjacent. Showing the badge only on the "start" side hides the end-of-band signal; showing it only on "end" hides the new sign. Two corners is the small visual cost that preserves both signals.
