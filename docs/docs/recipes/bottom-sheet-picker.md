---
sidebar_position: 8
---

# Bottom Sheet Picker

Pop the calendar inside a `@gorhom/bottom-sheet` modal. The calendar UI is built from the public hooks; the sheet handles presentation.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo mode="single" bottomSheet />

## Dependencies

```bash
npm install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
```

## Implementation

```tsx
import { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar } from './HooksCalendar'; // your shared hooks-only calendar

export default function Screen() {
  const sheet = useRef<BottomSheetModal>(null);
  const [picked, setPicked] = useState<Date | null>(null);

  const open = useCallback(() => sheet.current?.present(), []);
  const close = useCallback(() => sheet.current?.dismiss(), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Pressable onPress={open}>
            <Text>{picked ? picked.toDateString() : 'Pick a date'}</Text>
          </Pressable>
        </View>

        <BottomSheetModal ref={sheet} snapPoints={['65%']}>
          <BottomSheetView style={{ padding: 16 }}>
            <CalendarProvider
              mode="single"
              onConfirm={({ date }) => {
                if (date) setPicked(date);
                close();
              }}
            >
              <HooksCalendar />
            </CalendarProvider>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

The `onConfirm` callback fires from `useCalendarActions().confirm()` inside `HooksCalendar`. There is no special "sheet-aware" calendar — the same provider works inside or outside a sheet.
