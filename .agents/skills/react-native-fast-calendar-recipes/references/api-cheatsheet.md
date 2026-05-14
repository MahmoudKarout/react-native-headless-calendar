# API Cheatsheet

Surface area of `react-native-fast-calendar` you will use across recipes. Read top-to-bottom on first contact, then jump back as needed.

## Table of contents

- [Imports](#imports)
- [`<SimpleCalendar>`](#simplecalendar)
- [`<Calendar.Root>` — props](#calendarroot--props)
- [`<Calendar.DayGrid>` — props](#calendardaygrid--props)
- [Hooks](#hooks)
- [Component slots (`components` prop)](#component-slots-components-prop)
- [Calendar systems](#calendar-systems)
- [Grid utilities (for custom views)](#grid-utilities-for-custom-views)
- [Key types](#key-types)

## Imports

```tsx
import {
  // Components
  Calendar,                  // <Calendar.Root>, <Calendar.DayGrid>
  SimpleCalendar,            // batteries-included header+grid+footer
  Root,                      // == Calendar.Root (named export)
  DayGrid,                   // == Calendar.DayGrid (named export)
  DayCell,                   // memoised cell — for custom grids
  // Hooks
  useCalendarStore,          // imperative store handle
  useCalendarSelector,       // subscribe to a slice
  useCalendarConfig,         // theme + labels + systems + firstDayOfWeek + …
  useCalendarTheme,
  useCalendarLabels,
  useCalendarComponents,     // the components slot map
  useCalendarFirstDayOfWeek,
  useCalendarWeekdayLabels,  // already rotated for firstDayOfWeek
  useCalendarWeekNumbers,    // ISO week numbers for displayed month
  useCalendarSelectedDates,  // multi-mode selection slice
  useCalendarHeader,         // monthLabel + yearLabel + nav + toggles
  useCalendarMonthLabel,
  useCalendarYearLabel,
  useCalendarMonthPicker,
  useCalendarYearPicker,
  useCalendarNavigation,     // goPrev / goNext
  useCalendarActions,        // every mutator (selectDate, nav, confirm, clear) — stable, no subscriptions
  selectCanConfirm,          // selector for the canConfirm boolean — use via useCalendarSelector
  useCalendarSystemSwitcher, // systems / activeId / setActive
  // Defaults
  defaultTheme,
  darkTheme,
  defaultLabels,
  // Grid utilities (for custom views like vertical lists)
  ROWS,                      // 6
  COLS,                      // 7
  TOTAL_CELLS,               // 42
  YEAR_PAGE_SIZE,            // 12
  DEFAULT_FIRST_DAY_OF_WEEK, // 0
  buildMonthGrid,
  getYearPage,
  isBetween,
  isExplicitlyDisabled,
  isoWeekNumber,
  matchDate,
  rotateWeekdayLabels,
  usedRows,
  // Types
  type CalendarSystem,
  type CalendarTheme,
  type CalendarThemeOverride,
  type CalendarComponents,
  type CalendarMode,
  type CalendarView,
  type CalendarLabels,
  type CalendarSelectionPayload,
  type CalendarMatcher,
  type CalendarModifiers,
  type CalendarDateValue,
  type DateRange,
  type DayCellInfo,
  type DayRenderer,
  type DisabledDateInput,
  type DisabledDateRangeInput,
  type MonthCaptionProps,
  type OnConfirm,
  type OnClear,
  type OnSystemChange,
  type Weekday,
  type WeekdayCellProps,
  type WeekdayHeaderProps,
  type WeekNumberCellProps,
  type CalendarRootProps,
  type SimpleCalendarProps,
  type CalendarSnapshot,
  type CalendarStore,
} from 'react-native-fast-calendar';

// Calendar systems live behind sub-exports for tree-shaking.
import {
  gregorianSystem,
  createGregorianSystem,
  type GregorianDate,
  type GregorianSystemOptions,
} from 'react-native-fast-calendar/systems/gregorian';

import {
  createHijriSystem,
  hijriSystem,
  type HijriConverter,
  type HijriDate,
  type HijriSystemOptions,
} from 'react-native-fast-calendar/systems/hijri';

import {
  createJalaliSystem,
  jalaliSystem,
  type JalaliConverter,
  type JalaliDate,
  type JalaliSystemOptions,
} from 'react-native-fast-calendar/systems/jalali';
```

## `<SimpleCalendar>`

The opinionated quick-start component. Internally renders `<Calendar.Root>` + header + grid + footer. Use when the user just wants a calendar.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `mode` | `'single' \| 'range' \| 'multiple'` | `'single'` | Selection model. |
| `systems` | `CalendarSystem[]` | `[gregorianSystem]` | Pass multiple to enable a system switcher. |
| `onSelect` | `(date: Date) => void` | — | Fires on every tap. |
| `onConfirm` | `OnConfirm` | — | Fires when confirm button pressed. |
| `onClear` | `OnClear` | — | Fires when clear button pressed. |
| `showHeader` | `boolean` | `true` | Show month/year header. |
| `showFooter` | `boolean` | `true` | Show confirm/clear footer. |
| `swipeable` | `boolean` | `true` | Horizontal swipe between months. |
| `numberOfMonths` | `number` | `1` | Multi-month side-by-side. |
| `showWeekNumbers` | `boolean` | `false` | ISO week numbers column. |
| `firstDayOfWeek` | `Weekday` (0-6) | `0` | Sun=0, Mon=1, …, Sat=6. |
| `showOutsideDays` | `boolean` | `true` | Render adjacent-month cells. |
| `fixedWeeks` | `boolean` | `true` | Always show 6 rows. |
| `minDate` | `Date` | — | Inclusive lower bound. |
| `maxDate` | `Date` | — | Inclusive upper bound. |
| `initialDate` | `Date` | — | Single mode initial. |
| `initialStart` / `initialEnd` | `Date` | — | Range mode initial. |
| `initialDates` | `Date[]` | — | Multi mode initial. |
| `theme` | `CalendarThemeOverride` | — | Partial theme. |
| `labels` | `Partial<CalendarLabels>` | — | Localise button text. |
| `disabled` | `(d: Date) => boolean` | — | Dynamic disable predicate. |
| `style` | `ViewStyle` | — | Outer wrapper style. |

Limit: `SimpleCalendar` owns its own `<Calendar.Root>` internally — sibling components cannot read its store via `useCalendar*` hooks. For custom footers / overlays, drop down to the headless API.

## `<Calendar.Root>` — props

The headless wrapper. Shares the store with every `useCalendar*` hook in its subtree.

### Selection

| Prop | Type | Default |
|---|---|---|
| `mode` | `'single' \| 'range' \| 'multiple'` | `'single'` |
| `initialDate` | `unknown` (Date / Moment / native) | — |
| `initialStart` / `initialEnd` | `unknown` | — |
| `initialDates` | `readonly unknown[]` | — |
| `onConfirm` | `OnConfirm` | — |
| `onClear` | `OnClear` | — |

### Bounds & disable

| Prop | Type |
|---|---|
| `minDate` / `maxDate` | `unknown` |
| `disabledDates` | `readonly DisabledDateInput[]` |
| `disabledRanges` | `readonly DisabledDateRangeInput[]` (`{ start, end }`) |
| `disabled` | `(nativeDate: Date) => boolean` |
| `allowSameDay` | `boolean` (range mode) |
| `minRangeDays` / `maxRangeDays` | `number` (range mode) |
| `maxSelected` | `number` (multiple mode) |

### Layout & styling

| Prop | Type | Default |
|---|---|---|
| `firstDayOfWeek` | `Weekday` | `0` (Sunday) |
| `showOutsideDays` | `boolean` | `true` |
| `fixedWeeks` | `boolean` | `true` |
| `theme` | `CalendarThemeOverride` | — |
| `labels` | `Partial<CalendarLabels>` | — |

### Composition

| Prop | Type |
|---|---|
| `systems` | `readonly CalendarSystem[]` (default `[gregorianSystem]`) |
| `initialSystemId` | `string` |
| `onSystemChange` | `(systemId: string) => void` |
| `modifiers` | `CalendarModifiers` (`Record<string, CalendarMatcher>`) |
| `components` | `CalendarComponents` (slot map — see below) |
| `onChange` | `(payload: CalendarSelectionPayload) => void` (fires on every selectDate / clear) |
| `testID` | `string` |

`disabledDates` / `disabledRanges` / `disabled` compose with **OR** semantics — a cell is disabled if any of them say so.

## `<Calendar.DayGrid>` — props

The only built-in visual. Renders the displayed month.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `swipeable` | `boolean` | `false` | Horizontal swipe to change month. |
| `numberOfMonths` | `number` | `1` | Side-by-side. |
| `showWeekNumbers` | `boolean` | `false` | Leading week-number column. |
| `renderDay` | `DayRenderer` | — | Per-cell custom renderer (highest priority). |
| `style` | `ViewStyle` | — | Outer container style. |

`renderDay` wins over `components.DayCell` (set on `<Calendar.Root>`) wins over the default `<DayCell>`.

## Hooks

All hooks must be called inside `<Calendar.Root>`. They throw with a clear error otherwise.

### Store access

```ts
const store = useCalendarStore();
// store.selectDate(date), store.clear(), store.setView('day'|'month'|'year'),
// store.goToMonth(idx), store.goToYear(year), store.replaceSystem(sys, idx),
// store.getSnapshot(), store.subscribe(fn)

const value = useCalendarSelector((s) => s.someField);
// Subscribe to a slice — re-renders only when that slice changes.
// Common slices: selectedDate, selectedDates, rangeStart, rangeEnd,
// displayed, system, view, mode, minDate, maxDate, disabledDates,
// disabledRanges, disabled.
```

### Config

```ts
useCalendarConfig(): {
  theme; labels; systems; firstDayOfWeek; showOutsideDays;
  fixedWeeks; modifiers; components; onConfirm; onClear; onSystemChange;
}
useCalendarTheme(): CalendarTheme
useCalendarLabels(): CalendarLabels        // { prev, next, confirm, clear, selectMonth, selectYear }
useCalendarComponents(): CalendarComponents
useCalendarFirstDayOfWeek(): Weekday
useCalendarWeekdayLabels(): readonly string[]   // pre-rotated
useCalendarWeekNumbers(): readonly number[]     // ISO weeks for displayed month
```

### Selection

```ts
useCalendarSelectedDates<T = unknown>(): readonly T[]   // multi-mode only
```

### Navigation & header

```ts
useCalendarHeader(): {
  monthLabel: string;
  yearLabel: string;
  isMonthVisible: boolean;     // false in year-picker view
  toggleMonthPicker: () => void;
  toggleYearPicker: () => void;
  goPrev: () => void;          // RTL-aware
  goNext: () => void;
}

useCalendarMonthLabel(): { label, isVisible, toggle }
useCalendarYearLabel():  { label, toggle }
useCalendarNavigation(): { goPrev, goNext }
```

### Pickers

```ts
useCalendarMonthPicker(): {
  months: readonly { index: number; label: string }[];
  activeMonth: number;          // 0-based
  selectMonth: (i: number) => void;
}

useCalendarYearPicker(): {
  years: readonly number[];     // 12-year page
  activeYear: number;
  selectYear: (y: number) => void;
}
```

### Actions

```ts
useCalendarActions(): {
  // selection
  selectDate: (input: Date | string | CalendarDateValue) => void;
  clear: () => void;            // wipes selection, fires onClear + onChange
  confirm: () => void;          // fires onConfirm with payload
  // navigation (all stable references for the lifetime of the provider)
  goPrevMonth: () => void;
  goNextMonth: () => void;
  setDisplayedDate: (input: Date | string | CalendarDateValue) => void;
  selectMonth: (index: number) => void;
  selectYear: (year: number) => void;
  prevYearPage: () => void;
  nextYearPage: () => void;
  // synchronous read for handlers (use selectCanConfirm in render)
  isConfirmable: () => boolean;
}

// Render-time canConfirm — subscribes to the slices that actually matter.
const canConfirm = useCalendarSelector(selectCanConfirm);
```

`useCalendarActions()` returns a subscription-free, identity-stable object: the consumer never re-renders when the store changes.

### System switcher

```ts
useCalendarSystemSwitcher(): {
  systems: readonly CalendarSystem[];
  activeId: string;
  setActive: (id: string) => void;
}
// Returns systems.length < 2 → render nothing (or fall back gracefully).
```

## Component slots (`components` prop)

Every slot is optional. Pass them on `<Calendar.Root components={…}>`.

```ts
type CalendarComponents = {
  WeekdayHeader?:   ComponentType<WeekdayHeaderProps>;     // entire row
  WeekdayCell?:     ComponentType<WeekdayCellProps>;       // per-column
  WeekNumberCell?:  ComponentType<WeekNumberCellProps>;
  MonthCaption?:    ComponentType<MonthCaptionProps>;      // "April 2026"
  DayCell?:         ComponentType<{ info: DayCellInfo; onSelect: (d) => void }>;
};
```

Precedence: `WeekdayHeader` (full row) wins over `WeekdayCell` (per-column). `renderDay` (on `DayGrid`) wins over `DayCell` (slot) wins over default.

## Calendar systems

Built in: Gregorian. Pre-configured plugins: Hijri (auto-loads `@tabby_ai/hijri-converter`), Jalali (auto-loads `moment-jalaali`). Anything else you BYO via `CalendarSystem<T>`.

```ts
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';
import { jalaliSystem } from 'react-native-fast-calendar/systems/jalali';

// Drop-in — install the optional peer dep(s) and you're done.
const systems = [gregorianSystem, hijriSystem, jalaliSystem];
```

Need to override the auto-loaded converter (different Umm al-Qura tables, astronomical Jalali, an `Intl.DateTimeFormat`-based wrapper, …)? Use the matching factory from the same module:

```ts
import { createHijriSystem } from 'react-native-fast-calendar/systems/hijri';
import { createJalaliSystem } from 'react-native-fast-calendar/systems/jalali';

const hijri = createHijriSystem({ converter: myHijriConverter });
const jalali = createJalaliSystem({ converter: myJalaliConverter });
```

Both `createHijri` / `createJalali` also accept `monthLabels`, `weekdayLabels`, `label`, `formatDay`, `formatMonthYear` for localisation. Importing `hijriSystem` or `jalaliSystem` without the peer dep installed throws a clear, install-pointing error at import time.

`createGregorianSystem` lets you customise labels:

```ts
import { createGregorianSystem } from 'react-native-fast-calendar/systems/gregorian';

const FRENCH_SYSTEM = createGregorianSystem({
  label: 'Grégorien',
  monthLabels: ['Janvier', 'Février', /* … 12 */],
  weekdayLabels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
});
```

`CalendarSystem<T>` interface (for writing your own):

```ts
interface CalendarSystem<T = unknown> {
  id: string;                       // 'gregorian', 'hijri', …
  label: string;                    // human-readable
  monthLabels(): readonly string[]; // 12 entries
  weekdayLabels(): readonly string[]; // 7 entries, Sunday-first
  today(): T;
  fromNativeDate(d: Date): T;
  toNativeDate(d: T): Date;
  isSame(a: T, b: T): boolean;
  isBefore(a: T, b: T): boolean;
  isAfter(a: T, b: T): boolean;
  year(d: T): number;
  month(d: T): number;              // 0-based
  day(d: T): number;
  weekday(d: T): Weekday;           // 0..6 (Sun..Sat)
  daysInMonth(d: T): number;
  startOfMonth(d: T): T;
  addMonths(d: T, n: number): T;
  addYears(d: T, n: number): T;
  setMonth(d: T, m: number): T;
  setYear(d: T, y: number): T;
  formatDay(d: T): string;
  formatMonthYear(d: T): string;
  weekNumber?(d: T): number;        // optional — falls back to ISO
}
```

## Grid utilities (for custom views)

Use these when building anything beyond `<Calendar.DayGrid>` — most importantly the vertical list recipe.

```ts
buildMonthGrid<T>(
  system: CalendarSystem<T>,
  monthDate: T,
  firstDayOfWeek: Weekday,
): GridCell<T>[]   // 42 cells (6 rows × 7 cols)

// Where:
type GridCell<T> = { date: T; isCurrentMonth: boolean };

usedRows<T>(cells: GridCell<T>[]): number
// Number of rows that contain at least one current-month cell. Use to
// trim trailing all-outside rows when fixedWeeks=false.

isExplicitlyDisabled<T>(
  system: CalendarSystem<T>,
  date: T,
  disabledDates?: readonly DisabledDateInput[],
  disabledRanges?: readonly DisabledDateRangeInput[],
): boolean

isBetween<T>(
  system: CalendarSystem<T>,
  date: T,
  start: T | undefined,
  end: T | undefined,
): boolean

matchDate<T>(
  system: CalendarSystem<T>,
  date: T,
  matcher: CalendarMatcher,
): boolean
// matcher: array of dates | array of {start,end} ranges | predicate (Date)=>boolean

isoWeekNumber(d: Date): number
rotateWeekdayLabels(labels: readonly string[], firstDayOfWeek: Weekday): readonly string[]
getYearPage(year: number): readonly number[]   // 12-year window aligned to year
```

Constants:

```ts
ROWS = 6
COLS = 7
TOTAL_CELLS = 42
YEAR_PAGE_SIZE = 12
DEFAULT_FIRST_DAY_OF_WEEK = 0
```

## Key types

```ts
type DayCellInfo<T = unknown> = {
  date: T;
  nativeDate: Date;
  label: string;          // formatted day-of-month, e.g. "14"
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  inRange: boolean;       // strictly between range endpoints
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;
  modifiers: Record<string, boolean>;  // your modifier names → matched
};

type DayRenderer<T = unknown> = (info: DayCellInfo<T>) => ReactNode;

type CalendarSelectionPayload = {
  date?: Date;            // single mode
  startDate?: Date;       // range mode
  endDate?: Date;         // range mode
  dates?: Date[];         // multiple mode
};

type OnConfirm = (payload: CalendarSelectionPayload) => void;

type CalendarMatcher =
  | readonly DisabledDateInput[]
  | readonly DisabledDateRangeInput[]
  | ((nativeDate: Date) => boolean);

type CalendarModifiers = Readonly<Record<string, CalendarMatcher>>;

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type CalendarMode = 'single' | 'range' | 'multiple';
type CalendarView = 'day' | 'month' | 'year';
```

`CalendarTheme` (full):

```ts
type CalendarTheme = {
  colors: {
    background: string;
    primary: string;
    onPrimary: string;
    text: string;
    textMuted: string;
    todayBorder: string;
    rangeBackground: string;
    disabled: string;
    border: string;
  };
  cellSize: number;       // e.g. 36, 40, 44
  borderRadius: number;
  fontSize: { day: number; weekday: number; header: number };
  spacing: { cellInnerGap; controlGap; controlPadding; monthGap; containerPadding: number };
};

type CalendarThemeOverride = DeepPartial<CalendarTheme>;
```

`CalendarLabels` (defaults in English):

```ts
type CalendarLabels = {
  prev: string;          // "Previous"
  next: string;          // "Next"
  confirm: string;       // "Confirm"
  clear: string;         // "Clear"
  selectMonth: string;   // "Select month"
  selectYear: string;    // "Select year"
};
```
