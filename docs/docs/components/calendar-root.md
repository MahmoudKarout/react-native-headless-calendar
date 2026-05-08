---
sidebar_position: 2
---

# Calendar.Root

`<Calendar.Root>` is the **headless provider** that owns the calendar store. It renders no visible UI itself, but provides state to all child components via hooks.

## Basic Usage

```tsx
import { Calendar } from 'react-native-fast-calendar';

function MyCalendar() {
  return (
    <Calendar.Root
      mode="single"
      onConfirm={handleConfirm}
    >
      <MyHeader />
      <Calendar.DayGrid />
      <MyFooter />
    </Calendar.Root>
  );
}
```

## Props

### Selection

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `CalendarMode` | `'single'` | Selection mode |
| `initialDate` | `unknown` | — | Initial date (single mode) |
| `initialStart` | `unknown` | — | Initial start (range mode) |
| `initialEnd` | `unknown` | — | Initial end (range mode) |
| `initialDates` | `readonly unknown[]` | — | Initial dates (multiple mode) |
| `onConfirm` | `OnConfirm` | — | Confirm callback |
| `onClear` | `OnClear` | — | Clear callback |

### Calendar Systems

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `systems` | `readonly CalendarSystem[]` | `[gregorianSystem]` | Calendar systems |
| `initialSystemId` | `string` | — | Initial active system |
| `onSystemChange` | `OnSystemChange` | — | System change callback |

### Bounds & Constraints

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minDate` | `unknown` | — | Minimum selectable date |
| `maxDate` | `unknown` | — | Maximum selectable date |
| `disabledDates` | `readonly DisabledDateInput[]` | — | Disabled specific dates |
| `disabledRanges` | `readonly DisabledDateRangeInput[]` | — | Disabled date ranges |
| `disabled` | `(nativeDate: Date) => boolean` | — | Dynamic disable predicate |
| `allowSameDay` | `boolean` | `false` | Allow same-day range (range mode) |
| `minRangeDays` | `number` | — | Minimum range length |
| `maxRangeDays` | `number` | — | Maximum range length |
| `maxSelected` | `number` | — | Maximum selections (multiple mode) |

### Layout

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `firstDayOfWeek` | `Weekday` | `0` | First day of week (0=Sunday) |
| `showOutsideDays` | `boolean` | `true` | Show outside month days |
| `fixedWeeks` | `boolean` | `true` | Always show 6 rows |
| `components` | `CalendarComponents` | — | Custom component slots |

### Modifiers

| Prop | Type | Description |
|------|------|-------------|
| `modifiers` | `CalendarModifiers` | Named date matchers for styling |

### Styling

| Prop | Type | Description |
|------|------|-------------|
| `theme` | `CalendarThemeOverride` | Theme overrides |
| `labels` | `Partial<CalendarLabels>` | Label overrides |

### Events

| Prop | Type | Description |
|------|------|-------------|
| `onSelectHaptic` | `() => void` | Haptic feedback on selection |

### Other

| Prop | Type | Description |
|------|------|-------------|
| `testID` | `string` | Test ID prefix |
| `children` | `ReactNode` | Child components |

## Prop Details

### Selection Mode

```tsx
// Single mode
<Calendar.Root mode="single" initialDate={new Date()}>

// Range mode
<Calendar.Root
  mode="range"
  initialStart={new Date()}
  initialEnd={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
>

// Multiple mode
<Calendar.Root mode="multiple" initialDates={[new Date()]}>
```

### Date Bounds

Dates are normalized through the active calendar system:

```tsx
<Calendar.Root
  minDate={new Date('2024-01-01')}
  maxDate={new Date('2024-12-31')}
>
```

### Disabled Dates

Three ways to disable dates:

```tsx
// 1. Specific dates
<Calendar.Root
  disabledDates={[new Date('2024-12-25'), new Date('2024-12-26')]}
>

// 2. Date ranges
<Calendar.Root
  disabledRanges={[
    { start: new Date('2024-07-01'), end: new Date('2024-07-31') },
  ]}
>

// 3. Dynamic predicate
<Calendar.Root
  disabled={(date) => date.getDay() === 0 || date.getDay() === 6}
>
```

All three compose with **OR** semantics — a date is disabled if any condition matches.

### Modifiers

Named matchers for custom styling (booked, holiday, etc.):

```tsx
<Calendar.Root
  modifiers={{
    booked: [new Date('2024-06-15'), new Date('2024-06-16')],
    holiday: (date) => isHoliday(date),
    weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
  }}
>
```

Access in custom day cells:

```tsx
function MyDayCell({ info }) {
  if (info.modifiers.booked) {
    return <BookedCell info={info} />;
  }
  if (info.modifiers.holiday) {
    return <HolidayCell info={info} />;
  }
  return <DefaultCell info={info} />;
}
```

### Component Slots

Replace visual atoms without building the full UI:

```tsx
<Calendar.Root
  components={{
    DayCell: MyDayCell,
    WeekdayCell: MyWeekdayCell,
    WeekdayHeader: MyWeekdayHeader,
    WeekNumberCell: MyWeekNumberCell,
    MonthCaption: MyMonthCaption,
  }}
>
```

### Multiple Calendar Systems

```tsx
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';

<Calendar.Root
  systems={[gregorianSystem, hijriSystem]}
  initialSystemId="hijri"
  onSystemChange={(id) => console.log('Switched to:', id)}
>
```

## Complete Example

```tsx
import { Calendar, useCalendarHeader, useCalendarActions } from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';

function FullFeaturedCalendar() {
  return (
    <Calendar.Root
      mode="range"
      systems={[gregorianSystem]}
      initialStart={new Date()}
      minDate={new Date()}
      maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
      minRangeDays={2}
      maxRangeDays={14}
      disabled={(date) => date.getDay() === 0 || date.getDay() === 6}
      modifiers={{
        holiday: [new Date('2024-12-25'), new Date('2024-12-26')],
      }}
      theme={{
        colors: {
          primary: '#059669',
          rangeBackground: '#D1FAE5',
        },
        cellSize: 44,
      }}
      labels={{
        confirm: 'Book Dates',
        clear: 'Reset',
      }}
      onConfirm={({ startDate, endDate }) => {
        console.log('Booking:', startDate, 'to', endDate);
      }}
    >
      <MyCalendarContent />
    </Calendar.Root>
  );
}

function MyCalendarContent() {
  const { monthLabel, yearLabel, goPrev, goNext } = useCalendarHeader();
  const { confirm, clear, canConfirm } = useCalendarActions();

  return (
    <View>
      <View style={styles.header}>
        <Text>{monthLabel} {yearLabel}</Text>
        <View style={styles.nav}>
          <Button onPress={goPrev} title="‹" />
          <Button onPress={goNext} title="›" />
        </View>
      </View>

      <Calendar.DayGrid swipeable />

      <View style={styles.footer}>
        <Button onPress={clear} title="Reset" />
        <Button
          onPress={confirm}
          title="Book Dates"
          disabled={!canConfirm}
        />
      </View>
    </View>
  );
}
```

## Important Notes

1. **Children must use hooks** — Any component that calls `useCalendar*()` must be a descendant of `<Calendar.Root>`
2. **Hook errors are clear** — If you forget the Root, hooks throw: "useCalendarStore must be used within `<Calendar.Root>`"
3. **Props are initial, not controlled** — `initialDate`, `initialStart`, etc. are only read on mount. Use the store for programmatic control after mount.
4. **Stable prop references** — The library internally stabilizes array/object props to prevent unnecessary re-renders
