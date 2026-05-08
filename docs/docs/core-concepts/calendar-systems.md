---
sidebar_position: 3
---

# Calendar Systems

The library has **zero calendar-system dependencies in the core**. Everything is abstracted through the `CalendarSystem<T>` interface.

## Available Systems

### Built-in: Gregorian

Zero dependencies, pure arithmetic. Available at `react-native-fast-calendar/systems/gregorian`.

```tsx
import { gregorianSystem, createGregorianSystem } from 'react-native-fast-calendar/systems/gregorian';

// Use the default
<Calendar.Root systems={[gregorianSystem]} />

// Or customize labels
const frenchSystem = createGregorianSystem({
  label: 'Grégorien',
  monthLabels: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  weekdayLabels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
});
```

### Pre-configured: Hijri

Requires `@tabby_ai/hijri-converter` (or any compatible converter).

```tsx
import { hijriSystem, createHijriSystem } from 'react-native-fast-calendar/systems/hijri';

// Auto-loads converter
<Calendar.Root systems={[hijriSystem]} />

// Or with custom converter
const myHijriSystem = createHijriSystem({
  converter: myCustomConverter,
  label: 'Hijri',
});
```

### Pre-configured: Jalali (Persian)

Requires `moment-jalaali`.

```tsx
import { jalaliSystem, createJalaliSystem } from 'react-native-fast-calendar/systems/jalali';

// Auto-loads moment-jalaali
<Calendar.Root systems={[jalaliSystem]} />
```

## Using Multiple Systems

Pass multiple systems to enable switching:

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';

function MyCalendar() {
  return (
    <Calendar.Root
      systems={[gregorianSystem, hijriSystem]}
      initialSystemId="hijri"
      onSystemChange={(id) => console.log('Switched to:', id)}
    >
      <MyHeader />
      <Calendar.DayGrid />
    </Calendar.Root>
  );
}

function MyHeader() {
  const { systems, activeId, setActive } = useCalendarSystemSwitcher();

  return (
    <View>
      {systems.map(s => (
        <Button
          key={s.id}
          active={s.id === activeId}
          onPress={() => setActive(s.id)}
        >
          {s.label}
        </Button>
      ))}
    </View>
  );
}
```

## The CalendarSystem Interface

Implement this interface for any calendar system:

```ts
interface CalendarSystem<T = CalendarDateValue> {
  // Identity
  readonly id: string;     // 'gregorian', 'hijri', 'chinese', etc.
  readonly label: string;   // Human-readable name

  // Construction
  today(): T;
  fromNativeDate(d: Date): T;
  from(input: unknown): T;   // Accept Date, string, Moment, etc.

  // Accessors
  year(d: T): number;
  month(d: T): number;      // 0-based: 0 = first month
  day(d: T): number;        // 1-based
  weekday(d: T): number;    // 0 = Sunday, 6 = Saturday
  daysInMonth(d: T): number;

  // Navigation
  withYear(d: T, year: number): T;
  withMonth(d: T, month: number): T;
  withDay(d: T, day: number): T;
  addMonths(d: T, n: number): T;
  addYears(d: T, n: number): T;

  // Comparison (day granularity)
  isSame(a: T, b: T): boolean;
  isBefore(a: T, b: T): boolean;
  isAfter(a: T, b: T): boolean;

  // Labels (already localized by consumer)
  monthLabels(): readonly string[];    // 12 entries
  weekdayLabels(): readonly string[];  // 7 entries, Sunday-first
  formatDay(d: T): string;             // Cell label, e.g., "12"
  formatMonthYear(d: T): string;        // Header label, e.g., "May 2024"

  // Optional: ISO week number
  weekNumber?(d: T): number;

  // Conversion
  toNativeDate(d: T): Date;
}
```

## Implementing a Custom System

Here's a simplified example for an Ethiopian calendar:

```tsx
interface EthiopianDate {
  readonly year: number;
  readonly month: number;  // 0-12 (13 months)
  readonly day: number;
}

