import { memo, useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  buildMonthGrid,
  RangeDateProvider,
  type RangeDateProviderProps,
  useRangeCalendarActions,
  useRangeCalendarSelector,
} from 'react-native-headless-calendar';
import { tv } from 'tailwind-variants/lite';

import { Footer } from '../RangeDateCalendar/Footer';
import {
  buildMonthOffsets,
  CALENDAR_WIDTH,
  COLUMN_WIDTH,
  GRID_WIDTH,
  INITIAL_SCROLL_INDEX,
  monthDisplayed,
  MonthLabel,
  ROW_HEIGHT,
  WeekdayHeader,
  type MonthDescriptor,
} from './shared';

type RangeState = 'default' | 'today' | 'inside' | 'start' | 'end' | 'single';

const cellContainer = tv({
  base: 'items-center justify-center',
  variants: {
    state: {
      default: '',
      today: 'bg-surface-muted rounded-full',
      inside: 'bg-surface-muted',
      start: 'bg-primary rounded-l-full',
      end: 'bg-primary rounded-r-full',
      single: 'bg-primary rounded-full',
    },
  },
});

const cellText = tv({
  base: 'text-[14px] font-medium',
  variants: {
    month: {
      current: 'text-foreground',
      outside: 'text-muted opacity-30',
    },
    selected: { true: 'font-semibold text-on-primary' },
  },
});

interface CellProps {
  date: unknown;
  label: string;
  isCurrentMonth: boolean;
}

const DayCell = memo(function DayCell({
  date,
  label,
  isCurrentMonth,
}: CellProps) {
  const system = useRangeCalendarSelector((s) => s.system);
  const { selectDate } = useRangeCalendarActions();

  const isToday = useRangeCalendarSelector((s) =>
    system.isSame(date, s.system.today())
  );
  const isStart = useRangeCalendarSelector(
    (s) => !!s.rangeStart && system.isSame(date, s.rangeStart)
  );
  const isEnd = useRangeCalendarSelector(
    (s) => !!s.rangeEnd && system.isSame(date, s.rangeEnd)
  );
  const inRange = useRangeCalendarSelector((s) => {
    if (!s.rangeStart || !s.rangeEnd) return false;
    return (
      !system.isBefore(date, s.rangeStart) && !system.isAfter(date, s.rangeEnd)
    );
  });

  const state: RangeState =
    isStart && isEnd
      ? 'single'
      : isStart
        ? 'start'
        : isEnd
          ? 'end'
          : inRange
            ? 'inside'
            : isToday
              ? 'today'
              : 'default';

  const selected = state === 'start' || state === 'end' || state === 'single';

  const onPress = useCallback(() => selectDate(date), [date, selectDate]);

  return (
    <Pressable
      onPress={onPress}
      style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
      className={cellContainer({ state })}
    >
      <Text
        className={cellText({
          month: isCurrentMonth ? 'current' : 'outside',
          selected,
        })}
      >
        {label}
      </Text>
    </Pressable>
  );
});

interface MonthCardProps {
  offset: number;
}

const MonthCard = memo(function MonthCard({ offset }: MonthCardProps) {
  const system = useRangeCalendarSelector((s) => s.system);
  const firstDayOfWeek = useRangeCalendarSelector((s) => s.firstDayOfWeek);

  const displayed = useMemo(
    () => monthDisplayed(system, offset),
    [system, offset]
  );
  const cells = useMemo(
    () => buildMonthGrid(system, displayed, firstDayOfWeek),
    [system, displayed, firstDayOfWeek]
  );
  const label = useMemo(
    () => system.formatMonthYear(displayed),
    [system, displayed]
  );

  return (
    <View className="items-center">
      <MonthLabel label={label} />
      <View className={`flex-row flex-wrap w-[${GRID_WIDTH}px]`}>
        {cells.map((c) =>
          c.isCurrentMonth ? (
            <DayCell
              key={c.index}
              date={c.date}
              label={system.formatDay(c.date)}
              isCurrentMonth
            />
          ) : (
            <View
              key={c.index}
              className={`w-[${COLUMN_WIDTH}px] h-[${ROW_HEIGHT}px]`}
            />
          )
        )}
      </View>
    </View>
  );
});

function MonthList() {
  const weekdays = useRangeCalendarSelector((s) => s.days.weekdayLabels);
  const offsets = useMemo<MonthDescriptor[]>(() => buildMonthOffsets(), []);

  const renderItem = useCallback(
    ({ item }: { item: MonthDescriptor }) => <MonthCard offset={item.offset} />,
    []
  );

  const keyExtractor = useCallback((item: MonthDescriptor) => item.key, []);

  return (
    <View className="flex-1">
      <WeekdayHeader labels={weekdays} />
      <FlashList
        data={offsets}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialScrollIndex={INITIAL_SCROLL_INDEX}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

export type VerticalRangeCalendarProps = Omit<
  RangeDateProviderProps,
  'children'
>;

export function VerticalRangeCalendar(props: VerticalRangeCalendarProps) {
  return (
    <RangeDateProvider {...props}>
      <View
        className={`bg-card border-2 border-border rounded-xl overflow-hidden flex-1 self-center w-[${CALENDAR_WIDTH}px] max-h-[560px]`}
      >
        <MonthList />
        <View className="px-4 pb-3">
          <Footer />
        </View>
      </View>
    </RangeDateProvider>
  );
}
