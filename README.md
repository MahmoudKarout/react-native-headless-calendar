# react-native-fast-calendar

A headless, calendar-system-agnostic React Native calendar.

**One provider, two hooks, four selectors.** You bring the UI; the library brings the data, the math, and the store.

- 📦 Zero deps on a date library — Gregorian is built in, Hijri / Jalali / custom are opt-in
- ⚡ `useSyncExternalStore` under the hood — surgical re-renders, action callers never subscribe
- 🎨 Headless — every cell, header, footer is yours to style
- 🔀 Single, range, or multiple selection in one API
- 📚 [Full docs and recipes](https://your-docs-url) · [Live examples](./example)

## Install

```bash
yarn add react-native-fast-calendar
```

### Requirements

| Peer | Minimum | Why |
|---|---|---|
| `react` | **≥ 18.0** | the library imports `useSyncExternalStore` directly from `react` |
| `react-native` | **≥ 0.70** | first RN line that ships with React 18 by default |

Optional peers, only if you import the matching system:

| Peer | Minimum | Needed for |
|---|---|---|
| `@tabby_ai/hijri-converter` | `>= 1` | `react-native-fast-calendar/systems/hijri` |
| `moment-jalaali` | `>= 0.10` | `react-native-fast-calendar/systems/jalali` |
| `@shopify/flash-list` | `>= 2.3` | vertical-list / swipeable recipes |

Nothing else is required.

## 30-second tour

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  CalendarProvider,
  selectDays,
  useCalendarActions,
  useCalendarSelector,
} from 'react-native-fast-calendar';

