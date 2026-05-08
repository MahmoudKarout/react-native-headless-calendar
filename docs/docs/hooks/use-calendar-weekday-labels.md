---
sidebar_position: 12
---

# useCalendarWeekdayLabels

The `useCalendarWeekdayLabels` hook returns weekday labels rotated to match the active `firstDayOfWeek`.

## Signature

```ts
function useCalendarWeekdayLabels(): readonly string[];
```

## Basic Usage

```tsx
import { useCalendarWeekdayLabels } from 'react-native-fast-calendar';

function MyWeekdayHeader() {
  const labels = useCalendarWeekdayLabels();

  return (
    <View style={styles.row}>
      {labels.map((label, index) => (
        <Text key={index} style={styles.label}>
          {label}
        </Text>
      ))}
    </View>
  );
}
```

## Rotation

The labels are automatically rotated based on `firstDayOfWeek`:

| firstDayOfWeek | Labels (English) |
|---------------|------------------|
| 0 (Sunday) | Sun, Mon, Tue, Wed, Thu, Fri, Sat |
| 1 (Monday) | Mon, Tue, Wed, Thu, Fri, Sat, Sun |
| 6 (Saturday) | Sat, Sun, Mon, Tue, Wed, Thu, Fri |

```tsx
// firstDayOfWeek={0} (Sunday start)
const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// firstDayOfWeek={1} (Monday start)
const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
```

## Calendar System Labels

Labels come from the active calendar system:

```tsx
// Gregorian system (default)
const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Custom French system
const labels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Hijri system
const labels = ['Ahad', 'Ithnayn', 'Thulatha', 'Arbaa', 'Khamees', 'Jumma', 'Sabt'];
```

## Complete Example

```tsx
import {
  Calendar,
  useCalendarWeekdayLabels,
  useCalendarTheme,
  useCalendarFirstDayOfWeek,
} from 'react-native-fast-calendar';
import { View, Text, StyleSheet } from 'react-native';

function CustomWeekdayHeaderExample() {
  return (
    <Calendar.Root firstDayOfWeek={1}>
      <View>
        <CustomWeekdayHeader />
        <Calendar.DayGrid />
      </View>
    </Calendar.Root>
  );
}

function CustomWeekdayHeader() {
  const theme = useCalendarTheme();
  const labels = useCalendarWeekdayLabels();
  const firstDayOfWeek = useCalendarFirstDayOfWeek();

  // Weekend highlighting (for Saturday/Sunday weekend)
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
                ? '#DC2626' // Red for weekends
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
  row: {
    flexDirection: 'row',
  },
  label: {
    textAlign: 'center',
    fontWeight: '500',
  },
});
```

## Memoization

The rotation is memoized on the underlying labels array + offset:

```tsx
const baseLabels = useCalendarSelector((s) => s.system.weekdayLabels());
const firstDayOfWeek = useCalendarFirstDayOfWeek();

return useMemo(
  () => rotateWeekdayLabels(baseLabels, firstDayOfWeek),
  [baseLabels, firstDayOfWeek]
);
```

Returns the input array as-is when no rotation is needed, allowing downstream consumers to use the result as a stable dependency.

## Alternative: Component Slot

Instead of building a custom header, you can use the `WeekdayHeader` component slot:

```tsx
<Calendar.Root
  components={{
    WeekdayHeader: MyCustomWeekdayHeader,
  }}
>
  <Calendar.DayGrid />
</Calendar.Root>
```

Or replace individual cells:

```tsx
<Calendar.Root
  components={{
    WeekdayCell: MyCustomWeekdayCell,
  }}
>
  <Calendar.DayGrid />
</Calendar.Root>
```
