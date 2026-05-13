---
sidebar_position: 5
---

# CalendarSelectionPayload

Shape passed to `onConfirm` when `useCalendarActions().confirm()` fires.

## Type

```ts
interface CalendarSelectionPayload {
  date?: Date;        // single mode
  startDate?: Date;   // range mode
  endDate?: Date;     // range mode
  dates?: Date[];     // multiple mode
  systemId: string;   // active calendar system id
}
```

Only the fields relevant to the active mode are populated. Every value is a native JS `Date` regardless of which calendar system is active — round-trip through `system.toNativeDate()` so consumers don't have to reach for system adapters in their callbacks.

## Usage

```tsx
<CalendarProvider
  mode="range"
  onConfirm={({ startDate, endDate, systemId }) => {
    if (!startDate || !endDate) return;
    bookHotel({ checkIn: startDate, checkOut: endDate, calendar: systemId });
  }}
>
  {/* ... */}
</CalendarProvider>
```
