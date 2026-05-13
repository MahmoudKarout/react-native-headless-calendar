/**
 * Flight-price range calendar — shadcn dark variant. Fares are painted
 * into a custom cell renderer driven by `useCalendarDays()`.
 */
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CalendarProvider,
  useCalendarDays,
  useCalendarActions,
  useCalendarSelector,
  type DayCellInfo,
} from 'react-native-fast-calendar';

// shadcn dark zinc palette
const dark = {
  background: '#09090b',
  card: '#18181b',
  border: '#27272a',
  foreground: '#fafafa',
  muted: '#27272a',
  mutedForeground: '#a1a1aa',
  primary: '#fafafa',
  primaryForeground: '#18181b',
  accent: '#27272a',
} as const;

const SEED = 7919;
function priceFor(date: Date): number {
  const k = date.getFullYear() * 372 + date.getMonth() * 31 + date.getDate();
  return 79 + ((k * SEED) % 281);
}

const CELL_W = 48;
const CELL_H = 56;

function PriceCalendar() {
  const days = useCalendarDays();
  const actions = useCalendarActions();
  const rangeStart = useCalendarSelector((s) => s.rangeStart);
  const rangeEnd = useCalendarSelector((s) => s.rangeEnd);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <IconButton onPress={days.goPrevMonth} label="‹" />
        <View style={styles.headerLabels}>
          <Text style={styles.title}>
            {days.displayedMonthLabel} {days.displayedYearLabel}
          </Text>
          <Text style={styles.subtitle}>fares per night</Text>
        </View>
        <IconButton onPress={days.goNextMonth} label="›" />
      </View>

      <View style={styles.daysWrapper}>
        <View style={[styles.weekdays, { width: CELL_W * 7 }]}>
          {days.weekdayLabels.map((l) => (
            <Text key={l} style={styles.weekday}>
              {l.slice(0, 2)}
            </Text>
          ))}
        </View>

        <View style={[styles.grid, { width: CELL_W * 7 }]}>
          {days.cells.map((cell) => (
            <PriceCell
              key={cell.nativeDate.toISOString()}
              cell={cell}
              onPress={() => days.selectDate(cell.date)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.summary}>
          {rangeStart && rangeEnd
            ? 'Range complete'
            : rangeStart
              ? 'Pick the return flight'
              : 'Pick the departure flight'}
        </Text>
        <Pressable
          onPress={actions.confirm}
          disabled={!actions.canConfirm}
          style={[
            styles.confirmButton,
            !actions.canConfirm && styles.confirmDisabled,
          ]}
        >
          <Text
            style={[
              styles.confirmText,
              !actions.canConfirm && styles.confirmTextDisabled,
            ]}
          >
            Confirm
          </Text>
        </Pressable>
      </View>
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

interface PriceCellProps {
  cell: DayCellInfo;
  onPress: () => void;
}

function PriceCell({ cell, onPress }: PriceCellProps) {
  const price = priceFor(cell.nativeDate);
  const isRangeMiddle = cell.inRange && !cell.isRangeStart && !cell.isRangeEnd;
  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={onPress}
      style={[
        styles.cell,
        !cell.isCurrentMonth && styles.cellOutside,
        isRangeMiddle && styles.cellInRange,
        cell.isRangeStart && styles.cellRangeStart,
        cell.isRangeEnd && styles.cellRangeEnd,
        cell.isSelected && styles.cellSelected,
      ]}
    >
      <Text style={[styles.day, cell.isSelected && styles.daySelected]}>
        {cell.label}
      </Text>
      <Text style={[styles.price, cell.isSelected && styles.priceSelected]}>
        ${price}
      </Text>
    </Pressable>
  );
}

export default function FlightPriceCalendarExample() {
  const today = useMemo(() => new Date(), []);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <CalendarProvider mode="range" minDate={today}>
        <PriceCalendar />
      </CalendarProvider>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: dark.background, padding: 16 },
  card: {
    backgroundColor: dark.card,
    borderColor: dark.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLabels: { alignItems: 'center' },
  title: {
    color: dark.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: dark.mutedForeground,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  iconButton: {
    alignItems: 'center',
    borderColor: dark.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  iconButtonText: {
    color: dark.foreground,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 16,
  },
  daysWrapper: { alignItems: 'center' },
  weekdays: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    color: dark.mutedForeground,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.4,
    textAlign: 'center',
    textTransform: 'uppercase',
    width: CELL_W,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    alignItems: 'center',
    borderRadius: 6,
    height: CELL_H,
    justifyContent: 'center',
    width: CELL_W,
  },
  cellOutside: { opacity: 0.35 },
  cellInRange: { backgroundColor: dark.muted, borderRadius: 0 },
  cellRangeStart: {
    backgroundColor: dark.primary,
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
  },
  cellRangeEnd: {
    backgroundColor: dark.primary,
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
  },
  cellSelected: { backgroundColor: dark.primary },
  day: {
    color: dark.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  daySelected: { color: dark.primaryForeground },
  price: {
    color: dark.mutedForeground,
    fontSize: 10,
    marginTop: 2,
  },
  priceSelected: { color: dark.primaryForeground, opacity: 0.7 },
  footer: {
    alignItems: 'center',
    borderTopColor: dark.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
  },
  summary: {
    color: dark.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: dark.primary,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  confirmText: {
    color: dark.primaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmDisabled: { backgroundColor: dark.muted },
  confirmTextDisabled: { color: dark.mutedForeground },
});
