---
sidebar_position: 1
---

# Introduction

`react-native-fast-calendar` is a **hooks-only, headless calendar primitive** for React Native. The entire public API is one provider component plus five hooks — bring your own UI.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Try It Out

<CalendarDemo mode="single" />

## The Whole API in One Glance

```tsx
import {
  CalendarProvider,
  useCalendarDays,
  useCalendarMonths,
  useCalendarYears,
  useCalendarActions,
  useCalendarSelector,
} from 'react-native-fast-calendar';
```

| Symbol | Purpose |
| --- | --- |
| `CalendarProvider` | Required boundary. Owns the store and the per-render config. |
| `useCalendarDays` | Day-grid cells, weekday labels, navigation, `selectDate`. |
| `useCalendarMonths` | 12 month entries + active month + `selectMonth`. |
| `useCalendarYears` | Paginated year list + active year + `selectYear` + page nav. |
| `useCalendarActions` | `confirm` / `clear` / `canConfirm`. |
| `useCalendarSelector` | Subscribe to any slice of the store with granular re-renders. |

There is no `<Calendar.DayGrid>`, no `<SimpleCalendar>`, no theme, no labels object. You render your own components with the data the hooks expose.

## Quickest Possible Example

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  CalendarProvider,
  useCalendarDays,
  useCalendarActions,
} from 'react-native-fast-calendar';

function Calendar() {
  const days = useCalendarDays();
  const { confirm, canConfirm } = useCalendarActions();

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={days.goPrevMonth}><Text>‹</Text></Pressable>
        <Text>{days.displayedMonthLabel} {days.displayedYearLabel}</Text>
        <Pressable onPress={days.goNextMonth}><Text>›</Text></Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.cells.map((cell) => (
          <Pressable
            key={cell.nativeDate.toISOString()}
            onPress={() => days.selectDate(cell.date)}
            disabled={cell.isDisabled}
            style={{ width: 40, height: 40, opacity: cell.isCurrentMonth ? 1 : 0.4 }}
          >
            <Text style={{ fontWeight: cell.isSelected ? '700' : '400' }}>
              {cell.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={confirm} disabled={!canConfirm}>
        <Text>Done</Text>
      </Pressable>
    </View>
  );
}

export default function Screen() {
  return (
    <CalendarProvider mode="single" onConfirm={({ date }) => console.log(date)}>
      <Calendar />
    </CalendarProvider>
  );
}
```

## Key Properties

- **Headless.** Zero opinions about how a calendar looks.
- **Hooks-only.** Five primitives compose into every recipe in this docset.
- **Granular re-renders.** Each hook subscribes only to the slice it needs.
- **Multi-system.** Built-in Gregorian; bundled adapters for Hijri and Jalali.
- **TypeScript-first.** Every hook return type is exported.

## Where Next

- [Installation](./installation)
- [Mental Model](./core-concepts/mental-model)
- [Recipes](./recipes/single-date-picker)
