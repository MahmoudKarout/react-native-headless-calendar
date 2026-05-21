---
sidebar_position: 2
---

# Day Cell Info

Each visible day in the grid is described by a mode-specific cell type. All extend the same base fields.

## Base Fields (`BaseDayCellFields`)

```ts
interface BaseDayCellFields<T = CalendarDateValue> {
  date: T;
  nativeDate: Date;
  label: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isDisabled: boolean;
  modifiers: Readonly<Record<string, boolean>>;
}
```

Access cells via `use*CalendarSelector(select*Days).cells` or `s.days.cells`.

## Mode-Specific Types

### `SingleDayCellInfo`

```ts
interface SingleDayCellInfo extends BaseDayCellFields {
  isSelected: boolean;
}
```

### `RangeDayCellInfo`

```ts
interface RangeDayCellInfo extends BaseDayCellFields {
  inRange: boolean; // strictly between endpoints
  isRangeStart: boolean;
  isRangeEnd: boolean;
}
```

`inRange` is `false` on the start and end cells themselves — use `isRangeStart` / `isRangeEnd` for endpoint styling.

When `disabledInRangeBehavior="include"`, a day can be both `inRange: true` and `isDisabled: true` (for example a blocked night inside a selected stay). Style those cells explicitly — the library does not hide them from the range highlight.

### `MultipleDayCellInfo`

```ts
interface MultipleDayCellInfo extends BaseDayCellFields {
  isSelected: boolean;
}
```

## Rendering Pattern

```tsx
import { memo } from 'react';
import { Pressable, Text } from 'react-native';
import type { RangeDayCellInfo } from 'react-native-headless-calendar';

export const DayCell = memo(function DayCell({
  cell,
  onPress,
}: {
  cell: RangeDayCellInfo;
  onPress: (cell: RangeDayCellInfo) => void;
}) {
  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={() => onPress(cell)}
      style={[
        !cell.isCurrentMonth && { opacity: 0.4 },
        cell.inRange && styles.inRange,
        cell.isRangeStart && styles.start,
        cell.isRangeEnd && styles.end,
        cell.modifiers.booked && styles.booked,
      ]}
    >
      <Text>{cell.label}</Text>
    </Pressable>
  );
});
```

Pass `cell.date` back to `selectDate` — the store normalises it through the active system.

## Modifier Flags

`modifiers` reflects every entry in the provider's `modifiers` prop:

```tsx
<SingleDateProvider
  modifiers={{
    booked: [new Date(2024, 4, 7)],
    holiday: [{ start: new Date(2024, 4, 20), end: new Date(2024, 4, 22) }],
    weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
  }}
>
```

```tsx
{
  cell.modifiers.booked && <View style={styles.dot} />;
}
```

## Stable Identity

The store reuses cell object references when nothing visible changed. Wrap your cell component in `React.memo` — unchanged cells skip re-renders entirely.
