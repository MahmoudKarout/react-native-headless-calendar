/**
 * PerfCalendarDemo — React Native
 *
 * Demonstrates that react-native-fast-calendar delivers genuinely granular
 * re-renders using the real library. Each day cell is a React.memo component
 * that tracks its own render count in a ref. Select a date range and watch
 * the counter jump only on the cells whose state actually changed — every
 * other cell stays frozen at 1×.
 *
 * Architecture:
 *  - <Calendar.Root mode="range"> owns all selection state.
 *  - <Calendar.DayGrid components={{ DayCell: PerfDayCell }}> renders our
 *    custom cell for every slot.
 *  - PerfDayCell is wrapped in React.memo so it only re-renders when the
 *    props the library passes to it actually change.
 *  - The render count lives in a useRef — it increments on real renders,
 *    never on hook-only reads.
 *  - "Reset counters" remounts <Calendar.Root> via a key change, which
 *    destroys every cell instance and starts all counts from 1.
 */
import { memo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Calendar,
  dayCellPropsEqual,
  useCalendarMonthLabel,
  useCalendarNavigation,
  useCalendarYearLabel,
  type CalendarComponents,
  type CalendarThemeOverride,
} from 'react-native-fast-calendar';

// ─── palette ────────────────────────────────────────────────────────────────

const C = {
  page: '#FAFAFA',
  background: '#FFFFFF',
  foreground: '#0A0A0A',
  mutedForeground: '#71717A',
  muted: '#F4F4F5',
  border: '#E4E4E7',
  primary: '#0A0A0A',
  primaryForeground: '#FAFAFA',
  disabled: '#A1A1AA',
};

// ─── theme ───────────────────────────────────────────────────────────────────

const CELL_SIZE = 44;
const COLS = 7;
const GRID_WIDTH = CELL_SIZE * COLS; // 308

const THEME: CalendarThemeOverride = {
  colors: {
    background: C.background,
    primary: C.primary,
    onPrimary: C.primaryForeground,
    text: C.foreground,
    textMuted: C.mutedForeground,
    todayBorder: C.foreground,
    rangeBackground: C.muted,
    disabled: C.disabled,
    border: C.border,
  },
  cellSize: CELL_SIZE,
  borderRadius: 6,
  fontSize: { day: 13, weekday: 11, header: 14 },
  spacing: { xs: 4, sm: 6, md: 10, lg: 14, xl: 20 },
};

// ─── PerfDayCell ─────────────────────────────────────────────────────────────

/**
 * Custom day cell wrapped in React.memo.
 *
 * The library passes stable, fine-grained boolean props (isSelected,
 * isInRange, isRangeStart, isRangeEnd, isToday, …). React.memo bails out
 * of re-rendering any cell whose set of props hasn't changed.
 *
 * Result: tap day 5 → only that cell (and the previously selected one, if
 * any) increments its counter. All 40+ other cells stay frozen at 1×.
 */
