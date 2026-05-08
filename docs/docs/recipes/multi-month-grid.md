---
sidebar_position: 5
---

# Multi-Month Grid

Display multiple months side-by-side — useful for travel booking, seasonal planning, and date range selection.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Interactive Demo

Two months side-by-side with range selection — exactly what `<SimpleCalendar mode="range" numberOfMonths={2} swipeable={false} />` renders:

<CalendarDemo mode="range" numberOfMonths={2} />

## Quick Start

```tsx
import { SimpleCalendar } from 'react-native-fast-calendar';

<SimpleCalendar
  mode="range"
  numberOfMonths={2}
  swipeable={false}
/>
```

:::warning
`numberOfMonths` disables `swipeable`. The grid becomes static.
:::

## With DayGrid

```tsx
<Calendar.DayGrid numberOfMonths={2} />
```

## Month Captions

Add month labels using the `MonthCaption` slot:

```tsx
<Calendar.Root
  components={{
    MonthCaption: MyMonthCaption,
  }}
>
  <Calendar.DayGrid numberOfMonths={2} />
</Calendar.Root>

function MyMonthCaption({ label, monthIndex }) {
  const seasons = ['❄️', '❄️', '🌸', '🌸', '🌸', '☀️', '☀️', '☀️', '🍂', '🍂', '🍂', '❄️'];

  return (
    <View style={styles.caption}>
      <Text style={styles.label}>{label}</Text>
      <Text>{seasons[monthIndex]}</Text>
    </View>
  );
}
```

## Three-Month View

```tsx
<SimpleCalendar
  mode="range"
  numberOfMonths={3}
  fixedWeeks={false}
  showOutsideDays={false}
/>
```

## With Week Numbers

```tsx
<Calendar.DayGrid
  numberOfMonths={2}
  showWeekNumbers
/>
```

## Hotel Booking Example

```tsx
function HotelBookingCalendar() {
  return (
    <View>
      <Text style={styles.title}>Select Your Stay</Text>

      <Calendar.Root
        mode="range"
        minRangeDays={2}
        maxRangeDays={14}
        numberOfMonths={2}
      >
        <Calendar.DayGrid />
        <BookingSummary />
      </Calendar.Root>
    </View>
  );
}

function BookingSummary() {
  const rangeStart = useCalendarSelector(s => s.rangeStart);
  const rangeEnd = useCalendarSelector(s => s.rangeEnd);

  if (!rangeStart || !rangeEnd) {
    return <Text>Select your dates</Text>;
  }

  const nights = Math.round(
    (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={styles.summary}>
      <Text>{nights} nights selected</Text>
      <Text>Total: ${nights * 150}</Text>
    </View>
  );
}
```

## Layout Considerations

Multi-month grids need horizontal space. Ensure your container is wide enough:

```tsx
const GRID_WIDTH = theme.cellSize * 7 * numberOfMonths + gap * (numberOfMonths - 1);

<View style={{ width: GRID_WIDTH }}>
  <Calendar.DayGrid numberOfMonths={2} />
</View>
```

On smaller screens, consider:
- Using `ScrollView` horizontally
- Reducing `cellSize` in theme
- Showing fewer months (1 on mobile, 2 on tablet)

