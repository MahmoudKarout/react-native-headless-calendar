/**
 * Vertical Calendar — feature gallery.
 *
 * One file per "Vertical: …" tab in the demo app. Each export is a
 * self-contained screen that mirrors the matching `CalendarDemo` recipe
 * (Range, Multiple, Bounded, Multi-month, Multi-system, Custom slots,
 * Localised, Image cells), but rendered in the iOS-Calendar-style
 * infinite vertical list paradigm instead of the standard single-page
 * grid.
 *
 * The shared building blocks at the top of this file generalise the
 * `MonthSection` recipe shipped in `VerticalCalendarExample.tsx`:
 *
 *   - `MonthSection` here understands every selection mode (single,
 *     multiple, range), reads `modifiers` from `useCalendarConfig`,
 *     honours the `<Calendar.Root components>` slot map (DayCell,
 *     WeekdayHeader, WeekdayCell, WeekNumberCell, MonthCaption), and
 *     supports both `renderDay` and the optional week-number column.
 *
 *   - `WeekdayHeaderRow` defers to `components.WeekdayHeader` /
 *     `components.WeekdayCell` if either is provided.
 *
 *   - `VerticalMonthList` is the FlashList wrapper from the recipe
 *     extended with `renderDay` / `showWeekNumbers` props that flow
 *     into every per-month section.
 *
 *   - `VerticalCalendarShell` composes header + weekday row + scroll
 *     list into a screen-filling layout, so each example below stays
 *     short.
 *
 * The simpler `VerticalCalendarExample.tsx` is intentionally kept
 * untouched as the minimal recipe for projects copying the pattern.
 */
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  I18nManager,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
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
  isBetween,
  isExplicitlyDisabled,
  isoWeekNumber,
  matchDate,
  useCalendarActions,
  useCalendarComponents,
  useCalendarConfig,
  useCalendarLabels,
  useCalendarSelectedDates,
  useCalendarSelector,
  useCalendarStore,
  useCalendarSystemSwitcher,
  useCalendarWeekdayLabels,
  usedRows,
  type CalendarComponents,
  type CalendarDateValue,
  type CalendarSystem,
  type CalendarThemeOverride,
  type DayCellInfo,
  type DayRenderer,
  type MonthCaptionProps,
  type WeekdayCellProps,
  type WeekdayHeaderProps,
  type WeekNumberCellProps,
} from 'react-native-fast-calendar';
import {
  createGregorianSystem,
  gregorianSystem,
} from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';
import { jalaliSystem } from 'react-native-fast-calendar/systems/jalali';

// ---------------------------------------------------------------------------
// Tokens / theme — shadcn-flavoured zinc palette, mirroring CalendarDemo so
// the standard and vertical demos look like one product.
// ---------------------------------------------------------------------------

const C = {
  background: '#FFFFFF',
  foreground: '#0A0A0A',
  mutedForeground: '#71717A', // zinc-500
  muted: '#F4F4F5', // zinc-100
  mutedHover: '#E4E4E7', // zinc-200
  border: '#E4E4E7', // zinc-200
  borderStrong: '#A1A1AA', // zinc-400
  primary: '#0A0A0A',
  primaryForeground: '#FAFAFA',
  todayAccent: '#1F6FEB',
  disabled: '#A1A1AA',
};

const CELL_SIZE = 44;

// Initial / growth window — matches the recipe in
// `VerticalCalendarExample.tsx`. Comments in that file explain the
// trade-offs; we re-use the values here for visual consistency.
const WINDOW_RADIUS = 6;
const WINDOW_GROWTH = 6;
const DRAW_DISTANCE = 250;
const EXTRA_DATA = { recycleState: true } as const;

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
    disabled: C.disabled,
  },
  cellSize: CELL_SIZE,
  borderRadius: 8,
  fontSize: { day: 15, weekday: 12, header: 16 },
};

// ---------------------------------------------------------------------------
// Window helpers — shared between the imperative scroll API and the
// out-of-window reconciliation effect.
// ---------------------------------------------------------------------------

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

const computeWeekNumber = <T,>(system: CalendarSystem<T>, date: T): number =>
  system.weekNumber
    ? system.weekNumber(date)
    : isoWeekNumber(system.toNativeDate(date));

// ---------------------------------------------------------------------------
// MonthSection — generalised. Mirrors the library's own internal
// `MonthGrid` (see `src/components/DayGrid.tsx`) so every selection mode
// and every `<Calendar.Root components>` slot works out of the box.
//
// Two-layer memo strategy is identical to the simple recipe:
//   Layer 1 (year+month-keyed): build the 42 cell skeletons.
//   Layer 2 (selection-keyed):  overlay flags, reusing Layer 1's date refs.
// ---------------------------------------------------------------------------

interface MonthSectionProps {
  month: CalendarDateValue;
  /**
   * Per-cell renderer, takes precedence over `components.DayCell` and
   * the default `<DayCell>`.
   */
  renderDay?: DayRenderer;
  /** Render an extra leading column of week numbers, one per row. */
  showWeekNumbers?: boolean;
}

