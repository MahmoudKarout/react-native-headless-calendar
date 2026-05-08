---
sidebar_position: 3
---

# DayCellInfo

The `DayCellInfo` interface contains all metadata about a day cell. It's passed to custom `renderDay` functions and `DayCell` components.

## Interface Definition

```ts
interface DayCellInfo<T = CalendarDateValue> {
  // Date
  date: T;
  nativeDate: Date;
  label: string;

  // Position
  isCurrentMonth: boolean;

  // State
  isToday: boolean;
  isSelected: boolean;
  inRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;

  // Modifiers
  modifiers: Readonly<Record<string, boolean>>;

  // Week numbers
  weekNumber?: number;
}
```

## Properties

### Date

#### `date: T`

The date value in the active calendar system's representation.

```ts
// Gregorian: { y: 2024, m: 4, d: 15 }
// Hijri: { hy: 1446, hm: 10, hd: 7 }
```

#### `nativeDate: Date`

The date as a native JavaScript Date for convenience.

```ts
const dateString = info.nativeDate.toISOString(); // "2024-05-15T00:00:00.000Z"
```

#### `label: string`

The formatted day label (typically just the day number).

```ts
const label = info.label; // "15"
```

### Position

#### `isCurrentMonth: boolean`

Whether this cell falls within the currently displayed month (false for outside days).

```tsx
{!info.isCurrentMonth && <Text style={styles.outsideDay}>{info.label}</Text>}
```

### State

#### `isToday: boolean`

Whether this cell represents today.

```tsx
{info.isToday && <View style={styles.todayIndicator} />}
```

#### `isSelected: boolean`

Whether this cell is selected (includes single, multi, range start, and range end).

```tsx
style={[
  styles.cell,
  info.isSelected && styles.selectedCell,
]}
```

#### `inRange: boolean`

Whether this cell falls strictly between range endpoints (exclusive of start/end).

```tsx
style={[
  styles.cell,
  info.inRange && styles.rangeCell,
]}
```

#### `isRangeStart: boolean`

Whether this cell is the start of a selected range.

```tsx
style={[
  styles.cell,
  info.isRangeStart && styles.rangeStartCell,
]}
```

#### `isRangeEnd: boolean`

Whether this cell is the end of a selected range.

```tsx
style={[
  styles.cell,
  info.isRangeEnd && styles.rangeEndCell,
]}
```

#### `isDisabled: boolean`

Whether this cell is disabled (out of bounds, in disabled list, or matches disabled predicate).

```tsx
<Pressable
  disabled={info.isDisabled}
  onPress={() => onSelect(info.date)}
  style={info.isDisabled && styles.disabled}
>
```

### Modifiers

#### `modifiers: Readonly<Record<string, boolean>>`

Map of modifier names to boolean flags. Set via `<Calendar.Root modifiers={{...}}>`.

```tsx
// With modifiers={{ booked: [...], holiday: [...] }}
{info.modifiers.booked && <View style={styles.bookedIndicator} />}
{info.modifiers.holiday && <View style={styles.holidayIndicator} />}
```

### Week Numbers

#### `weekNumber?: number`

The ISO week number for this row (only present when `showWeekNumbers` is enabled).

```tsx
{info.weekNumber && <Text>W{info.weekNumber}</Text>}
```

## Complete Example

```tsx
import { DayCellInfo, useCalendarStore, useCalendarTheme } from 'react-native-fast-calendar';
import { Pressable, Text, View, StyleSheet } from 'react-native';

function MyDayCell({ info }: { info: DayCellInfo }) {
  const store = useCalendarStore();
  const theme = useCalendarTheme();

  // Determine cell styles
  let backgroundColor = 'transparent';
  let textColor = theme.colors.text;
  let borderRadius = theme.borderRadius;

  if (info.isSelected) {
    backgroundColor = theme.colors.primary;
    textColor = theme.colors.onPrimary;
  } else if (info.inRange) {
    backgroundColor = theme.colors.rangeBackground;
    textColor = theme.colors.text;
    borderRadius = 0;
  }

  // Check if outside current month
  if (!info.isCurrentMonth) {
    textColor = theme.colors.disabled;
  }

  return (
    <Pressable
      onPress={() => store.selectDate(info.date)}
      disabled={info.isDisabled}
      style={[
        styles.cell,
        {
          width: theme.cellSize,
          height: theme.cellSize,
          backgroundColor,
          borderRadius,
          opacity: info.isDisabled ? 0.4 : 1,
          borderWidth: info.isToday && !info.isSelected ? 1 : 0,
          borderColor: theme.colors.todayBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: textColor,
            fontSize: theme.fontSize.day,
            fontWeight: info.isSelected ? '600' : '400',
          },
        ]}
      >
        {info.label}
      </Text>

      {/* Modifier indicators */}
      <View style={styles.indicators}>
        {info.modifiers.booked && (
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
        )}
        {info.modifiers.holiday && (
          <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
        )}
      </View>

      {/* Range indicators */}
      {info.isRangeStart && <View style={styles.rangeStartIndicator} />}
      {info.isRangeEnd && <View style={styles.rangeEndIndicator} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontVariant: ['tabular-nums'],
  },
  indicators: {
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
  rangeStartIndicator: {
    position: 'absolute',
    left: 0,
    right: '50%',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  rangeEndIndicator: {
    position: 'absolute',
    left: '50%',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
```

## DayRenderer Type

For custom `renderDay` props:

```ts
type DayRenderer<T = CalendarDateValue> = (
  info: DayCellInfo<T>
) => ReactNode;
```

Usage:

```tsx
<Calendar.DayGrid
  renderDay={(info: DayCellInfo) => (
    <MyCustomDayCell info={info} />
  )}
/>
```
