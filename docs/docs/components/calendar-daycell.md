---
sidebar_position: 4
---

# Calendar.DayCell

`<Calendar.DayCell>` is the **default day cell implementation**. It's a memoized component that renders a single day with selection, range, and today indicators.

## Basic Usage

While you typically don't render `DayCell` directly (it's used internally by `DayGrid`), you can use it when building custom grids:

```tsx
import { Calendar, DayCell, useCalendarStore } from 'react-native-fast-calendar';

function CustomGrid() {
  const store = useCalendarStore();
  const { cellInfos } = useCustomGridData();

  return (
    <View style={styles.grid}>
      {cellInfos.map((info) => (
        <DayCell
          key={info.index}
          info={info}
          onSelect={store.selectDate}
        />
      ))}
    </View>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `info` | `DayCellInfo` | Cell metadata (date, selection state, etc.) |
| `onSelect` | `(date: CalendarDateValue) => void` | Selection callback |

## DayCellInfo

The `info` prop contains all metadata needed to render a day:

```ts
interface DayCellInfo<T = CalendarDateValue> {
  // Date
  date: T;                    // Date in active calendar system
  nativeDate: Date;           // Native JS Date for convenience
  label: string;              // Day number label (e.g., "15")

  // Position
  isCurrentMonth: boolean;    // Inside displayed month

  // State
  isToday: boolean;             // Is today
  isSelected: boolean;          // Is selected
  inRange: boolean;           // Between range endpoints (exclusive)
  isRangeStart: boolean;      // Is range start
  isRangeEnd: boolean;        // Is range end
  isDisabled: boolean;        // Is disabled

  // Modifiers
  modifiers: Record<string, boolean>;  // Custom modifier flags

  // Week numbers (if enabled)
  weekNumber?: number;
}
```

## Visual States

The default `DayCell` handles these visual states:

| State | Visual |
|-------|--------|
| `isSelected` | Primary background, onPrimary text |
| `inRange` | Range background, square corners |
| `isRangeStart` | Primary background, rounded left |
| `isRangeEnd` | Primary background, rounded right |
| `isToday` | Border in primary color |
| `isDisabled` | 40% opacity, disabled text color |
| `!isCurrentMonth` | Muted text color |

## Memoization

`DayCell` is wrapped in `React.memo` with custom equality to prevent unnecessary re-renders:

```ts
const dayCellPropsEqual = (prev: DayCellProps, next: DayCellProps): boolean => {
  if (prev.onSelect !== next.onSelect) return false;
  const a = prev.info;
  const b = next.info;
  return (
    a.date === b.date &&
    a.label === b.label &&
    a.isCurrentMonth === b.isCurrentMonth &&
    a.isToday === b.isToday &&
    a.isSelected === b.isSelected &&
    a.inRange === b.inRange &&
    a.isRangeStart === b.isRangeStart &&
    a.isRangeEnd === b.isRangeEnd &&
    a.isDisabled === b.isDisabled
  );
};
```

This ensures that when you tap a day, only the affected cells (typically 2-4) re-render instead of all 42.

## Customizing Day Cells

There are three ways to customize day cells, in order of priority:

### 1. `renderDay` Prop (One-Off)

For custom cells in a specific calendar instance:

```tsx
<Calendar.DayGrid
  renderDay={(info) => (
    <MyCustomCell info={info} />
  )}
/>
```

### 2. `components.DayCell` Slot (Design System)

For replacing the default cell across your entire app:

```tsx
<Calendar.Root
  components={{
    DayCell: MyCustomCell,
  }}
>
  <Calendar.DayGrid />
</Calendar.Root>
```

### 3. Build From Scratch (Full Control)

For completely custom layouts, use the grid utilities directly:

```tsx
import { buildMonthGrid, useCalendarStore } from 'react-native-fast-calendar';

function MyCustomGrid() {
  const store = useCalendarStore();
  const system = useCalendarSelector(s => s.system);
  const displayed = useCalendarSelector(s => s.displayed);
  const firstDayOfWeek = useCalendarFirstDayOfWeek();

  const cells = useMemo(
    () => buildMonthGrid(system, displayed, firstDayOfWeek),
    [system, displayed, firstDayOfWeek]
  );

  return (
    <View style={styles.grid}>
      {cells.map((cell) => (
        <MyCell
          key={cell.index}
          date={cell.date}
          isCurrentMonth={cell.isCurrentMonth}
        />
      ))}
    </View>
  );
}
```

## Example: Custom Day Cell Component

```tsx
import { DayCellInfo, useCalendarStore, useCalendarTheme } from 'react-native-fast-calendar';
import { Pressable, Text, View } from 'react-native';

interface MyDayCellProps {
  info: DayCellInfo;
}

export function MyDayCell({ info }: MyDayCellProps) {
  const store = useCalendarStore();
  const theme = useCalendarTheme();

  const onPress = () => {
    if (!info.isDisabled) {
      store.selectDate(info.date);
    }
  };

  // Compute background
  let backgroundColor = 'transparent';
  let borderRadius = theme.borderRadius;

  if (info.isSelected) {
    backgroundColor = theme.colors.primary;
  } else if (info.inRange) {
    backgroundColor = theme.colors.rangeBackground;
    borderRadius = 0;
  }

  // Compute text color
  const textColor = info.isSelected
    ? theme.colors.onPrimary
    : info.isCurrentMonth && !info.isDisabled
      ? theme.colors.text
      : theme.colors.disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={info.isDisabled}
      style={{
        width: theme.cellSize,
        height: theme.cellSize,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        borderRadius,
        borderWidth: info.isToday && !info.isSelected ? 1 : 0,
        borderColor: theme.colors.todayBorder,
        opacity: info.isDisabled ? 0.4 : 1,
      }}
    >
      <Text
        style={{
          color: textColor,
          fontSize: theme.fontSize.day,
          fontWeight: info.isSelected ? '600' : '400',
        }}
      >
        {info.label}
      </Text>

      {/* Modifier dots */}
      {info.modifiers.booked && (
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#EF4444',
          }}
        />
      )}
    </Pressable>
  );
}
```

## Accessibility

The default `DayCell` includes accessibility attributes:

```tsx
<Pressable
  accessibilityLabel={info.label}
  accessibilityRole="button"
  accessibilityState={{
    selected: info.isSelected,
    disabled: info.isDisabled,
  }}
  disabled={info.isDisabled}
>
  {/* ... */}
</Pressable>
```

When building custom cells, preserve these for screen reader support.

## Performance Tips

1. **Don't spread `info`** — Spreading creates a new object and breaks memoization
2. **Use stable callbacks** — The store's `selectDate` has stable identity
3. **Minimize inline styles** — Define styles outside the render function when possible
4. **Avoid complex computations in render** — Pre-compute in parent or use derived state

```tsx
// ❌ Bad - breaks memoization
function BadCell({ info }) {
  return <Cell info={{ ...info, extra: true }} />;
}

// ✅ Good - pass through directly
function GoodCell({ info }) {
  return <Cell info={info} extra={true} />;
}
```
