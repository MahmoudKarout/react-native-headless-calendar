import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar, tokens } from './HooksCalendar';

const EMOJIS = ['🌞', '🌧', '⛅', '🌩', '❄️', '🌪', '🌈'];

export default function CustomDayCellExample() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <CalendarProvider mode="single">
        <HooksCalendar
          caption="Custom day cell"
          cellSize={44}
          renderDay={(cell) => {
            const emoji = EMOJIS[cell.nativeDate.getDate() % EMOJIS.length];
            return (
              <View style={styles.cell}>
                <Text
                  style={[styles.day, cell.isSelected && styles.daySelected]}
                >
                  {cell.label}
                </Text>
                <Text style={styles.emoji}>{emoji}</Text>
              </View>
            );
          }}
        />
      </CalendarProvider>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: tokens.muted, padding: 16 },
  cell: { alignItems: 'center', justifyContent: 'center' },
  day: {
    color: tokens.foreground,
    fontSize: 12,
    fontWeight: '600',
  },
  daySelected: { color: tokens.primaryForeground },
  emoji: { fontSize: 12, marginTop: 1 },
});
