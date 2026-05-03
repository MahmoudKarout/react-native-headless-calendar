# react-native-fast-calendar

A **headless**, **calendar-system-agnostic**, **fully composable** React Native
calendar.

The library ships exactly **two rendered components** —
`<Calendar.Root>` (the provider) and `<Calendar.DayGrid>` (the 6×7 day
matrix). Every other piece of UI a calendar typically needs — the system
switcher, the prev/next buttons, the month/year header labels, the
month picker, the year picker, the confirm/clear buttons — is exposed as
a `useCalendar*` hook so you bring your own UI and your own design system
on top of the same store.

- **Bring your own buttons & icons** — there are no built-in chevrons, pills,
  or action bars. Hooks expose data + functions; you render whatever fits.
- **Replace pieces, not the whole tree** — the `components` slot map on
  `<Calendar.Root>` lets you swap `WeekdayHeader`, `DayCell`,
  `WeekNumberCell`, `MonthCaption`, etc. independently. No fork required.
- **Single / range / multi selection**, with `minRangeDays`,
  `maxRangeDays`, `maxSelected`, and a dynamic `disabled(date)` predicate.
- **Modifiers** — tag dates as `booked`, `holiday`, … with arrays,
  `{ from, to }` ranges, or predicates; each tag flips a per-cell
  boolean you can read in `renderDay` or a custom `DayCell`.
- **Layout knobs** — `firstDayOfWeek`, `showOutsideDays`, `fixedWeeks`,
  `showWeekNumbers`, `numberOfMonths`, and a swipeable mode for the
  built-in day grid.
- **Bring your own calendar system** — Gregorian is bundled. Hijri ships in an
  optional sub-export. Chinese, Ethiopian, Persian, ... are 80 lines of
  consumer code each (implement the `CalendarSystem` interface).
- **Bring your own theme & strings** — pass theme tokens and labels through
  `<Calendar.Root>`. Zero implicit i18n dep.
- **Performance first** — external store + `useSyncExternalStore` selectors
  mean tapping a date re-renders only ~2-4 day cells. Header labels, system
  switcher, action buttons, etc. all skip re-renders unless their slice
  actually changed.

---

## Install

```bash
npm install react-native-fast-calendar
# or
yarn add react-native-fast-calendar
```

`react-native-fast-calendar` has **zero calendar-system dependencies**.
Gregorian is built in; everything else (Hijri, Persian, Chinese, …) is a
plugin you either consume from `react-native-fast-calendar/systems/*` (with a
converter you install yourself) or implement in your own code by satisfying
the `CalendarSystem<T>` contract.

## Quickstart

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  Calendar,
  useCalendarActions,
  useCalendarMonthLabel,
  useCalendarNavigation,
  useCalendarSelector,
  useCalendarYearLabel,
} from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';

const systems = [gregorianSystem];

export function MyDatePicker() {
  return (
    <Calendar.Root
      mode="single"
      onConfirm={({ date }) => console.log('Picked:', date)}
      systems={systems}
    >
      <MyHeader />
      <MyView />
      <MyConfirmBar />
    </Calendar.Root>
  );
}

function MyHeader() {
  const month = useCalendarMonthLabel();
  const year = useCalendarYearLabel();
  const { goPrev, goNext } = useCalendarNavigation();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {month.isVisible && (
          <Pressable onPress={month.toggle}>
            <Text>{month.label}</Text>
          </Pressable>
        )}
        <Pressable onPress={year.toggle}>
          <Text>{year.label}</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Pressable onPress={goPrev}><Text>‹</Text></Pressable>
        <Pressable onPress={goNext}><Text>›</Text></Pressable>
      </View>
    </View>
  );
}

function MyView() {
  const view = useCalendarSelector((s) => s.view);
  if (view === 'day') return <Calendar.DayGrid />;
  if (view === 'month') return <MyMonthPicker />;
  return <MyYearPicker />;
}

