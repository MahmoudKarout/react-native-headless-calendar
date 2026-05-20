import { useCallback } from 'react';
import { Text, View } from 'react-native';
import {
  selectSingleDays,
  type SingleDayCellInfo,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-headless-calendar';
import { DayCell } from './DayCell';

function WeekdayLabels() {
  const weekdays = useSingleCalendarSelector((s) => s.days.weekdayLabels);
  return (
    <View className={`flex-row mt-1 mb-1 w-[294px]`}>
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
    <View className={'flex-row flex-wrap w-[294px]'}>
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

export function DayView() {
  return (
    <View className="items-center">
      <WeekdayLabels />
      <DaysGrid />
    </View>
  );
}
