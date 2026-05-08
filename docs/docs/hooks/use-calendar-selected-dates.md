---
sidebar_position: 11
---

# useCalendarSelectedDates

The `useCalendarSelectedDates` hook returns the array of selected dates in **multiple mode**. In single or range mode, it returns an empty array.

## Signature

```ts
function useCalendarSelectedDates<T = unknown>(): readonly T[];
```

## Basic Usage

```tsx
import { useCalendarSelectedDates } from 'react-native-fast-calendar';

function SelectedCount() {
  const selectedDates = useCalendarSelectedDates();

  return (
    <Text>
      Selected {selectedDates.length} dates
    </Text>
  );
}
```

## Multiple Mode Only

This hook is specifically for multiple selection mode:

```tsx
function MyCalendar() {
  return (
    <Calendar.Root mode="multiple" maxSelected={5}>
      <View>
        <SelectionInfo />
        <Calendar.DayGrid />
      </View>
    </Calendar.Root>
  );
}

function SelectionInfo() {
  const selectedDates = useCalendarSelectedDates();
  const maxSelected = useCalendarSelector(s => s.maxSelected);

  return (
    <View>
      <Text>
        Selected {selectedDates.length} of {maxSelected} dates
      </Text>
      <Text>
        {selectedDates.map(d => d.toString()).join(', ')}
      </Text>
    </View>
  );
}
```

## Date Order

Dates are returned in the order they were selected (append-only):

```tsx
function SelectedList() {
  const selectedDates = useCalendarSelectedDates();
  const system = useCalendarSelector(s => s.system);

  return (
    <FlatList
      data={selectedDates}
      keyExtractor={(date) => system.toNativeDate(date).toISOString()}
      renderItem={({ item }) => (
        <Text>{system.formatMonthYear(item)}</Text>
      )}
    />
  );
}
```

## Empty in Other Modes

In single or range mode, the hook returns an empty array:

```tsx
function UniversalInfo() {
  const mode = useCalendarSelector(s => s.mode);
  const selectedDate = useCalendarSelector(s => s.selectedDate);
  const rangeStart = useCalendarSelector(s => s.rangeStart);
  const rangeEnd = useCalendarSelector(s => s.rangeEnd);
  const selectedDates = useCalendarSelectedDates(); // [] in single/range

  if (mode === 'single') {
    return <Text>Selected: {selectedDate?.toString()}</Text>;
  }

  if (mode === 'range') {
    return (
      <Text>
        Range: {rangeStart?.toString()} to {rangeEnd?.toString()}
      </Text>
    );
  }

  return <Text>Selected {selectedDates.length} dates</Text>;
}
```

## Complete Example

```tsx
import {
  Calendar,
  useCalendarSelectedDates,
  useCalendarStore,
  useCalendarTheme,
} from 'react-native-fast-calendar';
import { View, Text, Pressable, StyleSheet } from 'react-native';

function MultiSelectExample() {
  return (
    <Calendar.Root
      mode="multiple"
      maxSelected={5}
      onConfirm={({ dates }) => {
        console.log('Selected dates:', dates);
      }}
    >
      <View style={styles.container}>
        <SelectionHeader />
        <SelectedChips />
        <Calendar.DayGrid />
      </View>
    </Calendar.Root>
  );
}

function SelectionHeader() {
  const selectedDates = useCalendarSelectedDates();
  const maxSelected = useCalendarSelector(s => s.maxSelected);

  return (
    <View style={styles.header}>
      <Text style={styles.headerText}>
        Selected {selectedDates.length}
        {maxSelected ? ` of ${maxSelected}` : ''} dates
      </Text>
    </View>
  );
}

function SelectedChips() {
  const theme = useCalendarTheme();
  const selectedDates = useCalendarSelectedDates();
  const system = useCalendarSelector(s => s.system);
  const store = useCalendarStore();

  if (selectedDates.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
        Tap dates to select
      </Text>
    );
  }

  return (
    <View style={styles.chipsContainer}>
      {selectedDates.map((date, index) => (
        <Pressable
          key={index}
          onPress={() => store.toggleDate(date)}
          style={[
            styles.chip,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={{ color: theme.colors.onPrimary }}>
            {system.formatDay(date)}
          </Text>
          <Text style={[styles.removeIcon, { color: theme.colors.onPrimary }]}>
            ×
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    marginBottom: 12,
    fontStyle: 'italic',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  removeIcon: {
    fontSize: 16,
    marginLeft: 4,
  },
});
```

## Identity Stability

The returned array reference only changes when the underlying selection changes (after a tap or `store.clear()`). This makes it safe to use in `useEffect` dependencies:

```tsx
const selectedDates = useCalendarSelectedDates();

useEffect(() => {
  // Runs only when selection actually changes
  console.log('Selection changed:', selectedDates);
}, [selectedDates]);
```
