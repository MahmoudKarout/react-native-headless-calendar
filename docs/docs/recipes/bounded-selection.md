---
sidebar_position: 4
---

# Bounded Selection

Restrict date selection with minimum/maximum dates, disabled dates, and dynamic predicates.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Interactive Demo

In this demo **weekends are disabled** and only the **next 90 days** are selectable — combining `disabled={(date) => date.getDay() === 0 || date.getDay() === 6}` with `minDate` and `maxDate`:

export const today = new Date();
export const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

<CalendarDemo
  mode="single"
  disabledWeekdays={[0, 6]}
  minDate={today}
  maxDate={ninetyDaysFromNow}
/>

## Minimum and Maximum Dates

```tsx
import { SimpleCalendar } from 'react-native-fast-calendar';

// Only allow dates in the next 90 days
<SimpleCalendar
  mode="single"
  minDate={new Date()}
  maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
/>
```

## Disabled Specific Dates

```tsx
<Calendar.Root
  mode="single"
  disabledDates={[
    new Date('2024-12-25'),
    new Date('2024-12-26'),
    new Date('2024-01-01'),
  ]}
>
```

## Disabled Date Ranges

```tsx
<Calendar.Root
  mode="range"
  disabledRanges={[
    { start: new Date('2024-07-01'), end: new Date('2024-07-31') },
    { start: new Date('2024-12-20'), end: new Date('2024-12-31') },
  ]}
>
```

## Dynamic Disable Predicate

```tsx
<Calendar.Root
  mode="single"
  disabled={(date) => {
    // Disable weekends
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    // Disable past dates
    const isPast = date < new Date();

    // Disable specific condition
    const isMaintenanceDay = date.getDate() === 15;

    return isWeekend || isPast || isMaintenanceDay;
  }}
>
```

## Booking Calendar with Availability

```tsx
function AvailabilityCalendar({ bookedDates, blockedRanges }) {
  return (
    <Calendar.Root
      mode="range"
      minDate={new Date()}
      minRangeDays={2}
      disabledDates={bookedDates}
      disabledRanges={blockedRanges}
      disabled={(date) => date.getDay() === 0} // Sundays off
    >
      <Calendar.DayGrid
        renderDay={(info) => (
          <Pressable
            disabled={info.isDisabled}
            style={[
              styles.cell,
              info.isDisabled && styles.unavailable,
              info.isSelected && styles.selected,
            ]}
          >
            <Text>{info.label}</Text>
            {info.isDisabled && <Text style={styles.badge}>X</Text>}
          </Pressable>
        )}
      />
    </Calendar.Root>
  );
}
```

## Complete Example

```tsx
import { useMemo } from 'react';
import { SimpleCalendar } from 'react-native-fast-calendar';

function VacationPlanner() {
  // Holiday ranges
  const blockedRanges = useMemo(() => [
    { start: new Date('2024-12-20'), end: new Date('2025-01-05') },
    { start: new Date('2024-07-04'), end: new Date('2024-07-04') },
  ], []);

  // Already requested days
  const myVacationDays = useMemo(() => [
    new Date('2024-06-15'),
    new Date('2024-06-16'),
  ], []);

  return (
    <SimpleCalendar
      mode="range"
      minDate={new Date()}
      maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
      minRangeDays={5}
      maxRangeDays={20}
      disabledRanges={blockedRanges}
      disabledDates={myVacationDays}
      disabled={(date) => date.getDay() === 0 || date.getDay() === 6}
      labels={{
        confirm: 'Request Vacation',
      }}
    />
  );
}
```

## Visual Feedback

Show why dates are disabled:

```tsx
<Calendar.DayGrid
  renderDay={(info) => (
    <View>
      <Text style={info.isDisabled ? styles.disabledText : null}>
        {info.label}
      </Text>

      {info.isDisabled && (
        <Text style={styles.reason}>
          {info.modifiers.booked ? 'Booked' :
           info.modifiers.holiday ? 'Holiday' :
           info.modifiers.weekend ? 'Weekend' :
           'Unavailable'}
        </Text>
      )}
    </View>
  )}
/>
```