function MonthSectionComponent({
  month,
  renderDay,
  showWeekNumbers,
}: MonthSectionProps) {
  const store = useCalendarStore();
  // `showOutsideDays` is intentionally ignored in the vertical layout —
  // see `renderCell` below.
  const { firstDayOfWeek, fixedWeeks, modifiers } = useCalendarConfig();
  const components = useCalendarComponents();

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

  // Layer 1 — keyed on year+month primitives so a fresh `month` object
  // identity (e.g. when the data window is rebuilt) doesn't invalidate
  // the cache as long as it still represents the same calendar month.
  const monthYear = system.year(month);
  const monthIndex = system.month(month);
  const cells = useMemo(
    () => buildMonthGrid(system, month, firstDayOfWeek),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [system, monthYear, monthIndex, firstDayOfWeek]
  );

  // Layer 2 — overlay every flag the library's own MonthGrid computes.
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
          // Permissive — never crash a row for a buggy consumer predicate.
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
    (date: CalendarDateValue) => store.selectDate(date),
    [store]
  );

  const visibleRows = fixedWeeks ? ROWS : usedRows(cells);
  const visibleCellCount = visibleRows * COLS;

  // Optional week-number column. Pick the Thursday cell of each row as
  // the representative date — ISO weeks are Mon-based with Thursday as
  // the canonical day-in-the-week, so this works regardless of the
  // column the row starts on.
  const weekNumbers = useMemo<readonly number[] | null>(() => {
    if (!showWeekNumbers) return null;
    const thursdayCol = (4 - firstDayOfWeek + 7) % 7;
    const out = new Array<number>(visibleRows);
    for (let r = 0; r < visibleRows; r += 1) {
      const cell = cells[r * COLS + thursdayCol];
      out[r] = cell ? computeWeekNumber(system, cell.date) : 0;
    }
    return out;
  }, [showWeekNumbers, visibleRows, cells, system, firstDayOfWeek]);

  // Caption — `components.MonthCaption` wins; otherwise we render a
  // default styled month/year header that matches the simple recipe.
  const Caption = components.MonthCaption;
  const captionProps: MonthCaptionProps | null = Caption
    ? {
        date: month,
        monthIndex: system.month(month),
        year: system.year(month),
        label: system.formatMonthYear(month),
      }
    : null;

  const SlotDayCell = components.DayCell;
  const SlotWeekNumberCell = components.WeekNumberCell;

  // Section width: 7 day columns + (optional) leading week-number column.
  const sectionWidth = CELL_SIZE * (showWeekNumbers ? COLS + 1 : COLS);

  // Day-cell renderer hierarchy — `renderDay` > `components.DayCell` >
  // built-in `<DayCell>`. Identical precedence to the library's own
  // `MonthGrid`.
  //
  // Outside-month cells are ALWAYS rendered as blank spacers in the
  // vertical layout, regardless of the `showOutsideDays` config. In a
  // continuous vertical scroll consecutive months sit directly above
  // one another, so a greyed-out "May 30" at the bottom of June and
  // again as a current-month cell on the May card would duplicate the
  // same calendar day on screen — exactly the "is that May 30 or
  // June 1?" confusion the iOS Calendar avoids by suppressing outside
  // days. The spacer keeps the 7-column grid aligned under the sticky
  // weekday header.
  const renderCell = (info: DayCellInfo, idx: number): ReactNode => {
    if (!info.isCurrentMonth) {
      return <View key={idx} style={styles.spacerCell} />;
    }
    if (renderDay) return <View key={idx}>{renderDay(info)}</View>;
    if (SlotDayCell) {
      return <SlotDayCell info={info} key={idx} onSelect={onSelect} />;
    }
    return <DayCell info={info} key={idx} onSelect={onSelect} />;
  };

  return (
    <View style={[styles.monthSection, { width: sectionWidth }]}>
      {Caption && captionProps ? (
        <Caption {...captionProps} />
      ) : (
        <Text style={styles.monthHeader}>{system.formatMonthYear(month)}</Text>
      )}

      {weekNumbers ? (
        // Per-row layout when week numbers are enabled — leading cell
        // is the week number, then 7 day cells.
        <View style={{ width: sectionWidth }}>
          {weekNumbers.map((wn, rowIdx) => (
            <View key={rowIdx} style={styles.weekRow}>
              {SlotWeekNumberCell ? (
                <SlotWeekNumberCell weekNumber={wn} />
              ) : (
                <View style={styles.weekNumberCell}>
                  <Text style={styles.weekNumberText}>{wn}</Text>
                </View>
              )}
              {cellInfos
                .slice(rowIdx * COLS, rowIdx * COLS + COLS)
                .map((info, colIdx) =>
                  renderCell(info, rowIdx * COLS + colIdx)
                )}
            </View>
          ))}
        </View>
      ) : (
        // Flat layout — flex-wrap keeps the original 6×7 grid behaviour.
        <View style={[styles.monthGrid, { width: sectionWidth }]}>
          {cellInfos
            .slice(0, visibleCellCount)
            .map((info, idx) => renderCell(info, idx))}
        </View>
      )}
    </View>
  );
}

