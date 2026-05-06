/**
 * Infinite Vertical Calendar Example
 *
 * iOS Calendar-style continuous list of months built on top of the
 * headless `<Calendar.Root>` API. Each row is its own month: a header
 * (e.g. "May 2026") plus a day grid that shares selection with the
 * Root store, so tapping any day in any month updates the readout at
 * the top.
 *
 * Months are rendered in their natural shape — outside-month cells are
 * blank spacers (so columns still line up under the sticky weekday
 * header) and trailing all-outside rows are dropped. This matches the
 * iOS Calendar look and avoids the "is that May 30 or June 1?" confusion
 * a greyed-out adjacent-month number would create when months sit
 * directly above one another.
 *
 * Why `@shopify/flash-list` (vertical) over `FlatList` here:
 *   - `recycleItems` keeps the DOM bounded: only the months in / near
 *     the viewport are mounted, even if the data window holds dozens.
 *   - `drawDistance` lets us keep one screenful of off-screen months
 *     rendered so fast scrolls don't flash blank.
 *   - `maintainVisibleContentPosition` keeps the user's scroll anchor
 *     stable when we prepend months via `onStartReached`, so the list
 *     can grow infinitely backwards without "jumping".
 *
 * The library does NOT ship a vertical month list out of the box —
 * `<Calendar.DayGrid>` always renders the store's `displayed` month.
 * For arbitrary-month rendering we use the exported building blocks:
 * `buildMonthGrid` (cell skeletons), `<DayCell>` (memoised cell), and
 * the per-slice store hooks. This file is the recipe a project would
 * copy if it wanted the same UX.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  FlashList,
  type FlashListRef,
  type ListRenderItemInfo,
} from '@shopify/flash-list';

import {
  Calendar,
  COLS,
  DayCell,
  ROWS,
  buildMonthGrid,
  isExplicitlyDisabled,
  useCalendarConfig,
  useCalendarSelector,
  useCalendarStore,
  useCalendarWeekdayLabels,
  usedRows,
  type CalendarDateValue,
  type CalendarSystem,
  type CalendarThemeOverride,
  type DayCellInfo,
} from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';

// ---------------------------------------------------------------------------
// Tokens / theme
// ---------------------------------------------------------------------------

const C = {
  background: '#FFFFFF',
  foreground: '#0A0A0A',
  mutedForeground: '#71717A', // zinc-500
  muted: '#F4F4F5', // zinc-100
  border: '#E4E4E7', // zinc-200
  primary: '#0A0A0A',
  primaryForeground: '#FAFAFA',
  todayAccent: '#1F6FEB',
};

const CELL_SIZE = 44;

// Initial window of months around `displayed`. Grows from both ends as
// the user scrolls past the edges.
const WINDOW_RADIUS = 6;
const WINDOW_GROWTH = 6;

// `<DayCell>` reads `theme.cellSize` for its layout — passing it through
// the Root theme keeps the weekday header (which sizes itself by the
// same constant below) and the grid pixel-aligned.
const VERTICAL_THEME: CalendarThemeOverride = {
  colors: {
    background: C.background,
    primary: C.primary,
    onPrimary: C.primaryForeground,
    text: C.foreground,
    textMuted: C.mutedForeground,
    todayBorder: C.todayAccent,
    rangeBackground: C.muted,
    border: C.border,
  },
  cellSize: CELL_SIZE,
  borderRadius: 8,
  fontSize: { day: 15, weekday: 12, header: 16 },
};

// ---------------------------------------------------------------------------
// Window helpers
// ---------------------------------------------------------------------------

/** Build [center − radius … center + radius], inclusive. */
const buildMonthsAround = (
  system: CalendarSystem,
  center: CalendarDateValue,
  radius: number
): CalendarDateValue[] => {
  const out = new Array<CalendarDateValue>(radius * 2 + 1);
  for (let i = -radius; i <= radius; i += 1) {
    out[i + radius] = system.addMonths(center, i);
  }
  return out;
};

const isSameDisplayMonth = (
  system: CalendarSystem,
  a: CalendarDateValue,
  b: CalendarDateValue
): boolean =>
  system.year(a) === system.year(b) && system.month(a) === system.month(b);