function MyConfirmBar() {
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

`MyMonthPicker` and `MyYearPicker` are documented under
[Month / year pickers](#month--year-pickers) below.

## The hooks

Every `useCalendar*` hook must be called inside `<Calendar.Root>`.

| Hook | Returns | Re-renders on |
| ---- | ------- | ------------- |
| `useCalendarStore()` | the underlying store instance | never |
| `useCalendarSelector(s => slice)` | your selected slice | when the slice's identity changes (`Object.is`) |
| `useCalendarConfig()` | merged config (theme, labels, systems, callbacks, testID, modifiers, components, …) | when the config object identity changes |
| `useCalendarTheme()` / `useCalendarLabels()` | their slice of the config | same as `useCalendarConfig` |
| `useCalendarComponents()` | the merged `components` slot map (`WeekdayHeader`, `DayCell`, …) | when slot identities change |
| `useCalendarFirstDayOfWeek()` | `0..6` matching `<Calendar.Root firstDayOfWeek>` | when the prop changes |
| `useCalendarWeekdayLabels()` | weekday labels for the active system, rotated to `firstDayOfWeek` | when the active system or `firstDayOfWeek` changes |
| `useCalendarWeekNumbers()` | 6 ISO week numbers matching the displayed month's rows | when the displayed month / system / `firstDayOfWeek` changes |
| `useCalendarActions()` | `{ confirm, clear, canConfirm }` | only when `canConfirm` flips |
| `useCalendarNavigation()` | `{ goPrev, goNext }` (view + RTL aware) | never (functions are stable) |
| `useCalendarMonthLabel()` | `{ label, isVisible, toggle }` | when the month text changes or the view enters/leaves `'year'` |
| `useCalendarYearLabel()` | `{ label, toggle }` | when the year text changes (incl. year-page label transitions) |
| `useCalendarSystemSwitcher()` | `{ systems, activeId, setActive }` | when the active system id changes |
| `useCalendarMonthPicker()` | `{ months, activeMonth, selectMonth }` | when the active system or active month changes |
| `useCalendarYearPicker()` | `{ years, activeYear, selectYear }` | when the active year changes (incl. paging) |
| `useCalendarSelectedDates()` | `readonly T[]` of selected dates (multi-select mode) | when the selected-dates array identity changes |

### Confirm / clear actions

```tsx
import {
  useCalendarActions,
  useCalendarLabels,
} from 'react-native-fast-calendar';

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

| Returned | Description |
| -------- | ----------- |
| `confirm()`  | Fires the `onConfirm` you passed to `<Calendar.Root>` with the latest payload. No-op if you didn't pass one. |
| `clear()`    | Wipes selection state and fires `onClear` (if provided). |
| `canConfirm` | `true` when the current selection is confirmable. Granular — only flips when the boolean changes. |

The hook reads the latest snapshot at call time, so the returned function
identities are stable and safe to pass to memoised buttons.

### Header — prev / next + month / year labels

```tsx
import {
  useCalendarMonthLabel,
  useCalendarNavigation,
  useCalendarYearLabel,
} from 'react-native-fast-calendar';

function MyHeader() {
  const month = useCalendarMonthLabel();
  const year = useCalendarYearLabel();
  const { goPrev, goNext } = useCalendarNavigation();

  return (
    <MyToolbar>
      <MyButtonGroup>
        {month.isVisible && (
          <MyButton onPress={month.toggle}>{month.label}</MyButton>
        )}
        <MyButton onPress={year.toggle}>{year.label}</MyButton>
      </MyButtonGroup>
      <MyButtonGroup>
        <MyChevron direction="left"  onPress={goPrev} />
        <MyChevron direction="right" onPress={goNext} />
      </MyButtonGroup>
    </MyToolbar>
  );
}
```

`goPrev` / `goNext` automatically step the right amount for the current view
(month in day view, year in month view, year-page in year view) and respect
`I18nManager.isRTL`.

`month.isVisible` is `false` when the year picker is open, matching the
historical behaviour where the month label hid because each year-page
transition would otherwise jump it confusingly.

### System switcher

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

`setActive` silently ignores ids that aren't in the configured systems list
and fires `onSystemChange` if you provided one to `<Calendar.Root>`.

### Month / year pickers

```tsx
import {
  useCalendarMonthPicker,
  useCalendarYearPicker,
} from 'react-native-fast-calendar';

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
        <MyCell
          key={y}
          active={y === activeYear}
          onPress={() => selectYear(y)}
        >
          {y}
        </MyCell>
      ))}
    </MyGrid>
  );
}
```

Selecting a month or year jumps the displayed date and switches the view
back to `'day'` automatically. Year paging (forward / backward across
12-year windows) is handled by `useCalendarNavigation()` — it switches
behaviour to year-page steps when the active view is `'year'`.

### Swipeable months

Pass `swipeable` to `<Calendar.DayGrid>` and the day cells render inside a
horizontal `FlatList`. The user can drag left/right to step to the next /
previous month, and the weekday header stays fixed at the top.

```tsx
<Calendar.Root systems={[gregorianSystem]}>
  <MyHeader />
  <Calendar.DayGrid swipeable />
  <MyConfirmBar />
