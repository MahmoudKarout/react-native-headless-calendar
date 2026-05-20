---
sidebar_position: 2
---

# Hijri Calendar System

The Hijri (Islamic) calendar system. Requires `@tabby_ai/hijri-converter` or a compatible converter.

## Installation

```bash
yarn add @tabby_ai/hijri-converter
# or
yarn add @tabby_ai/hijri-converter
```

## Import

```tsx
import {
  hijriSystem,
  createHijriSystem,
  type HijriDate,
  type HijriSystemOptions,
  type HijriConverter,
} from 'react-native-fast-calendar/systems/hijri';
```

## Usage

### Default Instance

```tsx
<SingleDateProvider systems={[hijriSystem]} />
```

### With Custom Converter

```tsx
import myConverter from 'my-hijri-converter';

const customHijriSystem = createHijriSystem({
  converter: myConverter,
  label: 'Hijri',
});

<SingleDateProvider systems={[customHijriSystem]} />
```

## Converter Interface

Your converter must implement:

```ts
interface HijriConverter {
  toHijri(gregorian: { year: number; month: number; day: number }): {
    hy: number;  // Hijri year
    hm: number;  // Hijri month (0-11)
    hd: number;  // Hijri day
  };
  toGregorian(hijri: { hy: number; hm: number; hd: number }): {
    gy: number;  // Gregorian year
    gm: number;  // Gregorian month (0-11)
    gd: number;  // Gregorian day
  };
}
```

## Customization

### Labels

```tsx
const arabicHijriSystem = createHijriSystem({
  label: 'هجري',
  monthLabels: [
    'المحرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
    'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
    'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ],
  weekdayLabels: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
});
```

### Options

```ts
interface HijriSystemOptions {
  converter?: HijriConverter;
  label?: string;
  monthLabels?: readonly string[];
  weekdayLabels?: readonly string[];
  formatDay?: (date: HijriDate) => string;
  formatMonthYear?: (date: HijriDate) => string;
}
```

## Internal Representation

```ts
interface HijriDate {
  readonly hy: number;  // Hijri year
  readonly hm: number;  // Hijri month 0-11
  readonly hd: number;  // Hijri day 1-30
}
```

## Multi-System Calendar

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';

function DualCalendar() {
  return (
    <SingleDateProvider
      systems={[gregorianSystem, hijriSystem]}
      activeSystemId="hijri"
    >
      {/* render your own UI built from the public hooks */}
    </SingleDateProvider>
  );
}
```

## Important Notes

- Hijri months are typically 29 or 30 days
- The Hijri year is shorter than the Gregorian year (354-355 days)
- Conversion is approximate and may vary by a day depending on moon sighting
