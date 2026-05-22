---
sidebar_position: 1
title: Providers
description: SingleDateProvider, RangeDateProvider, and MultipleDateProvider — props, callbacks, and when to use each.
---

# Providers

Each selection mode has its own provider component. All three share the same bounds / disabled / modifier props and the same callback trio (`onChange`, `onConfirm`, `onClear`).

## Shared Props

These work on `SingleDateProvider`, `RangeDateProvider`, and `MultipleDateProvider`:

| Prop             | Type                            | Description                                                      |
| ---------------- | ------------------------------- | ---------------------------------------------------------------- |
| `systems`        | `readonly CalendarSystem[]`     | Defaults to `[gregorianSystem]`.                                 |
| `activeSystemId` | `string`                        | Controlled active system. Unknown ids fall back to `systems[0]`. |
| `minDate`        | `unknown`                       | Earliest selectable day (inclusive).                             |
| `maxDate`        | `unknown`                       | Latest selectable day (inclusive).                               |
| `disabledDates`  | `readonly unknown[]`            | Individual disabled days.                                        |
| `disabledRanges` | `readonly { start, end }[]`     | Inclusive disabled ranges.                                       |
| `disabled`       | `(nativeDate: Date) => boolean` | Dynamic disable predicate.                                       |
| `modifiers`      | `CalendarModifiers`             | Named matchers → `cell.modifiers[name]`.                         |
| `firstDayOfWeek` | `0 \| 1 \| … \| 6`              | First column of the grid. **Default: `1` (Monday).**             |
| `onChange`       | mode-specific payload           | Fires after every successful `selectDate` or `clear`.            |
| `onConfirm`      | mode-specific payload           | Fires when `confirm()` is called.                                |
| `onClear`        | `() => void`                    | Fires when `clear()` is called.                                  |

Date inputs (`minDate`, `initialDate`, …) accept anything your active system's `from()` understands — native `Date`, ISO strings, or the system's native value.

## SingleDateProvider

```tsx
<SingleDateProvider
  initialDate={new Date()}
  onConfirm={({ date, parts, systemId }) => {}}
>
  {children}
</SingleDateProvider>
```

| Prop          | Description                                      |
| ------------- | ------------------------------------------------ |
| `initialDate` | Pre-selects a date and sets the displayed month. |

**Payload** (`SingleSelectionPayload`):

```ts
{ gregorianDate?: Date; systemId: string; system?: { year, month, day } }
```

Hooks: `useSingleCalendarSelector`, `useSingleCalendarActions`, `selectSingleDays`, `selectSingleMonths`, `selectSingleYears`, `selectSingleCanConfirm`.

## RangeDateProvider

```tsx
<RangeDateProvider
  initialStart={new Date()}
  initialEnd={undefined}
  allowSameDay={false}
  minRangeDays={2}
  maxRangeDays={14}
  disabledInRangeBehavior="reject"
  onConfirm={({ gregorianStartDate, gregorianEndDate, system, systemId }) => {}}
>
  {children}
</RangeDateProvider>
```

| Prop                      | Default    | Description                                                                               |
| ------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `initialStart`            | —          | First range endpoint.                                                                     |
| `initialEnd`              | —          | Second endpoint (optional).                                                               |
| `allowSameDay`            | `false`    | Allow start === end as a one-day range.                                                   |
| `minRangeDays`            | —          | Minimum inclusive span (in days).                                                         |
| `maxRangeDays`            | —          | Maximum inclusive span (in days).                                                         |
| `disabledInRangeBehavior` | `'reject'` | What to do when a range would include disabled days **between** start and end. See below. |

### Disabled days inside a range

Disabled rules (`disabledDates`, `disabledRanges`, `disabled`, bounds) always block **endpoints** — you cannot tap a disabled day as start or end.

When the user picks a second endpoint that would span one or more disabled days in the **interior**, `disabledInRangeBehavior` controls the outcome:

| Value       | Behavior                                                                                                                                                                                                             | Typical use                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `'reject'`  | The second tap is ignored. `rangeStart` stays set; `rangeEnd` stays `undefined`. No `onChange`.                                                                                                                      | Hotel booking — unavailable nights must not appear in the stay.                    |
| `'include'` | The full range is stored. Interior cells keep `isDisabled: true` and `inRange: true` so your UI can strike them through or show a warning. `selectRangeCanConfirm` still returns `true`.                             | Analytics / filters where you want the span visible even if some days are blocked. |
| `'exclude'` | `rangeEnd` is clamped to the day **before** the first disabled interior day (largest clean range on the start side). If that would be a same-day range and `allowSameDay` is `false`, `rangeEnd` is dropped instead. | “Pick as much as you can” flows without rejecting the tap entirely.                |

**Example:** start = Aug 1, disabled = Aug 5, user taps Aug 10.

```tsx
// reject (default) — range stays start-only
<RangeDateProvider disabledDates={[aug5]} disabledInRangeBehavior="reject" />

// include — Aug 1–10; Aug 5 cell: isDisabled && inRange
<RangeDateProvider disabledDates={[aug5]} disabledInRangeBehavior="include" />

// exclude — range becomes Aug 1–4
<RangeDateProvider disabledDates={[aug5]} disabledInRangeBehavior="exclude" />
```

**Initial props:** `initialStart` and `initialEnd` go through the same policy at bootstrap. If `'reject'` would apply, the store keeps `initialStart` and drops `initialEnd` (same as a refused second tap). Inverted seeds (`initialEnd` before `initialStart`) are ordered before validation.

**Length rules:** After the policy runs, `minRangeDays` / `maxRangeDays` still apply. A clamped range that is too short or too long is rejected the same as any other invalid span.

Exported type: `DisabledInRangeBehavior` from `react-native-headless-calendar`.

**Payload** (`RangeSelectionPayload`):

```ts
{
  gregorianStartDate?: Date;
  gregorianEndDate?: Date;
  systemId: string;
  system: {
    start?: DateParts;
    end?: DateParts;
  };
}
```

Hooks: `useRangeCalendarSelector`, `useRangeCalendarActions`, `selectRangeDays`, …

## MultipleDateProvider

```tsx
<MultipleDateProvider
  initialDates={[new Date()]}
  maxSelected={5}
  onConfirm={({ gregorianDates, system, systemId }) => {}}
>
  {children}
</MultipleDateProvider>
```

| Prop           | Description                                                |
| -------------- | ---------------------------------------------------------- |
| `initialDates` | Pre-selected dates; first entry seeds the displayed month. |
| `maxSelected`  | Cap on how many dates can be selected.                     |

**Payload** (`MultipleSelectionPayload`):

```ts
{ gregorianDates: readonly Date[]; systemId: string; system: readonly DateParts[] }
```

Hooks: `useMultipleCalendarSelector`, `useMultipleCalendarActions`, `selectMultipleDays`, …

## Live Prop Updates

Providers call `store.configure(...)` on every render (via `useLayoutEffect`). Inline callbacks and arrays are stabilised internally so you can write:

```tsx
onConfirm={({ gregorianDate }) => setPicked(gregorianDate)}
systems={[gregorianSystem]}
modifiers={{ booked: [someDate] }}
```

without unnecessary store churn — though memoising heavy `modifiers` objects still helps.

## Errors

Hooks throw when used outside their provider:

```
[Calendar] single-mode hooks must be used within <SingleDateProvider>
[Calendar] range-mode hooks must be used within <RangeDateProvider>
[Calendar] multiple-mode hooks must be used within <MultipleDateProvider>
```
