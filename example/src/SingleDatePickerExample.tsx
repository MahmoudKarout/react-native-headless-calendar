import { ScrollView } from 'react-native';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar } from './HooksCalendar';

export default function SingleDatePickerExample() {
  return (
    <ScrollView className="bg-background" contentContainerClassName="p-4">
      <CalendarProvider mode="single" onConfirm={(p) => console.log(p)}>
        <HooksCalendar caption="Single date" />
      </CalendarProvider>
    </ScrollView>
  );
}