const MonthSection = memo(MonthSectionComponent);
MonthSection.displayName = 'VerticalCalendarExamples.MonthSection';

// ---------------------------------------------------------------------------
// WeekdayHeaderRow — sticky row above the FlashList. Defers to
// `components.WeekdayHeader` (full-row override) or `components.WeekdayCell`
// (per-column override) when either is provided, otherwise renders the
// default lowercase shadcn-style row.
// ---------------------------------------------------------------------------

interface WeekdayHeaderRowProps {
  showWeekNumbers?: boolean;
}

function WeekdayHeaderRow({ showWeekNumbers }: WeekdayHeaderRowProps) {
  const labels = useCalendarWeekdayLabels();
  const components = useCalendarComponents();

  if (components.WeekdayHeader) {
    const Slot = components.WeekdayHeader;
    return (
      <View style={styles.weekdayHeaderInner}>
        {showWeekNumbers && <View style={styles.weekNumberCell} />}
        <Slot labels={labels} />
      </View>
    );
  }

  const Cell = components.WeekdayCell;

  return (
    <View
      style={[
        styles.weekdayRow,
        { width: CELL_SIZE * (showWeekNumbers ? COLS + 1 : COLS) },
      ]}
    >
      {showWeekNumbers && <View style={styles.weekNumberCell} />}
      {labels.map((l, i) =>
        Cell ? (
          <Cell index={i} key={`${l}-${i}`} label={l} />
        ) : (
          <Text key={`${l}-${i}`} style={styles.weekdayLabel}>
            {l.slice(0, 3)}
          </Text>
        )
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// VerticalMonthList — the FlashList. Identical windowing + growth logic
// to the recipe, parameterised with `renderDay` / `showWeekNumbers` so
// each example threads its own per-cell config through.
// ---------------------------------------------------------------------------

interface VerticalMonthListHandle {
  scrollToMonth: (date: CalendarDateValue) => void;
}

interface VerticalMonthListProps {
  renderDay?: DayRenderer;
  showWeekNumbers?: boolean;
}

const VerticalMonthList = forwardRef<
  VerticalMonthListHandle,
  VerticalMonthListProps
>(function VerticalMonthList({ renderDay, showWeekNumbers }, ref) {
  const system = useCalendarSelector((s) => s.system);
  const displayed = useCalendarSelector((s) => s.displayed);

  const listRef = useRef<FlashListRef<CalendarDateValue>>(null);

  const [months, setMonths] = useState<readonly CalendarDateValue[]>(() =>
    buildMonthsAround(system, displayed, WINDOW_RADIUS)
  );

  // System change wipes the entire window — month identities differ
  // between calendar systems (e.g. Gregorian vs Hijri). Detect the swap
  // synchronously during render and rebuild `months` before any child
  // (`MonthSection`) sees the mismatched (new system, old data) pair.
  // A post-commit `useEffect` would be too late — the discarded render
  // would already have fed Gregorian-shaped dates into a Hijri-aware
  // grid, blowing up inside the converter.
  //
  // We track the last-seen system id in **state**, not a ref, on
  // purpose. React's StrictMode (and concurrent re-renders in general)
  // invokes the component body twice; mutations to a `useRef` persist
  // across that double-invocation, so a ref-based tracker would flip on
  // the first invocation, look "already up-to-date" on the second, and
  // hand the FlashList stale (old-system) `months` back. State, by
  // contrast, is restarted from the same value on every invocation
  // until React commits the update — so both invocations agree the
  // swap is fresh and rebuild the window. This is the canonical
  // "storing information from previous renders" pattern from
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders.
  const [lastSystemId, setLastSystemId] = useState(system.id);
  let activeMonths = months;
  if (lastSystemId !== system.id) {
    activeMonths = buildMonthsAround(system, displayed, WINDOW_RADIUS);
    setLastSystemId(system.id);
    setMonths(activeMonths);
  }

  const recentreOn = useCallback(
    (target: CalendarDateValue) => {
      setMonths(buildMonthsAround(system, target, WINDOW_RADIUS));
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index: WINDOW_RADIUS,
          animated: false,
        });
      });
    },
    [system]
  );

  useEffect(() => {
    const idx = activeMonths.findIndex((m) =>
      isSameDisplayMonth(system, m, displayed)
    );
    if (idx === -1) recentreOn(displayed);
  }, [displayed, activeMonths, system, recentreOn]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToMonth: (target) => {
        const idx = activeMonths.findIndex((m) =>
          isSameDisplayMonth(system, m, target)
        );
        if (idx >= 0) {
          listRef.current?.scrollToIndex({ index: idx, animated: true });
        } else {
          recentreOn(target);
        }
      },
    }),
    [activeMonths, system, recentreOn]
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
      <MonthSection
        month={item}
        renderDay={renderDay}
        showWeekNumbers={showWeekNumbers}
      />
    ),
    [renderDay, showWeekNumbers]
  );

  return (
    <FlashList<CalendarDateValue>
      // `key={system.id}` force-remounts the list whenever the active
      // calendar system changes. Belt-and-braces alongside the
      // `lastSystemId` rebuild above: it guarantees the list's internal
      // measurement caches, recycled cell pool, and layout estimates
      // start fresh for the new system instead of trying to reconcile
      // wildly different month identities (Gregorian `{y,m,d}` vs
      // Hijri `{hy,hm,hd}`). Without this, recycled cells can briefly
      // hold a stale-shape date long enough to crash the converter
      // ("month = 0") inside `system.year` / `system.month` calls fired
      // by virtualisation bookkeeping.
      key={system.id}
      data={activeMonths}
      drawDistance={DRAW_DISTANCE}
      extraData={EXTRA_DATA}
      initialScrollIndex={WINDOW_RADIUS}
      keyExtractor={keyExtractor}
      onEndReached={onEndReached}
      onStartReached={onStartReached}
      // Cast: under `react-native-strict-api`, ScrollView's `ref` and
      // FlashList's `RefAttributes<FlashListRef>` intersect into an
      // un-satisfiable type. The runtime contract is fine.
      ref={listRef as never}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
});

