import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar, tokens } from './HooksCalendar';

export default function MultiMonthGridExample() {
  const thisMonth = useMemo(() => new Date(), []);
  const nextMonth = useMemo(() => {
    const d = new Date(thisMonth);
    d.setMonth(d.getMonth() + 1);
    return d;
  }, [thisMonth]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.caption}>Two-month grid</Text>
      <View style={styles.row}>
        <View style={styles.col}>
          <CalendarProvider mode="range" initialDate={thisMonth}>
            <HooksCalendar hidePickers hideActions />
          </CalendarProvider>
        </View>
        <View style={styles.col}>
          <CalendarProvider mode="range" initialDate={nextMonth}>
            <HooksCalendar hidePickers hideActions />
          </CalendarProvider>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: tokens.muted, padding: 16 },
  caption: {
    color: tokens.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
});
