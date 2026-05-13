---
sidebar_position: 2
---

# useCalendarMonths

`useCalendarMonths` returns the data needed to render a 12-cell month chooser for the active calendar system.

## Signature

```ts
interface CalendarMonthEntry {
  index: number;   // 0..11
  label: string;   // localised name
}

interface CalendarMonths {
  months: readonly CalendarMonthEntry[];
  activeMonth: number;
  selectMonth: (index: number) => void;
}

function useCalendarMonths(): CalendarMonths;
```

## Usage

```tsx
import { Pressable, Text, View } from 'react-native';
import { useCalendarMonths } from 'react-native-fast-calendar';

function MonthPicker() {
  const { months, activeMonth, selectMonth } = useCalendarMonths();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {months.map((m) => (
        <Pressable
          key={m.index}
          onPress={() => selectMonth(m.index)}
          style={{
            flexBasis: '33%',
            padding: 12,
            backgroundColor: m.index === activeMonth ? '#bfdbfe' : '#e2e8f0',
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
- `selectMonth` jumps the displayed date to that month and switches the store back to its `'day'` view.
