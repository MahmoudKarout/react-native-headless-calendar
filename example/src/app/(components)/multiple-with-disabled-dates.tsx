import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { type MultipleSelectionPayload } from 'react-native-headless-calendar';

import { MultipleDateCalendar } from '../../components/MultipleDateCalendar/MultipleDateCalendar';

export default function MultipleWithDisabledDates() {
  const [selection, setSelection] = useState<MultipleSelectionPayload | null>(
    null
  );

  const onConfirm = (payload: MultipleSelectionPayload) => {
    setSelection(payload);
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
      disabledDates: [offset(1), offset(3), offset(5)],
      disabledRanges: [{ start: offset(9), end: offset(13) }],
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-background gap-4">
      <MultipleDateCalendar
        activeSystemId="gregorian"
        onConfirm={onConfirm}
        firstDayOfWeek={0}
        onClear={onClear}
        disabledDates={disabledDates}
        disabledRanges={disabledRanges}
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
