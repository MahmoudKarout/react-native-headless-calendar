---
sidebar_position: 3
---

# Multi-Date Picker

`mode="multiple"` with `maxSelected` and named `modifiers`. Tapping a date toggles it in `selectedDates`.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo mode="multiple" maxSelected={5} />

## Implementation

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  CalendarProvider,
  useCalendarDays,
  useCalendarSelector,
} from 'react-native-fast-calendar';

const MODIFIER_STYLES = {
  booked:  { borderColor: '#dc2626', borderWidth: 2 },
  holiday: { backgroundColor: '#fef3c7' },
  weekend: { backgroundColor: '#fafafa' },
};

function Grid() {
  const days = useCalendarDays();
  const count = useCalendarSelector((s) => s.selectedDates.length);

  return (
    <View>
      <Text>Selected: {count}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.cells.map((cell) => {
          const modStyles = Object.entries(cell.modifiers)
            .filter(([, v]) => v)
            .map(([k]) => MODIFIER_STYLES[k as keyof typeof MODIFIER_STYLES]);
          return (
            <Pressable
              key={cell.nativeDate.toISOString()}
              disabled={cell.isDisabled}
              onPress={() => days.selectDate(cell.date)}
              style={[
                {
                  width: 40,
                  height: 40,
                  backgroundColor: cell.isSelected ? '#0f172a' : 'transparent',
                },
                ...modStyles,
              ]}
            >
              <Text>{cell.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function Screen() {
  return (
    <CalendarProvider
      mode="multiple"
      maxSelected={5}
      modifiers={{
        booked: [new Date(2024, 4, 5), new Date(2024, 4, 12)],
        holiday: [new Date(2024, 11, 25)],
        weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
      }}
      onConfirm={({ dates }) => console.log(dates)}
    >
      <Grid />
    </CalendarProvider>
  );
}
```

## Notes

- `selectedDates` order matches tap order. Read it with `useCalendarSelector((s) => s.selectedDates)`.
- Picks beyond `maxSelected` are silently ignored (no LRU eviction); call `useCalendarActions().clear()` to reset.
- `modifiers` runs on every visible cell — keep predicates cheap.
