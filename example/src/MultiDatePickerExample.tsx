import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CalendarProvider,
  useCalendarSelector,
} from 'react-native-fast-calendar';

import { HooksCalendar, tokens } from './HooksCalendar';

const MODIFIER_STYLES = {
  booked: { borderColor: tokens.destructive, borderWidth: 1.5 },
  holiday: { backgroundColor: '#fef3c7' },
  weekend: { backgroundColor: tokens.muted },
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
    <ScrollView contentContainerStyle={styles.container}>
      <CalendarProvider
        mode="multiple"
        modifiers={modifiers}
        maxSelected={5}
        onConfirm={(p) => console.log(p)}
      >
        <HooksCalendar
          caption="Multi-select · max 5"
          modifierStyles={MODIFIER_STYLES}
        />
        <SelectedSummary />
      </CalendarProvider>
    </ScrollView>
  );
}

function SelectedSummary() {
  const dates = useCalendarSelector((s) => s.selectedDates);
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>Selected</Text>
      <Text style={styles.summaryValue}>{dates.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: tokens.muted, padding: 16 },
  summary: {
    alignItems: 'center',
    backgroundColor: tokens.background,
    borderColor: tokens.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryLabel: {
    color: tokens.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: tokens.foreground,
    fontSize: 20,
    fontWeight: '700',
  },
});
