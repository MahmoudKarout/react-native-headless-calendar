/**
 * Swipeable horizontal-paged calendar — one month per page.
 *
 * Built with @shopify/flash-list in horizontal paging mode:
 *   • `pagingEnabled` + `snapToInterval` snap each swipe to a full
 *     month-width page.
 *   • A shared <CalendarProvider mode="single"> owns the selection.
 *   • Each MonthPage builds its 6×7 grid via the library's public
 *     `buildMonthGrid` utility against `gregorianSystem` — same
 *     pattern as VerticalListExample, just rotated 90°.
 *   • The visible-month label is driven by FlashList's
 *     `onViewableItemsChanged` so the header always matches the
 *     month the user has currently swiped onto.
 *   • Each day cell subscribes only to its own selection bit via
 *     `useCalendarSelector` — tapping a date re-renders exactly two
 *     cells (the old + new selection). Every other cell short-circuits
 *     through React.memo, so swipes stay 60 fps.
 *
 * Styling is fully driven by Uniwind utilities.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
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

const viewabilityConfig = { itemVisiblePercentThreshold: 60 };

function SwipeablePager() {
  const months = useMemo(() => buildMonths(), []);
  const todayIndex = MONTHS_BEFORE;
  const listRef = useRef<FlashListRef<MonthData> | null>(null);
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = windowWidth;
  const [activeIndex, setActiveIndex] = useState(todayIndex);

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

  const onViewableItemsChanged = (info: {
    viewableItems: { index: number | null }[];
  }) => {
    const first = info.viewableItems[0];
    if (first && typeof first.index === 'number') {
      setActiveIndex(first.index);
    }
  };

  const goPrev = useCallback(() => {
    listRef.current?.scrollToIndex({
      index: Math.max(0, activeIndex - 1),
      animated: true,
    });
  }, [activeIndex]);

  const goNext = useCallback(() => {
    listRef.current?.scrollToIndex({
      index: Math.min(months.length - 1, activeIndex + 1),
      animated: true,
    });
  }, [activeIndex, months.length]);

  const activeMonth = months[activeIndex]?.firstOfMonth;
  const activeLabel = activeMonth
    ? `${MONTH_NAMES[activeMonth.getMonth()]} ${activeMonth.getFullYear()}`
    : '';

  const renderItem = ({ item }: { item: MonthData }) => (
    <MonthPage
      month={item.firstOfMonth}
      pageWidth={pageWidth}
      selectDate={selectDate}
    />
  );

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-4 py-3.5 border-b-hairline border-border">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={goPrev}
          className="items-center justify-center w-8 h-8 rounded-lg border-hairline border-border active:bg-surface-muted"
        >
          <Text className="text-foreground text-lg leading-[18px]">‹</Text>
        </Pressable>

        <Text
          className="flex-1 text-center text-foreground text-[17px] font-bold tracking-tight"
          numberOfLines={1}
        >
          {activeLabel}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={goNext}
          className="items-center justify-center w-8 h-8 rounded-lg border-hairline border-border active:bg-surface-muted"
        >
          <Text className="text-foreground text-lg leading-[18px]">›</Text>
        </Pressable>
      </View>

      <View className="flex-row px-4 py-2 border-b-hairline border-border">
        {WEEKDAYS.map((label) => (
          <Text
            key={label}
            className="flex-1 text-muted text-[11px] font-semibold tracking-widest text-center"
          >
            {label.toUpperCase()}
          </Text>
        ))}
      </View>

      <FlashList
        ref={listRef}
        data={months}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        keyExtractor={keyExtractor}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={renderItem}
      />
    </View>
  );
}

const keyExtractor = (item: MonthData) => item.key;

interface MonthPageProps {
  month: Date;
  pageWidth: number;
  selectDate: CalendarActions['selectDate'];
}

const MonthPage = memo(function MonthPage({
  month,
  pageWidth,
  selectDate,
}: MonthPageProps) {
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
    <View className="px-4 py-3" style={{ width: pageWidth }}>
      <View className="flex-row flex-wrap">
        {cells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <View
                key={idx}
                className="items-center justify-center"
                style={{ flexBasis: `${100 / 7}%`, height: CELL_SIZE }}
              />
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
      style={{ flexBasis: `${100 / 7}%`, height: CELL_SIZE }}
      accessibilityRole="button"
      accessibilityLabel={date.toDateString()}
      accessibilityState={{ selected: isSelected }}
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

export default function SwipeableCalendarExample() {
  return (
    <View className="flex-1 bg-background">
      <CalendarProvider mode="single">
        <SwipeablePager />
      </CalendarProvider>
    </View>
  );
}
