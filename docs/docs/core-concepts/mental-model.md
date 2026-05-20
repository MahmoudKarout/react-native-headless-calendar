---
sidebar_position: 1
---

# Mental Model

`react-native-fast-calendar` is a **state primitive**, not a UI kit. Once you internalise the model below, any calendar UI is a thin layer of your own components on top of the same two hooks.

## One Provider Per Mode, Two Hooks, A Handful of Selectors

```
         ┌─────────────────────────────────────────────────────────┐
         │  SingleDateProvider  │  RangeDateProvider  │  Multiple… │
         │         each owns an external store (useSyncExternalStore) │
         └─────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    ▼                                ▼
           use*CalendarSelector(fn)          use*CalendarActions()
           read any snapshot slice            every mutator
           (re-renders when fn's              (subscription-free,
            return changes)                    stable identity)
                    │
     ┌──────────────┼───────────────┬────────────────┐
     ▼              ▼               ▼                ▼
select*Days   select*Months   select*Years   select*CanConfirm
day grid      month chooser   year pager     confirm gate
```

Replace `*` with `Single`, `Range`, or `Multiple` depending on which provider wraps your tree.

## What Lives Where

### The provider (`SingleDateProvider`, `RangeDateProvider`, or `MultipleDateProvider`)

Each provider:

- Creates exactly one store instance (lazily, on first mount).
- Syncs live props into `store.configure(...)` on every render via `useLayoutEffect`.
- Exposes the store through React context — nothing else.

Shared props (all three modes):

| Prop | Role |
| --- | --- |
| `systems` | Calendar adapters; defaults to `[gregorianSystem]`. |
| `activeSystemId` | Controlled active system id. |
| `minDate` / `maxDate` | Inclusive bounds. |
| `disabledDates` | Explicit list of disabled days. |
| `disabledRanges` | Inclusive disabled ranges. |
| `disabled` | Predicate on native `Date`. |
| `modifiers` | Named matchers → boolean flags on each cell. |
| `firstDayOfWeek` | `0` = Sunday … `6` = Saturday; **defaults to Monday (`1`)**. |
| `onChange` / `onConfirm` / `onClear` | Selection lifecycle callbacks. |

Mode-specific props are documented on [Providers](../hooks/providers).

The provider renders **only** `{children}` — no DOM, no RN views.

### `use*CalendarSelector(selector)`

The universal read primitive for that mode. Subscribe to any field on the snapshot, or pass a built-in selector:

```tsx
// Single mode
const days = useSingleCalendarSelector(selectSingleDays);
const selected = useSingleCalendarSelector((s) => s.selectedDate);

// Range mode
const start = useRangeCalendarSelector((s) => s.rangeStart);
const days = useRangeCalendarSelector(selectRangeDays);

// Multiple mode
const count = useMultipleCalendarSelector((s) => s.selectedDates.length);
```

Components re-render only when the selector's return value changes (`Object.is`).

### Built-in selectors

Pre-derived views maintained by the store. Pass them straight to the selector hook:

| Selector | Returns | Typical use |
| --- | --- | --- |
| `select*Days` | `{ weekdayLabels, cells, displayedMonthLabel, displayedYearLabel }` | Month grid |
| `select*Months` | `{ months, activeMonth }` | Month picker |
| `select*Years` | `{ years, activeYear }` | Year pager |
| `select*CanConfirm` | `boolean` | Enable "Done" button |

The `cells` array is **identity-stable**: unchanged cells keep the same object reference across commits. Wrap your day cell in `React.memo` for free skip-renders.

### `use*CalendarActions()`

Every mutator — `selectDate`, `goPrevMonth`, `confirm`, `clear`, `setActiveSystem`, … — on a single object that is **subscription-free** and **identity-stable** for the provider's lifetime.

```tsx
const { selectDate, confirm } = useSingleCalendarActions();
// safe in React.memo props, useEffect deps, and out-of-tree handlers
```

For reactive "can the user press Done?" UI, use `use*CalendarSelector(select*CanConfirm)`. For one-shot reads inside handlers, call `actions.isConfirmable()`.

## Re-render Boundaries

Tapping a day updates selection state and usually `displayed`, which recomputes `days.cells`. Components that only read `select*Months` or `select*Years` stay still unless the displayed month/year actually changed.

Navigation components that only call `use*CalendarActions()` **never** re-render on selection changes.

## Ranges that cross disabled days

Range mode only. Endpoints are always blocked when disabled; the question is what happens to **days between** start and end.

Set `disabledInRangeBehavior` on `RangeDateProvider`:

- **`reject`** (default) — refuse the second tap; keep `rangeStart` only.
- **`include`** — accept the range; interior disabled cells expose `isDisabled` + `inRange` for custom UI.
- **`exclude`** — clamp `rangeEnd` to the last selectable day before the first disabled interior day.

See [Providers — RangeDateProvider](../hooks/providers#disabled-days-inside-a-range) for examples and bootstrap behavior.

## Typical Layout

```tsx
<RangeDateProvider minRangeDays={2} maxRangeDays={14} disabledInRangeBehavior="reject">
  <MyHeader />   {/* useRangeCalendarSelector(selectRangeDays) */}
  <MyDayGrid />  {/* cells + useRangeCalendarActions().selectDate */}
  <MyFooter />   {/* useRangeCalendarActions().confirm / clear */}
</RangeDateProvider>
```

Split header, grid, and footer into separate components so each can subscribe only to what it needs.
