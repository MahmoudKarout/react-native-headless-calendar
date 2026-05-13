---
sidebar_position: 3
---

# useCalendarYears

`useCalendarYears` returns the paginated year grid for the active system, the active year, and actions for selecting a year or stepping the page.

## Signature

```ts
interface CalendarYears {
  years: readonly number[];        // YEAR_PAGE_SIZE entries
  activeYear: number;
  selectYear: (year: number) => void;
  goPrevPage: () => void;
  goNextPage: () => void;
}

function useCalendarYears(): CalendarYears;
```

## Usage

```tsx
import { Pressable, Text, View } from 'react-native';
import { useCalendarYears } from 'react-native-fast-calendar';

function YearPicker() {
  const { years, activeYear, selectYear, goPrevPage, goNextPage } =
    useCalendarYears();

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={goPrevPage}><Text>‹</Text></Pressable>
        <Text>{years[0]} – {years[years.length - 1]}</Text>
        <Pressable onPress={goNextPage}><Text>›</Text></Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {years.map((y) => (
          <Pressable
            key={y}
            onPress={() => selectYear(y)}
            style={{
              flexBasis: '25%',
              padding: 10,
              backgroundColor: y === activeYear ? '#bfdbfe' : '#e2e8f0',
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
- `selectYear` jumps the displayed date to that year and switches the store back to its `'day'` view.
- `goPrevPage` / `goNextPage` step `±YEAR_PAGE_SIZE` — wire them to chevrons in your year-picker header.
