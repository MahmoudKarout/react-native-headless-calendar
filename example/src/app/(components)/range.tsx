import { useState } from 'react';
import { Text, View } from 'react-native';
import { type RangeSelectionPayload } from 'react-native-headless-calendar';

import { RangeDateCalendar } from '../../components/RangeDateCalendar/RangeDateCalendar';

export default function Range() {
  const [range, setRange] = useState<RangeSelectionPayload | null>(null);

  const onConfirm = (payload: RangeSelectionPayload) => {
    setRange(payload);
  };

  const onClear = () => {};

  return (
    <View className="flex-1 items-center justify-center bg-background gap-4">
      <RangeDateCalendar
        activeSystemId="gregorian"
        onConfirm={onConfirm}
        firstDayOfWeek={0}
        onClear={onClear}
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
