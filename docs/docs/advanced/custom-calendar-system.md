---
sidebar_position: 1
---

# Custom Calendar System

Implement your own calendar system by creating a `CalendarSystem<T>` adapter. This guide walks through creating an Ethiopian calendar system as an example.

## The Ethiopian Calendar

The Ethiopian calendar (also known as the Ge'ez calendar) has:
- 13 months (12 months of 30 days + 1 month of 5-6 days)
- 7-8 year difference from the Gregorian calendar
- New Year on September 11 (or 12 in leap years)

## Implementation

```tsx
import type { CalendarSystem, Weekday } from 'react-native-fast-calendar';

interface EthiopianDate {
  readonly year: number;
  readonly month: number;  // 0-12
  readonly day: number;    // 1-30 (1-5/6 for 13th month)
}

function createEthiopianSystem(): CalendarSystem<EthiopianDate> {
  return {
    // Identity
    id: 'ethiopian',
    label: 'Ethiopian',

    // Construction
    today(): EthiopianDate {
      const now = new Date();
      return this.fromNativeDate(now);
    },

    fromNativeDate(date: Date): EthiopianDate {
      // Simplified conversion (actual implementation would be more complex)
      const gregorianYear = date.getFullYear();
      const gregorianMonth = date.getMonth();
      const gregorianDay = date.getDate();

      // Ethiopian New Year is September 11
      let ethiopianYear = gregorianYear - 8;
      let ethiopianMonth;
      let ethiopianDay;

      if (gregorianMonth < 8 || (gregorianMonth === 8 && gregorianDay < 11)) {
        ethiopianYear -= 1;
      }

      // Calculate month and day (simplified)
      const dayOfYear = getDayOfYear(gregorianYear, gregorianMonth, gregorianDay);
      const ethiopianDayOfYear = (dayOfYear + 255) % 365; // 255 days before Sept 11

      ethiopianMonth = Math.floor(ethiopianDayOfYear / 30);
      ethiopianDay = (ethiopianDayOfYear % 30) + 1;

      return { year: ethiopianYear, month: ethiopianMonth, day: ethiopianDay };
    },

    from(input: unknown): EthiopianDate {
      if (input instanceof Date) return this.fromNativeDate(input);
      if (input && typeof input === 'object' && 'year' in input) {
        return { ...(input as EthiopianDate) };
      }
      return this.today();
    },

    // Accessors
    year: (d) => d.year,
    month: (d) => d.month,
    day: (d) => d.day,

    weekday: (d) => {
      const native = this.toNativeDate(d);
      return native.getDay() as Weekday;
    },

    daysInMonth: (d) => {
      // 13th month (Pagumen) has 5 days (6 in leap years)
      if (d.month === 12) {
        return isEthiopianLeapYear(d.year) ? 6 : 5;
      }
      return 30;
    },

    // Navigation
    withYear: (d, year) => ({ ...d, year }),
    withMonth: (d, month) => ({ ...d, month }),
    withDay: (d, day) => ({ ...d, day }),

    addMonths: (d, n) => {
      const totalMonths = d.year * 13 + d.month + n;
      const year = Math.floor(totalMonths / 13);
      const month = totalMonths % 13;
      const daysInNewMonth = month === 12
        ? (isEthiopianLeapYear(year) ? 6 : 5)
        : 30;
      return {
        year,
        month,
        day: Math.min(d.day, daysInNewMonth),
      };
    },

    addYears: (d, n) => ({ ...d, year: d.year + n }),

    // Comparison
    isSame: (a, b) =>
      a.year === b.year && a.month === b.month && a.day === b.day,

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
      'መስከረም',   // Meskerem (September)
      'ጥቅምት',     // Tikimt (October)
      'ህዳር',      // Hidar (November)
      'ታህሳስ',    // Tahsas (December)
      'ጥር',       // Tir (January)
      'የካቲት',     // Yakatit (February)
      'መጋቢት',     // Megabit (March)
      'ሚያዚያ',     // Miazia (April)
      'ግንቦት',     // Genbot (May)
      'ሰኔ',       // Sene (June)
      'ሐምሌ',      // Hamle (July)
      'ነሐሴ',      // Nehase (August)
      'ጳጉሜን',     // Pagumen (intercalary month)
    ],

    weekdayLabels: () => [
      'እሁድ',      // Sunday
      'ሰኞ',       // Monday
      'ማክሰኞ',     // Tuesday
      'ረቡዕ',      // Wednesday
      'ሐሙስ',      // Thursday
      'ዓርብ',      // Friday
      'ቅዳሜ',      // Saturday
    ],

    formatDay: (d) => String(d.day),

    formatMonthYear: (d) => {
      const months = this.monthLabels();
      return `${months[d.month]} ${d.year}`;
    },

    // Conversion
    toNativeDate: (d) => {
      // Simplified reverse conversion
      // Ethiopian New Year = September 11 of Gregorian year (year + 8)
      const gregorianYear = d.year + 8;
      const daysSinceNewYear = d.month * 30 + d.day - 1;

      // September 11 is day 254 of the year (255 in leap years)
      const newYearDayOfYear = isGregorianLeapYear(gregorianYear) ? 255 : 254;
      const targetDayOfYear = (newYearDayOfYear + daysSinceNewYear) % 365;

      return dayOfYearToDate(gregorianYear, targetDayOfYear);
    },
  };
}

// Helper functions
function isEthiopianLeapYear(year: number): boolean {
  // Ethiopian leap year is every 4 years without exception
  return year % 4 === 3;
}

function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDayOfYear(year: number, month: number, day: number): number {
  const daysInMonth = [31, isGregorianLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = day;
  for (let i = 0; i < month; i++) {
    dayOfYear += daysInMonth[i];
  }
  return dayOfYear;
}

function dayOfYearToDate(year: number, dayOfYear: number): Date {
  const daysInMonth = [31, isGregorianLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let month = 0;
  let day = dayOfYear;

  while (day > daysInMonth[month]) {
    day -= daysInMonth[month];
    month++;
  }

  return new Date(year, month, day);
}

export const ethiopianSystem = createEthiopianSystem();
```

## Usage

```tsx
import { Calendar } from 'react-native-fast-calendar';
import { ethiopianSystem } from './ethiopian-system';

<Calendar.Root systems={[ethiopianSystem]}>
  <Calendar.DayGrid />
</Calendar.Root>
```

## Multi-System Support

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { ethiopianSystem } from './ethiopian-system';

<Calendar.Root
  systems={[gregorianSystem, ethiopianSystem]}
  initialSystemId="ethiopian"
>
  <SystemSwitcher />
  <Calendar.DayGrid />
</Calendar.Root>
```

## Testing

Test your implementation thoroughly:

```ts
// Test round-trip conversion
const original = new Date(2024, 4, 15); // May 15, 2024
const ethiopian = ethiopianSystem.fromNativeDate(original);
const back = ethiopianSystem.toNativeDate(ethiopian);

// Should be the same day
console.assert(
  original.toDateString() === back.toDateString(),
  'Round-trip conversion failed'
);

// Test month calculations
console.assert(ethiopianSystem.daysInMonth({ year: 2016, month: 0, day: 1 }) === 30);
console.assert(ethiopianSystem.daysInMonth({ year: 2016, month: 12, day: 1 }) === 5);
```
