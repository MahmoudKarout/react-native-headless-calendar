---
sidebar_position: 9
---

# Vertical Infinite List

iOS-Calendar-style infinite scrolling: each visible month is its own `<CalendarProvider>` rendered into a `FlashList` row. The five hooks power each per-month UI.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo mode="single" vertical />

## Dependencies

```bash
npm install @shopify/flash-list
```

## Implementation

```tsx
import { useMemo } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar } from './HooksCalendar';

function buildMonths(before: number, after: number): Date[] {
  const today = new Date();
  today.setDate(1);
  const out: Date[] = [];
  for (let i = -before; i <= after; i += 1) {
    const d = new Date(today);
    d.setMonth(d.getMonth() + i);
    out.push(d);
  }
  return out;
}

export default function Screen() {
  const months = useMemo(() => buildMonths(12, 12), []);

  return (
    <FlashList
      data={months}
      estimatedItemSize={420}
      keyExtractor={(item) => item.toISOString()}
      renderItem={({ item }) => (
        <View style={{ padding: 12 }}>
          <CalendarProvider mode="range" initialDate={item}>
            <HooksCalendar />
          </CalendarProvider>
        </View>
      )}
    />
  );
}
```

## Notes

- Each row owns its store. Selections inside one month don't propagate to neighbouring months unless you lift state to the parent via `onConfirm`.
- For a single shared selection across months, render one `<CalendarProvider mode="range">` at the top and have each row read from `useCalendarSelector` — the provider can sit above the `FlashList`.
