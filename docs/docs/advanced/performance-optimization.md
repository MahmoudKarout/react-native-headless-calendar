---
sidebar_position: 2
---

# Performance Optimization

`react-native-fast-calendar` is designed for high performance. This guide explains how to maintain optimal performance in your implementation.

## Built-in Optimizations

### Granular Subscriptions

Each hook subscribes only to its specific slice of state:

```tsx
// Only re-renders when selectedDate changes
const selectedDate = useCalendarSelector(s => s.selectedDate);

// Only re-renders when displayed month changes
const displayed = useCalendarSelector(s => s.displayed);
```

### Layered Memoization

The `DayGrid` uses two layers of memoization:

1. **Layer 1**: 42 date objects keyed by year/month (reused across selections)
2. **Layer 2**: Selection flags overlay (reuses Layer 1's date refs)

### DayCell Memoization

Only 2-4 cells re-render on a day tap instead of all 42:

```ts
const dayCellPropsEqual = (prev, next) => {
  // Compares primitives, not object references
  return (
    prev.info.date === next.info.date &&
    prev.info.isSelected === next.info.isSelected &&
    // ... other flags
  );
};
```

## Best Practices

### Select Primitives

```tsx
// ✅ Good - primitive, stable comparison
const systemId = useCalendarSelector(s => s.system.id);

// ❌ Less optimal - new object every system change
const system = useCalendarSelector(s => s.system);
```

### Stable Prop References

```tsx
// ❌ Bad - new array every render
<Calendar.Root
  disabledDates={[new Date()]}
  modifiers={{ weekend: isWeekend }}
/>

// ✅ Good - stable reference
const DISABLED_DATES = [new Date('2024-12-25')];
const MODIFIERS = {
  weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
};

<Calendar.Root
  disabledDates={DISABLED_DATES}
  modifiers={MODIFIERS}
/>

// ✅ Also good - useMemo
const modifiers = useMemo(() => ({
  booked: bookedDates,
}), [bookedDates]);
```

### Avoid Spreading Info

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

### Use Stable Callbacks

```tsx
// ✅ Good - stable identity
const store = useCalendarStore();
<DayCell onSelect={store.selectDate} />

// ❌ Bad - new function every render
<DayCell onSelect={(date) => store.selectDate(date)} />
```

## Profiling

Use React DevTools Profiler to identify performance issues:

```tsx
import { Profiler } from 'react';

function onRender(id, phase, actualDuration) {
  console.log(`${id} render: ${actualDuration}ms (${phase})`);
}

<Profiler id="Calendar" onRender={onRender}>
  <Calendar.Root mode="single">
    <Calendar.DayGrid />
  </Calendar.Root>
</Profiler>
```

## Common Pitfalls

### Inline Arrow Functions

```tsx
// ❌ Bad
renderDay={(info) => <Cell info={info} />}

// ✅ Good - define outside render
const renderDay = useCallback((info) => <Cell info={info} />, []);
<DayGrid renderDay={renderDay} />
```

### Computing in Render

```tsx
// ❌ Bad - computed every render
const cellInfos = cells.map(c => computeInfo(c));

// ✅ Good - useMemo
const cellInfos = useMemo(
  () => cells.map(c => computeInfo(c)),
  [cells, selectionDeps]
);
```

### Unnecessary useCalendarSelector

```tsx
// ❌ Bad - subscribes to everything
const snapshot = useCalendarSelector(s => s);

// ✅ Good - specific slice
const selectedDate = useCalendarSelector(s => s.selectedDate);
```

## Large Lists

For very long vertical lists:

```tsx
// Use FlashList's windowSize
<FlashList
  data={months}
  windowSize={5} // Render 5 screens worth
  maxToRenderPerBatch={10}
  initialNumToRender={5}
/>
```

## Memory Management

The store holds references to:
- Current snapshot
- Disabled dates/ranges
- Selected dates

Clean up when unmounting (though React typically handles this):

```tsx
useEffect(() => {
  return () => {
    // Any custom cleanup
  };
}, []);
```