</Calendar.Root>
```

Each swipe dispatches `store.changeMonth(±1)`, so it composes with the
arrow buttons returned by `useCalendarNavigation()` and any other
external navigation — the FlatList always re-centres on the active month
after a `displayed` change. Defaults to `false` to preserve the existing
static layout for callers who already build their own pagination.

### First day of the week

Different locales start the week on different days — Sunday in the US,
Monday in most of Europe, Saturday across much of MENA. Pass
`firstDayOfWeek` to `<Calendar.Root>` to pick the column the day grid
(and its weekday header) starts at. `0` = Sunday, `1` = Monday, …,
`6` = Saturday. Defaults to `0`.

```tsx
<Calendar.Root firstDayOfWeek={1} systems={[gregorianSystem]}>
  <Calendar.DayGrid />
</Calendar.Root>
```

When you build a custom day grid (or a custom weekday header) instead of
using `<Calendar.DayGrid>`, the same offset is exposed through hooks so
your columns stay in lockstep with the cell math:

```tsx
import {
  buildMonthGrid,
  useCalendarFirstDayOfWeek,
  useCalendarSelector,
  useCalendarWeekdayLabels,
} from 'react-native-fast-calendar';

function MyWeekdayHeader() {
  // Already rotated to the active firstDayOfWeek.
  const labels = useCalendarWeekdayLabels();
  return labels.map((l) => <MyHeaderCell key={l}>{l}</MyHeaderCell>);
}

function MyDayGrid() {
  const firstDayOfWeek = useCalendarFirstDayOfWeek();
  const cells = useCalendarSelector((s) =>
    buildMonthGrid(s.system, s.displayed, firstDayOfWeek)
  );
  return cells.map(/* ... */);
}
```

## Using the Hijri plugin

The Hijri plugin lives at `react-native-fast-calendar/systems/hijri`. It needs
a Hijri ↔ Gregorian converter that **you install and inject**. The package
itself never imports a converter.

```bash
# 1. Install a converter (recommended: ~2KB, zero deps, Umm al-Qura tables)
yarn add @tabby_ai/hijri-converter
```

```tsx
// 2. Inject it when constructing the system
import * as converter from '@tabby_ai/hijri-converter';

import { Calendar } from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { createHijriSystem } from 'react-native-fast-calendar/systems/hijri';

const hijri = createHijriSystem({ converter });

<Calendar.Root mode="range" systems={[gregorianSystem, hijri]}>
  <MySystemSwitcher /> {/* useCalendarSystemSwitcher() */}
  <MyHeader />         {/* useCalendarMonthLabel + …YearLabel + …Navigation */}
  <MyView />           {/* renders <Calendar.DayGrid> + your month/year pickers */}
  <MyConfirmBar />     {/* useCalendarActions() */}
</Calendar.Root>;
```

Calling `createHijriSystem()` without a converter throws:

```
[react-native-fast-calendar/systems/hijri] createHijriSystem requires a `converter`
option. Install a Hijri converter and pass it in: ...
```

Any object implementing the two-method `HijriConverter` interface works:

```tsx
import type { HijriConverter } from 'react-native-fast-calendar/systems/hijri';

