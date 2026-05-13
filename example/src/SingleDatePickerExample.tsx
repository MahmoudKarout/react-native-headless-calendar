import { ScrollView, StyleSheet } from 'react-native';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar, tokens } from './HooksCalendar';

export default function SingleDatePickerExample() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <CalendarProvider mode="single" onConfirm={(p) => console.log(p)}>
        <HooksCalendar caption="Single date" />
      </CalendarProvider>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: tokens.muted, padding: 16 },
});
