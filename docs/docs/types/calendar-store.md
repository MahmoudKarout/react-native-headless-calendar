---
sidebar_position: 9
---

# CalendarStore

The `CalendarStore` class is the external store that manages all calendar state. It provides granular subscriptions and stable action methods.

## Class Definition

```ts
class CalendarStore<T = CalendarDateValue> {
  // SyncExternalStore API
  getSnapshot(): CalendarSnapshot<T>;
  subscribe(listener: () => void): () => void;

  // Actions
  selectDate(date: T): void;
  toggleDate(date: T): void;
  clear(): void;
  setView(view: CalendarView): void;
  goToMonth(month: number): void;
  goToYear(year: number): void;
  changeMonth(step: number): void;
  changeYear(step: number): void;
  replaceSystem(system: CalendarSystem<T>, index: number): void;
}
```

## Constructor

The store is constructed by `<Calendar.Root>` with the following options:

```ts
interface CalendarStoreOptions<T> {
  systems: readonly CalendarSystem<T>[];
  initialSystemId?: string;
  mode: CalendarMode;
  initialDate?: unknown;
  initialStart?: unknown;
  initialEnd?: unknown;
  initialDates?: readonly unknown[];
  minDate?: unknown;
  maxDate?: unknown;
  disabledDates?: readonly unknown[];
  disabledRanges?: readonly { start: unknown; end: unknown }[];
  allowSameDay?: boolean;
  minRangeDays?: number;
  maxRangeDays?: number;
  maxSelected?: number;
  disabled?: (nativeDate: Date) => boolean;
}
```

## SyncExternalStore API

### `getSnapshot(): CalendarSnapshot<T>`

Returns the current state snapshot.

```ts
const snapshot = store.getSnapshot();
console.log(snapshot.mode);        // 'single'
console.log(snapshot.selectedDate); // Selected date
```

### `subscribe(listener: () => void): () => void`

Subscribe to state changes. Returns an unsubscribe function.

```ts
const unsubscribe = store.subscribe(() => {
  console.log('State changed!');
});

// Later
unsubscribe();
```

:::info
You typically don't use these directly — use `useCalendarSelector` for React components.
:::

## Actions

### `selectDate(date: T): void`

Select a date. Behavior depends on `mode`:

- **single**: Sets `selectedDate`, updates `displayed`
- **range**: Progressive selection (start → end → new start)
- **multiple**: Toggles date in `selectedDates`

```ts
store.selectDate(date);
```

### `toggleDate(date: T): void`

Toggle a date in multiple mode. No-op in other modes.

```ts
store.toggleDate(date); // Same as selectDate in multiple mode
```

### `clear(): void`

Clear all selection state.

```ts
store.clear();
// selectedDate = undefined
// rangeStart = undefined, rangeEnd = undefined
// selectedDates = []
```

### `setView(view: CalendarView): void`

Switch the current view.

```ts
store.setView('day');   // Show day grid
store.setView('month'); // Show month picker
store.setView('year');  // Show year picker
```

### `goToMonth(month: number): void`

Jump to a specific month (0-based) and switch to day view.

```ts
store.goToMonth(0);  // January
store.goToMonth(11); // December
```

### `goToYear(year: number): void`

Jump to a specific year and switch to day view.

```ts
store.goToYear(2025);
```

### `changeMonth(step: number): void`

Step the displayed month forward (positive) or backward (negative).

```ts
store.changeMonth(-1); // Previous month
store.changeMonth(1);  // Next month
store.changeMonth(12); // Same month, next year
```

### `changeYear(step: number): void`

Step the displayed year forward (positive) or backward (negative).

```ts
store.changeYear(-1); // Previous year
store.changeYear(1);  // Next year
```

### `replaceSystem(system: CalendarSystem<T>, index: number): void`

Switch to a different calendar system, converting all dates.

```ts
const hijriSystem = systems[1];
store.replaceSystem(hijriSystem, 1);
```

## Usage with useCalendarStore

```tsx
import { useCalendarStore } from 'react-native-fast-calendar';

function MyComponent() {
  const store = useCalendarStore();

  const handleSelect = (date) => {
    store.selectDate(date);
  };

  const handleClear = () => {
    store.clear();
  };

  const handleNextMonth = () => {
    store.changeMonth(1);
  };

  return (
    <View>
      <Button onPress={handleClear} title="Clear" />
      <Button onPress={handleNextMonth} title="Next Month" />
    </View>
  );
}
```

## Granular Subscriptions

The store's subscription system enables fine-grained re-renders:

```tsx
// Component A - only re-renders when selectedDate changes
const selectedDate = useCalendarSelector(s => s.selectedDate);

// Component B - only re-renders when displayed month changes
const displayed = useCalendarSelector(s => s.displayed);

// Component C - only re-renders when system changes
const systemId = useCalendarSelector(s => s.system.id);
```

Each component independently subscribes to its specific slice.

## Batching

The store batches multiple dispatches into a single notification:

```ts
// Both changes fire together
store.setView('day');
store.selectDate(date);
// Listeners notified once
```
