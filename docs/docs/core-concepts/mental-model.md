---
sidebar_position: 1
---

# Mental Model

Understanding how `react-native-fast-calendar` works internally will help you build better calendar UIs and debug issues more effectively.

## The Store Architecture

At the heart of the library is the `CalendarStore` — an external store built on top of React's `useSyncExternalStore` API.

### Why an External Store?

1. **Granular Subscriptions** — Each component subscribes only to the specific state slice it cares about. A day tap doesn't re-render the header.
2. **Stable Action Identity** — Action methods are class arrow functions, eliminating the need for `useCallback` gymnastics.
3. **Built-in Batching** — Multi-dispatch operations notify listeners exactly once with the final state.

### Store Structure

```ts
interface CalendarSnapshot<T> {
  // Calendar System
  system: CalendarSystem<T>;        // Active calendar system
  systemIndex: number;              // Index in configured systems array

  // Display State
  displayed: T;                       // Currently displayed month
  view: 'day' | 'month' | 'year';   // Current view mode

  // Selection State (mode-dependent)
  mode: 'single' | 'range' | 'multiple';
  selectedDate?: T;                 // Single mode
  rangeStart?: T;                   // Range mode
  rangeEnd?: T;                     // Range mode
  selectedDates: readonly T[];      // Multiple mode

  // Bounds
  minDate?: T;
  maxDate?: T;

  // Disabled State
  disabledDates?: readonly T[];
  disabledRanges?: readonly { start: T; end: T }[];
  disabled?: (nativeDate: Date) => boolean;

  // Range Constraints
  allowSameDay: boolean;
  minRangeDays?: number;
  maxRangeDays?: number;

  // Multiple Mode Constraints
  maxSelected?: number;
}
```

## Two-Context Architecture

The library uses two separate contexts, decoupled on purpose:

### 1. CalendarStoreContext

Holds the store **instance** (never changes reference). Compound parts subscribe to slices via `useCalendarSelector`.

```tsx
const store = useCalendarStore();
// store.selectDate(date)
// store.clear()
// store.changeMonth(step)
// store.getSnapshot()
```

### 2. CalendarConfigContext

Holds primitives, theme, labels, callbacks, and systems list. Updates infrequently.

```tsx
const config = useCalendarConfig();
// config.theme
// config.labels
// config.systems
// config.firstDayOfWeek
```

Splitting them means a date tap doesn't propagate any context change at all.

## Component Hierarchy

```
Calendar.Root (Provider)
├── MyHeader (optional)
│   └── uses: useCalendarHeader, useCalendarNavigation
├── MyView (required)
│   ├── Day Grid View
│   │   └── Calendar.DayGrid
│   ├── Month Picker View
│   │   └── uses: useCalendarMonthPicker
│   └── Year Picker View
│       └── uses: useCalendarYearPicker
├── MyReadout (optional)
│   └── uses: useCalendarSelector, useCalendarSelectedDates
└── MyActionBar (optional)
    └── uses: useCalendarActions
```

## Data Flow

### 1. Initialization

```tsx
<Calendar.Root
  mode="single"
  systems={[gregorianSystem]}
  initialDate={new Date()}
>
  {/* children */}
</Calendar.Root>
```

1. Root creates `CalendarStore` instance
2. Store normalizes initial values through calendar system
3. Both contexts are provided to children

### 2. User Interaction

```tsx
// Inside a day cell
const store = useCalendarStore();
const onPress = () => store.selectDate(date);
```

1. User taps a day
2. `store.selectDate()` is called
3. Store updates snapshot and notifies subscribers
4. Only components reading changed slices re-render

### 3. Reading State

```tsx
// Granular subscription - only re-renders when displayed month changes
const displayed = useCalendarSelector(s => s.displayed);

// Granular subscription - only re-renders when selection changes
const selectedDate = useCalendarSelector(s => s.selectedDate);
```

## Calendar System Abstraction

The library is intentionally agnostic about which calendar system you use.

```ts
interface CalendarSystem<T> {
  id: string;
  label: string;

  // Construction
  today(): T;
  fromNativeDate(d: Date): T;
  from(input: unknown): T;

  // Accessors
  year(d: T): number;
  month(d: T): number;  // 0-based
  day(d: T): number;
  weekday(d: T): number;  // 0=Sunday
  daysInMonth(d: T): number;

  // Navigation
  withYear(d: T, year: number): T;
  withMonth(d: T, month: number): T;
  withDay(d: T, day: number): T;
  addMonths(d: T, n: number): T;
  addYears(d: T, n: number): T;

  // Comparison
  isSame(a: T, b: T): boolean;
  isBefore(a: T, b: T): boolean;
  isAfter(a: T, b: T): boolean;

  // Labels
  monthLabels(): readonly string[];
  weekdayLabels(): readonly string[];
  formatDay(d: T): string;
  formatMonthYear(d: T): string;
  weekNumber?(d: T): number;

  // Conversion
  toNativeDate(d: T): Date;
}
```

The core never inspects `CalendarDateValue` directly — it passes values through the `CalendarSystem` adapter for every operation.

## Memoization Strategy

The `Calendar.DayGrid` uses two layers of memoization for performance:

### Layer 1: Build Cell Skeletons

```ts
const cells = useMemo(
  () => buildMonthGrid(system, month, firstDayOfWeek),
  [system, monthYear, monthIndex, firstDayOfWeek]
);
```

- Builds 42 system-specific date objects
- Recomputes only when month/system/firstDayOfWeek change
- Keys cache on year/month primitives (not object reference)

### Layer 2: Enrich with Flags

```ts
const cellInfos = useMemo<DayCellInfo[]>(() => {
  return cells.map(c => ({
    date: c.date,
    isCurrentMonth: c.isCurrentMonth,
    isSelected: /* compute */,
    inRange: /* compute */,
    isDisabled: /* compute */,
    modifiers: /* compute */,
  }));
}, [cells, /* selection deps */]);
```

- Overlays selection/range/today/disabled flags
- Recomputes on selection changes but reuses Layer 1's date refs

### DayCell Memoization

```ts
export const DayCell = memo(DayCellComponent, dayCellPropsEqual);
```

- Custom equality function compares primitive fields
- Only 2-4 cells re-render on a day tap instead of all 42

## Best Practices

1. **Use granular selectors** — Select primitives (`s.system.id`) instead of objects (`s.system`)
2. **Don't recreate matchers** — Hoist `disabledDates`/`modifiers` to module scope or use `useMemo`
3. **Let the store own selection** — Don't stash dates in component state, use `store.selectDate()`
4. **Use `getSnapshot()` in callbacks** — Safe for event handlers, but not for render path

## Common Pitfalls

### Header Drifting Right of Grid

The grid has a fixed width (`theme.cellSize × 7`). Wrap header + grid + footer in a shell with that exact width:

```tsx
const width = theme.cellSize * 7;

<View style={{ width }}>
  <MyHeader />
  <Calendar.DayGrid />
  <MyFooter />
</View>
```

### `canConfirm` Flickering

Read directly from `useCalendarActions().canConfirm`. Don't reimplement the gate:

```tsx
// ✅ Good
const { canConfirm } = useCalendarActions();

// ❌ Bad - causes flickering
const canConfirm = selectedDate !== undefined;
```

### Inline Matchers Causing Re-renders

```tsx
// ❌ Bad - new array every render
<Calendar.Root
  disabledDates={[new Date()]}  // Creates new array reference
/>

// ✅ Good - stable reference
const DISABLED_DATES = [new Date()];
<Calendar.Root disabledDates={DISABLED_DATES} />
```
