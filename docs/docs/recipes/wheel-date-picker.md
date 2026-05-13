---
sidebar_position: 11
---

# Wheel Date Picker

An iOS-style drum-roll picker with three independent columns: **day**, **month**, and **year**. The wheel itself is a self-contained `react-native-reanimated` + `react-native-gesture-handler` widget — it does **not** use any of the calendar hooks.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo wheel />

## Why This Recipe Doesn't Use the Hooks

The wheel does not need a month grid, a selection store, or modifier matchers. It just emits a `Date`. Read the full implementation in `example/src/WheelDatePickerExample.tsx`. If your design later needs both the wheel and the grid in the same flow, drive both from the same parent state and pass the wheel's `onChange` straight into a `<CalendarProvider initialDate={…}>`.

## Dependencies

```bash
npm install react-native-reanimated react-native-gesture-handler
```

Wrap your root with `GestureHandlerRootView`:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <YourApp />
    </GestureHandlerRootView>
  );
}
```

The wheel ships in the example app; copy it over and tweak colors / spring physics to match your design system.
