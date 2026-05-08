---
sidebar_position: 6
---

# useCalendarMonthLabel

The `useCalendarMonthLabel` hook provides the displayed month's label and controls for toggling the month picker view.

## Signature

```ts
interface CalendarMonthLabel {
  /** Localised month name for the displayed month, in the active system */
  label: string;
  /** False while year picker is open */
  isVisible: boolean;
  /** Switch between day and month views */
  toggle: () => void;
}

function useCalendarMonthLabel(): CalendarMonthLabel;
```

## Basic Usage

```tsx
import { useCalendarMonthLabel } from 'react-native-fast-calendar';

function MyMonthLabel() {
  const { label, isVisible, toggle } = useCalendarMonthLabel();

  if (!isVisible) return null;

  return (
    <Button onPress={toggle} title={label} />
  );
}
```

## Label Format

The `label` comes from the active calendar system's `monthLabels()`:

```ts
// Gregorian system
const label = 'May'; // or 'Mai' in French, etc.

// Hijri system
const label = 'Ramadan';
```

## Visibility

`isVisible` is `false` when the year picker is open:

```tsx
function MyMonthButton() {
  const { label, isVisible, toggle } = useCalendarMonthLabel();

  return (
    <Pressable onPress={toggle}>
      {isVisible ? (
        <Text>{label}</Text>
      ) : (
        <Text style={styles.dimmed}>Month</Text>
      )}
    </Pressable>
  );
}
```

## Toggle Behavior

Calling `toggle()` switches between views:

- In **day view** → switches to **month picker**
- In **month picker** → switches to **day view**
- In **year picker** → switches to **day view** (not month picker)

## Integration with Month Picker

```tsx
import {
  useCalendarMonthLabel,
  useCalendarMonthPicker,
} from 'react-native-fast-calendar';

function MonthSelector() {
  const { label, toggle } = useCalendarMonthLabel();
  const view = useCalendarSelector(s => s.view);

  return (
    <View>
      <Button onPress={toggle} title={label} />

      {view === 'month' && <MonthPicker />}
    </View>
  );
}

function MonthPicker() {
  const { months, activeMonth, selectMonth } = useCalendarMonthPicker();

  return (
    <Grid>
      {months.map(m => (
        <Cell
          key={m.index}
          active={m.index === activeMonth}
          onPress={() => selectMonth(m.index)}
        >
          {m.label}
        </Cell>
      ))}
    </Grid>
  );
}
```

## Granular Updates

The hook uses two granular selectors:

```ts
const label = useCalendarSelector(
  (s) => s.system.monthLabels()[s.system.month(s.displayed)] ?? ''
);
const isVisible = useCalendarSelector((s) => s.view !== 'year');
```

This means:
- Tapping a date in single mode won't re-render (displayed month unchanged)
- Switching to year view only updates `isVisible`
- Month label updates only when the displayed month actually changes

## Example: Custom Styling

```tsx
function StyledMonthLabel() {
  const { label, isVisible, toggle } = useCalendarMonthLabel();
  const theme = useCalendarTheme();

  return (
    <Pressable
      onPress={toggle}
      style={{
        padding: 8,
        borderRadius: 8,
        backgroundColor: isVisible ? theme.colors.primary : 'transparent',
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: isVisible ? theme.colors.onPrimary : theme.colors.text,
        }}
      >
        {isVisible ? label : 'Select Month'}
      </Text>
    </Pressable>
  );
}
```
