---
sidebar_position: 1
---

# Single Date Picker

The most basic calendar use case — selecting a single date.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Interactive Demo

Try selecting a date below:

<CalendarDemo mode="single" />

This demo mirrors what `<SimpleCalendar mode="single" />` produces — tap any day to select it and use **Clear** / **Today** for the headless [`useCalendarActions`](/docs/hooks/useCalendarActions) and [`useCalendarNavigation`](/docs/hooks/useCalendarNavigation) hooks.

## Quick Start

```tsx
import { SimpleCalendar } from 'react-native-fast-calendar';

function DatePickerScreen() {
  return (
    <SimpleCalendar
      mode="single"
      onConfirm={({ date }) => {
        console.log('Selected date:', date);
      }}
    />
  );
}
```

## With Initial Date

```tsx
<SimpleCalendar
  mode="single"
  initialDate={new Date()}
  onConfirm={({ date }) => {
    // date is a native Date object
  }}
/>
```

## Headless Implementation

For custom UI:

```tsx
import { Calendar, useCalendarActions } from 'react-native-fast-calendar';

function CustomSinglePicker() {
  return (
    <Calendar.Root
      mode="single"
      onConfirm={({ date }) => console.log(date)}
    >
      <View>
        <MyHeader />
        <Calendar.DayGrid swipeable />
        <MyFooter />
      </View>
    </Calendar.Root>
  );
}

function MyFooter() {
  const { confirm, clear, canConfirm } = useCalendarActions();

  return (
    <View>
      <Button onPress={clear} title="Clear" />
      <Button
        onPress={confirm}
        title="Done"
        disabled={!canConfirm}
      />
    </View>
  );
}
```

## With Date Bounds

```tsx
<SimpleCalendar
  mode="single"
  minDate={new Date()}
  maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
/>
```

## With Disabled Dates

```tsx
<SimpleCalendar
  mode="single"
  disabled={(date) => date.getDay() === 0 || date.getDay() === 6} // Weekends off
/>
```

## Form Integration

```tsx
import { useForm, Controller } from 'react-hook-form';

function BookingForm() {
  const { control, handleSubmit } = useForm();

  return (
    <Controller
      control={control}
      name="bookingDate"
      render={({ field: { onChange, value } }) => (
        <SimpleCalendar
          mode="single"
          initialDate={value}
          onConfirm={({ date }) => onChange(date)}
        />
      )}
    />
  );
}
```

## Complete Example

```tsx
import { useState } from 'react';
import { View, Text, Modal } from 'react-native';
import { SimpleCalendar } from 'react-native-fast-calendar';

export function DatePickerModal({ visible, onSelect, onClose }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
          Select a Date
        </Text>

        <SimpleCalendar
          mode="single"
          showFooter={true}
          onConfirm={({ date }) => {
            setSelectedDate(date);
            onSelect(date);
            onClose();
          }}
          onClear={() => setSelectedDate(null)}
        />

        <Text style={{ marginTop: 16 }}>
          {selectedDate
            ? `Selected: ${selectedDate.toDateString()}`
            : 'No date selected'}
        </Text>
      </View>
    </Modal>
  );
}
```

