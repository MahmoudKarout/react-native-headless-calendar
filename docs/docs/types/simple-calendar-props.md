---
sidebar_position: 11
---

# SimpleCalendarProps

The `SimpleCalendarProps` interface defines all props accepted by the `SimpleCalendar` component.

## Interface Definition

```ts
interface SimpleCalendarProps {
  // Selection Mode
  mode?: CalendarMode;

  // Calendar Systems
  systems?: readonly CalendarSystem[];

  // Callbacks
  onSelect?: (date: Date) => void;
  onConfirm?: OnConfirm;
  onClear?: OnClear;

  // Layout
  showHeader?: boolean;
  showFooter?: boolean;
  swipeable?: boolean;
  numberOfMonths?: number;
  showWeekNumbers?: boolean;
  firstDayOfWeek?: Weekday;
  showOutsideDays?: boolean;
  fixedWeeks?: boolean;

  // Bounds & Constraints
  minDate?: Date;
  maxDate?: Date;
  allowSameDay?: boolean;
  minRangeDays?: number;
  maxRangeDays?: number;
  maxSelected?: number;
  disabled?: (date: Date) => boolean;

  // Initial State
  initialDate?: Date;
  initialStart?: Date;
  initialEnd?: Date;
  initialDates?: readonly Date[];

  // Styling
  theme?: CalendarThemeOverride;
  labels?: Partial<CalendarLabels>;
  style?: ViewStyle;

  // Other
  testID?: string;
}
```

## Prop Reference

### Selection Mode

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `CalendarMode` | `'single'` | Selection mode |

### Calendar Systems

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `systems` | `readonly CalendarSystem[]` | `[gregorianSystem]` | Calendar systems |

### Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `onSelect` | `(date: Date) => void` | Fires on every selection change |
| `onConfirm` | `OnConfirm` | Fires when confirm button pressed |
| `onClear` | `OnClear` | Fires when clear button pressed |

### Layout

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showHeader` | `boolean` | `true` | Show month/year header |
| `showFooter` | `boolean` | `true` | Show confirm/clear footer |
| `swipeable` | `boolean` | `true` | Enable horizontal swipe |
| `numberOfMonths` | `number` | `1` | Side-by-side months |
| `showWeekNumbers` | `boolean` | `false` | Show ISO week numbers |
| `firstDayOfWeek` | `Weekday` | `0` | First day of week (0=Sunday) |
| `showOutsideDays` | `boolean` | `true` | Show previous/next month days |
| `fixedWeeks` | `boolean` | `true` | Always show 6 rows |

### Bounds & Constraints

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minDate` | `Date` | — | Minimum selectable date |
| `maxDate` | `Date` | — | Maximum selectable date |
| `allowSameDay` | `boolean` | `false` | Allow same-day range |
| `minRangeDays` | `number` | — | Minimum range length |
| `maxRangeDays` | `number` | — | Maximum range length |
| `maxSelected` | `number` | — | Maximum selections (multiple mode) |
| `disabled` | `(date: Date) => boolean` | — | Dynamic disable predicate |

### Initial State

| Prop | Type | Description |
|------|------|-------------|
| `initialDate` | `Date` | Initial selected date (single) |
| `initialStart` | `Date` | Initial range start |
| `initialEnd` | `Date` | Initial range end |
| `initialDates` | `readonly Date[]` | Initial selected dates (multiple) |

### Styling

| Prop | Type | Description |
|------|------|-------------|
| `theme` | `CalendarThemeOverride` | Theme overrides |
| `labels` | `Partial<CalendarLabels>` | Label overrides |
| `style` | `ViewStyle` | Container style |

### Other

| Prop | Type | Description |
|------|------|-------------|
| `testID` | `string` | Test ID prefix |

## Complete Example

```tsx
import { SimpleCalendar } from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';

<SimpleCalendar
  // Selection
  mode="range"
  initialStart={new Date()}

  // Systems
  systems={[gregorianSystem, hijriSystem]}

  // Layout
  showHeader={true}
  showFooter={true}
  swipeable={true}
  numberOfMonths={2}
  showWeekNumbers={false}
  firstDayOfWeek={1}
  showOutsideDays={true}

  // Bounds
  minDate={new Date()}
  maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
  disabled={(date) => date.getDay() === 0 || date.getDay() === 6}

  // Constraints
  minRangeDays={2}
  maxRangeDays={14}

  // Styling
  theme={{
    colors: {
      primary: '#7C3AED',
      rangeBackground: '#EDE9FE',
    },
    cellSize: 48,
  }}
  labels={{
    confirm: 'Book Now',
    clear: 'Clear',
  }}
  style={{ margin: 16 }}

  // Callbacks
  onSelect={(date) => console.log('Selected:', date)}
  onConfirm={({ startDate, endDate }) => {
    console.log('Booking:', startDate, 'to', endDate);
  }}
  onClear={() => console.log('Cleared')}
/>
```

## Differences from Calendar.Root Props

| Feature | SimpleCalendar | Calendar.Root |
|---------|---------------|---------------|
| Date inputs | `Date` only | `unknown` (any system-compatible) |
| `onSelect` | ✅ Available | ❌ Not available |
| `components` | ❌ Not available | ✅ Available |
| `modifiers` | ❌ Not available | ✅ Available |
| `style` | ✅ Available | ❌ Not available |
| Store access | Internal only | Full access via hooks |
