---
sidebar_position: 5
---

# useCalendarSelector

`useCalendarSelector` is the escape hatch. Subscribe to any slice of the underlying `CalendarSnapshot` with granular re-renders.

## Signature

```ts
function useCalendarSelector<T>(
  selector: (snapshot: CalendarSnapshot) => T
): T;
```

The component re-renders only when the selector's return value changes (`Object.is`).

## CalendarSnapshot Highlights

```ts
interface CalendarSnapshot {
  system: CalendarSystem;
  systemIndex: number;
  mode: 'single' | 'range' | 'multiple';
  displayed: CalendarDateValue;
  view: 'day' | 'month' | 'year';

  selectedDate: CalendarDateValue | undefined;
  rangeStart: CalendarDateValue | undefined;
  rangeEnd: CalendarDateValue | undefined;
  selectedDates: readonly CalendarDateValue[];

  minDate: CalendarDateValue | undefined;
  maxDate: CalendarDateValue | undefined;
  disabledDates: readonly CalendarDateValue[] | undefined;
  disabledRanges:
    | readonly { start: CalendarDateValue; end: CalendarDateValue }[]
    | undefined;
  disabled: ((nativeDate: Date) => boolean) | undefined;

  allowSameDay: boolean;
  minRangeDays: number | undefined;
  maxRangeDays: number | undefined;
  maxSelected: number | undefined;
}
```

## Common Selectors

```tsx
const systemId   = useCalendarSelector((s) => s.system.id);
const rangeStart = useCalendarSelector((s) => s.rangeStart);
const rangeEnd   = useCalendarSelector((s) => s.rangeEnd);
const count      = useCalendarSelector((s) => s.selectedDates.length);
const yyyy       = useCalendarSelector((s) => s.system.year(s.displayed));
```

Always prefer primitive returns. Selecting `s.system` will re-render every time the store commits, even when the active system didn't change.

## Building Custom Hooks

```tsx
function useRangeLengthDays(): number | null {
  return useCalendarSelector((s) => {
    if (s.mode !== 'range' || !s.rangeStart || !s.rangeEnd) return null;
    const a = s.system.toNativeDate(s.rangeStart);
    const b = s.system.toNativeDate(s.rangeEnd);
    return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
  });
}
```

## Errors

Throws if used outside `<CalendarProvider>`:

```
Error: [Calendar] hooks must be used within <CalendarProvider>
```
