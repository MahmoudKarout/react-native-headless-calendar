---
sidebar_position: 7
---

# Week Numbers

`useCalendarDays()` gives you the cells in row-major order (`ROWS × COLS`). Derive the ISO 8601 week number for each row from any cell's `nativeDate`.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo mode="single" showWeekNumbers />

## Implementation

```tsx
import { Text, View } from 'react-native';
import {
  CalendarProvider,
  useCalendarDays,
} from 'react-native-fast-calendar';

const COLS = 7;

function isoWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

function Grid() {
  const days = useCalendarDays();
  const rows = days.cells.length / COLS;

  return (
    <View>
      {Array.from({ length: rows }).map((_, r) => {
        const rowCells = days.cells.slice(r * COLS, (r + 1) * COLS);
        const ref = rowCells[0]!;
        return (
          <View key={r} style={{ flexDirection: 'row' }}>
            <Text style={{ width: 40, textAlign: 'center' }}>
              {isoWeekNumber(ref.nativeDate)}
            </Text>
            {rowCells.map((cell) => (
              <Text
                key={cell.nativeDate.toISOString()}
                style={{ width: 40, textAlign: 'center' }}
              >
                {cell.label}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

export default function Screen() {
  return (
    <CalendarProvider mode="single" firstDayOfWeek={1}>
      <Grid />
    </CalendarProvider>
  );
}
```

## Notes

- `firstDayOfWeek={1}` aligns the visual week to ISO 8601 (Monday-first). The week number itself doesn't depend on this — the helper computes the week the row's Thursday falls in.
- The library re-exports `isoWeekNumber` from its grid utilities (`import { isoWeekNumber } from 'react-native-fast-calendar'`) if you'd rather not inline it.
