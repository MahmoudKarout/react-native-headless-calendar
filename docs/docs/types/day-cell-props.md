---
sidebar_position: 13
---

# DayCellProps

The `DayCellProps` interface defines all props accepted by the `DayCell` component.

## Interface Definition

```ts
interface DayCellProps {
  /** Full cell metadata */
  info: DayCellInfo;
  /** Selection callback */
  onSelect: (date: CalendarDateValue) => void;
}
```

## Properties

### `info: DayCellInfo`

Full cell metadata including:
- Date values (system-specific and native)
- Position (isCurrentMonth)
- State (isToday, isSelected, inRange, isDisabled)
- Modifiers

See [DayCellInfo](./day-cell-info) for full details.

### `onSelect: (date: CalendarDateValue) => void`

Callback when the cell is pressed. Typically bound to `store.selectDate`.

## Usage

### Direct Usage

```tsx
import { DayCell, useCalendarStore } from 'react-native-fast-calendar';

function MyCustomGrid() {
  const store = useCalendarStore();

  return (
    <View>
      {cellInfos.map((info) => (
        <DayCell
          key={info.index}
          info={info}
          onSelect={store.selectDate}
        />
      ))}
    </View>
  );
}
```

### Component Slot

```tsx
import { DayCell } from 'react-native-fast-calendar';

function MyDayCell({ info, onSelect }: DayCellProps) {
  // Custom implementation
  return (
    <Pressable onPress={() => onSelect(info.date)}>
      <Text>{info.label}</Text>
    </Pressable>
  );
}

<Calendar.Root
  components={{
    DayCell: MyDayCell,
  }}
>
```

## Memoization

The `DayCell` component uses custom equality for `React.memo`:

```ts
const dayCellPropsEqual = (prev: DayCellProps, next: DayCellProps): boolean => {
  if (prev.onSelect !== next.onSelect) return false;
  const a = prev.info;
  const b = next.info;
  return (
    a.date === b.date &&
    a.label === b.label &&
    a.isCurrentMonth === b.isCurrentMonth &&
    a.isToday === b.isToday &&
    a.isSelected === b.isSelected &&
    a.inRange === b.inRange &&
    a.isRangeStart === b.isRangeStart &&
    a.isRangeEnd === b.isRangeEnd &&
    a.isDisabled === b.isDisabled
  );
};
```

This ensures only affected cells re-render on selection changes.
