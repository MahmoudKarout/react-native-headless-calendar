# react-native-fast-calendar

A **headless**, **calendar-system-agnostic**, **fully composable** React Native
calendar.

- **Bring your own UI primitives** — `View`, `Text`, `Pressable`, `Icon`. The
  package ships unstyled RN defaults and lets you override every visual atom.
- **Bring your own calendar system** — Gregorian is bundled. Hijri ships in an
  optional sub-export. Chinese, Ethiopian, Persian, ... are 80 lines of
  consumer code each (implement the `CalendarSystem` interface).
- **Bring your own theme & strings** — pass theme tokens and labels through
  `<Calendar.Root>`. Zero implicit i18n dep.
- **Bring your own actions** — confirm/clear buttons can live anywhere
  (sticky footers, dialogs) and still drive the same store.
- **Performance first** — external store + `useSyncExternalStore` selectors
  mean tapping a date re-renders only ~2-4 day cells. The header, view
  switcher, action buttons, and system switcher all skip re-renders unless
  their slice actually changed.

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
import { Calendar } from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';

const systems = [gregorianSystem];

function MyDatePicker() {
  return (
    <Calendar.Root
      mode="single"
      onConfirm={({ date }) => console.log('Picked:', date)}
      systems={systems}
    >
      <Calendar.Header />
      <Calendar.View />
      <Calendar.Actions />
    </Calendar.Root>
  );
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
  <Calendar.SystemSwitcher />
  <Calendar.Header />
  <Calendar.View />
  <Calendar.Actions />
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

// Wrap moment-hijri, an Intl-based implementation, your own tables, ...
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
with no further changes. The store, header, day grid, month grid, year
grid, and system switcher all work against the interface — they never
inspect your date shape.

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

## Headless: bring your own primitives

```tsx
import { Calendar } from 'react-native-fast-calendar';
import { Text as MyText, Pressable as MyPressable } from 'my-design-system';
import { Icon as MyIcon } from 'my-icon-set';

<Calendar.Root
  primitives={{
    Text: MyText,
    Pressable: MyPressable,
    Icon: ({ name, ...rest }) => (
      <MyIcon
        {...rest}
        name={name === 'next' ? 'chevron-right' : 'chevron-left'}
      />
    ),
  }}
  systems={[gregorianSystem]}
>
  ...
</Calendar.Root>;
```

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

## Fully composed (header parts placed independently)

```tsx
<Calendar.Root systems={systems}>
  <MyToolbar>
    <Calendar.Header.MonthLabel />
    <Calendar.Header.YearLabel />
  </MyToolbar>

  <Calendar.View />

  <MyStickyBar>
    <Calendar.Header.PrevButton />
    <Calendar.Header.NextButton />
  </MyStickyBar>

  <MyDialogActions>
    <Calendar.Actions.ClearButton />
    <Calendar.Actions.ConfirmButton />
  </MyDialogActions>
</Calendar.Root>
```

The provider boundary is what matters — not the visual nesting. Any descendant
of `<Calendar.Root>` can call `useCalendarStore()` / `useCalendarSelector()`
to participate in the calendar's state.

## Custom day cell

```tsx
import { useCalendarStore } from 'react-native-fast-calendar';

<Calendar.View
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
│  <Calendar.Root systems primitives ...> │  ◄── only required parent
│  ┌───────────────────────────────────┐  │
│  │  CalendarConfigContext            │  │  ◄── primitives, theme, labels
│  │  (memoised; rarely changes)       │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  CalendarStoreContext             │  │  ◄── store INSTANCE (never changes)
│  │  └── CalendarStore                │  │
│  │       (useSyncExternalStore)      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Compound parts subscribe via           │
│  useCalendarSelector(s => slice)        │
│  → only re-render on slice change       │
└─────────────────────────────────────────┘
```

| Part                              | Re-renders on…                    |
| --------------------------------- | --------------------------------- |
| `Calendar.SystemSwitcher`         | system change only                |
| `Calendar.Header.MonthLabel`      | month text change only            |
| `Calendar.Header.YearLabel`       | year/page change only             |
| `Calendar.Header.PrevButton/Next` | never (stable)                    |
| `Calendar.View`                   | view switch only                  |
| `Calendar.DayGrid` cells          | only the affected 2-4 cells       |
| `Calendar.Actions.ConfirmButton`  | only when disabled state flips    |
| `Calendar.Actions.ClearButton`    | never (stable)                    |

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