// ---------------------------------------------------------------------------
// MonthSection — one month: caption + 6×7 grid.
//
// Layered the same way `<Calendar.DayGrid>` does internally:
//
//   Layer 1 (expensive, year+month-keyed): build the 42 system-specific
//   `GridCell`s for the rendered month. Cached so a same-month selection
//   change doesn't re-mint date objects.
//
//   Layer 2 (cheap, selection-keyed): overlay isSelected / isToday /
//   isDisabled flags. Re-runs on selection change but reuses Layer 1's
//   `date` refs so `<DayCell>`'s memo equality skips unchanged cells.
// ---------------------------------------------------------------------------

interface MonthSectionProps {
  month: CalendarDateValue;
}

function MonthSectionComponent({ month }: MonthSectionProps) {
  const store = useCalendarStore();
  const { firstDayOfWeek, showOutsideDays, fixedWeeks } = useCalendarConfig();
  const system = useCalendarSelector((s) => s.system);
  const selectedDate = useCalendarSelector((s) => s.selectedDate);
  const minDate = useCalendarSelector((s) => s.minDate);
  const maxDate = useCalendarSelector((s) => s.maxDate);
  const disabledDates = useCalendarSelector((s) => s.disabledDates);
  const disabledRanges = useCalendarSelector((s) => s.disabledRanges);
  const disabledPredicate = useCalendarSelector((s) => s.disabled);

  // Layer 1 — keyed on year+month primitives so a different `month`
  // object reference (e.g. when the parent rebuilds the data window)
  // doesn't invalidate the cache as long as the calendar month is the
  // same.
  const monthYear = system.year(month);
  const monthIndex = system.month(month);
  const cells = useMemo(
    () => buildMonthGrid(system, month, firstDayOfWeek),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [system, monthYear, monthIndex, firstDayOfWeek]
  );

  // Layer 2 — overlay flags. Reuses cells[i].date refs so DayCell's
  // field-level equality check correctly bails on unchanged cells.
  const cellInfos = useMemo<DayCellInfo[]>(() => {
    const today = system.today();
    return cells.map<DayCellInfo>((c) => {
      const nativeDate = system.toNativeDate(c.date);
      const isSelected = !!selectedDate && system.isSame(c.date, selectedDate);
      let isDisabled =
        (!!minDate && system.isBefore(c.date, minDate)) ||
        (!!maxDate && system.isAfter(c.date, maxDate)) ||
        isExplicitlyDisabled(system, c.date, disabledDates, disabledRanges);
      if (!isDisabled && disabledPredicate) {
        try {
          if (disabledPredicate(nativeDate)) isDisabled = true;
        } catch {
          // Permissive — never crash a row for a buggy consumer predicate.
        }
      }
      return {
        date: c.date,
        nativeDate,
        label: system.formatDay(c.date),
        isCurrentMonth: c.isCurrentMonth,
        isToday: system.isSame(c.date, today),
        isSelected,
        inRange: false,
        isRangeStart: false,
        isRangeEnd: false,
        isDisabled,
        modifiers: {},
      };
    });
  }, [
    cells,
    system,
    selectedDate,
    minDate,
    maxDate,
    disabledDates,
    disabledRanges,
    disabledPredicate,
  ]);

  const onSelect = useCallback(
    (date: CalendarDateValue) => store.selectDate(date),
    [store]
  );

  // Trim trailing all-outside rows when `fixedWeeks` is off so each
  // month takes its natural height (4 / 5 / 6 weeks). Inside-the-grid
  // outside-day cells become blank spacers below — keeping them as
  // `<View />`s of `CELL_SIZE × CELL_SIZE` preserves the column grid
  // so e.g. a Wednesday-starting month still puts the 1st under the
  // weekday header's "Wed" column.
  const visibleRows = fixedWeeks ? ROWS : usedRows(cells);
  const visibleCellCount = visibleRows * COLS;

  return (
    <View style={styles.monthSection}>
      <Text style={styles.monthHeader}>{system.formatMonthYear(month)}</Text>
      <View style={styles.monthGrid}>
        {cellInfos.slice(0, visibleCellCount).map((info, idx) => {
          if (!showOutsideDays && !info.isCurrentMonth) {
            return <View key={idx} style={styles.spacerCell} />;
          }
          return <DayCell info={info} key={idx} onSelect={onSelect} />;
        })}
      </View>
    </View>
  );
}

