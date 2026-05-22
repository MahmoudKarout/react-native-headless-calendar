import { memo, useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  RangeDateProvider,
  type RangeDayCellInfo,
  type RangeSelectionPayload,
  useRangeCalendarActions,
  useRangeCalendarSelector,
} from 'react-native-headless-calendar';
import { tv } from 'tailwind-variants/lite';

import { Footer } from '../../components/RangeDateCalendar/Footer';
import { Header } from '../../components/RangeDateCalendar/Header';

type RangeState = 'default' | 'today' | 'inside' | 'start' | 'end' | 'single';

function getRangeState(cell: RangeDayCellInfo): RangeState {
  if (cell.isRangeStart && cell.isRangeEnd) return 'single';
  if (cell.isRangeStart) return 'start';
  if (cell.isRangeEnd) return 'end';
  if (cell.inRange) return 'inside';
  if (cell.isToday) return 'today';
  return 'default';
}

const cellContainer = tv({
  base: 'items-center justify-center w-[42px] h-[42px]',
  variants: {
    state: {
      default: '',
      today: 'bg-surface-muted rounded-full',
      inside: 'bg-surface-muted',
      start: 'bg-primary rounded-l-full',
      end: 'bg-primary rounded-r-full',
      single: 'bg-primary rounded-full',
    },
    weekend: {
      true: 'bg-red-500/10 rounded-md',
    },
    disabled: {
      true: 'opacity-40',
    },
  },
});

const cellText = tv({
  base: 'text-[14px] font-medium',
  variants: {
    month: {
      current: 'text-foreground',
      outside: 'text-muted opacity-50',
    },
    weekend: { true: 'text-red-400' },
    selected: { true: 'font-semibold text-on-primary' },
  },
});

interface CustomDayCellProps {
  cell: RangeDayCellInfo;
  onPress: (cell: RangeDayCellInfo) => void;
}

const CustomDayCell = memo(function CustomDayCell({
  cell,
  onPress,
}: CustomDayCellProps) {
  const state = getRangeState(cell);
  const selected = state === 'start' || state === 'end' || state === 'single';
  const isWeekend = Boolean(cell.modifiers.weekend);
  const hasEvent = Boolean(cell.modifiers.event);

  const handlePress = useCallback(() => onPress(cell), [cell, onPress]);

  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={handlePress}
      className={cellContainer({
        state,
        weekend: !selected && state === 'default' && isWeekend,
        disabled: cell.isDisabled,
      })}
    >
      <Text
        className={cellText({
          month: cell.isCurrentMonth ? 'current' : 'outside',
          weekend: !selected && isWeekend,
          selected,
        })}
      >
        {cell.label}
      </Text>
      {hasEvent && !selected && (
        <View className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
      )}
    </Pressable>
  );
});

function WeekdayLabels() {
  const weekdays = useRangeCalendarSelector((s) => s.days.weekdayLabels);
  return (
    <View className="flex-row mt-1 mb-1 w-[294px]">
      {weekdays.map((label) => (
        <Text
          key={label}
          className="text-muted text-[11px] font-medium tracking-widest text-center uppercase w-[42px]"
        >
          {label.slice(0, 2)}
        </Text>
      ))}
    </View>
  );
}

function CustomDaysGrid() {
  const cells = useRangeCalendarSelector((s) => s.days.cells);
  const { selectDate } = useRangeCalendarActions();

  const handlePress = useCallback(
    (cell: RangeDayCellInfo) => {
      selectDate(cell.date);
    },
    [selectDate]
  );

  return (
    <View className="flex-row flex-wrap w-[294px]">
      {cells.map((cell) => (
        <CustomDayCell
          key={cell.nativeDate.toISOString()}
          cell={cell}
          onPress={handlePress}
        />
      ))}
    </View>
  );
}

const modifiers = {
  weekend: (d: Date) => d.getDay() === 0 || d.getDay() === 6,
  event: (d: Date) => d.getDate() % 7 === 0,
};

export default function RangeWithCustomCells() {
  const [range, setRange] = useState<RangeSelectionPayload | null>(null);

  const onConfirm = (payload: RangeSelectionPayload) => {
    setRange(payload);
  };

  const onClear = () => {};

  return (
    <View className="flex-1 items-center justify-center bg-background gap-4">
      <RangeDateProvider
        activeSystemId="gregorian"
        firstDayOfWeek={0}
        modifiers={modifiers}
        onConfirm={onConfirm}
        onClear={onClear}
        allowSameDay
      >
        <View className="bg-card border-2 border-border rounded-xl p-4 shadow-sm w-[326px] h-[483px] justify-between">
          <View>
            <Header />
            <View className="items-center">
              <WeekdayLabels />
              <CustomDaysGrid />
            </View>
          </View>
          <Footer />
        </View>
      </RangeDateProvider>

      {range && (
        <View className="bg-surface-muted rounded-2xl p-4 w-[326px] gap-2">
          <View className="flex-row gap-2">
            <Text className="text-muted text-sm font-bold">start:</Text>
            <Text className="text-primary text-sm font-bold">
              {range.gregorianStartDate?.toISOString().split('T')[0]}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Text className="text-muted text-sm font-bold">end:</Text>
            <Text className="text-primary text-sm font-bold">
              {range.gregorianEndDate?.toISOString().split('T')[0]}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
