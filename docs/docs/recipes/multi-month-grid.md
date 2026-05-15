---
sidebar_position: 5
title: Multi-Month Grid
description: Render two or more months side-by-side, Airbnb-style, with independent calendar providers and a shared selection state.
keywords:
  - airbnb calendar
  - two month calendar
  - side by side calendar react native
---

# Multi-Month Grid

Render two months side-by-side, Airbnb-style, by mounting two independent `<CalendarProvider>` instances with different `initialDate`s.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo mode="range" numberOfMonths={2} />

## Implementation

```tsx
import { View } from 'react-native';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar } from './HooksCalendar';

const thisMonth = new Date();
const nextMonth = new Date(thisMonth);
nextMonth.setMonth(nextMonth.getMonth() + 1);

export default function Screen() {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <CalendarProvider mode="range" initialDate={thisMonth}>
          <HooksCalendar />
        </CalendarProvider>
      </View>
      <View style={{ flex: 1 }}>
        <CalendarProvider mode="range" initialDate={nextMonth}>
          <HooksCalendar />
        </CalendarProvider>
      </View>
    </View>
  );
}
```

## Why Two Providers

The hooks operate on a single store per provider. Mounting two providers gives you two independent stores — each scrolls its own months, while their selection callbacks can still write to the same parent state.

To keep a single shared selection across both grids, lift the selection up: have each provider's `onConfirm` call back into a parent reducer, or render one provider that drives both grids by computing two months from the same `displayed` snapshot.
