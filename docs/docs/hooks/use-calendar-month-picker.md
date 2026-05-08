---
sidebar_position: 8
---

# useCalendarMonthPicker

The `useCalendarMonthPicker` hook provides data and actions for building a 12-cell month chooser grid.

## Signature

```ts
interface CalendarMonthPickerEntry {
  /** 0-based month index expected by selectMonth */
  index: number;
  /** Localised name for that month, in the active system */
  label: string;
}

interface CalendarMonthPicker {
  /** Array of all 12 months with indices and labels */
  months: readonly CalendarMonthPickerEntry[];
  /** 0-based index of the currently displayed month */
  activeMonth: number;
  /** Jump to the given month and switch back to day view */
  selectMonth: (index: number) => void;
}

function useCalendarMonthPicker(): CalendarMonthPicker;
```

## Basic Usage

```tsx
import { useCalendarMonthPicker } from 'react-native-fast-calendar';

function MonthPicker() {
  const { months, activeMonth, selectMonth } = useCalendarMonthPicker();

  return (
    <View style={styles.grid}>
      {months.map((m) => (
        <Pressable
          key={m.index}
          onPress={() => selectMonth(m.index)}
          style={[
            styles.cell,
            m.index === activeMonth && styles.active,
          ]}
        >
          <Text style={m.index === activeMonth ? styles.activeText : styles.text}>
            {m.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
```

## Month Data

The `months` array is identity-stable while the active system doesn't change:

```ts
[
  { index: 0, label: 'January' },
  { index: 1, label: 'February' },
  // ... etc
  { index: 11, label: 'December' },
]
```

Labels come from the active calendar system:

```ts
// Gregorian
const labels = ['January', 'February', ..., 'December'];

// Hijri
const labels = ['Muharram', 'Safar', ..., 'Dhu al-Hijjah'];
```

## Selection

`selectMonth(index)`:

1. Jumps the displayed date to the selected month (keeping the current year)
2. Switches the view back to `'day'`

```tsx
function MyMonthPicker() {
  const { months, activeMonth, selectMonth } = useCalendarMonthPicker();

  const handleSelect = (index: number) => {
    selectMonth(index);
    // View automatically switches back to day grid
  };

  // ...
}
```

## Complete Example

```tsx
import {
  Calendar,
  useCalendarMonthPicker,
  useCalendarTheme,
} from 'react-native-fast-calendar';
import { Pressable, Text, View, StyleSheet } from 'react-native';

function MonthPickerExample() {
  return (
    <Calendar.Root mode="single">
      <View>
        <MonthPickerView />
      </View>
    </Calendar.Root>
  );
}

function MonthPickerView() {
  const view = useCalendarSelector(s => s.view);

  if (view === 'month') {
    return <MonthPicker />;
  }

  return <Calendar.DayGrid />;
}

function MonthPicker() {
  const theme = useCalendarTheme();
  const { months, activeMonth, selectMonth } = useCalendarMonthPicker();

  return (
    <View style={styles.container}>
      {months.map((m) => (
        <Pressable
          key={m.index}
          onPress={() => selectMonth(m.index)}
          style={[
            styles.cell,
            {
              backgroundColor:
                m.index === activeMonth
                  ? theme.colors.primary
                  : 'transparent',
            },
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                color:
                  m.index === activeMonth
                    ? theme.colors.onPrimary
                    : theme.colors.text,
              },
            ]}
          >
            {m.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  cell: {
    width: '33.33%',
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
```

## Styling Short Months

For calendar systems with varying month lengths:

```tsx
function HijriMonthPicker() {
  const { months, activeMonth, selectMonth } = useCalendarMonthPicker();
  const system = useCalendarSelector(s => s.system);

  return (
    <View>
      {months.map((m) => {
        // For Hijri, you might want to show days in month
        const isSacred = [0, 6, 7, 11].includes(m.index); // Muharram, Rajab, Shaban, Dhul Hijjah

        return (
          <Pressable
            key={m.index}
            onPress={() => selectMonth(m.index)}
            style={[
              styles.cell,
              m.index === activeMonth && styles.active,
              isSacred && styles.sacredMonth,
            ]}
          >
            <Text>{m.label}</Text>
            {isSacred && <Text style={styles.badge}>Sacred</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}
```
