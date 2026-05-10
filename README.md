# react-native-fast-calendar

A **headless**, **calendar-system-agnostic**, **fully composable** React Native calendar.

**Now with `SimpleCalendar`** — a batteries-included component for the 80% use case, while keeping the full headless API for advanced customization.

---

## Table of Contents

- [Install](#install)
- [Quickstart (Zero Config)](#quickstart-zero-config)
- [SimpleCalendar API](#simplecalendar-api)
- [Headless API (Advanced)](#headless-api-advanced)
- [The Hooks](#the-hooks)
- [Themes](#themes)
- [Calendar Systems](#calendar-systems)
- [Selection Modes](#selection-modes)
- [Layout Options](#layout-options)
- [Modifiers](#modifiers)
- [Custom Day Cells](#custom-day-cells)
- [Architecture](#architecture)
- [Contributing](#contributing)

---

## Install

```bash
npm install react-native-fast-calendar
# or
yarn add react-native-fast-calendar
```

`react-native-fast-calendar` has **zero calendar-system dependencies**. Gregorian is built in; everything else (Hijri, Persian, Chinese, …) is a plugin you either consume from `react-native-fast-calendar/systems/*` or implement yourself.

---

## Quickstart (Zero Config)

Use `SimpleCalendar` for a complete, opinionated calendar in one line:

```tsx
import { SimpleCalendar } from 'react-native-fast-calendar';

function App() {
  return (
    <SimpleCalendar
      mode="single"
      onConfirm={({ date }) => console.log('Selected:', date)}
    />
  );
}
```

That's it! No system imports, no hook wiring, no custom components. `SimpleCalendar` includes:

- Header with month/year labels and navigation chevrons
- Swipeable day grid
- Confirm/clear footer
- Gregorian calendar (default)

### SimpleCalendar with Options

```tsx
import { SimpleCalendar, darkTheme } from 'react-native-fast-calendar';

<SimpleCalendar
  mode="range"
  theme={darkTheme}
  minDate={new Date()}
  maxRangeDays={14}
  showWeekNumbers
  firstDayOfWeek={1} // Monday first
  onSelect={(date) => console.log('Tapped:', date)}     // Immediate feedback
  onConfirm={({ startDate, endDate }) => submitBooking(startDate, endDate)}
/>
```

---

## SimpleCalendar API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'single' \| 'range' \| 'multiple'` | `'single'` | Selection mode |
| `systems` | `CalendarSystem[]` | `[gregorianSystem]` | Calendar systems (optional, defaults to Gregorian) |
| `onSelect` | `(date: Date) => void` | — | Immediate callback when any date is tapped |
| `onConfirm` | `OnConfirm` | — | Callback when confirm button pressed |
| `onClear` | `OnClear` | — | Callback when clear button pressed |
| `showHeader` | `boolean` | `true` | Show month/year header with navigation |
| `showFooter` | `boolean` | `true` | Show confirm/clear footer |
| `swipeable` | `boolean` | `true` | Enable horizontal swipe between months |
| `numberOfMonths` | `number` | `1` | Show multiple months side-by-side |
| `showWeekNumbers` | `boolean` | `false` | Show ISO week numbers |
| `firstDayOfWeek` | `0-6` | `0` | Sunday=0, Monday=1, etc. |
| `showOutsideDays` | `boolean` | `true` | Show days from adjacent months |
| `fixedWeeks` | `boolean` | `true` | Always show 6 weeks |
| `minDate` | `Date` | — | Minimum selectable date |
| `maxDate` | `Date` | — | Maximum selectable date |
| `initialDate` | `Date` | — | Initial selected date (single mode) |
| `initialStart` | `Date` | — | Initial start date (range mode) |
| `initialEnd` | `Date` | — | Initial end date (range mode) |
| `initialDates` | `Date[]` | — | Initial selected dates (multiple mode) |
| `theme` | `CalendarThemeOverride` | — | Theme override |
| `labels` | `Partial<CalendarLabels>` | — | Label overrides |
| `disabled` | `(date: Date) => boolean` | — | Disable specific dates |
| `testID` | `string` | — | Test ID prefix |

---

## Headless API (Advanced)

For full control over UI, use the headless API with `Calendar.Root` and the `useCalendar*` hooks.

```tsx
import {
  Calendar,
  useCalendarActions,
  useCalendarHeader,
  useCalendarSelector,
} from 'react-native-fast-calendar';

function MyDatePicker() {
  return (
    <Calendar.Root mode="single" onConfirm={({ date }) => console.log(date)}>
      <MyHeader />
      <MyView />
      <MyFooter />
    </Calendar.Root>
  );
}

// Using the convenience useCalendarHeader hook
function MyHeader() {
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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {isMonthVisible && (
          <Pressable onPress={toggleMonthPicker}>
            <Text>{monthLabel}</Text>
          </Pressable>
        )}
        <Pressable onPress={toggleYearPicker}>
          <Text>{yearLabel}</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={goPrev}><Text>‹</Text></Pressable>
        <Pressable onPress={goNext}><Text>›</Text></Pressable>
      </View>
    </View>
  );
}

function MyView() {
  const view = useCalendarSelector((s) => s.view);
  if (view === 'day') return <Calendar.DayGrid swipeable />;
  if (view === 'month') return <MyMonthPicker />;
  return <MyYearPicker />;
}

function MyFooter() {
  const { confirm, clear, canConfirm } = useCalendarActions();
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Pressable onPress={clear}><Text>Clear</Text></Pressable>
      <Pressable disabled={!canConfirm} onPress={confirm}>
        <Text>Confirm</Text>
      </Pressable>
    </View>
  );
}
```

### Optional Systems (Gregorian by Default)

The `systems` prop is now optional — it defaults to Gregorian:

```tsx
// Before: had to import and pass gregorianSystem
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
<Calendar.Root systems={[gregorianSystem]}>

// After: systems is optional
<Calendar.Root>
  <Calendar.DayGrid />
</Calendar.Root>
```

You can still import systems explicitly for tree-shaking or custom configuration:

```tsx
import {
  Calendar,
  gregorianSystem,
  createGregorianSystem,
} from 'react-native-fast-calendar';

// Use the default
<Calendar.Root systems={[gregorianSystem]}>

// Or customize
const frenchGregorian = createGregorianSystem({
  monthLabels: ['Janvier', 'Février', /* ... */],
  weekdayLabels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
});
<Calendar.Root systems={[frenchGregorian]}>
```

---

## The Hooks

Every `useCalendar*` hook must be called inside `<Calendar.Root>`.

### Convenience Hooks

| Hook | Returns | Purpose |
|------|---------|---------|
| `useCalendarHeader()` | `{ monthLabel, yearLabel, isMonthVisible, toggleMonthPicker, toggleYearPicker, goPrev, goNext }` | Combines month/year labels + navigation |

### Granular Hooks

| Hook | Returns | Re-renders on |
|------|---------|---------------|
| `useCalendarStore()` | Store instance | never |
| `useCalendarSelector(fn)` | Selected slice | slice identity change |
| `useCalendarConfig()` | Full config | config identity change |
| `useCalendarTheme()` / `useCalendarLabels()` | Theme / Labels | config change |
| `useCalendarComponents()` | Component slots | slot identity change |
| `useCalendarFirstDayOfWeek()` | `0-6` | prop change |
| `useCalendarWeekdayLabels()` | Rotated weekday labels | system or `firstDayOfWeek` change |
| `useCalendarWeekNumbers()` | ISO week numbers | month/system/`firstDayOfWeek` change |
| `useCalendarActions()` | `{ confirm, clear, canConfirm }` | `canConfirm` change |
| `useCalendarNavigation()` | `{ goPrev, goNext }` | never (stable functions) |
| `useCalendarMonthLabel()` | `{ label, isVisible, toggle }` | month text or view change |
| `useCalendarYearLabel()` | `{ label, toggle }` | year text change |
| `useCalendarSystemSwitcher()` | `{ systems, activeId, setActive }` | active system change |
| `useCalendarMonthPicker()` | `{ months, activeMonth, selectMonth }` | month/system change |
| `useCalendarYearPicker()` | `{ years, activeYear, selectYear }` | year change |
| `useCalendarSelectedDates()` | `readonly T[]` | selection array change |

### Confirm / Clear Actions

```tsx
import { useCalendarActions, useCalendarLabels } from 'react-native-fast-calendar';

function ConfirmBar() {
  const { confirm, clear, canConfirm } = useCalendarActions();
  const { confirm: confirmLabel, clear: clearLabel } = useCalendarLabels();

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <MyGhostButton onPress={clear}>{clearLabel}</MyGhostButton>
      <MyPrimaryButton disabled={!canConfirm} onPress={confirm}>
        {confirmLabel}
      </MyPrimaryButton>
    </View>
  );
}
```

### System Switcher

```tsx
import { useCalendarSystemSwitcher } from 'react-native-fast-calendar';

function MySystemSwitcher() {
  const { systems, activeId, setActive } = useCalendarSystemSwitcher();
  if (systems.length < 2) return null;
  return (
    <MySegmentedControl>
      {systems.map((s) => (
        <MyPill
          key={s.id}
          active={s.id === activeId}
          onPress={() => setActive(s.id)}
        >
          {s.label}
        </MyPill>
      ))}
    </MySegmentedControl>
  );
}
```

### Month / Year Pickers

```tsx
import { useCalendarMonthPicker, useCalendarYearPicker } from 'react-native-fast-calendar';

function MyMonthPicker() {
  const { months, activeMonth, selectMonth } = useCalendarMonthPicker();
  return (
    <MyGrid>
      {months.map((m) => (
        <MyCell
          key={m.index}
          active={m.index === activeMonth}
          onPress={() => selectMonth(m.index)}
        >
          {m.label}
        </MyCell>
      ))}
    </MyGrid>
  );
}

function MyYearPicker() {
  const { years, activeYear, selectYear } = useCalendarYearPicker();
  return (
    <MyGrid>
      {years.map((y) => (
        <MyCell key={y} active={y === activeYear} onPress={() => selectYear(y)}>
          {y}
        </MyCell>
      ))}
    </MyGrid>
  );
}
```

---

## Themes

### Built-in Presets

```tsx
import { SimpleCalendar, defaultTheme, darkTheme } from 'react-native-fast-calendar';

// Light theme (default)
<SimpleCalendar />

// Dark theme
<SimpleCalendar theme={darkTheme} />
```

### Custom Theme

```tsx
<SimpleCalendar
  theme={{
    colors: {
      primary: '#FF6F00',
      onPrimary: '#FFFFFF',
      background: '#FFF8E1',
      text: '#3E2723',
      textMuted: '#8D6E63',
      todayBorder: '#FF6F00',
      rangeBackground: '#FFE0B2',
      disabled: '#D7CCC8',
      border: '#D7CCC8',
    },
    cellSize: 44,
    borderRadius: 8,
    fontSize: { day: 14, weekday: 12, header: 16 },
    spacing: { cellInnerGap: 4, controlGap: 8, controlPadding: 12, monthGap: 16, containerPadding: 24 },
  }}
/>
```

### Theme Tokens

| Token | Description |
|-------|-------------|
| `colors.primary` | Selected day / range endpoints |
| `colors.onPrimary` | Text on primary color |
| `colors.background` | Calendar background |
| `colors.text` | Day cell text |
| `colors.textMuted` | Weekday labels / outside days |
| `colors.todayBorder` | Today's border color |
| `colors.rangeBackground` | In-range background |
| `colors.disabled` | Disabled text |
| `colors.border` | Borders |
| `cellSize` | Day cell size (px) |
| `borderRadius` | Cell border radius |

---

## Calendar Systems

### Gregorian (Default)

```tsx
import { SimpleCalendar, gregorianSystem, createGregorianSystem } from 'react-native-fast-calendar';

// Default
<SimpleCalendar />

// With custom labels
<SimpleCalendar
  systems={[createGregorianSystem({
    label: 'Grégorien',
    monthLabels: ['Janvier', 'Février', 'Mars', /* ... */],
    weekdayLabels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  })]}
  labels={{ confirm: 'Valider', clear: 'Effacer' }}
/>
```

### Hijri

Install the optional peer dep and import the pre-configured `hijriSystem`:

```bash
npm install @tabby_ai/hijri-converter
```

```tsx
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';
import { gregorianSystem } from 'react-native-fast-calendar';

<SimpleCalendar systems={[gregorianSystem, hijriSystem]} />
```

The library auto-loads `@tabby_ai/hijri-converter` on import and throws a clear, install-pointing error if the package is missing. To use a different converter (`moment-hijri`, `Intl.DateTimeFormat`, custom Umm al-Qura tables, …) wrap it in the `HijriConverter` shape and pass it explicitly:

```tsx
import { createHijriSystem } from 'react-native-fast-calendar/systems/hijri';

const hijri = createHijriSystem({
  converter: {
    gregorianToHijri: ({ year, month, day }) => /* … */,
    hijriToGregorian: ({ year, month, day }) => /* … */,
  },
  // Optional: monthLabels, weekdayLabels, label, formatDay, formatMonthYear
});
```

### Jalali (Persian / Solar Hijri)

Install the optional peer dep and import the pre-configured `jalaliSystem`:

```bash
npm install moment-jalaali
```

```tsx
import { jalaliSystem } from 'react-native-fast-calendar/systems/jalali';
import { gregorianSystem } from 'react-native-fast-calendar';

<SimpleCalendar systems={[gregorianSystem, jalaliSystem]} />
```

Same auto-load pattern as Hijri: `moment-jalaali` is loaded lazily, and a missing install raises a friendly error at import time. Pass a custom converter (`jalaali-js` directly, an `Intl.DateTimeFormat` `ca-persian` wrapper, …) via `createJalaliSystem({ converter })` from the same module.

### Custom Calendar System

Implement `CalendarSystem<T>` to add Chinese, Ethiopian, or any other calendar — no plugin required:

```tsx
import type { CalendarSystem } from 'react-native-fast-calendar';

const persianSystem: CalendarSystem<PersianDate> = {
  id: 'persian',
  label: 'Persian',
  today() { /* ... */ },
  fromNativeDate(d) { /* ... */ },
  from(input) { /* ... */ },
  year(d) { /* ... */ },
  month(d) { /* 0-based */ },
  day(d) { /* 1-based */ },
  weekday(d) { /* 0=Sun..6=Sat */ },
  daysInMonth(d) { /* ... */ },
  withYear(d, year) { /* ... */ },
  withMonth(d, month) { /* ... */ },
  withDay(d, day) { /* ... */ },
  addMonths(d, n) { /* ... */ },
  addYears(d, n) { /* ... */ },
  isSame(a, b) { /* ... */ },
  isBefore(a, b) { /* ... */ },
  isAfter(a, b) { /* ... */ },
  monthLabels() { /* 12 strings */ },
  weekdayLabels() { /* 7 strings */ },
  formatDay(d) { /* ... */ },
  formatMonthYear(d) { /* ... */ },
  toNativeDate(d) { /* ... */ },
};

<SimpleCalendar systems={[persianSystem]} />
```

---

## Selection Modes

```tsx
// Single date
<SimpleCalendar mode="single" onConfirm={({ date }) => {}} />

// Date range
<SimpleCalendar 
  mode="range" 
  minRangeDays={2}
  maxRangeDays={14}
  allowSameDay
  onConfirm={({ startDate, endDate }) => {}}
/>

// Multiple dates
<SimpleCalendar 
  mode="multiple"
  maxSelected={5}
  onConfirm={({ dates }) => {}}
/>
```

### Reading Selection State

```tsx
import { useCalendarSelectedDates, useCalendarSelector } from 'react-native-fast-calendar';

// In multiple mode
const dates = useCalendarSelectedDates<Date>();

// In single/range mode
const { selectedDate, rangeStart, rangeEnd } = useCalendarSelector(s => ({
  selectedDate: s.selectedDate,
  rangeStart: s.rangeStart,
  rangeEnd: s.rangeEnd,
}));
```

---

## Layout Options

| Prop | Applies To | Default | Effect |
|------|-----------|---------|--------|
| `firstDayOfWeek` | Root | `0` (Sun) | Week starts on Sunday/Monday/Saturday |
| `showOutsideDays` | Root | `true` | Show days from adjacent months |
| `fixedWeeks` | Root | `true` | Always show 6 rows |
| `showWeekNumbers` | DayGrid | `false` | Show ISO week numbers |
| `numberOfMonths` | DayGrid | `1` | Multiple months side-by-side |
| `swipeable` | DayGrid | `false` | Swipe between months |

```tsx
// ISO week, Monday first, with week numbers
<SimpleCalendar
  firstDayOfWeek={1}
  showWeekNumbers
/>

// Two months side-by-side
<SimpleCalendar numberOfMonths={2} swipeable={false} />
```

---

## Modifiers

Tag dates with custom flags for styling:

```tsx
const BOOKED = [new Date(2024, 4, 7), new Date(2024, 4, 8)];

<SimpleCalendar
  modifiers={{
    booked: BOOKED,
    weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
    summer: { from: new Date(2024, 5, 1), to: new Date(2024, 7, 31) },
  }}
/>
```

Or with custom rendering:

```tsx
<Calendar.Root modifiers={{ holiday: HOLIDAYS }}>
  <Calendar.DayGrid
    renderDay={(info) => (
      <View style={info.modifiers.holiday && styles.holiday}>
        <Text>{info.label}</Text>
      </View>
    )}
  />
</Calendar.Root>
```

---

## Custom Day Cells

Replace the default day cell via `components` prop or `renderDay`:

```tsx
// Global slot replacement
<Calendar.Root
  components={{
    DayCell: ({ info, onSelect }) => (
      <MyCustomCell
        label={info.label}
        isSelected={info.isSelected}
        isToday={info.isToday}
        inRange={info.inRange}
        isDisabled={info.isDisabled}
        onPress={() => onSelect(info.date)}
      />
    ),
  }}
>
  <Calendar.DayGrid />
</Calendar.Root>

// Per-grid render prop (overrides slot)
<Calendar.DayGrid
  renderDay={(info) => (
    <MyCustomCell {...info} />
  )}
/>
```

### Available Component Slots

| Slot | Props |
|------|-------|
| `WeekdayHeader` | `{ labels }` |
| `WeekdayCell` | `{ label, index }` |
| `DayCell` | `{ info, onSelect }` |
| `WeekNumberCell` | `{ weekNumber }` |
| `MonthCaption` | `{ label, monthDate, monthIndex, year }` |

---

## Custom UI with Calendar State

Build any UI that reads from the calendar store:

```tsx
import { useCalendarSelector, useCalendarStore } from 'react-native-fast-calendar';

function TodayShortcut() {
  const store = useCalendarStore();
  const onPress = () => {
    const { system } = store.getSnapshot();
    store.selectDate(system.today());
  };
  return <Button onPress={onPress}>Today</Button>;
}

function SelectionPreview() {
  const selected = useCalendarSelector(s => s.selectedDate);
  return <Text>{selected ? 'Selected!' : 'Tap a date'}</Text>;
}
```

---

## Bottom Sheet Integration

`SimpleCalendar` works seamlessly inside bottom sheets. Here's an example using `@gorhom/bottom-sheet`:

```bash
npm install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
```

```tsx
import React, { useCallback, useRef } from 'react';
import { Pressable, Text } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SimpleCalendar, darkTheme } from 'react-native-fast-calendar';

function DatePickerBottomSheet() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  const snapPoints = useMemo(() => ['50%', '75%'], []);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        {/* Trigger Button */}
        <Pressable onPress={() => bottomSheetRef.current?.present()}>
          <Text>{selectedDate?.toLocaleDateString() ?? 'Select Date'}</Text>
        </Pressable>

        {/* Bottom Sheet */}
        <BottomSheetModal
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          backdropComponent={renderBackdrop}
        >
          <BottomSheetView style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              Select Date
            </Text>
            <SimpleCalendar
              mode="single"
              theme={darkTheme}
              onSelect={(date) => setSelectedDate(date)}
              onConfirm={() => bottomSheetRef.current?.dismiss()}
              swipeable
            />
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

### Tips for Bottom Sheet Usage

1. **Use `darkTheme` inside bottom sheets** — Matches the typical dark modal background
2. **Enable `swipeable`** — Natural gesture inside a bottom sheet
3. **Compact layout** — Use `showHeader` and `showFooter` props to control vertical space
4. **Handle backdrop** — Use `BottomSheetBackdrop` for proper dismiss behavior

See the full example in `example/src/BottomSheetExample.tsx`.

---

## Architecture

```
┌─────────────────────────────────────────┐
│  <Calendar.Root systems components ...> │  ◄── provider
│  ┌───────────────────────────────────┐  │
│  │  CalendarConfigContext            │  │  ◄── theme, labels, modifiers
│  │  (memoised; rarely changes)       │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  CalendarStoreContext             │  │  ◄── store instance
│  │  └── CalendarStore                │  │      (useSyncExternalStore)
│  └───────────────────────────────────┘  │
│                                         │
│  Hooks subscribe via                    │
│  useCalendarSelector(s => slice)        │
│  → only re-render on slice change       │
└─────────────────────────────────────────┘
```

### Performance Guarantees

| Hook | Re-renders When... |
|------|-------------------|
| `useCalendarSystemSwitcher()` | active system changes |
| `useCalendarMonthLabel()` | month text or view changes |
| `useCalendarYearLabel()` | year text changes |
| `useCalendarNavigation()` | never (stable functions) |
| `useCalendarActions()` | `canConfirm` changes |
| `useCalendarSelectedDates()` | selection array changes |
| `Calendar.DayGrid` cells | only affected 2-4 cells |

---

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
