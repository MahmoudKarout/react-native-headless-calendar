---
sidebar_position: 2
---

# Headless Design

The library is **headless by design** — it provides the logic and state management, but you control every pixel of the UI.

## What "Headless" Means

Traditional calendar libraries ship with a predefined look and feel. Changing the UI often requires:
- Overriding CSS with `!important`
- Passing dozens of style props
- Accepting visual compromises

`react-native-fast-calendar` takes a different approach. It ships only:

1. **`<Calendar.Root>`** — The state provider (renders nothing visible)
2. **`<Calendar.DayGrid>`** — The day grid (can be fully customized via `renderDay`)
3. **`<Calendar.DayCell>`** — The default day cell (optional, replaceable)
4. **`<SimpleCalendar>`** — A batteries-included escape hatch for the 80% case

Everything else — headers, footers, pickers, system switchers — you build yourself using hooks.

## The Component Spectrum

```
┌─────────────────────────────────────────────────────────┐
│  SimpleCalendar                                         │
│  ├─ Built-in Header                                     │
│  ├─ Built-in DayGrid                                    │
│  └─ Built-in Footer                                     │
│  One component, zero customization                       │
├─────────────────────────────────────────────────────────┤
│  Semi-Custom                                            │
│  ├─ Custom Header                                       │
│  ├─ Calendar.DayGrid                                    │
│  └─ Custom Footer                                       │
│  Mix built-in and custom components                      │
├─────────────────────────────────────────────────────────┤
│  Fully Custom                                           │
│  ├─ Custom Header                                       │
│  ├─ Custom DayGrid (with renderDay)                   │
│  ├─ Custom Month Picker                                 │
│  ├─ Custom Year Picker                                  │
│  └─ Custom Actions                                      │
│  Complete control via hooks                              │
└─────────────────────────────────────────────────────────┘
```

## Why Headless?

### 1. Design System Compatibility

Your app already has buttons, typography, spacing tokens. Don't fight with a calendar's baked-in styles:

```tsx
// Your design system's button
import { Button } from './design-system';

const { confirm, canConfirm } = useCalendarActions();

<Button
  variant="primary"
  disabled={!canConfirm}
  onPress={confirm}
>
  Confirm Date
</Button>
```

### 2. Platform-Specific UI

Build iOS-style pickers for iOS, Material Design for Android, or adaptive web UIs — all from the same state:

```tsx
function MyDatePicker() {
  const { confirm, clear, canConfirm } = useCalendarActions();

  if (Platform.OS === 'ios') {
    return <IOSActionBar confirm={confirm} clear={clear} canConfirm={canConfirm} />;
  }

  return <AndroidActionBar confirm={confirm} clear={clear} canConfirm={canConfirm} />;
}
```

### 3. Accessibility Control

Full control over labels, roles, and focus management:

```tsx
<Pressable
  accessibilityLabel={`Select ${monthLabel} ${year}`}
  accessibilityRole="button"
  accessibilityState={{ selected: isSelected }}
  onPress={onSelect}
>
  {/* Your accessible day cell */}
</Pressable>
```

### 4. Animation Freedom

Use any animation library (Reanimated, Moti, Lottie) without fighting preset animations:

```tsx
import Animated from 'react-native-reanimated';

const { label } = useCalendarMonthLabel();

<Animated.Text entering={FadeIn}>
  {label}
</Animated.Text>
```

## Using the Headless API

### Basic Structure

```tsx
import { Calendar } from 'react-native-fast-calendar';

function MyCalendar() {
  return (
    <Calendar.Root mode="single" onConfirm={handleConfirm}>
      <MyHeader />
      <MyDayGrid />
      <MyFooter />
    </Calendar.Root>
  );
}
```

### Building a Header

