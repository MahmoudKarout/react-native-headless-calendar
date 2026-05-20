---
sidebar_position: 1
---

# Gregorian Calendar System

The Gregorian calendar system is the default calendar system. It has zero dependencies and uses pure arithmetic for all calculations.

## Import

```tsx
import {
  gregorianSystem,
  createGregorianSystem,
  type GregorianDate,
  type GregorianSystemOptions,
} from 'react-native-headless-calendar/systems/gregorian';
```

## Default Instance

Use the pre-configured `gregorianSystem` for standard usage:

```tsx
<SingleDateProvider systems={[gregorianSystem]} />
```

Or use the default (no import needed):

```tsx
<SingleDateProvider />
// Uses [gregorianSystem] by default
```

## Customization

Use `createGregorianSystem()` to customize labels:

```tsx
const frenchSystem = createGregorianSystem({
  label: 'Grégorien',
  monthLabels: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  weekdayLabels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
});

<SingleDateProvider systems={[frenchSystem]} />
```

### Options

```ts
interface GregorianSystemOptions {
  /** Override the human label for the system switcher */
  label?: string;
  /** Override the 12 month names (ordered Jan..Dec) */
  monthLabels?: readonly string[];
  /** Override the 7 short weekday labels (ordered Sun..Sat) */
  weekdayLabels?: readonly string[];
  /** Override the day-cell text formatter (default: `String(day)`) */
  formatDay?: (date: GregorianDate) => string;
  /** Override the header label formatter (default: `"<MonthName> <Year>"`) */
  formatMonthYear?: (date: GregorianDate) => string;
}
```

## Internal Representation

Dates are represented as frozen `{ y, m, d }` objects:

```ts
interface GregorianDate {
  readonly y: number;  // Year (e.g., 2024)
  readonly m: number;  // Month 0-11 (0 = January)
  readonly d: number;  // Day 1-31
}

// Example
const date: GregorianDate = { y: 2024, m: 4, d: 15 }; // May 15, 2024
```

## Features

### Leap Year Calculation

```ts
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
```

### Weekday Calculation

Uses Sakamoto's algorithm (Sunday = 0, Saturday = 6):

```ts
const dayOfWeek = (y: number, m: number, d: number): number => {
  // Implementation
};
```

### ISO Week Numbers

Native support for ISO 8601 week numbers:

```ts
const weekNumber = gregorianSystem.weekNumber({ y: 2024, m: 4, d: 15 });
// Returns: 20
```

## Multiple Systems

Combine with other calendar systems:

```tsx
import { gregorianSystem } from 'react-native-headless-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-headless-calendar/systems/hijri';

<SingleDateProvider
  systems={[gregorianSystem, hijriSystem]}
  activeSystemId="gregorian"
>
```

## Complete Example

```tsx
import { SingleDateProvider } from 'react-native-headless-calendar';
import { createGregorianSystem } from 'react-native-headless-calendar/systems/gregorian';

const spanishSystem = createGregorianSystem({
  label: 'Gregorian',
  monthLabels: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  weekdayLabels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
});

function SpanishCalendar() {
  return (
    <SingleDateProvider
      systems={[spanishSystem]}
      firstDayOfWeek={1}
    >
      {/* render your day grid with `useSingleCalendarSelector(selectSingleDays)` */}
    </SingleDateProvider>
  );
}
```
