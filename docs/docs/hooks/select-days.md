---
sidebar_position: 3
---

# selectDays

`selectDays` is the pre-built selector that returns everything needed to render a month grid: the cell list, the rotated weekday labels, and the displayed-month headers. Pass it to [`useCalendarSelector`](./use-calendar-selector.md).

It is **data only** — no callbacks. Navigation and selection actions live on [`useCalendarActions`](./use-calendar-actions.md), which is subscription-free and stable.

## Signature

```ts
interface CalendarDays {
  weekdayLabels: readonly string[];
  cells: readonly DayCellInfo[];
  displayedMonthLabel: string;
  displayedYearLabel: string;
}

const selectDays: (s: CalendarSnapshot) => CalendarDays;
```

## Basic Usage

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  CalendarProvider,
  selectDays,
  useCalendarActions,
  useCalendarSelector,
} from 'react-native-fast-calendar';

function Grid() {
  const days = useCalendarSelector(selectDays);
  const { selectDate, goPrevMonth, goNextMonth } = useCalendarActions();

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={goPrevMonth}><Text>‹</Text></Pressable>
        <Text>{days.displayedMonthLabel} {days.displayedYearLabel}</Text>
        <Pressable onPress={goNextMonth}><Text>›</Text></Pressable>
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
            onPress={() => selectDate(cell.date)}
            disabled={cell.isDisabled}
            style={{
              width: 40,
              height: 40,
              opacity: cell.isCurrentMonth ? 1 : 0.4,
              backgroundColor: cell.isSelected ? '#171717' : 'transparent',
            }}
          >
            <Text style={{ color: cell.isSelected ? '#ffffff' : '#171717' }}>
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

## Why actions live elsewhere

`selectDays` subscribes to every slice that affects the cell array: `displayed`, `mode`, every selection field, bounds, `disabled`, etc. Bundling actions into the same return value would force every action-only consumer (e.g. a list of cells whose only concern is calling `selectDate`) to subscribe to all of those slices and re-render on every selection change.

Pull actions from `useCalendarActions()` instead — it returns a stable, subscription-free object whose identity never changes for the lifetime of the provider:

```tsx
const days = useCalendarSelector(selectDays);   // data — re-renders with grid changes
const { selectDate, goPrevMonth, goNextMonth, setDisplayedDate } =
  useCalendarActions();                          // actions — never re-render the consumer
```

## Identity Stability

`selectDays` reads from the snapshot's pre-derived `days` view, which the store maintains incrementally:

- The returned object's identity is **stable** across commits that don't touch the day grid (e.g. a year-page change with the displayed month unchanged returns the same `CalendarDays` reference).
- Individual `DayCellInfo` references are stable across commits where their own state is unchanged. Wrap your day cell in `React.memo` and the unchanged cells skip re-renders entirely.

## Re-render Behaviour

The selector flips its return value whenever any slice that affects the cell array changes (displayed, mode, selection, bounds, modifiers). Tapping a date only re-renders components that read `selectDays` — components that read `selectMonths` / `selectYears` are untouched.
