import { ScrollView, StyleSheet } from 'react-native';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar, tokens } from './HooksCalendar';

export default function DateRangePickerExample() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
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

const styles = StyleSheet.create({
  container: { backgroundColor: tokens.muted, padding: 16 },
});
