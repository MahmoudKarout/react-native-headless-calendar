---
sidebar_position: 12
---

# DayGridProps

The `DayGridProps` interface defines all props accepted by `<Calendar.DayGrid>`.

## Interface Definition

```ts
interface DayGridProps {
  renderDay?: DayRenderer;
  swipeable?: boolean;
  numberOfMonths?: number;
  showWeekNumbers?: boolean;
  style?: ViewStyle;
}
```

## Prop Reference

### `renderDay`

Optional custom day cell renderer.

```tsx
<Calendar.DayGrid
  renderDay={(info) => (
    <MyCustomCell info={info} />
  )}
/>
```

### `swipeable`

Enable horizontal swipe between months.

```tsx
<Calendar.DayGrid swipeable />
```

:::info
Requires `@shopify/flash-list` as a peer dependency.
:::

:::warning
Mutually exclusive with `numberOfMonths > 1`.
:::

### `numberOfMonths`

Render multiple months side-by-side.

```tsx
<Calendar.DayGrid numberOfMonths={2} />
```

### `showWeekNumbers`

Show ISO week numbers in a leading column.

```tsx
<Calendar.DayGrid showWeekNumbers />
```

### `style`

Container style override.

```tsx
<Calendar.DayGrid style={{ padding: 16 }} />
```

## Complete Example

```tsx
import { Calendar } from 'react-native-fast-calendar';

<Calendar.Root mode="single">
  <View style={styles.container}>
    <Calendar.DayGrid
      swipeable
      showWeekNumbers
      renderDay={(info) => (
        <MyCustomCell
          info={info}
          onPress={() => store.selectDate(info.date)}
        />
      )}
      style={styles.grid}
    />
  </View>
</Calendar.Root>
```
