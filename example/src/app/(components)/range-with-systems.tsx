import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  gregorianSystem,
  type RangeSelectionPayload,
} from 'react-native-headless-calendar';
import { hijriSystem } from 'react-native-headless-calendar/systems/hijri';
import { jalaliSystem } from 'react-native-headless-calendar/systems/jalali';

import { RangeDateCalendar } from '../../components/RangeDateCalendar/RangeDateCalendar';

export default function RangeWithSystems() {
  const [range, setRange] = useState<RangeSelectionPayload | null>(null);

  const onConfirm = (payload: RangeSelectionPayload) => {
    setRange(payload);
  };

  const onClear = () => {};

  return (
    <View className="flex-1 items-center justify-center bg-background gap-4">
      <RangeDateCalendar
        activeSystemId="gregorian"
        systems={[gregorianSystem, hijriSystem, jalaliSystem]}
        onConfirm={onConfirm}
        firstDayOfWeek={0}
        onClear={onClear}
        allowSameDay
      />

      {range && (
        <View className="bg-surface-muted rounded-2xl p-4 w-[326px] gap-2">
          <View>
            <Text className="text-muted text-sm font-bold">gregorian:</Text>
            <Text className="text-primary text-sm font-bold">
              {range.gregorianStartDate?.toISOString().split('T')[0]}
              {' → '}
              {range.gregorianEndDate?.toISOString().split('T')[0]}
            </Text>
          </View>
          <View>
            <Text className="text-muted text-sm font-bold">
              {`${range.systemId}:`}
            </Text>
            <Text className="text-primary text-sm font-bold">
              {range.system.start &&
                `${range.system.start.day}-${range.system.start.month}-${range.system.start.year}`}
              {' → '}
              {range.system.end &&
                `${range.system.end.day}-${range.system.end.month}-${range.system.end.year}`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
