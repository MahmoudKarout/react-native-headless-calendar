---
sidebar_position: 2
---

# Calendar Systems

A **calendar system** is an adapter implementing `CalendarSystem<T>`. The store never inspects dates directly — every operation goes through the active system. That's how Hijri, Jalali, and any custom calendar plug in without the core knowing they exist.

## Built-in Systems

| Import path | Export | Peer dependency |
| --- | --- | --- |
| `react-native-fast-calendar` | `gregorianSystem`, `createGregorianSystem` | none |
| `react-native-fast-calendar/systems/hijri` | `hijriSystem` | `@tabby_ai/hijri-converter` |
| `react-native-fast-calendar/systems/jalali` | `jalaliSystem` | `moment-jalaali` |

If you omit `systems`, every provider defaults to `[gregorianSystem]`.

## Switching Systems

Pass an array of systems and control which one is active:

```tsx
import { SingleDateProvider } from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';

<SingleDateProvider
  systems={[gregorianSystem, hijriSystem]}
  activeSystemId="hijri"
>
  <MyCalendar />
</SingleDateProvider>
```

At runtime, call `setActiveSystem(id)` from `use*CalendarActions()`. Selection, bounds, and disabled lists are carried across systems by absolute instant (the day-of-month may change when switching calendars).

Read the active id inside your UI:

```tsx
const systemId = useSingleCalendarSelector((s) => s.system.id);
```

## Localising Gregorian

```tsx
const french = createGregorianSystem({
  label: 'Grégorien',
  monthLabels: ['Janvier', 'Février', /* … */],
  weekdayLabels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
});

<SingleDateProvider systems={[french]} />
```

## Implementing Your Own

See [Custom System](../systems/custom-system) for the full interface and a worked example. The surface is roughly twenty small functions — getters, navigation, comparison, label arrays, and round-tripping through native `Date`.