const PerfDayCell: NonNullable<CalendarComponents['DayCell']> = memo(
  ({ info, onSelect }) => {
    const count = useRef(0);
    count.current += 1;

    const hot = count.current > 1;
    const isOutside = !info.isCurrentMonth;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${info.label}, rendered ${count.current} times`}
        accessibilityState={{ selected: info.isSelected }}
        disabled={info.isDisabled || isOutside}
        onPress={
          info.isDisabled || isOutside ? undefined : () => onSelect(info.date)
        }
        style={[
          styles.cell,
          info.isToday && !info.isSelected && styles.cellToday,
          info.isSelected && styles.cellSelected,
          (info.isDisabled || isOutside) && styles.cellOutside,
        ]}
      >
        <Text
          style={[
            styles.cellLabel,
            info.isSelected && styles.cellLabelSelected,
            (info.isDisabled || isOutside) && styles.cellLabelOutside,
          ]}
        >
          {info.label}
        </Text>

        {/* render counter */}
        <Text
          style={[
            styles.renderCount,
            hot && styles.renderCountHot,
            info.isSelected && (hot ? styles.renderCountSelectedHot : styles.renderCountSelected),
          ]}
        >
          {count.current}×
        </Text>
      </Pressable>
    );
  },
  dayCellPropsEqual,
);

PerfDayCell.displayName = 'PerfDayCell';

// ─── header (must live inside Calendar.Root for context access) ───────────────

function PerfHeader() {
  const month = useCalendarMonthLabel();
  const year = useCalendarYearLabel();
  const { goPrev, goNext } = useCalendarNavigation();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={goPrev}
        style={styles.navBtn}
        accessibilityLabel="Previous month"
      >
        <Text style={styles.navBtnText}>‹</Text>
      </Pressable>

      <Text style={styles.headerTitle}>
        {month.label} {year.label}
      </Text>

      <Pressable
        onPress={goNext}
        style={styles.navBtn}
        accessibilityLabel="Next month"
      >
        <Text style={styles.navBtnText}>›</Text>
      </Pressable>
    </View>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export default function PerfCalendarDemo() {
  // Bumping this remounts Calendar.Root entirely → all cell refs reset to 0.
  const [resetKey, setResetKey] = useState(0);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
    >
      <View style={styles.card}>
        {/* card header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>One tap. One re-render.</Text>
          <Text style={styles.cardDescription}>
            Each cell is wrapped in{' '}
            <Text style={styles.code}>React.memo</Text>. The counter shows how
            many times it has rendered since mount. Select a range and watch
            only the affected cells update.
          </Text>
        </View>

        {/* counter legend */}
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            <Text style={styles.hintDim}>1×</Text>
            <Text style={styles.hintSep}> initial render  ·  </Text>
            <Text style={styles.hintHot}>2×+</Text>
            <Text style={styles.hintSep}> re-rendered</Text>
          </Text>
        </View>

        {/* calendar — key forces full remount on reset */}
        <Calendar.Root
          key={resetKey}
          mode="single"
          theme={THEME}
          components={{ DayCell: PerfDayCell }}
        >
          <View style={styles.calendarWrapper}>
            <PerfHeader />
            <Calendar.DayGrid />
          </View>
        </Calendar.Root>

        {/* reset button lives outside Root so it survives the remount */}
        <View style={styles.footer}>
          <Pressable
            onPress={() => setResetKey((k) => k + 1)}
            style={styles.resetBtn}
            accessibilityRole="button"
            accessibilityLabel="Reset render counters"
          >
            <Text style={styles.resetBtnText}>Reset counters</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.page,
  },
  pageContent: {
    padding: 16,
    alignItems: 'center',
  },

  // card
  card: {
    width: '100%',
    maxWidth: GRID_WIDTH + 32,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.foreground,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 13,
    color: C.mutedForeground,
    lineHeight: 19,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: C.foreground,
  },

  // legend
  hint: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  hintDim: {
    color: C.mutedForeground,
    fontWeight: '500',
  },
  hintSep: {
    color: C.mutedForeground,
  },
  hintHot: {
    color: C.foreground,
    fontWeight: '700',
  },

  // calendar shell
  calendarWrapper: {
    width: GRID_WIDTH,
    alignSelf: 'center',
    paddingVertical: 12,
  },

  // header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontSize: 18,
    color: C.foreground,
    lineHeight: 22,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: C.foreground,
    letterSpacing: -0.2,
  },

  // footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: 'flex-end',
  },
  resetBtn: {
    height: 34,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.foreground,
  },

  // day cell
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    gap: 2,
  },
  cellToday: {
    borderWidth: 1,
    borderColor: C.foreground,
  },
  cellSelected: {
    backgroundColor: C.primary,
  },
  cellOutside: {
    opacity: 0.25,
  },
  cellLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: C.foreground,
    lineHeight: 16,
  },
  cellLabelSelected: {
    color: C.primaryForeground,
  },
  cellLabelOutside: {
    color: C.mutedForeground,
  },

  // render counter
  renderCount: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '400',
    color: C.mutedForeground,
    opacity: 0.45,
    lineHeight: 11,
    letterSpacing: -0.2,
  },
  renderCountHot: {
    opacity: 1,
    fontWeight: '700',
    color: C.foreground,
  },
  renderCountSelected: {
    color: C.primaryForeground,
    opacity: 0.55,
  },
  renderCountSelectedHot: {
    color: C.primaryForeground,
    opacity: 1,
    fontWeight: '700',
  },
});
