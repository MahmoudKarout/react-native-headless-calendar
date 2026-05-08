---
sidebar_position: 7
---

# useCalendarYearLabel

The `useCalendarYearLabel` hook provides the displayed year label and controls for toggling the year picker view.

## Signature

```ts
interface CalendarYearLabel {
  /** Single year string in day/month view, "YYYY - YYYY" in year view */
  label: string;
  /** Switch between day and year views */
  toggle: () => void;
}

function useCalendarYearLabel(): CalendarYearLabel;
```

## Basic Usage

```tsx
import { useCalendarYearLabel } from 'react-native-fast-calendar';

function MyYearLabel() {
  const { label, toggle } = useCalendarYearLabel();

  return (
    <Button onPress={toggle} title={label} />
  );
}
```

## Label Format

The `label` format depends on the current view:

| View | Label Example |
|------|--------------|
| `day` | "2024" |
| `month` | "2024" |
| `year` | "2016 - 2027" |

The year picker shows a 12-year page aligned to the `YEAR_PAGE_SIZE` (12) boundary:

- 2027 → shows "2016 - 2027" (2027 / 12 = 168.9, rounds up to 169 × 12 = 2028, minus 12 = 2016)
- 2028 → shows "2028 - 2039" (2028 / 12 = 174 exactly, so starts at 2028)

## Toggle Behavior

Calling `toggle()` switches between views:

- In **day view** → switches to **year picker**
- In **month view** → switches to **year picker**
- In **year picker** → switches to **day view**

## Integration with Year Picker

```tsx
import {
  useCalendarYearLabel,
  useCalendarYearPicker,
  useCalendarNavigation,
} from 'react-native-fast-calendar';

function YearSelector() {
  const { label, toggle } = useCalendarYearLabel();
  const view = useCalendarSelector(s => s.view);

  return (
    <View>
      <Button onPress={toggle} title={label} />

      {view === 'year' && (
        <>
          <YearPageNavigation />
          <YearPicker />
        </>
      )}
    </View>
  );
}

function YearPageNavigation() {
  const { goPrev, goNext } = useCalendarNavigation();

  return (
    <View>
      {/* In year view, these step by 12 years */}
      <Button onPress={goPrev} title="‹‹" />
      <Button onPress={goNext} title="››" />
    </View>
  );
}

function YearPicker() {
  const { years, activeYear, selectYear } = useCalendarYearPicker();

  return (
    <Grid>
      {years.map(year => (
        <Cell
          key={year}
          active={year === activeYear}
          onPress={() => selectYear(year)}
        >
          {year}
        </Cell>
      ))}
    </Grid>
  );
}
```

## Granular Updates

The label is computed entirely inside the selector to return a stable primitive:

```ts
const label = useCalendarSelector((s) => {
  const year = s.system.year(s.displayed);
  if (s.view !== 'year') return String(year);
  const page = getYearPage(year);
  return `${page[0]} - ${page[page.length - 1]}`;
});
```

This prevents re-renders on date taps that don't move the year.

## Example: Year Range Display

```tsx
function YearRangeIndicator() {
  const { label } = useCalendarYearLabel();
  const view = useCalendarSelector(s => s.view);

  if (view === 'year') {
    const [start, end] = label.split(' - ');
    return (
      <View style={styles.rangeContainer}>
        <Text style={styles.rangeStart}>{start}</Text>
        <Text style={styles.rangeDivider}>—</Text>
        <Text style={styles.rangeEnd}>{end}</Text>
      </View>
    );
  }

  return <Text style={styles.year}>{label}</Text>;
}
```