// ---------------------------------------------------------------------------
// VerticalCalendarShell — composes the screen-fillingscaffold every
// example uses: a header block, an optional readout above the weekday
// row, the sticky weekday row itself, and the vertical month list.
//
// `headerExtras` slots between the header text and the weekday row, so
// examples like Multi-system can drop a system switcher there without
// repeating the surrounding layout.
// ---------------------------------------------------------------------------

interface VerticalCalendarShellProps {
  title: string;
  description: string;
  headerExtras?: ReactNode;
  /**
   * Slot rendered between the main header and the weekday header. Use
   * for per-mode readouts (range checkout, multi-select tag list, …).
   */
  readout?: ReactNode;
  /**
   * Slot rendered below the month list. Use for confirm/clear action
   * bars or per-example legends.
   */
  footer?: ReactNode;
  renderDay?: DayRenderer;
  showWeekNumbers?: boolean;
}

function VerticalCalendarShell({
  title,
  description,
  headerExtras,
  readout,
  footer,
  renderDay,
  showWeekNumbers,
}: VerticalCalendarShellProps) {
  const monthListRef = useRef<VerticalMonthListHandle>(null);
  const store = useCalendarStore();
  const system = useCalendarSelector((s) => s.system);

  const onJumpToday = useCallback(() => {
    const today = system.today();
    store.selectDate(today);
    monthListRef.current?.scrollToMonth(today);
  }, [store, system]);

  return (
    <View style={styles.shellContainer}>
      <View style={styles.headerBlock}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{description}</Text>
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

      {headerExtras}
      {readout}

      <View style={styles.weekdayHeaderWrapper}>
        <WeekdayHeaderRow showWeekNumbers={showWeekNumbers} />
      </View>

      <VerticalMonthList
        ref={monthListRef}
        renderDay={renderDay}
        showWeekNumbers={showWeekNumbers}
      />

      {footer}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shared atoms — Badge, Button, Separator, Chevron-less because the
// vertical layout has no horizontal nav. Each atom is a slimmer cousin
// of the matching atom in `CalendarDemo.tsx`.
// ---------------------------------------------------------------------------

function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'muted' | 'inverted';
}) {
  return (
    <View
      style={[
        styles.badge,
        tone === 'muted' && styles.badgeMuted,
        tone === 'inverted' && styles.badgeInverted,
      ]}
    >
      <Text
        style={[
          styles.badgeLabel,
          tone === 'inverted' && styles.badgeLabelInverted,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

function Button({
  children,
  disabled,
  onPress,
  variant = 'primary',
}: {
  children: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        variant === 'outline' ? styles.btnOutline : styles.btnPrimary,
        pressed && styles.btnPressed,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text
        style={[
          styles.btnLabel,
          variant === 'outline' && styles.btnLabelOutline,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

function ActionBar() {
  const { canConfirm, clear, confirm } = useCalendarActions();
  const labels = useCalendarLabels();
  return (
    <View style={styles.actionBar}>
      <View style={styles.actionBtn}>
        <Button onPress={clear} variant="outline">
          {labels.clear}
        </Button>
      </View>
      <View style={styles.actionBtn}>
        <Button disabled={!canConfirm} onPress={confirm} variant="primary">
          {labels.confirm}
        </Button>
      </View>
    </View>
  );
}

// ===========================================================================
// 1. VerticalRangeExample — `mode="range"`, range readout above the list.
// ===========================================================================

const SINGLE_GREGORIAN: CalendarSystem[] = [gregorianSystem];

export function VerticalRangeExample() {
  const [range, setRange] = useState<{ start?: Date; end?: Date }>({});
  const nights =
    range.start && range.end
      ? Math.max(
          1,
          Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000)
        )
      : 0;

  return (
    <Calendar.Root
      allowSameDay={false}
      maxRangeDays={14}
      minRangeDays={2}
      mode="range"
      onConfirm={({ startDate, endDate }) =>
        setRange({ start: startDate, end: endDate })
      }
      systems={SINGLE_GREGORIAN}
      theme={VERTICAL_THEME}
    >
      <VerticalCalendarShell
        title="Vertical · Date range"
        description="2–14 night stays. minRangeDays / maxRangeDays kick in when the second tap completes the range."
        readout={
          <View style={styles.rangeReadoutBar}>
            <RangeReadout date={range.start} label="Check-in" />
            <Text style={styles.rangeArrow}>→</Text>
            <RangeReadout date={range.end} label="Check-out" />
            <View style={styles.flex} />
            {nights > 0 && (
              <Badge tone="inverted">
                {nights} night{nights === 1 ? '' : 's'}
              </Badge>
            )}
          </View>
        }
        footer={<ActionBar />}
      />
    </Calendar.Root>
  );
}

function RangeReadout({ date, label }: { date?: Date; label: string }) {
  return (
    <View>
      <Text style={styles.rangeLabel}>{label}</Text>
      <Text style={styles.rangeValue}>{date ? date.toDateString() : '—'}</Text>
    </View>
  );
}

// ===========================================================================
// 2. VerticalMultipleExample — `mode="multiple"` + `maxSelected` +
//    `modifiers` (booked / holiday). Cells with modifiers carry coloured
//    dots beneath the day number.
// ===========================================================================

const BOOKED_DATES = nextNDates(2);
const HOLIDAYS = nextNDates(5).slice(3);

export function VerticalMultipleExample() {
  return (
    <Calendar.Root
      firstDayOfWeek={1}
      initialDates={[]}
      maxSelected={5}
      mode="multiple"
      modifiers={{
        booked: BOOKED_DATES,
        holiday: HOLIDAYS,
        weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
      }}
      systems={SINGLE_GREGORIAN}
      theme={VERTICAL_THEME}
    >
      <VerticalCalendarShell
        title="Vertical · Multi-select with modifiers"
        description="Pick up to 5 days. Booked days render with a dot; weekends are tagged via predicate."
        renderDay={(info) => <DotMarkedCell info={info} />}
        readout={<MultipleSelectionList />}
        footer={<ActionBar />}
      />
    </Calendar.Root>
  );
}

function DotMarkedCell({ info }: { info: DayCellInfo }) {
  const store = useCalendarStore();
  const isBooked = !!info.modifiers.booked;
  const isHoliday = !!info.modifiers.holiday;
  const isWeekend = !!info.modifiers.weekend;

  const onPress = () => store.selectDate(info.date);

  const cellStyle: ViewStyle = {
    backgroundColor: info.isSelected ? C.primary : 'transparent',
    borderColor: info.isToday ? C.foreground : 'transparent',
    borderWidth: info.isToday && !info.isSelected ? 1 : 0,
    opacity: info.isDisabled ? 0.4 : 1,
  };

  const textColor = info.isSelected
    ? C.primaryForeground
    : info.isCurrentMonth && !info.isDisabled
      ? isWeekend
        ? C.mutedForeground
        : C.foreground
      : C.disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: info.isSelected }}
      disabled={info.isDisabled}
      onPress={info.isDisabled ? undefined : onPress}
      style={[styles.dotCell, cellStyle]}
    >
      <Text style={[styles.dotCellLabel, { color: textColor }]}>
        {info.label}
      </Text>
      <View style={styles.dotRow}>
        {isBooked && <View style={styles.dotBooked} />}
        {isHoliday && <View style={styles.dotHoliday} />}
      </View>
    </Pressable>
  );
}

function MultipleSelectionList() {
  const dates = useCalendarSelectedDates<unknown>();
  const system = useCalendarSelector((s) => s.system);
  return (
    <View style={styles.tagBar}>
      {dates.length === 0 ? (
        <Text style={styles.empty}>Tap up to 5 days</Text>
      ) : (
        <View style={styles.tagRow}>
          {dates.map((d) => (
            <Badge key={String(system.toNativeDate(d as never))} tone="muted">
              {system.toNativeDate(d as never).toDateString()}
            </Badge>
          ))}
        </View>
      )}
    </View>
  );
}

// ===========================================================================
// 3. VerticalBoundedExample — `minDate` / `maxDate`, `disabledDates`,
//    `disabledRanges`, dynamic `disabled` predicate (weekends).
// ===========================================================================

export function VerticalBoundedExample() {
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const horizon = new Date(todayUtc + 60 * 86_400_000);

  return (
    <Calendar.Root
      disabled={(d) => d.getDay() === 0 || d.getDay() === 6}
      disabledDates={[
        new Date(today.getFullYear(), today.getMonth(), 15),
        new Date(today.getFullYear(), today.getMonth() + 1, 1),
      ]}
      disabledRanges={[
        {
          start: new Date(today.getFullYear(), today.getMonth(), 25),
          end: new Date(today.getFullYear(), today.getMonth(), 27),
        },
      ]}
      maxDate={horizon}
      minDate={today}
      mode="single"
      systems={SINGLE_GREGORIAN}
      theme={VERTICAL_THEME}
    >
      <VerticalCalendarShell
        title="Vertical · Bounded selection"
        description="minDate=today, maxDate=+60d. Weekends disabled via predicate. Two specific dates blacklisted."
        footer={
          <View style={styles.legendRow}>
            <Legend color={C.foreground} label="Today / selected" />
            <Legend color={C.muted} label="Weekend / OOO" />
            <Legend color={C.disabled} label="Out of bounds" />
          </View>
        }
      />
    </Calendar.Root>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// ===========================================================================
// 4. VerticalMultiMonthExample — the "multiple months" feature is
//    intrinsic to the vertical paradigm (every month sits below the
//    previous one), so this card showcases the *other* options the
//    standard MultiMonth example demonstrates: ISO week numbers,
//    Monday-first, collapsing weeks, and a custom MonthCaption slot.
// ===========================================================================

const VERTICAL_MONTH_CAPTION: NonNullable<
  CalendarComponents['MonthCaption']
> = ({ label }) => (
  <View style={styles.captionPill}>
    <Text style={styles.captionPillText}>{label}</Text>
  </View>
);

const VERTICAL_WEEK_NUMBER_CELL: NonNullable<
  CalendarComponents['WeekNumberCell']
> = ({ weekNumber }) => (
  <View style={styles.weekNumberCell}>
    <Text style={styles.weekNumberText}>{weekNumber}</Text>
  </View>
);

export function VerticalMultiMonthExample() {
  return (
    <Calendar.Root
      components={{
        MonthCaption: VERTICAL_MONTH_CAPTION,
        WeekNumberCell: VERTICAL_WEEK_NUMBER_CELL,
      }}
      firstDayOfWeek={1}
      fixedWeeks={false}
      mode="range"
      systems={SINGLE_GREGORIAN}
      theme={VERTICAL_THEME}
    >
      <VerticalCalendarShell
        title="Vertical · ISO week numbers"
        description="Monday-first, ISO week numbers, collapsing weeks. The vertical layout always suppresses outside days. The 'multi-month' aspect is intrinsic to the vertical layout."
        showWeekNumbers
        footer={<ActionBar />}
      />
    </Calendar.Root>
  );
}

// ===========================================================================
// 5. VerticalMultiSystemExample — Gregorian + Hijri + Jalali. The vertical
//    list rebuilds its window when the active system changes (handled
//    inside `VerticalMonthList` via the `lastSystemId` state tracker).
//
//    All three systems are batteries-included: `gregorianSystem` ships
//    zero-dep, `hijriSystem` auto-loads `@tabby_ai/hijri-converter`, and
//    `jalaliSystem` auto-loads `moment-jalaali`. Drop them into
//    `<Calendar.Root systems>` and the system switcher does the rest.
//
//    Need a different converter (custom Umm al-Qura tables, astronomical
//    Jalali, an Intl-based wrapper, …)? Use `createHijriSystem({ converter
//    })` / `createJalaliSystem({ converter })` instead — same module.
// ===========================================================================

const MULTI_SYSTEMS: CalendarSystem[] = [
  gregorianSystem,
  hijriSystem,
  jalaliSystem,
];

export function VerticalMultiSystemExample() {
  return (
    <Calendar.Root
      allowSameDay
      mode="range"
      systems={MULTI_SYSTEMS}
      theme={VERTICAL_THEME}
    >
      <VerticalCalendarShell
        title="Vertical · Gregorian + Hijri + Jalali"
        description="Same store, three calendar systems. Tap a pill above to swap month identities — the list rebuilds its window in lockstep, the selection survives the swap, and per-system month/weekday labels follow."
        headerExtras={<SystemSwitcher />}
        footer={<ActionBar />}
      />
    </Calendar.Root>
  );
}

function SystemSwitcher() {
  const { systems, activeId, setActive } = useCalendarSystemSwitcher();
  if (systems.length < 2) return null;
  return (
    <View style={styles.segmented}>
      {systems.map((s) => {
        const isActive = s.id === activeId;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={s.id}
            onPress={() => setActive(s.id)}
            style={({ pressed }) => [
              styles.segmentedItem,
              isActive && styles.segmentedItemActive,
              pressed && !isActive && styles.segmentedItemPressed,
            ]}
          >
            <Text
              style={[
                styles.segmentedItemLabel,
                isActive && styles.segmentedItemLabelActive,
              ]}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ===========================================================================
// 6. VerticalCustomSlotsExample — DayCell + WeekdayHeader + WeekNumberCell
//    overrides via `<Calendar.Root components>`. `MonthSection` honours
//    every slot, so the same generalised infra produces a totally
//    different look without touching the shell.
// ===========================================================================

const SquareDayCell: NonNullable<CalendarComponents['DayCell']> = ({
  info,
  onSelect,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: info.isSelected }}
    disabled={info.isDisabled}
    onPress={info.isDisabled ? undefined : () => onSelect(info.date)}
    style={[
      styles.squareCell,
      info.isToday && !info.isSelected && styles.squareCellToday,
      info.isSelected && styles.squareCellSelected,
      info.isDisabled && styles.squareCellDisabled,
    ]}
  >
    <Text
      style={[
        styles.squareCellLabel,
        info.isSelected && styles.squareCellLabelSelected,
        !info.isCurrentMonth && styles.squareCellLabelOutside,
      ]}
    >
      {info.label}
    </Text>
  </Pressable>
);

const BorderedWeekdayHeader: NonNullable<
  CalendarComponents['WeekdayHeader']
> = ({ labels }: WeekdayHeaderProps) => (
  <View style={styles.borderedWeekdayHeader}>
    {labels.map((l, i) => (
      <View
        key={`${l}-${i}`}
        style={[
          styles.borderedWeekdayCell,
          i < labels.length - 1 && styles.borderedWeekdayCellDivider,
        ]}
      >
        <Text style={styles.borderedWeekdayLabel}>{l.toUpperCase()}</Text>
      </View>
    ))}
  </View>
);

const ShoutyWeekNumberCell: NonNullable<
  CalendarComponents['WeekNumberCell']
> = ({ weekNumber }: WeekNumberCellProps) => (
  <View style={styles.shoutyWeekNumber}>
    <Text style={styles.shoutyWeekNumberText}>w{weekNumber}</Text>
  </View>
);

/**
 * Per-column weekday cell. Ignored when `WeekdayHeader` is also
 * provided (full-row override wins), but exported as a recipe for
 * projects that want to swap typography only.
 */
export const SubtleWeekdayCell: NonNullable<
  CalendarComponents['WeekdayCell']
> = ({ label }: WeekdayCellProps) => (
  <Text style={styles.subtleWeekday}>{label.slice(0, 1)}</Text>
);

export function VerticalCustomSlotsExample() {
  return (
    <Calendar.Root
      components={{
        DayCell: SquareDayCell,
        WeekdayHeader: BorderedWeekdayHeader,
        WeekNumberCell: ShoutyWeekNumberCell,
      }}
      mode="single"
      systems={SINGLE_GREGORIAN}
      theme={VERTICAL_THEME}
    >
      <VerticalCalendarShell
        title="Vertical · Custom component slots"
        description="WeekdayHeader, DayCell, and WeekNumberCell are all swapped via <Calendar.Root components={{ ... }}>."
        showWeekNumbers
      />
    </Calendar.Root>
  );
}

// ===========================================================================
// 7. VerticalLocalisedExample — French Gregorian + French labels.
// ===========================================================================

const FRENCH_SYSTEM = createGregorianSystem({
  label: 'Grégorien',
  monthLabels: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ],
  weekdayLabels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
});

const FRENCH_SYSTEMS: CalendarSystem[] = [FRENCH_SYSTEM];

export function VerticalLocalisedExample() {
  return (
    <Calendar.Root
      firstDayOfWeek={1}
      labels={{
        confirm: 'Valider',
        clear: 'Effacer',
        prev: 'Précédent',
        next: 'Suivant',
        selectMonth: 'Choisir le mois',
        selectYear: "Choisir l'année",
      }}
      mode="single"
      systems={FRENCH_SYSTEMS}
      theme={VERTICAL_THEME}
    >
      <VerticalCalendarShell
        title="Vertical · Localisé (Français)"
        description="createGregorianSystem avec libellés en français + semaine commençant le lundi + libellés d'action traduits."
        footer={<ActionBar />}
      />
    </Calendar.Root>
  );
}

// ===========================================================================
// 8. VerticalImageCellExample — `renderDay` swaps the day number for an
//    image on specific dates. Selection still works because the consumer
//    reads `info.isSelected / isToday / isDisabled` and dispatches
//    `store.selectDate(info.date)` themselves.
// ===========================================================================

const YT_LOGO_URI =
  'https://img.freepik.com/premium-vector/youtube-logo-round-button-vector_768467-361.jpg';

const UPLOAD_DAYS: Date[] = (() => {
  const today = new Date();
  return [0, 3, 7, 12, 18, 24, 30].map(
    (d) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + d)
  );
})();

const isUploadDay = (info: DayCellInfo): boolean =>
  UPLOAD_DAYS.some(
    (d) =>
      d.getFullYear() === info.nativeDate.getFullYear() &&
      d.getMonth() === info.nativeDate.getMonth() &&
      d.getDate() === info.nativeDate.getDate()
  );

function ImageDayCell({ info }: { info: DayCellInfo }) {
  const store = useCalendarStore();
  const onPress = () => store.selectDate(info.date);
  const showLogo = info.isCurrentMonth && isUploadDay(info);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: info.isDisabled,
        selected: info.isSelected,
      }}
      disabled={info.isDisabled}
      onPress={info.isDisabled ? undefined : onPress}
      style={[
        styles.imageCell,
        info.isToday && !info.isSelected && styles.imageCellToday,
        info.isSelected && styles.imageCellSelected,
        info.isDisabled && styles.imageCellDisabled,
      ]}
    >
      {showLogo ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: YT_LOGO_URI }}
          style={styles.imageCellLogo}
        />
      ) : (
        <Text
          style={[
            styles.imageCellLabel,
            info.isSelected && styles.imageCellLabelSelected,
            !info.isCurrentMonth && styles.imageCellLabelOutside,
          ]}
        >
          {info.label}
        </Text>
      )}
    </Pressable>
  );
}

export function VerticalImageCellExample() {
  return (
    <Calendar.Root
      mode="single"
      systems={SINGLE_GREGORIAN}
      theme={VERTICAL_THEME}
    >
      <VerticalCalendarShell
        title="Vertical · Image cells"
        description="renderDay swaps the day number for any RN node. Video-upload days show a YouTube logo while still being selectable."
        renderDay={(info) => <ImageDayCell info={info} />}
        footer={
          <View style={styles.imageLegendRow}>
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: YT_LOGO_URI }}
              style={styles.imageLegendDot}
            />
            <Text style={styles.legendLabel}>Video upload day</Text>
          </View>
        }
      />
    </Calendar.Root>
  );
}

