---
sidebar_position: 2
---

# Calendar Systems

A **calendar system** is an adapter implementing `CalendarSystem<T>`. The store never inspects dates directly — every operation goes through the active system. That's how Hijri, Jalali, and any custom calendar plug in without the core knowing they exist.

## Built-in Systems

| Module | Adapter | Peer dependency |
| --- | --- | --- |
| `react-native-fast-calendar` | `gregorianSystem` | none |
| `react-native-fast-calendar/systems/gregorian` | `gregorianSystem`, `createGregorianSystem({ locale })` | none |
| `react-native-fast-calendar/systems/hijri` | `hijriSystem` | `@tabby_ai/hijri-converter` |
| `react-native-fast-calendar/systems/jalali` | `jalaliSystem` | `moment-jalaali` |

The default `<CalendarProvider>` uses `gregorianSystem` — you don't need to import anything extra to render a calendar.

## Switching Systems

Pass an array of systems and pick which one is active:

```tsx
import { CalendarProvider } from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';

<CalendarProvider
  systems={[gregorianSystem, hijriSystem]}
  initialSystemId="hijri"
  mode="single"
>
  <MyCalendar />
</CalendarProvider>
```

To swap systems at runtime, change the provider's `key` together with `initialSystemId`, or change which system sits first in `systems`. Use `useCalendarSelector((s) => s.system.id)` to read the active system inside your UI.

## Implementing Your Own

See [systems/custom-system](../systems/custom-system) for the full interface and a worked example. The minimum surface is roughly 25 small functions — getters, navigation, comparison, label arrays, and round-tripping through native `Date`.
