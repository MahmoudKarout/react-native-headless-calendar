---
sidebar_position: 4
---

# CalendarComponents

The `CalendarComponents` interface defines the component slots that can be customized via `<Calendar.Root components={...}>`. Use these to replace visual atoms without building the full UI from scratch.

## Interface Definition

```ts
interface CalendarComponents<T = CalendarDateValue> {
  /** Replaces the entire weekday header row (including layout) */
  WeekdayHeader?: ComponentType<WeekdayHeaderProps>;

  /** Replaces a single weekday cell — used by the default WeekdayHeader */
  WeekdayCell?: ComponentType<WeekdayCellProps>;

  /** Replaces a single day cell */
  DayCell?: ComponentType<{ info: DayCellInfo<T>; onSelect: (d: T) => void }>;

  /** Replaces the per-row week-number cell */
  WeekNumberCell?: ComponentType<WeekNumberCellProps>;

  /** Renders the per-month caption above each MonthGrid */
  MonthCaption?: ComponentType<MonthCaptionProps<T>>;
}
```

## WeekdayHeader

Replaces the entire weekday header row.

### Props

```ts
interface WeekdayHeaderProps {
  /** Already rotated to match firstDayOfWeek */
  labels: readonly string[];
}
```

### Example

```tsx
function MyWeekdayHeader({ labels }: WeekdayHeaderProps) {
  const theme = useCalendarTheme();

  return (
    <View style={styles.row}>
      {labels.map((label, index) => (
        <Text
          key={index}
          style={{
            width: theme.cellSize,
            textAlign: 'center',
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.weekday,
          }}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

<Calendar.Root
  components={{
    WeekdayHeader: MyWeekdayHeader,
  }}
>
```

## WeekdayCell

Replaces a single weekday cell. Only used when `WeekdayHeader` is not provided.

### Props

```ts
interface WeekdayCellProps {
  /** Label text for this column */
  label: string;
  /** Column index (0-6) */
  index: number;
}
```

### Example

```tsx
function MyWeekdayCell({ label, index }: WeekdayCellProps) {
  const theme = useCalendarTheme();
  const firstDayOfWeek = useCalendarFirstDayOfWeek();

  // Check if weekend based on actual day, not position
  const dayIndex = (firstDayOfWeek + index) % 7;
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  return (
    <Text
      style={{
        width: theme.cellSize,
        textAlign: 'center',
        color: isWeekend ? '#DC2626' : theme.colors.textMuted,
        fontSize: theme.fontSize.weekday,
        fontWeight: isWeekend ? '600' : '400',
      }}
    >
      {label}
    </Text>
  );
}

<Calendar.Root
  components={{
    WeekdayCell: MyWeekdayCell,
  }}
>
```

## DayCell

Replaces a single day cell. Receives the same `DayCellInfo` as `renderDay`.

### Props

```ts
interface DayCellProps<T = CalendarDateValue> {
  /** Full cell metadata */
  info: DayCellInfo<T>;
  /** Selection callback (from store) */
  onSelect: (date: T) => void;
}
```

### Example

```tsx
import { DayCell, DayCellProps } from 'react-native-fast-calendar';

function MyDayCell({ info, onSelect }: DayCellProps) {
  const theme = useCalendarTheme();

  return (
    <Pressable
      onPress={() => onSelect(info.date)}
      disabled={info.isDisabled}
      style={{
        width: theme.cellSize,
        height: theme.cellSize,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: info.isSelected
          ? theme.colors.primary
          : 'transparent',
        borderRadius: theme.borderRadius,
      }}
    >
      <Text
        style={{
          color: info.isSelected
            ? theme.colors.onPrimary
            : theme.colors.text,
        }}
      >
        {info.label}
      </Text>
    </Pressable>
  );
}

<Calendar.Root
  components={{
    DayCell: MyDayCell,
  }}
>
```

## WeekNumberCell

Replaces the week number cell shown when `showWeekNumbers={true}`.

### Props

```ts
interface WeekNumberCellProps {
  /** ISO 8601 week number */
  weekNumber: number;
}
```

### Example

```tsx
function MyWeekNumberCell({ weekNumber }: WeekNumberCellProps) {
  const theme = useCalendarTheme();

  return (
    <View
      style={{
        width: theme.cellSize,
        height: theme.cellSize,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: theme.colors.textMuted,
          fontSize: theme.fontSize.weekday,
          fontVariant: ['tabular-nums'],
        }}
      >
        W{weekNumber}
      </Text>
    </View>
  );
}

<Calendar.Root
  components={{
    WeekNumberCell: MyWeekNumberCell,
  }}
>
  <Calendar.DayGrid showWeekNumbers />
</Calendar.Root>
```

## MonthCaption

Renders a caption above each month in multi-month views.

### Props

```ts
interface MonthCaptionProps<T = CalendarDateValue> {
  /** Date pinned to first of the displayed month */
  date: T;
  /** 0-based month index */
  monthIndex: number;
  /** Year of the displayed month */
  year: number;
  /** Pre-formatted system.formatMonthYear() output */
  label: string;
}
```

### Example

```tsx
function MyMonthCaption({ label, monthIndex }: MonthCaptionProps) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[monthIndex];

  return (
    <View style={styles.caption}>
      <Text style={styles.captionText}>{label}</Text>
      <Text style={styles.seasonIndicator}>
        {monthIndex >= 2 && monthIndex <= 4 ? '🌸' :
         monthIndex >= 5 && monthIndex <= 7 ? '☀️' :
         monthIndex >= 8 && monthIndex <= 10 ? '🍂' : '❄️'}
      </Text>
    </View>
  );
}

<Calendar.Root>
  <Calendar.DayGrid numberOfMonths={2} />
</Calendar.Root>
```

## Precedence Rules

When multiple customization methods are used, they apply in this order:

1. **`renderDay` prop** on `DayGrid` — Highest priority
2. **`components.DayCell`** on `Root` — Second priority
3. **Default `DayCell`** — Fallback

For weekday headers:

1. **`components.WeekdayHeader`** — Replaces entire row
2. **`components.WeekdayCell`** — Used by default WeekdayHeader
3. **Default cells** — Fallback

## Complete Example

```tsx
import { Calendar } from 'react-native-fast-calendar';

<Calendar.Root
  components={{
    WeekdayHeader: MyWeekdayHeader,
    DayCell: MyDayCell,
    WeekNumberCell: MyWeekNumberCell,
    MonthCaption: MyMonthCaption,
  }}
>
  <Calendar.DayGrid showWeekNumbers numberOfMonths={2} />
</Calendar.Root>
```
