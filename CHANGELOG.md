# Changelog

All notable changes to `react-native-headless-calendar` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-05-22

### ⚠️ Breaking changes

The shape of every `onChange` / `onConfirm` payload has changed. The new shape clearly separates the **always-Gregorian** `Date` from the selection expressed in the **active calendar system**, and the Gregorian `Date` is now anchored at **UTC midnight** so it serializes correctly across timezones.

#### Single

```diff
- { date, parts, systemId }
+ { gregorianDate, systemId, system }   // system: DateParts | undefined
```

#### Range

```diff
- { startDate, endDate, startParts, endParts, systemId }
+ { gregorianStartDate, gregorianEndDate, systemId, system: { start, end } }
```

#### Multiple

```diff
- { dates, parts, systemId }
+ { gregorianDates, systemId, system }   // system: readonly DateParts[]
```

### Migration

```diff
- onConfirm={({ date, parts }) => save(date, parts)}
+ onConfirm={({ gregorianDate, system }) => save(gregorianDate, system)}
```

```diff
- onConfirm={({ startDate, endDate }) => book({ in: startDate, out: endDate })}
+ onConfirm={({ gregorianStartDate, gregorianEndDate }) =>
+   book({ in: gregorianStartDate, out: gregorianEndDate })
+ }
```

```diff
- onConfirm={({ startParts, endParts }) => ...}
+ onConfirm={({ system: { start, end } }) => ...}
```

### Fixed

- **Timezone-correct payload dates.** Previously, selecting May 12 in UTC+3 produced `2026-05-11T21:00:00.000Z` when serialized — the `Date` was local-midnight, so `toISOString()` shifted backward. Payload dates are now built at UTC midnight of the selected calendar day, so `JSON.stringify` / `toISOString()` always match the day the user picked.

### Why the new names?

- `gregorianDate` makes it explicit that the `Date` is always Gregorian, regardless of the active system (Jalali, Hijri, custom). Safe to store, send to a server, or pass to `date-fns` / `Intl`.
- `system` carries the selection in the _active_ calendar (e.g. `{ year: 1403, month: 0, day: 1 }` in Jalali). Reuses the existing `DateParts` type — no new public types added.
- Grouping `start` / `end` under a single `system` object makes range payloads cleaner than four parallel top-level fields.

### Docs

- `docs/types/calendar-selection-payload.md` rewritten for the new shape.
- `docs/hooks/providers.md` and `README.md` examples updated.

### Tests

- All 114 store tests updated and passing.

## [0.1.0] — Initial release

- Headless calendar primitives for React Native: `SingleDateProvider`, `RangeDateProvider`, `MultipleDateProvider`.
- Gregorian, Jalali, and Hijri calendar systems with a pluggable `CalendarSystem<T>` interface.
- Disabled-day matchers, range policies (`reject` / `include` / `exclude`), and modifiers.
- Selector hooks (`useSingleCalendarSelector`, `useRangeCalendarSelector`, …) plus grid utilities (`buildMonthGrid`, `getYearPage`, …).

[0.2.0]: https://github.com/MahmoudKarout/react-native-headless-calendar/releases/tag/v0.2.0
[0.1.0]: https://github.com/MahmoudKarout/react-native-headless-calendar/releases/tag/v0.1.0
