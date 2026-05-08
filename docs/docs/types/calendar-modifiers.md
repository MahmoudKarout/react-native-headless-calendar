---
sidebar_position: 5
---

# CalendarModifiers

The `CalendarModifiers` type is a map of named date matchers. Use it to mark dates with semantic meaning (booked, holiday, weekend) that can then be styled via `DayCellInfo.modifiers`.

## Type Definition

```ts
type CalendarModifiers = Readonly<Record<string, CalendarMatcher>>;

type CalendarMatcher =
  | readonly DisabledDateInput[]
  | readonly DisabledDateRangeInput[]
  | ((nativeDate: Date) => boolean);
```

## Usage

Pass modifiers to `<Calendar.Root>`:

```tsx
<Calendar.Root
  mode="single"
  modifiers={{
    booked: [new Date('2024-06-15'), new Date('2024-06-16')],
    holiday: [new Date('2024-12-25'), new Date('2024-12-26')],
    weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
    peakSeason: {
      start: new Date('2024-07-01'),
      end: new Date('2024-08-31'),
    },
  }}
>
```

## Matcher Types

### Date Array

Match specific dates:

```tsx
modifiers={{
  booked: [
    new Date('2024-06-15'),
    new Date('2024-06-16'),
    new Date('2024-06-20'),
  ],
}}
```

### Date Range Array

Match inclusive date ranges:

```tsx
modifiers={{
  peakSeason: [
    { start: new Date('2024-07-01'), end: new Date('2024-08-15') },
    { start: new Date('2024-12-20'), end: new Date('2024-12-31') },
  ],
}}
```

### Predicate Function

Match based on dynamic logic:

```tsx
modifiers={{
  weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
  payday: (date) => date.getDate() === 25, // 25th of each month
  past: (date) => date < new Date(),
}}
```

## Accessing Modifiers

Access modifier flags in custom day cells:

```tsx
<Calendar.DayGrid
  renderDay={(info) => (
    <View>
      <Text>{info.label}</Text>

      {/* Check modifiers */}
      {info.modifiers.booked && <RedDot />}
      {info.modifiers.holiday && <StarIcon />}
      {info.modifiers.weekend && <WeekendBadge />}
      {info.modifiers.peakSeason && <PeakPriceIndicator />}
    </View>
  )}
/>
```

## Use Cases

### Booking Calendar

```tsx
function BookingCalendar({ bookedDates, blockedDates }) {
  return (
    <Calendar.Root
      mode="range"
      modifiers={{
        booked: bookedDates,
        blocked: blockedDates,
        weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
      }}
    >
      <Calendar.DayGrid
        renderDay={(info) => (
          <Pressable
            disabled={info.modifiers.blocked || info.modifiers.booked}
            style={[
              styles.cell,
              info.modifiers.booked && styles.booked,
              info.modifiers.blocked && styles.blocked,
              info.modifiers.weekend && styles.weekend,
            ]}
          >
            <Text>{info.label}</Text>
            {info.modifiers.booked && <Text>Booked</Text>}
          </Pressable>
        )}
      />
    </Calendar.Root>
  );
}
```

### Event Calendar

```tsx
function EventCalendar({ events }) {
  const modifiers = useMemo(() => {
    const meetingDates = events
      .filter(e => e.type === 'meeting')
      .map(e => e.date);

    const deadlineDates = events
      .filter(e => e.type === 'deadline')
      .map(e => e.date);

    return {
      meeting: meetingDates,
      deadline: deadlineDates,
    };
  }, [events]);

  return (
    <Calendar.Root mode="single" modifiers={modifiers}>
      <Calendar.DayGrid
        renderDay={(info) => (
          <View>
            <Text>{info.label}</Text>
            <View style={styles.dots}>
              {info.modifiers.meeting && <View style={styles.blueDot} />}
              {info.modifiers.deadline && <View style={styles.redDot} />}
            </View>
          </View>
        )}
      />
    </Calendar.Root>
  );
}
```

### Price Calendar

```tsx
function PriceCalendar({ highSeasonRanges, specialEventDates }) {
  return (
    <Calendar.Root
      mode="single"
      modifiers={{
        highSeason: highSeasonRanges,
        specialEvent: specialEventDates,
        weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
      }}
    >
      <Calendar.DayGrid
        renderDay={(info) => {
          let priceMultiplier = 1;
          if (info.modifiers.highSeason) priceMultiplier = 1.5;
          if (info.modifiers.specialEvent) priceMultiplier = 2;
          if (info.modifiers.weekend) priceMultiplier *= 1.2;

          const basePrice = 100;
          const price = basePrice * priceMultiplier;

          return (
            <View>
              <Text>{info.label}</Text>
              <Text style={info.modifiers.highSeason && styles.highPrice}>
                ${price}
              </Text>
            </View>
          );
        }}
      />
    </Calendar.Root>
  );
}
```

## Best Practices

### Memoize Modifiers

Avoid creating new modifier objects on every render:

```tsx
// ❌ Bad - new object every render
<Calendar.Root modifiers={{ weekend: isWeekend }} />

// ✅ Good - stable reference
const MODIFIERS = {
  weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
  holiday: [new Date('2024-12-25')],
};

<Calendar.Root modifiers={MODIFIERS} />

// ✅ Also good - useMemo
const modifiers = useMemo(() => ({
  booked: bookedDates,
  holiday: holidayDates,
}), [bookedDates, holidayDates]);

<Calendar.Root modifiers={modifiers} />
```

### Modifier Names

Use descriptive, semantic names:

```tsx
// ✅ Good - semantic
modifiers={{
  booked: bookedDates,
  unavailable: blockedDates,
  holiday: holidayDates,
  weekend: isWeekend,
}}

// ❌ Less clear
modifiers={{
  red: bookedDates,
  gray: blockedDates,
}}
```

### Error Handling

Predicates that throw are handled gracefully:

```tsx
modifiers={{
  // If this throws, the date is treated as not matching
  riskyCheck: (date) => {
    return someFunctionThatMightThrow(date);
  },
}}
```

## Limitations

- Mixed arrays (dates + ranges) in a single modifier are not supported — use multiple modifiers
- Modifiers only provide boolean flags — they don't carry additional metadata
- For complex data per date, consider using `renderDay` with external data lookup
