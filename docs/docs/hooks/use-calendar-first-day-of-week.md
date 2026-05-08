---
sidebar_position: 18
---

# useCalendarFirstDayOfWeek

The `useCalendarFirstDayOfWeek` hook returns the active `firstDayOfWeek` value from `<Calendar.Root>`. Use it when building custom grids to ensure column alignment.

## Signature

```ts
function useCalendarFirstDayOfWeek(): Weekday;
```

Where `Weekday` is `0 | 1 | 2 | 3 | 4 | 5 | 6`:

| Value | Day |
|-------|-----|
| 0 | Sunday (US, Canada, Japan) |
| 1 | Monday (Most of Europe, ISO 8601) |
| 2 | Tuesday |
| 3 | Wednesday |
| 4 | Thursday |
| 5 | Friday |
| 6 | Saturday (MENA locales) |

## Basic Usage

```tsx
import { useCalendarFirstDayOfWeek } from 'react-native-fast-calendar';

function MyGrid() {
  const firstDayOfWeek = useCalendarFirstDayOfWeek();

  // Use with grid utilities
  const cells = buildMonthGrid(system, displayed, firstDayOfWeek);

  return (
    <View style={styles.grid}>
      {cells.map((cell) => (
        <MyCell key={cell.index} date={cell.date} />
      ))}
    </View>
  );
}
```

## Weekend Detection

Use `firstDayOfWeek` with weekday index to detect weekends:

```tsx
function MyWeekdayHeader() {
  const labels = useCalendarWeekdayLabels();
  const firstDayOfWeek = useCalendarFirstDayOfWeek();

  const isWeekend = (index: number) => {
    const dayIndex = (firstDayOfWeek + index) % 7;
    return dayIndex === 0 || dayIndex === 6;
  };

  return (
    <View style={styles.row}>
      {labels.map((label, index) => (
        <Text
          key={index}
          style={[
            styles.label,
            isWeekend(index) && styles.weekend,
          ]}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}
```

## Alignment Check

Ensure your custom grid aligns with the built-in one:

```tsx
function MyCustomGrid() {
  const firstDayOfWeek = useCalendarFirstDayOfWeek();
  const system = useCalendarSelector(s => s.system);
  const displayed = useCalendarSelector(s => s.displayed);

  // Must pass the same firstDayOfWeek
  const cells = useMemo(
    () => buildMonthGrid(system, displayed, firstDayOfWeek),
    [system, displayed, firstDayOfWeek]
  );

  return (
    <View>
      {cells.map((cell) => (
        <Cell key={cell.index} date={cell.date} />
      ))}
    </View>
  );
}
```

## Complete Example

```tsx
import {
  Calendar,
  useCalendarFirstDayOfWeek,
  useCalendarWeekdayLabels,
  useCalendarTheme,
} from 'react-native-fast-calendar';
import { View, Text, StyleSheet } from 'react-native';

function FirstDayExample() {
  return (
    <Calendar.Root firstDayOfWeek={1}>
      <View>
        <FirstDayInfo />
        <WeekdayHeaderWithWeekends />
        <Calendar.DayGrid />
      </View>
    </Calendar.Root>
  );
}

function FirstDayInfo() {
  const firstDayOfWeek = useCalendarFirstDayOfWeek();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Text style={styles.info}>
      Week starts on {dayNames[firstDayOfWeek]}
    </Text>
  );
}

function WeekdayHeaderWithWeekends() {
  const theme = useCalendarTheme();
  const labels = useCalendarWeekdayLabels();
  const firstDayOfWeek = useCalendarFirstDayOfWeek();

  const isWeekend = (index: number) => {
    const dayIndex = (firstDayOfWeek + index) % 7;
    return dayIndex === 0 || dayIndex === 6;
  };

  return (
    <View style={styles.row}>
      {labels.map((label, index) => (
        <Text
          key={index}
          style={[
            styles.label,
            {
              width: theme.cellSize,
              color: isWeekend(index)
                ? '#DC2626'
                : theme.colors.textMuted,
              fontSize: theme.fontSize.weekday,
            },
          ]}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  info: {
    padding: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    textAlign: 'center',
    fontWeight: '500',
  },
});
```

## Usage with Custom Calendar Systems

When implementing custom calendar systems that have different week structures:

```tsx
function MyEthiopianCalendar() {
  // Ethiopian calendar uses a different week structure
  // but firstDayOfWeek still controls the grid layout
  return (
    <Calendar.Root
      systems={[ethiopianSystem]}
      firstDayOfWeek={0} // Sunday
    >
      <Calendar.DayGrid />
    </Calendar.Root>
  );
}
```
