import { memo, useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  buildMonthGrid,
  MultipleDateProvider,
  type MultipleDateProviderProps,
  useMultipleCalendarActions,
  useMultipleCalendarSelector,
} from 'react-native-headless-calendar';
import { tv } from 'tailwind-variants/lite';

import { Footer } from '../MultipleDateCalendar/Footer';
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

const cellContainer = tv({
  base: `items-center justify-center rounded-full w-[${COLUMN_WIDTH}px] h-[${ROW_HEIGHT}px]`,
  variants: {
    today: { true: 'bg-surface-muted' },
    selected: { true: 'bg-primary' },
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
  const system = useMultipleCalendarSelector((s) => s.system);
  const { selectDate } = useMultipleCalendarActions();

  const isSelected = useMultipleCalendarSelector((s) =>
    s.selectedDates.some((d) => system.isSame(date, d))
  );
  const isToday = useMultipleCalendarSelector((s) =>
    system.isSame(date, s.system.today())
  );

  const onPress = useCallback(() => selectDate(date), [date, selectDate]);

  return (
    <Pressable
      onPress={onPress}
      className={cellContainer({ today: isToday, selected: isSelected })}
    >
      <Text
        className={cellText({
          month: isCurrentMonth ? 'current' : 'outside',
          selected: isSelected,
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
  const system = useMultipleCalendarSelector((s) => s.system);
  const firstDayOfWeek = useMultipleCalendarSelector((s) => s.firstDayOfWeek);

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
              style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
            />
          )
        )}
      </View>
    </View>
  );
});

function MonthList() {
  const weekdays = useMultipleCalendarSelector((s) => s.days.weekdayLabels);
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

export type VerticalMultipleCalendarProps = Omit<
  MultipleDateProviderProps,
  'children'
>;

export function VerticalMultipleCalendar(props: VerticalMultipleCalendarProps) {
  return (
    <MultipleDateProvider {...props}>
      <View
        className={`bg-card border-2 border-border rounded-xl overflow-hidden flex-1 self-center w-[${CALENDAR_WIDTH}px] max-h-[560px]`}
      >
        <MonthList />
        <View className="px-4 pb-3">
          <Footer />
        </View>
      </View>
    </MultipleDateProvider>
  );
}
