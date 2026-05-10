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
 * When `swipeable` is enabled, months are rendered in a horizontal virtualised list
 * (`@shopify/flash-list`): one page per calendar month plus growable prepend/append
 * windows (`SwipeableMonthList`). The weekday header stays fixed outside the pager.
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
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type {
  FlashListRef,
  ListRenderItemInfo,
  ViewToken,
} from '@shopify/flash-list';

import {
  useCalendarComponents,
  useCalendarConfig,
  useCalendarSelector,
  useCalendarStore,
  useCalendarTheme,
  useCalendarWeekdayLabels,
} from '../context';
import {
  COLS,
  ROWS,
  buildMonthGrid,
  isBetween,
  isExplicitlyDisabled,
  isoWeekNumber,
  matchDate,
  usedRows,
} from '../utils/grid';
import type {
  CalendarDateValue,
  CalendarSystem,
  DayCellInfo,
  DayRenderer,
  WeekdayCellProps,
} from '../types';
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

const DefaultWeekdayCell: React.FC<WeekdayCellProps> = ({ label }) => {
  const theme = useCalendarTheme();
  return (
    <Text
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
  );
};

interface WeekdayHeaderComponentProps {
  /**
   * When true, prepend an empty corner-cell so the header lines up with
   * the week-number column rendered by `<Calendar.DayGrid showWeekNumbers />`.
   */
  showWeekNumbers?: boolean;
}

