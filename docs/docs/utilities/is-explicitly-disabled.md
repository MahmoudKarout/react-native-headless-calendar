---
sidebar_position: 6
---

# isExplicitlyDisabled

Checks if a date is disabled by explicit date lists or ranges.

## Signature

```ts
function isExplicitlyDisabled<T>(
  system: CalendarSystem<T>,
  date: T,
  disabledDates?: readonly T[],
  disabledRanges?: readonly { start: T; end: T }[]
): boolean;
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `system` | `CalendarSystem<T>` | The calendar system |
| `date` | `T` | Date to check |
| `disabledDates` | `readonly T[]` | Disabled specific dates |
| `disabledRanges` | `readonly { start: T; end: T }[]` | Disabled date ranges |

## Returns

`true` if the date matches any disabled date or range, `false` otherwise.

## Usage

```tsx
import { isExplicitlyDisabled } from 'react-native-fast-calendar';

const isDisabled = isExplicitlyDisabled(
  system,
  date,
  [new Date('2024-12-25')],
  [{ start: new Date('2024-07-01'), end: new Date('2024-07-31') }]
);
```

## Performance

Short-circuits on first match for efficiency:

```ts
// Check dates first (usually fewer)
for (const d of disabledDates) {
  if (system.isSame(date, d)) return true;
}

// Then check ranges
for (const r of disabledRanges) {
  if (isBetween(system, date, r.start, r.end)) return true;
}

return false;
```
