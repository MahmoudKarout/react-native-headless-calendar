---
sidebar_position: 4
---

# matchDate

Resolves a `CalendarMatcher` against a single date.

## Signature

```ts
function matchDate<T>(
  system: CalendarSystem<T>,
  date: T,
  matcher: CalendarMatcher
): boolean;
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `system` | `CalendarSystem<T>` | The calendar system |
| `date` | `T` | Date to check |
| `matcher` | `CalendarMatcher` | Matcher (dates, ranges, or predicate) |

## Returns

`true` if the date matches, `false` otherwise.

## Usage

```tsx
import { matchDate } from 'react-native-fast-calendar';

// Date array matcher
const holidayMatcher = [new Date('2024-12-25'), new Date('2024-12-26')];
const isHoliday = matchDate(system, date, holidayMatcher);

// Range array matcher
const vacationMatcher = [{ start: new Date('2024-07-01'), end: new Date('2024-07-31') }];
const isVacation = matchDate(system, date, vacationMatcher);

// Predicate matcher
const weekendMatcher = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
const isWeekend = matchDate(system, date, weekendMatcher);
```

## Array Discrimination

The function discriminates between date arrays and range arrays by inspecting the first element:

```ts
const first = matcher[0];
if (first && typeof first === 'object' && 'start' in first && 'end' in first) {
  // Treat as range array
} else {
  // Treat as date array
}
```

## Error Handling

Predicates that throw are handled gracefully (returns `false`):

```ts
const riskyMatcher = (date) => {
  throw new Error('Oops');
};

matchDate(system, date, riskyMatcher); // Returns: false
```
