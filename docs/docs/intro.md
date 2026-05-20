---
sidebar_position: 1
title: Introduction
description: react-native-fast-calendar is a headless, hooks-only calendar primitive for React Native — one provider per selection mode, two hooks, typed selectors.
keywords:
  - react native calendar
  - headless calendar
  - react native date picker
  - hooks
---

# Introduction

`react-native-fast-calendar` is a **headless, hooks-only calendar primitive** for React Native. Pick a provider for your selection mode, read state with one hook, mutate with another — you bring every pixel of UI.

## The API at a Glance

The library exports **three providers** (one per selection mode), **two hooks per mode**, and **built-in selectors** for the shapes you'll render most often.

| Mode | Provider | Read hook | Write hook |
| --- | --- | --- | --- |
| Single date | `SingleDateProvider` | `useSingleCalendarSelector` | `useSingleCalendarActions` |
| Date range | `RangeDateProvider` | `useRangeCalendarSelector` | `useRangeCalendarActions` |
| Multiple dates | `MultipleDateProvider` | `useMultipleCalendarSelector` | `useMultipleCalendarActions` |

```tsx
import {
  SingleDateProvider,
  selectSingleDays,
  selectSingleCanConfirm,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-fast-calendar';
```

There is no bundled `<Calendar>`, no theme object, and no label dictionary. You render your own components with the data the hooks expose.

## Quickest Possible Example

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  SingleDateProvider,
  selectSingleCanConfirm,
  selectSingleDays,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-fast-calendar';

function Calendar() {
  const days = useSingleCalendarSelector(selectSingleDays);
  const { selectDate, goPrevMonth, goNextMonth, confirm, clear } =
    useSingleCalendarActions();
  const canConfirm = useSingleCalendarSelector(selectSingleCanConfirm);

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
            style={{
              width: 40,
              height: 40,
              opacity: cell.isCurrentMonth ? 1 : 0.4,
              backgroundColor: cell.isSelected ? '#0f172a' : 'transparent',
            }}
          >
            <Text style={{ color: cell.isSelected ? '#fff' : '#0f172a' }}>
              {cell.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={confirm} disabled={!canConfirm}>
        <Text>Done</Text>
      </Pressable>
      <Pressable onPress={clear}><Text>Clear</Text></Pressable>
    </View>
  );
}

export default function Screen() {
  return (
    <SingleDateProvider onConfirm={({ date }) => console.log(date)}>
      <Calendar />
    </SingleDateProvider>
  );
}
```

## Why Three Providers?

Each mode has its own store and snapshot type. That keeps TypeScript precise (`selectedDate` on single, `rangeStart` / `rangeEnd` on range, `selectedDates` on multiple) and avoids a single mega-snapshot full of optional fields you'll never use.

Use `RangeDateProvider` for check-in / check-out flows and `MultipleDateProvider` when users pick several unrelated days.

For ranges, `disabledInRangeBehavior` (`'reject'` | `'include'` | `'exclude'`) controls what happens when the span between start and end includes disabled days — see [Providers](./hooks/providers#disabled-days-inside-a-range).

## Key Properties

- **Headless.** Zero opinions about layout, colour, or copy.
- **Hooks-only.** Two primitives per mode plus named selectors for common views.
- **Granular re-renders.** `useSyncExternalStore` under the hood; day cells keep stable references when their state is unchanged.
- **Multi-system.** Built-in Gregorian; optional Hijri and Jalali sub-paths; bring your own `CalendarSystem`.
- **TypeScript-first.** Every hook, cell type, and payload is exported.

## Where Next

- [Installation](./installation)
- [Mental Model](./core-concepts/mental-model)
- [Providers](./hooks/providers)
- [Mental model](./core-concepts/mental-model)
