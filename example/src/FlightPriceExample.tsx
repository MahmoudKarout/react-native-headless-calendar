/**
 * Flight price calendar — a dark-themed, fare-aware date range picker.
 *
 * This example renders a range of dates with the per-day flight fare
 * stamped underneath each day number, the way Skyscanner / Google Flights
 * present "best price" calendars. Picking a departure + return date
 * shows the total fare and trip duration in a footer summary.
 *
 * The library still only ships <Calendar.Root> and <Calendar.DayGrid>;
 * everything else here — header, custom day cell, footer summary — is
 * consumer code that talks to the headless store via hooks.
 *
 * Highlights
 * - `mode="range"`, `minRangeDays={1}`, `maxRangeDays={30}` for typical
 *   one-way / round-trip windows.
 * - `renderDay` returns a custom price cell. The cell reads
 *   `info.isSelected`, `info.inRange`, `info.isDisabled`, and the
 *   fare-lookup table to pick its background + text colour, so a single
 *   tap re-renders only the affected cell (range-mode flips two: the
 *   freshly-tapped endpoint and the old one).
 * - `minDate` is set to today, so historical fares can't be selected.
 * - The shell is pinned to the grid's natural width with the same
 *   CalendarShell trick used in the main demo, so the chevrons line up
 *   with the column they navigate.
 */
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import {
  Calendar,
  useCalendarActions,
  useCalendarMonthLabel,
  useCalendarNavigation,
  useCalendarSelector,
  useCalendarStore,
  useCalendarYearLabel,
  type CalendarSystem,
  type CalendarThemeOverride,
  type DayCellInfo,
} from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';

// ===========================================================================
// Dark palette — black surface with a single accent (off-white "selected").
// ===========================================================================

const C = {
  background: '#000000',
  surface: '#0A0A0A',
  rangeBackground: '#1F1F1F',
  border: '#262626',
  foreground: '#F5F5F5',
  mutedForeground: '#9CA3AF',
  disabled: '#3F3F46',
  selected: '#FAFAFA',
  selectedForeground: '#0A0A0A',
  accent: '#22C55E', // cheap-fare green
};

const CELL_WIDTH = 48;
const CELL_HEIGHT = 56;
const COLS = 7;
const GRID_WIDTH = CELL_WIDTH * COLS;

const FLIGHT_THEME: CalendarThemeOverride = {
  colors: {
    background: C.background,
    primary: C.selected,
    onPrimary: C.selectedForeground,
    text: C.foreground,
    textMuted: C.mutedForeground,
    todayBorder: C.foreground,
    rangeBackground: C.rangeBackground,
    disabled: C.disabled,
    border: C.border,
  },
  cellSize: CELL_WIDTH,
  borderRadius: 8,
  fontSize: { day: 14, weekday: 12, header: 14 },
  spacing: { cellInnerGap: 4, controlGap: 6, controlPadding: 10, monthGap: 14, containerPadding: 20 },
};

const SYSTEMS: CalendarSystem[] = [gregorianSystem];

// ===========================================================================
// Fare table — deterministic per-date pricing.
//
// In a real product these would come from a fares API. We derive a price
// from the (year, month, day) tuple so the same date always shows the
// same fare and the calendar stays stable across re-renders.
// ===========================================================================

const BASE_FARE = 100;
const WEEKEND_SURCHARGE = 20;
const MIN_FARE = 80;

function getFareFor(date: Date): number {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const seasonalBump = date.getMonth() >= 5 && date.getMonth() <= 7 ? 30 : 0;
  const dailyJitter = (date.getDate() * 7) % 25;
  return Math.max(
    MIN_FARE,
    BASE_FARE + (isWeekend ? WEEKEND_SURCHARGE : 0) + seasonalBump + dailyJitter
  );
}

// ===========================================================================
// FlightPriceExample — entry point used by the storybook story.
// ===========================================================================

export default function FlightPriceExample() {
  const [trip, setTrip] = useState<{ departure?: Date; returnDate?: Date }>({});
  const today = new Date();

  return (
    <View style={styles.screen}>
      <Calendar.Root
        allowSameDay={false}
        maxRangeDays={30}
        minDate={today}
        minRangeDays={1}
        mode="range"
        onConfirm={({ startDate, endDate }) => {
          setTrip({ departure: startDate, returnDate: endDate });
        }}
        systems={SYSTEMS}
        theme={FLIGHT_THEME}
      >
        <View style={styles.shell}>
          <CalendarHeader />

          <Calendar.DayGrid
            renderDay={(info) => <PriceDayCell info={info} />}
          />

          <FareSummary />

          <ActionRow trip={trip} />
        </View>
      </Calendar.Root>
    </View>
  );
}

