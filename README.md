# react-native-fast-calendar

A **headless**, **calendar-system-agnostic**, **fully composable** React Native calendar.

There is one provider component and **two hooks** (plus a handful of pre-built selectors) — that's the entire public API. You bring the UI; the library brings the data, the math, and the store.

---

## Table of Contents

- [Install](#install)
- [Quickstart](#quickstart)
- [The Provider](#the-provider)
- [The Two Hooks](#the-two-hooks)
- [Built-in Selectors](#built-in-selectors)
- [Selection Modes](#selection-modes)
- [Calendar Systems](#calendar-systems)
- [Modifiers](#modifiers)
- [Disabled Dates](#disabled-dates)
- [Performance Notes](#performance-notes)
- [Architecture](#architecture)
- [Contributing](#contributing)

---

## Install

```bash
yarn add react-native-fast-calendar
# or
yarn add react-native-fast-calendar
```

`react-native-fast-calendar` has **zero calendar-system dependencies**. Gregorian is built in; Hijri / Jalali / anything else is a plugin you either consume from `react-native-fast-calendar/systems/*` or implement yourself.

---

## Quickstart

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  CalendarProvider,
  selectCanConfirm,
  selectDays,
  useCalendarActions,
  useCalendarSelector,
} from 'react-native-fast-calendar';

function Calendar() {
  const days = useCalendarSelector(selectDays);
  const { selectDate, goPrevMonth, goNextMonth, confirm } =
    useCalendarActions();
  const canConfirm = useCalendarSelector(selectCanConfirm);

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={goPrevMonth}><Text>‹</Text></Pressable>
        <Text>
          {days.displayedMonthLabel} {days.displayedYearLabel}
        </Text>
        <Pressable onPress={goNextMonth}><Text>›</Text></Pressable>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {days.weekdayLabels.map((l) => (
          <Text key={l} style={{ width: 40, textAlign: 'center' }}>{l}</Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.cells.map((cell) => (
          <Pressable
            key={cell.nativeDate.toISOString()}
            onPress={() => selectDate(cell.date)}
            disabled={cell.isDisabled}
            style={{
              width: 40,
              height: 40,
              opacity: cell.isCurrentMonth ? 1 : 0.4,
              backgroundColor: cell.isSelected ? '#0f172a' : 'transparent',
            }}
          >
            <Text style={{ color: cell.isSelected ? '#fff' : '#0f172a' }}>
              {cell.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={confirm} disabled={!canConfirm}>
        <Text>Done</Text>
      </Pressable>
    </View>
  );
}

export default function Screen() {
  return (
    <CalendarProvider
      mode="single"
      onChange={({ date }) => console.log('selection changed:', date)}
      onConfirm={({ date }) => console.log('confirmed:', date)}
    >
      <Calendar />
    </CalendarProvider>
  );
}
```

---

## The Provider

`<CalendarProvider>` is the only required boundary. It owns the store, normalises inputs against the active calendar system, and routes the external callbacks.

```tsx
<CalendarProvider
  mode="single"                       // "single" | "range" | "multiple"
  systems={[gregorianSystem]}         // optional, defaults to [gregorianSystem]
  initialDate={new Date()}
  minDate={new Date()}
  maxDate={...}
  disabledDates={[...]}
  disabledRanges={[{ start, end }]}
  disabled={(d) => d.getDay() === 0}
  modifiers={{ booked: [...], holiday: (d) => ... }}
  firstDayOfWeek={1}                  // 0=Sun (default), 1=Mon (ISO), 6=Sat
  // range-specific
  allowSameDay
  minRangeDays={2}
  maxRangeDays={14}
  // multiple-specific
  maxSelected={5}
  // callbacks
  onChange={(payload) => /* fires on every selectDate / clear */}
  onConfirm={(payload) => /* fires when actions.confirm() runs */}
  onClear={() => /* fires when actions.clear() runs */}
>
  {/* your hooks-driven UI */}
</CalendarProvider>
```

`CalendarSelectionPayload` (passed to `onChange` / `onConfirm`):

```ts
interface CalendarSelectionPayload {
  date?: Date;          // single mode
  startDate?: Date;     // range mode
  endDate?: Date;       // range mode
  dates?: Date[];       // multiple mode
  systemId: string;     // active calendar system id
}
```

---

## The Two Hooks

Strict separation: every hook is **either data or actions, never both**. This means consumers that only call mutators never subscribe to store state.

| Hook | Returns | Re-renders on |
|------|---------|---------------|
| [`useCalendarSelector`](#usecalendarselector) | whatever the selector returns | only when the selector's value changes (`Object.is`) |
| [`useCalendarActions`](#usecalendaractions) | every mutator (selectDate, navigation, confirm, clear) | **never** — subscription-free, identity-stable |

That's it. There are no per-shape `useCalendarDays` / `useCalendarMonths` / `useCalendarYears` hooks — pass one of the [built-in selectors](#built-in-selectors) (or your own) to `useCalendarSelector` instead.

### useCalendarSelector

Granular subscription to any slice of the store snapshot.

```tsx
import {
  selectCanConfirm,
  selectDays,
  useCalendarSelector,
} from 'react-native-fast-calendar';

const selectedDate = useCalendarSelector((s) => s.selectedDate);
const rangeStart   = useCalendarSelector((s) => s.rangeStart);
const count        = useCalendarSelector((s) => s.selectedDates.length);
const canConfirm   = useCalendarSelector(selectCanConfirm);
const days         = useCalendarSelector(selectDays);
```

The component re-renders only when the selector's return value actually changes (`Object.is`). Selectors against derived views (`selectDays`, `selectMonths`, `selectYears`) read pre-built, identity-stable slices off the snapshot, so unrelated commits don't bump them.

### useCalendarActions

Every mutator the calendar exposes — **subscription-free, identity-stable for the lifetime of the provider**. Safe to pass straight into `React.memo`'d components, `useEffect` deps, or out-of-tree handlers.

```ts
interface CalendarActions {
  // selection
  selectDate: (date: CalendarDateValue | Date | string | number) => void;
  clear: () => void;
  confirm: () => void;
  // navigation
  goPrevMonth: () => void;
  goNextMonth: () => void;
  setDisplayedDate: (date: CalendarDateValue | Date | string | number) => void;
  selectMonth: (index: number) => void;
  selectYear: (year: number) => void;
  prevYearPage: () => void;
  nextYearPage: () => void;
  // synchronous read for handlers (use selectCanConfirm for render)
  isConfirmable: () => boolean;
}
```

`selectDate` accepts native `Date`, ISO string, or the system-native value — it's coerced via the active system's `from(...)` adapter.

---

## Built-in Selectors

Pre-built selectors for the common shapes. Pass them to `useCalendarSelector`. Every selector returns an identity-stable view across commits that don't touch its underlying slice.

| Selector | Returns | Re-renders on |
|---|---|---|
| `selectCanConfirm` | `boolean` — current selection is committable | the slices that gate confirm (mode + relevant selection fields) |
| `selectDays` | `CalendarDays` — `{ weekdayLabels, cells, displayedMonthLabel, displayedYearLabel }` | day-grid slices (selection, displayed month, bounds, modifiers) |
| `selectMonths` | `CalendarMonths` — `{ months, activeMonth }` | system or displayed-month changes |
| `selectYears` | `CalendarYears` — `{ years, activeYear }` | displayed-year changes |

```ts
interface CalendarDays {
  weekdayLabels: readonly string[];
  cells: readonly DayCellInfo[];
  displayedMonthLabel: string;
  displayedYearLabel: string;
}

interface DayCellInfo {
  date: CalendarDateValue;     // active-system value
  nativeDate: Date;            // for keys, comparisons, formatting
  label: string;               // already localised
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;         // single, range endpoint, or multiple member
  inRange: boolean;            // strictly between range endpoints
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;
  modifiers: Readonly<Record<string, boolean>>;
}

interface CalendarMonths {
  months: readonly { index: number; label: string }[];
  activeMonth: number;
}

interface CalendarYears {
  years: readonly number[];     // YEAR_PAGE_SIZE entries
  activeYear: number;
}
```

For anything bespoke, write your own narrow selector — `useCalendarSelector((s) => s.system.id)`, `useCalendarSelector((s) => s.selectedDates.length)`, etc. The snapshot type (`CalendarSnapshot`) is exported for typing them.

---

## Selection Modes

```tsx
// Single date
<CalendarProvider mode="single" onConfirm={({ date }) => {}} />

// Date range
<CalendarProvider
  mode="range"
  minRangeDays={2}
  maxRangeDays={14}
  allowSameDay
  onConfirm={({ startDate, endDate }) => {}}
/>

// Multiple dates
<CalendarProvider
  mode="multiple"
  maxSelected={5}
  onConfirm={({ dates }) => {}}
/>
```

---

## Calendar Systems

### Gregorian (default)

```tsx
import {
  CalendarProvider,
  createGregorianSystem,
  gregorianSystem,
} from 'react-native-fast-calendar';

<CalendarProvider />                              // implicit Gregorian
<CalendarProvider systems={[gregorianSystem]} />  // explicit

const french = createGregorianSystem({
  label: 'Grégorien',
  monthLabels: ['Janvier', 'Février', /* … */],
  weekdayLabels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
});
<CalendarProvider systems={[french]} />
```

### Hijri

```bash
yarn add @tabby_ai/hijri-converter
```

```tsx
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';
import {
  CalendarProvider,
  gregorianSystem,
} from 'react-native-fast-calendar';

<CalendarProvider systems={[gregorianSystem, hijriSystem]} />
```

### Jalali (Persian / Solar Hijri)

```bash
yarn add moment-jalaali
```

```tsx
import { jalaliSystem } from 'react-native-fast-calendar/systems/jalali';
<CalendarProvider systems={[gregorianSystem, jalaliSystem]} />
```

### Custom

Implement `CalendarSystem<T>` for Chinese, Ethiopian, or anything else — no plugin required:

```tsx
import type { CalendarSystem } from 'react-native-fast-calendar';

const persianSystem: CalendarSystem<PersianDate> = {
  id: 'persian',
  label: 'Persian',
  today() { /* … */ },
  fromNativeDate(d) { /* … */ },
  from(input) { /* … */ },
  year(d) { /* … */ },
  month(d) { /* 0-based */ },
  day(d) { /* 1-based */ },
  weekday(d) { /* 0=Sun..6=Sat */ },
  daysInMonth(d) { /* … */ },
  withYear(d, year) { /* … */ },
  withMonth(d, month) { /* … */ },
  withDay(d, day) { /* … */ },
  addMonths(d, n) { /* … */ },
  addYears(d, n) { /* … */ },
  isSame(a, b) { /* … */ },
  isBefore(a, b) { /* … */ },
  isAfter(a, b) { /* … */ },
  monthLabels() { /* 12 strings */ },
  weekdayLabels() { /* 7 strings */ },
  formatDay(d) { /* … */ },
  formatMonthYear(d) { /* … */ },
  toNativeDate(d) { /* … */ },
};
```

---

## Modifiers

Tag dates with named flags surfaced on `DayCellInfo.modifiers`:

```tsx
<CalendarProvider
  modifiers={{
    booked:  [new Date(2024, 4, 7), new Date(2024, 4, 8)],
    holiday: { start: new Date(2024, 11, 24), end: new Date(2024, 11, 26) },
    weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
  }}
/>
```

Then in your cell renderer:

```tsx
days.cells.map((cell) => (
  <View
    style={[
      cell.modifiers.booked  && styles.booked,
      cell.modifiers.holiday && styles.holiday,
      cell.modifiers.weekend && styles.weekend,
    ]}
  />
));
```

Matchers can be `Date[]`, `{ start, end }[]`, or a `(nativeDate: Date) => boolean` predicate.

---

## Disabled Dates

`minDate` / `maxDate` / `disabledDates` / `disabledRanges` / a `disabled` predicate compose with OR semantics. Disabled dates are silently ignored on `selectDate`.

```tsx
<CalendarProvider
  mode="single"
  minDate={new Date()}
  maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
  disabledDates={[new Date(2024, 4, 1)]}
  disabledRanges={[{ start: new Date(2024, 11, 24), end: new Date(2024, 11, 26) }]}
  disabled={(d) => d.getDay() === 0 || d.getDay() === 6}
/>
```

Each cell exposes the resolved `isDisabled` boolean.

---

## Performance Notes

The library is built around `useSyncExternalStore` for granular, surgical re-renders. The hook split exists specifically so action-only consumers don't re-render on selection changes.

**Rule of thumb:** in any component that only needs to *call* the calendar (a tappable cell, a "Today" button, a confirm bar), use `useCalendarActions()` only. It returns a stable object and never causes a re-render.

```tsx
// ✅ MonthList renders exactly once for the lifetime of the provider.
function MonthList() {
  const { selectDate } = useCalendarActions();
  return <FlashList renderItem={({ item }) => <DayCell selectDate={selectDate} ... />} />;
}

// ✅ Each DayCell only re-renders when its own selected state flips.
const DayCell = memo(function DayCell({ date, selectDate }) {
  const isSelected = useCalendarSelector(
    (s) => s.selectedDate && s.system.isSame(s.selectedDate, date)
  );
  return <Pressable onPress={() => selectDate(date)} ... />;
});
```

---

## Architecture

```
┌──────────────────────────────────────────┐
│  <CalendarProvider systems modifiers …>  │  ◄── boundary
│  ┌────────────────────────────────────┐  │
│  │  CalendarConfigContext             │  │  ◄── firstDayOfWeek + modifiers
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  CalendarStoreContext              │  │  ◄── store instance
│  │  └── CalendarStore                 │  │      (useSyncExternalStore)
│  │       ├── snapshot                 │  │
│  │       └── stable action methods    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Hooks:                                  │
│   - useCalendarSelector(slice)           │  → re-render on slice change
│   - useCalendarActions()                 │  → never re-renders the consumer
│                                          │
│  Built-in selectors (for the above):     │
│   - selectCanConfirm                     │
│   - selectDays / selectMonths / Years    │
└──────────────────────────────────────────┘
```

External callbacks (`onChange`, `onConfirm`, `onClear`) live on the store, not in context, so action methods stay referentially stable across the lifetime of the provider.

---

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
