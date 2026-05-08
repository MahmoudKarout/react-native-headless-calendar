---
sidebar_position: 8
---

# usedRows

Calculates how many rows in a month grid contain at least one day from the target month.

## Signature

```ts
function usedRows<T>(cells: readonly GridCell<T>[]): number;
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `cells` | `readonly GridCell<T>[]` | Grid cells from `buildMonthGrid` |

## Returns

Number of used rows (1-6).

## Usage

```tsx
import { usedRows, buildMonthGrid } from 'react-native-fast-calendar';

const cells = buildMonthGrid(system, month, firstDayOfWeek);
const rows = usedRows(cells); // 4, 5, or 6
```

## Fixed Weeks

When `fixedWeeks={true}`, always render 6 rows. When `false`, use `usedRows` to trim trailing empty rows:

```tsx
const visibleRows = fixedWeeks ? ROWS : usedRows(cells);
const visibleCellCount = visibleRows * COLS;
```

## Month Examples

| Month | Starting Weekday | Used Rows |
|-------|-----------------|-----------|
| 28-day February | Sunday | 4 |
| 30-day month | Sunday | 5 |
| 31-day month | Saturday | 6 |
| 31-day month | Friday | 6 |
| 31-day month | Thursday | 5 |
