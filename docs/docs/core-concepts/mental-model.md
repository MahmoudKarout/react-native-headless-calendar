---
sidebar_position: 1
---

# Mental Model

`react-native-fast-calendar` is a **state primitive**, not a UI kit. Once you internalise the model below, every recipe in this docset is just a thin layer of your own components on top of the same two hooks.

## One Provider, Two Hooks, A Handful of Selectors

```
                    ┌────────────────────────────────────────────┐
                    │            <CalendarProvider>              │
                    │   owns the store + per-render config       │
                    └────────────────────────────────────────────┘
                                       │
                       ┌───────────────┴────────────────┐
                       ▼                                ▼
              useCalendarSelector(fn)         useCalendarActions()
              arbitrary slices of the         every mutator
              store snapshot                  (subscription-free)
                       │
        ┌──────────────┼───────────────┬────────────────┐
        ▼              ▼               ▼                ▼
   selectDays    selectMonths    selectYears    selectCanConfirm
   day grid      12-cell month   paginated      confirm gate
   data          chooser data    years data
```

## What Lives Where

### `<CalendarProvider>`

Holds:

- The active `CalendarSystem` (defaults to Gregorian).
- The selection mode (`single`, `range`, `multiple`).
- All declarative inputs: `minDate`, `maxDate`, `disabled`, `disabledDates`, `disabledRanges`, `modifiers`, `minRangeDays`, `maxRangeDays`, `maxSelected`, `allowSameDay`, `firstDayOfWeek`, `initialDate / initialStart / initialEnd / initialDates`.
- External callbacks: `onChange`, `onConfirm`, `onClear`.

The provider renders nothing. It is just the boundary every hook reads from.

### `useCalendarSelector(selector)`

The universal read primitive. Subscribe to any field of `CalendarSnapshot`, or one of the pre-built selectors, with granular memoisation:

```tsx
const rangeStart = useCalendarSelector((s) => s.rangeStart);
const systemId   = useCalendarSelector((s) => s.system.id);
const days       = useCalendarSelector(selectDays);
const months     = useCalendarSelector(selectMonths);
const years      = useCalendarSelector(selectYears);
const canConfirm = useCalendarSelector(selectCanConfirm);
```

Components only re-render when the selector's return value actually changes (`Object.is`).

### Pre-built selectors

The snapshot ships with derived views that the store maintains for you. Pass them straight to `useCalendarSelector`:

| Selector | Returns | Re-renders on |
| --- | --- | --- |
| `selectDays` | `{ weekdayLabels, cells, displayedMonthLabel, displayedYearLabel }` | day-grid slices (selection, displayed month, bounds, modifiers) |
| `selectMonths` | `{ months, activeMonth }` | system or displayed-month changes |
| `selectYears` | `{ years, activeYear }` | displayed-year changes |
| `selectCanConfirm` | `boolean` | the slices that gate confirm |

`selectDays` reads from the snapshot's pre-derived `days` view: the cell array is identity-stable across commits that don't touch the day grid, and individual cells keep their reference when their state is unchanged. Wrap your `DayCell` in `React.memo` and you get free skip-renders.

### `useCalendarActions()`

Every mutator (`selectDate`, `goPrevMonth`, `confirm`, `clear`, `selectMonth`, `selectYear`, `prevYearPage`, `nextYearPage`, …). Subscription-free, identity-stable for the lifetime of the provider — safe in `useEffect` deps and `React.memo` props.

`confirm()` fires the provider's `onConfirm` with a `CalendarSelectionPayload`. `clear()` wipes selection state and fires `onClear`. For the render-time "is the current selection committable?" gate, read `useCalendarSelector(selectCanConfirm)`.

## Re-render Boundaries

Each selector subscribes only to the slices it needs. Tapping a day:

- updates `selectedDate` / `rangeStart` / `rangeEnd` / `selectedDates` and `displayed`,
- which causes `selectDays` to return a new value (recomputed `cells`),
- but `selectMonths` / `selectYears` only return a new value if `displayed`'s month / year actually changed — components reading them stay still.

That's how the perf demo's per-cell counters stay frozen at `1×` for cells that didn't change state.

## A Recipe is Just Provider + Hooks + JSX

```tsx
<CalendarProvider mode="range" minRangeDays={2} maxRangeDays={14}>
  <MyHeader />     {/* useCalendarSelector(selectDays) for month/year labels + nav */}
  <MyDayGrid />    {/* useCalendarSelector(selectDays) for cells */}
  <MyFooter />     {/* useCalendarActions for confirm/clear */}
</CalendarProvider>
```

Every recipe in this docset is a variant of that template.
