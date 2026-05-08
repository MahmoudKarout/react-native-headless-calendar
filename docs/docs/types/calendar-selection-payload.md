---
sidebar_position: 7
---

# CalendarSelectionPayload

The `CalendarSelectionPayload` interface is the object passed to `onConfirm` callbacks. It contains the selected date(s) as native JavaScript Date objects.

## Interface Definition

```ts
interface CalendarSelectionPayload {
  /** Native JS Date for the selected day in single mode */
  date?: Date;

  /** Native JS Date for the start of the selected range */
  startDate?: Date;

  /** Native JS Date for the end of the selected range */
  endDate?: Date;

  /** Native JS Dates for every selected day in multiple mode */
  dates?: Date[];

  /** Identifier of the active calendar system at the time of selection */
  systemId: string;
}
```

## Properties by Mode

### Single Mode

```ts
{
  date: Date;        // Selected date
  systemId: string;   // Calendar system used
}
```

### Range Mode

```ts
{
  startDate: Date;   // Range start
  endDate: Date;     // Range end
  systemId: string;   // Calendar system used
}
```

### Multiple Mode

```ts
{
  dates: Date[];     // All selected dates
  systemId: string;  // Calendar system used
}
```

## Usage

### Single Date Picker

```tsx
<Calendar.Root
  mode="single"
  onConfirm={({ date, systemId }) => {
    console.log('Selected:', date);
    console.log('Calendar system:', systemId);

    // date is a native Date object
    console.log(date.toISOString());
    console.log(date.getFullYear());
  }}
>
```

### Date Range Picker

```tsx
<Calendar.Root
  mode="range"
  onConfirm={({ startDate, endDate, systemId }) => {
    if (startDate && endDate) {
      const nights = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log(`Booking for ${nights} nights`);
    }
  }}
>
```

### Multi-Date Picker

```tsx
<Calendar.Root
  mode="multiple"
  onConfirm={({ dates, systemId }) => {
    console.log(`Selected ${dates?.length || 0} dates`);
    dates?.forEach(date => {
      console.log(date.toDateString());
    });
  }}
>
```

## System ID

The `systemId` tells you which calendar system was active when the user confirmed:

```tsx
<Calendar.Root
  systems={[gregorianSystem, hijriSystem]}
  onConfirm={({ date, systemId }) => {
    if (systemId === 'gregorian') {
      console.log('Gregorian date:', date);
    } else if (systemId === 'hijri') {
      console.log('Hijri date (converted):', date);
      // The native Date is the Gregorian equivalent of the selected Hijri date
    }
  }}
>
```

## Form Integration

```tsx
function BookingForm() {
  const [booking, setBooking] = useState<{
    checkIn?: Date;
    checkOut?: Date;
  }>({});

  return (
    <View>
      <Calendar.Root
        mode="range"
        minRangeDays={2}
        onConfirm={({ startDate, endDate }) => {
          setBooking({
            checkIn: startDate,
            checkOut: endDate,
          });
        }}
      >
        <Calendar.DayGrid />
      </Calendar.Root>

      {booking.checkIn && booking.checkOut && (
        <BookingSummary
          checkIn={booking.checkIn}
          checkOut={booking.checkOut}
        />
      )}
    </View>
  );
}
```

## Server Submission

```tsx
function submitBooking(payload: CalendarSelectionPayload) {
  const body = {
    startDate: payload.startDate?.toISOString(),
    endDate: payload.endDate?.toISOString(),
    system: payload.systemId,
  };

  fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
```
