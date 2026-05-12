---
sidebar_position: 10
---

# Flight Price Calendar

A dark-themed, fare-aware date range picker — the kind of UI Skyscanner, Google Flights, and Kayak use to surface the cheapest departure / return combinations at a glance.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Interactive Demo

Click a departure date, then a return date. Each cell shows the fare for that day, and the picker enforces a **maximum 30-day** trip window…

<CalendarDemo mode="range" cellStyle="price" minRangeDays={1} maxRangeDays={30} />

## Why this is a good fit for `react-native-fast-calendar`

Flight calendars are the canonical "headless" use case:

- **Custom day cells** — every day shows a price, and selected / in-range / cheapest fares each get their own visual treatment. `Calendar.DayGrid` accepts a `renderDay` prop that returns _any_ React Native node, so the day cell becomes a tiny `View` with its own price label.
- **Range constraints** — `minRangeDays` and `maxRangeDays` cap the trip length, and `minDate={today}` blocks past departures. The library validates the range on the second tap and emits `onRangeError` so you can show a toast.
- **Performance** — fares can be expensive to compute (or come from an async API). Because the library only re-renders the two cells that change on each tap (the new endpoint and the old one), even a 30-day grid stays at 60fps with a heavy `renderDay`.

## Quick Start

```tsx
import { Calendar, type DayCellInfo } from 'react-native-fast-calendar';
import { Pressable, Text, View } from 'react-native';

function FlightCalendar() {
  return (
    <Calendar.Root
      mode="range"
      minDate={new Date()}
      minRangeDays={1}
      maxRangeDays={30}
      onConfirm={({ startDate, endDate }) => {
        searchFlights({ from: startDate, to: endDate });
      }}
    >
      <Calendar.DayGrid renderDay={(info) => <PriceCell info={info} />} />
    </Calendar.Root>
  );
}
```

## Custom Price Cell

Each day cell renders the **day number** and the **fare** stacked vertically. The fare colour shifts to green when it's at or below the base fare so cheap days pop visually:

```tsx
import {
  type DayCellInfo,
  useCalendarStore,
} from 'react-native-fast-calendar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function PriceCell({ info }: { info: DayCellInfo }) {
  const store = useCalendarStore();
  const fare = info.isCurrentMonth ? getFareFor(info.nativeDate) : null;
  const isCheapest = fare !== null && fare <= 100;
  const isEndpoint = info.isRangeStart || info.isRangeEnd;

  return (
    <View
      style={[
        styles.wrapper,
        info.inRange && styles.wrapperInRange,
      ]}
    >
      <Pressable
        disabled={info.isDisabled || !info.isCurrentMonth}
        onPress={() => store.selectDate(info.date)}
        style={[
          styles.cell,
          isEndpoint && styles.cellSelected,
          info.isToday && !isEndpoint && styles.cellToday,
        ]}
      >
        <Text
          style={[
            styles.day,
            !info.isCurrentMonth && styles.dayOutside,
            isEndpoint && styles.daySelected,
          ]}
        >
          {info.label}
        </Text>
        {fare !== null && (
          <Text
            style={[
              styles.fare,
              isCheapest && styles.fareCheap,
              isEndpoint && styles.fareSelected,
            ]}
          >
            ${fare}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
```

## Reading Selection State

Use `useCalendarSelector` to read the current range from the store and compute things like total fare or trip length without re-rendering the whole grid:

```tsx
import {
  useCalendarSelector,
} from 'react-native-fast-calendar';

function FareSummary() {
  const rangeStart = useCalendarSelector((s) => s.rangeStart);
  const rangeEnd = useCalendarSelector((s) => s.rangeEnd);
  const system = useCalendarSelector((s) => s.system);

  if (!rangeStart || !rangeEnd) return null;

  const departure = system.toNativeDate(rangeStart);
  const returnDate = system.toNativeDate(rangeEnd);
  const nights = Math.round(
    (returnDate.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24)
  );
  const total = totalFare(departure, returnDate);

  return (
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>
        {nights} night{nights === 1 ? '' : 's'} · round trip
      </Text>
      <Text style={styles.summaryTotal}>${total}</Text>
    </View>
  );
}
```

## Dark Theme

Pass a `theme` to `<Calendar.Root>` to switch the built-in surfaces (range background, today border, etc.) to your dark palette:

```tsx
import type { CalendarThemeOverride } from 'react-native-fast-calendar';

// Brand-aligned dark theme using DESIGN.md tokens
const FLIGHT_THEME: CalendarThemeOverride = {
  colors: {
    // Surfaces — dark mode equivalents of brand canvas tokens
    background: '#0a0a0a',      // --ds-canvas-soft (dark)
    primary: '#ededed',         // --ds-ink (dark primary)
    onPrimary: '#111111',       // --ds-on-primary (dark)

    // Text
    text: '#ededed',            // --ds-ink
    textMuted: '#888888',       // --ds-mute

    // Accents
    todayBorder: '#ededed',     // --ds-ink
    rangeBackground: '#1a1a1a', // --ds-accent (dark)
    disabled: '#666666',        // --ds-mute
    border: '#262626',          // --ds-hairline (dark)
  },
  cellSize: 48,
  borderRadius: 6,              // --ds-radius-sm (brand UI scale)
};

<Calendar.Root mode="range" theme={FLIGHT_THEME}>
  …
</Calendar.Root>;
```

## Highlighting the Cheapest Days

You can drive cheapest-day highlights with **modifiers** so the matching logic stays declarative and the cell doesn't need to know about the fare table directly:

```tsx
const cheapestDays: Date[] = computeCheapestDays(fares);

<Calendar.Root
  mode="range"
  modifiers={{
    cheapest: cheapestDays,
  }}
>
  <Calendar.DayGrid
    renderDay={(info) => (
      <PriceCell info={info} highlight={info.modifiers.cheapest} />
    )}
  />
</Calendar.Root>;
```

`info.modifiers.cheapest` will be `true` whenever the cell's date is in the `cheapestDays` array — exactly the same way `info.isToday` and `info.isSelected` work, so your cell can react to it without extra wiring.

## Complete Native Example

The full screen-style example used in our Storybook (`example/src/FlightPriceExample.tsx`) lives in the repo and includes:

- **Custom header** with month + year buttons that toggle the built-in month / year pickers via `useCalendarMonthLabel().toggle` and `useCalendarYearLabel().toggle`.
- **`PriceDayCell`** with start / end / in-range styling and tabular-numeric fares.
- **`FareSummary`** that computes total trip cost with `useCalendarSelector` and only re-renders when the range changes.
- **`ActionRow`** wired to `useCalendarActions().confirm` and `clear` so the confirm button stays disabled until the range is valid.

You can lift it as-is or use it as a starting point for your own product calendar.

## API Reference

| Prop / Hook | Used for |
| --- | --- |
| `mode="range"` | Two-tap range selection. |
| `minDate` | Block past departures. |
| `minRangeDays` / `maxRangeDays` | Cap trip length. |
| `allowSameDay` | Permit / forbid one-day "same-day return" trips. |
| `onConfirm` | Fired when `Confirm` is pressed with a valid range. |
| `onRangeError` | Fired when the user picks an invalid range. |
| `<Calendar.DayGrid renderDay>` | Per-cell renderer — return any RN node. |
| `useCalendarSelector` | Read `rangeStart`, `rangeEnd`, `system` without re-rendering siblings. |
| `useCalendarActions` | `confirm`, `clear`, `canConfirm` for the action row. |
| `theme` | Dark / branded surfaces. |
