---
sidebar_position: 5
---

# useCalendarHeader

The `useCalendarHeader` hook is a **convenience compound** that combines month label, year label, and navigation into a single hook. It's useful for building standard calendar headers.

## Signature

```ts
interface CalendarHeader {
  /** Localised month name for the displayed month */
  monthLabel: string;
  /** Single year string in day/month view, "YYYY - YYYY" in year view */
  yearLabel: string;
  /** False while year picker is open (month label should hide) */
  isMonthVisible: boolean;
  /** Switch between day and month views */
  toggleMonthPicker: () => void;
  /** Switch between day and year views */
  toggleYearPicker: () => void;
  /** Step backward (month/year/year-page depending on view). RTL-aware. */
  goPrev: () => void;
  /** Step forward (month/year/year-page depending on view). RTL-aware. */
  goNext: () => void;
}

function useCalendarHeader(): CalendarHeader;
```

## What It Combines

This hook is equivalent to using:

```tsx
// useCalendarHeader combines:
const month = useCalendarMonthLabel();
const year = useCalendarYearLabel();
const nav = useCalendarNavigation();

// Into:
const header = useCalendarHeader();
// header.monthLabel = month.label
// header.yearLabel = year.label
// header.toggleMonthPicker = month.toggle
// header.toggleYearPicker = year.toggle
// header.goPrev = nav.goPrev
// header.goNext = nav.goNext
```

## Basic Usage

```tsx
import { useCalendarHeader } from 'react-native-fast-calendar';

function MyHeader() {
  const {
    monthLabel,
    yearLabel,
    isMonthVisible,
    toggleMonthPicker,
    toggleYearPicker,
    goPrev,
    goNext,
  } = useCalendarHeader();

  return (
    <View style={styles.header}>
      <View style={styles.labels}>
        {isMonthVisible && (
          <Button onPress={toggleMonthPicker} title={monthLabel} />
        )}
        <Button onPress={toggleYearPicker} title={yearLabel} />
      </View>

      <View style={styles.nav}>
        <Button onPress={goPrev} title="‹" />
        <Button onPress={goNext} title="›" />
      </View>
    </View>
  );
}
```

## Month Visibility

The `isMonthVisible` flag is `false` when the year picker is open. This prevents the month label from jumping confusingly as you page through year ranges:

```tsx
function MyHeader() {
  const { monthLabel, isMonthVisible, toggleMonthPicker } = useCalendarHeader();

  return (
    <View>
      {isMonthVisible ? (
        <Button onPress={toggleMonthPicker} title={monthLabel} />
      ) : (
        <Text style={styles.dimmed}>Select Year</Text>
      )}
    </View>
  );
}
```

## Year Label Format

The `yearLabel` adapts based on the current view:

- **Day view:** "2024"
- **Month view:** "2024"
- **Year view:** "2016 - 2027" (the current 12-year page)

```tsx
function MyHeader() {
  const { yearLabel, toggleYearPicker } = useCalendarHeader();
  const view = useCalendarSelector(s => s.view);

  return (
    <Button onPress={toggleYearPicker}>
      <Text>
        {view === 'year' ? 'Years: ' : ''}
        {yearLabel}
      </Text>
    </Button>
  );
}
```

## Complete Example

```tsx
import {
  Calendar,
  useCalendarHeader,
  useCalendarSystemSwitcher,
  useCalendarTheme,
} from 'react-native-fast-calendar';
import { Pressable, Text, View, StyleSheet } from 'react-native';

function FullHeaderExample() {
  return (
    <Calendar.Root
      mode="single"
      systems={[gregorianSystem, hijriSystem]}
    >
      <View>
        <FullHeader />
        <Calendar.DayGrid />
      </View>
    </Calendar.Root>
  );
}

function FullHeader() {
  const theme = useCalendarTheme();
  const {
    monthLabel,
    yearLabel,
    isMonthVisible,
    toggleMonthPicker,
    toggleYearPicker,
    goPrev,
    goNext,
  } = useCalendarHeader();

  const { systems, activeId, setActive } = useCalendarSystemSwitcher();

  return (
    <View style={styles.container}>
      {/* System Switcher */}
      {systems.length > 1 && (
        <View style={styles.systems}>
          {systems.map(s => (
            <Pressable
              key={s.id}
              onPress={() => setActive(s.id)}
              style={[
                styles.systemButton,
                s.id === activeId && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.systemText,
                  s.id === activeId && { color: theme.colors.onPrimary },
                ]}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Month/Year Labels */}
      <View style={styles.headerRow}>
        <View style={styles.labels}>
          {isMonthVisible && (
            <Pressable onPress={toggleMonthPicker} style={styles.labelButton}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {monthLabel}
              </Text>
            </Pressable>
          )}
          <Pressable onPress={toggleYearPicker} style={styles.labelButton}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {yearLabel}
            </Text>
          </Pressable>
        </View>

        {/* Navigation */}
        <View style={styles.nav}>
          <Pressable
            onPress={goPrev}
            style={[styles.navButton, { backgroundColor: theme.colors.border }]}
          >
            <Text style={[styles.navArrow, { color: theme.colors.text }]}>
              ‹
            </Text>
          </Pressable>
          <Pressable
            onPress={goNext}
            style={[styles.navButton, { backgroundColor: theme.colors.border }]}
          >
            <Text style={[styles.navArrow, { color: theme.colors.text }]}>
              ›
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  systems: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  systemButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  systemText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelButton: {
    paddingVertical: 4,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
  },
  nav: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  navArrow: {
    fontSize: 20,
    fontWeight: '500',
  },
});
```

## When to Use

**Use `useCalendarHeader` when:**
- Building a standard calendar header
- You need month/year labels + navigation together
- You want a single import instead of three separate hooks

**Use individual hooks when:**
- You only need month label (use `useCalendarMonthLabel`)
- You only need navigation (use `useCalendarNavigation`)
- You want more granular control over re-renders
