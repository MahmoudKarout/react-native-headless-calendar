---
sidebar_position: 7
---

# Week Numbers

Display ISO 8601 week numbers alongside the calendar grid.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Interactive Demo

ISO 8601 week numbers are shown in the leftmost column, with **Monday** as the first day of the week — what you get from `<SimpleCalendar showWeekNumbers firstDayOfWeek={1} />`:

<CalendarDemo mode="single" showWeekNumbers firstDayOfWeek={1} />

## Quick Start

```tsx
import { SimpleCalendar } from 'react-native-fast-calendar';

<SimpleCalendar
  mode="single"
  showWeekNumbers
  firstDayOfWeek={1} // Monday start for ISO weeks
/>
```

## With DayGrid

```tsx
<Calendar.DayGrid showWeekNumbers />
```

## Custom Week Number Cell

```tsx
<Calendar.Root
  components={{
    WeekNumberCell: MyWeekNumberCell,
  }}
>
  <Calendar.DayGrid showWeekNumbers />
</Calendar.Root>

function MyWeekNumberCell({ weekNumber }) {
  const theme = useCalendarTheme();

  return (
    <View style={{
      width: theme.cellSize,
      height: theme.cellSize,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.weekday,
        fontVariant: ['tabular-nums'],
      }}>
        W{weekNumber}
      </Text>
    </View>
  );
}
```

## UseCalendarWeekNumbers Hook

Build custom week number layouts:

```tsx
import { useCalendarWeekNumbers, useCalendarTheme } from 'react-native-fast-calendar';

function WeekNumberSidebar() {
  const weekNumbers = useCalendarWeekNumbers();
  const theme = useCalendarTheme();

  return (
    <View style={styles.sidebar}>
      {weekNumbers.map((week, index) => (
        <View
          key={index}
          style={[styles.cell, { height: theme.cellSize }]}
        >
          <Text style={styles.weekText}>W{week}</Text>
        </View>
      ))}
    </View>
  );
}
```

## ISO Week Reference

Week numbers are computed from the Thursday of each row:

- Week 1 is the week containing the first Thursday of the year
- Thursday is the canonical day for ISO weeks
- This ensures correct week numbering even with different `firstDayOfWeek` values

## Complete Example

```tsx
import {
  Calendar,
  useCalendarWeekNumbers,
  useCalendarWeekdayLabels,
  useCalendarTheme,
} from 'react-native-fast-calendar';
import { View, Text, StyleSheet } from 'react-native';

function WeekNumberCalendar() {
  return (
    <Calendar.Root mode="single" firstDayOfWeek={1}>
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.corner} />
          <WeekdayHeader />
        </View>
        <View style={styles.row}>
          <WeekNumberColumn />
          <Calendar.DayGrid showWeekNumbers={false} />
        </View>
      </View>
    </Calendar.Root>
  );
}

function WeekdayHeader() {
  const labels = useCalendarWeekdayLabels();
  const theme = useCalendarTheme();

  return (
    <View style={styles.header}>
      {labels.map((label, index) => (
        <Text
          key={index}
          style={[styles.label, { width: theme.cellSize }]}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

function WeekNumberColumn() {
  const weekNumbers = useCalendarWeekNumbers();
  const theme = useCalendarTheme();

  return (
    <View style={styles.weekColumn}>
      {weekNumbers.map((week, index) => (
        <View
          key={index}
          style={[styles.weekCell, { height: theme.cellSize }]}
        >
          <Text style={styles.weekText}>W{week}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
  },
  corner: {
    width: 40,
  },
  header: {
    flexDirection: 'row',
  },
  label: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
  },
  weekColumn: {
    width: 40,
  },
  weekCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontVariant: ['tabular-nums'],
  },
});
```
