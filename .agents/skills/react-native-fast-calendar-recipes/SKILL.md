---
name: react-native-fast-calendar-recipes
description: |
  Build calendar features in React Native apps using the react-native-fast-calendar library. Covers all eleven recipes shipped in the library's example app: single-date pickers, date-range pickers (minRangeDays / maxRangeDays / allowSameDay), multi-select with modifiers (booked / holiday / weekend dots), bounded selection (minDate / maxDate / disabledDates / disabledRanges / disabled predicate), multi-month side-by-side grids with ISO week numbers, multi-calendar-system pickers (Gregorian + Hijri / Persian / etc.), custom component slots (DayCell, WeekdayHeader, WeekdayCell, WeekNumberCell, MonthCaption), localised labels via createGregorianSystem, per-day image cells via renderDay, bottom-sheet date pickers using @gorhom/bottom-sheet, and iOS-Calendar-style infinite vertical month lists using @shopify/flash-list. Use this skill whenever the user asks for a calendar, date picker, range picker, booking calendar, scheduling UI, monthly grid, vertical scrolling calendar, custom day cell, holiday markers, blackout dates, modal date picker, multi-system or Hijri calendar, or any usage of <Calendar.Root>, <Calendar.DayGrid>, SimpleCalendar, or the useCalendar* hooks — even when the user does not name the library directly. Reach for this skill instead of writing fast-calendar UI from scratch.
---

# react-native-fast-calendar — Recipe Pack

You are wiring a calendar UI into a React Native app that depends on `react-native-fast-calendar`. This file is the index plus the rules that hold across every recipe. Each individual recipe lives in `references/` so you only read what you need.

## TL;DR — the mental model

`react-native-fast-calendar` is **headless by design** with one batteries-included escape hatch.

- `<Calendar.Root>` owns the store (selection, displayed month, system, view, theme, labels, modifiers, bounds). It renders nothing visible by itself.
- `<Calendar.DayGrid>` is the only built-in visual: a 7-column day grid for the currently displayed month.
- Every other piece — header, footer, month picker, year picker, system switcher, vertical month list — is consumer code that talks to the store via `useCalendar*` hooks.
- `<SimpleCalendar>` is a one-line "header + grid + footer" component for the 80% case. Reach for it when the user wants a calendar quickly and isn't asking for custom UI.

The library has **zero calendar-system dependencies in the core**. Gregorian is built in. Hijri (`react-native-fast-calendar/systems/hijri`) and Jalali (`react-native-fast-calendar/systems/jalali`) ship pre-configured — install the matching optional peer dep (`@tabby_ai/hijri-converter` / `moment-jalaali`) and import the ready-made `hijriSystem` / `jalaliSystem`. Anything else (Chinese, Ethiopian, …) you BYO via the `CalendarSystem<T>` interface.

## Which recipe?

Pick the smallest match. If two fit, pick the lower row.

| User asks for… | Recipe | Reference |
|---|---|---|
| "I just need a date picker, nothing fancy" | `SimpleCalendar` | [`references/api-cheatsheet.md`](references/api-cheatsheet.md) |
| Single date with a custom header / footer | Single | [`references/grid-recipes.md`](references/grid-recipes.md) §1 |
| Hotel / flight / booking range, "X to Y nights" | Range | [`references/grid-recipes.md`](references/grid-recipes.md) §2 |
| Pick several dates, with availability dots | Multi + modifiers | [`references/grid-recipes.md`](references/grid-recipes.md) §3 |
| min/max future, blackout days, weekends off | Bounded | [`references/grid-recipes.md`](references/grid-recipes.md) §4 |
| Two months side by side, ISO week numbers | Multi-month | [`references/grid-recipes.md`](references/grid-recipes.md) §5 |
| Switchable Gregorian + Hijri / Persian / Chinese | Multi-system | [`references/grid-recipes.md`](references/grid-recipes.md) §6 |
| Replace day cell / weekday row / week number | Custom slots | [`references/grid-recipes.md`](references/grid-recipes.md) §7 |
| French / Arabic / any language labels | Localised | [`references/grid-recipes.md`](references/grid-recipes.md) §8 |
| Image / icon / photo on specific days | Image cells | [`references/grid-recipes.md`](references/grid-recipes.md) §9 |
| Modal date picker that slides up | Bottom sheet | [`references/bottom-sheet.md`](references/bottom-sheet.md) |
| iOS Calendar-style endless vertical list | Vertical list | [`references/vertical-list.md`](references/vertical-list.md) |

The recipes **compose**. A "vertical Hijri range picker with image cells" is the vertical-list recipe with `mode="range"`, the Hijri system added, and `renderDay` set to your image cell — read all three reference files for their respective slices.

