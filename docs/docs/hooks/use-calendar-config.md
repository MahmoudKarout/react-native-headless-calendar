---
sidebar_position: 14
---

# useCalendarConfig

The `useCalendarConfig` hook provides access to the complete configuration object passed to `<Calendar.Root>`. This includes theme, labels, systems, and layout settings.

## Signature

```ts
interface CalendarConfig {
  theme: CalendarTheme;
  labels: CalendarLabels;
  systems: readonly CalendarSystem[];
  firstDayOfWeek: Weekday;
  showOutsideDays: boolean;
  fixedWeeks: boolean;
  modifiers?: CalendarModifiers;
  components?: CalendarComponents;
  onConfirm?: OnConfirm;
  onClear?: OnClear;
  onSystemChange?: OnSystemChange;
  onSelectHaptic?: () => void;
  testID?: string;
}

function useCalendarConfig(): CalendarConfig;
```

## Basic Usage

```tsx
import { useCalendarConfig } from 'react-native-fast-calendar';

function MyComponent() {
  const config = useCalendarConfig();

  return (
    <View>
      <Text>First day: {config.firstDayOfWeek}</Text>
      <Text>Show outside: {config.showOutsideDays ? 'Yes' : 'No'}</Text>
    </View>
  );
}
```

## Convenience Hooks

For common use cases, prefer the more specific hooks:

```tsx
// Instead of this
const { theme } = useCalendarConfig();

// Use this
const theme = useCalendarTheme();

// Instead of this
const { labels } = useCalendarConfig();

// Use this
const labels = useCalendarLabels();
```

## Accessing Callbacks

Use this hook when you need to access the configured callbacks:

```tsx
function CustomConfirmButton() {
  const { onConfirm } = useCalendarConfig();
  const store = useCalendarStore();

  const handleConfirm = () => {
    const snapshot = store.getSnapshot();

    // Custom validation
    if (!snapshot.selectedDate) {
      Alert.alert('Please select a date');
      return;
    }

    // Call the configured callback
    onConfirm?.({
      date: snapshot.system.toNativeDate(snapshot.selectedDate),
      systemId: snapshot.system.id,
    });
  };

  return <Button onPress={handleConfirm} title="Confirm" />;
}
```

## Accessing Modifiers

```tsx
import { useCalendarConfig, useCalendarSelector } from 'react-native-fast-calendar';

function CustomDayCell({ info }) {
  const { modifiers } = useCalendarConfig();

  // Check if any modifiers are configured
  const hasModifiers = modifiers && Object.keys(modifiers).length > 0;

  return (
    <View>
      <Text>{info.label}</Text>
      {hasModifiers && Object.entries(info.modifiers).map(([name, active]) => (
        active && <Indicator key={name} type={name} />
      ))}
    </View>
  );
}
```

## Accessing Component Slots

```tsx
function CustomGrid() {
  const { components } = useCalendarConfig();

  // Use custom WeekdayHeader if provided
  const WeekdayHeader = components?.WeekdayHeader;

  if (WeekdayHeader) {
    return <WeekdayHeader labels={weekdayLabels} />;
  }

  // Default implementation
  return <DefaultWeekdayHeader />;
}
```

## Complete Example

```tsx
import { Calendar, useCalendarConfig, useCalendarTheme } from 'react-native-fast-calendar';
import { View, Text, StyleSheet } from 'react-native';

function ConfigExample() {
  return (
    <Calendar.Root
      mode="single"
      firstDayOfWeek={1}
      showOutsideDays={false}
      modifiers={{
        weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
      }}
    >
      <View>
        <ConfigInfo />
        <Calendar.DayGrid />
      </View>
    </Calendar.Root>
  );
}

function ConfigInfo() {
  const config = useCalendarConfig();
  const theme = useCalendarTheme();

  const firstDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.text, { color: theme.colors.text }]}>
        First day: {firstDayNames[config.firstDayOfWeek]}
      </Text>
      <Text style={[styles.text, { color: theme.colors.text }]}>
        Outside days: {config.showOutsideDays ? 'Shown' : 'Hidden'}
      </Text>
      <Text style={[styles.text, { color: theme.colors.text }]}>
        Fixed weeks: {config.fixedWeeks ? 'Yes' : 'No'}
      </Text>
      {config.modifiers && (
        <Text style={[styles.text, { color: theme.colors.text }]}>
          Modifiers: {Object.keys(config.modifiers).join(', ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
  },
});
```

## Important Notes

### Config Updates Infrequently

The `CalendarConfigContext` splits from the store so that a date tap doesn't propagate any context change. Config updates only happen when props to `<Calendar.Root>` actually change.

### Error Handling

The hook throws a clear error if used outside `<Calendar.Root>`:

```
Error: [Calendar] useCalendarConfig must be used within <Calendar.Root>
```
