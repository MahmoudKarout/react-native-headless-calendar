---
sidebar_position: 5
---

# selectYears

`selectYears` is the pre-built selector that returns the paginated year grid for the active system and the active year. Pass it to [`useCalendarSelector`](./use-calendar-selector.md).

It is **data only**. To select a year or step the year-page, use `useCalendarActions().selectYear`, `prevYearPage`, and `nextYearPage`.

## Signature

```ts
interface CalendarYears {
  years: readonly number[];        // YEAR_PAGE_SIZE entries
  activeYear: number;
}

const selectYears: (s: CalendarSnapshot) => CalendarYears;
```

## Usage

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  selectYears,
  useCalendarActions,
  useCalendarSelector,
} from 'react-native-fast-calendar';

function YearPicker() {
  const { years, activeYear } = useCalendarSelector(selectYears);
  const { selectYear, prevYearPage, nextYearPage } = useCalendarActions();

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={prevYearPage}><Text>‹</Text></Pressable>
        <Text>{years[0]} – {years[years.length - 1]}</Text>
        <Pressable onPress={nextYearPage}><Text>›</Text></Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {years.map((y) => (
          <Pressable
            key={y}
            onPress={() => selectYear(y)}
            style={{
              flexBasis: '25%',
              padding: 10,
              backgroundColor: y === activeYear ? '#171717' : '#f5f5f5',
            }}
          >
            <Text>{y}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

## Notes

- The page contains exactly `YEAR_PAGE_SIZE` years (12 by default).
- The selector returns the same `CalendarYears` reference across commits that don't change the year page, so consumers stay still during unrelated state changes.
- `selectYear` (from `useCalendarActions`) jumps the displayed date to that year.
- `prevYearPage` / `nextYearPage` step `±YEAR_PAGE_SIZE` — wire them to chevrons in your year-picker header.
