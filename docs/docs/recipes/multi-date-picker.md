---
sidebar_position: 3
---

# Multi-Date Picker

Selecting multiple individual dates — useful for booking multiple appointments, selecting event dates, or choosing available days.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Interactive Demo

Tap dates to toggle them on/off. This demo caps selection at **5 dates** — the 6th tap will surface an error message just like `maxSelected` does in the headless store:

<CalendarDemo mode="multiple" maxSelected={5} />

## Quick Start

```tsx
import { SimpleCalendar } from 'react-native-fast-calendar';

function MultiPickerScreen() {
  return (
    <SimpleCalendar
      mode="multiple"
      maxSelected={5}
      onConfirm={({ dates }) => {
        console.log('Selected dates:', dates);
      }}
    />
  );
}
```

## With Maximum Selection

```tsx
<SimpleCalendar
  mode="multiple"
  maxSelected={5}
  onConfirm={({ dates }) => {
    console.log(`Selected ${dates.length} dates`);
  }}
/>
```

:::info
When `maxSelected` is reached, additional selections are silently ignored. Use `onSelectHaptic` to provide feedback.
:::

## Headless Implementation

```tsx
import {
  Calendar,
  useCalendarSelectedDates,
  useCalendarActions,
} from 'react-native-fast-calendar';

function CustomMultiPicker() {
  return (
    <Calendar.Root
      mode="multiple"
      maxSelected={5}
      onConfirm={({ dates }) => console.log(dates)}
    >
      <View>
        <SelectedChips />
        <Calendar.DayGrid />
        <MultiActions />
      </View>
    </Calendar.Root>
  );
}

function SelectedChips() {
  const selectedDates = useCalendarSelectedDates();
  const system = useCalendarSelector(s => s.system);
  const store = useCalendarStore();

  return (
    <View style={styles.chips}>
      {selectedDates.map((date, index) => (
        <Pressable
          key={index}
          onPress={() => store.toggleDate(date)} // Toggle to remove
          style={styles.chip}
        >
          <Text>{system.formatDay(date)}</Text>
          <Text>×</Text>
        </Pressable>
      ))}
    </View>
  );
}

function MultiActions() {
  const { confirm, clear } = useCalendarActions();
  const selectedDates = useCalendarSelectedDates();

  return (
    <View>
      <Text>{selectedDates.length} dates selected</Text>
      <Button onPress={clear} title="Clear All" />
      <Button onPress={confirm} title="Confirm" />
    </View>
  );
}
```

## Appointment Booking

```tsx
function AppointmentPicker({ availableSlots }) {
  const [selectedSlots, setSelectedSlots] = useState<Date[]>([]);

  return (
    <Calendar.Root
      mode="multiple"
      maxSelected={3}
      disabled={(date) => !availableSlots.includes(date.toISOString())}
      onConfirm={({ dates }) => setSelectedSlots(dates)}
    >
      <Calendar.DayGrid
        renderDay={(info) => (
          <Pressable
            disabled={info.isDisabled}
            onPress={() => store.selectDate(info.date)}
            style={[
              styles.cell,
              info.isSelected && styles.selected,
              info.isDisabled && styles.disabled,
            ]}
          >
            <Text>{info.label}</Text>
            {!info.isDisabled && (
              <Text style={styles.slots}>3 slots</Text>
            )}
          </Pressable>
        )}
      />
    </Calendar.Root>
  );
}
```

## Complete Example: Event Planning

```tsx
import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SimpleCalendar } from 'react-native-fast-calendar';

function EventPlannerScreen() {
  const [eventDates, setEventDates] = useState<Date[]>([]);

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>
        Select Event Dates
      </Text>
      <Text style={{ color: '#6B7280', marginBottom: 16 }}>
        Choose up to 5 dates for your event
      </Text>

      <SimpleCalendar
        mode="multiple"
        maxSelected={5}
        minDate={new Date()}
        onConfirm={({ dates }) => setEventDates(dates)}
      />

      {eventDates.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>
            Selected Dates ({eventDates.length}):
          </Text>
          {eventDates.map((date, index) => (
            <Text key={index}>
              {index + 1}. {date.toDateString()}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
```

