# react-native-fast-calendar

**Headless calendar primitives for React Native** — single date, date range, and multi-date selection with zero bundled UI, surgical re-renders, and pluggable calendar systems (Gregorian, Hijri, Jalali, or your own).

Build the calendar your design system deserves: three mode-specific providers, two hooks each, typed selectors, and a store that owns grid math, bounds, disabled rules, and selection logic so you only wire pixels.

[**Documentation**](https://mahmoudkarout.github.io/react-native-fast-calendar/) · [**Example app**](./example) · [**Contributing**](./CONTRIBUTING.md)

---

## Why this library?

Most React Native calendars ship opinionated chrome you fight to restyle, or they re-render the whole grid on every tap. **react-native-fast-calendar** is the opposite:

- **Headless** — no `<Calendar>` component, no theme object, no label dictionary.
- **Fast** — `useSyncExternalStore` + identity-stable day cells; action callers never subscribe.
- **Explicit** — one provider per selection mode; TypeScript knows `rangeStart` from `selectedDate`.
- **Calendar-system agnostic** — swap Gregorian, Hijri, Jalali, or a custom adapter at runtime.

Works on **iOS**, **Android**, and **React Native Web**.

---

## Features

### Performance

- **Zero wasted re-renders on idle cells** — tap one day; only cells whose state changed update.
- **`useSyncExternalStore`** — granular subscriptions; components read exactly what they need.
- **Stable `use*CalendarActions()`** — `selectDate`, navigation, and `confirm` never trigger re-renders when called from handlers or `React.memo` children.
- **Identity-stable `days.cells`** — unchanged cells keep the same object reference; wrap day cells in `React.memo` for free skip-renders.

### Headless API

- **Three providers** — `SingleDateProvider`, `RangeDateProvider`, `MultipleDateProvider` (no `mode` prop guessing).
- **Two hooks per mode** — `use*CalendarSelector` (read) + `use*CalendarActions` (write, subscription-free).
- **Built-in selectors** — `select*Days`, `select*Months`, `select*Years`, `select*CanConfirm`.
- **Lifecycle callbacks** — `onChange`, `onConfirm`, `onClear` with typed payloads (`Date` + `DateParts` + `systemId`).
- **Live prop sync** — bounds, modifiers, and callbacks update via `configure()` without remounting.

### Selection modes

| Mode | Provider | Best for |
| --- | --- | --- |
| Single | `SingleDateProvider` | Forms, filters, one-day pickers |
| Range | `RangeDateProvider` | Hotels, travel, booking (check-in / check-out) |
| Multiple | `MultipleDateProvider` | Shifts, multi-day events, capped multi-pick |

**Range extras:** `allowSameDay`, `minRangeDays`, `maxRangeDays`, **`disabledInRangeBehavior`** (`reject` \| `include` \| `exclude`) when the span between start and end crosses disabled days.

**Multiple extras:** `maxSelected` cap.

### Bounds & disabled rules

- `minDate` / `maxDate` — inclusive bounds (any input your active `CalendarSystem.from()` accepts).
- `disabledDates` — explicit disabled days.
- `disabledRanges` — inclusive disabled ranges.
- `disabled` — predicate on native `Date`.
- `modifiers` — named matchers → `cell.modifiers[name]` for styling (booked, holiday, …).

### Calendar systems

- **Gregorian** — built in, zero extra date-library deps.
- **Hijri** — opt-in sub-path `react-native-fast-calendar/systems/hijri` (`@tabby_ai/hijri-converter`).
- **Jalali (Persian)** — opt-in sub-path `react-native-fast-calendar/systems/jalali` (`moment-jalaali`).
- **Custom systems** — implement `CalendarSystem<T>` for any calendar.
- **Runtime switch** — `activeSystemId` + `setActiveSystem()`; selection and bounds carry across systems by absolute instant.
- **Accurate built-ins** — Gregorian, Hijri, and Jalali use dedicated converters; not hand-rolled approximations.

### Views & navigation

- Day grid with weekday labels, month/year labels, today highlighting, outside-month dimming.
- Month picker and year pager snapshots via selectors.
- `goPrevMonth` / `goNextMonth`, `goToMonth`, `goToYear`, year page prev/next.
- `firstDayOfWeek` — `0` (Sunday) … `6` (Saturday); **defaults to Monday (`1`)**.

### Developer experience

- **TypeScript-first** — typed providers, snapshots, cell info, and selection payloads.
- **Tree-shakeable sub-paths** for optional calendar systems.
- **Exported grid utilities** — `buildMonthGrid`, `matchDate`, `isBetween`, `getYearPage`, … for advanced layouts.
- **React 18+** — `useSyncExternalStore`; compatible with modern React Native (≥ 0.70).

---

## Install

```bash
yarn add react-native-fast-calendar
# or
npm install react-native-fast-calendar
```

### Requirements

| Peer | Minimum |
| --- | --- |
| `react` | ≥ 18.0 |
| `react-native` | ≥ 0.70 |

### Optional peers

| Package | Import path |
| --- | --- |
| `@tabby_ai/hijri-converter` | `react-native-fast-calendar/systems/hijri` |
| `moment-jalaali` | `react-native-fast-calendar/systems/jalali` |

---

## Quick start (single date)

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  SingleDateProvider,
  selectSingleDays,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-fast-calendar';

function DayGrid() {
  const days = useSingleCalendarSelector(selectSingleDays);
  const { selectDate, goPrevMonth, goNextMonth } = useSingleCalendarActions();

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={goPrevMonth}><Text>‹</Text></Pressable>
        <Text>{days.displayedMonthLabel} {days.displayedYearLabel}</Text>
        <Pressable onPress={goNextMonth}><Text>›</Text></Pressable>
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
    </View>
  );
}

