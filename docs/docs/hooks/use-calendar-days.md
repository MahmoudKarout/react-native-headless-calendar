---
sidebar_position: 1
---

# useCalendarDays

`useCalendarDays` returns everything needed to render a month grid: the cell list, the rotated weekday labels, the displayed-month headers, and actions for navigating and selecting dates.

## Signature

```ts
interface CalendarDays {
  weekdayLabels: readonly string[];
  cells: readonly DayCellInfo[];
  displayedMonthLabel: string;
  displayedYearLabel: string;
  goPrevMonth: () => void;
  goNextMonth: () => void;
  setDisplayedDate: (date: CalendarDateValue) => void;
  selectDate: (date: CalendarDateValue) => void;
}

function useCalendarDays(): CalendarDays;
```

## Basic Usage

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  CalendarProvider,
  useCalendarDays,
} from 'react-native-fast-calendar';

function Grid() {
  const days = useCalendarDays();

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={days.goPrevMonth}><Text>‹</Text></Pressable>
        <Text>{days.displayedMonthLabel} {days.displayedYearLabel}</Text>
        <Pressable onPress={days.goNextMonth}><Text>›</Text></Pressable>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {days.weekdayLabels.map((l) => (
          <Text key={l} style={{ width: 40, textAlign: 'center' }}>{l}</Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.cells.map((cell) => (
          <Pressable
            key={cell.nativeDate.toISOString()}
            onPress={() => days.selectDate(cell.date)}
            disabled={cell.isDisabled}
            style={{
              width: 40,
              height: 40,
              opacity: cell.isCurrentMonth ? 1 : 0.4,
              backgroundColor: cell.isSelected ? '#0f172a' : 'transparent',
            }}
          >
            <Text style={{ color: cell.isSelected ? '#fff' : '#0f172a' }}>
              {cell.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function Screen() {
  return (
    <CalendarProvider mode="single">
      <Grid />
    </CalendarProvider>
  );
}
```

## DayCellInfo

Each entry in `cells` carries everything needed to render and style a day:

```ts
interface DayCellInfo {
  date: CalendarDateValue;     // value in the active system
  nativeDate: Date;            // for keys, comparisons, formatting
  label: string;               // "12" — already localised
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;         // single, range endpoint, or multiple member
  inRange: boolean;            // strictly between range endpoints
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;         // bound, list, or `disabled` predicate
  modifiers: Readonly<Record<string, boolean>>;
}
```

`modifiers` is the boolean output of every matcher passed to `<CalendarProvider modifiers={{ … }}>`. Use it to add dots, tints, or alternate cell styles.

## Selecting Dates

`selectDate` works in every mode — the store routes the tap to the right place:

| Mode | Behaviour |
| --- | --- |
| `single` | Replace `selectedDate`. |
| `multiple` | Toggle the date in `selectedDates` (capped by `maxSelected`). |
| `range` | Pick start, then end (with `allowSameDay` / `minRangeDays` / `maxRangeDays` honoured). |

Disabled dates are silently ignored.

## Navigation

`goPrevMonth` / `goNextMonth` step the displayed month. `setDisplayedDate(anyDate)` jumps the grid to that month — useful when wiring up a "Today" button:

```tsx
const days = useCalendarDays();
<Pressable onPress={() => days.setDisplayedDate(new Date())}>
  <Text>Today</Text>
</Pressable>
```

## Re-render Behaviour

The hook subscribes to every store slice the cell array depends on (`displayed`, `mode`, selection state, bounds, `disabled`, `disabledDates`, `disabledRanges`). Tapping a date that doesn't change `displayed` only changes the `cells` array — month-picker and year-picker UIs that use `useCalendarMonths` / `useCalendarYears` won't re-render.
