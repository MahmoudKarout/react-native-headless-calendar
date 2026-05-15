---
sidebar_position: 4
---

# selectMonths

`selectMonths` is the pre-built selector that returns the data needed to render a 12-cell month chooser for the active calendar system. Pass it to [`useCalendarSelector`](./use-calendar-selector.md).

It is **data only**. To jump to a month, call `useCalendarActions().selectMonth(index)`.

## Signature

```ts
interface CalendarMonthEntry {
  index: number;   // 0..11
  label: string;   // localised name
}

interface CalendarMonths {
  months: readonly CalendarMonthEntry[];
  activeMonth: number;
}

const selectMonths: (s: CalendarSnapshot) => CalendarMonths;
```

## Usage

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  selectMonths,
  useCalendarActions,
  useCalendarSelector,
} from 'react-native-fast-calendar';

function MonthPicker() {
  const { months, activeMonth } = useCalendarSelector(selectMonths);
  const { selectMonth } = useCalendarActions();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {months.map((m) => (
        <Pressable
          key={m.index}
          onPress={() => selectMonth(m.index)}
          style={{
            flexBasis: '33%',
            padding: 12,
            backgroundColor: m.index === activeMonth ? '#171717' : '#f5f5f5',
          }}
        >
          <Text>{m.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
```

## Notes

- `months` has identity-stable membership while the active calendar system doesn't change, so it's safe to pass to memoised children.
- The selector returns the same `CalendarMonths` reference across commits that don't move the displayed month or swap the system — components reading it stay still during unrelated state changes.
- `selectMonth` (from `useCalendarActions`) jumps the displayed date to that month.
