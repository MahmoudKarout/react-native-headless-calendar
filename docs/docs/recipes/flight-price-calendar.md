---
sidebar_position: 10
title: Flight Price Calendar
description: A fare-aware range picker that paints per-day prices into custom cells — perfect for travel and airline apps.
keywords:
  - flight price calendar
  - fare calendar
  - travel date picker
  - airline calendar react native
---

# Flight Price Calendar

Dark range picker with per-day fares painted into a custom cell renderer. The fares are not part of the library — pass any function `Date -> price` to your cell.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo mode="range" cellStyle="price" />

## Implementation

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  CalendarProvider,
  selectCanConfirm,
  selectDays,
  useCalendarActions,
  useCalendarSelector,
  type DayCellInfo,
} from 'react-native-fast-calendar';

function priceFor(date: Date): number {
  const k = date.getFullYear() * 372 + date.getMonth() * 31 + date.getDate();
  return 79 + ((k * 7919) % 281);
}

function PriceCell({ cell, onPress }: { cell: DayCellInfo; onPress: () => void }) {
  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={onPress}
      style={{
        width: 46,
        height: 52,
        alignItems: 'center',
        backgroundColor: cell.isSelected
          ? '#0070f3'
          : cell.inRange
            ? 'rgba(0,112,243,0.18)'
            : 'transparent',
      }}
    >
      <Text style={{ color: '#ffffff' }}>{cell.label}</Text>
      <Text style={{ color: '#a1a1a1', fontSize: 10 }}>
        ${priceFor(cell.nativeDate)}
      </Text>
    </Pressable>
  );
}

function Calendar() {
  const days = useCalendarSelector(selectDays);
  const { selectDate, confirm } = useCalendarActions();
  const canConfirm = useCalendarSelector(selectCanConfirm);
  const start = useCalendarSelector((s) => s.rangeStart);
  const end = useCalendarSelector((s) => s.rangeEnd);

  return (
    <View>
      <Text style={{ color: '#ededed' }}>
        {days.displayedMonthLabel} {days.displayedYearLabel}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.cells.map((cell) => (
          <PriceCell
            key={cell.nativeDate.toISOString()}
            cell={cell}
            onPress={() => selectDate(cell.date)}
          />
        ))}
      </View>
      <Text style={{ color: '#a1a1a1' }}>
        {start && end ? 'Range selected' : start ? 'Pick return' : 'Pick departure'}
      </Text>
      <Pressable onPress={confirm} disabled={!canConfirm}>
        <Text style={{ color: '#ededed' }}>Confirm</Text>
      </Pressable>
    </View>
  );
}

export default function Screen() {
  return (
    <CalendarProvider mode="range" minDate={new Date()}>
      <Calendar />
    </CalendarProvider>
  );
}
```

## Notes

- `priceFor` is a stand-in. In production swap it for a lookup against your fares cache.
- For very expensive lookups, memoise per `cell.nativeDate.toISOString()` outside the cell component.
