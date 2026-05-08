---
sidebar_position: 1
---

# buildMonthGrid

Builds a 6×7 grid of day cells for a given month.

## Signature

```ts
function buildMonthGrid<T>(
  system: CalendarSystem<T>,
  monthDate: T,
  firstDayOfWeek: Weekday = 0
): GridCell<T>[];

interface GridCell<T> {
  date: T;
  isCurrentMonth: boolean;
  index: number;
}
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `system` | `CalendarSystem<T>` | The calendar system |
| `monthDate` | `T` | Any date within the target month |
| `firstDayOfWeek` | `Weekday` | First day of the week (0=Sunday) |

## Returns

Array of 42 cells (6 rows × 7 columns):

- `date`: The date value
- `isCurrentMonth`: Whether this cell is in the target month
- `index`: Sequential index 0-41

## Usage

```tsx
import { buildMonthGrid, useCalendarSelector } from 'react-native-fast-calendar';

function MyCustomGrid() {
  const system = useCalendarSelector(s => s.system);
  const displayed = useCalendarSelector(s => s.displayed);

  const cells = useMemo(
    () => buildMonthGrid(system, displayed, 1), // Monday start
    [system, displayed]
  );

  return (
    <View>
      {cells.map(cell => (
        <Cell
          key={cell.index}
          date={cell.date}
          isCurrentMonth={cell.isCurrentMonth}
        />
      ))}
    </View>
  );
}
```

## Grid Structure

```
[ 0.. 6] Row 0: Previous month tail (if any) + Current month start
[ 7..13] Row 1: Current month
[14..20] Row 2: Current month
[21..27] Row 3: Current month
[28..34] Row 4: Current month
[35..41] Row 5: Current month end + Next month head (if any)
```
