---
sidebar_position: 2
---

# useCalendarSelector

The `useCalendarSelector` hook subscribes to a specific slice of calendar state. Components only re-render when that slice changes, enabling granular performance optimization.

## Signature

```ts
function useCalendarSelector<T>(
  selector: (snapshot: CalendarSnapshot) => T
): T;
```

## Basic Usage

```tsx
import { useCalendarSelector } from 'react-native-fast-calendar';

function MyComponent() {
  // Only re-renders when selectedDate changes
  const selectedDate = useCalendarSelector(s => s.selectedDate);

  // Only re-renders when displayed month changes
  const displayed = useCalendarSelector(s => s.displayed);

  // Only re-renders when system changes
  const systemId = useCalendarSelector(s => s.system.id);

  return (
    <Text>
      Selected: {selectedDate?.toString()}
    </Text>
  );
}
```

## Common Selectors

### Selection State

```tsx
// Single mode
const selectedDate = useCalendarSelector(s => s.selectedDate);

// Range mode
const rangeStart = useCalendarSelector(s => s.rangeStart);
const rangeEnd = useCalendarSelector(s => s.rangeEnd);

// Multiple mode
const selectedDates = useCalendarSelector(s => s.selectedDates);
const selectedCount = useCalendarSelector(s => s.selectedDates.length);
```

### Display State

```tsx
const displayed = useCalendarSelector(s => s.displayed);
const view = useCalendarSelector(s => s.view); // 'day' | 'month' | 'year'
const system = useCalendarSelector(s => s.system);
const systemId = useCalendarSelector(s => s.system.id);
```

### Bounds

```tsx
const minDate = useCalendarSelector(s => s.minDate);
const maxDate = useCalendarSelector(s => s.maxDate);
const disabledDates = useCalendarSelector(s => s.disabledDates);
const disabledRanges = useCalendarSelector(s => s.disabledRanges);
```

### Mode & Constraints

```tsx
const mode = useCalendarSelector(s => s.mode);
const allowSameDay = useCalendarSelector(s => s.allowSameDay);
const minRangeDays = useCalendarSelector(s => s.minRangeDays);
const maxRangeDays = useCalendarSelector(s => s.maxRangeDays);
const maxSelected = useCalendarSelector(s => s.maxSelected);
```

## Performance Optimization

### Select Primitives

Prefer selecting primitives over objects for better stability:

```tsx
// ✅ Good - primitive, stable comparison
const systemId = useCalendarSelector(s => s.system.id);

// ❌ Less optimal - new object reference every time system changes
const system = useCalendarSelector(s => s.system);
```

### Derived Values

Compute derived values inside the selector:

```tsx
// ✅ Good - returns primitive
const year = useCalendarSelector(s => s.system.year(s.displayed));
const month = useCalendarSelector(s => s.system.month(s.displayed));

// ❌ Less optimal - returns objects
const displayInfo = useCalendarSelector(s => ({
  year: s.system.year(s.displayed),
  month: s.system.month(s.displayed),
}));
```

### Conditional Selection

```tsx
const canConfirm = useCalendarSelector(s => {
  if (s.mode === 'single') return !!s.selectedDate;
  if (s.mode === 'multiple') return s.selectedDates.length > 0;
  return !!(s.rangeStart && s.rangeEnd);
});
```

## Building Custom Hooks

Combine `useCalendarSelector` with your own logic:

```tsx
function useIsDateSelected(date: Date): boolean {
  return useCalendarSelector(s => {
    const system = s.system;
    const target = system.from(date);

    if (s.mode === 'single') {
      return s.selectedDate ? system.isSame(s.selectedDate, target) : false;
    }

    if (s.mode === 'multiple') {
      return s.selectedDates.some(d => system.isSame(d, target));
    }

    if (s.mode === 'range') {
      if (!s.rangeStart || !s.rangeEnd) return false;
      return system.isSame(s.rangeStart, target) ||
             system.isSame(s.rangeEnd, target) ||
             (system.isAfter(target, s.rangeStart) && system.isBefore(target, s.rangeEnd));
    }

    return false;
  });
}

function useIsInRange(date: Date): boolean {
  return useCalendarSelector(s => {
    if (s.mode !== 'range' || !s.rangeStart || !s.rangeEnd) return false;
    const target = s.system.from(date);
    return s.system.isAfter(target, s.rangeStart) &&
           s.system.isBefore(target, s.rangeEnd);
  });
}

function useRangeLength(): number | null {
  return useCalendarSelector(s => {
    if (s.mode !== 'range' || !s.rangeStart || !s.rangeEnd) return null;
    const startNative = s.system.toNativeDate(s.rangeStart);
    const endNative = s.system.toNativeDate(s.rangeEnd);
    const diffMs = endNative.getTime() - startNative.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  });
}
```

## Comparison with useCalendarStore

| | `useCalendarSelector` | `useCalendarStore` |
|---|----------------------|---------------------|
| **Purpose** | Subscribe to state slice | Access store for actions |
| **Re-renders** | Only when selected slice changes | Never (stable identity) |
| **Usage** | Render path | Event handlers, effects |
| **Returns** | Selected value | Store instance |

## Complete Example

```tsx
import {
  Calendar,
  useCalendarSelector,
  useCalendarStore,
} from 'react-native-fast-calendar';

function OptimizedCalendar() {
  return (
    <Calendar.Root mode="range">
      <Header />
      <InfoPanel />
      <Calendar.DayGrid />
    </Calendar.Root>
  );
}

// Only re-renders when displayed month/year changes
function Header() {
  const monthYear = useCalendarSelector(s =>
    s.system.formatMonthYear(s.displayed)
  );

  return <Text style={styles.header}>{monthYear}</Text>;
}

// Only re-renders when selection changes
function InfoPanel() {
  const rangeStart = useCalendarSelector(s => s.rangeStart);
  const rangeEnd = useCalendarSelector(s => s.rangeEnd);
  const system = useCalendarSelector(s => s.system);

  const formattedStart = rangeStart
    ? system.formatMonthYear(rangeStart)
    : 'Not selected';
  const formattedEnd = rangeEnd
    ? system.formatMonthYear(rangeEnd)
    : 'Not selected';

  return (
    <View>
      <Text>From: {formattedStart}</Text>
      <Text>To: {formattedEnd}</Text>
    </View>
  );
}
```

## Error Handling

The hook throws a clear error if used outside `<Calendar.Root>`:

```
Error: [Calendar] useCalendarStore must be used within <Calendar.Root>
```

This is because `useCalendarSelector` internally calls `useCalendarStore`.
