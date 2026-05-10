# Theme Tokens

Drop-in palettes the example app uses across every recipe. Use them when the user has no design system; substitute their tokens otherwise.

## Light — shadcn zinc (default)

A neutral grey palette. Reads well on white, plays nicely with most apps.

```ts
import type { CalendarThemeOverride } from 'react-native-fast-calendar';

export const C = {
  background:      '#FFFFFF',
  card:            '#FFFFFF',
  foreground:      '#0A0A0A',
  mutedForeground: '#71717A', // zinc-500
  muted:           '#F4F4F5', // zinc-100
  mutedHover:      '#E4E4E7', // zinc-200
  border:          '#E4E4E7', // zinc-200
  borderStrong:    '#A1A1AA', // zinc-400
  primary:         '#0A0A0A',
  primaryForeground: '#FAFAFA',
  disabled:        '#A1A1AA',
  page:            '#FAFAFA', // zinc-50
};

export const SHADCN_THEME: CalendarThemeOverride = {
  colors: {
    background:      C.background,
    primary:         C.primary,
    onPrimary:       C.primaryForeground,
    text:            C.foreground,
    textMuted:       C.mutedForeground,
    todayBorder:     C.foreground,
    rangeBackground: C.muted,
    disabled:        C.disabled,
    border:          C.border,
  },
  cellSize: 36,
  borderRadius: 6,
  fontSize: { day: 14, weekday: 12, header: 14 },
  spacing: { cellInnerGap: 4, controlGap: 6, controlPadding: 10, monthGap: 14, containerPadding: 20 },
};
```

## Dark — zinc-900 with blue accent

Used by the bottom-sheet recipe.

```ts
const D = {
  background:      '#18181B', // zinc-900
  card:            '#27272A', // zinc-800
  foreground:      '#FAFAFA', // zinc-50
  mutedForeground: '#A1A1AA', // zinc-400
  primary:         '#60A5FA', // blue-400
  border:          '#3F3F46', // zinc-700
};

export const DARK_SHEET_THEME: CalendarThemeOverride = {
  colors: {
    background:      D.card,        // matches bottom-sheet card
    primary:         D.primary,
    onPrimary:       D.background,
    text:            D.foreground,
    textMuted:       D.mutedForeground,
    todayBorder:     D.primary,
    rangeBackground: '#1E3A8A',     // blue-900 — subtle on dark
    disabled:        '#52525B',     // zinc-600
    border:          D.border,
  },
  cellSize: 40,
  borderRadius: 8,
};
```

## Vertical — taller cells, blue today indicator

Used by the iOS-style infinite vertical list.

```ts
const V = {
  background:      '#FFFFFF',
  foreground:      '#0A0A0A',
  mutedForeground: '#71717A',
  muted:           '#F4F4F5',
  border:          '#E4E4E7',
  primary:         '#0A0A0A',
  primaryForeground: '#FAFAFA',
  todayAccent:     '#1F6FEB', // blue accent so today pops in a long scroll
  disabled:        '#A1A1AA',
};

export const VERTICAL_THEME: CalendarThemeOverride = {
  colors: {
    background:      V.background,
    primary:         V.primary,
    onPrimary:       V.primaryForeground,
    text:            V.foreground,
    textMuted:       V.mutedForeground,
    todayBorder:     V.todayAccent,
    rangeBackground: V.muted,
    border:          V.border,
    disabled:        V.disabled,
  },
  cellSize: 44,
  borderRadius: 8,
  fontSize: { day: 15, weekday: 12, header: 16 },
};
```

## Shell width — keep header & grid aligned

`<Calendar.DayGrid>` is intrinsically `theme.cellSize × 7` wide (plus an 8th column when `showWeekNumbers` is on). Wrap header + grid + footer in a fixed-width container so chevrons line up with the columns they navigate.

```ts
const CELL_SIZE = 36;
const COLS = 7;

const GRID_WIDTH = CELL_SIZE * COLS;            // 252
const GRID_WIDTH_WEEKS = CELL_SIZE * (COLS + 1); // 288
```

```tsx
function CalendarShell({ children, width = GRID_WIDTH }) {
  return <View style={{ alignSelf: 'center', gap: 12, width }}>{children}</View>;
}
```

When you turn `showWeekNumbers` on, swap the width to `GRID_WIDTH_WEEKS`.
