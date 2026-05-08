---
sidebar_position: 9
---

# useCalendarYearPicker

The `useCalendarYearPicker` hook provides data and actions for building a 12-cell paginated year chooser grid.

## Signature

```ts
interface CalendarYearPicker {
  /** 12 years aligned to the YEAR_PAGE_SIZE window containing activeYear */
  years: readonly number[];
  /** Year currently displayed (and centered-ish in years) */
  activeYear: number;
  /** Jump to the given year and switch back to day view */
  selectYear: (year: number) => void;
}

function useCalendarYearPicker(): CalendarYearPicker;
```

## Basic Usage

```tsx
import { useCalendarYearPicker } from 'react-native-fast-calendar';

function YearPicker() {
  const { years, activeYear, selectYear } = useCalendarYearPicker();

  return (
    <View style={styles.grid}>
      {years.map((year) => (
        <Pressable
          key={year}
          onPress={() => selectYear(year)}
          style={[
            styles.cell,
            year === activeYear && styles.active,
          ]}
        >
          <Text style={year === activeYear ? styles.activeText : styles.text}>
            {year}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
```

## Year Page

The `years` array is always 12 consecutive years, aligned to the `YEAR_PAGE_SIZE` (12) boundary:

| Displayed Year | Years Array |
|---------------|-------------|
| 2023 | [2016, 2017, ..., 2027] |
| 2027 | [2016, 2017, ..., 2027] |
| 2028 | [2028, 2029, ..., 2039] |

The active year typically appears in the middle-to-end of the array.

## Pagination

Use `useCalendarNavigation()` to page through year ranges:

```tsx
import {
  useCalendarYearPicker,
  useCalendarNavigation,
} from 'react-native-fast-calendar';

function YearPickerWithPagination() {
  const { years, activeYear, selectYear } = useCalendarYearPicker();
  const { goPrev, goNext } = useCalendarNavigation();
  const { label } = useCalendarYearLabel();

  return (
    <View>
      <View style={styles.header}>
        <Button onPress={goPrev} title="‹" />
        <Text>{label}</Text>
        <Button onPress={goNext} title="›" />
      </View>

      <View style={styles.grid}>
        {years.map((year) => (
          <Pressable
            key={year}
            onPress={() => selectYear(year)}
            style={[
              styles.cell,
              year === activeYear && styles.active,
            ]}
          >
            <Text>{year}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

:::info
In year view, `goPrev` and `goNext` step by 12 years (one page), not 1 year.
:::

## Selection

`selectYear(year)`:

1. Jumps the displayed date to the selected year (keeping the current month)
2. Switches the view back to `'day'`

```tsx
function MyYearPicker() {
  const { years, activeYear, selectYear } = useCalendarYearPicker();

  const handleSelect = (year: number) => {
    selectYear(year);
    // View automatically switches back to day grid
  };

  // ...
}
```

## Complete Example

```tsx
import {
  Calendar,
  useCalendarYearPicker,
  useCalendarNavigation,
  useCalendarYearLabel,
  useCalendarTheme,
} from 'react-native-fast-calendar';
import { Pressable, Text, View, StyleSheet } from 'react-native';

function YearPickerExample() {
  return (
    <Calendar.Root mode="single">
      <View>
        <YearPickerView />
      </View>
    </Calendar.Root>
  );
}

function YearPickerView() {
  const view = useCalendarSelector(s => s.view);

  if (view === 'year') {
    return <YearPicker />;
  }

  return <Calendar.DayGrid />;
}

function YearPicker() {
  const theme = useCalendarTheme();
  const { years, activeYear, selectYear } = useCalendarYearPicker();
  const { goPrev, goNext } = useCalendarNavigation();
  const { label } = useCalendarYearLabel();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={goPrev}
          style={[styles.navButton, { backgroundColor: theme.colors.border }]}
        >
          <Text style={{ color: theme.colors.text }}>‹</Text>
        </Pressable>
        <Text style={[styles.rangeLabel, { color: theme.colors.text }]}>
          {label}
        </Text>
        <Pressable
          onPress={goNext}
          style={[styles.navButton, { backgroundColor: theme.colors.border }]}
        >
          <Text style={{ color: theme.colors.text }}>›</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {years.map((year) => (
          <Pressable
            key={year}
            onPress={() => selectYear(year)}
            style={[
              styles.cell,
              {
                backgroundColor:
                  year === activeYear
                    ? theme.colors.primary
                    : 'transparent',
              },
            ]}
          >
            <Text
              style={{
                color:
                  year === activeYear
                    ? theme.colors.onPrimary
                    : theme.colors.text,
              }}
            >
              {year}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  rangeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '33.33%',
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
});
```

## Bounds Checking

When implementing a year picker, you may want to disable years outside `minDate`/`maxDate`:

```tsx
function BoundedYearPicker() {
  const { years, activeYear, selectYear } = useCalendarYearPicker();
  const system = useCalendarSelector(s => s.system);
  const minDate = useCalendarSelector(s => s.minDate);
  const maxDate = useCalendarSelector(s => s.maxDate);

  const minYear = minDate ? system.year(minDate) : null;
  const maxYear = maxDate ? system.year(maxDate) : null;

  return (
    <View style={styles.grid}>
      {years.map((year) => {
        const isDisabled =
          (minYear !== null && year < minYear) ||
          (maxYear !== null && year > maxYear);

        return (
          <Pressable
            key={year}
            onPress={() => selectYear(year)}
            disabled={isDisabled}
            style={[
              styles.cell,
              year === activeYear && styles.active,
              isDisabled && styles.disabled,
            ]}
          >
            <Text
              style={[
                year === activeYear && styles.activeText,
                isDisabled && styles.disabledText,
              ]}
            >
              {year}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```
