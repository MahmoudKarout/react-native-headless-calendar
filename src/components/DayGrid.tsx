/**
 * Calendar.DayGrid — the 6x7 grid of day cells.
 *
 * Two layers of memoisation, applied per-month inside `MonthGrid`:
 *
 *   Layer 1 (expensive): build the 42 system-specific date objects for the
 *   displayed month. Recomputes only when month / system / firstDayOfWeek
 *   change.
 *
 *   Layer 2 (cheap):     overlay selection / range / today flags.
 *   Recomputes on every selection change but reuses Layer 1's date refs.
 *
 * Day cells are wrapped in React.memo and receive only stable props, so
 * tapping a date re-renders at most 2-4 cells.
 *
 * When `swipeable` is enabled, the grid is rendered three-up inside a
 * horizontal `FlatList` (`[prev, current, next]`) so the user can swipe
 * sideways to step through months. The weekday header stays fixed.
 *
 * Consumers can fully replace the cell rendering with the `renderDay`
 * prop — for completely custom day visuals, see <Calendar.DayCell> below.
 */

import React, {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import {
  useCalendarConfig,
  useCalendarSelector,
  useCalendarStore,
  useCalendarTheme,
  useCalendarWeekdayLabels,
} from '../context';
import {
  TOTAL_CELLS,
  buildMonthGrid,
  isBetween,
  isExplicitlyDisabled,
} from '../utils/grid';
import type { CalendarDateValue, DayCellInfo, DayRenderer } from '../types';

// ---------------------------------------------------------------------------
// WeekdayHeader — static row of weekday names. Memoised so it never
// re-renders on day taps.
// ---------
// ------------------------------------------------------------------

const weekdayHeaderStyle = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  item: {
    textAlign: 'center',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});

const WeekdayHeaderComponent: React.FC = () => {
  const theme = useCalendarTheme();
  // Already rotated to match the active `firstDayOfWeek`, so the header
  // columns line up with the day cells without extra work here.
  const labels = useCalendarWeekdayLabels();

  return (
    <View style={weekdayHeaderStyle.container}>
      {labels.map((label, idx) => (
        <Text
          key={`${label}-${idx}`}
          style={[
            {
              color: theme.colors.textMuted,
              fontSize: theme.fontSize.weekday,
              width: theme.cellSize,
            },
            weekdayHeaderStyle.item,
          ]}
        >
          {label}
        </Text>
      ))}
    </View>
  );
};
const WeekdayHeader = memo(WeekdayHeaderComponent);
WeekdayHeader.displayName = 'Calendar.WeekdayHeader';

// ---------------------------------------------------------------------------
// DayCell — single day. Wrapped with memo + stable props.
// ---------------------------------------------------------------------------

export interface DayCellProps {
  info: DayCellInfo;
  onSelect: (date: CalendarDateValue) => void;
}

function DayCellComponent({ info, onSelect }: DayCellProps) {
  const theme = useCalendarTheme();
  const { testID } = useCalendarConfig();

  const onPress = useCallback(
    (_e: GestureResponderEvent) => {
      onSelect(info.date);
    },
    [onSelect, info.date]
  );

  // Background corner radius — square in the middle of a range, rounded
  // on the endpoints, fully circular for a single selection.
  let radius = theme.borderRadius;
  let bg = 'transparent';
  if (info.isSelected) {
    bg = theme.colors.primary;
  } else if (info.inRange) {
    bg = theme.colors.rangeBackground;
    radius = 0;
  }
  if (info.isRangeStart && info.isRangeEnd) {
    radius = theme.borderRadius;
  } else if (info.isRangeStart) {
    radius = theme.borderRadius;
  } else if (info.isRangeEnd) {
    radius = theme.borderRadius;
  }

  const textColor = info.isSelected
    ? theme.colors.onPrimary
    : info.isCurrentMonth && !info.isDisabled
      ? theme.colors.text
      : theme.colors.disabled;

  return (
    <Pressable
      accessibilityLabel={info.label}
      accessibilityRole="button"
      accessibilityState={{
        selected: info.isSelected,
        disabled: info.isDisabled,
      }}
      disabled={info.isDisabled}
      onPress={info.isDisabled ? undefined : onPress}
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        width: theme.cellSize,
        height: theme.cellSize,
        boxSizing: 'border-box',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        borderRadius: radius,
        borderWidth: info.isToday && !info.isSelected ? 1 : 0,
        borderColor: theme.colors.todayBorder,
        opacity: info.isDisabled ? 0.4 : 1,
      }}
      testID={
        testID
          ? `${testID}.calendar.day.${info.nativeDate.toISOString().slice(0, 10)}`
          : undefined
      }
    >
      <Text
        style={{
          color: textColor,
          fontSize: theme.fontSize.day,
          fontWeight: info.isSelected ? '600' : '400',
          fontVariant: ['tabular-nums'],
        }}
      >
        {info.label}
      </Text>
    </Pressable>
  );
}