const WeekdayHeaderComponent: React.FC<WeekdayHeaderComponentProps> = ({
  showWeekNumbers,
}) => {
  const theme = useCalendarTheme();
  // Already rotated to match the active `firstDayOfWeek`, so the header
  // columns line up with the day cells without extra work here.
  const labels = useCalendarWeekdayLabels();
  const components = useCalendarComponents();

  // Full-row override wins over per-cell override.
  if (components.WeekdayHeader) {
    const Slot = components.WeekdayHeader;
    return <Slot labels={labels} />;
  }

  const Cell = components.WeekdayCell ?? DefaultWeekdayCell;

  return (
    <View style={weekdayHeaderStyle.container}>
      {showWeekNumbers && <View style={{ width: theme.cellSize }} />}
      {labels.map((label, idx) => (
        <Cell key={label} label={label} index={idx} />
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

  // Background corner radius — `inRange` is *only* the interior of a span
  // (range start/end exclude `inRange` in Layer 2), so the middle gets a
  // square slab; endpoints and singles keep `theme.borderRadius`.
  let radius = theme.borderRadius;
  let bg = 'transparent';
  if (info.isSelected) {
    bg = theme.colors.primary;
  } else if (info.inRange) {
    bg = theme.colors.rangeBackground;
    radius = 0;
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
      onPress={onPress}
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
export const dayCellPropsEqual = (prev: DayCellProps, next: DayCellProps): boolean => {
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

// Local helper — mirrors `useCalendarComponents()` but pulled inline so
// MonthGridComponent's hook list stays compact and ordered. Re-evaluating
// the modifiers is cheap (typically 0-2 entries), and Layer 2 already
// short-circuits the per-cell loop when none are set.

interface MonthGridProps {
  /** Any date inside the month to render — only year+month are read. */
  month: CalendarDateValue;
  renderDay?: DayRenderer;
  /**
   * Pixel width when rendered as a horizontal FlatList page; omit to fill
   * 100% of the parent (the static, non-swipeable case).
   */
  pageWidth?: number;
  /**
   * Render an extra leading column of week numbers, one per row. Lined up
   * with the corner spacer added by `WeekdayHeader` so columns stay
   * pixel-aligned.
   */
  showWeekNumbers?: boolean;
}

const computeWeekNumber = <T,>(system: CalendarSystem<T>, date: T): number =>
  system.weekNumber
    ? system.weekNumber(date)
    : isoWeekNumber(system.toNativeDate(date));

const MonthGridComponent: React.FC<MonthGridProps> = ({
  month,
  renderDay,
  pageWidth,
  // Always supplied by DayGrid (which itself defaults to `false`), so
  // there's no internal default to apply here.
  showWeekNumbers,
}) => {
  const store = useCalendarStore();
  const {
    onSelectHaptic,
    firstDayOfWeek,
    modifiers,
    showOutsideDays,
    fixedWeeks,
  } = useCalendarConfig();
  const components = useCalendarComponents();

  // --- subscriptions (granular slices) ---------------------------------

  const system = useCalendarSelector((s) => s.system);
  const mode = useCalendarSelector((s) => s.mode);
  const selectedDate = useCalendarSelector((s) => s.selectedDate);
  const selectedDates = useCalendarSelector((s) => s.selectedDates);
  const rangeStart = useCalendarSelector((s) => s.rangeStart);
  const rangeEnd = useCalendarSelector((s) => s.rangeEnd);
  const minDate = useCalendarSelector((s) => s.minDate);
  const maxDate = useCalendarSelector((s) => s.maxDate);
  const disabledDates = useCalendarSelector((s) => s.disabledDates);
  const disabledRanges = useCalendarSelector((s) => s.disabledRanges);
  const disabledPredicate = useCalendarSelector((s) => s.disabled);

  // --- Layer 1: build the cell skeletons. ---
  //
  // Key the cache on the (year, month) primitives rather than the `month`
  // object reference. `selectDate` updates `displayed` to the tapped date,
  // which arrives here as a brand-new `month` object even when the tap
  // stayed inside the displayed calendar month — comparing by reference
  // would invalidate Layer 1 on every same-month tap, churn 42 fresh
  // `date` objects through Layer 2, and force every DayCell to re-render
  // (its memo equality keys on `info.date === info.date`).
  const monthYear = system.year(month);
  const monthIndex = system.month(month);
  const cells = useMemo(
    () => buildMonthGrid(system, month, firstDayOfWeek),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [system, monthYear, monthIndex, firstDayOfWeek]
  );

  // --- Layer 2: enrich with selection / today / disabled flags. --------

  const cellInfos = useMemo<DayCellInfo[]>(() => {
    const today = system.today();
    const modifierEntries = modifiers ? Object.entries(modifiers) : null;
    return cells.map<DayCellInfo>((c) => {
      const isStart = !!rangeStart && system.isSame(c.date, rangeStart);
      const isEnd = !!rangeEnd && system.isSame(c.date, rangeEnd);
      const isSingle =
        mode === 'single' &&
        !!selectedDate &&
        system.isSame(c.date, selectedDate);
      const isMulti =
        mode === 'multiple' &&
        selectedDates.some((d) => system.isSame(d, c.date));
      const inRange =
        mode === 'range' && isBetween(system, c.date, rangeStart, rangeEnd);
      const nativeDate = system.toNativeDate(c.date);
      let isDisabled =
        (!!minDate && system.isBefore(c.date, minDate)) ||
        (!!maxDate && system.isAfter(c.date, maxDate)) ||
        isExplicitlyDisabled(system, c.date, disabledDates, disabledRanges);
      if (!isDisabled && disabledPredicate) {
        try {
          if (disabledPredicate(nativeDate)) isDisabled = true;
        } catch {
          // Be permissive — never crash the grid for a buggy consumer.
        }
      }
      const cellModifiers: Record<string, boolean> = {};
      if (modifierEntries) {
        for (const [name, matcher] of modifierEntries) {
          if (matchDate(system, c.date, matcher)) cellModifiers[name] = true;
        }
      }

      return {
        date: c.date,
        nativeDate,
        label: system.formatDay(c.date),
        isCurrentMonth: c.isCurrentMonth,
        isToday: system.isSame(c.date, today),
        isSelected: isSingle || isMulti || isStart || isEnd,
        inRange: inRange && !isStart && !isEnd,
        isRangeStart: isStart,
        isRangeEnd: isEnd,
        isDisabled,
        modifiers: cellModifiers,
      };
    });
  }, [
    cells,
    system,
    mode,
    selectedDate,
    selectedDates,
    rangeStart,
    rangeEnd,
    minDate,
    maxDate,
    disabledDates,
    disabledRanges,
    disabledPredicate,
    modifiers,
  ]);

  const onSelect = useCallback(
    (date: CalendarDateValue) => {
      store.selectDate(date);
      onSelectHaptic?.();
    },
    [store, onSelectHaptic]
  );

  // Trim trailing all-outside rows when `fixedWeeks={false}`.
  const visibleRows = fixedWeeks ? ROWS : usedRows(cells);
  const visibleCellCount = visibleRows * COLS;

  // Optional week-number column. Pick the Thursday cell of each row as
  // the representative date — ISO weeks are Mon-based with Thursday as
  // the canonical day-in-the-week, so this works regardless of the
  // column the row starts on (Sun / Mon / Sat / …).
  const weekNumbers = useMemo<readonly number[] | null>(() => {
    if (!showWeekNumbers) return null;
    const thursdayCol = (4 - firstDayOfWeek + 7) % 7;
    const out = new Array<number>(visibleRows);
    for (let r = 0; r < visibleRows; r += 1) {
      const cell = cells[r * COLS + thursdayCol];
      /* istanbul ignore next — buildMonthGrid always returns ROWS*COLS
       * cells, so `cell` is defined for every visible row. */
      out[r] = cell ? computeWeekNumber(system, cell.date) : 0;
    }
    return out;
  }, [showWeekNumbers, visibleRows, cells, system, firstDayOfWeek]);

  const theme = useCalendarTheme();
  const SlotDayCell = components.DayCell;
  const SlotWeekNumberCell = components.WeekNumberCell;

  // No week-number column → simple flat layout (preserves the original
  // wrapping behaviour, including renderDay back-compat).
  if (!weekNumbers) {
    return (
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          width: pageWidth ?? '100%',
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        {cellInfos.slice(0, visibleCellCount).map((info) => {
          const k = info.nativeDate.toISOString();
          // showOutsideDays={false} → keep the cell slot but render an
          // invisible spacer so the column grid stays aligned.
          if (!showOutsideDays && !info.isCurrentMonth) {
            return (
              <View
                key={k}
                style={{ width: theme.cellSize, height: theme.cellSize }}
              />
            );
          }
          if (renderDay) {
            return <Fragment key={k}>{renderDay(info)}</Fragment>;
          }
          if (SlotDayCell) {
            return <SlotDayCell info={info} key={k} onSelect={onSelect} />;
          }
          return <DayCell info={info} key={k} onSelect={onSelect} />;
        })}
      </View>
    );
  }

  // With a week-number column, lay out rows explicitly so the leading
  // cell is the week number and the remaining 7 are the day cells.
  return (
    <View style={{ width: pageWidth ?? '100%' }}>
      {weekNumbers.map((wn, rowIdx) => (
        <View key={wn} style={weekNumberRowStyle.row}>
          {SlotWeekNumberCell ? (
            <SlotWeekNumberCell weekNumber={wn} />
          ) : (
            <View
              style={[
                weekNumberRowStyle.weekCell,
                { width: theme.cellSize, height: theme.cellSize },
              ]}
            >
              <Text
                style={{
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.weekday,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {wn}
              </Text>
            </View>
          )}
          {cellInfos
            .slice(rowIdx * COLS, rowIdx * COLS + COLS)
            .map((info) => {
              const k = info.nativeDate.toISOString();
              if (!showOutsideDays && !info.isCurrentMonth) {
                return (
                  <View
                    key={k}
                    style={{ width: theme.cellSize, height: theme.cellSize }}
                  />
                );
              }
              if (renderDay) {
                return <Fragment key={k}>{renderDay(info)}</Fragment>;
              }
              if (SlotDayCell) {
                return (
                  <SlotDayCell info={info} key={k} onSelect={onSelect} />
                );
              }
              return <DayCell info={info} key={k} onSelect={onSelect} />;
            })}
        </View>
      ))}
    </View>
  );
};

const weekNumberRowStyle = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  weekCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const MonthGrid = memo(MonthGridComponent);
MonthGrid.displayName = 'Calendar.MonthGrid';

// ---------------------------------------------------------------------------
// SwipeableMonthList — internal: an infinite, virtualised, horizontal
// month list backed by `@shopify/flash-list`.
//
// Why FlashList over FlatList here:
//   - Recycling reuses `MonthGrid` instances across months, so swiping
//     through 24+ months doesn't pay 24× the mount cost.
//   - Per-month virtualisation through `drawDistance` instead of a
//     hand-rolled `[prev, current, next]` window — only the month(s)
//     within `pageWidth` of the viewport are mounted; the rest of the
//     window is just data.
//   - `maintainVisibleContentPosition` keeps the active month visually
//     anchored when we prepend / append months at the edges.
//   - `scrollToIndex` ref API gives us a clean way to react to external
//     `displayed` changes (arrow buttons, year picker, system switch).
//
// `@shopify/flash-list` is loaded lazily so it stays an optional peer
// dep — only required when the consumer renders
// `<Calendar.DayGrid swipeable />`. If the package isn't installed we
// throw a clear, README-pointing error from the first swipeable render
// rather than letting the bundler emit "Cannot find module" deep in
// our internals.
// ---------------------------------------------------------------------------

const WINDOW_RADIUS = 12; // initial: ±12 months around displayed → 25 items
const WINDOW_GROWTH = 6; // months to prepend / append on edge-reach

interface SwipeableMonthListProps {
  renderDay?: DayRenderer;
  showWeekNumbers?: boolean;
}

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

const monthsBetween = (
  system: CalendarSystem,
  from: CalendarDateValue,
  to: CalendarDateValue
): number =>
  (system.year(to) - system.year(from)) * 12 +
  (system.month(to) - system.month(from));

// Year+month equality. The `months` window stores one representative date
// per calendar month, so reconciling against `displayed` must ignore the
// day component — otherwise every `selectDate` tap (which carries the
// tapped day in `displayed`) would miss the existing entry and trigger a
// full window rebuild.
const isSameDisplayMonth = (
  system: CalendarSystem,
  a: CalendarDateValue,
  b: CalendarDateValue
): boolean =>
  system.year(a) === system.year(b) && system.month(a) === system.month(b);

// Lazy require so missing `@shopify/flash-list` only blows up in
// `swipeable` mode. Surfaced as a render-time throw so the stack trace
// points at the consumer's `<Calendar.DayGrid swipeable />`.
type SwipeableFlashList = typeof import('@shopify/flash-list').FlashList;

let cachedFlashList: SwipeableFlashList | null = null;
const loadFlashList = (): SwipeableFlashList => {
  if (cachedFlashList) return cachedFlashList;
  try {
    const mod = require('@shopify/flash-list');
    cachedFlashList = mod.FlashList as SwipeableFlashList;
    return cachedFlashList;
  } catch {
    throw new Error(
      '[react-native-fast-calendar] <Calendar.DayGrid swipeable /> ' +
        'requires `@shopify/flash-list` to be installed. Add it with:\n\n' +
        '    yarn add @shopify/flash-list\n\n' +
        'See the README for the full swipeable-mode setup.'
    );
  }
};

const SwipeableMonthListComponent: React.FC<SwipeableMonthListProps> = ({
  renderDay,
  showWeekNumbers,
}) => {
  const FlashList = loadFlashList();

  const store = useCalendarStore();
  const { testID } = useCalendarConfig();
  const system = useCalendarSelector((s) => s.system);
  const displayed = useCalendarSelector((s) => s.displayed);
  const theme = useCalendarTheme();

  const listRef = useRef<FlashListRef<CalendarDateValue>>(null);
  const [pageWidth, setPageWidth] = useState(0);

  // Horizontal lists in React Native take their cross-axis (height)
  // from the parent — items don't push the list taller. Without an
  // explicit height the wrapper collapses to 0 and no day cells render.
  // Reserve a full 6-row grid (`ROWS`) so every page has the same
  // vertical footprint regardless of whether a particular month uses 4,
  // 5, or 6 weeks.
  const pageHeight = theme.cellSize * ROWS;

  // The visible window of months. Grows from both ends via
  // `onStartReached` / `onEndReached`. Always includes `displayed`; the
  // re-centring effect below rebuilds the window when `displayed` jumps
  // out of it (year picker, system switch, programmatic navigation).
  const [months, setMonths] = useState<readonly CalendarDateValue[]>(() =>
    buildMonthsAround(system, displayed, WINDOW_RADIUS)
  );

  // System change wipes the entire window — month identities differ
  // between calendar systems (e.g. Gregorian's `{y,m,d}` vs Hijri's
  // `{hy,hm,hd}`), so reusing them would have `MonthGrid` ask the new
  // system for `.year()` / `.month()` of an old-shape value, propagate
  // `NaN` into the converter, and crash with a "month = 0" assertion.
  //
  // The detection has to be synchronous-during-render (not a post-commit
  // `useEffect`) — by the time an effect fires, FlashList has already
  // rendered the stale data through `renderItem` and crashed. Calling
  // `setMonths` during render is the React-recommended pattern for
  // deriving state from props (see https://react.dev/reference/react/
  // useState#storing-information-from-previous-renders): React
  // discards the in-flight render and re-runs with the new state, but
  // we still use `activeMonths` immediately so the discarded render
  // also feeds correctly-shaped dates downstream.
  //
  // Crucially, the "previous system" tracker is **state**, not a ref.
  // StrictMode (and concurrent re-renders) invoke the component body
  // twice; ref mutations persist across that double-invocation, so a
  // ref tracker would flip on the first run, look "already up-to-date"
  // on the second, skip the rebuild, and hand the list stale months
  // back. State resets to the same value on each invocation until React
  // commits the update — so both invocations agree the swap is fresh.
  const [lastSystemId, setLastSystemId] = useState(system.id);
  let activeMonths = months;
  if (lastSystemId !== system.id) {
    activeMonths = buildMonthsAround(system, displayed, WINDOW_RADIUS);
    setLastSystemId(system.id);
    setMonths(activeMonths);
  }

  // `displayed` ↔ `months` reconciliation. Two cases:
  //   (1) displayed is inside the current window → no-op (active index
  //       is recomputed below; scroll-sync effect handles positioning).
  //   (2) displayed jumped outside the window → rebuild the window
  //       around it. The new array is a brand-new identity so FlashList
  //       resets its containers and `initialScrollIndex` re-anchors at
  //       `WINDOW_RADIUS`.
  useEffect(() => {
    const idx = activeMonths.findIndex((m) =>
      isSameDisplayMonth(system, m, displayed)
    );
    if (idx === -1) {
      setMonths(buildMonthsAround(system, displayed, WINDOW_RADIUS));
    }
  }, [displayed, activeMonths, system]);

  const activeIndex = useMemo(() => {
    const idx = activeMonths.findIndex((m) =>
      isSameDisplayMonth(system, m, displayed)
    );
    return idx === -1 ? WINDOW_RADIUS : idx;
  }, [activeMonths, system, displayed]);

  // Sync external navigation → scroll. Runs whenever `displayed` (or
  // the resolved index) changes; FlashList's scroll position usually
  // already matches when the change came from a swipe so this is a
  // cheap no-op in that case.
  useEffect(() => {
    if (pageWidth === 0) return;
    listRef.current?.scrollToIndex({ index: activeIndex, animated: false });
  }, [activeIndex, pageWidth]);

  // Sync swipe → store. Fires when the user lands on a new page;
  // computes the month delta and dispatches `changeMonth` so every
  // hook reading `displayed` stays in lockstep.
  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ReadonlyArray<ViewToken<CalendarDateValue>>;
    }) => {
      const visible = viewableItems[0];
      if (!visible) return;
      const next = visible.item;
      const current = store.getSnapshot().displayed;
      const delta = monthsBetween(system, current, next);
      if (delta !== 0) store.changeMonth(delta);
    },
    [store, system]
  );

  // Single-active-page semantics: the >=60% rule means at most one
  // month is "viewable" at any time, so `viewableItems[0]` above is
  // unambiguous.
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  // Initial window is 25 months and only ever grows, so `prev[0]` /
  // `prev[prev.length - 1]` are guaranteed to be defined — the
  // non-null assertion is safe under `noUncheckedIndexedAccess` and
  // saves us a defensive branch we couldn't reach in tests.
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
      <MonthGrid
        month={item}
        pageWidth={pageWidth}
        renderDay={renderDay}
        showWeekNumbers={showWeekNumbers}
      />
    ),
    [pageWidth, renderDay, showWeekNumbers]
  );

  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{ width: '100%', height: pageHeight }}
      onLayout={({ nativeEvent }) => {
        const w = Math.round(nativeEvent.layout.width);
        if (w !== pageWidth) setPageWidth(w);
      }}
      testID={testID ? `${testID}.calendar.swipeable` : undefined}
    >
      {pageWidth > 0 && (
        <FlashList<CalendarDateValue>
          // `key={system.id}` force-remounts the list whenever the
          // active calendar system changes. Belt-and-braces alongside
          // the `lastSystemId` rebuild above: it guarantees the list's
          // internal measurement caches, recycled cell pool, and layout
          // estimates start fresh for the new system instead of trying
          // to reconcile wildly different month identities (Gregorian
          // `{y,m,d}` vs Hijri `{hy,hm,hd}`). Without this, recycled
          // cells can briefly hold a stale-shape date long enough to
          // crash the converter ("month = 0") inside `system.year` /
          // `system.month` calls fired by virtualisation bookkeeping.
          key={system.id}
          data={activeMonths}
          // One page on each side of the viewport stays mounted — keeps
          // swipes flash-free while still bounding mounted MonthGrids
          // to 3, regardless of how long the data window grows.
          drawDistance={pageWidth}
          horizontal
          initialScrollIndex={activeIndex}
          keyExtractor={keyExtractor}
          // Stable scroll anchor when `onStartReached` prepends — without
          // this the active month would visually jump every time the
          // window grows backwards.
          onEndReached={onEndReached}
          onStartReached={onStartReached}
          onViewableItemsChanged={onViewableItemsChanged}
          pagingEnabled
          ref={listRef}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          testID={testID ? `${testID}.calendar.swipeable.list` : undefined}
          viewabilityConfig={viewabilityConfig}
        />
      )}
    </View>
  );
};

const SwipeableMonthList = memo(SwipeableMonthListComponent);
SwipeableMonthList.displayName = 'Calendar.SwipeableMonthList';

// ---------------------------------------------------------------------------
// MonthSlot — single (caption + grid) pair, used both by the static day
// view and as a sibling repeater in `numberOfMonths > 1`.
// ---------------------------------------------------------------------------

interface MonthSlotProps {
  month: CalendarDateValue;
  renderDay?: DayRenderer;
  showWeekNumbers?: boolean;
}

const MonthSlotComponent: React.FC<MonthSlotProps> = ({
  month,
  renderDay,
  showWeekNumbers,
}) => {
  const components = useCalendarComponents();
  const system = useCalendarSelector((s) => s.system);

  const Caption = components.MonthCaption;
  const captionProps = Caption
    ? {
        date: month,
        monthIndex: system.month(month),
        year: system.year(month),
        label: system.formatMonthYear(month),
      }
    : null;

  return (
    <View>
      {Caption && captionProps && <Caption {...captionProps} />}
      <MonthGrid
        month={month}
        renderDay={renderDay}
        showWeekNumbers={showWeekNumbers}
      />
    </View>
  );
};

const MonthSlot = memo(MonthSlotComponent);
MonthSlot.displayName = 'Calendar.MonthSlot';

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
   * When `true`, render the day grid inside a horizontal virtualised month list so the
   * user can swipe sideways to step to the previous / next month. Each
   * swipe dispatches `store.changeMonth(±1)`, so it composes seamlessly
   * with `useCalendarNavigation()` and any other external navigation —
   * the scroll always re-centres on the active month after any update.
   *
   * Defaults to `false` to preserve the existing static layout.
   *
   * Mutually exclusive with `numberOfMonths > 1` — the swipeable list
   * always shows a single page.
   *
   * In React Native development builds (`__DEV__`), passing both props
   * logs a console warning (`swipeable` is ignored for multi-month grids).
   */
  swipeable?: boolean;
  /**
   * Render `numberOfMonths` consecutive months side-by-side, starting at
   * the currently displayed month. Each month is captioned via the
   * `components.MonthCaption` slot (no caption is rendered when the slot
   * is omitted, preserving the single-month layout's headerless look).
   *
   * Defaults to `1`. Values >= 2 disable `swipeable` automatically
   * (Development: the combination raises a warning — see `swipeable`.)
   */
  numberOfMonths?: number;
  /**
   * Show a leading column of week numbers, one per grid row (Thursday of each
   * row is taken as the reference day so numbering stays coherent across
   * different `firstDayOfWeek` values).
   *
   * - When `CalendarSystem.weekNumber` is implemented, week numbers come from
   *   the calendar system (the bundled Gregorian system uses ISO weeks).
   * - Otherwise numbers are computed as **ISO 8601 week-of-year for the row's
   *   underlying Gregorian calendar date** (`toNativeDate`), even when you are
   *   displaying Jalali/Hijri day labels — extend the interface with `weekNumber`
   *   if users need lunar/Persian week semantics.
   *
   * Defaults to `false`.
   */
  showWeekNumbers?: boolean;
}

const DayGridComponent: React.FC<DayGridProps> = ({
  renderDay,
  swipeable = false,
  numberOfMonths = 1,
  showWeekNumbers = false,
}) => {
  const displayed = useCalendarSelector((s) => s.displayed);
  const system = useCalendarSelector((s) => s.system);
  const theme = useCalendarTheme();

  const safeMonths = Math.max(1, Math.floor(numberOfMonths));
  const isMultiMonth = safeMonths > 1;
  // Multi-month overrides swipeable — supporting both at once would
  // require a per-page numberOfMonths slice, which adds complexity for
  // little practical gain. Document the precedence.
  const useSwipeable = swipeable && !isMultiMonth;

  useEffect(() => {
    if (!__DEV__ || !swipeable || !isMultiMonth) return;
    console.warn(
      '[react-native-fast-calendar] <Calendar.DayGrid swipeable /> is ' +
        'ignored while numberOfMonths > 1. Remove swipeable=true or split ' +
        'into separate roots if you truly need swipe + parallel months.'
    );
  }, [swipeable, isMultiMonth]);

  const monthsToRender = useMemo<readonly CalendarDateValue[]>(() => {
    if (!isMultiMonth) return [displayed];
    return Array.from({ length: safeMonths }, (_, i) =>
      i === 0 ? displayed : system.addMonths(displayed, i)
    );
  }, [isMultiMonth, safeMonths, displayed, system]);

  // Single-month static layout: keep the original gap-8 stacking so
  // existing layouts don't shift visually.
  if (!isMultiMonth) {
    return (
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          gap: 8,
          width: theme.cellSize * (showWeekNumbers ? 8 : 7),
        }}
      >
        <WeekdayHeader showWeekNumbers={showWeekNumbers} />
        {useSwipeable ? (
          <SwipeableMonthList
            renderDay={renderDay}
            showWeekNumbers={showWeekNumbers}
          />
        ) : (
          <MonthSlot
            month={displayed}
            renderDay={renderDay}
            showWeekNumbers={showWeekNumbers}
          />
        )}
      </View>
    );
  }

  // Multi-month layout: each month is its own column with its own
  // weekday header (so the captions and weekday rows line up per month).
  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{ flexDirection: 'row', gap: theme.spacing.monthGap }}
    >
      {monthsToRender.map((m) => (
        <View
          key={`${system.year(m)}-${system.month(m)}`}
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            gap: 8,
            width: theme.cellSize * (showWeekNumbers ? 8 : 7),
          }}
        >
          <WeekdayHeader showWeekNumbers={showWeekNumbers} />
          <MonthSlot
            month={m}
            renderDay={renderDay}
            showWeekNumbers={showWeekNumbers}
          />
        </View>
      ))}
    </View>
  );
};

export const DayGrid = memo(DayGridComponent);
DayGrid.displayName = 'Calendar.DayGrid';
