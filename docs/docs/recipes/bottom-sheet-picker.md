---
sidebar_position: 8
---

# Bottom Sheet Date Picker

A modal date picker using `@gorhom/bottom-sheet`.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Interactive Demo

Tap the input below to expand the bottom sheet — once a date is selected, **Done** dismisses it just like the `BottomSheet` `close()` call in the snippets…

<CalendarDemo mode="single" bottomSheet />

## Dependencies

```bash
npm install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
```

## Basic Implementation

```tsx
import { useRef, useCallback } from 'react';
import { View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { SimpleCalendar } from 'react-native-fast-calendar';

function BottomSheetPicker({ visible, onSelect, onClose }) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleConfirm = useCallback(({ date }) => {
    onSelect(date);
    bottomSheetRef.current?.close();
  }, [onSelect]);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={['50%', '90%']}
      onClose={onClose}
    >
      <View style={{ padding: 16 }}>
        <SimpleCalendar
          mode="single"
          showHeader={true}
          showFooter={true}
          onConfirm={handleConfirm}
        />
      </View>
    </BottomSheet>
  );
}
```

## Range Picker in Bottom Sheet

```tsx
function RangeBottomSheet({ visible, onSelect, onClose }) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={['60%']}
      onClose={onClose}
    >
      <Calendar.Root
        mode="range"
        onConfirm={({ startDate, endDate }) => {
          onSelect({ startDate, endDate });
          bottomSheetRef.current?.close();
        }}
      >
        <View style={{ padding: 16 }}>
          <RangeHeader />
          <Calendar.DayGrid swipeable />
          <RangeFooter onClose={() => bottomSheetRef.current?.close()} />
        </View>
      </Calendar.Root>
    </BottomSheet>
  );
}

function RangeHeader() {
  const start = useCalendarSelector(s => s.rangeStart);
  const end = useCalendarSelector(s => s.rangeEnd);
  const system = useCalendarSelector(s => s.system);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>
        {start && end
          ? `${system.formatDay(start)} - ${system.formatDay(end)}`
          : 'Select dates'}
      </Text>
    </View>
  );
}

function RangeFooter({ onClose }) {
  const { confirm, canConfirm } = useCalendarActions();

  return (
    <View style={{ flexDirection: 'row', marginTop: 16 }}>
      <Button onPress={onClose} title="Cancel" />
      <Button
        onPress={confirm}
        title="Select"
        disabled={!canConfirm}
      />
    </View>
  );
}
```

## Trigger Component

```tsx
function DateInput() {
  const [date, setDate] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setPickerVisible(true)}
        accessibilityLabel={date ? `Selected date: ${date.toDateString()}` : 'Select a date'}
        accessibilityHint="Double tap to open date picker"
        accessibilityRole="button"
        style={styles.input}
      >
        <Text>
          {date ? date.toDateString() : 'Select date…'}
        </Text>
      </Pressable>

      <BottomSheetPicker
        visible={pickerVisible}
        onSelect={(selected) => {
          setDate(selected);
          setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
```

## Full-Screen Bottom Sheet

```tsx
<BottomSheet
  ref={bottomSheetRef}
  snapPoints={['100%']}
  enablePanDownToClose={true}
>
  <View style={{ flex: 1, padding: 16 }}>
    <SimpleCalendar
      mode="single"
      numberOfMonths={2}
      swipeable={false}
    />
  </View>
</BottomSheet>
```