/**
 * Field-level equality for DayCellProps.
 *
 * `info` is rebuilt by Layer 2 on every selection change, so the *reference*
 * is always new. Without a custom equality, React.memo's default shallow
 * `Object.is(prevInfo, nextInfo)` is always false and every cell re-renders.
 *
 * Comparing the primitives that actually drive the cell's visuals (selection,
 * range, today, disabled, etc.) lets memo skip the ~40 cells whose state
 * didn't change, leaving only the 0-2 cells that visually flipped.
 *
 * `nativeDate` is intentionally not compared — it's a fresh `Date` instance
 * per render and never affects rendered output.
 */
const dayCellPropsEqual = (prev: DayCellProps, next: DayCellProps): boolean => {
  if (prev.onSelect !== next.onSelect) return false;
  const a = prev.info;
  const b = next.info;
  return (
    a.date === b.date &&
    a.label === b.label &&
    a.isCurrentMonth === b.isCurrentMonth &&
    a.isToday === b.isToday &&
    a.isSelected === b.isSelected &&
    a.inRange === b.inRange &&
    a.isRangeStart === b.isRangeStart &&
    a.isRangeEnd === b.isRangeEnd &&
    a.isDisabled === b.isDisabled
  );
};

/**
 * Public DayCell — exported so consumers can compose grids with custom
 * surrounding markup but still reuse the visual implementation.
 */
export const DayCell = memo(DayCellComponent, dayCellPropsEqual);
DayCell.displayName = 'Calendar.DayCell';

// ---------------------------------------------------------------------------
// MonthGrid — internal: 6×7 cells for ONE specific month.
//
// Used directly by `<Calendar.DayGrid>` in static mode (the `month` is the
// store's `displayed`) and rendered three-up inside a horizontal FlatList
// in swipeable mode. The two-layer memoisation strategy lives here so each
// page caches its cells independently — swiping between adjacent months
// reuses two of the three Layer-1 caches.
// ---------------------------------------------------------------------------

interface MonthGridProps {
  /** Any date inside the month to render — only year+month are read. */
  month: CalendarDateValue;
  renderDay?: DayRenderer;
  /**
   * Pixel width when rendered as a horizontal FlatList page; omit to fill
   * 100% of the parent (the static, non-swipeable case).
   */
  pageWidth?: number;
}

