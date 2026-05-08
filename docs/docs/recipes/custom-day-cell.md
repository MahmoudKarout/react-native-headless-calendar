---
sidebar_position: 6
---

# Custom Day Cell

Customize the appearance of individual day cells for unique calendar designs.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Interactive Demo

This demo uses **custom day cells** with modifier dots for booked dates (red), holidays (gold), and weekends (blue) — the kind of overlay you'd build with `renderDay` or the `DayCell` component slot:

export const customCellModifiers = {
  booked: {
    color: '#ef4444',
    label: 'Booked',
    predicate: (date) => [3, 7, 12, 18, 24].includes(date.getDate()),
  },
  holiday: {
    color: '#f59e0b',
    label: 'Holiday',
    predicate: (date) => [1, 15, 25].includes(date.getDate()),
  },
  weekend: {
    color: '#3b82f6',
    label: 'Weekend',
    predicate: (date) => date.getDay() === 0 || date.getDay() === 6,
  },
};

<CalendarDemo mode="single" modifiers={customCellModifiers} />

## Using renderDay

The simplest way to customize one calendar instance:

```tsx
import { Calendar } from 'react-native-fast-calendar';

<Calendar.Root mode="single">
  <Calendar.DayGrid
    renderDay={(info) => (
      <MyCustomCell info={info} />
    )}
  />
</Calendar.Root>
```

## Using Component Slots

Replace the day cell across your entire app:

```tsx
<Calendar.Root
  components={{
    DayCell: MyCustomDayCell,
  }}
>
  <Calendar.DayGrid />
</Calendar.Root>
```

## Examples

### Dot Indicators

```tsx
function DotCell({ info }) {
  const store = useCalendarStore();
  const theme = useCalendarTheme();

  return (
    <Pressable
      onPress={() => store.selectDate(info.date)}
      disabled={info.isDisabled}
      style={{
        width: theme.cellSize,
        height: theme.cellSize,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: info.isSelected
          ? theme.colors.primary
          : 'transparent',
        borderRadius: theme.borderRadius,
      }}
    >
      <Text
        style={{
          color: info.isSelected
            ? theme.colors.onPrimary
            : theme.colors.text,
        }}
      >
        {info.label}
      </Text>

      {/* Dot indicators */}
      <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
        {info.modifiers.booked && (
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'red' }} />
        )}
        {info.modifiers.holiday && (
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'gold' }} />
        )}
      </View>
    </Pressable>
  );
}
```

### Image Cell

```tsx
function ImageCell({ info }) {
  const store = useCalendarStore();

  return (
    <Pressable onPress={() => store.selectDate(info.date)}>
      <ImageBackground
        source={getImageForDate(info.nativeDate)}
        style={{ width: 48, height: 48 }}
      >
        <Text style={styles.overlay}>{info.label}</Text>
      </ImageBackground>
    </Pressable>
  );
}
```

### Status Cell

```tsx
function StatusCell({ info }) {
  const status = getDateStatus(info.nativeDate);

  const statusColors = {
    available: '#22C55E',
    booked: '#EF4444',
    pending: '#F59E0B',
    closed: '#9CA3AF',
  };

  return (
    <Pressable
      disabled={status === 'booked'}
      style={{
        borderLeftWidth: 3,
        borderLeftColor: statusColors[status],
      }}
    >
      <Text>{info.label}</Text>
      <Text style={{ fontSize: 10, color: statusColors[status] }}>
        {status}
      </Text>
    </Pressable>
  );
}
```

### Range Cell with Connector

```tsx
function RangeCell({ info }) {
  const theme = useCalendarTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Left connector */}
      {info.inRange && (
        <View style={{ flex: 1, height: '100%', backgroundColor: theme.colors.rangeBackground }} />
      )}

      {/* Cell */}
      <View
        style={{
          width: theme.cellSize,
          height: theme.cellSize,
          backgroundColor: info.isSelected
            ? theme.colors.primary
            : info.inRange
              ? theme.colors.rangeBackground
              : 'transparent',
          borderRadius: info.isSelected ? theme.borderRadius : 0,
        }}
      >
        <Text>{info.label}</Text>
      </View>

      {/* Right connector */}
      {info.inRange && (
        <View style={{ flex: 1, height: '100%', backgroundColor: theme.colors.rangeBackground }} />
      )}
    </View>
  );
}
```

## Complete Custom Calendar

```tsx
import {
  Calendar,
  DayCellInfo,
  useCalendarStore,
  useCalendarTheme,
} from 'react-native-fast-calendar';
import { Pressable, Text, View, StyleSheet } from 'react-native';

function CustomCalendarScreen() {
  return (
    <Calendar.Root
      mode="range"
      modifiers={{
        weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
        holiday: [new Date('2024-12-25')],
      }}
    >
      <View style={styles.container}>
        <Calendar.DayGrid
          renderDay={(info) => <CustomDayCell info={info} />}
        />
      </View>
    </Calendar.Root>
  );
}

function CustomDayCell({ info }: { info: DayCellInfo }) {
  const store = useCalendarStore();
  const theme = useCalendarTheme();

  const isWeekend = info.modifiers.weekend;
  const isHoliday = info.modifiers.holiday;

  return (
    <Pressable
      onPress={() => store.selectDate(info.date)}
      disabled={info.isDisabled}
      style={[
        styles.cell,
        {
          backgroundColor: info.isSelected
            ? theme.colors.primary
            : info.inRange
              ? theme.colors.rangeBackground
              : isHoliday
                ? '#FEE2E2'
                : 'transparent',
          borderWidth: info.isToday ? 2 : 0,
          borderColor: theme.colors.todayBorder,
          opacity: info.isDisabled ? 0.4 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: info.isSelected
              ? theme.colors.onPrimary
              : isWeekend
                ? '#DC2626'
                : theme.colors.text,
          },
        ]}
      >
        {info.label}
      </Text>

      {/* Status dots */}
      <View style={styles.dots}>
        {isHoliday && <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  cell: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    position: 'absolute',
    bottom: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
```

