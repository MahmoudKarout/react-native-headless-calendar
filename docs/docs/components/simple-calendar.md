---
sidebar_position: 1
---

# SimpleCalendar

The `SimpleCalendar` component is a **batteries-included** calendar for the 80% use case. It wraps the headless API into one component with sensible defaults.

## Features

- Gregorian calendar (no import needed)
- Header with month/year labels and navigation
- Swipeable day grid
- Optional confirm/clear footer
- System switcher (when multiple systems provided)
- Fully themed and customizable via props

## Basic Usage

```tsx
import { SimpleCalendar } from 'react-native-fast-calendar';

function MyScreen() {
  return (
    <SimpleCalendar
      mode="single"
      onConfirm={({ date }) => console.log('Selected:', date)}
    />
  );
}
```

## Props

### Selection

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'single' \| 'range' \| 'multiple'` | `'single'` | Selection mode |
| `initialDate` | `Date` | — | Initial selected date (single mode) |
| `initialStart` | `Date` | — | Initial start date (range mode) |
| `initialEnd` | `Date` | — | Initial end date (range mode) |
| `initialDates` | `readonly Date[]` | — | Initial selected dates (multiple mode) |

### Layout

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showHeader` | `boolean` | `true` | Show month/year header |
| `showFooter` | `boolean` | `true` | Show confirm/clear footer |
| `swipeable` | `boolean` | `true` | Enable horizontal swipe |
| `numberOfMonths` | `number` | `1` | Side-by-side months |
| `showWeekNumbers` | `boolean` | `false` | Show ISO week numbers |
| `firstDayOfWeek` | `Weekday` | `0` | 0=Sunday, 1=Monday, etc. |
| `showOutsideDays` | `boolean` | `true` | Show previous/next month days |
| `fixedWeeks` | `boolean` | `true` | Always show 6 rows |

### Bounds & Constraints

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minDate` | `Date` | — | Inclusive minimum date |
| `maxDate` | `Date` | — | Inclusive maximum date |
| `disabled` | `(date: Date) => boolean` | — | Dynamic disable predicate |
| `allowSameDay` | `boolean` | `false` | Allow same-day range (range mode) |
| `minRangeDays` | `number` | — | Minimum range length |
| `maxRangeDays` | `number` | — | Maximum range length |
| `maxSelected` | `number` | — | Maximum selections (multiple mode) |

### Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `onSelect` | `(date: Date) => void` | Fires on every selection change |
| `onConfirm` | `OnConfirm` | Fires when confirm button pressed |
| `onClear` | `OnClear` | Fires when clear button pressed |

### Styling

| Prop | Type | Description |
|------|------|-------------|
| `systems` | `readonly CalendarSystem[]` | Calendar systems (default: Gregorian) |
| `theme` | `CalendarThemeOverride` | Theme overrides |
| `labels` | `Partial<CalendarLabels>` | Label overrides |
| `style` | `ViewStyle` | Container style |
| `testID` | `string` | Test ID prefix |

## Examples

### Single Date Picker

```tsx
<SimpleCalendar
  mode="single"
  initialDate={new Date()}
  onConfirm={({ date }) => {
    console.log('Selected date:', date);
  }}
/>
```

### Date Range Picker

```tsx
<SimpleCalendar
  mode="range"
  initialStart={new Date()}
  initialEnd={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
  minRangeDays={2}
  maxRangeDays={14}
  onConfirm={({ startDate, endDate }) => {
    console.log('Range:', startDate, 'to', endDate);
  }}
/>
```

### Multi-Date Picker

```tsx
<SimpleCalendar
  mode="multiple"
  maxSelected={5}
  onConfirm={({ dates }) => {
    console.log('Selected dates:', dates);
  }}
/>
```

### With Date Bounds

```tsx
<SimpleCalendar
  mode="single"
  minDate={new Date()}
  maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
  disabled={(date) => date.getDay() === 0 || date.getDay() === 6}
  onConfirm={({ date }) => console.log(date)}
/>
```

### With Multiple Systems

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';

<SimpleCalendar
  mode="single"
  systems={[gregorianSystem, hijriSystem]}
  onSystemChange={(id) => console.log('Switched to:', id)}
/>
```

### Custom Theme

```tsx
<SimpleCalendar
  mode="single"
  theme={{
    colors: {
      primary: '#059669',
      rangeBackground: '#D1FAE5',
    },
    cellSize: 48,
  }}
/>
```

### Without Footer

```tsx
<SimpleCalendar
  mode="single"
  showFooter={false}
  onSelect={(date) => console.log(date)}
/>
```

### Without Header

```tsx
<SimpleCalendar
  mode="single"
  showHeader={false}
  swipeable={true}
/>
```

### Multi-Month View

```tsx
<SimpleCalendar
  mode="range"
  numberOfMonths={2}
  swipeable={false}
/>
```

### With Week Numbers

```tsx
<SimpleCalendar
  mode="single"
  showWeekNumbers={true}
  firstDayOfWeek={1} // Monday start for ISO weeks
/>
```

## Limitations

`SimpleCalendar` owns its own `<Calendar.Root>` internally. This means:

- Sibling components **cannot** read its store via `useCalendar*` hooks
- If you need a custom footer outside the calendar, drop down to the headless API
- For "SimpleCalendar but with a custom Save button", use `<Calendar.Root>` directly

## When to Use SimpleCalendar

**Use SimpleCalendar when:**
- You need a calendar quickly
- The built-in design fits your needs
- You don't need custom UI pieces outside the calendar

**Drop down to `<Calendar.Root>` when:**
- You need a custom save button elsewhere in the screen
- You need to read calendar state from sibling components
- You want full control over every visual element
