/**
 * Week numbers — derive ISO 8601 week numbers per row from the
 * `cells` array exposed by `useCalendarDays()`. shadcn-styled.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CalendarProvider, useCalendarDays } from 'react-native-fast-calendar';

import { tokens } from './HooksCalendar';

const COLS = 7;
const CELL = 36;

function isoWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

function WeekNumberCalendar() {
  const days = useCalendarDays();
  const rows = days.cells.length / COLS;

  return (
    <View style={styles.card}>
      <Text style={styles.caption}>ISO week numbers</Text>
      <Text style={styles.title}>
        {days.displayedMonthLabel} {days.displayedYearLabel}
      </Text>

      <View style={styles.row}>
        <Text style={[styles.headCell, styles.weekHeadCell]}>Wk</Text>
        {days.weekdayLabels.map((label) => (
          <Text key={label} style={styles.headCell}>
            {label.slice(0, 2)}
          </Text>
        ))}
      </View>

      {Array.from({ length: rows }).map((_, r) => {
        const rowCells = days.cells.slice(r * COLS, (r + 1) * COLS);
        const ref = rowCells[0];
        const wn = ref ? isoWeekNumber(ref.nativeDate) : 0;
        return (
          <View key={r} style={styles.row}>
            <Text style={styles.weekCell}>{wn}</Text>
            {rowCells.map((cell) => (
              <Text
                key={cell.nativeDate.toISOString()}
                style={[styles.day, !cell.isCurrentMonth && styles.dayOutside]}
              >
                {cell.label}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

export default function WeekNumbersExample() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <CalendarProvider mode="single" firstDayOfWeek={1}>
        <WeekNumberCalendar />
      </CalendarProvider>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: tokens.muted, padding: 16 },
  card: {
    backgroundColor: tokens.background,
    borderColor: tokens.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  caption: {
    color: tokens.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: tokens.foreground,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  row: { flexDirection: 'row' },
  headCell: {
    color: tokens.mutedForeground,
    fontSize: 11,
    fontWeight: '500',
    height: CELL,
    letterSpacing: 0.4,
    lineHeight: CELL,
    textAlign: 'center',
    textTransform: 'uppercase',
    width: CELL,
  },
  weekHeadCell: {
    marginRight: 6,
  },
  weekCell: {
    backgroundColor: tokens.muted,
    borderRadius: 6,
    color: tokens.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    height: CELL,
    lineHeight: CELL,
    marginRight: 6,
    textAlign: 'center',
    width: CELL,
  },
  day: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '500',
    height: CELL,
    lineHeight: CELL,
    textAlign: 'center',
    width: CELL,
  },
  dayOutside: { color: tokens.mutedForeground, opacity: 0.5 },
});
