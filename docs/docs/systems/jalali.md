---
sidebar_position: 3
---

# Jalali (Persian) Calendar System

The Jalali (Persian/Solar Hijri) calendar system. Requires `moment-jalaali`.

## Installation

```bash
npm install moment-jalaali
# or
yarn add moment-jalaali
```

## Import

```tsx
import {
  jalaliSystem,
  createJalaliSystem,
  type JalaliDate,
  type JalaliSystemOptions,
  type JalaliConverter,
} from 'react-native-fast-calendar/systems/jalali';
```

## Usage

### Default Instance

```tsx
<CalendarProvider systems={[jalaliSystem]} />
```

### With Custom Converter

```tsx
const customJalaliSystem = createJalaliSystem({
  converter: myJalaliConverter,
  label: 'Jalali',
});

<CalendarProvider systems={[customJalaliSystem]} />
```

## Converter Interface

Your converter must implement:

```ts
interface JalaliConverter {
  toJalali(date: Date): {
    jy: number;  // Jalali year
    jm: number;  // Jalali month (0-11)
    jd: number;  // Jalali day
  };
  toGregorian(jy: number, jm: number, jd: number): Date;
}
```

## Customization

### Labels

```tsx
const farsiJalaliSystem = createJalaliSystem({
  label: 'جلالی',
  monthLabels: [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر',
    'مرداد', 'شهریور', 'مهر', 'آبان',
    'آذر', 'دی', 'بهمن', 'اسفند'
  ],
  weekdayLabels: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'],
});
```

### Options

```ts
interface JalaliSystemOptions {
  converter?: JalaliConverter;
  label?: string;
  monthLabels?: readonly string[];
  weekdayLabels?: readonly string[];
  formatDay?: (date: JalaliDate) => string;
  formatMonthYear?: (date: JalaliDate) => string;
}
```

## Internal Representation

```ts
interface JalaliDate {
  readonly jy: number;  // Jalali year
  readonly jm: number;  // Jalali month 0-11
  readonly jd: number;  // Jalali day 1-31
}
```

## Features

- 12 months
- First 6 months: 31 days
- Next 5 months: 30 days
- Last month: 29 days (30 in leap years)

## Multi-System Calendar

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { jalaliSystem } from 'react-native-fast-calendar/systems/jalali';

function PersianCalendar() {
  return (
    <CalendarProvider
      systems={[jalaliSystem, gregorianSystem]}
      initialSystemId="jalali"
    >
      {/* render your own day grid with `useCalendarDays()` */}
    </CalendarProvider>
  );
}
```