const createEthiopianSystem = (): CalendarSystem<EthiopianDate> => ({
  id: 'ethiopian',
  label: 'Ethiopian',

  today() {
    // Convert from Gregorian
    const now = new Date();
    // ... conversion logic
    return { year: 2016, month: 8, day: 15 };
  },

  fromNativeDate(d: Date) {
    // ... conversion logic
    return { year: d.getFullYear() - 8, month: d.getMonth(), day: d.getDate() };
  },

  from(input: unknown) {
    if (input instanceof Date) return this.fromNativeDate(input);
    // Handle other formats
    return this.today();
  },

  year: (d) => d.year,
  month: (d) => d.month,
  day: (d) => d.day,
  weekday: (d) => {
    // Ethiopian calendar weekday calculation
    const native = this.toNativeDate(d);
    return native.getDay();
  },
  daysInMonth: (d) => {
    // 13th month has 5 or 6 days
    if (d.month === 12) return isLeapYear(d.year) ? 6 : 5;
    return 30; // All other months have 30 days
  },

  withYear: (d, year) => ({ ...d, year }),
  withMonth: (d, month) => ({ ...d, month }),
  withDay: (d, day) => ({ ...d, day }),
  addMonths: (d, n) => {
    const totalMonths = d.year * 13 + d.month + n;
    const year = Math.floor(totalMonths / 13);
    const month = totalMonths % 13;
    return { year, month, day: Math.min(d.day, this.daysInMonth({ year, month, day: 1 })) };
  },
  addYears: (d, n) => ({ ...d, year: d.year + n }),

  isSame: (a, b) => a.year === b.year && a.month === b.month && a.day === b.day,
  isBefore: (a, b) => {
    if (a.year !== b.year) return a.year < b.year;
    if (a.month !== b.month) return a.month < b.month;
    return a.day < b.day;
  },
  isAfter: (a, b) => {
    if (a.year !== b.year) return a.year > b.year;
    if (a.month !== b.month) return a.month > b.month;
    return a.day > b.day;
  },

  monthLabels: () => [
    'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yakatit',
    'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagumen'
  ],
  weekdayLabels: () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  formatDay: (d) => String(d.day),
  formatMonthYear: (d) => `${this.monthLabels()[d.month]} ${d.year}`,

  toNativeDate: (d) => {
    // ... reverse conversion
    return new Date(d.year + 8, d.month, d.day);
  },
});

const ethiopianSystem = createEthiopianSystem();

// Usage
<Calendar.Root systems={[ethiopianSystem]} />;
```

## System Switching Behavior

When switching systems, dates are carried over by round-tripping through native `Date`:

```ts
replaceSystem = (system: CalendarSystem<T>, systemIndex: number) => {
  const carry = (v: T | undefined) =>
    v ? system.fromNativeDate(s.system.toNativeDate(v)) : undefined;

  this.commit({
    ...s,
    system,
    systemIndex,
    displayed: system.fromNativeDate(s.system.toNativeDate(s.displayed)),
    selectedDate: carry(s.selectedDate),
    rangeStart: carry(s.rangeStart),
    rangeEnd: carry(s.rangeEnd),
    // ... other carried dates
  });
};
```

This means:
- The same calendar day remains selected (just expressed in the new system)
- Selections are preserved across system switches
- The displayed month is converted to the equivalent in the new system

## Week Numbers

Week numbers can be provided by the calendar system or fall back to ISO 8601:

```ts
// System provides its own week numbers
weekNumber(d) {
  // Custom week number calculation
  return customWeekNumber;
}

// Or omit - falls back to ISO 8601 derived from toNativeDate
```

The `useCalendarWeekNumbers()` hook and `<Calendar.DayGrid showWeekNumbers />` use the system's `weekNumber()` when available, otherwise compute ISO weeks from the native date.

## Best Practices

1. **Keep date representations immutable** — Return frozen objects or tuples
2. **Handle leap years correctly** — Each calendar has its own leap year rules
3. **Validate in `from()`** — Handle partial/incomplete input gracefully
4. **Cache label arrays** — `monthLabels()` and `weekdayLabels()` should return stable references
5. **Test round-trip conversion** — `toNativeDate(fromNativeDate(d))` should preserve the day
