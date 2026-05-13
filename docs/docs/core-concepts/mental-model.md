---
sidebar_position: 1
---

# Mental Model

`react-native-fast-calendar` is a **state primitive**, not a UI kit. Once you internalise the model below, every recipe in this docset is just a thin layer of your own components on top of the same five hooks.

## One Provider, Five Hooks

```
                    ┌────────────────────────────────────────────┐
                    │            <CalendarProvider>              │
                    │   owns the store + per-render config       │
                    └────────────────────────────────────────────┘
                                       │
        ┌──────────────┬───────────────┼─────────────────┬────────────────┐
        ▼              ▼               ▼                 ▼                ▼
useCalendarDays  useCalendarMonths  useCalendarYears  useCalendarActions  useCalendarSelector
   day grid       12-cell month       paginated years   confirm/clear/    arbitrary slices
   navigation     chooser             chooser           canConfirm        of the store
```

## What Lives Where

### `<CalendarProvider>`

Holds:

- The active `CalendarSystem` (defaults to Gregorian).
- The selection mode (`single`, `range`, `multiple`).
- All declarative inputs: `minDate`, `maxDate`, `disabled`, `disabledDates`, `disabledRanges`, `modifiers`, `minRangeDays`, `maxRangeDays`, `maxSelected`, `allowSameDay`, `firstDayOfWeek`, `initialDate / initialStart / initialEnd / initialDates`.
- External callbacks: `onConfirm`, `onClear`, `onSelectHaptic`.

The provider renders nothing. It is just the boundary every hook reads from.

### `useCalendarDays()`

Everything you need to render a month grid:

| Field | Description |
| --- | --- |
| `weekdayLabels` | 7 labels rotated to `firstDayOfWeek`. |
| `cells` | `ROWS × COLS` `DayCellInfo` objects (current-month + outside-month, with `isSelected`, `inRange`, `isToday`, `isDisabled`, `modifiers`). |
| `displayedMonthLabel` / `displayedYearLabel` | Strings for the current header. |
| `goPrevMonth` / `goNextMonth` | Step the displayed month. |
| `setDisplayedDate(date)` | Jump to an arbitrary month. |
| `selectDate(date)` | Tap a day — the store decides whether it's a single pick, range endpoint, or multi toggle. |

### `useCalendarMonths()` / `useCalendarYears()`

Drive your month-picker / year-picker UIs. They expose `months` / `years`, the `activeMonth` / `activeYear`, and a `selectMonth` / `selectYear` action. `useCalendarYears` also exposes `goPrevPage` / `goNextPage` so you can paginate `YEAR_PAGE_SIZE` years at a time.

### `useCalendarActions()`

`confirm()` fires the provider's `onConfirm` with a `CalendarSelectionPayload`. `clear()` wipes selection state and fires `onClear`. `canConfirm` flips based on the active mode.

### `useCalendarSelector(selector)`

The escape hatch. Subscribe to any field of `CalendarSnapshot` with granular memoisation:

```tsx
const rangeStart = useCalendarSelector((s) => s.rangeStart);
const systemId = useCalendarSelector((s) => s.system.id);
```

Components only re-render when the selector's return value actually changes (`Object.is`).

## Re-render Boundaries

Each hook subscribes only to the slices it needs. Tapping a day:

- updates `selectedDate` / `rangeStart` / `rangeEnd` / `selectedDates` and `displayed`,
- which causes `useCalendarDays` to recompute `cells`,
- but the month and year picker pieces (subscribed via `useCalendarMonths` / `useCalendarYears`) only see a re-render if `displayed`'s month / year actually changed.

That's how the perf demo's per-cell counters stay frozen at `1×` for cells that didn't change state.

## A Recipe is Just Provider + Hooks + JSX

```tsx
<CalendarProvider mode="range" minRangeDays={2} maxRangeDays={14}>
  <MyHeader />     {/* useCalendarDays for month/year labels + nav */}
  <MyDayGrid />    {/* useCalendarDays for cells */}
  <MyFooter />     {/* useCalendarActions for confirm/clear */}
</CalendarProvider>
```

Every recipe in this docset is a variant of that template.
