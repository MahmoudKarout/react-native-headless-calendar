import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  CalendarProvider,
  useCalendarSelector,
} from 'react-native-fast-calendar';

import { HooksCalendar } from './HooksCalendar';

const MODIFIER_CLASSNAMES = {
  booked: 'border-2 border-danger',
  holiday: 'bg-warning-soft',
  weekend: 'bg-surface-muted',
};

export default function MultiDatePickerExample() {
  const today = useMemo(() => new Date(), []);
  const modifiers = useMemo(
    () => ({
      booked: [
        new Date(today.getFullYear(), today.getMonth(), 5),
        new Date(today.getFullYear(), today.getMonth(), 12),
      ],
      holiday: [new Date(today.getFullYear(), 11, 25)],
      weekend: (d: Date) => d.getDay() === 0 || d.getDay() === 6,
    }),
    [today]
  );

  return (
    <ScrollView className="bg-background" contentContainerClassName="p-4">
      <CalendarProvider
        mode="multiple"
        modifiers={modifiers}
        maxSelected={5}
        onConfirm={(p) => console.log(p)}
      >
        <HooksCalendar
          caption="Multi-select · max 5"
          modifierClassNames={MODIFIER_CLASSNAMES}
        />
        <SelectedSummary />
      </CalendarProvider>
    </ScrollView>
  );
}

function SelectedSummary() {
  const dates = useCalendarSelector((s) => s.selectedDates);
  return (
    <View className="flex-row items-center justify-between mt-3 px-4 py-3 bg-card border-hairline border-border rounded-xl">
      <Text className="text-muted text-[11px] font-semibold tracking-widest uppercase">
        Selected
      </Text>
      <Text className="text-foreground text-xl font-bold">{dates.length}</Text>
    </View>
  );
}
