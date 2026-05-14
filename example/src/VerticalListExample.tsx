/**
 * Infinite vertical month list — iOS Calendar style.
 *
 * One shared <CalendarProvider> wraps a FlashList of months. Each row
 * renders a full 6×7 month grid with the weekday header. Cells outside
 * the displayed month are rendered as invisible placeholders so the
 * column geometry stays a clean 7-wide grid.
 *
 * Selection is driven by `useCalendarActions().selectDate` — a stable,
 * subscription-free reference, so MonthList renders exactly once. The
 * per-cell "selected" highlight reads via `useCalendarSelector`, so only
 * the cells whose value actually changed re-render on a tap.
 *
 * Styling: all visual rules are Uniwind classes against the shared
 * design tokens in `global.css`. FlashList accepts `style`/`contentContainerStyle`
 * but not `className`, so we resolve a few classes via `useResolveClassNames`.
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

const MONTHS_BEFORE = 24;
const MONTHS_AFTER = 36;
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

  return (
    <FlashList
      ref={listRef}
      data={months}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => (
        <MonthGrid month={item.firstOfMonth} selectDate={selectDate} />
      )}
    />
  );
}

const keyExtractor = (item: MonthData) => item.key;

interface MonthGridProps {
  month: Date;
  selectDate: CalendarActions['selectDate'];
}

const MonthGrid = memo(function MonthGrid({
  month,
  selectDate,
}: MonthGridProps) {
  const monthIndex = month.getMonth();
  const monthLabel = `${MONTH_NAMES[monthIndex]} ${month.getFullYear()}`;

  const cells = useMemo(() => {
    const grid = buildMonthGrid(
      gregorianSystem,
      gregorianSystem.fromNativeDate(month),
      FIRST_DAY_OF_WEEK
    );
    return grid.map((c) => ({
      nativeDate: gregorianSystem.toNativeDate(c.date),
      day: gregorianSystem.day(c.date),
      isCurrentMonth: c.isCurrentMonth,
    }));
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
  selectDate: CalendarActions['selectDate'];
}

const DayCell = memo(function DayCell({ date, day, selectDate }: DayCellProps) {
  const isSelected = useCalendarSelector((s) => {
    if (s.mode !== 'single' || !s.selectedDate) return false;
    return isSameDay(s.system.toNativeDate(s.selectedDate), date);
  });
  const isToday = isSameDay(date, new Date());
  const handlePress = useCallback(() => selectDate(date), [selectDate, date]);

  return (
    <Pressable
      onPress={handlePress}
      className="items-center justify-center"
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
    >
      <View
        className={`items-center justify-center rounded-full ${
          isSelected ? 'bg-foreground' : isToday ? 'bg-surface-muted' : ''
        }`}
        style={{ width: CELL_SIZE - 8, height: CELL_SIZE - 8 }}
      >
        <Text
          className={`text-base ${
            isSelected
              ? 'text-background font-bold'
              : isToday
                ? 'text-foreground font-bold'
                : 'text-foreground font-medium'
          }`}
        >
          {day}
        </Text>
      </View>
    </Pressable>
  );
});

export default function VerticalListExample() {
  return (
    <View className="flex-1 bg-background">
      <CalendarProvider mode="single">
        <MonthList />
      </CalendarProvider>
    </View>
  );
}
