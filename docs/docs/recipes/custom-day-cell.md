---
sidebar_position: 6
title: Custom Day Cell
description: Render every day cell with your own React component — modifier dots, prices, status badges, emoji — and keep granular per-cell re-renders via React.memo.
keywords:
  - custom day cell
  - calendar React.memo
  - status badge calendar
---

# Custom Day Cell

Every cell is rendered by **your** component — `useCalendarSelector(selectDays)` only computes the data. Wrap each cell in `React.memo` for free per-cell render savings.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo mode="single" cellStyle="status" />

## Pattern

```tsx
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  CalendarProvider,
  selectDays,
  useCalendarActions,
  useCalendarSelector,
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
        backgroundColor: cell.isSelected ? '#171717' : 'transparent',
      }}
    >
      <Text style={{ color: cell.isSelected ? '#ffffff' : '#171717' }}>
        {cell.label}
      </Text>
      <Text>{emoji}</Text>
    </Pressable>
  );
});

function Grid() {
  const days = useCalendarSelector(selectDays);
  // Subscription-free, identity-stable — never bumps the memoised cells.
  const { selectDate } = useCalendarActions();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {days.cells.map((cell) => (
        <Cell
          key={cell.nativeDate.toISOString()}
          cell={cell}
          onPress={() => selectDate(cell.date)}
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
