---
sidebar_position: 8
---

# CalendarSnapshot

The `CalendarSnapshot` interface represents the complete state of the calendar at a point in time. It's returned by `store.getSnapshot()` and passed to `useCalendarSelector` callbacks.

## Interface Definition

```ts
interface CalendarSnapshot<T = CalendarDateValue> {
  // Calendar System
  system: CalendarSystem<T>;
  systemIndex: number;

  // Display State
  displayed: T;
  view: CalendarView;

  // Selection Mode
  mode: CalendarMode;

  // Selection State (mode-dependent)
  selectedDate?: T;
  rangeStart?: T;
  rangeEnd?: T;
  selectedDates: readonly T[];

  // Bounds
  minDate?: T;
  maxDate?: T;

  // Disabled State
  disabledDates?: readonly T[];
  disabledRanges?: readonly { start: T; end: T }[];
  disabled?: (nativeDate: Date) => boolean;

  // Range Constraints
  allowSameDay: boolean;
  minRangeDays?: number;
  maxRangeDays?: number;

  // Multiple Mode Constraints
  maxSelected?: number;
}

type CalendarView = 'day' | 'month' | 'year';
type CalendarMode = 'single' | 'range' | 'multiple';
```

## Properties

### Calendar System

#### `system: CalendarSystem<T>`

The active calendar system (Gregorian, Hijri, etc.).

```ts
const systemId = snapshot.system.id;
const monthName = snapshot.system.monthLabels()[snapshot.system.month(snapshot.displayed)];
```

#### `systemIndex: number`

Index of the active system in the configured `systems` array.

```ts
const isFirstSystem = snapshot.systemIndex === 0;
```

### Display State

#### `displayed: T`

The currently displayed month. Selection typically updates this to the tapped date.

```ts
const year = snapshot.system.year(snapshot.displayed);
const month = snapshot.system.month(snapshot.displayed);
```

#### `view: CalendarView`

The current view mode: `'day'`, `'month'`, or `'year'`.

```ts
if (snapshot.view === 'month') {
  // Show month picker
}
```

### Selection Mode

#### `mode: CalendarMode`

The selection mode: `'single'`, `'range'`, or `'multiple'`.

```ts
if (snapshot.mode === 'range') {
  // Enable range selection UI
}
```

### Selection State

#### `selectedDate?: T`

The selected date (single mode only).

```ts
const isDateSelected = !!snapshot.selectedDate;
const nativeDate = snapshot.selectedDate
  ? snapshot.system.toNativeDate(snapshot.selectedDate)
  : undefined;
```

#### `rangeStart?: T` / `rangeEnd?: T`

The range endpoints (range mode only).

```ts
const hasCompleteRange = !!snapshot.rangeStart && !!snapshot.rangeEnd;
const rangeDays = hasCompleteRange
  ? calculateDays(snapshot.rangeStart, snapshot.rangeEnd)
  : 0;
```

#### `selectedDates: readonly T[]`

The selected dates array (multiple mode only). Empty in other modes.

```ts
const count = snapshot.selectedDates.length;
const firstDate = snapshot.selectedDates[0];
```

### Bounds

#### `minDate?: T` / `maxDate?: T`

The minimum and maximum selectable dates.

```ts
const hasBounds = !!snapshot.minDate || !!snapshot.maxDate;
```

### Disabled State

#### `disabledDates?: readonly T[]`

Explicitly disabled individual dates.

#### `disabledRanges?: readonly { start: T; end: T }[]`

Disabled date ranges.

#### `disabled?: (nativeDate: Date) => boolean`

Dynamic disable predicate.

### Range Constraints

#### `allowSameDay: boolean`

Whether range mode allows selecting the same day for both endpoints.

#### `minRangeDays?: number`

Minimum required range length in days.

#### `maxRangeDays?: number`

Maximum allowed range length in days.

### Multiple Mode Constraints

#### `maxSelected?: number`

Maximum number of selectable dates.

## Accessing Snapshots

### In Event Handlers

```tsx
const store = useCalendarStore();

const handleAction = () => {
  const snapshot = store.getSnapshot();
  // Use snapshot data
};
```

### In Selectors

```tsx
const selectedDate = useCalendarSelector(s => s.selectedDate);
const isRangeComplete = useCalendarSelector(s => !!(s.rangeStart && s.rangeEnd));
```

## Complete Example

```tsx
import { useCalendarStore, useCalendarSelector } from 'react-native-fast-calendar';

function DebugPanel() {
  const store = useCalendarStore();

  const handleLogState = () => {
    const s = store.getSnapshot();

    console.log('=== Calendar State ===');
    console.log('System:', s.system.id);
    console.log('View:', s.view);
    console.log('Mode:', s.mode);
    console.log('Displayed:', s.system.formatMonthYear(s.displayed));

    if (s.mode === 'single') {
      console.log('Selected:', s.selectedDate
        ? s.system.toNativeDate(s.selectedDate).toDateString()
        : 'none');
    } else if (s.mode === 'range') {
      console.log('Range:', s.rangeStart
          ? s.system.toNativeDate(s.rangeStart).toDateString()
          : '?',
        'to',
        s.rangeEnd
          ? s.system.toNativeDate(s.rangeEnd).toDateString()
          : '?'
      );
    } else {
      console.log('Selected:', s.selectedDates.length, 'dates');
    }

    console.log('Bounds:', {
      min: s.minDate ? s.system.toNativeDate(s.minDate).toDateString() : 'none',
      max: s.maxDate ? s.system.toNativeDate(s.maxDate).toDateString() : 'none',
    });
  };

  return <Button onPress={handleLogState} title="Log State" />;
}
```
