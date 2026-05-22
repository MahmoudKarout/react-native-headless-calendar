import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { type RangeSelectionPayload } from 'react-native-headless-calendar';

import { RangeDateCalendar } from '../../components/RangeDateCalendar/RangeDateCalendar';

export default function RangeWithDisabledDates() {
  const [range, setRange] = useState<RangeSelectionPayload | null>(null);

  const onConfirm = (payload: RangeSelectionPayload) => {
    setRange(payload);
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
      disabledDates: [offset(2), offset(4)],
      disabledRanges: [{ start: offset(8), end: offset(12) }],
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-background gap-4">
      <RangeDateCalendar
        activeSystemId="gregorian"
        onConfirm={onConfirm}
        firstDayOfWeek={0}
        onClear={onClear}
        disabledDates={disabledDates}
        disabledRanges={disabledRanges}
        disabledInRangeBehavior="reject"
        allowSameDay
      />
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
