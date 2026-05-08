---
sidebar_position: 13
---

# useCalendarWeekNumbers

The `useCalendarWeekNumbers` hook returns ISO 8601 week numbers for each row of the displayed month.

## Signature

```ts
function useCalendarWeekNumbers(): readonly number[];
```

## Basic Usage

```tsx
import { useCalendarWeekNumbers } from 'react-native-fast-calendar';

function WeekNumberColumn() {
  const weekNumbers = useCalendarWeekNumbers();

  return (
    <View style={styles.column}>
      {weekNumbers.map((week, index) => (
        <Text key={index} style={styles.weekNumber}>
          {week}
        </Text>
      ))}
    </View>
  );
}
```

## Week Number Calculation

Week numbers are computed using the Thursday of each row (ISO 8601 defines weeks as Monday-based, with Thursday as the canonical day):

```ts
const thursdayCol = (4 - firstDayOfWeek + 7) % 7;
for (let r = 0; r < ROWS; r++) {
  const idx = r * COLS + thursdayCol;
  const cell = cells[idx];
  out[r] = cell ? computeWeekNumber(system, cell.date) : 0;
}
```

## Calendar System Support

The hook prefers the active system's `weekNumber()` method when available:

```ts
const compute = (d: unknown): number =>
  system.weekNumber
    ? system.weekNumber(d as never)
    : isoWeekNumber(system.toNativeDate(d as never));
```

- **Gregorian system**: Implements `weekNumber()` natively (ISO 8601)
- **Other systems**: Falls back to computing ISO weeks from `toNativeDate()`

## Usage with DayGrid

The easiest way to show week numbers is via the `DayGrid` prop:

```tsx
<Calendar.DayGrid showWeekNumbers />
```

This automatically renders a week number column. To customize the week number appearance, use the component slot:

```tsx
<Calendar.Root
  components={{
    WeekNumberCell: MyCustomWeekNumberCell,
  }}
>
  <Calendar.DayGrid showWeekNumbers />
</Calendar.Root>
```

## Custom Week Number Rendering

```tsx
import { useCalendarWeekNumbers, useCalendarTheme } from 'react-native-fast-calendar';

function MyCustomWeekNumbers() {
  const theme = useCalendarTheme();
  const weekNumbers = useCalendarWeekNumbers();

  return (
    <View style={styles.column}>
      {weekNumbers.map((week, index) => (
        <View
          key={index}
          style={[
            styles.cell,
            {
              width: theme.cellSize,
              height: theme.cellSize,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.fontSize.weekday,
              fontVariant: ['tabular-nums'],
            }}
          >
            W{week}
          </Text>
        </View>
      ))}
    </View>
  );
}
```

## Complete Example

```tsx
import {
  Calendar,
  useCalendarWeekNumbers,
  useCalendarTheme,
} from 'react-native-fast-calendar';
import { View, Text, StyleSheet } from 'react-native';

function WeekNumbersExample() {
  return (
    <Calendar.Root mode="single" firstDayOfWeek={1}>
      <View style={styles.container}>
        <WeekNumberHeader />
        <View style={styles.row}>
          <WeekNumberColumn />
          <Calendar.DayGrid showWeekNumbers />
        </View>
      </View>
    </Calendar.Root>
  );
}

function WeekNumberHeader() {
  const theme = useCalendarTheme();

  return (
    <View style={styles.headerRow}>
      <View style={[styles.corner, { width: theme.cellSize }]} />
      <Calendar.WeekdayHeader showWeekNumbers={false} />
    </View>
  );
}

function WeekNumberColumn() {
  const theme = useCalendarTheme();
  const weekNumbers = useCalendarWeekNumbers();

  return (
    <View style={styles.column}>
      {weekNumbers.map((week, index) => (
        <View
          key={index}
          style={[
            styles.weekCell,
            {
              width: theme.cellSize,
              height: theme.cellSize,
            },
          ]}
        >
          <Text
            style={[
              styles.weekText,
              {
                color: theme.colors.textMuted,
                fontSize: theme.fontSize.weekday,
              },
            ]}
          >
            {week}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
  },
  corner: {
    // Empty corner cell
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  weekCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekText: {
    fontVariant: ['tabular-nums'],
  },
});
```

## Re-rendering Behavior

The hook only re-renders when:
- The displayed month changes
- The active system changes
- `firstDayOfWeek` changes

Tapping dates in the same month won't trigger a re-render.
