---
sidebar_position: 4
---

# useCalendarActions

`useCalendarActions` returns the confirm and clear actions for the calendar plus a `canConfirm` flag indicating whether the current selection is valid.

## Signature

```ts
interface CalendarActions {
  confirm: () => void;
  clear: () => void;
  canConfirm: boolean;
}

function useCalendarActions(): CalendarActions;
```

## Usage

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  CalendarProvider,
  useCalendarActions,
} from 'react-native-fast-calendar';

function Footer() {
  const { confirm, clear, canConfirm } = useCalendarActions();

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

| Mode | `canConfirm` is `true` when |
| --- | --- |
| `single` | a date is selected |
| `multiple` | at least one date is selected |
| `range` | both endpoints are selected |

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

Wipes single, range, and multiple selection state in one batch and fires `onClear()` if a callback was provided.

## Stable Identities

`confirm`, `clear`, and `canConfirm` all have stable identities. Pass them straight to `React.memo`'d buttons or to `useEffect` dependency arrays.
