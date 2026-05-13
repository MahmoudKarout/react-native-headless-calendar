---
sidebar_position: 4
---

# CalendarMatcher

Predicate or list of dates that selects a subset of the calendar's days. Used by `<CalendarProvider disabled>` and by every entry in `<CalendarProvider modifiers={…}>`.

## Type

```ts
type CalendarMatcher =
  | readonly DisabledDateInput[]
  | readonly DisabledDateRangeInput[]
  | ((nativeDate: Date) => boolean);
```

Three shapes are supported uniformly:

| Shape | Match condition |
| --- | --- |
| `readonly DisabledDateInput[]` | any element is the same calendar day |
| `readonly DisabledDateRangeInput[]` | any inclusive range covers the cell |
| `(nativeDate: Date) => boolean` | predicate returns `true` |

Mixed arrays (dates + ranges in one matcher) are not supported — pick one shape per usage.

## Examples

### List of dates

```tsx
<CalendarProvider
  disabledDates={[new Date(2024, 4, 5), new Date(2024, 4, 12)]}
/>
```

### List of inclusive ranges

```tsx
<CalendarProvider
  disabledRanges={[
    { start: new Date(2024, 4, 1), end: new Date(2024, 4, 7) },
  ]}
/>
```

### Predicate

```tsx
<CalendarProvider
  disabled={(d) => d.getDay() === 0 || d.getDay() === 6}
/>
```

Predicates are evaluated against the **native** `Date` representation regardless of the active calendar system, so the same matcher works for Gregorian, Hijri, Jalali, etc.
