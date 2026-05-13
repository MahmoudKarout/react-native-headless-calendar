---
sidebar_position: 2
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
  useCalendarDays,
  useCalendarSelector,
  useCalendarActions,
} from 'react-native-fast-calendar';

function Calendar() {
  const days = useCalendarDays();
  const rangeStart = useCalendarSelector((s) => s.rangeStart);
  const rangeEnd = useCalendarSelector((s) => s.rangeEnd);
  const { confirm, clear, canConfirm } = useCalendarActions();

  return (
    <View>
      {/* header + grid identical to the single picker recipe */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.cells.map((cell) => (
          <Pressable
            key={cell.nativeDate.toISOString()}
            disabled={cell.isDisabled}
            onPress={() => days.selectDate(cell.date)}
            style={{
              width: 40,
              height: 40,
              backgroundColor: cell.isSelected
                ? '#0f172a'
                : cell.inRange
                  ? '#dbeafe'
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
