---
sidebar_position: 2
---

# DayCellInfo

`DayCellInfo` describes a single cell of the day grid. The array `useCalendarDays().cells` contains one of these per visible cell (current-month and outside-month).

## Interface

```ts
interface DayCellInfo<T = CalendarDateValue> {
  date: T;                                          // value in the active system
  nativeDate: Date;                                 // for keys / formatting
  label: string;                                    // already localised, e.g. "12"
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;                              // single | multiple member | range endpoint
  inRange: boolean;                                 // strictly between range endpoints
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;                              // bound | list | predicate
  modifiers: Readonly<Record<string, boolean>>;     // matchers from <CalendarProvider modifiers>
}
```

## Rendering Pattern

```tsx
function DayCell({ cell, onPress }: { cell: DayCellInfo; onPress: () => void }) {
  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={onPress}
      style={[
        styles.cell,
        !cell.isCurrentMonth && styles.outside,
        cell.inRange && styles.inRange,
        cell.isSelected && styles.selected,
        cell.isToday && !cell.isSelected && styles.today,
        cell.isDisabled && styles.disabled,
        cell.modifiers.booked && styles.booked,
      ]}
    >
      <Text style={cell.isSelected && styles.selectedText}>{cell.label}</Text>
    </Pressable>
  );
}
```

## Modifier Flags

`modifiers` is the boolean output of every entry in `<CalendarProvider modifiers={…}>`:

```tsx
<CalendarProvider
  modifiers={{
    booked: [/* dates */],
    holiday: [/* { start, end } ranges */],
    weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
  }}
/>
```

Inside a cell renderer:

```tsx
{cell.modifiers.booked && <View style={styles.bookedDot} />}
{cell.modifiers.weekend && <View style={styles.weekendTint} />}
```

## Stable Identity

`cells` is recomputed only when one of the inputs changes (displayed month, mode, selection, bounds, modifiers). Wrap your day cell in `React.memo` and the cells whose `DayCellInfo` reference doesn't change will skip re-renders entirely.
