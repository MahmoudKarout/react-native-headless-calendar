---
sidebar_position: 6
---

# CalendarMatcher

The `CalendarMatcher` type defines how to match dates for disabling or modifiers. It supports three shapes: date arrays, range arrays, or predicate functions.

## Type Definition

```ts
type CalendarMatcher =
  | readonly DisabledDateInput[]
  | readonly DisabledDateRangeInput[]
  | ((nativeDate: Date) => boolean);

type DisabledDateInput = unknown;

interface DisabledDateRangeInput {
  start: DisabledDateInput;
  end: DisabledDateInput;
}
```

## Shapes

### Date Array

Match specific dates:

```ts
const matcher: CalendarMatcher = [
  new Date('2024-06-15'),
  new Date('2024-06-16'),
  new Date('2024-06-20'),
];
```

### Range Array

Match inclusive date ranges:

```ts
const matcher: CalendarMatcher = [
  { start: new Date('2024-07-01'), end: new Date('2024-08-15') },
  { start: new Date('2024-12-20'), end: new Date('2024-12-31') },
];
```

### Predicate Function

Match based on dynamic logic:

```ts
const matcher: CalendarMatcher = (date) => {
  return date.getDay() === 0 || date.getDay() === 6;
};
```

## Input Normalization

Date inputs are normalized through the active calendar system:

```ts
// These are all valid inputs
const inputs = [
  new Date('2024-06-15'),
  '2024-06-15',                    // ISO string
  1718409600000,                   // Timestamp
  moment('2024-06-15'),            // Moment object
  { y: 2024, m: 5, d: 15 },        // System-specific
];
```

## Usage

### For Disabled Dates

```tsx
<Calendar.Root
  disabledDates={[new Date('2024-12-25')]}
  disabledRanges={[{ start: new Date('2024-07-01'), end: new Date('2024-08-31') }]}
  disabled={(date) => date.getDay() === 0 || date.getDay() === 6}
>
```

### For Modifiers

```tsx
<Calendar.Root
  modifiers={{
    holiday: [new Date('2024-12-25')],
    vacation: [{ start: new Date('2024-07-01'), end: new Date('2024-07-15') }],
    weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
  }}
>
```

## Combining Matchers

Multiple matchers compose with **OR** semantics:

```tsx
<Calendar.Root
  disabledDates={[new Date('2024-12-25')]}
  disabledRanges={[{ start: new Date('2024-07-01'), end: new Date('2024-07-31') }]}
  disabled={(date) => date < new Date()}
>
```

A date is disabled if:
- It's December 25, 2024 **OR**
- It's between July 1-31, 2024 **OR**
- It's in the past

## Predicate Safety

Predicates that throw are handled gracefully (the date is treated as not matching):

```tsx
<Calendar.Root
  disabled={(date) => {
    // If this throws, the date won't be disabled
    return someUnreliableFunction(date);
  }}
>
```

## Array Discrimination

The library discriminates date arrays from range arrays by inspecting the first element:

```ts
if (first !== null &&
    typeof first === 'object' &&
    'start' in first &&
    'end' in first) {
  // Treat as range array
} else {
  // Treat as date array
}
```

This means:
- Empty arrays are valid but match nothing
- Arrays must be homogeneous (all dates or all ranges)