```tsx
import {
  useCalendarHeader,
  useCalendarNavigation,
  useCalendarSystemSwitcher,
} from 'react-native-fast-calendar';

function MyHeader() {
  const {
    monthLabel,
    yearLabel,
    isMonthVisible,
    toggleMonthPicker,
    toggleYearPicker,
  } = useCalendarHeader();

  const { goPrev, goNext } = useCalendarNavigation();
  const { systems, activeId, setActive } = useCalendarSystemSwitcher();

  return (
    <View style={styles.header}>
      {/* System Switcher (if multiple systems) */}
      {systems.length > 1 && (
        <View style={styles.systems}>
          {systems.map(s => (
            <Button
              key={s.id}
              active={s.id === activeId}
              onPress={() => setActive(s.id)}
              title={s.label}
            />
          ))}
        </View>
      )}

      {/* Month/Year Labels */}
      <View style={styles.title}>
        {isMonthVisible && (
          <Button onPress={toggleMonthPicker} title={monthLabel} />
        )}
        <Button onPress={toggleYearPicker} title={yearLabel} />
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        <IconButton icon="chevron-left" onPress={goPrev} />
        <IconButton icon="chevron-right" onPress={goNext} />
      </View>
    </View>
  );
}
```

### Building a View Switcher

```tsx
import { useCalendarSelector } from 'react-native-fast-calendar';

function MyView() {
  const view = useCalendarSelector(s => s.view);

  if (view === 'month') {
    return <MyMonthPicker />;
  }

  if (view === 'year') {
    return <MyYearPicker />;
  }

  return <Calendar.DayGrid swipeable />;
}
```

### Building Pickers

```tsx
import {
  useCalendarMonthPicker,
  useCalendarYearPicker,
} from 'react-native-fast-calendar';

function MyMonthPicker() {
  const { months, activeMonth, selectMonth } = useCalendarMonthPicker();

  return (
    <Grid>
      {months.map(m => (
        <Cell
          key={m.index}
          active={m.index === activeMonth}
          onPress={() => selectMonth(m.index)}
        >
          {m.label}
        </Cell>
      ))}
    </Grid>
  );
}

function MyYearPicker() {
  const { years, activeYear, selectYear } = useCalendarYearPicker();

  return (
    <Grid>
      {years.map(y => (
        <Cell
          key={y}
          active={y === activeYear}
          onPress={() => selectYear(y)}
        >
          {y}
        </Cell>
      ))}
    </Grid>
  );
}
```

### Building Actions

```tsx
import { useCalendarActions, useCalendarLabels } from 'react-native-fast-calendar';

function MyFooter() {
  const { confirm, clear, canConfirm } = useCalendarActions();
  const { confirm: confirmLabel, clear: clearLabel } = useCalendarLabels();

  return (
    <View style={styles.footer}>
      <Button onPress={clear} title={clearLabel} variant="ghost" />
      <Button
        onPress={confirm}
        title={confirmLabel}
        disabled={!canConfirm}
        variant="primary"
      />
    </View>
  );
}
```

## Component Slots

For cases where you want to replace a specific visual atom without building the entire UI, use the `components` prop:

```tsx
<Calendar.Root
  components={{
    DayCell: MyCustomDayCell,
    WeekdayCell: MyCustomWeekdayCell,
    WeekdayHeader: MyCustomWeekdayHeader,
    WeekNumberCell: MyCustomWeekNumberCell,
    MonthCaption: MyCustomMonthCaption,
  }}
>
  <Calendar.DayGrid />
</Calendar.Root>
```

### Precedence Rules

1. `renderDay` prop on `DayGrid` wins over everything
2. `components.DayCell` on `Root` wins over default
3. Default `DayCell` is used when nothing else provided

## When to Use What

| Approach | Use When |
|----------|----------|
| `SimpleCalendar` | Quick prototypes, simple use cases, 80% scenario |
| Custom + `DayGrid` | Need custom header/footer but standard day cells |
| Component slots | Need to tweak day/weekday visuals, keep grid layout |
| `renderDay` | One-off custom cells for specific calendar instance |
| Fully custom | Maximum control, custom gestures, complex layouts |

## Universal Rules

These apply regardless of how headless you go:

1. **Always call hooks inside `<Calendar.Root>`** — They throw with clear errors otherwise
2. **Import types alongside values** — `type DayCellInfo`, `type CalendarSystem`, etc.
3. **Themes are partial overrides** — Pass `CalendarThemeOverride`, library merges with defaults
4. **Selection writes go through store** — Call `store.selectDate()`, don't mutate externally
5. **Use pre-computed flags** — `info.isSelected`, `info.isToday`, `info.isDisabled` are ready to use