const myConverter: HijriConverter = {
  gregorianToHijri({ year, month, day }) {
    /* ... return { year, month, day } (1-based months) */
  },
  hijriToGregorian({ year, month, day }) {
    /* ... return { year, month, day } (1-based months) */
  },
};

const hijri = createHijriSystem({ converter: myConverter });
```

## Add your own calendar (Persian, Chinese, Ethiopian, …)

Anything that satisfies `CalendarSystem<T>` plugs into `<Calendar.Root>`
with no further changes. The store, day grid, and every hook work
against the interface — they never inspect your date shape.

```tsx
import { Calendar, type CalendarSystem } from 'react-native-fast-calendar';

interface MyDate {
  /* whatever shape suits your system */
}

const myCalendar: CalendarSystem<MyDate> = {
  id: 'my-system',
  label: 'My System',
  today() { /* ... */ },
  fromNativeDate(d) { /* ... */ },
  from(input) { /* ... */ },
  year(d)        { /* ... */ },
  month(d)       { /* 0-based */ },
  day(d)         { /* 1-based */ },
  weekday(d)     { /* 0=Sun..6=Sat */ },
  daysInMonth(d) { /* ... */ },
  withYear(d, year)  { /* ... */ },
  withMonth(d, month){ /* ... */ },
  withDay(d, day)    { /* ... */ },
  addMonths(d, n)    { /* ... */ },
  addYears(d, n)     { /* ... */ },
  isSame(a, b)       { /* day granularity */ },
  isBefore(a, b)     { /* day granularity */ },
  isAfter(a, b)      { /* day granularity */ },
  monthLabels()      { /* 12 strings, ordered */ },
  weekdayLabels()    { /* 7 strings, indexed by weekday() */ },
  formatDay(d)       { /* day-cell text */ },
  formatMonthYear(d) { /* header text */ },
  toNativeDate(d)    { /* round-trip to JS Date */ },
};

<Calendar.Root systems={[myCalendar]}> ... </Calendar.Root>
```

The two reference adapters in `src/systems/gregorian.ts` and
`src/systems/hijri.ts` are good starting templates.

## Selection modes

`<Calendar.Root mode>` chooses how taps on day cells are interpreted.

```tsx
<Calendar.Root mode="single"   /* default */> ... </Calendar.Root>
<Calendar.Root mode="range">                    ... </Calendar.Root>
<Calendar.Root mode="multiple">                 ... </Calendar.Root>
```

| Mode | Store reads | Confirm payload |
| ---- | ----------- | --------------- |
| `'single'`   | `selectedDate`              | `{ date, nativeDate, systemId }` |
| `'range'`    | `selectedStart`, `selectedEnd` | `{ start, end, nativeStart, nativeEnd, systemId }` |
| `'multiple'` | `useCalendarSelectedDates()` (or `selectedDates` selector) | `{ dates, systemId }` |

### Range constraints

`minRangeDays` / `maxRangeDays` reject ranges shorter / longer than the
specified day count *at the moment the second tap completes the range* —
mid-pick (only the start is set) is always allowed, so the user can
walk forward through dates and have the constraint kick in only when
they try to anchor an invalid end.

```tsx
<Calendar.Root mode="range" minRangeDays={2} maxRangeDays={14}>
  ...
</Calendar.Root>
```

### Multi-select

```tsx
import {
  Calendar,
  useCalendarSelectedDates,
} from 'react-native-fast-calendar';

function MultiSelection() {
  const dates = useCalendarSelectedDates<Date>();
  return <Text>{dates.length} day(s) selected</Text>;
}

<Calendar.Root
  initialDates={[new Date()]}
  maxSelected={5}
  mode="multiple"
  onConfirm={({ dates }) => console.log(dates)}
>
  <Calendar.DayGrid />
  <MultiSelection />
</Calendar.Root>
```

`maxSelected` silently no-ops further taps once the cap is reached.
Tapping an already-selected date toggles it off.

### Disabling dates dynamically

The `disabled` prop accepts a predicate `(nativeDate: Date) => boolean`.
Disabled cells render with `info.isDisabled === true` and refuse selection
(the store skips `selectDate` for them, even if your custom day cell
forwards a tap by mistake):

```tsx
<Calendar.Root
  disabled={(d) => d.getTime() < Date.now() /* no past days */}
  mode="single"
