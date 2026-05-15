/**
 * Performance demo — render counters per cell. shadcn-styled.
 *
 * Each cell is wrapped in `React.memo` and increments a per-instance
 * render counter. When you tap a date in range mode, only the cells
 * that actually change state should re-render — every other cell stays
 * at its initial count.
 *
 * ── How granular subscription is achieved ───────────────────────────────
 *
 * The naive approach — `useCalendarSelector(selectDays)` in the parent and
 * passing each `DayCellInfo` down as a prop — re-renders every cell on every
 * selection change. That's because `selectDays` returns a fresh `cells` array
 * (every cell is a new object) whenever any slice of the snapshot changes,
 * so both the prop reference and the inline arrow handler change on every
 * tap, defeating `React.memo`.
 *
 * Instead each cell:
 *
 *   • Receives only stable primitives as props (the native-date timestamp
 *     + display flags + a stable `selectDate` action ref).
 *   • Subscribes to its OWN slice (`isSelected`, `inRange`, `isToday`)
 *     through a narrow `useCalendarSelector` predicate.
 *   • Recomputes its bound `onPress` exactly once per cell via `useCallback`.
 *
 * Result: tapping a date re-renders the previously-selected cell + the
 * newly-tapped cell. In range mode, only the cells whose `inRange` truth
 * actually flips re-render. Every other cell short-circuits through memo.
 */
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  CalendarProvider,
  buildMonthGrid,
  gregorianSystem,
  useCalendarActions,
  useCalendarSelector,
  type CalendarActions,
} from 'react-native-fast-calendar';

const CELL = 44;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
const FIRST_DAY_OF_WEEK = 0;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isBetween = (d: Date, a: Date, b: Date) => {
  const t = d.getTime();
  const lo = Math.min(a.getTime(), b.getTime());
  const hi = Math.max(a.getTime(), b.getTime());
  return t > lo && t < hi;
};

function PerfGrid() {
  const monthKey = useCalendarSelector((s) => {
    const d = s.system.toNativeDate(s.displayed);
    return `${d.getFullYear()}-${d.getMonth()}`;
  });

  const actions = useCalendarActions();

  const cells = useMemo(() => {
    const [yearStr, monthStr] = monthKey.split('-');
    const firstOfMonth = new Date(Number(yearStr), Number(monthStr), 1);
    const grid = buildMonthGrid(
      gregorianSystem,
      gregorianSystem.fromNativeDate(firstOfMonth),
      FIRST_DAY_OF_WEEK
    );
    return grid.map((c) => ({
      nativeDate: gregorianSystem.toNativeDate(c.date),
      day: gregorianSystem.day(c.date),
      isCurrentMonth: c.isCurrentMonth,
    }));
  }, [monthKey]);

  const [yearStr, monthStr] = monthKey.split('-');
  const monthLabel = MONTH_NAMES[Number(monthStr)];

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <IconButton onPress={actions.goPrevMonth} label="‹" />
        <View className="items-center">
          <Text className="text-foreground text-sm font-semibold">
            {monthLabel} {yearStr}
          </Text>
          <Text className="text-muted text-[10px] font-medium tracking-widest uppercase mt-0.5">
            render counters
          </Text>
        </View>
        <IconButton onPress={actions.goNextMonth} label="›" />
      </View>

      <View className="items-center">
        <View className="flex-row mb-1" style={{ width: CELL * 7 }}>
          {WEEKDAYS.map((l) => (
            <Text
              key={l}
              className="text-muted text-[11px] font-medium tracking-widest text-center uppercase"
              style={{ width: CELL }}
            >
              {l.slice(0, 2)}
            </Text>
          ))}
        </View>

        <View className="flex-row flex-wrap" style={{ width: CELL * 7 }}>
          {cells.map((cell, idx) => (
            <CountedCell
              key={`${monthKey}-${idx}`}
              nativeDate={cell.nativeDate}
              day={cell.day}
              isCurrentMonth={cell.isCurrentMonth}
              selectDate={actions.selectDate}
            />
          ))}
        </View>
      </View>

      <Pressable
        onPress={actions.clear}
        className="items-center bg-primary rounded-md mt-3 py-2.5 active:bg-primary-strong"
      >
        <Text className="text-on-primary text-[13px] font-semibold">
          Reset selection
        </Text>
      </Pressable>
    </View>
  );
}

function IconButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center w-7 h-7 rounded-md border-hairline border-border active:bg-surface-muted"
    >
      <Text className="text-foreground text-base font-medium leading-4">
        {label}
      </Text>
    </Pressable>
  );
}

interface CountedCellProps {
  nativeDate: Date;
  day: number;
  isCurrentMonth: boolean;
  selectDate: CalendarActions['selectDate'];
}

const CountedCell = memo(function CountedCell({
  nativeDate,
  day,
  isCurrentMonth,
  selectDate,
}: CountedCellProps) {
  const isSelected = useCalendarSelector((s) => {
    if (s.mode === 'single') {
      return (
        !!s.selectedDate &&
        isSameDay(s.system.toNativeDate(s.selectedDate), nativeDate)
      );
    }
    if (s.mode === 'range') {
      const startNative = s.rangeStart
        ? s.system.toNativeDate(s.rangeStart)
        : null;
      const endNative = s.rangeEnd ? s.system.toNativeDate(s.rangeEnd) : null;
      return (
        (!!startNative && isSameDay(startNative, nativeDate)) ||
        (!!endNative && isSameDay(endNative, nativeDate))
      );
    }
    return s.selectedDates.some((d) =>
      isSameDay(s.system.toNativeDate(d), nativeDate)
    );
  });

  const inRange = useCalendarSelector((s) => {
    if (s.mode !== 'range' || !s.rangeStart || !s.rangeEnd) return false;
    return isBetween(
      nativeDate,
      s.system.toNativeDate(s.rangeStart),
      s.system.toNativeDate(s.rangeEnd)
    );
  });

  const isToday = useMemo(
    () => isSameDay(nativeDate, new Date()),
    [nativeDate]
  );

  const renders = useRef(0);
  renders.current += 1;

  const handlePress = useCallback(
    () => selectDate(nativeDate),
    [selectDate, nativeDate]
  );

  const stateClass = [
    'items-center justify-center',
    !isCurrentMonth && 'opacity-40',
    inRange ? 'bg-surface-muted rounded-none' : 'rounded-md',
    isSelected && 'bg-primary',
    isToday && !isSelected && 'bg-surface-muted',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      onPress={handlePress}
      className={stateClass}
      style={{ width: CELL, height: CELL }}
    >
      <Text
        className={`text-[13px] font-semibold ${isSelected ? 'text-on-primary' : 'text-foreground'}`}
      >
        {day}
      </Text>
      <Text
        className={`text-[9px] mt-px ${isSelected ? 'text-on-primary opacity-80' : 'text-muted'}`}
      >
        ×{renders.current}
      </Text>
    </Pressable>
  );
});

export default function PerfCalendarExample() {
  const [key, setKey] = useState(0);
  return (
    <ScrollView className="bg-background" contentContainerClassName="p-4">
      <Pressable
        onPress={() => setKey((k) => k + 1)}
        className="items-center border-hairline border-border rounded-lg mb-3 py-2.5 active:bg-surface-muted"
      >
        <Text className="text-foreground text-[13px] font-medium">
          Remount calendar (reset counters)
        </Text>
      </Pressable>
      <View className="bg-card border-hairline border-border rounded-xl p-4">
        <CalendarProvider key={key} mode="range">
          <PerfGrid />
        </CalendarProvider>
      </View>
    </ScrollView>
  );
}