## Universal scaffold

Every non-`SimpleCalendar` recipe is the same four layers, in order:

```tsx
import { Calendar } from 'react-native-fast-calendar';

<Calendar.Root
  mode="single"                       // 'single' | 'range' | 'multiple'
  systems={[gregorianSystem]}         // optional, defaults to Gregorian
  theme={MY_THEME}                    // CalendarThemeOverride — partial
  // …recipe-specific props (minDate, modifiers, components, …)
  onConfirm={(payload) => commit(payload)}
>
  {/* L1 — Optional header (chevrons, month/year labels).         */}
  {/*       Hooks: useCalendarHeader / useCalendarNavigation.     */}
  <MyHeader />

  {/* L2 — Either the grid OR a switch between grid/month/year.  */}
  {/*       <Calendar.DayGrid> renders the active month.          */}
  <MyView />

  {/* L3 — Optional readout (selected date / range / tag list).   */}
  {/*       Hooks: useCalendarSelector / useCalendarSelectedDates.*/}
  <MyReadout />

  {/* L4 — Optional action bar (clear / confirm).                 */}
  {/*       Hooks: useCalendarActions + useCalendarLabels.        */}
  <MyActionBar />
</Calendar.Root>
```

The L2 "grid OR pickers" branching is only needed when your header taps month/year labels to open a picker:

```tsx
function MyView() {
  const view = useCalendarSelector((s) => s.view); // 'day' | 'month' | 'year'
  if (view === 'month') return <MyMonthPicker />;  // useCalendarMonthPicker
  if (view === 'year')  return <MyYearPicker />;   // useCalendarYearPicker
  return <Calendar.DayGrid swipeable />;
}
```

Bottom-sheet pickers, vertical lists, and most "set and forget" calendars skip the picker views entirely.

## Universal rules

These hold for every recipe. Read them once before touching reference files.

1. **The library is headless. Build UI yourself with hooks.** The package ships only `<Calendar.Root>`, `<Calendar.DayGrid>`, `<SimpleCalendar>`, and `<DayCell>` (low-level memoised cell). Headers, footers, pickers, switchers, vertical lists — all consumer code. Don't invent props that don't exist; reach for a `useCalendar*` hook instead. The full hook list is in [`references/api-cheatsheet.md`](references/api-cheatsheet.md).
2. **Import types alongside values.** TypeScript users almost always need `type DayCellInfo`, `type CalendarSystem`, `type CalendarThemeOverride`, `type CalendarComponents`, `type DayRenderer`, plus mode-specific payload types. They make the recipes copy-paste-safe.
3. **Themes are partial overrides, not full themes.** Pass `CalendarThemeOverride` (every field is optional). The library merges with `defaultTheme` (or `darkTheme`). Themes propagate to the grid, the default `<DayCell>`, and any `useCalendarTheme()` consumer.
4. **`renderDay` > `components.DayCell` > the default `<DayCell>`.** Use `renderDay` (a prop on `<Calendar.DayGrid>`) when *this specific calendar instance* needs a different cell — e.g. image cells in a single screen. Use `components.DayCell` (on `<Calendar.Root>`) when *every day cell in this calendar* should look different — design-system level. Don't write both.
5. **Selection writes go through the store.** Custom day cells call `store.selectDate(info.date)` from `useCalendarStore()`. Don't mutate state from outside, and don't stash dates in your own component state and try to feed them back to the calendar — let the store own the selection and read it back via `useCalendarSelector`.
6. **`info.isSelected / isToday / isDisabled / inRange / isCurrentMonth / modifiers` are pre-computed.** Custom cells just paint pixels. Never re-compute "is this today?" yourself — the system has already done it.
7. **Vertical lists treat outside-month cells as blank spacers, always.** Even if `showOutsideDays` is true on `<Calendar.Root>`. Adjacent months stack directly above one another in a vertical scroll, so a greyed "May 30" at June's top would duplicate May's last cell. See [`references/vertical-list.md`](references/vertical-list.md) for the rationale.

## Workflow

When the user asks for a calendar feature, follow these steps:

1. **Identify the recipe.** Match the user's request against the table above. Pick the smallest fit. If they say "I just want a date picker" without further detail, default to `SimpleCalendar`. If you're unsure between two recipes (e.g. range vs bounded), ask one targeted question — don't guess on a load-bearing decision.
2. **Check peer dependencies.** Each recipe has its own deps:
   - All recipes: `react-native-fast-calendar`, `react`, `react-native`.
   - Hijri / multi-system: `@tabby_ai/hijri-converter` (or any compatible converter that exports `toHijri` / `toGregorian`).
   - Bottom sheet: `@gorhom/bottom-sheet`, `react-native-reanimated`, `react-native-gesture-handler` (and the Reanimated babel plugin).
   - Vertical list: `@shopify/flash-list`.
   
   Read the user's `package.json` first. If a dep is missing, tell the user — don't auto-install. Confirm package manager (npm / yarn / pnpm / bun) before suggesting an install command.