const MonthSection = MonthSectionComponent;

// ---------------------------------------------------------------------------
// WeekdayHeaderRow — sticky row above the FlashList. Stays mounted so
// it doesn't repeat per-month and the columns line up.
// ---------------------------------------------------------------------------

function WeekdayHeaderRow() {
  const labels = useCalendarWeekdayLabels();
  return (
    <View style={styles.weekdayRow}>
      {labels.map((l, i) => (
        <Text key={`${l}-${i}`} style={styles.weekdayLabel}>
          {l.slice(0, 3)}
        </Text>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// VerticalMonthList — the FlashList. Mirrors the windowing + growth
// pattern used by the library's own SwipeableMonthList, but oriented
// vertically.
//
// Exposes an imperative `scrollToMonth(date)` via ref so external UI
// (the "Today" button below) can drive the scroll position without
// relying on a `displayed`-watching effect — that effect only fires on
// reference changes, so calling `selectDate(today)` while today is
// already in `displayed`'s month wouldn't move the list at all.
// ---------------------------------------------------------------------------

interface VerticalMonthListHandle {
  /**
   * Scroll the list so the given month is on screen. If the target
   * month is already inside the data window the scroll is animated; if
   * it sits outside, the window is rebuilt around the target and the
   * list jumps to the new centre (no animation, since there's no
   * continuous scroll path between the two positions).
   */
  scrollToMonth: (date: CalendarDateValue) => void;
}

const VerticalMonthList = forwardRef<VerticalMonthListHandle>(
  function VerticalMonthList(_props, ref) {
    const system = useCalendarSelector((s) => s.system);
    const displayed = useCalendarSelector((s) => s.displayed);

    const listRef = useRef<FlashListRef<CalendarDateValue>>(null);

    const [months, setMonths] = useState<readonly CalendarDateValue[]>(() =>
      buildMonthsAround(system, displayed, WINDOW_RADIUS)
    );

    // Rebuild the data window around `target` and jump (no animation)
    // to its centre. Shared by the imperative API and the
    // out-of-window reconciliation effect below.
    const recentreOn = useCallback(
      (target: CalendarDateValue) => {
        setMonths(buildMonthsAround(system, target, WINDOW_RADIUS));
        // The new array forces FlashList to re-mount its containers;
        // wait one frame so the new data is committed before issuing
        // the scroll, otherwise it would target the old list.
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({
            index: WINDOW_RADIUS,
            animated: false,
          });
        });
      },
      [system]
    );

    // Auto re-centre when `displayed` lands outside the window (e.g. a
    // future programmatic store mutation from another component). Taps
    // inside the visible window are no-ops here — the imperative API
    // owns the in-window scroll-to-date case.
    useEffect(() => {
      const idx = months.findIndex((m) =>
        isSameDisplayMonth(system, m, displayed)
      );
      if (idx === -1) recentreOn(displayed);
    }, [displayed, months, system, recentreOn]);

    useImperativeHandle(
      ref,
      () => ({
        scrollToMonth: (target) => {
          const idx = months.findIndex((m) =>
            isSameDisplayMonth(system, m, target)
          );
          if (idx >= 0) {
            listRef.current?.scrollToIndex({ index: idx, animated: true });
          } else {
            recentreOn(target);
          }
        },
      }),
      [months, system, recentreOn]
    );

    const onStartReached = useCallback(() => {
      setMonths((prev) => {
        const first = prev[0]!;
        const before = new Array<CalendarDateValue>(WINDOW_GROWTH);
        for (let i = 0; i < WINDOW_GROWTH; i += 1) {
          before[i] = system.addMonths(first, i - WINDOW_GROWTH);
        }
        return [...before, ...prev];
      });
    }, [system]);

    const onEndReached = useCallback(() => {
      setMonths((prev) => {
        const last = prev[prev.length - 1]!;
        const after = new Array<CalendarDateValue>(WINDOW_GROWTH);
        for (let i = 0; i < WINDOW_GROWTH; i += 1) {
          after[i] = system.addMonths(last, i + 1);
        }
        return [...prev, ...after];
      });
    }, [system]);

    const keyExtractor = useCallback(
      (item: CalendarDateValue) =>
        `${system.id}:${system.year(item)}-${system.month(item)}`,
      [system]
    );

    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<CalendarDateValue>) => (
        <MonthSection month={item} />
      ),
      []
    );

    // Caption (32) + 6 rows × CELL_SIZE + section padding. Drives the
    // off-screen render budget so initial scroll lands close to the
    // active month on first paint.
    const drawDistance = 56 + CELL_SIZE * ROWS;

    return (
      <FlashList<CalendarDateValue>
        data={months}
        drawDistance={drawDistance}
        initialScrollIndex={WINDOW_RADIUS}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        onStartReached={onStartReached}
        // Cast: under `react-native-strict-api`, ScrollView's `ref` and
        // FlashList's `RefAttributes<FlashListRef>` intersect into an
        // un-satisfiable type. The runtime contract is fine — we only
        // call methods from the FlashListRef surface — so we narrow
        // with a single contained `as never` here.
        ref={listRef as never}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    );
  }
);

// ---------------------------------------------------------------------------
// Top-level demo screen.
// ---------------------------------------------------------------------------

function ReadoutBar() {
  const store = useCalendarStore();
  const selectedDate = useCalendarSelector((s) => s.selectedDate);
  const system = useCalendarSelector((s) => s.system);

  const native = selectedDate ? system.toNativeDate(selectedDate) : null;

  const onJumpToday = () => store.selectDate(system.today());

  return (
    <View style={styles.readoutBar}>
      <View style={styles.readoutText}>
        <Text style={styles.readoutLabel}>SELECTED</Text>
        <Text style={styles.readoutValue}>
          {native ? native.toDateString() : 'Tap a day to select'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onJumpToday}
        style={({ pressed }) => [
          styles.todayButton,
          pressed && styles.todayButtonPressed,
        ]}
      >
        <Text style={styles.todayButtonLabel}>Today</Text>
      </Pressable>
    </View>
  );
}

export default function VerticalCalendarDemo() {
  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Infinite vertical calendar</Text>
        <Text style={styles.subtitle}>
          iOS-style continuous month list. Scroll forever in either direction —
          months are virtualised and grow on demand.
        </Text>
      </View>

      <Calendar.Root
        // Each month renders only its own days — outside-month cells are
        // blank spacers and trailing all-outside rows are dropped, so
        // months in the vertical list visually never overlap (mirrors
        // the iOS Calendar look).
        fixedWeeks={false}
        mode="single"
        showOutsideDays={false}
        systems={SINGLE_GREGORIAN}
        theme={VERTICAL_THEME}
      >
        <ReadoutBar />
        <View style={styles.weekdayHeaderWrapper}>
          <WeekdayHeaderRow />
        </View>
        <VerticalMonthList />
      </Calendar.Root>
    </View>
  );
}

const SINGLE_GREGORIAN = [gregorianSystem];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: C.foreground,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: C.mutedForeground,
    marginTop: 4,
    lineHeight: 18,
  },

  readoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
    backgroundColor: C.muted,
  },
  readoutText: {
    flex: 1,
  },
  readoutLabel: {
    color: C.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  readoutValue: {
    color: C.foreground,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: C.primary,
  },
  todayButtonPressed: {
    opacity: 0.85,
  },
  todayButtonLabel: {
    color: C.primaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },

  weekdayHeaderWrapper: {
    paddingVertical: 10,
    backgroundColor: C.background,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  weekdayRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: CELL_SIZE * COLS,
  },
  weekdayLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: C.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  list: {
    flex: 1,
  },

  monthSection: {
    alignSelf: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    width: CELL_SIZE * COLS,
  },
  monthHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: C.foreground,
    paddingVertical: 8,
    paddingHorizontal: 4,
    letterSpacing: -0.2,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: CELL_SIZE * COLS,
  },
  spacerCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
});
