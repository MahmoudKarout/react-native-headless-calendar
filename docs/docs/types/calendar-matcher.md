---
sidebar_position: 4
---

# CalendarMatcher

A `CalendarMatcher` selects which native dates match a modifier or disabled rule. Three shapes are supported uniformly:

```ts
type CalendarMatcher =
  | readonly DisabledDateInput[]           // individual days
  | readonly DisabledDateRangeInput[]      // inclusive ranges
  | ((nativeDate: Date) => boolean);       // predicate
```

`DisabledDateInput` is `unknown` — the active system's `from()` normalises each value.

## Date List

```tsx
modifiers={{
  booked: [
    new Date(2024, 4, 7),
    '2024-05-15', // if your system's from() accepts strings
  ],
}}
```

## Range List

Discriminated by a `start` + `end` field on the first entry:

```tsx
modifiers={{
  holiday: [
    { start: new Date(2024, 11, 24), end: new Date(2024, 11, 26) },
  ],
}}
```

Ranges are **inclusive** on both ends.

## Predicate

```tsx
modifiers={{
  weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
}}
```

Predicates receive a native `Date`. If the function throws, the library treats the day as **not** matched (never crashes the grid).

## Empty Arrays

An empty array matches nothing.

## Grid Utilities

The same matching logic powers `matchDate` in `react-native-fast-calendar` for advanced use outside the store:

```ts
import { matchDate, createGregorianSystem } from 'react-native-fast-calendar';

const sys = createGregorianSystem();
matchDate(sys, date, (d) => d.getMonth() === 5);
```
