---
sidebar_position: 3
title: use*CalendarActions
---

# use*CalendarActions

Returns every mutator the calendar exposes — selection, navigation, confirm, clear, and system switching — as a single **subscription-free, identity-stable** object.

| Provider | Hook |
| --- | --- |
| `SingleDateProvider` | `useSingleCalendarActions` |
| `RangeDateProvider` | `useRangeCalendarActions` |
| `MultipleDateProvider` | `useMultipleCalendarActions` |

Use this hook when a component only needs to **act** (tap a cell, press "Done", flip a month) without reading state. It never causes re-renders on selection changes.

## Signature

```ts
interface CalendarActions {
  selectDate: (input: unknown) => void;
  clear: () => void;
  confirm: () => void;
  goPrevMonth: () => void;
  goNextMonth: () => void;
  setDisplayedDate: (input: unknown) => void;
  selectMonth: (index: number) => void;
  selectYear: (year: number) => void;
  prevYearPage: () => void;
  nextYearPage: () => void;
  setActiveSystem: (id: string) => void;
  isConfirmable: () => boolean;
}
```

The shape is identical across modes (`CalendarActions` type alias per mode).

## Usage

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  SingleDateProvider,
  selectSingleCanConfirm,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-fast-calendar';

function Footer() {
  const { confirm, clear } = useSingleCalendarActions();
  const canConfirm = useSingleCalendarSelector(selectSingleCanConfirm);

  return (
    <View style={{ flexDirection: 'row' }}>
      <Pressable onPress={clear}><Text>Clear</Text></Pressable>
      <Pressable onPress={confirm} disabled={!canConfirm}>
        <Text>Done</Text>
      </Pressable>
    </View>
  );
}
```

## selectDate(input)

Coerces `input` through the active system's `from()`. Disabled dates are ignored silently.

| Provider | Behaviour |
| --- | --- |
| Single | Sets `selectedDate` and moves `displayed` to that month. |
| Range | Two-tap range selection with swap, reset, and length guards. |
| Multiple | Toggles membership; respects `maxSelected`. |

Each successful mutation fires `onChange` with the mode's payload.

## confirm() / clear()

- `confirm()` calls `onConfirm` with the latest payload. No-op if `onConfirm` was not passed.
- `clear()` wipes selection, calls `onClear`, and fires `onChange` when something was cleared.

## isConfirmable() vs select*CanConfirm

| | `select*CanConfirm` | `actions.isConfirmable()` |
| --- | --- | --- |
| Reactive | Yes — re-renders when gate changes | No — read once in a handler |
| Use in JSX `disabled` | Preferred | — |
| Use in `onPress` | — | Preferred |

| Mode | Confirmable when |
| --- | --- |
| Single | `selectedDate` is set |
| Range | both `rangeStart` and `rangeEnd` are set |
| Multiple | `selectedDates.length > 0` |

## Navigation

| Action | Effect |
| --- | --- |
| `goPrevMonth()` / `goNextMonth()` | Step displayed month by ±1. |
| `setDisplayedDate(input)` | Jump grid to the month containing `input`. |
| `selectMonth(index)` | Set month (0-based) and switch to day view. |
| `selectYear(year)` | Set year and switch to day view. |
| `prevYearPage()` / `nextYearPage()` | Step year pager by `YEAR_PAGE_SIZE` (12). |
| `setActiveSystem(id)` | Swap calendar system; carries selection across. |

## Stable Identities

The returned object and every method keep the same reference for the provider's lifetime. Pass them to `React.memo` children, `useEffect` dependency arrays, and out-of-tree handlers without churn.
