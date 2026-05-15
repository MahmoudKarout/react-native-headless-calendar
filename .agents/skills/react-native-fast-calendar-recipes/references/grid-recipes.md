# Grid Recipes

Nine single-page recipes for `<Calendar.Root>` + `<Calendar.DayGrid>`. Each recipe is independent — pick the section that matches the user's request.

The recipes share a small set of **headless pieces** (header, view-switcher, pickers, action bar). They're listed once in [§0](#0-shared-pieces) and reused by reference. Plug them into the user's existing UI primitives if they have them; otherwise paste verbatim — they use the shadcn zinc tokens from [`theme-tokens.md`](theme-tokens.md).

## Table of contents

- [§0 — Shared pieces](#0-shared-pieces)
- [§1 — Single date](#1--single-date)
- [§2 — Date range](#2--date-range)
- [§3 — Multi-select with modifiers](#3--multi-select-with-modifiers)
- [§4 — Bounded selection](#4--bounded-selection)
- [§5 — Multi-month + week numbers](#5--multi-month--week-numbers)
- [§6 — Multi-system (Gregorian + Hijri)](#6--multi-system-gregorian--hijri)
- [§7 — Custom component slots](#7--custom-component-slots)
- [§8 — Localised (any language)](#8--localised-any-language)
- [§9 — Image cells](#9--image-cells)

## §0 — Shared pieces

### Imports every recipe needs

```tsx
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Calendar,
  useCalendarActions,
  useCalendarHeader,
  useCalendarLabels,
  useCalendarMonthPicker,
  useCalendarSelector,
  useCalendarStore,
  useCalendarYearPicker,
  type CalendarThemeOverride,
} from 'react-native-fast-calendar';
```

Recipe-specific imports are listed inside each section.

### `CalendarShell` — width-locked container

The grid is fixed-width (`theme.cellSize × 7`). Wrap header + grid + footer in this shell so chevrons line up with the columns they navigate.

```tsx
const CELL_SIZE = 36;
const COLS = 7;
const GRID_WIDTH = CELL_SIZE * COLS;            // 252
const GRID_WIDTH_WEEKS = CELL_SIZE * (COLS + 1); // 288 — when showWeekNumbers is on

function CalendarShell({
  children,
  width = GRID_WIDTH,
}: {
  children: React.ReactNode;
  width?: number;
}) {
  return <View style={{ alignSelf: 'center', gap: 12, width }}>{children}</View>;
}
```

### `CalendarHeader` — month/year labels + chevrons

Tappable month and year labels open the corresponding picker; chevrons step the displayed month.

```tsx
function CalendarHeader() {
  const {
    monthLabel,
    yearLabel,
    isMonthVisible,
    toggleMonthPicker,
    toggleYearPicker,
    goPrev,
    goNext,
  } = useCalendarHeader();

  return (
    <View style={s.headerRow}>
      <View style={s.headerLabels}>
        {isMonthVisible && (
          <Pressable accessibilityRole="button" onPress={toggleMonthPicker}>
            <Text style={s.headerLabel}>{monthLabel}</Text>
          </Pressable>
        )}
        <Pressable accessibilityRole="button" onPress={toggleYearPicker}>
          <Text style={s.headerLabel}>{yearLabel}</Text>
        </Pressable>
      </View>
      <View style={s.headerNav}>
        <Pressable accessibilityRole="button" onPress={goPrev} style={s.iconBtn}>
          <Text>‹</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={goNext} style={s.iconBtn}>
          <Text>›</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

### `CalendarView` — switches between grid / month picker / year picker

Reads the current `view` slice and renders the right thing. Drop the picker branches if your header doesn't open them.

```tsx
function CalendarView({
  multiMonth,
  showWeekNumbers,
  swipeable,
}: {
  multiMonth?: number;
  showWeekNumbers?: boolean;
  swipeable?: boolean;
}) {
  const view = useCalendarSelector((s) => s.view);
  if (view === 'month') return <MonthPicker />;
  if (view === 'year')  return <YearPicker />;
  return (
    <Calendar.DayGrid
      numberOfMonths={multiMonth}
      showWeekNumbers={showWeekNumbers}
      swipeable={swipeable}
    />
  );
}

function MonthPicker() {
  const { months, activeMonth, selectMonth } = useCalendarMonthPicker();
  return (
    <View style={s.pickerGrid}>
      {months.map((m) => (
        <Pressable
          key={m.index}
          onPress={() => selectMonth(m.index)}
          style={[s.pickerCell, m.index === activeMonth && s.pickerCellActive]}
        >
          <Text style={[s.pickerCellText, m.index === activeMonth && s.pickerCellTextActive]}>
            {m.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function YearPicker() {
  const { years, activeYear, selectYear } = useCalendarYearPicker();
  return (
    <View style={s.pickerGrid}>
      {years.map((y) => (
        <Pressable
          key={y}
          onPress={() => selectYear(y)}
          style={[s.pickerCell, y === activeYear && s.pickerCellActive]}
        >
          <Text style={[s.pickerCellText, y === activeYear && s.pickerCellTextActive]}>
            {y}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
```

### `ActionBar` — clear + confirm

`useCalendarActions()` is subscription-free, so it doesn't re-render the bar on selection changes. The `canConfirm` boolean is reactive state — pull it from `useCalendarSelector(selectCanConfirm)` so only this bar re-renders when committability flips.

```tsx
function ActionBar() {
  const { clear, confirm } = useCalendarActions();
  const canConfirm = useCalendarSelector(selectCanConfirm);
  return (
    <View style={s.actionBar}>
      <Pressable onPress={clear} style={[s.btn, s.btnOutline]}>
        <Text>Clear</Text>
      </Pressable>
      <Pressable
        onPress={confirm}
        disabled={!canConfirm}
        style={[s.btn, s.btnPrimary, !canConfirm && s.btnDisabled]}
      >
        <Text style={s.btnPrimaryLabel}>Confirm</Text>
      </Pressable>
    </View>
  );
}
```

### `TodayButton` — jump to today

Snapshot reads inside event handlers are fine; `getSnapshot()` keeps the function identity stable.

```tsx
function TodayButton() {
  const store = useCalendarStore();
  const onPress = () => store.selectDate(store.getSnapshot().system.today());
  return (
    <Pressable onPress={onPress} style={[s.btn, s.btnGhost]}>
      <Text>Today</Text>
    </Pressable>
  );
}
```

### Theme

All recipes assume the `SHADCN_THEME` constant from [`theme-tokens.md`](theme-tokens.md). Substitute with the user's design-system tokens if they have one.

---

## §1 — Single date

A bare-bones single-date picker with swipeable grid, "Today" shortcut, and confirm/clear actions.

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';

export function SingleDatePicker() {
  const [picked, setPicked] = useState<Date | undefined>();

  return (
    <Calendar.Root
      mode="single"
      systems={[gregorianSystem]}
      theme={SHADCN_THEME}
      onConfirm={({ date }) => setPicked(date)}
    >
      <CalendarShell>
        <CalendarHeader />
        <CalendarView swipeable />
        <View style={s.row}>
          <TodayButton />
          <View style={{ flex: 1 }} />
          <Text>{picked ? picked.toDateString() : 'No selection'}</Text>
        </View>
        <ActionBar />
      </CalendarShell>
    </Calendar.Root>
  );
}
```

Variants:
- For "no buttons, just tap to pick", use `onSelect={(d) => setPicked(d)}` instead of `onConfirm` and remove `<ActionBar />`.
- For inline preview while the user taps, use both: `onSelect` for the live preview, `onConfirm` for the committed value.

---

## §2 — Date range

Hotel / flight / booking pattern. `minRangeDays` and `maxRangeDays` kick in only when the second tap completes the range. `allowSameDay={false}` forces start ≠ end.

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';

export function RangeDatePicker() {
  const [range, setRange] = useState<{ start?: Date; end?: Date }>({});
  const nights = range.start && range.end
    ? Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000))
    : 0;

  return (
    <Calendar.Root
      mode="range"
      allowSameDay={false}
      minRangeDays={2}
      maxRangeDays={14}
      systems={[gregorianSystem]}
      theme={SHADCN_THEME}
      onConfirm={({ startDate, endDate }) => setRange({ start: startDate, end: endDate })}
    >
      <CalendarShell>
        <CalendarHeader />
        <CalendarView />
        <View style={s.row}>
          <ReadoutLabel label="Check-in"  date={range.start} />
          <Text>→</Text>
          <ReadoutLabel label="Check-out" date={range.end} />
          <View style={{ flex: 1 }} />
          {nights > 0 && <Text>{nights} night{nights === 1 ? '' : 's'}</Text>}
        </View>
        <ActionBar />
      </CalendarShell>
    </Calendar.Root>
  );
}

function ReadoutLabel({ label, date }: { label: string; date?: Date }) {
  return (
    <View>
      <Text style={s.smallLabel}>{label}</Text>
      <Text>{date ? date.toDateString() : '—'}</Text>
    </View>
  );
}
```

Tip: cells with `info.inRange === true` (strictly between endpoints) get `theme.colors.rangeBackground` automatically. `isRangeStart` / `isRangeEnd` apply to the endpoints. The default `<DayCell>` paints all three; you only need to handle them yourself when writing a custom day cell (see §7).

---

## §3 — Multi-select with modifiers

Pick up to N dates. `modifiers` is a `Record<string, CalendarMatcher>` — values can be a date array, a range array, or a `(Date) => boolean` predicate. Each cell's `info.modifiers` carries the matched names.

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import type { DayCellInfo } from 'react-native-fast-calendar';

// Hoist to module scope so the array identity is stable across renders.
const BOOKED_DATES = nextNDates(2);
const HOLIDAYS    = nextNDates(5).slice(3);

export function MultiSelectPicker() {
  return (
    <Calendar.Root
      mode="multiple"
      maxSelected={5}
      firstDayOfWeek={1}
      initialDates={[]}
      systems={[gregorianSystem]}
      theme={SHADCN_THEME}
      modifiers={{
        booked:  BOOKED_DATES,
        holiday: HOLIDAYS,
        weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
      }}
    >
      <CalendarShell>
        <CalendarHeader />
        <Calendar.DayGrid renderDay={(info) => <DotMarkedCell info={info} />} />
        <SelectedTagList />
        <ActionBar />
      </CalendarShell>
    </Calendar.Root>
  );
}

function DotMarkedCell({ info }: { info: DayCellInfo }) {
  const store = useCalendarStore();
  const isBooked  = !!info.modifiers.booked;
  const isHoliday = !!info.modifiers.holiday;
  const isWeekend = !!info.modifiers.weekend;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: info.isSelected }}
      disabled={info.isDisabled}
      onPress={info.isDisabled ? undefined : () => store.selectDate(info.date)}
      style={[
        s.dotCell,
        info.isSelected && { backgroundColor: '#0A0A0A' },
        info.isToday && !info.isSelected && s.dotCellToday,
        info.isDisabled && { opacity: 0.4 },
      ]}
    >
      <Text style={{ color: info.isSelected ? '#FFF' : isWeekend ? '#71717A' : '#0A0A0A' }}>
        {info.label}
      </Text>
      <View style={s.dotRow}>
        {isBooked  && <View style={[s.dot, { backgroundColor: '#0A0A0A' }]} />}
        {isHoliday && <View style={[s.dot, { backgroundColor: '#A1A1AA' }]} />}
      </View>
    </Pressable>
  );
}

function SelectedTagList() {
  const dates = useCalendarSelectedDates<unknown>();
  const system = useCalendarSelector((s) => s.system);
  if (dates.length === 0) return <Text>Tap up to 5 days</Text>;
  return (
    <View style={s.tagRow}>
      {dates.map((d) => (
        <Text key={String(system.toNativeDate(d as never))}>
          {system.toNativeDate(d as never).toDateString()}
        </Text>
      ))}
    </View>
  );
}
```

Pitfalls:
- `BOOKED_DATES` and `HOLIDAYS` are at module scope on purpose. Defining them inline rebuilds them every render and forces every cell to re-evaluate modifier matchers.
- `useCalendarSelectedDates` is the correct hook for multi-mode reads. Don't use `useCalendarSelector((s) => s.selectedDates)` and shape it yourself — the typed helper handles the generic correctly.

---

## §4 — Bounded selection

`minDate` + `maxDate` for hard bounds, `disabledDates` for one-offs, `disabledRanges` for blocks, `disabled` predicate for dynamic rules. They compose with **OR** semantics.

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';

export function BoundedPicker() {
  const today = new Date();
  const horizon = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) + 60 * 86_400_000,
  );

  return (
    <Calendar.Root
      mode="single"
      minDate={today}
      maxDate={horizon}
      // weekends off — predicate runs against the native Date for each candidate
      disabled={(d) => d.getDay() === 0 || d.getDay() === 6}
      // specific date blacklists
      disabledDates={[
        new Date(today.getFullYear(), today.getMonth(),     15),
        new Date(today.getFullYear(), today.getMonth() + 1, 1),
      ]}
      // inclusive blocks
      disabledRanges={[
        {
          start: new Date(today.getFullYear(), today.getMonth(), 25),
          end:   new Date(today.getFullYear(), today.getMonth(), 27),
        },
      ]}
      systems={[gregorianSystem]}
      theme={SHADCN_THEME}
    >
      <CalendarShell>
        <CalendarHeader />
        <CalendarView />
        <View style={s.legendRow}>
          <Legend color="#0A0A0A" label="Today / selected" />
          <Legend color="#F4F4F5" label="Weekend / OOO"   />
          <Legend color="#A1A1AA" label="Out of bounds"   />
        </View>
      </CalendarShell>
    </Calendar.Root>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text>{label}</Text>
    </View>
  );
}
```

Pitfall: keep your `disabled` predicate cheap and pure — it's called for every visible cell. Wrap heavier logic with `useMemo` or pre-compute a Set / Map and read from it inside the predicate.

---

## §5 — Multi-month + week numbers

Two months side-by-side, ISO Monday-first weeks, ISO week numbers, no outside days, collapsing weeks (4/5/6 rows depending on the month). Custom `MonthCaption` and `WeekNumberCell` slots make the layout look intentional.

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import type { CalendarComponents } from 'react-native-fast-calendar';

const MONTH_CAPTION: NonNullable<CalendarComponents['MonthCaption']> = ({ label }) => (
  <View style={s.monthCaption}>
    <Text style={s.monthCaptionText}>{label}</Text>
  </View>
);

const WEEK_NUMBER_CELL: NonNullable<CalendarComponents['WeekNumberCell']> = ({ weekNumber }) => (
  <View style={s.weekNumberCell}>
    <Text style={s.weekNumberLabel}>{weekNumber}</Text>
  </View>
);

export function MultiMonthPicker() {
  return (
    <Calendar.Root
      mode="range"
      firstDayOfWeek={1}            // ISO Monday-first
      fixedWeeks={false}            // collapse 4/5/6 weeks
      showOutsideDays={false}       // blank cells where months don't extend
      components={{
        MonthCaption: MONTH_CAPTION,
        WeekNumberCell: WEEK_NUMBER_CELL,
      }}
      systems={[gregorianSystem]}
      theme={SHADCN_THEME}
    >
      <CalendarShell width={GRID_WIDTH_WEEKS}>
        <CalendarHeader />
      </CalendarShell>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Calendar.DayGrid numberOfMonths={2} showWeekNumbers />
      </ScrollView>
    </Calendar.Root>
  );
}
```

Pitfall: when `numberOfMonths > 1`, the grid's natural width is `cellSize × 7 × numberOfMonths` (plus week-number columns). Wrapping in a horizontal `ScrollView` is the simplest layout that keeps the header tied to the first month's column.

---

## §6 — Multi-system (Gregorian + Hijri + Jalali)

Same store, multiple calendar systems. The system switcher swaps which system formats / steps the displayed dates; the selection itself is preserved across the switch. The library ships pre-configured Hijri and Jalali plugins — install the optional peer dep (`@tabby_ai/hijri-converter` for Hijri, `moment-jalaali` for Jalali) and import the ready-made instance.

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';
import { jalaliSystem } from 'react-native-fast-calendar/systems/jalali';
import type { CalendarSystem } from 'react-native-fast-calendar';

// Hoist — system instances are heavy.
const SYSTEMS: CalendarSystem[] = [
  gregorianSystem,
  hijriSystem,
  jalaliSystem,
];

export function MultiSystemPicker() {
  return (
    <Calendar.Root
      mode="range"
      allowSameDay
      systems={SYSTEMS}
      theme={SHADCN_THEME}
    >
      <CalendarShell>
        <SystemSwitcher />
        <CalendarHeader />
        <CalendarView />
        <ActionBar />
      </CalendarShell>
    </Calendar.Root>
  );
}

function SystemSwitcher() {
  const { systems, activeId, setActive } = useCalendarSystemSwitcher();
  if (systems.length < 2) return null;
  return (
    <View style={s.segmented}>
      {systems.map((sys) => {
        const isActive = sys.id === activeId;
        return (
          <Pressable
            key={sys.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => setActive(sys.id)}
            style={[s.segmentedItem, isActive && s.segmentedItemActive]}
          >
            <Text style={isActive ? s.segmentedItemLabelActive : s.segmentedItemLabel}>
              {sys.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

Add this import to the existing import block at the top of the file:

```tsx
import { useCalendarSystemSwitcher } from 'react-native-fast-calendar';
```

Peer dependency: `@tabby_ai/hijri-converter` is the converter the Hijri system uses by default. Any module exposing the same `toHijri` / `toGregorian` shape works — you can swap converters per project.

---

## §7 — Custom component slots

Replace the day cell, weekday header, and week-number cell wholesale via the `components` prop on `<Calendar.Root>`. The grid still owns layout; you just return JSX for each slot.

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import type {
  CalendarComponents,
  WeekdayCellProps,
  WeekdayHeaderProps,
  WeekNumberCellProps,
} from 'react-native-fast-calendar';

const SquareDayCell: NonNullable<CalendarComponents['DayCell']> = ({ info, onSelect }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: info.isSelected }}
    disabled={info.isDisabled}
    onPress={info.isDisabled ? undefined : () => onSelect(info.date)}
    style={[
      s.squareCell,
      info.isToday && !info.isSelected && s.squareCellToday,
      info.isSelected && s.squareCellSelected,
      info.isDisabled && { opacity: 0.4 },
    ]}
  >
    <Text
      style={[
        s.squareCellLabel,
        info.isSelected && s.squareCellLabelSelected,
        !info.isCurrentMonth && s.squareCellLabelOutside,
      ]}
    >
      {info.label}
    </Text>
  </Pressable>
);

const BorderedWeekdayHeader: NonNullable<CalendarComponents['WeekdayHeader']> = ({
  labels,
}: WeekdayHeaderProps) => (
  <View style={s.borderedHeader}>
    {labels.map((l, i) => (
      <View key={`${l}-${i}`} style={s.borderedHeaderCell}>
        <Text>{l.toUpperCase()}</Text>
      </View>
    ))}
  </View>
);

const ShoutyWeekNumberCell: NonNullable<CalendarComponents['WeekNumberCell']> = ({
  weekNumber,
}: WeekNumberCellProps) => (
  <View style={s.shoutyWeek}>
    <Text>w{weekNumber}</Text>
  </View>
);

// Per-column override — ignored when WeekdayHeader is also set, but useful
// when you want to keep the row layout and only restyle each label.
export const SubtleWeekdayCell: NonNullable<CalendarComponents['WeekdayCell']> = ({
  label,
}: WeekdayCellProps) => (
  <Text style={s.subtleWeekday}>{label.slice(0, 1)}</Text>
);

export function CustomSlotsPicker() {
  return (
    <Calendar.Root
      mode="single"
      systems={[gregorianSystem]}
      theme={SHADCN_THEME}
      components={{
        DayCell: SquareDayCell,
        WeekdayHeader: BorderedWeekdayHeader,
        WeekNumberCell: ShoutyWeekNumberCell,
      }}
    >
      <CalendarShell width={GRID_WIDTH_WEEKS}>
        <CalendarHeader />
        <Calendar.DayGrid showWeekNumbers />
      </CalendarShell>
    </Calendar.Root>
  );
}
```

Slot precedence:
1. `<Calendar.DayGrid renderDay={…}>` wins for day cells (per-instance).
2. `components.DayCell` (root-level) is next.
3. The default `<DayCell>` runs otherwise.
4. `components.WeekdayHeader` (full row) wins over `components.WeekdayCell` (per-column).

---

## §8 — Localised (any language)

`createGregorianSystem` is a factory: pass localised `monthLabels` (12) and `weekdayLabels` (7, Sunday-first), then add the system to `<Calendar.Root>`. Localise button text via the `labels` prop. Set `firstDayOfWeek` for locales where the week starts on Monday/Saturday/etc.

```tsx
import { createGregorianSystem } from 'react-native-fast-calendar/systems/gregorian';

const FRENCH_SYSTEM = createGregorianSystem({
  label: 'Grégorien',
  monthLabels: [
    'Janvier', 'Février', 'Mars',     'Avril',  'Mai',     'Juin',
    'Juillet', 'Août',    'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ],
  weekdayLabels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
});

export function FrenchPicker() {
  return (
    <Calendar.Root
      mode="single"
      firstDayOfWeek={1}              // lundi
      systems={[FRENCH_SYSTEM]}
      theme={SHADCN_THEME}
      labels={{
        confirm:     'Valider',
        clear:       'Effacer',
        prev:        'Précédent',
        next:        'Suivant',
        selectMonth: 'Choisir le mois',
        selectYear:  "Choisir l'année",
      }}
    >
      <CalendarShell>
        <CalendarHeader />
        <CalendarView />
        <ActionBar />
      </CalendarShell>
    </Calendar.Root>
  );
}
```

Recipe applies to any language. For Arabic / Hebrew, also wire `I18nManager.allowRTL(true)` at app startup — `useCalendarNavigation` already mirrors chevrons in RTL automatically.

For non-Gregorian languages where the month *system* itself differs (Hijri, Jalali / Persian, Chinese, …), use the matching pre-configured plugin (`hijriSystem`, `jalaliSystem`) — or the matching `createHijriSystem` / `createJalaliSystem` factory for a custom converter / labels — instead of `createGregorianSystem`.

---

## §9 — Image cells

Replace the day number with an `<Image>` (or any RN node — SVG, video poster, badge component) on specific dates while keeping selection. `info.isSelected / isToday / isDisabled` are still computed for you, you just paint the pixels.

```tsx
import { Image } from 'react-native';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import type { DayCellInfo } from 'react-native-fast-calendar';

const YT_LOGO_URI =
  'https://img.freepik.com/premium-vector/youtube-logo-round-button-vector_768467-361.jpg';

// Real apps would source these from a CMS / API / store.
const UPLOAD_DAYS: Date[] = (() => {
  const today = new Date();
  return [0, 3, 7, 12, 18, 24, 30].map(
    (d) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + d),
  );
})();

const isUploadDay = (info: DayCellInfo): boolean =>
  UPLOAD_DAYS.some(
    (d) =>
      d.getFullYear() === info.nativeDate.getFullYear() &&
      d.getMonth()    === info.nativeDate.getMonth()    &&
      d.getDate()     === info.nativeDate.getDate(),
  );

function ImageDayCell({ info }: { info: DayCellInfo }) {
  const store = useCalendarStore();
  const showLogo = info.isCurrentMonth && isUploadDay(info);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: info.isDisabled, selected: info.isSelected }}
      disabled={info.isDisabled}
      onPress={info.isDisabled ? undefined : () => store.selectDate(info.date)}
      style={[
        s.imageCell,
        info.isToday && !info.isSelected && s.imageCellToday,
        info.isSelected && s.imageCellSelected,
        info.isDisabled && { opacity: 0.4 },
      ]}
    >
      {showLogo ? (
        <Image accessibilityIgnoresInvertColors source={{ uri: YT_LOGO_URI }} style={s.imageCellLogo} />
      ) : (
        <Text
          style={[
            s.imageCellLabel,
            info.isSelected && s.imageCellLabelSelected,
            !info.isCurrentMonth && s.imageCellLabelOutside,
          ]}
        >
          {info.label}
        </Text>
      )}
    </Pressable>
  );
}

export function ImageCellPicker() {
  return (
    <Calendar.Root mode="single" systems={[gregorianSystem]} theme={SHADCN_THEME}>
      <CalendarShell>
        <CalendarHeader />
        <Calendar.DayGrid renderDay={(info) => <ImageDayCell info={info} />} />
      </CalendarShell>
    </Calendar.Root>
  );
}
```

Why `renderDay` instead of `components.DayCell`? When the special-rendered cells are an *instance-level* concern (this screen has video uploads; another screen with the same calendar doesn't), `renderDay` keeps the customisation local. Use `components.DayCell` when *every* day cell across the project should look the same.

---

## Stylesheet (minimal, paste once per file)

The recipes above reference a `s` stylesheet. Here is a minimal version that covers every recipe — drop into the file alongside your imports and trim what you don't use.

```tsx
import { StyleSheet } from 'react-native';

const C = {
  background: '#FFFFFF',
  foreground: '#0A0A0A',
  mutedFg:   '#71717A',
  muted:     '#F4F4F5',
  border:    '#E4E4E7',
  primary:   '#0A0A0A',
  primaryFg: '#FAFAFA',
  disabled:  '#A1A1AA',
};

const s = StyleSheet.create({
  // Header
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLabels:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerLabel: { fontSize: 14, fontWeight: '600', color: C.foreground },
  headerNav:   { flexDirection: 'row', gap: 4 },
  iconBtn:     { width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
                 borderWidth: 1, borderColor: C.border, borderRadius: 6 },

  // Pickers
  pickerGrid:    { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 4 },
  pickerCell:    { width: '33.333%', paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
  pickerCellActive: { backgroundColor: C.primary },
  pickerCellText:    { color: C.foreground, fontSize: 14 },
  pickerCellTextActive: { color: C.primaryFg, fontWeight: '600' },

  // Action bar
  actionBar:    { flexDirection: 'row', gap: 8 },
  btn:          { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  btnPrimary:   { backgroundColor: C.primary },
  btnPrimaryLabel: { color: C.primaryFg, fontWeight: '600' },
  btnOutline:   { borderWidth: 1, borderColor: C.border, backgroundColor: C.background },
  btnGhost:     { backgroundColor: 'transparent' },
  btnDisabled:  { opacity: 0.5 },

  // Layout helpers
  row:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallLabel:   { color: C.mutedFg, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.6 },

  // Multi-select dot cell (§3)
  dotCell:      { width: 36, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  dotCellToday: { borderWidth: 1, borderColor: C.foreground },
  dotRow:       { position: 'absolute', bottom: 3, flexDirection: 'row', gap: 2 },
  dot:          { width: 4, height: 4, borderRadius: 2 },
  tagRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: 24, alignItems: 'center' },

  // Bounded legend (§4)
  legendRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:    { width: 10, height: 10, borderRadius: 3, borderWidth: 1, borderColor: C.border },

  // Multi-month captions (§5)
  monthCaption:     { paddingVertical: 6, alignItems: 'center', borderBottomWidth: 1, borderColor: C.border, marginBottom: 4 },
  monthCaptionText: { fontSize: 13, fontWeight: '600', color: C.foreground },
  weekNumberCell:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  weekNumberLabel:  { color: C.mutedFg, fontSize: 11 },

  // System switcher (§6)
  segmented:       { flexDirection: 'row', backgroundColor: C.muted, borderRadius: 8, padding: 4, gap: 4 },
  segmentedItem:   { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 6 },
  segmentedItemActive: { backgroundColor: C.background },
  segmentedItemLabel:  { color: C.mutedFg, fontSize: 13, fontWeight: '500' },
  segmentedItemLabelActive: { color: C.foreground, fontWeight: '600' },

  // Custom slots (§7)
  squareCell:        { width: 36, height: 36, margin: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 1, borderColor: C.border, backgroundColor: C.background },
  squareCellToday:   { borderColor: C.foreground },
  squareCellSelected:{ backgroundColor: C.primary, borderColor: C.primary },
  squareCellLabel:   { color: C.foreground, fontSize: 13, fontWeight: '500' },
  squareCellLabelSelected: { color: C.primaryFg, fontWeight: '600' },
  squareCellLabelOutside:  { color: C.disabled },
  borderedHeader:     { flexDirection: 'row', borderBottomWidth: 1, borderColor: C.border, paddingBottom: 4, marginBottom: 4 },
  borderedHeaderCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  shoutyWeek:         { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: C.muted, borderRadius: 4, margin: 2 },
  subtleWeekday:      { color: C.mutedFg, fontSize: 11, width: 36, textAlign: 'center', fontWeight: '600' },

  // Image cells (§9)
  imageCell:         { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  imageCellToday:    { borderWidth: 1, borderColor: C.foreground },
  imageCellSelected: { backgroundColor: C.primary },
  imageCellLogo:     { width: 28, height: 28, borderRadius: 14, resizeMode: 'cover' },
  imageCellLabel:    { fontSize: 14, color: C.foreground },
  imageCellLabelSelected: { color: C.primaryFg, fontWeight: '600' },
  imageCellLabelOutside:  { color: C.disabled },
});

function nextNDates(n: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= n; i += 1) {
    out.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i * 2));
  }
  return out;
}
```
