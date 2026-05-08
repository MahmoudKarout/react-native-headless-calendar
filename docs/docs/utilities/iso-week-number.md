---
sidebar_position: 2
---

# isoWeekNumber

Computes the ISO 8601 week number for a native JavaScript Date.

## Signature

```ts
function isoWeekNumber(date: Date): number;
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | `Date` | Native JavaScript Date |

## Returns

ISO 8601 week number (1-53).

## Usage

```tsx
import { isoWeekNumber } from 'react-native-fast-calendar';

const week = isoWeekNumber(new Date(2024, 4, 15)); // Returns: 20
```

## Algorithm

Uses the shift-to-Thursday + count-weeks-from-Jan-1st algorithm:

1. Shift the date to the Thursday of the same ISO week
2. Count weeks since January 1st of that year

This handles edge cases like:
- Week 1 containing the first Thursday of the year
- December dates that belong to week 1 of the next year
- January dates that belong to the last week of the previous year

## Calendar System Integration

Calendar systems without native `weekNumber()` fall back to this:

```ts
const compute = (d: unknown): number =>
  system.weekNumber
    ? system.weekNumber(d as never)
    : isoWeekNumber(system.toNativeDate(d as never));
```
