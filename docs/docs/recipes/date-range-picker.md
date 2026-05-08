---
sidebar_position: 2
---

# Date Range Picker

Selecting a start and end date — common for hotel bookings, vacation rentals, and event planning.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Interactive Demo

Click a start date, then an end date to select a range. This demo enforces a **minimum 2-night** and **maximum 14-night** stay — the same constraints used in the hotel-booking example below:

<CalendarDemo mode="range" minRangeDays={2} maxRangeDays={14} />

## Quick Start

```tsx
import { SimpleCalendar } from 'react-native-fast-calendar';

function RangePickerScreen() {
  return (
    <SimpleCalendar
      mode="range"
      onConfirm={({ startDate, endDate }) => {
        console.log('Range:', startDate, 'to', endDate);
      }}
    />
  );
}
```

## With Range Constraints

```tsx
<SimpleCalendar
  mode="range"
  minRangeDays={2}    // Minimum 2 nights
  maxRangeDays={14}   // Maximum 14 nights
  onConfirm={({ startDate, endDate }) => {
        const nights = Math.round(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        console.log(`Booking for ${nights} nights`);
      }}
    />
    ```

    ## Headless Implementation

    ```tsx
    import {
      Calendar,
      useCalendarSelector,
      useCalendarActions,
    } from 'react-native-fast-calendar';

    function CustomRangePicker() {
      return (
        <Calendar.Root
          mode="range"
          minRangeDays={2}
          maxRangeDays={14}
          onConfirm={({ startDate, endDate }) => console.log(startDate, endDate)}
        >
          <View>
            <RangeInfo />
            <Calendar.DayGrid />
            <RangeActions />
          </View>
        </Calendar.Root>
      );
    }

    function RangeInfo() {
      const rangeStart = useCalendarSelector(s => s.rangeStart);
      const rangeEnd = useCalendarSelector(s => s.rangeEnd);
      const system = useCalendarSelector(s => s.system);

      const hasRange = !!rangeStart && !!rangeEnd;
      const nights = hasRange
        ? Math.round(
            (system.toNativeDate(rangeEnd).getTime() -
              system.toNativeDate(rangeStart).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      return (
        <View>
          <Text>
            {hasRange
              ? `${nights} night${nights !== 1 ? 's' : ''}`
              : 'Select check-in and check-out dates'}
          </Text>
        </View>
      );
    }

    function RangeActions() {
      const { confirm, clear, canConfirm } = useCalendarActions();

      return (
        <View>
          <Button onPress={clear} title="Clear" />
          <Button
            onPress={confirm}
            title="Book Selected Dates"
            disabled={!canConfirm}
          />
        </View>
      );
    }
    ```

    ## Same-Day Selection

    Allow selecting the same day for both endpoints (for day-use bookings):

    ```tsx
    <SimpleCalendar
      mode="range"
      allowSameDay={true}
      onConfirm={({ startDate, endDate }) => {
        if (startDate.getTime() === endDate.getTime()) {
          console.log('Day-use booking');
        }
      }}
    />
    ```

    ## Booking Calendar with Price

    ```tsx
    function BookingCalendar({ prices }) {
      return (
        <Calendar.Root
          mode="range"
          modifiers={{
            highSeason: highSeasonRanges,
          }}
        >
          <Calendar.DayGrid
            renderDay={(info) => {
              const dateKey = info.nativeDate.toISOString().split('T')[0];
              const price = prices[dateKey] || 100;
              const multiplier = info.modifiers.highSeason ? 1.5 : 1;

              return (
                <Pressable
                  onPress={() => store.selectDate(info.date)}
                  style={[
                    styles.cell,
                    info.isSelected && styles.selected,
                    info.inRange && styles.inRange,
                  ]}
                >
                  <Text>{info.label}</Text>
                  <Text style={styles.price}>${price * multiplier}</Text>
                </Pressable>
              );
            }}
          />
        </Calendar.Root>
      );
    }
    ```

## Complete Hotel Booking Example

```tsx
import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SimpleCalendar } from 'react-native-fast-calendar';

function HotelBookingScreen() {
  const [booking, setBooking] = useState({
    checkIn: null,
    checkOut: null,
  });

  const handleConfirm = ({ startDate, endDate }) => {
    if (!startDate || !endDate) return;

    const nights = Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const total = nights * 150; // $150 per night

    Alert.alert(
      'Confirm Booking',
      `${nights} nights from ${startDate.toDateString()}\nTotal: $${total}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setBooking({ checkIn: startDate, checkOut: endDate });
            // Submit to API
          },
        },
      ]
    );
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 16 }}>
        Select Your Stay
      </Text>

      <SimpleCalendar
        mode="range"
        minDate={new Date()}
        minRangeDays={1}
        maxRangeDays={30}
        onConfirm={handleConfirm}
      />

      {booking.checkIn && booking.checkOut && (
        <View style={{ marginTop: 16 }}>
          <Text>Check-in: {booking.checkIn.toDateString()}</Text>
          <Text>Check-out: {booking.checkOut.toDateString()}</Text>
        </View>
      )}
    </View>
  );
}
```

