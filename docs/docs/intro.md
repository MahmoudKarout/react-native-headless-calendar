---
sidebar_position: 1
title: Introduction
description: react-native-fast-calendar is a headless, hooks-only calendar primitive for React Native — one provider, two hooks, infinite UI.
keywords:
  - react native calendar
  - headless calendar
  - react native date picker
  - hooks
---

# Introduction

`react-native-fast-calendar` is a **hooks-only, headless calendar primitive** for React Native. The entire public API is one provider component plus two hooks (and a handful of pre-built selectors) — bring your own UI.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Try It Out

<CalendarDemo mode="single" />

## The Whole API in One Glance

```tsx
import {
  CalendarProvider,
  useCalendarActions,
  useCalendarSelector,
  // Pre-built selectors for the common shapes.
  selectCanConfirm,
  selectDays,
  selectMonths,
  selectYears,
} from 'react-native-fast-calendar';
```

| Symbol | Purpose |
| --- | --- |
| `CalendarProvider` | Required boundary. Owns the store and the per-render config. |
| `useCalendarSelector` | Subscribe to any slice of the store with granular re-renders. |
| `useCalendarActions` | Every mutator: `selectDate`, navigation, `confirm`, `clear`. Subscription-free. |
| `selectDays` | Day-grid cells, weekday labels, displayed-month/year labels. |
| `selectMonths` | 12 month entries + active month. |
| `selectYears` | Paginated year list + active year. |
| `selectCanConfirm` | `true` when the current selection is committable. |

There is no `<Calendar.DayGrid>`, no `<SimpleCalendar>`, no theme, no labels object. You render your own components with the data the hooks expose.

## Quickest Possible Example

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
  const { selectDate, goPrevMonth, goNextMonth, confirm } =
    useCalendarActions();
  const canConfirm = useCalendarSelector(selectCanConfirm);

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={goPrevMonth}><Text>‹</Text></Pressable>
        <Text>{days.displayedMonthLabel} {days.displayedYearLabel}</Text>
        <Pressable onPress={goNextMonth}><Text>›</Text></Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.cells.map((cell) => (
          <Pressable
            key={cell.nativeDate.toISOString()}
            onPress={() => selectDate(cell.date)}
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
- **Hooks-only.** Two primitives plus named selectors compose into every recipe in this docset.
- **Granular re-renders.** Each selector subscribes only to the slice it needs.
- **Multi-system.** Built-in Gregorian; bundled adapters for Hijri and Jalali.
- **TypeScript-first.** Every hook return type is exported.

## Where Next

- [Installation](./installation)
- [Mental Model](./core-concepts/mental-model)
- [Recipes](./recipes/single-date-picker)
