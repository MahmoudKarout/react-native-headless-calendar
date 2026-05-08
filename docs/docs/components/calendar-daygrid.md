---
sidebar_position: 3
---

# Calendar.DayGrid

`<Calendar.DayGrid>` is the **only built-in visual component** that renders the 6×7 day grid. It handles layout, memoization, and swipe gestures.

## Features

- Two-layer memoization for performance
- Swipeable horizontal month list (via FlashList)
- Multi-month side-by-side display
- Week number column support
- Custom day cell rendering via `renderDay`

## Basic Usage

```tsx
import { Calendar } from 'react-native-fast-calendar';

function MyCalendar() {
  return (
    <Calendar.Root mode="single">
      <Calendar.DayGrid />
    </Calendar.Root>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `swipeable` | `boolean` | `false` | Enable horizontal swipe |
| `numberOfMonths` | `number` | `1` | Side-by-side months |
| `showWeekNumbers` | `boolean` | `false` | Show ISO week numbers |
| `renderDay` | `DayRenderer` | — | Custom day cell renderer |
| `style` | `ViewStyle` | — | Container style |

## Swipeable Mode

Enable horizontal swiping between months:

```tsx
<Calendar.Root mode="single">
  <Calendar.DayGrid swipeable />
</Calendar.Root>
```

:::info
Requires `@shopify/flash-list` as a peer dependency.
:::

### How It Works

The swipeable list uses a virtualized horizontal pager:

1. Renders a window of ±12 months around the displayed month
2. Expands the window by 6 months when reaching edges
3. Syncs scroll position with store's `displayed` month
4. Buffers 3 months (viewport ±1) for smooth swiping

### Limitations

- Mutually exclusive with `numberOfMonths > 1`
- Only available for single-month views
- Development builds warn if both props are set

## Multi-Month Display

Render multiple months side-by-side:

```tsx
<Calendar.Root mode="range">
  <Calendar.DayGrid numberOfMonths={2} />
</Calendar.Root>
```

Each month gets its own weekday header and can have its own caption via the `MonthCaption` component slot.

## Week Numbers

Show ISO 8601 week numbers in a leading column:

```tsx
<Calendar.Root mode="single">
  <Calendar.DayGrid showWeekNumbers />
</Calendar.Root>
```

Week numbers are computed from the Thursday of each row (the canonical ISO week day).

## Custom Day Rendering

The `renderDay` prop allows complete control over day cells:

```tsx
import { DayCellInfo } from 'react-native-fast-calendar';

<Calendar.DayGrid
  renderDay={(info: DayCellInfo) => (
    <MyCustomDayCell info={info} />
  )}
/>
```

### DayCellInfo

```ts
interface DayCellInfo<T = CalendarDateValue> {
  date: T;                    // Date in active calendar system
  nativeDate: Date;           // Native JS Date
  label: string;              // Formatted day label
  isCurrentMonth: boolean;    // Inside displayed month
  isToday: boolean;             // Is today
  isSelected: boolean;          // Is selected
  inRange: boolean;           // Inside range (range mode)
  isRangeStart: boolean;      // Is range start
  isRangeEnd: boolean;        // Is range end
  isDisabled: boolean;        // Is disabled
  modifiers: Record<string, boolean>;  // Modifier flags
  weekNumber?: number;        // ISO week number (if enabled)
}
```

### Example: Image Cells

```tsx
<Calendar.DayGrid
  renderDay={(info) => (
    <View style={styles.cell}>
      {info.isCurrentMonth && (
        <Image
          source={getDayImage(info.nativeDate)}
          style={styles.image}
        />
      )}
      <Text style={styles.label}>{info.label}</Text>
      {info.isSelected && <View style={styles.selectedIndicator} />}
    </View>
  )}
/>
```

### Example: Booking Calendar

```tsx
<Calendar.Root
  mode="range"
  modifiers={{
    booked: bookedDates,
    available: (date) => !isBooked(date),
  }}
>
  <Calendar.DayGrid
    renderDay={(info) => (
      <Pressable
        onPress={() => store.selectDate(info.date)}
        disabled={info.isDisabled}
        style={[
          styles.cell,
          info.modifiers.booked && styles.booked,
          info.modifiers.available && styles.available,
          info.isSelected && styles.selected,
          info.inRange && styles.inRange,
        ]}
      >
        <Text>{info.label}</Text>
        {info.modifiers.booked && <View style={styles.dot} />}
      </Pressable>
    )}
  />
</Calendar.Root>
```

## Rendering Order

The DayGrid renders in this order of precedence:

1. **`renderDay` prop** — Highest priority, for one-off custom cells
2. **`components.DayCell` on Root** — For design-system level replacement
3. **Default `<DayCell>`** — Built-in implementation

```tsx
// renderDay wins
<Calendar.DayGrid renderDay={MyCell} />

// components.DayCell wins over default
<Calendar.Root components={{ DayCell: MyCell }}>
  <Calendar.DayGrid />
</Calendar.Root>
```

## Complete Example

```tsx
import { Calendar, useCalendarStore, useCalendarTheme } from 'react-native-fast-calendar';
import { Pressable, Text, View } from 'react-native';

function CustomCalendar() {
  return (
    <Calendar.Root
      mode="single"
      modifiers={{
        weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
        holiday: [new Date('2024-12-25')],
      }}
    >
      <View style={{ padding: 16 }}>
        <Calendar.DayGrid
          swipeable
          renderDay={(info) => <MyDayCell info={info} />}
        />
      </View>
    </Calendar.Root>
  );
}

function MyDayCell({ info }) {
  const store = useCalendarStore();
  const theme = useCalendarTheme();

  const isWeekend = info.modifiers.weekend;
  const isHoliday = info.modifiers.holiday;

  return (
    <Pressable
      onPress={() => store.selectDate(info.date)}
      disabled={info.isDisabled}
      style={{
        width: theme.cellSize,
        height: theme.cellSize,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: info.isSelected
          ? theme.colors.primary
          : isHoliday
            ? '#FEE2E2'
            : 'transparent',
        borderRadius: theme.borderRadius,
        opacity: info.isDisabled ? 0.4 : 1,
      }}
    >
      <Text
        style={{
          color: info.isSelected
            ? theme.colors.onPrimary
            : isWeekend
              ? '#DC2626'
              : theme.colors.text,
        }}
      >
        {info.label}
      </Text>
      {isHoliday && (
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#DC2626',
          }}
        />
      )}
    </Pressable>
  );
}
```

## Performance Considerations

1. **Layer 1 memoization** — Date objects are cached by year/month primitives
2. **Layer 2 memoization** — Selection flags are overlaid, reusing date refs
3. **DayCell memoization** — Only 2-4 cells re-render on selection changes
4. **Granular subscriptions** — Header doesn't re-render on day taps

Avoid creating new objects in `renderDay`:

```tsx
// ❌ Bad - new object every render
renderDay={(info) => <Cell info={{ ...info, extra: true }} />}

// ✅ Good - pass through
renderDay={(info) => <Cell info={info} extra={true} />}
```

## Outside Days

When `showOutsideDays={false}` on `<Calendar.Root>`, outside-month cells render as invisible placeholders to preserve the 7-column grid layout:

```tsx
<Calendar.Root showOutsideDays={false}>
  <Calendar.DayGrid />
</Calendar.Root>
```

The cells are still present in the layout but with 0 opacity, keeping weekday alignment correct.
