---
sidebar_position: 10
---

# useCalendarSystemSwitcher

The `useCalendarSystemSwitcher` hook provides the list of configured calendar systems, the active system ID, and a function to switch between them.

## Signature

```ts
interface CalendarSystemSwitcher {
  /** All systems configured on <Calendar.Root systems={...}> */
  systems: readonly CalendarSystem[];
  /** ID of the currently active system */
  activeId: string;
  /** Activate a different system */
  setActive: (systemId: string) => void;
}

function useCalendarSystemSwitcher(): CalendarSystemSwitcher;
```

## Basic Usage

```tsx
import { useCalendarSystemSwitcher } from 'react-native-fast-calendar';

function SystemSwitcher() {
  const { systems, activeId, setActive } = useCalendarSystemSwitcher();

  // Don't render if only one system
  if (systems.length < 2) return null;

  return (
    <View style={styles.container}>
      {systems.map((s) => (
        <Button
          key={s.id}
          active={s.id === activeId}
          onPress={() => setActive(s.id)}
          title={s.label}
        />
      ))}
    </View>
  );
}
```

## System Object

Each system in the `systems` array implements the `CalendarSystem` interface:

```ts
interface CalendarSystem<T> {
  id: string;
  label: string;
  today(): T;
  fromNativeDate(d: Date): T;
  from(input: unknown): T;
  year(d: T): number;
  month(d: T): number;
  day(d: T): number;
  // ... etc
}
```

## Switching Systems

When `setActive(id)` is called:

1. Finds the system with matching ID in the configured systems array
2. Converts all dates (displayed, selected, bounds) to the new system
3. Updates the active system
4. Calls `onSystemChange` callback (if provided to Root)

```tsx
function MySwitcher() {
  const { systems, activeId, setActive } = useCalendarSystemSwitcher();

  const handleSwitch = (id: string) => {
    setActive(id);
    // Dates are automatically converted to the new system
  };

  return (
    <SegmentedControl
      values={systems.map(s => s.label)}
      selectedIndex={systems.findIndex(s => s.id === activeId)}
      onChange={(event) => {
        const index = event.nativeEvent.selectedSegmentIndex;
        setActive(systems[index].id);
      }}
    />
  );
}
```

## Complete Example

```tsx
import {
  Calendar,
  useCalendarSystemSwitcher,
  useCalendarTheme,
} from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';
import { Pressable, Text, View, StyleSheet } from 'react-native';

function SystemSwitcherExample() {
  return (
    <Calendar.Root
      mode="single"
      systems={[gregorianSystem, hijriSystem]}
      onSystemChange={(id) => {
        console.log('Switched to calendar system:', id);
      }}
    >
      <View>
        <SystemSwitcher />
        <Calendar.DayGrid />
      </View>
    </Calendar.Root>
  );
}

function SystemSwitcher() {
  const theme = useCalendarTheme();
  const { systems, activeId, setActive } = useCalendarSystemSwitcher();

  if (systems.length < 2) {
    return null;
  }

  return (
    <View style={styles.container}>
      {systems.map((system) => (
        <Pressable
          key={system.id}
          onPress={() => setActive(system.id)}
          style={[
            styles.button,
            {
              backgroundColor:
                system.id === activeId
                  ? theme.colors.primary
                  : theme.colors.border,
            },
          ]}
        >
          <Text
            style={{
              color:
                system.id === activeId
                  ? theme.colors.onPrimary
                  : theme.colors.text,
            }}
          >
            {system.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
```

## Date Conversion on Switch

When switching systems, dates are preserved by converting through native `Date`:

```tsx
// Before switch: Gregorian May 15, 2024
const gregorianDate = { y: 2024, m: 4, d: 15 };

// After switch to Hijri: Safar 7, 1446 (same calendar day)
const hijriDate = { hy: 1446, hm: 1, hd: 7 };
```

This ensures:
- Selected dates remain selected
- Displayed month shows the equivalent date
- Min/max bounds are preserved

## Invalid IDs

`setActive` silently ignores invalid system IDs:

```tsx
const { setActive } = useCalendarSystemSwitcher();

// Systems are [gregorian, hijri]
setActive('chinese'); // No-op, no error
```

## Integration with Headers

```tsx
function FullHeader() {
  const {
    monthLabel,
    yearLabel,
    goPrev,
    goNext,
  } = useCalendarHeader();

  const { systems, activeId, setActive } = useCalendarSystemSwitcher();

  return (
    <View>
      {/* System Switcher */}
      {systems.length > 1 && (
        <View style={styles.systems}>
          {systems.map(s => (
            <Button
              key={s.id}
              active={s.id === activeId}
              onPress={() => setActive(s.id)}
              title={s.label}
            />
          ))}
        </View>
      )}

      {/* Navigation */}
      <View style={styles.nav}>
        <Text>{monthLabel} {yearLabel}</Text>
        <Button onPress={goPrev} title="‹" />
        <Button onPress={goNext} title="›" />
      </View>
    </View>
  );
}
```
