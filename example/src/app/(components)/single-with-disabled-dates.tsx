import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { type SingleSelectionPayload } from 'react-native-headless-calendar';

import { SingleDateCalendar } from '../../components/SingleDateCalendar/SingleDateCalendar';

export default function SingleWithDisabledDates() {
  const [selectedDate, setSelectedDate] =
    useState<SingleSelectionPayload | null>(null);

  const onConfirm = (payload: SingleSelectionPayload) => {
    setSelectedDate(payload);
  };

  const onClear = () => {};

  const { disabledDates, disabledRanges } = useMemo(() => {
    const today = new Date();
    const offset = (days: number) => {
      const d = new Date(today);
      d.setDate(today.getDate() + days);
      return d;
    };
    return {
      disabledDates: [offset(1), offset(3), offset(7)],
      disabledRanges: [{ start: offset(10), end: offset(14) }],
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-background gap-4">
      <SingleDateCalendar
        activeSystemId="gregorian"
        onConfirm={onConfirm}
        firstDayOfWeek={0}
        onClear={onClear}
        initialDate={selectedDate}
        disabledDates={disabledDates}
        disabledRanges={disabledRanges}
      />
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
