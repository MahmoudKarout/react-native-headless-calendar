---
sidebar_position: 1
title: Single Date Picker
description: Build a single-date picker in React Native with react-native-fast-calendar. Headless hooks, your own UI, zero re-renders on idle cells.
keywords:
  - react native single date picker
  - react native calendar
  - headless date picker
---

# Single Date Picker

The most basic recipe — `mode="single"` plus a hooks-driven UI.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo mode="single" />

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
  const { selectDate, goPrevMonth, goNextMonth, confirm, clear } =
    useCalendarActions();
  const canConfirm = useCalendarSelector(selectCanConfirm);

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

      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <Pressable onPress={clear}><Text>Clear</Text></Pressable>
        <Pressable onPress={confirm} disabled={!canConfirm}>
          <Text>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Screen() {
  return (
    <CalendarProvider
      mode="single"
      onConfirm={({ date }) => console.log('Selected:', date)}
    >
      <Calendar />
    </CalendarProvider>
  );
}
```

## With an Initial Date

```tsx
<CalendarProvider mode="single" initialDate={new Date()}>
  {/* ... */}
</CalendarProvider>
```

## With Bounds and a Disabled Predicate

```tsx
<CalendarProvider
  mode="single"
  minDate={new Date()}
  maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
  disabled={(d) => d.getDay() === 0 || d.getDay() === 6}
/>
```
