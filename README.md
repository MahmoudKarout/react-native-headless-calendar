# react-native-fast-calendar

A headless, calendar-system-agnostic React Native calendar.

**Three providers, two hooks per mode, built-in selectors.** You bring the UI; the library brings the data, the math, and the store.

- Zero required date-library deps — Gregorian is built in; Hijri / Jalali are opt-in sub-paths
- `useSyncExternalStore` under the hood — surgical re-renders; action callers never subscribe
- Headless — every cell, header, and footer is yours to style
- Single, range, or multiple selection via dedicated providers
- [Full docs](https://mahmoudkarout.github.io/react-native-fast-calendar/) · [Example app](./example)

## Install

```bash
yarn add react-native-fast-calendar
```

### Requirements

| Peer | Minimum | Why |
| --- | --- | --- |
| `react` | **≥ 18.0** | `useSyncExternalStore` |
| `react-native` | **≥ 0.70** | React 18 baseline |

Optional peers (only when you import the matching system):

| Peer | Needed for |
| --- | --- |
| `@tabby_ai/hijri-converter` | `react-native-fast-calendar/systems/hijri` |
| `moment-jalaali` | `react-native-fast-calendar/systems/jalali` |
| `@shopify/flash-list` | optional, for virtualised month lists in your app |

## 30-second tour (single date)

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  SingleDateProvider,
  selectSingleDays,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-fast-calendar';

function Calendar() {
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
      <Calendar />
    </SingleDateProvider>
  );
}
```

## API surface

```ts
// Single
export {
  SingleDateProvider,
  useSingleCalendarSelector,
  useSingleCalendarActions,
  selectSingleDays,
  selectSingleMonths,
  selectSingleYears,
  selectSingleCanConfirm,
} from 'react-native-fast-calendar';

// Range
export {
  RangeDateProvider,
  useRangeCalendarSelector,
  useRangeCalendarActions,
  selectRangeDays,
  // …
} from 'react-native-fast-calendar';

// Multiple
export {
  MultipleDateProvider,
  useMultipleCalendarSelector,
  useMultipleCalendarActions,
  selectMultipleDays,
  // …
} from 'react-native-fast-calendar';

// Systems + grid utilities
export { gregorianSystem, createGregorianSystem, buildMonthGrid, /* … */ } from 'react-native-fast-calendar';
```

### Providers

| Provider | Use when |
| --- | --- |
| `SingleDateProvider` | One date |
| `RangeDateProvider` | Start + end (hotels, travel) |
| `MultipleDateProvider` | Many unrelated days |

Shared props: `systems`, `activeSystemId`, `minDate`, `maxDate`, `disabledDates`, `disabledRanges`, `disabled`, `modifiers`, `firstDayOfWeek` (default **Monday**), `onChange`, `onConfirm`, `onClear`.

Range-only: `allowSameDay`, `minRangeDays`, `maxRangeDays`.  
Multiple-only: `maxSelected`.

### Hooks

| Hook | Re-renders on |
| --- | --- |
| `use*CalendarSelector(fn)` | When `fn(snapshot)` return changes |
| `use*CalendarActions()` | **Never** — stable for the provider lifetime |

Rule of thumb: cells and headers that only call `selectDate` should use **actions only**.

## Architecture

Each provider owns one external store (`useSyncExternalStore`). Callbacks live on the store, not in context, so the actions object stays identity-stable.

```
SingleDateProvider / RangeDateProvider / MultipleDateProvider
 └── *CalendarStore
      ├── snapshot  ← use*CalendarSelector
      └── actions   ← use*CalendarActions (no subscription)
```

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT · Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
