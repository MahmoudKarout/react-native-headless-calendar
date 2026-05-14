import { ScrollView } from 'react-native';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar } from './HooksCalendar';

export default function DateRangePickerExample() {
  return (
    <ScrollView className="bg-background" contentContainerClassName="p-4">
      <CalendarProvider
        mode="range"
        allowSameDay
        minRangeDays={2}
        maxRangeDays={14}
        onConfirm={(p) => console.log(p)}
      >
        <HooksCalendar caption="Range · 2–14 nights" />
      </CalendarProvider>
    </ScrollView>
  );
}
