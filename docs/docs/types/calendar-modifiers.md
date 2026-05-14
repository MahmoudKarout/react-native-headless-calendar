---
sidebar_position: 3
---

# CalendarModifiers

Named matchers evaluated per cell. The boolean result is exposed as `DayCellInfo.modifiers[name]` so consumers can style cells without imperative date comparisons.

## Type

```ts
type CalendarModifiers = Readonly<Record<string, CalendarMatcher>>;
```

A matcher is one of:

```ts
type CalendarMatcher =
  | readonly DisabledDateInput[]
  | readonly DisabledDateRangeInput[]
  | ((nativeDate: Date) => boolean);
```

Mixed arrays (dates + ranges in one matcher) are not supported — pick one shape per modifier name.

## Usage

```tsx
import { CalendarProvider } from 'react-native-fast-calendar';

<CalendarProvider
  modifiers={{
    booked: [
      new Date(2024, 4, 5),
      new Date(2024, 4, 12),
    ],
    holiday: [
      { start: new Date(2024, 11, 24), end: new Date(2024, 11, 26) },
    ],
    weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
  }}
>
  {/* ... */}
</CalendarProvider>
```

Inside the cell:

```tsx
{cell.modifiers.booked && <View style={styles.bookedDot} />}
{cell.modifiers.weekend && <View style={styles.weekendTint} />}
```

## Tips

- Modifier names are arbitrary — pick something readable in your styles.
- Predicates run for every visible cell, so keep them cheap. Closures over arrays of `Date` objects are fine; date-fns calls are usually fine; calling into a database is not.
- Modifier results are surfaced through `selectDays` (read via `useCalendarSelector(selectDays)`), so they re-evaluate only when the displayed month or modifier identity changes.