const MonthGridComponent: React.FC<MonthGridProps> = ({
  month,
  renderDay,
  pageWidth,
}) => {
  const store = useCalendarStore();
  const { onSelectHaptic, firstDayOfWeek } = useCalendarConfig();

  // --- subscriptions (granular slices) ---------------------------------

  const system = useCalendarSelector((s) => s.system);
  const mode = useCalendarSelector((s) => s.mode);
  const selectedDate = useCalendarSelector((s) => s.selectedDate);
  const rangeStart = useCalendarSelector((s) => s.rangeStart);
  const rangeEnd = useCalendarSelector((s) => s.rangeEnd);
  const minDate = useCalendarSelector((s) => s.minDate);
  const maxDate = useCalendarSelector((s) => s.maxDate);
  const disabledDates = useCalendarSelector((s) => s.disabledDates);
  const disabledRanges = useCalendarSelector((s) => s.disabledRanges);

  // --- Layer 1: build the cell skeletons. ---

  const cells = useMemo(
    () => buildMonthGrid(system, month, firstDayOfWeek),
    [system, month, firstDayOfWeek]
  );

  // --- Layer 2: enrich with selection / today / disabled flags. --------

  const cellInfos = useMemo<DayCellInfo[]>(() => {
    const today = system.today();
    return cells.map<DayCellInfo>((c) => {
      const isStart = !!rangeStart && system.isSame(c.date, rangeStart);
      const isEnd = !!rangeEnd && system.isSame(c.date, rangeEnd);
      const isSingle =
        mode === 'single' &&
        !!selectedDate &&
        system.isSame(c.date, selectedDate);
      const inRange =
        mode === 'range' && isBetween(system, c.date, rangeStart, rangeEnd);
      const isDisabled =
        (!!minDate && system.isBefore(c.date, minDate)) ||
        (!!maxDate && system.isAfter(c.date, maxDate)) ||
        isExplicitlyDisabled(system, c.date, disabledDates, disabledRanges);

      return {
        date: c.date,
        nativeDate: system.toNativeDate(c.date),
        label: system.formatDay(c.date),
        isCurrentMonth: c.isCurrentMonth,
        isToday: system.isSame(c.date, today),
        isSelected: isSingle || isStart || isEnd,
        inRange: inRange && !isStart && !isEnd,
        isRangeStart: isStart,
        isRangeEnd: isEnd,
        isDisabled,
      };
    });
  }, [
    cells,
    system,
    mode,
    selectedDate,
    rangeStart,
    rangeEnd,
    minDate,
    maxDate,
    disabledDates,
    disabledRanges,
  ]);

  const onSelect = useCallback(
    (date: CalendarDateValue) => {
      store.selectDate(date);
      onSelectHaptic?.();
    },
    [store, onSelectHaptic]
  );

  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        width: pageWidth ?? '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
      }}
    >
      {cellInfos.map((info, idx) => {
        if (renderDay) {
          return <Fragment key={idx}>{renderDay(info)}</Fragment>;
        }
        /* istanbul ignore next — defensive guard; cellInfos is always
         * exactly TOTAL_CELLS entries long. */
        if (idx >= TOTAL_CELLS) return null;
        return <DayCell info={info} key={idx} onSelect={onSelect} />;
      })}
    </View>
  );
};

const MonthGrid = memo(MonthGridComponent);
MonthGrid.displayName = 'Calendar.MonthGrid';

// ---------------------------------------------------------------------------
// SwipeableMonthList — internal: horizontal FlatList of three MonthGrids.
//
// Sliding-window pagination:
//   1. `data = [prev, displayed, next]` — derived from the store snapshot.
//   2. `initialScrollIndex = 1` so the user always starts on the active month.
//   3. After a swipe, `onMomentumScrollEnd` dispatches `store.changeMonth(±1)`.
//      That updates `displayed`, which:
//        - rebuilds `data` so the just-revealed month is at index 1, AND
//        - fires the `useEffect` below which re-centres the scroll silently.
//   4. External navigation (arrow buttons, year picker, system swap) goes
//      through the same path because they all update `displayed`.
//
// `keyExtractor` is `<systemId>:<year>-<month>` so React reuses the
// component instance for the two pages that overlap with the previous
// frame, preserving the Layer-1/Layer-2 caches inside MonthGrid.
// ---------------------------------------------------------------------------

interface SwipeableMonthListProps {
  renderDay?: DayRenderer;
}

