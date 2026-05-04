# Vertical Calendar — Infinite iOS-Style Month List

Endless scrollable list of months, one row per month, sharing selection with the rest of the app via the `<Calendar.Root>` store. Built on `@legendapp/list` for windowing + recycling.

The library does **not** ship a vertical month list. `<Calendar.DayGrid>` always renders the store's currently *displayed* month. To render arbitrary months you compose the **building blocks** (`buildMonthGrid`, `<DayCell>`, the `useCalendar*` hooks) yourself.

## Table of contents

- [Setup](#setup)
- [Architecture](#architecture)
- [The minimal recipe](#the-minimal-recipe)
- [Generalised `MonthSection` (mode-aware, slot-aware)](#generalised-monthsection-mode-aware-slot-aware)
- [Layered variants](#layered-variants) — Range, Multiple, Bounded, ISO weeks, Multi-system, Custom slots, Localised, Image cells
- [Common pitfalls](#common-pitfalls)
- [Stylesheet](#stylesheet)

## Setup

Peer dependency:

```bash
npm install @legendapp/list
```

`@legendapp/list` is listed as an *optional* peer dependency on `react-native-fast-calendar` — install it explicitly if you're using this recipe.

## Architecture

The vertical list has four layers, top to bottom:

1. **`ReadoutBar`** (optional) — selected date readout + "Today" jump button.
2. **`WeekdayHeaderRow`** (sticky) — column headers, stay mounted so they don't repeat per month.
3. **`VerticalMonthList`** — the `LegendList`. Mounts `<MonthSection>` for each month in a sliding window.
4. **`MonthSection`** (per row) — one month's caption + 7-column day grid.

The data window slides:
- Initial size: `WINDOW_RADIUS = 6` months on each side of `displayed` → 13 months.
- `onStartReached` / `onEndReached` extend the window by `WINDOW_GROWTH = 6` more months.
- A swap of the active calendar system (Gregorian → Hijri) rebuilds the window from scratch.

`MonthSection` uses a **two-layer memo**:
- **Layer 1** — keyed on `year + month` primitives → `buildMonthGrid` (42 cells).
- **Layer 2** — keyed on selection state → overlays `isSelected`, `isToday`, `isDisabled`, modifier flags. Reuses Layer 1's `date` refs so `<DayCell>`'s field-level memo correctly skips unchanged cells.

`recycleItems` + `maintainVisibleContentPosition` on `LegendList` mean the mounted `<MonthSection>` count is bounded to the viewport + draw distance, even if the user scrolls through years.

## The minimal recipe

Single-mode, no modifiers, no week numbers, no slots. Use this when the user wants the basic iOS-Calendar look. For richer features, jump to [the generalised recipe](#generalised-monthsection-mode-aware-slot-aware) below.

```tsx
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  LegendList,
  type LegendListRef,
  type LegendListRenderItemProps,
} from '@legendapp/list';
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

const CELL_SIZE = 44;
const WINDOW_RADIUS = 6;        // months either side of `displayed`
const WINDOW_GROWTH = 6;        // grow by this much when an edge is hit
const DRAW_DISTANCE = 250;      // off-screen pixels to keep mounted
const EXTRA_DATA = { recycleState: true } as const;

const VERTICAL_THEME: CalendarThemeOverride = {
  colors: {
    background: '#FFFFFF',
    primary:    '#0A0A0A',
    onPrimary:  '#FAFAFA',
    text:       '#0A0A0A',
    textMuted:  '#71717A',
    todayBorder:'#1F6FEB',
    rangeBackground: '#F4F4F5',
    border:     '#E4E4E7',
  },
  cellSize: CELL_SIZE,
  borderRadius: 8,
  fontSize: { day: 15, weekday: 12, header: 16 },
};

const buildMonthsAround = (
  system: CalendarSystem,
  center: CalendarDateValue,
  radius: number,
): CalendarDateValue[] => {
  const out = new Array<CalendarDateValue>(radius * 2 + 1);
  for (let i = -radius; i <= radius; i += 1) out[i + radius] = system.addMonths(center, i);
  return out;
};

const isSameDisplayMonth = (
  system: CalendarSystem,
  a: CalendarDateValue,
  b: CalendarDateValue,
): boolean => system.year(a) === system.year(b) && system.month(a) === system.month(b);

// ---------------------------------------------------------------------------
// MonthSection — one month, two-layer memo. Mirrors the library's internal
// MonthGrid so DayCell's field-level memo can skip unchanged cells.
// ---------------------------------------------------------------------------

function MonthSectionImpl({ month }: { month: CalendarDateValue }) {
  const store = useCalendarStore();
  const { firstDayOfWeek, fixedWeeks } = useCalendarConfig();
  const system        = useCalendarSelector((s) => s.system);
  const selectedDate  = useCalendarSelector((s) => s.selectedDate);
  const minDate       = useCalendarSelector((s) => s.minDate);
  const maxDate       = useCalendarSelector((s) => s.maxDate);
  const disabledDates = useCalendarSelector((s) => s.disabledDates);
  const disabledRanges= useCalendarSelector((s) => s.disabledRanges);
  const disabledPredicate = useCalendarSelector((s) => s.disabled);

  // Layer 1 — keyed on year+month primitives so a different month object
  // identity (parent rebuilt the window) doesn't invalidate the cache.
  const monthYear = system.year(month);
  const monthIdx  = system.month(month);
  const cells = useMemo(
    () => buildMonthGrid(system, month, firstDayOfWeek),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [system, monthYear, monthIdx, firstDayOfWeek],
  );

  // Layer 2 — overlay flags, reusing Layer 1's date refs.
  const cellInfos = useMemo<DayCellInfo[]>(() => {
    const today = system.today();
    return cells.map((c) => {
      const nativeDate = system.toNativeDate(c.date);
      const isSelected = !!selectedDate && system.isSame(c.date, selectedDate);
      let isDisabled =
        (!!minDate && system.isBefore(c.date, minDate)) ||
        (!!maxDate && system.isAfter(c.date, maxDate))  ||
        isExplicitlyDisabled(system, c.date, disabledDates, disabledRanges);
      if (!isDisabled && disabledPredicate) {
        try { if (disabledPredicate(nativeDate)) isDisabled = true; } catch {}
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
  }, [cells, system, selectedDate, minDate, maxDate, disabledDates, disabledRanges, disabledPredicate]);

  const onSelect = useCallback(
    (date: CalendarDateValue) => store.selectDate(date),
    [store],
  );

  // Trim trailing all-outside rows when fixedWeeks is off so each month
  // takes its natural height (4 / 5 / 6 weeks).
  const visibleRows = fixedWeeks ? ROWS : usedRows(cells);
  const visibleCellCount = visibleRows * COLS;

  return (
    <View style={s.monthSection}>
      <Text style={s.monthHeader}>{system.formatMonthYear(month)}</Text>
      <View style={s.monthGrid}>
        {cellInfos.slice(0, visibleCellCount).map((info, idx) =>
          // Outside-month cells are blank spacers in the vertical layout
          // regardless of `showOutsideDays`. Adjacent months stack
          // directly above one another, so a greyed "May 30" tail on
          // June would duplicate May's last cell — exactly the "is that
          // May 30 or June 1?" confusion the iOS Calendar avoids.
          info.isCurrentMonth ? (
            <DayCell info={info} key={idx} onSelect={onSelect} />
          ) : (
            <View key={idx} style={s.spacerCell} />
          ),
        )}
      </View>
    </View>
  );
}

const MonthSection = memo(MonthSectionImpl);

// ---------------------------------------------------------------------------
// WeekdayHeaderRow — sticky, stays mounted.
// ---------------------------------------------------------------------------

function WeekdayHeaderRow() {
  const labels = useCalendarWeekdayLabels();
  return (
    <View style={s.weekdayRow}>
      {labels.map((l, i) => (
        <Text key={`${l}-${i}`} style={s.weekdayLabel}>
          {l.slice(0, 3)}
        </Text>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// VerticalMonthList — sliding window + bidirectional growth.
// ---------------------------------------------------------------------------

interface VerticalMonthListHandle {
  scrollToMonth: (date: CalendarDateValue) => void;
}

const VerticalMonthList = forwardRef<VerticalMonthListHandle>(
  function VerticalMonthList(_, ref) {
    const system = useCalendarSelector((s) => s.system);
    const displayed = useCalendarSelector((s) => s.displayed);
    const listRef = useRef<LegendListRef>(null);

    const [months, setMonths] = useState<readonly CalendarDateValue[]>(() =>
      buildMonthsAround(system, displayed, WINDOW_RADIUS),
    );

    const recentreOn = useCallback(
      (target: CalendarDateValue) => {
        setMonths(buildMonthsAround(system, target, WINDOW_RADIUS));
        // Wait one frame so the new array is committed before scrolling.
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: WINDOW_RADIUS, animated: false });
        });
      },
      [system],
    );

    // Re-centre when `displayed` lands outside the window (e.g. external
    // store mutation). Taps inside the window are no-ops here — the
    // imperative handle owns in-window scroll-to-month.
    useEffect(() => {
      const idx = months.findIndex((m) => isSameDisplayMonth(system, m, displayed));
      if (idx === -1) recentreOn(displayed);
    }, [displayed, months, system, recentreOn]);

    useImperativeHandle(
      ref,
      () => ({
        scrollToMonth: (target) => {
          const idx = months.findIndex((m) => isSameDisplayMonth(system, m, target));
          if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true });
          else recentreOn(target);
        },
      }),
      [months, system, recentreOn],
    );

    const onStartReached = useCallback(
      ({ distanceFromStart }: { distanceFromStart: number }) => {
        if (distanceFromStart <= 0) return;
        setMonths((prev) => {
          const first = prev[0]!;
          const before = new Array<CalendarDateValue>(WINDOW_GROWTH);
          for (let i = 0; i < WINDOW_GROWTH; i += 1) {
            before[i] = system.addMonths(first, i - WINDOW_GROWTH);
          }
          return [...before, ...prev];
        });
      },
      [system],
    );

    const onEndReached = useCallback(
      ({ distanceFromEnd }: { distanceFromEnd: number }) => {
        if (distanceFromEnd <= 0) return;
        setMonths((prev) => {
          const last = prev[prev.length - 1]!;
          const after = new Array<CalendarDateValue>(WINDOW_GROWTH);
          for (let i = 0; i < WINDOW_GROWTH; i += 1) {
            after[i] = system.addMonths(last, i + 1);
          }
          return [...prev, ...after];
        });
      },
      [system],
    );

    const keyExtractor = useCallback(
      (item: CalendarDateValue) => `${system.id}:${system.year(item)}-${system.month(item)}`,
      [system],
    );

    const renderItem = useCallback(
      ({ item }: LegendListRenderItemProps<CalendarDateValue>) => <MonthSection month={item} />,
      [],
    );

    // Header (32) + 6 rows × CELL_SIZE + section padding. Doesn't have to
    // be exact — LegendList recovers from misestimates — but a close
    // figure means the initial scroll position is right on first paint.
    const estimatedItemSize = 56 + CELL_SIZE * ROWS;

    return (
      <LegendList<CalendarDateValue>
        data={months}
        drawDistance={DRAW_DISTANCE}
        estimatedItemSize={estimatedItemSize}
        extraData={EXTRA_DATA}
        initialScrollIndex={WINDOW_RADIUS}
        keyExtractor={keyExtractor}
        maintainVisibleContentPosition
        onEndReached={onEndReached}
        onStartReached={onStartReached}
        // Cast: under react-native-strict-api, ScrollView's `ref` and
        // LegendList's `RefAttributes<LegendListRef>` intersect into an
        // un-satisfiable type. The runtime contract is fine.
        ref={listRef as never}
        recycleItems
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />
    );
  },
);

// ---------------------------------------------------------------------------
// Top-level screen.
// ---------------------------------------------------------------------------

export default function VerticalCalendarScreen() {
  const monthListRef = useRef<VerticalMonthListHandle>(null);
  const handleJumpTo = useCallback((target: CalendarDateValue) => {
    monthListRef.current?.scrollToMonth(target);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Calendar.Root mode="single" fixedWeeks={false} systems={[gregorianSystem]} theme={VERTICAL_THEME}>
        <ReadoutBar onJumpTo={handleJumpTo} />
        <View style={s.weekdayHeaderWrapper}><WeekdayHeaderRow /></View>
        <VerticalMonthList ref={monthListRef} />
      </Calendar.Root>
    </View>
  );
}

function ReadoutBar({ onJumpTo }: { onJumpTo: (d: CalendarDateValue) => void }) {
  const store = useCalendarStore();
  const selectedDate = useCalendarSelector((s) => s.selectedDate);
  const system = useCalendarSelector((s) => s.system);
  const native = selectedDate ? system.toNativeDate(selectedDate) : null;

  const onJumpToday = () => {
    const today = system.today();
    store.selectDate(today);
    onJumpTo(today);             // imperative scroll — `displayed`-watching effect
                                 // wouldn't fire when `displayed` already points
                                 // at today's month.
  };

  return (
    <View style={s.readoutBar}>
      <View style={{ flex: 1 }}>
        <Text style={s.readoutLabel}>SELECTED</Text>
        <Text style={s.readoutValue}>{native ? native.toDateString() : 'Tap a day to select'}</Text>
      </View>
      <Pressable onPress={onJumpToday} style={s.todayButton}>
        <Text style={{ color: '#FFF', fontWeight: '600' }}>Today</Text>
      </Pressable>
    </View>
  );
}
```

## Generalised `MonthSection` (mode-aware, slot-aware)

The minimal recipe handles single-mode only. For range / multiple modes, modifier dots, custom slots, week numbers, or per-instance `renderDay`, generalise `MonthSection` to mirror the library's own `MonthGrid`. Drop this in place of `MonthSectionImpl` above.

```tsx
import {
  isBetween,
  matchDate,
  isoWeekNumber,
  useCalendarComponents,
  type CalendarComponents,
  type DayRenderer,
  type MonthCaptionProps,
} from 'react-native-fast-calendar';

interface MonthSectionProps {
  month: CalendarDateValue;
  renderDay?: DayRenderer;        // takes precedence over components.DayCell
  showWeekNumbers?: boolean;
}

function MonthSectionImpl({ month, renderDay, showWeekNumbers }: MonthSectionProps) {
  const store = useCalendarStore();
  const { firstDayOfWeek, fixedWeeks, modifiers } = useCalendarConfig();
  const components = useCalendarComponents();

  const system        = useCalendarSelector((s) => s.system);
  const mode          = useCalendarSelector((s) => s.mode);
  const selectedDate  = useCalendarSelector((s) => s.selectedDate);
  const selectedDates = useCalendarSelector((s) => s.selectedDates);
  const rangeStart    = useCalendarSelector((s) => s.rangeStart);
  const rangeEnd      = useCalendarSelector((s) => s.rangeEnd);
  const minDate       = useCalendarSelector((s) => s.minDate);
  const maxDate       = useCalendarSelector((s) => s.maxDate);
  const disabledDates = useCalendarSelector((s) => s.disabledDates);
  const disabledRanges= useCalendarSelector((s) => s.disabledRanges);
  const disabledPredicate = useCalendarSelector((s) => s.disabled);

  const monthYear = system.year(month);
  const monthIdx  = system.month(month);
  const cells = useMemo(
    () => buildMonthGrid(system, month, firstDayOfWeek),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [system, monthYear, monthIdx, firstDayOfWeek],
  );

  const cellInfos = useMemo<DayCellInfo[]>(() => {
    const today = system.today();
    const modifierEntries = modifiers ? Object.entries(modifiers) : null;
    return cells.map((c) => {
      const isStart = !!rangeStart && system.isSame(c.date, rangeStart);
      const isEnd   = !!rangeEnd   && system.isSame(c.date, rangeEnd);
      const isSingle = mode === 'single' && !!selectedDate && system.isSame(c.date, selectedDate);
      const isMulti  = mode === 'multiple' && selectedDates.some((d) => system.isSame(d, c.date));
      const inRange  = mode === 'range' && isBetween(system, c.date, rangeStart, rangeEnd);
      const nativeDate = system.toNativeDate(c.date);
      let isDisabled =
        (!!minDate && system.isBefore(c.date, minDate)) ||
        (!!maxDate && system.isAfter(c.date, maxDate))  ||
        isExplicitlyDisabled(system, c.date, disabledDates, disabledRanges);
      if (!isDisabled && disabledPredicate) {
        try { if (disabledPredicate(nativeDate)) isDisabled = true; } catch {}
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
  }, [cells, system, mode, selectedDate, selectedDates, rangeStart, rangeEnd,
      minDate, maxDate, disabledDates, disabledRanges, disabledPredicate, modifiers]);

  const onSelect = useCallback(
    (date: CalendarDateValue) => store.selectDate(date),
    [store],
  );

  const visibleRows = fixedWeeks ? ROWS : usedRows(cells);
  const visibleCellCount = visibleRows * COLS;

  // Optional ISO week numbers — pick the Thursday cell of each row as the
  // canonical week-day-in-the-week regardless of where the row starts.
  const weekNumbers = useMemo<readonly number[] | null>(() => {
    if (!showWeekNumbers) return null;
    const thursdayCol = (4 - firstDayOfWeek + 7) % 7;
    const out = new Array<number>(visibleRows);
    for (let r = 0; r < visibleRows; r += 1) {
      const cell = cells[r * COLS + thursdayCol];
      out[r] = cell
        ? (system.weekNumber ? system.weekNumber(cell.date as never)
                              : isoWeekNumber(system.toNativeDate(cell.date)))
        : 0;
    }
    return out;
  }, [showWeekNumbers, visibleRows, cells, system, firstDayOfWeek]);

  // Slot precedence: renderDay > components.DayCell > built-in <DayCell>.
  const Caption          = components.MonthCaption;
  const SlotDayCell      = components.DayCell;
  const SlotWeekNumberCell = components.WeekNumberCell;

  const captionProps: MonthCaptionProps | null = Caption
    ? {
        date: month,
        monthIndex: system.month(month),
        year: system.year(month),
        label: system.formatMonthYear(month),
      }
    : null;

  const sectionWidth = CELL_SIZE * (showWeekNumbers ? COLS + 1 : COLS);

  const renderCell = (info: DayCellInfo, idx: number) => {
    if (!info.isCurrentMonth) return <View key={idx} style={s.spacerCell} />;
    if (renderDay) return <View key={idx}>{renderDay(info)}</View>;
    if (SlotDayCell) return <SlotDayCell info={info} key={idx} onSelect={onSelect} />;
    return <DayCell info={info} key={idx} onSelect={onSelect} />;
  };

  return (
    <View style={[s.monthSection, { width: sectionWidth }]}>
      {Caption && captionProps
        ? <Caption {...captionProps} />
        : <Text style={s.monthHeader}>{system.formatMonthYear(month)}</Text>}

      {weekNumbers ? (
        <View style={{ width: sectionWidth }}>
          {weekNumbers.map((wn, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row' }}>
              {SlotWeekNumberCell
                ? <SlotWeekNumberCell weekNumber={wn} />
                : <View style={s.weekNumberCell}><Text style={s.weekNumberText}>{wn}</Text></View>}
              {cellInfos
                .slice(rowIdx * COLS, rowIdx * COLS + COLS)
                .map((info, colIdx) => renderCell(info, rowIdx * COLS + colIdx))}
            </View>
          ))}
        </View>
      ) : (
        <View style={[s.monthGrid, { width: sectionWidth }]}>
          {cellInfos.slice(0, visibleCellCount).map(renderCell)}
        </View>
      )}
    </View>
  );
}
```

Pair this generalised `MonthSection` with a `WeekdayHeaderRow` that respects the same slot map:

```tsx
function WeekdayHeaderRow({ showWeekNumbers }: { showWeekNumbers?: boolean }) {
  const labels = useCalendarWeekdayLabels();
  const components = useCalendarComponents();

  if (components.WeekdayHeader) {
    const Slot = components.WeekdayHeader;
    return (
      <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
        {showWeekNumbers && <View style={s.weekNumberCell} />}
        <Slot labels={labels} />
      </View>
    );
  }

  const Cell = components.WeekdayCell;
  return (
    <View
      style={[
        s.weekdayRow,
        { width: CELL_SIZE * (showWeekNumbers ? COLS + 1 : COLS) },
      ]}
    >
      {showWeekNumbers && <View style={s.weekNumberCell} />}
      {labels.map((l, i) =>
        Cell
          ? <Cell index={i} key={`${l}-${i}`} label={l} />
          : <Text key={`${l}-${i}`} style={s.weekdayLabel}>{l.slice(0, 3)}</Text>,
      )}
    </View>
  );
}
```

And extend `VerticalMonthList` with `renderDay` / `showWeekNumbers` props that flow down to each `<MonthSection>`. The rest of the list logic (windowing, growth, recentre) stays identical.

## System-swap handling (for multi-system variants)

When the active system swaps mid-session, the `month` objects in `months` belong to the previous system. Reading them with the new system would crash inside the converter. Detect the swap **synchronously during render** — a post-commit `useEffect` is too late, the discarded render would already feed mismatched data into children.

```tsx
const lastSystemId = useRef(system.id);
let activeMonths = months;
if (lastSystemId.current !== system.id) {
  lastSystemId.current = system.id;
  activeMonths = buildMonthsAround(system, displayed, WINDOW_RADIUS);
  setMonths(activeMonths);
}
```

Use `activeMonths` (not `months`) everywhere downstream in that render pass. This pattern is required for the **Multi-system variant** below.

## Layered variants

Each variant below is the recipe above with one or two props changed and an optional cell renderer / shell. The common `VerticalCalendarShell` wrapper folds the boilerplate (`Calendar.Root` + `ReadoutBar` + sticky weekday row + list).

```tsx
function VerticalCalendarShell({
  title,
  description,
  headerExtras,
  readout,
  footer,
  renderDay,
  showWeekNumbers,
}: {
  title: string;
  description: string;
  headerExtras?: React.ReactNode;
  readout?: React.ReactNode;
  footer?: React.ReactNode;
  renderDay?: DayRenderer;
  showWeekNumbers?: boolean;
}) {
  const monthListRef = useRef<VerticalMonthListHandle>(null);
  const store = useCalendarStore();
  const system = useCalendarSelector((s) => s.system);

  const onJumpToday = useCallback(() => {
    const today = system.today();
    store.selectDate(today);
    monthListRef.current?.scrollToMonth(today);
  }, [store, system]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={s.headerBlock}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.subtitle}>{description}</Text>
        </View>
        <Pressable onPress={onJumpToday} style={s.todayButton}>
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Today</Text>
        </Pressable>
      </View>
      {headerExtras}
      {readout}
      <View style={s.weekdayHeaderWrapper}>
        <WeekdayHeaderRow showWeekNumbers={showWeekNumbers} />
      </View>
      <VerticalMonthList ref={monthListRef} renderDay={renderDay} showWeekNumbers={showWeekNumbers} />
      {footer}
    </View>
  );
}
```

### Variant 1 — Range

```tsx
<Calendar.Root
  mode="range"
  allowSameDay={false}
  minRangeDays={2}
  maxRangeDays={14}
  systems={[gregorianSystem]}
  theme={VERTICAL_THEME}
  onConfirm={({ startDate, endDate }) => setRange({ start: startDate, end: endDate })}
>
  <VerticalCalendarShell
    title="Vertical · Date range"
    description="2-14 night stays."
    readout={<RangeReadoutBar range={range} />}
    footer={<ActionBar />}
  />
</Calendar.Root>
```

### Variant 2 — Multi-select with modifiers

```tsx
<Calendar.Root
  mode="multiple"
  maxSelected={5}
  firstDayOfWeek={1}
  modifiers={{
    booked: BOOKED_DATES,
    holiday: HOLIDAYS,
    weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
  }}
  systems={[gregorianSystem]}
  theme={VERTICAL_THEME}
>
  <VerticalCalendarShell
    title="Vertical · Multi-select with modifiers"
    description="Pick up to 5 days."
    renderDay={(info) => <DotMarkedCell info={info} />}
    readout={<SelectedTagList />}
    footer={<ActionBar />}
  />
</Calendar.Root>
```

`DotMarkedCell` is identical to the grid recipe §3 — the cell doesn't know whether it's inside a single-page grid or a vertical list.

### Variant 3 — Bounded selection

Same `Calendar.Root` props as grid recipe §4 (`minDate`, `maxDate`, `disabledDates`, `disabledRanges`, `disabled`). The vertical shell renders a `<Legend>` row in the `footer` slot.

### Variant 4 — Multi-month + ISO week numbers

The "multi-month" aspect is intrinsic to the vertical paradigm (every month sits below the previous one), so this variant focuses on the *other* multi-month options: ISO week numbers, Monday-first weeks, collapsing weeks, custom `MonthCaption`. The vertical layout always suppresses outside days regardless of `showOutsideDays` — see [common pitfalls](#common-pitfalls) for the rationale.

```tsx
<Calendar.Root
  mode="range"
  firstDayOfWeek={1}
  fixedWeeks={false}
  components={{
    MonthCaption: VERTICAL_MONTH_CAPTION,
    WeekNumberCell: VERTICAL_WEEK_NUMBER_CELL,
  }}
  systems={[gregorianSystem]}
  theme={VERTICAL_THEME}
>
  <VerticalCalendarShell
    title="Vertical · ISO week numbers"
    description="Monday-first, ISO weeks, collapsing rows."
    showWeekNumbers
    footer={<ActionBar />}
  />
</Calendar.Root>
```

### Variant 5 — Multi-system (Gregorian + Hijri + Jalali)

Pre-configured systems — install the optional peer deps (`@tabby_ai/hijri-converter`, `moment-jalaali`) and drop them in. Use `createHijriSystem({ converter })` / `createJalaliSystem({ converter })` from the same module if you need a custom converter or different labels.

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';
import { jalaliSystem } from 'react-native-fast-calendar/systems/jalali';

const SYSTEMS: CalendarSystem[] = [
  gregorianSystem,
  hijriSystem,
  jalaliSystem,
];

<Calendar.Root mode="range" allowSameDay systems={SYSTEMS} theme={VERTICAL_THEME}>
  <VerticalCalendarShell
    title="Vertical · Gregorian + Hijri + Jalali"
    description="Same store, three systems."
    headerExtras={<SystemSwitcher />}
    footer={<ActionBar />}
  />
</Calendar.Root>
```

Required: the synchronous **system-swap detection** described above must be in `VerticalMonthList`. Without it the list flashes blank or crashes when the user toggles systems.

### Variant 6 — Custom slots

Identical to grid recipe §7 — pass `components={{ DayCell, WeekdayHeader, WeekNumberCell }}` to `<Calendar.Root>`. The generalised `MonthSection` and `WeekdayHeaderRow` already honour every slot.

### Variant 7 — Localised (any language)

Same `createGregorianSystem(...)` recipe as grid §8. Pass the localised system + `labels`. The vertical shell already pulls weekday labels from `useCalendarWeekdayLabels()` (rotated for `firstDayOfWeek`), so localising the system localises the column headers automatically.

### Variant 8 — Image cells

Same as grid recipe §9, plumbed through `renderDay`:

```tsx
<VerticalCalendarShell
  title="Vertical · Image cells"
  description="Video upload days show a logo."
  renderDay={(info) => <ImageDayCell info={info} />}
/>
```

## Common pitfalls

- **List flashes blank on system swap.** Add the synchronous `lastSystemId` ref check shown above. Don't try to wipe the list in `useEffect` — that fires after children have already rendered with mismatched data.
- **Outside-month days re-rendered as greyed cells.** The vertical layout always renders them as blank spacers regardless of `showOutsideDays`. Adjacent months stack above one another in the scroll, so a greyed "May 30" tail on June would duplicate May's last cell — exactly the "is that May 30 or June 1?" confusion the iOS Calendar avoids by suppressing outside days entirely.
- **Today button doesn't scroll.** `displayed`-watching effects only fire on reference change. If the user has scrolled away visually but `displayed` already points to today's month, calling `selectDate(today)` won't trigger a scroll. Use the imperative ref pattern (`scrollToMonth`).
- **Janky scrolling after a long jump.** Keep `drawDistance` small (~250 px). LegendList's "accurate-scrollto-huge" recipe shows that a small fixed value gives precise landings while `recycleItems` + `maintainVisibleContentPosition` bound the mounted count.
- **`extraData` instability.** Pass a module-scoped `EXTRA_DATA = { recycleState: true } as const`. Inline `extraData={{ ... }}` creates fresh references on every parent re-render and forces every container's `getRenderedItem` memo to invalidate.
- **`firstDayOfWeek` is wrong on first paint.** `useCalendarWeekdayLabels()` is pre-rotated; just trust it. Hand-coding `['Sun', 'Mon', …]` and switching on `firstDayOfWeek` yourself will desync the header from the grid.

## Stylesheet

```tsx
const s = StyleSheet.create({
  headerBlock: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  title:    { fontSize: 22, fontWeight: '700', color: '#0A0A0A', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: '#71717A', marginTop: 4, lineHeight: 18 },

  readoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#F4F4F5',
  },
  readoutLabel: { color: '#71717A', fontSize: 11, fontWeight: '600', letterSpacing: 0.6 },
  readoutValue: { color: '#0A0A0A', fontSize: 14, fontWeight: '500', marginTop: 2 },
  todayButton:  { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, backgroundColor: '#0A0A0A' },

  weekdayHeaderWrapper: {
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  weekdayRow:   { flexDirection: 'row', alignSelf: 'center' },
  weekdayLabel: {
    width: 44,                       // == CELL_SIZE
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  monthSection: { alignSelf: 'center', paddingTop: 8, paddingBottom: 8, width: 44 * 7 },
  monthHeader:  { fontSize: 16, fontWeight: '700', color: '#0A0A0A', paddingVertical: 8, paddingHorizontal: 4 },
  monthGrid:    { flexDirection: 'row', flexWrap: 'wrap', width: 44 * 7 },
  spacerCell:   { width: 44, height: 44 },
  weekNumberCell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  weekNumberText: { color: '#71717A', fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
```
