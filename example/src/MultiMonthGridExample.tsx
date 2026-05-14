import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar } from './HooksCalendar';

export default function MultiMonthGridExample() {
  const thisMonth = useMemo(() => new Date(), []);
  const nextMonth = useMemo(() => {
    const d = new Date(thisMonth);
    d.setMonth(d.getMonth() + 1);
    return d;
  }, [thisMonth]);

  return (
    <ScrollView className="bg-background" contentContainerClassName="p-4">
      <Text className="text-muted text-[11px] font-semibold tracking-widest uppercase mb-3">
        Two-month grid
      </Text>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <CalendarProvider mode="range" initialDate={thisMonth}>
            <HooksCalendar hidePickers hideActions />
          </CalendarProvider>
        </View>
        <View className="flex-1">
          <CalendarProvider mode="range" initialDate={nextMonth}>
            <HooksCalendar hidePickers hideActions />
          </CalendarProvider>
        </View>
      </View>
    </ScrollView>
  );
}
