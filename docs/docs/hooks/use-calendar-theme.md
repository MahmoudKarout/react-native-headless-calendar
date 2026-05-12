---
sidebar_position: 15
---

# useCalendarTheme

The `useCalendarTheme` hook provides access to the merged theme object. Use it to style custom components consistently with the calendar.

## Signature

```ts
function useCalendarTheme(): CalendarTheme;
```

## Basic Usage

```tsx
import { useCalendarTheme } from 'react-native-fast-calendar';

function MyCustomComponent() {
  const theme = useCalendarTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.day }}>
        Hello
      </Text>
    </View>
  );
}
```

## Theme Structure

```ts
interface CalendarTheme {
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
  spacing: {
    /** Gap between the day number and modifier dots inside a cell. Default: 4 */
    cellInnerGap: number;
    /** Gap between adjacent controls (nav buttons, system-switcher pills). Default: 8 */
    controlGap: number;
    /** Horizontal/vertical inset inside buttons and controls. Default: 12 */
    controlPadding: number;
    /** Gap between months in a multi-month layout (`numberOfMonths > 1`). Default: 16 */
    monthGap: number;
    /** Outer padding wrapping the entire calendar (card, bottom sheet, etc.). Default: 24 */
    containerPadding: number;
  };
  cellSize: number;
  borderRadius: number;
  fontSize: {
    day: number;
    weekday: number;
    header: number;
  };
}
```

## Common Patterns

### Container Styling

```tsx
function MyContainer() {
  const theme = useCalendarTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        padding: theme.spacing.containerPadding,
        borderRadius: theme.borderRadius,
      }}
    >
      {/* Content */}
    </View>
  );
}
```

### Cell Sizing

```tsx
function MyCell() {
  const theme = useCalendarTheme();

  return (
    <View
      style={{
        width: theme.cellSize,
        height: theme.cellSize,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius,
      }}
    >
      {/* Content */}
    </View>
  );
}
```

### Selection States

```tsx
function MySelectableCell({ info }) {
  const theme = useCalendarTheme();

  let backgroundColor = 'transparent';
  let textColor = theme.colors.text;
  let borderRadius = theme.borderRadius;

  if (info.isSelected) {
    backgroundColor = theme.colors.primary;
    textColor = theme.colors.onPrimary;
  } else if (info.inRange) {
    backgroundColor = theme.colors.rangeBackground;
    borderRadius = 0;
  }

  if (info.isDisabled) {
    textColor = theme.colors.disabled;
  }

  return (
    <View
      style={{
        backgroundColor,
        borderRadius,
        opacity: info.isDisabled ? 0.4 : 1,
      }}
    >
      <Text style={{ color: textColor }}>{info.label}</Text>
    </View>
  );
}
```

### Grid Width Calculation

```tsx
function MyGridContainer({ showWeekNumbers }) {
  const theme = useCalendarTheme();

  // Grid width = cell size × (7 columns + optional week number column)
  const width = theme.cellSize * (showWeekNumbers ? 8 : 7);

  return (
    <View style={{ width }}>
      {/* Grid content */}
    </View>
  );
}
```

### Control Row Spacing

```tsx
function MyControlRow() {
  const theme = useCalendarTheme();

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.controlGap }}>
      <Pressable style={{ padding: theme.spacing.controlPadding }}>
        <Text>Prev</Text>
      </Pressable>
      <Pressable style={{ padding: theme.spacing.controlPadding }}>
        <Text>Next</Text>
      </Pressable>
    </View>
  );
}
```

## Complete Example

```tsx
import {
  Calendar,
  useCalendarTheme,
  useCalendarSelector,
  useCalendarActions,
} from 'react-native-fast-calendar';
import { View, Text, Pressable, StyleSheet } from 'react-native';

function ThemeExample() {
  return (
    <Calendar.Root
      mode="single"
      theme={{
        colors: {
          primary: '#7928ca',        // --ds-violet
          rangeBackground: '#d8ccf1', // --ds-violet-soft
        },
      }}
    >
      <View>
        <ThemedHeader />
        <Calendar.DayGrid />
        <ThemedFooter />
      </View>
    </Calendar.Root>
  );
}

function ThemedHeader() {
  const theme = useCalendarTheme();
  const monthYear = useCalendarSelector(s =>
    s.system.formatMonthYear(s.displayed)
  );

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.background,
          paddingHorizontal: theme.spacing.containerPadding,
          paddingVertical: theme.spacing.controlPadding,
        },
      ]}
    >
      <Text
        style={{
          fontSize: theme.fontSize.header,
          color: theme.colors.text,
          fontWeight: '600',
        }}
      >
        {monthYear}
      </Text>
    </View>
  );
}

function ThemedFooter() {
  const theme = useCalendarTheme();
  const { confirm, clear, canConfirm } = useCalendarActions();

  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingHorizontal: theme.spacing.containerPadding,
          paddingVertical: theme.spacing.controlPadding,
          gap: theme.spacing.controlGap,
        },
      ]}
    >
      <Pressable onPress={clear}>
        <Text style={{ color: theme.colors.textMuted }}>Clear</Text>
      </Pressable>
      <Pressable
        onPress={confirm}
        disabled={!canConfirm}
        style={{
          backgroundColor: theme.colors.primary,
          paddingHorizontal: theme.spacing.controlPadding,
          paddingVertical: theme.spacing.cellInnerGap,
          borderRadius: theme.borderRadius,
          opacity: canConfirm ? 1 : 0.5,
        }}
      >
        <Text style={{ color: theme.colors.onPrimary }}>Confirm</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
});
```

## Overriding Spacing Tokens

`CalendarThemeOverride.spacing` is a partial — you only need to specify the tokens you want to change:

```tsx
<Calendar.Root
  theme={{
    spacing: {
      containerPadding: 16, // tighter outer padding in a compact card
      monthGap: 32,         // wider gap in a multi-month layout
    },
  }}
>
```

## Design System Integration

Pass your design system tokens through the theme:

```tsx
import { useTheme as useDesignSystemTheme } from 'my-design-system';

function MyCalendar() {
  const ds = useDesignSystemTheme();

  return (
    <Calendar.Root
      theme={{
        colors: {
          primary: ds.colors.brand,
          onPrimary: ds.colors.brandText,
          background: ds.colors.surface,
          text: ds.colors.text,
          textMuted: ds.colors.textSecondary,
          todayBorder: ds.colors.brand,
          rangeBackground: ds.colors.brandMuted,
          disabled: ds.colors.textDisabled,
          border: ds.colors.divider,
        },
        spacing: {
          cellInnerGap: ds.spacing[1],
          controlGap: ds.spacing[2],
          controlPadding: ds.spacing[3],
          monthGap: ds.spacing[4],
          containerPadding: ds.spacing[6],
        },
        cellSize: ds.sizes.touchable,
        borderRadius: ds.radii.md,
        fontSize: {
          day: ds.typography.body,
          weekday: ds.typography.caption,
          header: ds.typography.subheading,
        },
      }}
    >
      {/* ... */}
    </Calendar.Root>
  );
}
```
