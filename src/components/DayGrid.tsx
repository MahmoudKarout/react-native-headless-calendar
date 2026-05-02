/**
 * Calendar.DayGrid — the 6x7 grid of day cells.
 *
 * Two layers of memoisation, like the original implementation:
 *
 *   Layer 1 (expensive): build the 42 system-specific date objects for the
 *   displayed month. Recomputes only when month / system / bounds change.
 *
 *   Layer 2 (cheap):     overlay selection / range / today flags.
 *   Recomputes on every selection change but reuses Layer 1's date refs.
 *
 * Day cells are wrapped in React.memo and receive only stable props, so
 * tapping a date re-renders at most 2-4 cells.
 *
 * Consumers can fully replace the cell rendering with the `renderDay`
 * prop — for completely custom day visuals, see <Calendar.DayCell> below.
 */
import React, { memo, useCallback, useMemo } from 'react';
import type { GestureResponderEvent } from 'react-native';

import {
  useCalendarConfig,
  useCalendarPrimitives,
  useCalendarSelector,
  useCalendarStore,
  useCalendarTheme,
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
// ---------------------------------------------------------------------------

const WeekdayHeaderComponent: React.FC = () => {
  const { View, Text } = useCalendarPrimitives();
  const theme = useCalendarTheme();
  const labels = useCalendarSelector((s) => s.system.weekdayLabels());

  return (
    <View
      accessible={false}
      style={{
        flexDirection: 'row',
        width: theme.cellSize * 7,
      }}
    >
      {labels.map((label, idx) => (
        <View
          key={`${label}-${idx}`}
          style={{
            width: theme.cellSize,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: theme.spacing.xs,
          }}
        >
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.fontSize.weekday,
              fontWeight: '500',
            }}
          >
            {label}
          </Text>
        </View>
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
  const { Pressable, Text } = useCalendarPrimitives();
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
      style={{
        width: theme.cellSize,
        height: theme.cellSize,
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
}

const DayGridComponent: React.FC<DayGridProps> = ({ renderDay }) => {
  const { View } = useCalendarPrimitives();
  const theme = useCalendarTheme();
  const store = useCalendarStore();
  const { onSelectHaptic } = useCalendarConfig();

  // --- subscriptions (granular slices) ---------------------------------

  // Stable monthKey — same string while displayed month doesn't change,
  // so Layer-1 memo doesn't recompute on date taps.
  const monthKey = useCalendarSelector((s) => {
    const y = s.system.year(s.displayed);
    const m = s.system.month(s.displayed);
    return `${s.system.id}:${y}-${m}`;
  });

  const mode = useCalendarSelector((s) => s.mode);
  const selectedDate = useCalendarSelector((s) => s.selectedDate);
  const rangeStart = useCalendarSelector((s) => s.rangeStart);
  const rangeEnd = useCalendarSelector((s) => s.rangeEnd);
  const minDate = useCalendarSelector((s) => s.minDate);
  const maxDate = useCalendarSelector((s) => s.maxDate);
  const disabledDates = useCalendarSelector((s) => s.disabledDates);
  const disabledRanges = useCalendarSelector((s) => s.disabledRanges);

  // --- Layer 1: build the cell skeletons. monthKey + bounds in deps. ---

  const cells = useMemo(() => {
    const s = store.getSnapshot();
    return buildMonthGrid(s.system, s.displayed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey, store, minDate, maxDate]);

  // --- Layer 2: enrich with selection / today / disabled flags. --------

  const cellInfos = useMemo<DayCellInfo[]>(() => {
    const s = store.getSnapshot();
    const today = s.system.today();
    return cells.map<DayCellInfo>((c) => {
      const isStart = !!rangeStart && s.system.isSame(c.date, rangeStart);
      const isEnd = !!rangeEnd && s.system.isSame(c.date, rangeEnd);
      const isSingle =
        mode === 'single' &&
        !!selectedDate &&
        s.system.isSame(c.date, selectedDate);
      const inRange =
        mode === 'range' && isBetween(s.system, c.date, rangeStart, rangeEnd);
      const isDisabled =
        (!!minDate && s.system.isBefore(c.date, minDate)) ||
        (!!maxDate && s.system.isAfter(c.date, maxDate)) ||
        isExplicitlyDisabled(s.system, c.date, disabledDates, disabledRanges);

      return {
        date: c.date,
        nativeDate: s.system.toNativeDate(c.date),
        label: s.system.formatDay(c.date),
        isCurrentMonth: c.isCurrentMonth,
        isToday: s.system.isSame(c.date, today),
        isSelected: isSingle || isStart || isEnd,
        inRange: inRange && !isStart && !isEnd,
        isRangeStart: isStart,
        isRangeEnd: isEnd,
        isDisabled,
      };
    });
  }, [
    cells,
    mode,
    selectedDate,
    rangeStart,
    rangeEnd,
    minDate,
    maxDate,
    disabledDates,
    disabledRanges,
    store,
  ]);

  const onSelect = useCallback(
    (date: CalendarDateValue) => {
      store.selectDate(date);
      onSelectHaptic?.();
    },
    [store, onSelectHaptic]
  );

  return (
    <View style={{ alignItems: 'center' }}>
      <WeekdayHeader />
      <View
        style={{
          width: theme.cellSize * 7,
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        {cellInfos.map((info, idx) => {
          if (renderDay) {
            return <React.Fragment key={idx}>{renderDay(info)}</React.Fragment>;
          }
          /* istanbul ignore next — defensive guard; cellInfos is always
           * exactly TOTAL_CELLS entries long. */
          if (idx >= TOTAL_CELLS) return null;
          return <DayCell info={info} key={idx} onSelect={onSelect} />;
        })}
      </View>
    </View>
  );
};

export const DayGrid = memo(DayGridComponent);
DayGrid.displayName = 'Calendar.DayGrid';
