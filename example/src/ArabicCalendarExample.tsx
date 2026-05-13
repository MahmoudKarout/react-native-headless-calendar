/**
 * Arabic / Hijri calendar — switches the active calendar system at
 * runtime by changing the `<CalendarProvider key>` and re-rendering with
 * a different `initialSystemId`. RTL-style layout via `firstDayOfWeek=6`
 * (Saturday-first).
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CalendarProvider } from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';

import { HooksCalendar, tokens } from './HooksCalendar';

type SystemId = 'gregorian' | 'hijri';

export default function ArabicCalendarExample() {
  const [activeSystemId, setActiveSystemId] = useState<SystemId>('hijri');
  const systems = useMemo(() => [gregorianSystem, hijriSystem], []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.tabs}>
        {(['gregorian', 'hijri'] as const).map((id) => (
          <Pressable
            key={id}
            onPress={() => setActiveSystemId(id)}
            style={[styles.tab, activeSystemId === id && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeSystemId === id && styles.tabTextActive,
              ]}
            >
              {id}
            </Text>
          </Pressable>
        ))}
      </View>

      <CalendarProvider
        key={activeSystemId}
        systems={systems}
        initialSystemId={activeSystemId}
        firstDayOfWeek={6}
        mode="single"
      >
        <HooksCalendar caption={`Active · ${activeSystemId}`} />
      </CalendarProvider>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: tokens.muted, padding: 16 },
  tabs: {
    backgroundColor: tokens.background,
    borderColor: tokens.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 2,
  },
  tab: {
    borderRadius: 6,
    flex: 1,
    paddingVertical: 8,
  },
  tabActive: { backgroundColor: tokens.primary },
  tabText: {
    color: tokens.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tabTextActive: { color: tokens.primaryForeground },
});
