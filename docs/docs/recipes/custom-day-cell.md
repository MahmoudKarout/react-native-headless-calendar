---
sidebar_position: 6
---

# Custom Day Cell

Every cell is rendered by **your** component — `useCalendarDays()` only computes the data. Wrap each cell in `React.memo` for free per-cell render savings.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo mode="single" cellStyle="status" />

## Pattern

```tsx
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  CalendarProvider,
  useCalendarDays,
  type DayCellInfo,
} from 'react-native-fast-calendar';

const EMOJI = ['🌞', '🌧', '⛅', '🌩', '❄️', '🌪', '🌈'];

const Cell = memo(function Cell({
  cell,
  onPress,
}: {
  cell: DayCellInfo;
  onPress: () => void;
}) {
  const emoji = EMOJI[cell.nativeDate.getDate() % EMOJI.length];
  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={onPress}
      style={{
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: cell.isSelected ? '#0f172a' : 'transparent',
      }}
    >
      <Text style={{ color: cell.isSelected ? '#fff' : '#0f172a' }}>
        {cell.label}
      </Text>
      <Text>{emoji}</Text>
    </Pressable>
  );
});

function Grid() {
  const days = useCalendarDays();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {days.cells.map((cell) => (
        <Cell
          key={cell.nativeDate.toISOString()}
          cell={cell}
          onPress={() => days.selectDate(cell.date)}
        />
      ))}
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

## Notes

- `cell` identity is stable across renders for cells whose state didn't change — pass it straight to `React.memo` and your custom component will skip re-renders.
- Use `cell.modifiers` to drive per-day overlays (booked dots, weekend tints, etc.). Pass `modifiers` to `<CalendarProvider>` to populate them.
