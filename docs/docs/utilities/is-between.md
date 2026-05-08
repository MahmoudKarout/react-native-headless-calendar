---
sidebar_position: 5
---

# isBetween

Checks if a date falls between two endpoints (inclusive).

## Signature

```ts
function isBetween<T>(
  system: CalendarSystem<T>,
  date: T,
  start: T | undefined,
  end: T | undefined
): boolean;
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `system` | `CalendarSystem<T>` | The calendar system |
| `date` | `T` | Date to check |
| `start` | `T \| undefined` | Range start (optional) |
| `end` | `T \| undefined` | Range end (optional) |

## Returns

`true` if `start ≤ date ≤ end`, `false` otherwise (or if start/end undefined).

## Usage

```tsx
import { isBetween } from 'react-native-fast-calendar';

const inRange = isBetween(system, date, rangeStart, rangeEnd);
```

## Range Mode Integration

Used in `DayCellInfo.inRange` calculation:

```ts
const inRange =
  mode === 'range' && isBetween(system, date, rangeStart, rangeEnd);
```

## Complete Example

```tsx
function useIsInRange(date: Date): boolean {
  return useCalendarSelector(s => {
    if (!s.rangeStart || !s.rangeEnd) return false;
    const target = s.system.from(date);
    return isBetween(s.system, target, s.rangeStart, s.rangeEnd);
  });
}
```