const SwipeableMonthListComponent: React.FC<SwipeableMonthListProps> = ({
  renderDay,
}) => {
  const store = useCalendarStore();
  const { testID } = useCalendarConfig();
  const system = useCalendarSelector((s) => s.system);
  const displayed = useCalendarSelector((s) => s.displayed);

  const flatListRef = useRef<FlatList<CalendarDateValue>>(null);
  const [pageWidth, setPageWidth] = useState(0);

  const months = useMemo<readonly CalendarDateValue[]>(
    () => [
      system.addMonths(displayed, -1),
      displayed,
      system.addMonths(displayed, 1),
    ],
    [system, displayed]
  );

  const keyExtractor = useCallback(
    (item: CalendarDateValue) =>
      `${system.id}:${system.year(item)}-${system.month(item)}`,
    [system]
  );

  const getItemLayout = useCallback(
    (
      _data: ArrayLike<CalendarDateValue> | null | undefined,
      index: number
    ) => ({
      length: pageWidth,
      offset: pageWidth * index,
      index,
    }),
    [pageWidth]
  );

  // Re-centre the FlatList on the active month after every `displayed` change.
  // Runs both for swipe-driven changes (where the scroll is at index 0 or 2
  // when this fires) and for external-navigation-driven changes (where it's
  // typically already at index 1 and this is a no-op).
  useEffect(() => {
    if (pageWidth === 0) return;
    flatListRef.current?.scrollToOffset({
      offset: pageWidth,
      animated: false,
    });
  }, [displayed, pageWidth]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageWidth === 0) return;
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / pageWidth);
      if (index === 1) return;
      // -1 (prev) or +1 (next). The store updates `displayed`; the effect
      // above then snaps the FlatList back to the centre.
      store.changeMonth(index - 1);
    },
    [store, pageWidth]
  );

  const renderItem: ListRenderItem<CalendarDateValue> = useCallback(
    ({ item }) => (
      <MonthGrid month={item} pageWidth={pageWidth} renderDay={renderDay} />
    ),
    [pageWidth, renderDay]
  );

  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{ width: '100%' }}
      onLayout={({ nativeEvent }) => {
        const w = Math.round(nativeEvent.layout.width);
        if (w !== pageWidth) setPageWidth(w);
      }}
      testID={testID ? `${testID}.calendar.swipeable` : undefined}
    >
      {pageWidth > 0 && (
        <FlatList<CalendarDateValue>
          ref={flatListRef}
          data={months}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          horizontal
          initialScrollIndex={1}
          keyExtractor={keyExtractor}
          onMomentumScrollEnd={onMomentumScrollEnd}
          pagingEnabled
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          testID={testID ? `${testID}.calendar.swipeable.list` : undefined}
        />
      )}
    </View>
  );
};

const SwipeableMonthList = memo(SwipeableMonthListComponent);
SwipeableMonthList.displayName = 'Calendar.SwipeableMonthList';

// ---------------------------------------------------------------------------
// DayGrid — main exported component.
// ---------------------------------------------------------------------------

export interface DayGridProps {
  /**
   * Optional renderer for individual day cells. Receives full DayCellInfo;
   * you decide what to render. The store handles selection bookkeeping.
   *
   * Example:
   *
   *   <Calendar.DayGrid
   *     renderDay={(info) => (
   *       <MyCustomCell {...info} onPress={() => myStore.dispatch(...)} />
   *     )}
   *   />
   */
  renderDay?: DayRenderer;
  /**
   * When `true`, render the day grid inside a horizontal `FlatList` so the
   * user can swipe sideways to step to the previous / next month. Each
   * swipe dispatches `store.changeMonth(±1)`, so it composes seamlessly
   * with `useCalendarNavigation()` and any other external navigation —
   * the scroll always re-centres on the active month after any update.
   *
   * Defaults to `false` to preserve the existing static layout.
   */
  swipeable?: boolean;
}

const DayGridComponent: React.FC<DayGridProps> = ({
  renderDay,
  swipeable = false,
}) => {
  const displayed = useCalendarSelector((s) => s.displayed);
  const theme = useCalendarTheme();

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <View style={{ gap: 8, width: theme.cellSize * 7 }}>
      <WeekdayHeader />
      {swipeable ? (
        <SwipeableMonthList renderDay={renderDay} />
      ) : (
        <MonthGrid month={displayed} renderDay={renderDay} />
      )}
    </View>
  );
};

export const DayGrid = memo(DayGridComponent);
DayGrid.displayName = 'Calendar.DayGrid';