function Calendar() {
  const days = useCalendarSelector(selectDays);
  const { selectDate, goPrevMonth, goNextMonth } = useCalendarActions();

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={goPrevMonth}><Text>‹</Text></Pressable>
        <Text>{days.displayedMonthLabel} {days.displayedYearLabel}</Text>
        <Pressable onPress={goNextMonth}><Text>›</Text></Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.cells.map((cell) => (
          <Pressable
            key={cell.nativeDate.toISOString()}
            onPress={() => selectDate(cell.date)}
            disabled={cell.isDisabled}
            style={{
              width: 40,
              height: 40,
              opacity: cell.isCurrentMonth ? 1 : 0.4,
              backgroundColor: cell.isSelected ? '#0f172a' : 'transparent',
            }}
          >
            <Text style={{ color: cell.isSelected ? '#fff' : '#0f172a' }}>
              {cell.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function Screen() {
  return (
    <CalendarProvider mode="single" onConfirm={({ date }) => console.log(date)}>
      <Calendar />
    </CalendarProvider>
  );
}
```

That's a working date picker. Header, weekday row, grid, selection — all from `selectDays` + `useCalendarActions`.

## API surface

The entire public API:

```ts
import {
  // 1. Provider
  CalendarProvider,
  // 2. Hooks
  useCalendarSelector,
  useCalendarActions,
  // 3. Built-in selectors
  selectDays, selectMonths, selectYears, selectCanConfirm,
  // 4. Calendar systems
  gregorianSystem, createGregorianSystem,
  // (+ types and a few grid utilities)
} from 'react-native-fast-calendar';
```

### `<CalendarProvider>`

```tsx
<CalendarProvider
  mode="single"                              // "single" | "range" | "multiple"
  systems={[gregorianSystem]}                // optional, Gregorian is default
  initialDate={new Date()}
  firstDayOfWeek={1}                         // 0=Sun (default), 1=Mon, ...

  // Bounds (all compose with OR)
  minDate={new Date()}
  maxDate={...}
  disabledDates={[...]}
  disabledRanges={[{ start, end }]}
  disabled={(d) => d.getDay() === 0}

  // Modifiers — named flags surfaced on every cell
  modifiers={{
    booked:  [new Date(2024, 4, 7)],
    holiday: { start: ..., end: ... },
    weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
  }}

  // Range-only
  minRangeDays={2}
  maxRangeDays={14}
  allowSameDay

  // Multiple-only
  maxSelected={5}

  // Callbacks
  onChange={(payload) => {}}                 // every selectDate / clear
  onConfirm={(payload) => {}}                // actions.confirm()
  onClear={() => {}}                         // actions.clear()
>
  {/* your UI */}
</CalendarProvider>
```

`payload` shape per mode:

```ts
{ date?: Date; startDate?: Date; endDate?: Date; dates?: Date[]; systemId: string }
```

### The two hooks

| Hook | Returns | Re-renders on |
|---|---|---|
| `useCalendarSelector(fn)` | `fn(snapshot)` | when `fn`'s return changes (`Object.is`) |
| `useCalendarActions()` | every mutator | **never** — stable for the lifetime of the provider |

```tsx
// Read — granular
const selectedDate = useCalendarSelector((s) => s.selectedDate);
const count        = useCalendarSelector((s) => s.selectedDates.length);
const days         = useCalendarSelector(selectDays);

// Write — subscription-free
const {
  selectDate, clear, confirm,
  goPrevMonth, goNextMonth, setDisplayedDate,
  selectMonth, selectYear, prevYearPage, nextYearPage,
  isConfirmable, // synchronous read for handlers
} = useCalendarActions();
```

Rule of thumb: **components that only need to *act* should call only `useCalendarActions`**. They never re-render on selection changes.

### Built-in selectors

Pre-built derived views. Pass to `useCalendarSelector`.

| Selector | Shape |
|---|---|
| `selectCanConfirm` | `boolean` — current selection is committable |
| `selectDays` | `{ weekdayLabels, cells, displayedMonthLabel, displayedYearLabel }` |
| `selectMonths` | `{ months: { index, label }[], activeMonth }` |
| `selectYears` | `{ years: number[], activeYear }` |

Every `cell` in `selectDays.cells` is a `DayCellInfo`:

```ts
interface DayCellInfo {
  date: CalendarDateValue;       // active-system value (pass back to selectDate)
  nativeDate: Date;              // for keys, comparisons, formatting
  label: string;                 // already localised
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  inRange: boolean;              // strictly between range endpoints
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;
  modifiers: Record<string, boolean>;
}
```

For anything bespoke, write your own narrow selector: `useCalendarSelector((s) => s.system.id)`.

### Calendar systems

Gregorian is built in. Hijri and Jalali ship pre-configured behind sub-paths so the core stays dependency-free:

```tsx
// Gregorian — implicit or explicit
<CalendarProvider />
<CalendarProvider systems={[gregorianSystem]} />

// Localised Gregorian
const french = createGregorianSystem({
  label: 'Grégorien',
  monthLabels: ['Janvier', 'Février', /* … */],
  weekdayLabels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
});

// Hijri (needs `@tabby_ai/hijri-converter`)
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';

// Jalali (needs `moment-jalaali`)
import { jalaliSystem } from 'react-native-fast-calendar/systems/jalali';

// Multi-system — first one is the default; user picks via your UI
<CalendarProvider systems={[gregorianSystem, hijriSystem, jalaliSystem]} />
```

For Chinese, Ethiopian, or anything else, implement `CalendarSystem<T>` — it's an 18-method interface with no library coupling.

## Recipes

Eleven first-party recipes covering common shapes — see [`/example`](./example) for runnable source and the [docs site](https://your-docs-url/docs/recipes/single-date-picker) for walkthroughs:

- Single / range / multi-date pickers
- Bounded selection (min/max, disabled days, disabled ranges)
- Multi-month grid · Week numbers · Custom day cell
- Bottom-sheet picker · Wheel date picker
- Vertical infinite list (iOS-Calendar style)
- Flight-price calendar · Horoscope calendar

## Architecture

`<CalendarProvider>` owns a single store powered by `useSyncExternalStore`. External callbacks live on the store (not in context), so the action object is identity-stable for the lifetime of the provider — pass it straight to `React.memo`'d cells, `useEffect` deps, or out-of-tree handlers without re-renders.

```
CalendarProvider
 ├── CalendarStore (useSyncExternalStore)
 │    ├── snapshot          ← read via useCalendarSelector
 │    └── actions           ← read via useCalendarActions
 └── CalendarConfig         ← firstDayOfWeek + modifiers (static)
```

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT · Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
