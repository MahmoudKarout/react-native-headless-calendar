---
sidebar_position: 16
---

# useCalendarLabels

The `useCalendarLabels` hook provides access to the merged labels object. Use it to display action buttons and accessibility labels in the correct language.

## Signature

```ts
function useCalendarLabels(): CalendarLabels;
```

## Labels Structure

```ts
interface CalendarLabels {
  prev: string;        // "Previous"
  next: string;        // "Next"
  confirm: string;     // "Confirm"
  clear: string;       // "Clear"
  selectMonth: string; // "Select month"
  selectYear: string;  // "Select year"
}
```

## Basic Usage

```tsx
import { useCalendarLabels } from 'react-native-fast-calendar';

function MyFooter() {
  const { confirm, clear } = useCalendarLabels();
  const { confirm: doConfirm, clear: doClear } = useCalendarActions();

  return (
    <View>
      <Button onPress={doClear} title={clear} />
      <Button onPress={doConfirm} title={confirm} />
    </View>
  );
}
```

## Localization Example

```tsx
// French labels
<Calendar.Root
  labels={{
    prev: 'Précédent',
    next: 'Suivant',
    confirm: 'Confirmer',
    clear: 'Effacer',
    selectMonth: 'Choisir le mois',
    selectYear: "Choisir l'année",
  }}
>
  <MyCalendar />
</Calendar.Root>
```

## Complete Example

```tsx
import {
  Calendar,
  useCalendarLabels,
  useCalendarActions,
  useCalendarNavigation,
} from 'react-native-fast-calendar';
import { View, Text, Pressable, StyleSheet } from 'react-native';

function LabelsExample() {
  return (
    <Calendar.Root
      mode="single"
      labels={{
        prev: '←',
        next: '→',
        confirm: 'Done',
        clear: 'Reset',
      }}
    >
      <View>
        <NavigationWithLabels />
        <Calendar.DayGrid />
        <ActionsWithLabels />
      </View>
    </Calendar.Root>
  );
}

function NavigationWithLabels() {
  const { prev, next } = useCalendarLabels();
  const { goPrev, goNext } = useCalendarNavigation();

  return (
    <View style={styles.nav}>
      <Pressable
        onPress={goPrev}
        accessibilityLabel={prev}
        style={styles.navButton}
      >
        <Text style={styles.navArrow}>{prev}</Text>
      </Pressable>
      <Pressable
        onPress={goNext}
        accessibilityLabel={next}
        style={styles.navButton}
      >
        <Text style={styles.navArrow}>{next}</Text>
      </Pressable>
    </View>
  );
}

function ActionsWithLabels() {
  const { confirm, clear } = useCalendarLabels();
  const actions = useCalendarActions();

  return (
    <View style={styles.actions}>
      <Pressable onPress={actions.clear}>
        <Text>{clear}</Text>
      </Pressable>
      <Pressable
        onPress={actions.confirm}
        disabled={!actions.canConfirm}
        style={styles.confirmButton}
      >
        <Text>{confirm}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  navButton: {
    padding: 12,
  },
  navArrow: {
    fontSize: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1F6FEB',
    borderRadius: 8,
  },
});
```

## Accessibility

Use labels for accessibility attributes:

```tsx
function AccessibleButton() {
  const { prev, next, confirm, clear } = useCalendarLabels();
  const { goPrev, goNext, confirm: doConfirm, clear: doClear } = useCalendarActions();

  return (
    <View>
      <Pressable
        onPress={goPrev}
        accessibilityLabel={prev}
        accessibilityRole="button"
      >
        <Text>←</Text>
      </Pressable>

      <Pressable
        onPress={goNext}
        accessibilityLabel={next}
        accessibilityRole="button"
      >
        <Text>→</Text>
      </Pressable>

      <Pressable
        onPress={doClear}
        accessibilityLabel={clear}
        accessibilityRole="button"
      >
        <Text>Clear</Text>
      </Pressable>

      <Pressable
        onPress={doConfirm}
        accessibilityLabel={confirm}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canConfirm }}
      >
        <Text>Confirm</Text>
      </Pressable>
    </View>
  );
}
```
