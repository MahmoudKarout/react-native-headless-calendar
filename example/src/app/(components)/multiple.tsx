import { useState } from 'react';
import { Text, View } from 'react-native';
import { type MultipleSelectionPayload } from 'react-native-headless-calendar';

import { MultipleDateCalendar } from '../../components/MultipleDateCalendar/MultipleDateCalendar';

export default function Multiple() {
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
        onConfirm={onConfirm}
        firstDayOfWeek={0}
        onClear={onClear}
      />
      {selection && selection.gregorianDates.length > 0 && (
        <View className="bg-surface-muted rounded-2xl p-4 w-[326px] gap-2">
          <Text className="text-muted text-sm font-bold">
            {selection.systemId} ({selection.gregorianDates.length})
          </Text>
          <Text className="text-primary text-sm font-bold">
            {selection.gregorianDates
              .map((d) => d.toISOString().split('T')[0])
              .join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
}