// ---------------------------------------------------------------------------
// Helpers — local to this file.
// ---------------------------------------------------------------------------

function nextNDates(n: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= n; i += 1) {
    out.push(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + i * 2)
    );
  }
  return out;
}

// ---------------------------------------------------------------------------
// Styles — single StyleSheet.
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  shellContainer: {
    flex: 1,
    backgroundColor: C.background,
  },
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
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
  weekdayHeaderInner: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    alignSelf: 'center',
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
  },
  spacerCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },

  weekRow: {
    flexDirection: 'row',
  },
  weekNumberCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNumberText: {
    color: C.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Range readout (example #1)
  rangeReadoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: C.muted,
  },
  rangeArrow: {
    color: C.mutedForeground,
    fontSize: 16,
  },
  rangeLabel: {
    color: C.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rangeValue: {
    color: C.foreground,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  flex: { flex: 1 },

  // Multi-select dot cell (example #2)
  dotCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dotCellLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    minHeight: 4,
  },
  dotBooked: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.foreground,
  },
  dotHoliday: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderStrong,
  },

  tagBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: C.muted,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  empty: {
    color: C.mutedForeground,
    fontSize: 12,
  },

  // Bounded legend (example #3)
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    color: C.mutedForeground,
    fontSize: 12,
  },

  // Multi-month / week-numbers (example #4) — caption pill
  captionPill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginVertical: 8,
    borderRadius: 999,
    backgroundColor: C.muted,
  },
  captionPillText: {
    color: C.foreground,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Multi-system switcher (example #5)
  segmented: {
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 4,
    borderRadius: 8,
    backgroundColor: C.muted,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  segmentedItem: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentedItemActive: {
    backgroundColor: C.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentedItemPressed: {
    opacity: 0.6,
  },
  segmentedItemLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: C.mutedForeground,
  },
  segmentedItemLabelActive: {
    color: C.foreground,
    fontWeight: '600',
  },

  // Custom slots (example #6) — square cell
  squareCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  squareCellToday: {
    borderColor: C.foreground,
    borderWidth: 1,
  },
  squareCellSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  squareCellDisabled: {
    opacity: 0.4,
  },
  squareCellLabel: {
    fontSize: 14,
    color: C.foreground,
    fontVariant: ['tabular-nums'],
  },
  squareCellLabelSelected: {
    color: C.primaryForeground,
    fontWeight: '600',
  },
  squareCellLabelOutside: {
    color: C.disabled,
  },

  // Custom slots (example #6) — bordered weekday header
  borderedWeekdayHeader: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  borderedWeekdayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderedWeekdayCellDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  borderedWeekdayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.foreground,
    letterSpacing: 0.6,
  },

  shoutyWeekNumber: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.muted,
    borderRadius: 0,
  },
  shoutyWeekNumberText: {
    color: C.foreground,
    fontWeight: '700',
    fontSize: 11,
  },

  subtleWeekday: {
    width: CELL_SIZE,
    textAlign: 'center',
    color: C.mutedForeground,
    fontSize: 12,
  },

  // Image cell (example #8)
  imageCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  imageCellToday: {
    borderWidth: 1,
    borderColor: C.foreground,
  },
  imageCellSelected: {
    backgroundColor: C.primary,
  },
  imageCellDisabled: {
    opacity: 0.4,
  },
  imageCellLabel: {
    fontSize: 14,
    color: C.foreground,
    fontVariant: ['tabular-nums'],
  },
  imageCellLabelSelected: {
    color: C.primaryForeground,
    fontWeight: '600',
  },
  imageCellLabelOutside: {
    color: C.disabled,
  },
  imageCellLogo: {
    width: CELL_SIZE - 8,
    height: CELL_SIZE - 8,
    borderRadius: (CELL_SIZE - 8) / 2,
  },
  imageLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  imageLegendDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  // Action bar (shared)
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
  },
  actionBtn: {
    flex: 1,
  },

  // Button atom
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: C.primary,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primaryForeground,
    textAlign: I18nManager.isRTL ? 'right' : 'center',
  },
  btnLabelOutline: {
    color: C.foreground,
  },

  // Badge atom
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: C.muted,
  },
  badgeMuted: {
    backgroundColor: C.muted,
  },
  badgeInverted: {
    backgroundColor: C.primary,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.foreground,
  },
  badgeLabelInverted: {
    color: C.primaryForeground,
  },
});
