---
sidebar_position: 4
---

# Theming

The library uses a small, opinionated set of theme tokens. Everything is overridable via props.

## Theme Tokens

```ts
interface CalendarTheme {
  colors: {
    background: string;      // Calendar background
    primary: string;         // Selected day, accent color
    onPrimary: string;       // Text on primary background
    text: string;            // Day numbers, labels
    textMuted: string;       // Weekday headers, outside days
    todayBorder: string;     // Border around today's date
    rangeBackground: string; // Background for dates in range
    disabled: string;        // Disabled day text
    border: string;          // Borders, dividers
  };
  spacing: {
    cellInnerGap: number;  // 4  — gap inside a cell (day number ↔ modifier dots)
    controlGap: number;    // 8  — gap between adjacent controls (nav buttons, switcher pills)
    controlPadding: number;// 12 — padding inside buttons/controls
    monthGap: number;      // 16 — gap between months in multi-month layout
    containerPadding: number;// 24 — outer padding wrapping the calendar
  };
  cellSize: number;       // Day cell width/height (default: 40)
  borderRadius: number;   // Day cell border radius (default: 999 for pill shape)
  fontSize: {
    day: number;      // 14
    weekday: number;  // 12
    header: number;   // 16
  };
}
```

## Default Theme

```ts
const defaultTheme: CalendarTheme = {
  colors: {
    background: '#FFFFFF',
    primary: '#1F6FEB',
    onPrimary: '#FFFFFF',
    text: '#0A0A0A',
    textMuted: '#6B7280',
    todayBorder: '#1F6FEB',
    rangeBackground: '#DBEAFE',
    disabled: '#D1D5DB',
    border: '#E5E7EB',
  },
  spacing: { cellInnerGap: 4, controlGap: 8, controlPadding: 12, monthGap: 16, containerPadding: 24 },
  cellSize: 40,
  borderRadius: 999,
  fontSize: { day: 14, weekday: 12, header: 16 },
};
```

## Dark Theme Preset

```ts
import { darkTheme } from 'react-native-fast-calendar';

<Calendar.Root theme={darkTheme}>
  {/* ... */}
</Calendar.Root>
```

```ts
const darkTheme: CalendarTheme = {
  colors: {
    background: '#18181B',     // zinc-900
    primary: '#60A5FA',        // blue-400
    onPrimary: '#0A0A0A',
    text: '#FAFAFA',           // zinc-50
    textMuted: '#A1A1AA',      // zinc-400
    todayBorder: '#60A5FA',
    rangeBackground: '#1E3A8A', // blue-900
    disabled: '#52525B',       // zinc-600
    border: '#3F3F46',         // zinc-700
  },
  spacing: { cellInnerGap: 4, controlGap: 8, controlPadding: 12, monthGap: 16, containerPadding: 24 },
  cellSize: 40,
  borderRadius: 999,
  fontSize: { day: 14, weekday: 12, header: 16 },
};
```

## Partial Overrides

The `theme` prop accepts partial overrides. The library performs a deep merge with defaults:

```tsx
// Override just the primary color
<Calendar.Root
  theme={{
    colors: {
      primary: '#E11D48',  // rose-600
      onPrimary: '#FFFFFF',
    },
  }}
>

// Override cell size for a larger calendar
<Calendar.Root
  theme={{
    cellSize: 48,
    fontSize: {
      day: 16,
      weekday: 14,
      header: 18,
    },
  }}
>

// Multiple overrides
<Calendar.Root
  theme={{
    colors: {
      primary: '#059669',      // emerald-600
      rangeBackground: '#D1FAE5', // emerald-100
    },
    cellSize: 44,
    borderRadius: 8,
  }}
>
```

## Accessing Theme in Custom Components

Use the `useCalendarTheme()` hook to read theme values:

```tsx
import { useCalendarTheme } from 'react-native-fast-calendar';

function MyHeader() {
  const theme = useCalendarTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text, fontSize: theme.fontSize.header }}>
        Select a Date
      </Text>
    </View>
  );
}
```

## Labels

User-facing strings are also customizable:

```ts
interface CalendarLabels {
  prev: string;        // "Previous"
  next: string;        // "Next"
  confirm: string;     // "Confirm"
  clear: string;       // "Clear"
  selectMonth: string; // "Select month"
  selectYear: string;  // "Select year"
}
```

### Default Labels

```ts
const defaultLabels: CalendarLabels = {
  prev: 'Previous',
  next: 'Next',
  confirm: 'Confirm',
  clear: 'Clear',
  selectMonth: 'Select month',
  selectYear: 'Select year',
};
```

### Customizing Labels

```tsx
// Partial override
<Calendar.Root
  labels={{
    confirm: 'Done',
    clear: 'Reset',
  }}
>

// Full localization
<Calendar.Root
  labels={{
    prev: 'Précédent',
    next: 'Suivant',
    confirm: 'Confirmer',
    clear: 'Effacer',
    selectMonth: 'Choisir le mois',
    selectYear: "Choisir l'année",
  }}
>
```

### Accessing Labels

```tsx
import { useCalendarLabels } from 'react-native-fast-calendar';

function MyFooter() {
  const { confirm, clear } = useCalendarLabels();

  return (
    <>
      <Button title={clear} />
      <Button title={confirm} />
    </>
  );
}
```

## Design System Integration

The library doesn't enforce any design system. Pass your tokens through:

```tsx
import { useTheme } from './my-design-system';

function MyCalendar() {
  const ds = useTheme(); // Your design system hook

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
        fontSize: {
          day: ds.typography.body.fontSize,
          weekday: ds.typography.caption.fontSize,
          header: ds.typography.heading3.fontSize,
        },
      }}
    >
      {/* ... */}
    </Calendar.Root>
  );
}
```

## Shadcn-style Zinc Theme

For apps using shadcn-style tokens:

```ts
const zincTheme: CalendarThemeOverride = {
  colors: {
    background: '#ffffff',
    primary: '#18181b',
    onPrimary: '#fafafa',
    text: '#09090b',
    textMuted: '#71717a',
    todayBorder: '#18181b',
    rangeBackground: '#f4f4f5',
    disabled: '#a1a1aa',
    border: '#e4e4e7',
  },
};

const zincDarkTheme: CalendarThemeOverride = {
  colors: {
    background: '#09090b',
    primary: '#fafafa',
    onPrimary: '#18181b',
    text: '#fafafa',
    textMuted: '#a1a1aa',
    todayBorder: '#fafafa',
    rangeBackground: '#27272a',
    disabled: '#52525b',
    border: '#27272a',
  },
};
```