// ===========================================================================
// Header — month + year buttons on the left, prev/next on the right. The
// caret next to month + year hints that they're tappable (they switch
// the grid into the month- and year-picker views via the store).
// ===========================================================================

function CalendarHeader() {
  const month = useCalendarMonthLabel();
  const year = useCalendarYearLabel();
  const { goPrev, goNext } = useCalendarNavigation();

  return (
    <View style={styles.header}>
      <Pressable onPress={goPrev} style={styles.iconBtn} hitSlop={8}>
        <Text style={styles.iconGlyph}>‹</Text>
      </Pressable>

      <View style={styles.headerLabels}>
        {month.isVisible && (
          <Pressable
            onPress={month.toggle}
            style={({ pressed }) => [
              styles.headerLabel,
              pressed && styles.headerLabelPressed,
            ]}
          >
            <Text style={styles.headerLabelText}>{month.label}</Text>
            <Text style={styles.headerCaret}>⌄</Text>
          </Pressable>
        )}
        <Pressable
          onPress={year.toggle}
          style={({ pressed }) => [
            styles.headerLabel,
            pressed && styles.headerLabelPressed,
          ]}
        >
          <Text style={styles.headerLabelText}>{year.label}</Text>
          <Text style={styles.headerCaret}>⌄</Text>
        </Pressable>
      </View>

      <Pressable onPress={goNext} style={styles.iconBtn} hitSlop={8}>
        <Text style={styles.iconGlyph}>›</Text>
      </Pressable>
    </View>
  );
}

// ===========================================================================
// PriceDayCell — the heart of the demo. Renders day number + price below.
//
// The library passes us the canonical info for the cell (today flag,
// selected flag, in-range flag, isDisabled, etc.); we pick the styling.
// Selecting the same day twice is blocked by `allowSameDay={false}` on
// Root, so the press handler can stay naive.
// ===========================================================================

