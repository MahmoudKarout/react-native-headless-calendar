---
sidebar_position: 4
title: Built-in Selectors
---

# Built-in Selectors

Pre-built selector functions for the three most common views. Pass them to the matching `use*CalendarSelector` hook.

| Single                   | Range                   | Multiple                   |
| ------------------------ | ----------------------- | -------------------------- |
| `selectSingleDays`       | `selectRangeDays`       | `selectMultipleDays`       |
| `selectSingleMonths`     | `selectRangeMonths`     | `selectMultipleMonths`     |
| `selectSingleYears`      | `selectRangeYears`      | `selectMultipleYears`      |
| `selectSingleCanConfirm` | `selectRangeCanConfirm` | `selectMultipleCanConfirm` |

## select\*Days

Everything needed to render a month grid.

```ts
interface CalendarDaysView<TCell> {
  weekdayLabels: readonly string[];
  cells: readonly TCell[];
  displayedMonthLabel: string;
  displayedYearLabel: string;
}
```

```tsx
function Grid() {
  const days = useSingleCalendarSelector(selectSingleDays);
  const { selectDate, goPrevMonth, goNextMonth } = useSingleCalendarActions();

  return (
    <View>
      <Header
        label={`${days.displayedMonthLabel} ${days.displayedYearLabel}`}
        onPrev={goPrevMonth}
        onNext={goNextMonth}
      />
      <WeekdayRow labels={days.weekdayLabels} />
      <DayGrid cells={days.cells} onSelect={selectDate} />
    </View>
  );
}
```

`weekdayLabels` are already rotated for `firstDayOfWeek`. `cells` always has 42 entries (6×7 grid).

### Cell types

| Mode     | Type                  | Selection fields                        |
| -------- | --------------------- | --------------------------------------- |
| Single   | `SingleDayCellInfo`   | `isSelected`                            |
| Range    | `RangeDayCellInfo`    | `inRange`, `isRangeStart`, `isRangeEnd` |
| Multiple | `MultipleDayCellInfo` | `isSelected`                            |

All share [base day-cell fields](../types/day-cell-info). See [DayCellInfo](../types/day-cell-info) for the full interface.

## select\*Months

```ts
interface CalendarMonths {
  months: readonly { index: number; label: string }[];
  activeMonth: number; // 0-based
}
```

```tsx
const { months, activeMonth } = useSingleCalendarSelector(selectSingleMonths);
const { selectMonth } = useSingleCalendarActions();
```

## select\*Years

```ts
interface CalendarYears {
  years: readonly number[]; // 12-year page containing activeYear
  activeYear: number;
}
```

```tsx
const { years, activeYear } = useRangeCalendarSelector(selectRangeYears);
const { selectYear, prevYearPage, nextYearPage } = useRangeCalendarActions();
```

## select\*CanConfirm

```tsx
const canConfirm = useMultipleCalendarSelector(selectMultipleCanConfirm);

<Button onPress={confirm} disabled={!canConfirm} title="Done" />;
```

Recomputes when the selection state that gates `confirm()` changes.

## When to Write Your Own Selector

Built-ins cover the derived views the store already maintains. For everything else, pass an inline function:

```tsx
const isHijri = useSingleCalendarSelector((s) => s.system.id === 'hijri');
const cellCount = useSingleCalendarSelector((s) => s.days.cells.length);
```

Keep returns narrow so unrelated store updates don't re-render your component.
