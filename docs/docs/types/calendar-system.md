---
sidebar_position: 1
---

# CalendarSystem

The `CalendarSystem<T>` interface is the core abstraction that enables multi-calendar support. Implement this interface to add support for any calendar system (Gregorian, Hijri, Chinese, Ethiopian, etc.).

## Interface Definition

```ts
interface CalendarSystem<T = CalendarDateValue> {
  // Identity
  readonly id: string;
  readonly label: string;

  // Construction
  today(): T;
  fromNativeDate(d: Date): T;
  from(input: unknown): T;

  // Accessors
  year(d: T): number;
  month(d: T): number;
  day(d: T): number;
  weekday(d: T): number;
  daysInMonth(d: T): number;

  // Navigation
  withYear(d: T, year: number): T;
  withMonth(d: T, month: number): T;
  withDay(d: T, day: number): T;
  addMonths(d: T, n: number): T;
  addYears(d: T, n: number): T;

  // Comparison
  isSame(a: T, b: T): boolean;
  isBefore(a: T, b: T): boolean;
  isAfter(a: T, b: T): boolean;

  // Labels
  monthLabels(): readonly string[];
  weekdayLabels(): readonly string[];
  formatDay(d: T): string;
  formatMonthYear(d: T): string;
  weekNumber?(d: T): number;

  // Conversion
  toNativeDate(d: T): Date;
}
```

## Type Parameters

| Parameter | Description |
|-----------|-------------|
| `T` | The date representation type for this calendar system (opaque to the core) |

## Properties

### Identity

#### `id: string`

A stable identifier for the calendar system. Used internally for system switching and caching.

```ts
const system: CalendarSystem = {
  id: 'gregorian',
  // ...
};
```

#### `label: string`

A human-readable label displayed in system switchers.

```ts
const system: CalendarSystem = {
  id: 'gregorian',
  label: 'Gregorian',  // or 'Grégorien', 'ميلادي', etc.
  // ...
};
```

### Construction

#### `today(): T`

Returns the current date in this calendar system.

```ts
const today = system.today();
// Gregorian: { y: 2024, m: 4, d: 15 }
// Hijri: { hy: 1446, hm: 10, hd: 7 }
```

#### `fromNativeDate(d: Date): T`

Converts a native JavaScript Date to this calendar system's representation.

```ts
const native = new Date(2024, 4, 15); // May 15, 2024
const date = system.fromNativeDate(native);
```

#### `from(input: unknown): T`

Best-effort conversion from any input. Handles:
- `Date` objects
- ISO strings
- Numeric timestamps
- Moment/Dayjs objects (with `toDate()`)
- System-specific date objects

```ts
system.from(new Date());           // Date
system.from('2024-05-15');        // ISO string
system.from(1715731200000);       // Timestamp
system.from(moment());            // Moment
system.from({ y: 2024, m: 4, d: 15 }); // System-specific
```

### Accessors

#### `year(d: T): number`

Returns the year number.

```ts
const year = system.year(date); // 2024
```

#### `month(d: T): number`

Returns the month index (**0-based**).

```ts
const month = system.month(date); // 4 (May in 0-based)
```

#### `day(d: T): number`

Returns the day of month (**1-based**).

```ts
const day = system.day(date); // 15
```

#### `weekday(d: T): number`

Returns the day of week (**0 = Sunday, 6 = Saturday**).

```ts
const weekday = system.weekday(date); // 3 (Wednesday)
```

#### `daysInMonth(d: T): number`

Returns the number of days in the date's month.

```ts
const days = system.daysInMonth(date); // 31
```

### Navigation

#### `withYear(d: T, year: number): T`

Returns a new date with the year changed.

```ts
const newDate = system.withYear(date, 2025);
```

#### `withMonth(d: T, month: number): T`

Returns a new date with the month changed (0-based).

```ts
const newDate = system.withMonth(date, 0); // January
```

#### `withDay(d: T, day: number): T`

Returns a new date with the day changed.

```ts
const newDate = system.withDay(date, 1); // First of month
```

#### `addMonths(d: T, n: number): T`

Adds/subtracts months from a date.

```ts
const nextMonth = system.addMonths(date, 1);
const prevMonth = system.addMonths(date, -1);
```

#### `addYears(d: T, n: number): T`

Adds/subtracts years from a date.

```ts
const nextYear = system.addYears(date, 1);
const prevYear = system.addYears(date, -1);
```

### Comparison

#### `isSame(a: T, b: T): boolean`

Checks if two dates are the same day.

```ts
if (system.isSame(date1, date2)) {
  // Same day
}
```

#### `isBefore(a: T, b: T): boolean`

Checks if `a` is before `b`.

```ts
if (system.isBefore(date1, date2)) {
  // date1 is earlier
}
```

#### `isAfter(a: T, b: T): boolean`

Checks if `a` is after `b`.

```ts
if (system.isAfter(date1, date2)) {
  // date1 is later
}
```

### Labels

#### `monthLabels(): readonly string[]`

Returns an array of 12 month names (January → December or equivalent).

```ts
const labels = system.monthLabels();
// ['January', 'February', ..., 'December']
// or ['Muharram', 'Safar', ..., 'Dhu al-Hijjah']
```

#### `weekdayLabels(): readonly string[]`

Returns an array of 7 weekday names (Sunday → Saturday).

```ts
const labels = system.weekdayLabels();
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
```

#### `formatDay(d: T): string`

Formats a day number for display (typically just `String(day)`).

```ts
const label = system.formatDay(date); // "15"
```

#### `formatMonthYear(d: T): string`

Formats a full month/year label for the header.

```ts
const label = system.formatMonthYear(date); // "May 2024"
```

#### `weekNumber?(d: T): number`

**Optional.** Returns the ISO week number. Falls back to ISO 8601 computation if not provided.

```ts
const week = system.weekNumber(date); // 20
```

### Conversion

#### `toNativeDate(d: T): Date`

Converts the calendar date to a native JavaScript Date.

```ts
const native = system.toNativeDate(date);
// Returns: Date object (typically local midnight)
```

## Usage Example

```tsx
import { Calendar, useCalendarSelector } from 'react-native-fast-calendar';

function MyComponent() {
  const system = useCalendarSelector(s => s.system);
  const displayed = useCalendarSelector(s => s.displayed);

  const year = system.year(displayed);
  const month = system.month(displayed);
  const monthName = system.monthLabels()[month];

  return (
    <Text>
      {monthName} {year}
    </Text>
  );
}
```

## Implementing a Custom System

See the [Custom Calendar System](../advanced/custom-calendar-system) guide for a complete implementation example.