export default function Screen() {
  return (
    <SingleDateProvider onConfirm={({ date }) => console.log(date)}>
      <DayGrid />
    </SingleDateProvider>
  );
}
```

---

## Quick start (date range)

Same day-grid pattern as above, with `RangeDateProvider` and `selectRangeDays` / `useRangeCalendarActions`. Range cells expose `inRange`, `isRangeStart`, and `isRangeEnd`.

```tsx
<RangeDateProvider
  minRangeDays={2}
  maxRangeDays={30}
  disabledInRangeBehavior="reject"
  onConfirm={({ startDate, endDate }) => console.log(startDate, endDate)}
>
  <MyDayGrid />
</RangeDateProvider>
```

When a range would include disabled days in the interior, `disabledInRangeBehavior` controls the outcome:

| Value | Behavior |
| --- | --- |
| `reject` (default) | Second tap ignored; `rangeStart` kept |
| `include` | Full range stored; interior disabled cells stay `isDisabled` + `inRange` |
| `exclude` | `rangeEnd` clamped to the day before the first disabled interior day |

[Full docs → disabled days inside a range](https://mahmoudkarout.github.io/react-native-fast-calendar/docs/hooks/providers#disabled-days-inside-a-range)

---

## Multi-calendar systems

```tsx
import { SingleDateProvider } from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';
import { jalaliSystem } from 'react-native-fast-calendar/systems/jalali';

<SingleDateProvider
  systems={[gregorianSystem, hijriSystem, jalaliSystem]}
  activeSystemId="hijri"
>
  <MyCalendar />
</SingleDateProvider>
```

---

## API overview

### Providers

| Export | Selection |
| --- | --- |
| `SingleDateProvider` | One date |
| `RangeDateProvider` | Start + end |
| `MultipleDateProvider` | Many dates |

**Shared props:** `systems`, `activeSystemId`, `minDate`, `maxDate`, `disabledDates`, `disabledRanges`, `disabled`, `modifiers`, `firstDayOfWeek`, `onChange`, `onConfirm`, `onClear`.

**Range-only:** `initialStart`, `initialEnd`, `allowSameDay`, `minRangeDays`, `maxRangeDays`, `disabledInRangeBehavior`.

**Multiple-only:** `initialDates`, `maxSelected`.

### Hooks (per mode)

| Hook | Re-renders when |
| --- | --- |
| `useSingleCalendarSelector` / `useRangeCalendarSelector` / `useMultipleCalendarSelector` | Selector return value changes |
| `useSingleCalendarActions` / `useRangeCalendarActions` / `useMultipleCalendarActions` | **Never** (stable identity) |

### Selectors

| Single | Range | Multiple |
| --- | --- | --- |
| `selectSingleDays` | `selectRangeDays` | `selectMultipleDays` |
| `selectSingleMonths` | `selectRangeMonths` | `selectMultipleMonths` |
| `selectSingleYears` | `selectRangeYears` | `selectMultipleYears` |
| `selectSingleCanConfirm` | `selectRangeCanConfirm` | `selectMultipleCanConfirm` |

### Types & systems

```ts
// Selection payloads
SingleSelectionPayload | RangeSelectionPayload | MultipleSelectionPayload

// Range policy
DisabledInRangeBehavior  // 'reject' | 'include' | 'exclude'

// Cell info (for custom day components)
SingleDayCellInfo | RangeDayCellInfo | MultipleDayCellInfo

// Calendar systems
gregorianSystem, createGregorianSystem
// + systems/hijri, systems/jalali sub-paths
```

---

## Architecture

Each provider owns one external store. Callbacks live on the store, not in context, so the actions object stays identity-stable for the provider's lifetime.

```
SingleDateProvider / RangeDateProvider / MultipleDateProvider
 └── *CalendarStore
      ├── snapshot  ← use*CalendarSelector
      └── actions   ← use*CalendarActions (no subscription)
```

**Rule of thumb:** day cells that only call `selectDate` should use **`use*CalendarActions` only** — not the selector hook.

---

## Keywords

`react-native` · `calendar` · `date-picker` · `datepicker` · `headless-calendar` · `date-range-picker` · `multi-date-picker` · `gregorian` · `hijri` · `islamic-calendar` · `jalali` · `persian-calendar` · `expo` · `ios` · `android` · `react-native-web` · `typescript`

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License

MIT © [Mahmoud Karout](https://github.com/MahmoudKarout)

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
