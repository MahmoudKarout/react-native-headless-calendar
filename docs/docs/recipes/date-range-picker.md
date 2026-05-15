---
sidebar_position: 2
title: Date Range Picker
description: Build a hotel-style date range picker in React Native with min/max nights and allow-same-day, powered by react-native-fast-calendar.
keywords:
  - react native date range picker
  - hotel calendar
  - airbnb calendar
  - min max nights
---

# Date Range Picker

`mode="range"` with `minRangeDays` / `maxRangeDays` / `allowSameDay` constraints. The store progressively fills `rangeStart` then `rangeEnd`; if the resulting range is shorter than `minRangeDays` or longer than `maxRangeDays`, the pick is silently ignored.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo mode="range" minRangeDays={2} maxRangeDays={14} />

## Implementation

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  CalendarProvider,
  selectCanConfirm,
  selectDays,
  useCalendarActions,
  useCalendarSelector,
} from 'react-native-fast-calendar';

function Calendar() {
  const days = useCalendarSelector(selectDays);
  const rangeStart = useCalendarSelector((s) => s.rangeStart);
  const rangeEnd = useCalendarSelector((s) => s.rangeEnd);
  const { selectDate, confirm, clear } = useCalendarActions();
  const canConfirm = useCalendarSelector(selectCanConfirm);

  return (
    <View>
      {/* header + grid identical to the single picker recipe */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.cells.map((cell) => (
          <Pressable
            key={cell.nativeDate.toISOString()}
            disabled={cell.isDisabled}
            onPress={() => selectDate(cell.date)}
            style={{
              width: 40,
              height: 40,
              backgroundColor: cell.isSelected
                ? '#171717'
                : cell.inRange
                  ? '#f5f5f5'
                  : 'transparent',
            }}
          >
            <Text>{cell.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text>
        {rangeStart && rangeEnd
          ? 'Range complete'
          : rangeStart
            ? 'Pick the end date'
            : 'Pick the start date'}
      </Text>

      <View style={{ flexDirection: 'row' }}>
        <Pressable onPress={clear}><Text>Clear</Text></Pressable>
        <Pressable onPress={confirm} disabled={!canConfirm}>
          <Text>Confirm</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Screen() {
  return (
    <CalendarProvider
      mode="range"
      minRangeDays={2}
      maxRangeDays={14}
      allowSameDay
      onConfirm={({ startDate, endDate }) => {
        console.log({ startDate, endDate });
      }}
    >
      <Calendar />
    </CalendarProvider>
  );
}
```

## Notes

- `cell.inRange` is `true` only for cells **strictly between** the two endpoints.
- `cell.isRangeStart` / `cell.isRangeEnd` flag the endpoints if you want pill-style highlighting.
- `allowSameDay` lets the user tap the same day twice to lock in a single-day range.
