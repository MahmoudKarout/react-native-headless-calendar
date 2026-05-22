import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  selectSingleDays,
  SingleDateProvider,
  type SingleDayCellInfo,
  type SingleSelectionPayload,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-headless-calendar';
import { tv } from 'tailwind-variants/lite';

import { Footer } from '../../components/SingleDateCalendar/Footer';
import { Header } from '../../components/SingleDateCalendar/Header';

const cellContainer = tv({
  base: 'items-center justify-center w-[42px] h-[42px] rounded-full',
  variants: {
    today: { true: 'bg-surface-muted' },
    selected: { true: 'bg-primary' },
    weekend: { true: 'bg-red-500/10' },
    holiday: { true: 'bg-amber-500/20' },
    disabled: { true: 'opacity-40' },
  },
  compoundVariants: [
    { selected: true, weekend: true, class: 'bg-primary' },
    { selected: true, holiday: true, class: 'bg-primary' },
    { selected: true, today: true, class: 'bg-primary' },
  ],
});

const cellText = tv({
  base: 'text-[14px] font-medium',
  variants: {
    month: {
      current: 'text-foreground',
      outside: 'text-muted opacity-40',
    },
    weekend: { true: 'text-red-400' },
    holiday: { true: 'text-amber-400' },
    selected: { true: 'font-semibold text-on-primary' },
  },
});

interface DayCellProps {
  cell: SingleDayCellInfo;
  onPress: (cell: SingleDayCellInfo) => void;
}

const DayCell = memo(function DayCell({ cell, onPress }: DayCellProps) {
  const handlePress = useCallback(() => onPress(cell), [cell, onPress]);

  const weekend = Boolean(cell.modifiers.weekend);
  const holiday = Boolean(cell.modifiers.holiday);
  const event = Boolean(cell.modifiers.event);
  const birthday = Boolean(cell.modifiers.birthday);
  const selected = cell.isSelected;

  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={handlePress}
      className={cellContainer({
        today: cell.isToday,
        selected,
        weekend: !selected && weekend && !holiday,
        holiday: !selected && holiday,
        disabled: cell.isDisabled,
      })}
    >
      <Text
        className={cellText({
          month: cell.isCurrentMonth ? 'current' : 'outside',
          weekend: !selected && weekend && !holiday,
          holiday: !selected && holiday,
          selected,
        })}
      >
        {cell.label}
      </Text>
      {event && !selected && (
        <View className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
      )}
      {birthday && !selected && (
        <Text className="absolute top-0 right-1 text-[10px]">🎂</Text>
      )}
    </Pressable>
  );
});

function WeekdayLabels() {
  const weekdays = useSingleCalendarSelector((s) => s.days.weekdayLabels);
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

function DaysGrid() {
  const days = useSingleCalendarSelector(selectSingleDays);
  const { selectDate } = useSingleCalendarActions();

  const handlePress = useCallback(
    (cell: SingleDayCellInfo) => {
      selectDate(cell.date);
    },
    [selectDate]
  );

  return (
    <View className="flex-row flex-wrap w-[294px]">
      {days.cells.map((cell) => (
        <DayCell
          key={cell.nativeDate.toISOString()}
          cell={cell}
          onPress={handlePress}
        />
      ))}
    </View>
  );
}

function Legend() {
  return (
    <View className="flex-row flex-wrap gap-3 w-[326px] justify-center">
      <View className="flex-row items-center gap-1.5">
        <View className="w-3 h-3 rounded-full bg-red-500/30" />
        <Text className="text-muted text-xs">Weekend</Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <View className="w-3 h-3 rounded-full bg-amber-500/40" />
        <Text className="text-muted text-xs">Holiday</Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <View className="w-1.5 h-1.5 rounded-full bg-primary" />
        <Text className="text-muted text-xs">Event</Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <Text className="text-xs">🎂</Text>
        <Text className="text-muted text-xs">Birthday</Text>
      </View>
    </View>
  );
}

export default function SingleWithModifiers() {
  const [selectedDate, setSelectedDate] =
    useState<SingleSelectionPayload | null>(null);

  const onConfirm = (payload: SingleSelectionPayload) => {
    setSelectedDate(payload);
  };

  const onClear = () => {};

  const modifiers = useMemo(() => {
    const today = new Date();
    const offset = (days: number) => {
      const d = new Date(today);
      d.setDate(today.getDate() + days);
      return d;
    };
    const eventDates = [offset(3), offset(8), offset(15)];
    const holidayDates = [offset(5), offset(12)];
    const birthday = offset(20);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    return {
      weekend: (d: Date) => d.getDay() === 0 || d.getDay() === 6,
      holiday: holidayDates,
      event: eventDates,
      birthday: (d: Date) => sameDay(d, birthday),
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-background gap-4">
      <SingleDateProvider
        activeSystemId="gregorian"
        firstDayOfWeek={0}
        modifiers={modifiers}
        onConfirm={onConfirm}
        onClear={onClear}
      >
        <View className="bg-card border-2 border-border rounded-xl p-4 shadow-sm w-[326px] h-[483px] justify-between">
          <View>
            <Header />
            <View className="items-center">
              <WeekdayLabels />
              <DaysGrid />
            </View>
          </View>
          <Footer />
        </View>
      </SingleDateProvider>

      <Legend />

      {selectedDate && (
        <View className="bg-surface-muted rounded-lg p-4 w-[326px] flex-row justify-center gap-2">
          <Text className="text-muted text-sm font-bold">
            {selectedDate?.systemId}
            {`: `}
          </Text>
          <Text className="text-primary text-sm font-bold">
            {selectedDate?.gregorianDate?.toISOString().split('T')[0]}
          </Text>
        </View>
      )}
    </View>
  );
}
