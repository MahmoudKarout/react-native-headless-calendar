---
sidebar_position: 7
---

# getYearPage

Computes the 12-year page that contains a given year.

## Signature

```ts
function getYearPage(year: number): readonly number[];
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | `number` | The year to center the page around |

## Returns

Array of 12 consecutive years, aligned to the `YEAR_PAGE_SIZE` (12) boundary.

## Usage

```tsx
import { getYearPage } from 'react-native-fast-calendar';

getYearPage(2024); // [2016, 2017, ..., 2027]
getYearPage(2027); // [2016, 2017, ..., 2027]
getYearPage(2028); // [2028, 2029, ..., 2039]
```

## Algorithm

```ts
const end = YEAR_PAGE_SIZE * Math.ceil(year / YEAR_PAGE_SIZE);
let start = end === year ? end : end - YEAR_PAGE_SIZE;
if (start < 0) start = 0;
```

- Page ends at the next multiple of 12
- If year is exactly on a multiple, it starts that multiple
- Otherwise, starts 12 years before the next multiple

## Integration

Used by `useCalendarYearPicker()`:

```ts
const years = useMemo(
  () => getYearPage(activeYear),
  [activeYear]
);
```
