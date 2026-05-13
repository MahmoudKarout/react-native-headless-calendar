/**
 * Performance demo — render counters per cell. shadcn-styled.
 *
 * Each cell is wrapped in `React.memo` and increments a per-instance
 * render counter. When you tap a date in range mode, only the cells
 * that actually change state should re-render — every other cell stays
 * at its initial count.
 */
import { memo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  CalendarProvider,
  useCalendarDays,
  useCalendarActions,
  type DayCellInfo,
} from 'react-native-fast-calendar';

import { tokens } from './HooksCalendar';

const CELL = 44;

function PerfGrid() {
  const days = useCalendarDays();
  const actions = useCalendarActions();

  return (
    <View>
      <View style={styles.header}>
        <IconButton onPress={days.goPrevMonth} label="‹" />
        <View style={styles.headerLabels}>
          <Text style={styles.title}>
            {days.displayedMonthLabel} {days.displayedYearLabel}
          </Text>
          <Text style={styles.subtitle}>render counters</Text>
        </View>
        <IconButton onPress={days.goNextMonth} label="›" />
      </View>

      <View style={styles.daysWrapper}>
        <View style={[styles.weekdays, { width: CELL * 7 }]}>
          {days.weekdayLabels.map((l) => (
            <Text key={l} style={styles.weekday}>
              {l.slice(0, 2)}
            </Text>
          ))}
        </View>

        <View style={[styles.grid, { width: CELL * 7 }]}>
          {days.cells.map((cell) => (
            <CountedCell
              key={cell.nativeDate.toISOString()}
              cell={cell}
              onPress={() => days.selectDate(cell.date)}
            />
          ))}
        </View>
      </View>

      <Pressable onPress={actions.clear} style={styles.clearButton}>
        <Text style={styles.clearText}>Reset selection</Text>
      </Pressable>
    </View>
  );
}

function IconButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.iconButton}>
      <Text style={styles.iconButtonText}>{label}</Text>
    </Pressable>
  );
}

interface CountedCellProps {
  cell: DayCellInfo;
  onPress: () => void;
}

const CountedCell = memo(
  function CountedCell({ cell, onPress }: CountedCellProps) {
    const renders = useRef(0);
    renders.current += 1;
    return (
      <Pressable
        disabled={cell.isDisabled}
        onPress={onPress}
        style={[
          styles.cell,
          !cell.isCurrentMonth && styles.cellOutside,
          cell.inRange && styles.cellInRange,
          cell.isSelected && styles.cellSelected,
          cell.isToday && !cell.isSelected && styles.cellToday,
        ]}
      >
        <Text style={[styles.day, cell.isSelected && styles.daySelected]}>
          {cell.label}
        </Text>
        <Text
          style={[styles.counter, cell.isSelected && styles.counterSelected]}
        >
          ×{renders.current}
        </Text>
      </Pressable>
    );
  },
  (prev, next) => prev.cell === next.cell && prev.onPress === next.onPress
);

export default function PerfCalendarExample() {
  const [key, setKey] = useState(0);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => setKey((k) => k + 1)} style={styles.remount}>
        <Text style={styles.remountText}>
          Remount calendar (reset counters)
        </Text>
      </Pressable>
      <View style={styles.card}>
        <CalendarProvider key={key} mode="range">
          <PerfGrid />
        </CalendarProvider>
      </View>
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLabels: { alignItems: 'center' },
  title: {
    color: tokens.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: tokens.mutedForeground,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  iconButton: {
    alignItems: 'center',
    borderColor: tokens.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  iconButtonText: {
    color: tokens.foreground,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 16,
  },
  daysWrapper: { alignItems: 'center' },
  weekdays: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    color: tokens.mutedForeground,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.4,
    textAlign: 'center',
    textTransform: 'uppercase',
    width: CELL,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    alignItems: 'center',
    borderRadius: 6,
    height: CELL,
    justifyContent: 'center',
    width: CELL,
  },
  cellOutside: { opacity: 0.4 },
  cellInRange: { backgroundColor: tokens.muted, borderRadius: 0 },
  cellSelected: { backgroundColor: tokens.primary },
  cellToday: { backgroundColor: tokens.accent },
  day: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  daySelected: { color: tokens.primaryForeground },
  counter: {
    color: tokens.mutedForeground,
    fontSize: 9,
    marginTop: 1,
  },
  counterSelected: { color: tokens.primaryForeground, opacity: 0.8 },
  remount: {
    alignItems: 'center',
    borderColor: tokens.border,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    paddingVertical: 10,
  },
  remountText: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '500',
  },
  clearButton: {
    alignItems: 'center',
    backgroundColor: tokens.primary,
    borderRadius: 6,
    marginTop: 12,
    paddingVertical: 10,
  },
  clearText: {
    color: tokens.primaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
});