>
  <Calendar.DayGrid />
</Calendar.Root>
```

The predicate is stabilised internally with `useStableCallback`, so it can
close over fresh React state without forcing the entire grid to re-render.

## Layout options

Pass any of these to `<Calendar.Root>` (where they affect every grid in
the tree) or to `<Calendar.DayGrid>` (where they're per-grid).

| Prop | On | Default | Effect |
| ---- | -- | ------- | ------ |
| `firstDayOfWeek` | `<Calendar.Root>` | `0` (Sun) | Column the week starts on. |
| `showOutsideDays` | `<Calendar.Root>` | `true` | When `false`, leading/trailing cells from the previous / next month render as invisible spacers. |
| `fixedWeeks` | `<Calendar.Root>` | `true` | When `false`, trailing all-outside rows are dropped (months collapse to 4-6 rows). |
| `showWeekNumbers` | `<Calendar.DayGrid>` | `false` | Renders an extra leading column with ISO 8601 week numbers. |
| `numberOfMonths` | `<Calendar.DayGrid>` | `1` | Renders N consecutive months side-by-side (mutually exclusive with `swipeable`). |

```tsx
<Calendar.Root fixedWeeks={false} firstDayOfWeek={1} showOutsideDays={false}>
  <Calendar.DayGrid numberOfMonths={2} showWeekNumbers />
</Calendar.Root>
```

## Modifiers — tag dates with custom flags

Modifiers are named matchers that flip booleans on each `DayCellInfo`.
Attach them once on `<Calendar.Root>`; read them per-cell from
`info.modifiers.<name>` inside `renderDay` or a custom `DayCell` slot.

```tsx
const BOOKED = [new Date(2024, 4, 7), new Date(2024, 4, 8)];

<Calendar.Root
  modifiers={{
    booked: BOOKED,
    weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
    summer: { from: new Date(2024, 5, 1), to: new Date(2024, 7, 31) },
  }}
>
  <Calendar.DayGrid
    renderDay={(info) => (
      <View style={info.modifiers.booked && { backgroundColor: '#FECACA' }}>
        <Text>{info.label}</Text>
      </View>
    )}
  />
</Calendar.Root>
```

A `CalendarMatcher` is one of:
- An array of native `Date`s (exact-day match).
- An array of `{ from, to }` ranges (inclusive at both ends).
- A predicate `(nativeDate: Date) => boolean`.

Modifiers never affect selection — combine them with `disabled` if you
want a "booked" day to also be unselectable.

## Component slots — replace pieces, not the whole tree

Instead of overriding the entire `<Calendar.DayGrid>`, swap individual
sub-components via the `components` prop on `<Calendar.Root>`:

```tsx
import type { CalendarComponents } from 'react-native-fast-calendar';

const components: CalendarComponents = {
  WeekdayHeader: ({ labels }) => (
    <View style={{ flexDirection: 'row' }}>
      {labels.map((l) => (
        <Text key={l} style={{ flex: 1, textAlign: 'center' }}>{l}</Text>
      ))}
    </View>
  ),
  DayCell: ({ info, onSelect }) => (
    <Pressable
      disabled={info.isDisabled}
      onPress={() => onSelect(info.date)}
    >
      <Text>{info.label}</Text>
    </Pressable>
  ),
  WeekNumberCell: ({ weekNumber }) => (
    <Text style={{ opacity: 0.4 }}>w{weekNumber}</Text>
  ),
  MonthCaption: ({ label }) => <Text>{label}</Text>,
};

<Calendar.Root components={components}>
  <Calendar.DayGrid showWeekNumbers />
