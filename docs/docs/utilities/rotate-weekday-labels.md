---
sidebar_position: 3
---

# rotateWeekdayLabels

Rotates a Sunday-first weekday array so the specified day is at index 0.

## Signature

```ts
function rotateWeekdayLabels<T>(
  labels: readonly T[],
  firstDayOfWeek: Weekday = 0
): readonly T[];
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `labels` | `readonly T[]` | Array of 7 weekday labels (Sunday-first) |
| `firstDayOfWeek` | `Weekday` | Which day should be first (0=Sunday) |

## Returns

Rotated array where `firstDayOfWeek` is at index 0.

## Usage

```tsx
import { rotateWeekdayLabels } from 'react-native-fast-calendar';

const englishLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Sunday start (no rotation needed)
rotateWeekdayLabels(englishLabels, 0);
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Monday start (European)
rotateWeekdayLabels(englishLabels, 1);
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Saturday start (MENA)
rotateWeekdayLabels(englishLabels, 6);
// ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
```

## Optimization

Returns the input array as-is when no rotation is needed:

```ts
if (firstDayOfWeek === 0) return labels;
```

This allows downstream consumers to use the result as a stable dependency.

## Hook Integration

Used internally by `useCalendarWeekdayLabels()`:

```ts
const baseLabels = useCalendarSelector((s) => s.system.weekdayLabels());
const firstDayOfWeek = useCalendarFirstDayOfWeek();

return useMemo(
  () => rotateWeekdayLabels(baseLabels, firstDayOfWeek),
  [baseLabels, firstDayOfWeek]
);
```
