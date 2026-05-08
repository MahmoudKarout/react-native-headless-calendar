---
sidebar_position: 1
---

# useCalendarStore

The `useCalendarStore` hook provides direct access to the `CalendarStore` instance. Use it for imperative operations like selecting dates, clearing selection, or navigating months.

## Signature

```ts
function useCalendarStore(): CalendarStore;
```

## CalendarStore API

```ts
class CalendarStore<T = CalendarDateValue> {
  // SyncExternalStore API
  getSnapshot(): CalendarSnapshot<T>;
  subscribe(listener: () => void): () => void;

  // Actions
  selectDate(date: T): void;
  toggleDate(date: T): void;
  clear(): void;
  setView(view: CalendarView): void;
  goToMonth(month: number): void;
  goToYear(year: number): void;
  changeMonth(step: number): void;
  changeYear(step: number): void;
  replaceSystem(system: CalendarSystem<T>, index: number): void;
}
```

## Usage

### Selecting a Date

```tsx
import { useCalendarStore } from 'react-native-fast-calendar';

function MyDayButton({ date }) {
  const store = useCalendarStore();

  return (
    <Button
      onPress={() => store.selectDate(date)}
      title="Select"
    />
  );
}
```

### Clearing Selection

```tsx
function MyClearButton() {
  const store = useCalendarStore();

  return (
    <Button
      onPress={() => store.clear()}
      title="Clear"
    />
  );
}
```

### Navigation

```tsx
function MyNavigationButtons() {
  const store = useCalendarStore();

  return (
    <View>
      <Button
        onPress={() => store.changeMonth(-1)}
        title="Previous Month"
      />
      <Button
        onPress={() => store.changeMonth(1)}
        title="Next Month"
      />
    </View>
  );
}
```

### Jumping to Specific Dates

```tsx
function MyQuickSelect() {
  const store = useCalendarStore();

  const goToToday = () => {
    const today = store.getSnapshot().system.today();
    store.selectDate(today);
  };

  const goToMonth = (monthIndex: number) => {
    store.goToMonth(monthIndex);
  };

  return (
    <View>
      <Button onPress={goToToday} title="Today" />
      <Button onPress={() => goToMonth(0)} title="January" />
      <Button onPress={() => goToMonth(6)} title="July" />
    </View>
  );
}
```

### Switching Views

```tsx
function MyViewSwitcher() {
  const store = useCalendarStore();

  return (
    <View>
      <Button
        onPress={() => store.setView('day')}
        title="Day Grid"
      />
      <Button
        onPress={() => store.setView('month')}
        title="Month Picker"
      />
      <Button
        onPress={() => store.setView('year')}
        title="Year Picker"
      />
    </View>
  );
}
```

### Getting Current State (Imperative)

```tsx
function MySubmitButton() {
  const store = useCalendarStore();
  const { onConfirm } = useCalendarConfig();

  const handleSubmit = () => {
    const snapshot = store.getSnapshot();

    // Access current state directly
    console.log('Selected:', snapshot.selectedDate);
    console.log('Range:', snapshot.rangeStart, snapshot.rangeEnd);
    console.log('System:', snapshot.system.id);

    // Perform custom validation
    if (snapshot.mode === 'range' && !snapshot.rangeEnd) {
      Alert.alert('Please select an end date');
      return;
    }

    // Call confirm
    onConfirm?.({
      date: snapshot.selectedDate
        ? snapshot.system.toNativeDate(snapshot.selectedDate)
        : undefined,
      startDate: snapshot.rangeStart
        ? snapshot.system.toNativeDate(snapshot.rangeStart)
        : undefined,
      endDate: snapshot.rangeEnd
        ? snapshot.system.toNativeDate(snapshot.rangeEnd)
        : undefined,
      systemId: snapshot.system.id,
    });
  };

  return <Button onPress={handleSubmit} title="Submit" />;
}
```

## Important Notes

### Stable Identity

The store instance has stable identity across renders. You can safely use it in `useEffect` dependencies:

```tsx
useEffect(() => {
  const unsubscribe = store.subscribe(() => {
    console.log('Store updated');
  });
  return unsubscribe;
}, [store]); // Safe - store identity is stable
```

### Use Inside Event Handlers

`getSnapshot()` is safe for use in event handlers and callbacks:

```tsx
const handlePress = () => {
  const snapshot = store.getSnapshot();
  // Do something with snapshot
};
```

### Don't Use in Render Path

Avoid calling `getSnapshot()` during render. Use `useCalendarSelector` instead:

```tsx
// ❌ Bad - causes unnecessary re-renders
function BadComponent() {
  const store = useCalendarStore();
  const selected = store.getSnapshot().selectedDate;
  return <Text>{selected?.toString()}</Text>;
}

// ✅ Good - granular subscription
function GoodComponent() {
  const selected = useCalendarSelector(s => s.selectedDate);
  return <Text>{selected?.toString()}</Text>;
}
```

## Error Handling

The hook throws a clear error if used outside `<Calendar.Root>`:

```
Error: [Calendar] useCalendarStore must be used within <Calendar.Root>
```

## When to Use

| Use Case | Hook |
|----------|------|
| Imperative actions (select, clear, navigate) | `useCalendarStore()` |
| Reading state in callbacks | `store.getSnapshot()` |
| Subscribing to all changes | `store.subscribe()` |
| Reading state in render | `useCalendarSelector()` |
