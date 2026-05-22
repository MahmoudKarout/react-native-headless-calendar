import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  gregorianSystem,
  type MultipleSelectionPayload,
} from 'react-native-headless-calendar';
import { hijriSystem } from 'react-native-headless-calendar/systems/hijri';
import { jalaliSystem } from 'react-native-headless-calendar/systems/jalali';

import { MultipleDateCalendar } from '../../components/MultipleDateCalendar/MultipleDateCalendar';

export default function MultipleWithSystems() {
  const [selection, setSelection] = useState<MultipleSelectionPayload | null>(
    null
  );

  const onConfirm = (payload: MultipleSelectionPayload) => {
    setSelection(payload);
  };

  const onClear = () => {};

  return (
    <View className="flex-1 items-center justify-center bg-background gap-4">
      <MultipleDateCalendar
        activeSystemId="gregorian"
        systems={[gregorianSystem, hijriSystem, jalaliSystem]}
        onConfirm={onConfirm}
        firstDayOfWeek={0}
        onClear={onClear}
      />

      {selection && selection.gregorianDates.length > 0 && (
        <View className="bg-surface-muted rounded-2xl p-4 w-[326px] gap-2">
          <View>
            <Text className="text-muted text-sm font-bold">gregorian:</Text>
            <Text className="text-primary text-sm font-bold">
              {selection.gregorianDates
                .map((d) => d.toISOString().split('T')[0])
                .join(', ')}
            </Text>
          </View>
          <View>
            <Text className="text-muted text-sm font-bold">
              {`${selection.systemId}:`}
            </Text>
            <Text className="text-primary text-sm font-bold">
              {selection.system
                .map((p) => `${p.day}-${p.month}-${p.year}`)
                .join(', ')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
