---
sidebar_position: 4
---

# Bounded Selection

Combine `minDate`, `maxDate`, `disabledDates`, `disabledRanges`, and a `disabled` predicate. They compose with **OR** semantics — if any matches, the cell is disabled and `selectDate` is a no-op.

import CalendarDemo from '@site/src/components/CalendarDemo';

<CalendarDemo mode="single" />

## Implementation

```tsx
import { CalendarProvider } from 'react-native-fast-calendar';

const today = new Date();
const threeMonthsOut = new Date(today);
threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3);

const disabledRanges = [
  {
    start: new Date(today.getFullYear(), today.getMonth(), 10),
    end:   new Date(today.getFullYear(), today.getMonth(), 14),
  },
];

export default function Screen() {
  return (
    <CalendarProvider
      mode="single"
      minDate={today}
      maxDate={threeMonthsOut}
      disabledRanges={disabledRanges}
      disabled={(d) => d.getDay() === 0}
    >
      {/* render days — `cell.isDisabled` reflects the OR of every input */}
    </CalendarProvider>
  );
}
```

## Behaviour

| Input | Effect |
| --- | --- |
| `minDate` | Cells before this day are disabled. |
| `maxDate` | Cells after this day are disabled. |
| `disabledDates` | Each entry disables that exact calendar day. |
| `disabledRanges` | Each `{ start, end }` disables an inclusive range. |
| `disabled(d)` | Predicate against the **native** JS date. Errors are caught — buggy predicates can't crash the calendar. |

The disabled state is precomputed in `useCalendarDays()` and surfaced as `cell.isDisabled` for styling.