function PriceDayCell({ info }: { info: DayCellInfo }) {
  const store = useCalendarStore();
  const fare = info.isCurrentMonth ? getFareFor(info.nativeDate) : null;
  const isCheapest = fare !== null && fare <= BASE_FARE;

  const onPress = () => store.selectDate(info.date);

  // Range visuals — start, end, in-between, and "first / last in row" so
  // the in-range bar isn't truncated when it spans a row.
  const isStart = info.isRangeStart;
  const isEnd = info.isRangeEnd;
  const inMiddle = info.inRange && !isStart && !isEnd;

  const wrapperStyle: ViewStyle[] = [styles.cellWrapper];
  if (info.inRange || isStart || isEnd) {
    wrapperStyle.push({ backgroundColor: C.rangeBackground });
  }
  if (isStart) {
    wrapperStyle.push(styles.cellWrapperStart);
  }
  if (isEnd) {
    wrapperStyle.push(styles.cellWrapperEnd);
  }
  if (isStart && isEnd) {
    wrapperStyle.push(styles.cellWrapperSingle);
  }

  return (
    <View style={wrapperStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          disabled: info.isDisabled,
          selected: info.isSelected,
        }}
        disabled={info.isDisabled || !info.isCurrentMonth}
        onPress={info.isDisabled ? undefined : onPress}
        style={[
          styles.cell,
          info.isToday && !info.isSelected && !inMiddle && styles.cellToday,
          (isStart || isEnd) && styles.cellSelected,
        ]}
      >
        <Text
          style={[
            styles.cellLabel,
            !info.isCurrentMonth && styles.cellLabelOutside,
            info.isDisabled && styles.cellLabelDisabled,
            (isStart || isEnd) && styles.cellLabelSelected,
          ]}
        >
          {info.label}
        </Text>
        {fare !== null && !info.isDisabled && (
          <Text
            style={[
              styles.cellFare,
              isCheapest && styles.cellFareCheap,
              (isStart || isEnd) && styles.cellFareSelected,
            ]}
          >
            ${fare}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

// ===========================================================================
// FareSummary — total trip cost + nights, fed by the store. Re-renders
// only when the range itself changes.
// ===========================================================================

function FareSummary() {
  const rangeStart = useCalendarSelector((s) => s.rangeStart);
  const rangeEnd = useCalendarSelector((s) => s.rangeEnd);
  const system = useCalendarSelector((s) => s.system);

  if (!rangeStart && !rangeEnd) {
    return (
      <View style={styles.summary}>
        <Text style={styles.summaryHint}>Select departure date</Text>
      </View>
    );
  }
  if (rangeStart && !rangeEnd) {
    const departure = system.toNativeDate(rangeStart);
    return (
      <View style={styles.summary}>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>Departure</Text>
          <Text style={styles.summaryValue}>{formatDate(departure)}</Text>
        </View>
        <Text style={styles.summaryArrow}>→</Text>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>Return</Text>
          <Text style={styles.summaryHint}>Select return date</Text>
        </View>
      </View>
    );
  }

  const departure = system.toNativeDate(rangeStart!);
  const returnDate = system.toNativeDate(rangeEnd!);
  const total = totalFare(departure, returnDate);
  const nights = Math.max(
    1,
    Math.round((returnDate.getTime() - departure.getTime()) / 86_400_000)
  );

  return (
    <View style={styles.summaryStack}>
      <View style={styles.summary}>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>Departure</Text>
          <Text style={styles.summaryValue}>{formatDate(departure)}</Text>
        </View>
        <Text style={styles.summaryArrow}>→</Text>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>Return</Text>
          <Text style={styles.summaryValue}>{formatDate(returnDate)}</Text>
        </View>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>
          {nights} night{nights === 1 ? '' : 's'} · round trip
        </Text>
        <Text style={styles.totalValue}>${total}</Text>
      </View>
    </View>
  );
}

function totalFare(start: Date, end: Date): number {
  let total = 0;
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    total += getFareFor(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ===========================================================================
// ActionRow — clear + confirm.
// ===========================================================================

function ActionRow({
  trip,
}: {
  trip: { departure?: Date; returnDate?: Date };
}) {
  const { canConfirm, clear, confirm } = useCalendarActions();
  return (
    <View style={styles.actionRow}>
      <Pressable
        onPress={clear}
        style={({ pressed }) => [
          styles.actionBtn,
          styles.actionBtnGhost,
          pressed && styles.actionBtnPressed,
        ]}
      >
        <Text style={styles.actionLabelGhost}>Clear</Text>
      </Pressable>
      <Pressable
        accessibilityState={{ disabled: !canConfirm }}
        disabled={!canConfirm}
        onPress={confirm}
        style={({ pressed }) => [
          styles.actionBtn,
          styles.actionBtnPrimary,
          !canConfirm && styles.actionBtnDisabled,
          pressed && canConfirm && styles.actionBtnPressed,
        ]}
      >
        <Text style={styles.actionLabelPrimary}>
          {trip.departure && trip.returnDate ? 'Update flights' : 'See flights'}
        </Text>
      </Pressable>
    </View>
  );
}

// ===========================================================================
// Styles.
// ===========================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  shell: {
    alignSelf: 'center',
    width: GRID_WIDTH,
    gap: 12,
  },

  // Header --------------------------------------------------------------
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  headerLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  headerLabelPressed: {
    backgroundColor: C.rangeBackground,
  },
  headerLabelText: {
    color: C.foreground,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headerCaret: {
    color: C.mutedForeground,
    fontSize: 12,
    marginTop: -2,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  iconGlyph: {
    color: C.mutedForeground,
    fontSize: 22,
    lineHeight: 22,
  },

  // Day cell -----------------------------------------------------------
  cellWrapper: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
  },
  cellWrapperStart: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  cellWrapperEnd: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  cellWrapperSingle: {
    borderRadius: 8,
  },
  cell: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  cellToday: {
    borderWidth: 1,
    borderColor: C.foreground,
  },
  cellSelected: {
    backgroundColor: C.selected,
  },
  cellLabel: {
    color: C.foreground,
    fontSize: 16,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  cellLabelOutside: {
    color: C.disabled,
  },
  cellLabelDisabled: {
    color: C.disabled,
  },
  cellLabelSelected: {
    color: C.selectedForeground,
    fontWeight: '600',
  },
  cellFare: {
    marginTop: 2,
    color: C.mutedForeground,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  cellFareCheap: {
    color: C.accent,
    fontWeight: '600',
  },
  cellFareSelected: {
    color: C.selectedForeground,
    opacity: 0.7,
  },

  // Summary -----------------------------------------------------------
  summaryStack: {
    gap: 10,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  summaryColumn: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    color: C.mutedForeground,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  summaryValue: {
    color: C.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryHint: {
    color: C.mutedForeground,
    fontSize: 13,
  },
  summaryArrow: {
    color: C.mutedForeground,
    fontSize: 16,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  totalLabel: {
    color: C.mutedForeground,
    fontSize: 13,
  },
  totalValue: {
    color: C.foreground,
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // Actions -----------------------------------------------------------
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnGhost: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: 'transparent',
  },
  actionBtnPrimary: {
    backgroundColor: C.selected,
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionBtnPressed: {
    opacity: 0.85,
  },
  actionLabelGhost: {
    color: C.foreground,
    fontSize: 14,
    fontWeight: '500',
  },
  actionLabelPrimary: {
    color: C.selectedForeground,
    fontSize: 14,
    fontWeight: '600',
  },
});
