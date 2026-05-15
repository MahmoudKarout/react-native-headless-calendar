---
sidebar_position: 4
---

# useCalendarActions

`useCalendarActions` returns every mutator the calendar exposes — selection, navigation, confirm, and clear — as a single, **subscription-free, identity-stable** object. The returned reference does not change for the lifetime of the enclosing `<CalendarProvider>`, and reading it never re-renders the consumer.

This is the hook you use whenever a component only needs to *call* the calendar (a tappable cell, a "Today" button, a confirm bar) without caring about the current state.

## Signature

```ts
interface CalendarActions {
  selectDate: (date: CalendarDateValue | Date | string | number) => void;
  clear: () => void;
  confirm: () => void;
  goPrevMonth: () => void;
  goNextMonth: () => void;
  setDisplayedDate: (date: CalendarDateValue | Date | string | number) => void;
  selectMonth: (index: number) => void;
  selectYear: (year: number) => void;
  prevYearPage: () => void;
  nextYearPage: () => void;
  isConfirmable: () => boolean; // synchronous, for handlers — see below
}

function useCalendarActions(): CalendarActions;
```

## Usage

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  CalendarProvider,
  selectCanConfirm,
  useCalendarActions,
  useCalendarSelector,
} from 'react-native-fast-calendar';

function Footer() {
  const { confirm, clear } = useCalendarActions();
  const canConfirm = useCalendarSelector(selectCanConfirm);

  return (
    <View style={{ flexDirection: 'row' }}>
      <Pressable onPress={clear}><Text>Clear</Text></Pressable>
      <Pressable onPress={confirm} disabled={!canConfirm}>
        <Text>Done</Text>
      </Pressable>
    </View>
  );
}

export default function Screen() {
  return (
    <CalendarProvider
      mode="range"
      onChange={({ startDate, endDate }) => {
        // fires on every selection mutation
      }}
      onConfirm={({ startDate, endDate }) => {
        console.log({ startDate, endDate });
      }}
      onClear={() => console.log('cleared')}
    >
      {/* ... your day-grid component ... */}
      <Footer />
    </CalendarProvider>
  );
}
```

## canConfirm

`canConfirm` is **not** part of `useCalendarActions` — it's reactive state, not an action. Subscribe to it with `useCalendarSelector(selectCanConfirm)`:

| Mode | `canConfirm` is `true` when |
| --- | --- |
| `single` | a date is selected |
| `multiple` | at least one date is selected |
| `range` | both endpoints are selected |

For one-shot reads inside event handlers, call `actions.isConfirmable()` instead — it returns the same boolean without subscribing.

## selectDate(input)

Routes the tap to the right place based on `mode`:

| Mode | Behaviour |
| --- | --- |
| `single` | Replace `selectedDate`. |
| `multiple` | Toggle the date in `selectedDates` (capped by `maxSelected`). |
| `range` | Pick start, then end (with `allowSameDay` / `minRangeDays` / `maxRangeDays` honoured). |

Disabled dates are silently ignored. The argument is coerced via the active system's `from(...)` adapter, so it accepts native `Date`, ISO string, or the system-native value.

Each successful call fires the provider's `onChange` callback with the latest `CalendarSelectionPayload`.

## confirm()

Reads the latest store snapshot and calls the provider's `onConfirm` with a `CalendarSelectionPayload`:

```ts
interface CalendarSelectionPayload {
  date?: Date;             // single mode
  startDate?: Date;        // range mode
  endDate?: Date;          // range mode
  dates?: Date[];          // multiple mode
  systemId: string;        // active calendar system id
}
```

If `onConfirm` was not provided to `<CalendarProvider>`, `confirm()` is a silent no-op.

## clear()

Wipes single, range, and multiple selection state in one batch and fires `onClear()` and (when the selection actually changed) `onChange()`.

## Navigation

| Action | Effect |
| --- | --- |
| `goPrevMonth()` / `goNextMonth()` | Step the displayed month by one. |
| `setDisplayedDate(input)` | Jump the grid to the month containing `input`. |
| `selectMonth(index)` | Jump to a specific 0-based month of the displayed year. |
| `selectYear(year)` | Jump to a specific year. |
| `prevYearPage()` / `nextYearPage()` | Step the year-grid by `YEAR_PAGE_SIZE`. |

## Stable Identities

The returned object and every method on it have stable identities for the lifetime of the provider. Pass them straight to `React.memo`'d components, `useEffect` deps, or out-of-tree event handlers — they never change.
