---
sidebar_position: 4
---

# Custom Calendar System

You can implement any calendar system by creating a `CalendarSystem<T>` adapter.

## Interface Implementation

```ts
import type { CalendarSystem, Weekday } from 'react-native-fast-calendar';

interface EthiopianDate {
  readonly year: number;
  readonly month: number;  // 0-12 (13 months!)
  readonly day: number;
}

function createEthiopianSystem(): CalendarSystem<EthiopianDate> {
  return {
    // Identity
    id: 'ethiopian',
    label: 'Ethiopian',

    // Construction
    today() {
      const now = new Date();
      // Convert from Gregorian
      return { year: now.getFullYear() - 8, month: now.getMonth(), day: now.getDate() };
    },

    fromNativeDate(date: Date) {
      return { year: date.getFullYear() - 8, month: date.getMonth(), day: date.getDate() };
    },

    from(input: unknown) {
      if (input instanceof Date) return this.fromNativeDate(input);
      if (input && typeof input === 'object' && 'year' in input) {
        return { ...input } as EthiopianDate;
      }
      return this.today();
    },

    // Accessors
    year: (d) => d.year,
    month: (d) => d.month,
    day: (d) => d.day,
    weekday: (d) => {
      const native = this.toNativeDate(d);
      return native.getDay();
    },
    daysInMonth: (d) => {
      // 13th month has 5 or 6 days
      if (d.month === 12) return isLeapYear(d.year) ? 6 : 5;
      return 30; // All other months have 30 days
    },

    // Navigation
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

    // Comparison
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

    // Labels
    monthLabels: () => [
      'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yakatit',
      'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagumen'
    ],
    weekdayLabels: () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    formatDay: (d) => String(d.day),
    formatMonthYear: (d) => `${this.monthLabels()[d.month]} ${d.year}`,

    // Conversion
    toNativeDate: (d) => {
      // Convert to Gregorian
      return new Date(d.year + 8, d.month, d.day);
    },
  };
}

const ethiopianSystem = createEthiopianSystem();
```

## Usage

```tsx
<CalendarProvider systems={[ethiopianSystem]}>
  {/* render your own day grid with `useCalendarSelector(selectDays)` */}
</CalendarProvider>
```

## Tips

1. **Keep date representations immutable** — Return frozen objects
2. **Handle leap years correctly** — Each calendar has its own rules
3. **Validate in `from()`** — Handle partial input gracefully
4. **Cache label arrays** — Return stable references from `monthLabels()` and `weekdayLabels()`
5. **Test round-trip conversion** — `toNativeDate(fromNativeDate(d))` should preserve the day