</Calendar.Root>
```

Available slots:

| Slot | Props | When it renders |
| ---- | ----- | --------------- |
| `WeekdayHeader` | `{ labels, showWeekNumbers }` | Replaces the entire weekday row. |
| `WeekdayCell`   | `{ label, index }`            | Replaces each cell inside the default `WeekdayHeader`. |
| `DayCell`       | `{ info, onSelect }`          | Falls back to `<Calendar.DayGrid renderDay>` if also provided. |
| `WeekNumberCell`| `{ weekNumber, rowIndex }`    | Only when `showWeekNumbers` is on. |
| `MonthCaption`  | `{ label, monthDate, monthIndex }` | Renders above each month, useful with `numberOfMonths > 1`. |

`renderDay` on `<Calendar.DayGrid>` still wins over `components.DayCell`
when both are passed — a per-grid renderer overrides the global slot.

## Custom theme

```tsx
<Calendar.Root
  theme={{
    colors: { primary: '#FF6F00', rangeBackground: '#FFE0B2' },
    cellSize: 44,
    borderRadius: 8,
  }}
  systems={[gregorianSystem]}
>
  ...
</Calendar.Root>
```

## Localised strings

```tsx
<Calendar.Root
  labels={{
    confirm: 'Valider',
    clear: 'Effacer',
    prev: 'Précédent',
    next: 'Suivant',
  }}
  systems={[
    createGregorianSystem({
      label: 'Grégorien',
      monthLabels: ['Janvier', 'Février', /* ... */],
      weekdayLabels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    }),
  ]}
>
  ...
</Calendar.Root>
```

## Custom day cell

```tsx
import { Calendar, useCalendarStore } from 'react-native-fast-calendar';

<Calendar.DayGrid
  renderDay={(info) => (
    <MyFancyCell
      key={info.nativeDate.toISOString()}
      label={info.label}
      isSelected={info.isSelected}
      isToday={info.isToday}
      isInRange={info.inRange}
      isDisabled={info.isDisabled}
      onPress={() => store.selectDate(info.date)}
    />
  )}
/>;
```

## Surfacing custom UI that needs calendar state

```tsx
import {
  useCalendarSelector,
  useCalendarStore,
} from 'react-native-fast-calendar';

function TodayShortcut() {
  const store = useCalendarStore();
  const onPress = () => store.selectDate(store.getSnapshot().system.today());
  return <Button onPress={onPress}>Today</Button>;
}

function SelectionPreview() {
  const date = useCalendarSelector((s) => s.selectedDate);
  return <Text>{date ? 'Selected!' : 'Tap a date'}</Text>;
}
```

Both can live anywhere inside `<Calendar.Root>` — sibling, ancestor of the
grid, inside a different dialog — and stay in sync.

## Architecture

```
┌─────────────────────────────────────────┐
│  <Calendar.Root systems components ...> │  ◄── only required parent
│  ┌───────────────────────────────────┐  │
│  │  CalendarConfigContext            │  │  ◄── theme, labels, modifiers, components, …
│  │  (memoised; rarely changes)       │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  CalendarStoreContext             │  │  ◄── store INSTANCE (never changes)
│  │  └── CalendarStore                │  │
│  │       (useSyncExternalStore)      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Hooks subscribe via                    │
│  useCalendarSelector(s => slice)        │
│  → only re-render on slice change       │
└─────────────────────────────────────────┘
```

| Consumer (your code calling …)        | Re-renders on…                    |
| ------------------------------------- | --------------------------------- |
| `useCalendarSystemSwitcher()`         | active system id change only      |
| `useCalendarMonthLabel()`             | displayed month change OR view enters/leaves `'year'` |
| `useCalendarYearLabel()`              | displayed year text change        |
| `useCalendarNavigation()`             | never (functions are stable)      |
| `useCalendarMonthPicker()`            | active month / system change      |
| `useCalendarYearPicker()`             | active year change (incl. paging) |
| `useCalendarActions()`                | only when `canConfirm` flips      |
| `useCalendarSelectedDates()`          | only when `selectedDates` array identity changes |
| `useCalendarComponents()`             | only when slot identities change  |
| `useCalendarWeekNumbers()`            | only when displayed month / system / `firstDayOfWeek` changes |
| `<Calendar.DayGrid />` cells          | only the affected 2-4 cells       |

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
