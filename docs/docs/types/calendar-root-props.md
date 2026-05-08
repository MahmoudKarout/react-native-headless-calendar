---
sidebar_position: 10
---

# CalendarRootProps

The `CalendarRootProps` interface defines all props accepted by `<Calendar.Root>`.

## Interface Definition

```ts
interface CalendarRootProps {
  // Calendar Systems
  systems?: readonly CalendarSystem[];
  initialSystemId?: string;

  // Selection Mode
  mode?: CalendarMode;
  initialDate?: unknown;
  initialStart?: unknown;
  initialEnd?: unknown;
  initialDates?: readonly unknown[];

  // Bounds
  minDate?: unknown;
  maxDate?: unknown;
  disabledDates?: readonly DisabledDateInput[];
  disabledRanges?: readonly DisabledDateRangeInput[];
  disabled?: (nativeDate: Date) => boolean;

  // Range Constraints
  allowSameDay?: boolean;
  minRangeDays?: number;
  maxRangeDays?: number;

  // Multiple Constraints
  maxSelected?: number;

  // Modifiers
  modifiers?: CalendarModifiers;

  // Layout
  firstDayOfWeek?: Weekday;
  showOutsideDays?: boolean;
  fixedWeeks?: boolean;
  components?: CalendarComponents;

  // Styling
  theme?: CalendarThemeOverride;
  labels?: Partial<CalendarLabels>;

  // Callbacks
  onConfirm?: OnConfirm;
  onClear?: OnClear;
  onSystemChange?: OnSystemChange;
  onSelectHaptic?: () => void;

  // Other
  testID?: string;
  children: ReactNode;
}
```

## Prop Reference

### Calendar Systems

| Prop | Type | Description |
|------|------|-------------|
| `systems` | `readonly CalendarSystem[]` | Calendar systems to use (default: `[gregorianSystem]`) |
| `initialSystemId` | `string` | Initial active system ID |

### Selection Mode

| Prop | Type | Description |
|------|------|-------------|
| `mode` | `CalendarMode` | Selection mode: `'single'` \| `'range'` \| `'multiple'` |
| `initialDate` | `unknown` | Initial selected date (single mode) |
| `initialStart` | `unknown` | Initial range start (range mode) |
| `initialEnd` | `unknown` | Initial range end (range mode) |
| `initialDates` | `readonly unknown[]` | Initial selected dates (multiple mode) |

### Bounds

| Prop | Type | Description |
|------|------|-------------|
| `minDate` | `unknown` | Minimum selectable date |
| `maxDate` | `unknown` | Maximum selectable date |
| `disabledDates` | `readonly DisabledDateInput[]` | Disabled specific dates |
| `disabledRanges` | `readonly DisabledDateRangeInput[]` | Disabled date ranges |
| `disabled` | `(nativeDate: Date) => boolean` | Dynamic disable predicate |

### Range Constraints

| Prop | Type | Description |
|------|------|-------------|
| `allowSameDay` | `boolean` | Allow same-day range (default: `false`) |
| `minRangeDays` | `number` | Minimum range length in days |
| `maxRangeDays` | `number` | Maximum range length in days |

### Multiple Constraints

| Prop | Type | Description |
|------|------|-------------|
| `maxSelected` | `number` | Maximum number of selectable dates |

### Layout

| Prop | Type | Description |
|------|------|-------------|
| `firstDayOfWeek` | `Weekday` | First day of week: `0-6` (default: `0`) |
| `showOutsideDays` | `boolean` | Show previous/next month days (default: `true`) |
| `fixedWeeks` | `boolean` | Always show 6 rows (default: `true`) |
| `components` | `CalendarComponents` | Custom component slots |

### Styling

| Prop | Type | Description |
|------|------|-------------|
| `theme` | `CalendarThemeOverride` | Theme overrides |
| `labels` | `Partial<CalendarLabels>` | Label overrides |

### Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `onConfirm` | `OnConfirm` | Called when selection is confirmed |
| `onClear` | `OnClear` | Called when selection is cleared |
| `onSystemChange` | `OnSystemChange` | Called when calendar system changes |
| `onSelectHaptic` | `() => void` | Haptic feedback on day selection |

### Other

| Prop | Type | Description |
|------|------|-------------|
| `testID` | `string` | Test ID prefix for components |
| `children` | `ReactNode` | Child components |

## Complete Example

```tsx
import { Calendar } from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';

<Calendar.Root
  // Systems
  systems={[gregorianSystem, hijriSystem]}
  initialSystemId="gregorian"
  onSystemChange={(id) => console.log('Switched to:', id)}

  // Selection
  mode="range"
  initialStart={new Date()}

  // Bounds
  minDate={new Date()}
  maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
  disabled={(date) => date.getDay() === 0 || date.getDay() === 6}

  // Range constraints
  minRangeDays={2}
  maxRangeDays={14}
  allowSameDay={false}

  // Modifiers
  modifiers={{
    holiday: [new Date('2024-12-25'), new Date('2024-12-26')],
    peakSeason: [{ start: new Date('2024-07-01'), end: new Date('2024-08-15') }],
  }}

  // Layout
  firstDayOfWeek={1}
  showOutsideDays={false}

  // Styling
  theme={{
    colors: {
      primary: '#059669',
      rangeBackground: '#D1FAE5',
    },
    cellSize: 44,
  }}
  labels={{
    confirm: 'Book Now',
    clear: 'Reset',
  }}

  // Callbacks
  onConfirm={({ startDate, endDate }) => {
    console.log('Booking:', startDate, 'to', endDate);
  }}
  onClear={() => {
    console.log('Selection cleared');
  }}
>
  <MyCustomCalendarUI />
</Calendar.Root>
```
