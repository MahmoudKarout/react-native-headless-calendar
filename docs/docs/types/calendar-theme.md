---
sidebar_position: 2
---

# CalendarTheme

The `CalendarTheme` interface defines all visual tokens used by the calendar. The library ships with default themes that you can customize via `CalendarThemeOverride`.

## Interface Definition

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
    cellInnerGap: number;
    controlGap: number;
    controlPadding: number;
    monthGap: number;
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

## Colors

### `background`

The background color of the calendar container.

```ts
background: '#FFFFFF' // Light
background: '#18181B' // Dark
```

### `primary`

The accent color used for selected dates, buttons, and highlights.

```ts
primary: '#1F6FEB' // Light (blue)
primary: '#60A5FA' // Dark (blue-400)
```

### `onPrimary`

The text color displayed on top of the primary color.

```ts
onPrimary: '#FFFFFF' // Light
onPrimary: '#0A0A0A' // Dark
```

### `text`

The main text color for day numbers and labels.

```ts
text: '#0A0A0A' // Light
text: '#FAFAFA' // Dark
```

### `textMuted`

A muted text color for weekday headers, outside days, and secondary text.

```ts
textMuted: '#6B7280' // Light (gray-500)
textMuted: '#A1A1AA' // Dark (zinc-400)
```

### `todayBorder`

The border color for highlighting today's date.

```ts
todayBorder: '#1F6FEB' // Light
todayBorder: '#60A5FA' // Dark
```

### `rangeBackground`

The background color for dates within a selected range.

```ts
rangeBackground: '#DBEAFE' // Light (blue-100)
rangeBackground: '#1E3A8A' // Dark (blue-900)
```

### `disabled`

The color for disabled dates and unavailable text.

```ts
disabled: '#D1D5DB' // Light (gray-300)
disabled: '#52525B' // Dark (zinc-600)
```

### `border`

The color for borders, dividers, and subtle backgrounds.

```ts
border: '#E5E7EB' // Light (gray-200)
border: '#3F3F46' // Dark (zinc-700)
```

## Spacing

Spacing tokens for consistent layout across custom components. Read at runtime via `useCalendarTheme().spacing`.

```ts
spacing: {
  cellInnerGap: 4,       // Tight gap inside a cell — e.g. between the day number and modifier dots
  controlGap: 8,         // Gap between adjacent controls — e.g. nav buttons, system-switcher pills
  controlPadding: 12,    // Padding inside a button or control — e.g. horizontal inset of header buttons
  monthGap: 16,          // Gap between months in multi-month layout (numberOfMonths > 1) — the only token consumed by the library
  containerPadding: 24,  // Outer padding wrapping the whole calendar — e.g. inside a card or bottom sheet
}
```

## Cell Size

The width and height of day cells in pixels.

```ts
cellSize: 40 // Default
cellSize: 48 // Larger touch targets
cellSize: 36 // Compact
```

## Border Radius

The border radius for day cells and other rounded elements.

```ts
borderRadius: 999   // Fully rounded (pill shape)
borderRadius: 8     // Rounded corners
borderRadius: 0     // Square cells
```

## Font Sizes

Typography scale for calendar text.

```ts
fontSize: {
  day: 14,      // Day numbers
  weekday: 12,  // Weekday headers
  header: 16,   // Month/year header
}
```

## CalendarThemeOverride

When passing a theme to `<Calendar.Root>`, you only need to specify the values you want to override:

```ts
interface CalendarThemeOverride {
  colors?: Partial<CalendarTheme['colors']>;
  spacing?: Partial<CalendarTheme['spacing']>;
  fontSize?: Partial<CalendarTheme['fontSize']>;
  cellSize?: number;
  borderRadius?: number;
}
```

The library performs a deep merge with the default theme.

## Default Themes

### Light Theme

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

### Dark Theme

```ts
const darkTheme: CalendarTheme = {
  colors: {
    background: '#18181B',
    primary: '#60A5FA',
    onPrimary: '#0A0A0A',
    text: '#FAFAFA',
    textMuted: '#A1A1AA',
    todayBorder: '#60A5FA',
    rangeBackground: '#1E3A8A',
    disabled: '#52525B',
    border: '#3F3F46',
  },
  spacing: { cellInnerGap: 4, controlGap: 8, controlPadding: 12, monthGap: 16, containerPadding: 24 },
  cellSize: 40,
  borderRadius: 999,
  fontSize: { day: 14, weekday: 12, header: 16 },
};
```

## Usage Examples

### Single Color Override

```tsx
<Calendar.Root
  theme={{
    colors: {
      primary: '#059669', // emerald-600
    },
  }}
>
```

### Complete Custom Theme

```tsx
<Calendar.Root
  theme={{
    colors: {
      background: '#FFF7ED',
      primary: '#C2410C',
      onPrimary: '#FFFFFF',
      text: '#431407',
      textMuted: '#9A3412',
      todayBorder: '#C2410C',
      rangeBackground: '#FFEDD5',
      disabled: '#FED7AA',
      border: '#FDBA74',
    },
    cellSize: 44,
    borderRadius: 12,
    fontSize: {
      day: 15,
      weekday: 13,
      header: 18,
    },
  }}
>
```

### Using Preset Themes

```tsx
import { darkTheme } from 'react-native-fast-calendar';

<Calendar.Root theme={darkTheme}>
```

### Dynamic Theme

```tsx
function MyCalendar() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Calendar.Root theme={isDark ? darkTheme : {}}>
      {/* ... */}
    </Calendar.Root>
  );
}
```
