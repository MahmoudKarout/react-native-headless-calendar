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
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
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
        padding: theme.spacing.lg,
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
function MySelectableCell({ isSelected, isInRange, isDisabled }) {
  const theme = useCalendarTheme();

  let backgroundColor = 'transparent';
  let textColor = theme.colors.text;
  let borderRadius = theme.borderRadius;

  if (isSelected) {
    backgroundColor = theme.colors.primary;
    textColor = theme.colors.onPrimary;
  } else if (isInRange) {
    backgroundColor = theme.colors.rangeBackground;
    borderRadius = 0;
  }

  if (isDisabled) {
    textColor = theme.colors.disabled;
  }

  return (
    <View
      style={{
        backgroundColor,
        borderRadius,
        opacity: isDisabled ? 0.4 : 1,
      }}
    >
      <Text style={{ color: textColor }}>{label}</Text>
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

## Complete Example

```tsx
import { Calendar, useCalendarTheme } from 'react-native-fast-calendar';
import { View, Text, Pressable, StyleSheet } from 'react-native';

function ThemeExample() {
  return (
    <Calendar.Root
      mode="single"
      theme={{
        colors: {
          primary: '#7C3AED', // violet-600
          rangeBackground: '#EDE9FE', // violet-100
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
          padding: theme.spacing.md,
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
          padding: theme.spacing.md,
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
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
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
        spacing: ds.spacing,
        cellSize: ds.sizes.touchable,
        borderRadius: ds.radii.full,
        fontSize: ds.typography,
      }}
    >
      {/* ... */}
    </Calendar.Root>
  );
}
```
