---
sidebar_position: 17
---

# useCalendarComponents

The `useCalendarComponents` hook provides access to the custom component slots passed to `<Calendar.Root components={...}>`. Use it when building custom grids that should honor the same slot overrides as the built-in `DayGrid`.

## Signature

```ts
function useCalendarComponents(): NonNullable<CalendarComponents>;
```

## Basic Usage

```tsx
import { useCalendarComponents } from 'react-native-fast-calendar';

function MyCustomGrid() {
  const components = useCalendarComponents();

  // Use custom DayCell if provided
  const DayCellComponent = components.DayCell ?? DefaultDayCell;

  return (
    <View>
      {cellInfos.map((info) => (
        <DayCellComponent key={info.index} info={info} />
      ))}
    </View>
  );
}
```

## Available Slots

```ts
interface CalendarComponents<T = CalendarDateValue> {
  /** Replaces the entire weekday header row */
  WeekdayHeader?: ComponentType<WeekdayHeaderProps>;
  /** Replaces a single weekday cell */
  WeekdayCell?: ComponentType<WeekdayCellProps>;
  /** Replaces a single day cell */
  DayCell?: ComponentType<{ info: DayCellInfo<T>; onSelect: (d: T) => void }>;
  /** Replaces the per-row week-number cell */
  WeekNumberCell?: ComponentType<WeekNumberCellProps>;
  /** Renders the per-month caption */
  MonthCaption?: ComponentType<MonthCaptionProps<T>>;
}
```

## Complete Example

```tsx
import {
  Calendar,
  useCalendarComponents,
  useCalendarTheme,
} from 'react-native-fast-calendar';
import { View, Text, Pressable, StyleSheet } from 'react-native';

function ComponentsExample() {
  return (
    <Calendar.Root
      mode="single"
      components={{
        DayCell: MyCustomDayCell,
        WeekdayCell: MyCustomWeekdayCell,
      }}
    >
      <View>
        <CustomGrid />
      </View>
    </Calendar.Root>
  );
}

function CustomGrid() {
  const theme = useCalendarTheme();
  const components = useCalendarComponents();

  // Use custom WeekdayCell if provided
  const WeekdayCell = components.WeekdayCell ?? DefaultWeekdayCell;

  const labels = useCalendarWeekdayLabels();

  return (
    <View style={{ width: theme.cellSize * 7 }}>
      {/* Weekday Header using custom slot */}
      <View style={styles.row}>
        {labels.map((label, index) => (
          <WeekdayCell key={index} label={label} index={index} />
        ))}
      </View>

      {/* Day Grid */}
      <Calendar.DayGrid />
    </View>
  );
}

function DefaultWeekdayCell({ label, index }: WeekdayCellProps) {
  const theme = useCalendarTheme();

  return (
    <Text
      style={{
        width: theme.cellSize,
        textAlign: 'center',
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.weekday,
      }}
    >
      {label}
    </Text>
  );
}

function MyCustomDayCell({ info, onSelect }) {
  // Custom implementation
  return (
    <Pressable onPress={() => onSelect(info.date)}>
      <Text>{info.label}</Text>
    </Pressable>
  );
}

function MyCustomWeekdayCell({ label, index }) {
  // Custom implementation
  return (
    <View style={{ padding: 8 }}>
      <Text style={{ fontWeight: 'bold' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
```

## Custom Grid with All Slots

```tsx
function ComprehensiveCustomGrid() {
  const components = useCalendarComponents();
  const theme = useCalendarTheme();

  const SlotWeekdayHeader = components.WeekdayHeader;
  const SlotWeekdayCell = components.WeekdayCell;
  const SlotDayCell = components.DayCell;
  const SlotWeekNumberCell = components.WeekNumberCell;
  const SlotMonthCaption = components.MonthCaption;

  const labels = useCalendarWeekdayLabels();
  const cellInfos = useMyCellInfos(); // Your custom cell data

  return (
    <View>
      {/* Month Caption */}
      {SlotMonthCaption && <SlotMonthCaption {...captionProps} />}

      {/* Weekday Header */}
      {SlotWeekdayHeader ? (
        <SlotWeekdayHeader labels={labels} />
      ) : (
        <View style={styles.row}>
          {labels.map((label, index) =>
            SlotWeekdayCell ? (
              <SlotWeekdayCell key={index} label={label} index={index} />
            ) : (
              <DefaultWeekdayCell key={index} label={label} index={index} />
            )
          )}
        </View>
      )}

      {/* Day Grid */}
      <View style={styles.row}>
        {cellInfos.map((info) =>
          SlotDayCell ? (
            <SlotDayCell key={info.index} info={info} onSelect={onSelect} />
          ) : (
            <DefaultDayCell key={info.index} info={info} onSelect={onSelect} />
          )
        )}
      </View>
    </View>
  );
}
```

## Empty Object Default

When no components are configured, the hook returns an empty object:

```tsx
const components = useCalendarComponents();
// components === {} when no slots provided
```

This makes it safe to destructure or access properties:

```tsx
const { DayCell } = useCalendarComponents();
// DayCell === undefined when not configured
```
