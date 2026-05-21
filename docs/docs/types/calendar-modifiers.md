---
sidebar_position: 3
---

# CalendarModifiers

Named flags you attach to days for styling (dots, tints, badges). Modifiers are evaluated when the day grid is built and exposed on each cell as `cell.modifiers[name]`.

## Type

```ts
type CalendarModifiers = Readonly<Record<string, CalendarMatcher>>;
```

See [CalendarMatcher](./calendar-matcher) for matcher shapes.

## Usage

```tsx
<RangeDateProvider
  modifiers={{
    booked: [new Date(2024, 4, 7), new Date(2024, 4, 8)],
    holiday: [{ start: new Date(2024, 11, 24), end: new Date(2024, 11, 26) }],
    weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
  }}
>
  <Grid />
</RangeDateProvider>
```

Inside a cell:

```tsx
{
  cell.modifiers.booked && <View style={styles.bookedDot} />;
}
{
  cell.modifiers.weekend && <View style={styles.weekendBg} />;
}
```

## Performance

Modifier lists are identity-gated inside the store. Inline objects work — the provider stabilises them — but memoising large matcher arrays avoids unnecessary grid rebuilds:

```tsx
const modifiers = useMemo(
  () => ({ booked: bookedDates, weekend: isWeekend }),
  [bookedDates]
);
```