3. **Read only the reference files you need.** One recipe = one reference. Don't preload all of them.
4. **Use the shared theme tokens unless the user asks otherwise.** [`references/theme-tokens.md`](references/theme-tokens.md) has the shadcn-flavoured zinc palette and a dark variant the example app uses. Reusing them keeps consistency across the user's calendars; substitute the user's design-system tokens if they have one.
5. **Wire `onConfirm` for commits, `onSelect` for feedback.** `onSelect` fires on every tap (use it for haptics or "live preview" UI). `onConfirm` fires when the user presses your confirm button (sourced from `useCalendarActions().confirm`). Bookings, form submissions, and "save and close" flows go through `onConfirm`. Bottom-sheet pickers typically dismiss in `onConfirm`.
6. **Don't reach into the store during render.** Use `useCalendarSelector((s) => s.field)` so you re-render only when that slice changes. `useCalendarStore().getSnapshot()` is fine inside event handlers (e.g. a "Today" button) but not inside the render path.

## Common pitfalls

- **Header chevrons drifting right of the grid.** `<Calendar.DayGrid>` is fixed-width (`theme.cellSize × 7`, plus an extra column when `showWeekNumbers` is on). Wrap header + grid + footer in a shell `<View>` with that exact width — the grid recipes show the `CalendarShell` pattern.
- **`canConfirm` flickering.** Subscribe to it with `useCalendarSelector(selectCanConfirm)` and pass to `disabled` directly. Don't reimplement the gate (e.g. `selectedDate !== undefined`) — that re-renders on every displayed-month change. `useCalendarActions` is action-only and intentionally has no reactive `canConfirm` field.
- **Vertical list flashing on system swap.** When the active system changes (Gregorian → Hijri), the `month` objects in the list belong to the old system. Detect the swap synchronously during render (compare `system.id` to a `useRef`) and rebuild the data window before children read it. The vertical-list reference shows the exact pattern.
- **`<DayCell>`'s memo defeating itself.** The built-in `<DayCell>` uses field-level equality. If you mint fresh `info` objects every render (e.g. by spreading), every cell re-renders. Use the two-layer memo pattern: Layer 1 cells keyed by `year + month` primitives, Layer 2 flags that reuse Layer 1's `date` refs. Both vertical and grid recipes use it.
- **Inline `disabledDates` / `modifiers` arrays.** Defining them inside the component creates new array/object identities every render and forces every consumer to re-render. Hoist to module scope, or wrap with `useMemo`.
- **`SimpleCalendar` + custom footer.** `SimpleCalendar` contains its own `<Calendar.Root>` internally. Sibling components rendered next to it cannot read its store via hooks. If the user asks for "SimpleCalendar but with a custom Save button", drop down to the headless `<Calendar.Root>` and render the grid yourself.
- **`firstDayOfWeek` mismatch with weekday header.** Weekday labels are auto-rotated by the active `firstDayOfWeek`. If you build a custom weekday header, read labels from `useCalendarWeekdayLabels()` (rotated for you) instead of hand-coding `['Sun', 'Mon', …]`.

## What this skill does NOT cover

- **Time-of-day pickers.** The library is date-only. Combine with a separate time picker if needed.
- **Agenda / week / day views with hour rows.** The library renders monthly grids only.
- **Calendar event scheduling / drag-and-drop.** Out of scope; build it on top of `modifiers` + `renderDay` if you need it.
- **Other calendar libraries.** `react-native-calendars`, `react-native-modern-datepicker`, `expo-calendar`, `react-native-calendar-picker`, etc. all have different APIs — don't translate.

If the user asks for any of the above, say so explicitly and either suggest a different library or scope the request down to what's covered.

## Reference files

- [`references/api-cheatsheet.md`](references/api-cheatsheet.md) — exports, hooks, prop tables, key types. Read first if you're unfamiliar with the library's surface.
- [`references/theme-tokens.md`](references/theme-tokens.md) — shadcn-flavoured zinc + dark theme tokens. Tiny file, copy-paste ready.
- [`references/grid-recipes.md`](references/grid-recipes.md) — the 9 single-page grid recipes. Each one is independent.
- [`references/bottom-sheet.md`](references/bottom-sheet.md) — `@gorhom/bottom-sheet` integration, single + range variants.
- [`references/vertical-list.md`](references/vertical-list.md) — iOS-style infinite vertical month list, plus how to layer the 8 feature variants on top.
