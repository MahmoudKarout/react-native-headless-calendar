---
sidebar_position: 5
---

# Selection Payloads

Each provider fires mode-specific payloads on `onChange` and `onConfirm`. Values are always native JS `Date` (and `DateParts`) regardless of the active calendar system.

## Single — `SingleSelectionPayload`

```ts
interface SingleSelectionPayload {
  date: Date | undefined;
  parts: DateParts | undefined; // { year, month, day } — month is 0-based
  systemId: string;
}
```

```tsx
<SingleDateProvider
  onConfirm={({ date, parts, systemId }) => {
    if (!date) return;
    saveBooking(date, parts!, systemId);
  }}
/>
```

## Range — `RangeSelectionPayload`

```ts
interface RangeSelectionPayload {
  startDate: Date | undefined;
  endDate: Date | undefined;
  startParts: DateParts | undefined;
  endParts: DateParts | undefined;
  systemId: string;
}
```

```tsx
<RangeDateProvider
  onConfirm={({ startDate, endDate, systemId }) => {
    if (!startDate || !endDate) return;
    bookHotel({ checkIn: startDate, checkOut: endDate, calendar: systemId });
  }}
/>
```

With `disabledInRangeBehavior="reject"` (default), a second tap that would cross a disabled interior day does **not** update the range and does **not** fire `onChange`. Use `disabledInRangeBehavior="include"` if you need a payload for spans that contain disabled days and gate confirm in your own UI.

## Multiple — `MultipleSelectionPayload`

```ts
interface MultipleSelectionPayload {
  dates: readonly Date[];
  parts: readonly DateParts[];
  systemId: string;
}
```

```tsx
<MultipleDateProvider onChange={({ dates }) => setPicked(dates)} />
```

## When Payloads Fire

| Event                                                             | `onChange` | `onConfirm` | `onClear` |
| ----------------------------------------------------------------- | ---------- | ----------- | --------- |
| `selectDate` (success)                                            | ✓          | —           | —         |
| `selectDate` (range rejected — disabled interior, default policy) | —          | —           | —         |
| `clear` (had selection)                                           | ✓          | —           | ✓         |
| `clear` (empty)                                                   | —          | —           | ✓         |
| `confirm()`                                                       | —          | ✓           | —         |

`confirm()` is a no-op when `onConfirm` was not passed to the provider.
