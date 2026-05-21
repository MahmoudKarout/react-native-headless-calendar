---
sidebar_position: 2
title: use*CalendarSelector
---

# use\*CalendarSelector

Subscribe to any slice of the store snapshot with granular re-renders. Each selection mode has its own hook — use the one that matches your provider.

| Provider               | Hook                          |
| ---------------------- | ----------------------------- |
| `SingleDateProvider`   | `useSingleCalendarSelector`   |
| `RangeDateProvider`    | `useRangeCalendarSelector`    |
| `MultipleDateProvider` | `useMultipleCalendarSelector` |

## Signature

```ts
function useSingleCalendarSelector<T>(
  selector: (snapshot: SingleCalendarSnapshot) => T
): T;

// Range and Multiple follow the same shape with their snapshot types.
```

The component re-renders only when the selector's return value changes (`Object.is`).

## Common Reads

```tsx
// Single
const selected = useSingleCalendarSelector((s) => s.selectedDate);
const days = useSingleCalendarSelector(selectSingleDays);

// Range
const start = useRangeCalendarSelector((s) => s.rangeStart);
const end = useRangeCalendarSelector((s) => s.rangeEnd);

// Multiple
const dates = useMultipleCalendarSelector((s) => s.selectedDates);
const atCap = useMultipleCalendarSelector(
  (s) => s.maxSelected !== undefined && s.selectedDates.length >= s.maxSelected!
);
```

Always prefer **primitive** or **stable** returns. Selecting `s.system` re-renders on every commit even when the active system didn't change — prefer `s.system.id`.

## Snapshot Highlights

All modes share:

```ts
system: CalendarSystem;
systemIndex: number;
displayed: CalendarDateValue;
view: 'day' | 'month' | 'year';
minDate / maxDate / disabledDates / disabledRanges / disabled;
firstDayOfWeek: Weekday;
modifiers?: CalendarModifiers;
days: /* mode-specific cell type */;
months: CalendarMonths;
years: CalendarYears;
```

Mode-specific fields:

| Mode     | Extra fields                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------- |
| Single   | `selectedDate`                                                                                      |
| Range    | `rangeStart`, `rangeEnd`, `allowSameDay`, `minRangeDays`, `maxRangeDays`, `disabledInRangeBehavior` |
| Multiple | `selectedDates`, `maxSelected`                                                                      |

The `days` view is also available as `s.days` when you need a custom selector:

```tsx
const labels = useSingleCalendarSelector((s) => s.days.weekdayLabels);
const cells = useSingleCalendarSelector((s) => s.days.cells);
```

## Building Custom Hooks

```tsx
function useRangeLengthDays() {
  return useRangeCalendarSelector((s) => {
    if (!s.rangeStart || !s.rangeEnd) return null;
    const a = s.system.toNativeDate(s.rangeStart);
    const b = s.system.toNativeDate(s.rangeEnd);
    return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
  });
}
```

## Errors

```
[Calendar] single-mode hooks must be used within <SingleDateProvider>
```

(Similar messages for range and multiple.)
