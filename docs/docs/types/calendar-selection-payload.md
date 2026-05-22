---
sidebar_position: 5
---

# Selection Payloads

Each provider fires mode-specific payloads on `onChange` and `onConfirm`. The Gregorian fields are always native JS `Date` values anchored at **UTC midnight** of the selected day, so `JSON.stringify` / `toISOString` round-trip cleanly regardless of the user's timezone. The `system` field carries the same selection expressed in the active calendar system.

## Single — `SingleSelectionPayload`

```ts
interface SingleSelectionPayload {
  gregorianDate: Date | undefined;
  systemId: string;
  system: DateParts | undefined; // { year, month, day } — month is 0-based
}
```

```tsx
<SingleDateProvider
  onConfirm={({ gregorianDate, system, systemId }) => {
    if (!gregorianDate || !system) return;
    saveBooking(gregorianDate, system, systemId);
  }}
/>
```

## Range — `RangeSelectionPayload`

```ts
interface RangeSelectionPayload {
  gregorianStartDate: Date | undefined;
  gregorianEndDate: Date | undefined;
  systemId: string;
  system: {
    start: DateParts | undefined;
    end: DateParts | undefined;
  };
}
```

```tsx
<RangeDateProvider
  onConfirm={({ gregorianStartDate, gregorianEndDate, systemId }) => {
    if (!gregorianStartDate || !gregorianEndDate) return;
    bookHotel({
      checkIn: gregorianStartDate,
      checkOut: gregorianEndDate,
      calendar: systemId,
    });
  }}
/>
```

With `disabledInRangeBehavior="reject"` (default), a second tap that would cross a disabled interior day does **not** update the range and does **not** fire `onChange`. Use `disabledInRangeBehavior="include"` if you need a payload for spans that contain disabled days and gate confirm in your own UI.

## Multiple — `MultipleSelectionPayload`

```ts
interface MultipleSelectionPayload {
  gregorianDates: readonly Date[];
  systemId: string;
  system: readonly DateParts[]; // aligned with `gregorianDates` by index
}
```

```tsx
<MultipleDateProvider
  onChange={({ gregorianDates }) => setPicked(gregorianDates)}
/>
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
