---
sidebar_position: 11
---

# Wheel Date Picker

An iOS-style drum-roll wheel picker with three independent columns: **day**, **month**, and **year**.

import CalendarDemo from '@site/src/components/CalendarDemo';

## Interactive Demo

Drag any column up or down to spin it. The selected item scales up and the rows towards the edges fade out. Spring physics snap the column to the nearest value on release.

<CalendarDemo wheel />

## Features

- Smooth pan + spring-snap physics via `Gesture.Pan`
- Per-item scale and opacity driven by Reanimated shared values
- Rubber-band resistance at the list boundaries
- Vertically-faded edges (no extra deps — stacked translucent Views)
- Automatically clamps the day when the month or year change

## Dependencies

```bash
npm install react-native-reanimated react-native-gesture-handler
```

Add the Reanimated Babel plugin to `babel.config.js` (skip if you use `babel-preset-expo` ≥ SDK 50, which includes it automatically):

```js
module.exports = {
  plugins: ['react-native-reanimated/plugin'],
};
```

Wrap your root component with `GestureHandlerRootView`:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <YourApp />
    </GestureHandlerRootView>
  );
}
```

## Full Implementation

### Constants and helpers

```tsx
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

const ITEM_H = 52;
const VISIBLE = 5;
const WHEEL_H = ITEM_H * VISIBLE;
const CENTER = Math.floor(VISIBLE / 2) * ITEM_H;

const SPRING = {
  damping: 38,
  stiffness: 260,
  mass: 0.85,
  overshootClamping: true,
};

const MONTH_LABELS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}
```

### WheelItem — animated row

Each row reads from the column's shared `offset` value to independently scale and fade:

```tsx
const WheelItem = memo(function WheelItem({ label, index, offset }) {
  const animStyle = useAnimatedStyle(() => {
    const dist = Math.abs(offset.value - index * ITEM_H);
    return {
      opacity: interpolate(dist, [0, ITEM_H, ITEM_H * 2], [1, 0.5, 0.18], 'clamp'),
      transform: [
        { scale: interpolate(dist, [0, ITEM_H, ITEM_H * 2], [1.14, 0.9, 0.7], 'clamp') },
      ],
    };
  });

  return (
    <Animated.View style={[{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }, animStyle]}>
      <Text style={{ fontSize: 19, color: '#FAFAFA' }}>{label}</Text>
    </Animated.View>
  );
});
```

### FadeOverlay — gradient edges without a gradient library

Stacking thin `View` layers with increasing opacity approximates a `LinearGradient`:

```tsx
function FadeOverlay({ edge, color }) {
  const STEPS = 10;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        [edge]: 0,
        left: 0,
        right: 0,
        height: CENTER,
        zIndex: 10,
        flexDirection: edge === 'top' ? 'column' : 'column-reverse',
      }}
    >
      {Array.from({ length: STEPS }, (_, i) => {
        const t = edge === 'top'
          ? (STEPS - 1 - i) / (STEPS - 1)
          : i / (STEPS - 1);
        return (
          <View
            key={i}
            style={{ flex: 1, backgroundColor: color, opacity: t ** 1.6 }}
          />
        );
      })}
    </View>
  );
}
```

### WheelColumn — gesture + physics

`Gesture.Pan` translates the list container. On release, the velocity projects the landing position and `withSpring` snaps to the nearest item:

```tsx
function WheelColumn({ items, selectedIndex, onIndexChange, width }) {
  const offset    = useSharedValue(selectedIndex * ITEM_H);
  const dragStart = useSharedValue(0);
  const itemCount = useSharedValue(items.length);

  useEffect(() => { itemCount.value = items.length; }, [items.length]);

  // Animate to a new index when the parent changes it (e.g. day clamped on month change)
  const prev = useRef(selectedIndex);
  useEffect(() => {
    if (prev.current !== selectedIndex) {
      prev.current = selectedIndex;
      offset.value = withSpring(selectedIndex * ITEM_H, SPRING);
    }
  }, [selectedIndex]);

  const gesture = Gesture.Pan()
    .onBegin(() => { dragStart.value = offset.value; })
    .onUpdate((e) => {
      'worklet';
      const raw    = dragStart.value - e.translationY;
      const maxOff = (itemCount.value - 1) * ITEM_H;
      // Rubber-band at edges
      offset.value = raw < 0
        ? raw * 0.25
        : raw > maxOff
          ? maxOff + (raw - maxOff) * 0.25
          : raw;
    })
    .onEnd((e) => {
      'worklet';
      const proj = offset.value + (-e.velocityY) * 0.18;
      const snap = Math.round(
        Math.max(0, Math.min(proj / ITEM_H, itemCount.value - 1))
      );
      offset.value = withSpring(snap * ITEM_H, SPRING);
      runOnJS(onIndexChange)(snap);
    });

  const listStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -offset.value + CENTER }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ height: WHEEL_H, overflow: 'hidden', flex: 1, ...(width ? { width } : {}) }}>
        {/* Selection separator lines */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: CENTER, left: 10, right: 10, height: ITEM_H,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(250,250,250,0.1)',
            zIndex: 5,
          }}
        />
        {/* Items */}
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, listStyle]}>
          {items.map((label, i) => (
            <WheelItem key={`${label}-${i}`} label={label} index={i} offset={offset} />
          ))}
        </Animated.View>
        <FadeOverlay edge="top"    color="#27272A" />
        <FadeOverlay edge="bottom" color="#27272A" />
      </View>
    </GestureDetector>
  );
}
```

### WheelDatePicker — three-column composition

```tsx
function WheelDatePicker({ value, onChange, minYear = 1924, maxYear = 2124 }) {
  const seed = value ?? new Date();
  const [dayIdx,   setDayIdx]   = useState(seed.getDate() - 1);
  const [monthIdx, setMonthIdx] = useState(seed.getMonth());
  const [yearIdx,  setYearIdx]  = useState(seed.getFullYear() - minYear);

  const years   = Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(minYear + i));
  const numDays = daysInMonth(monthIdx, minYear + yearIdx);
  const days    = Array.from({ length: numDays }, (_, i) => String(i + 1).padStart(2, '0'));

  const clampedDay = Math.min(dayIdx, numDays - 1);

  const emit = useCallback((d, m, y) => {
    const safeDay = Math.min(d + 1, daysInMonth(m, minYear + y));
    onChange?.(new Date(minYear + y, m, safeDay));
  }, [onChange, minYear]);

  const handleDay = useCallback((i) => {
    setDayIdx(i);
    emit(i, monthIdx, yearIdx);
  }, [monthIdx, yearIdx, emit]);

  const handleMonth = useCallback((i) => {
    setMonthIdx(i);
    const clamped = Math.min(dayIdx, daysInMonth(i, minYear + yearIdx) - 1);
    setDayIdx(clamped);
    emit(clamped, i, yearIdx);
  }, [dayIdx, yearIdx, emit, minYear]);

  const handleYear = useCallback((i) => {
    setYearIdx(i);
    const clamped = Math.min(dayIdx, daysInMonth(monthIdx, minYear + i) - 1);
    setDayIdx(clamped);
    emit(clamped, monthIdx, i);
  }, [dayIdx, monthIdx, emit, minYear]);

  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#27272A', borderRadius: 16, overflow: 'hidden' }}>
      <WheelColumn items={days}         selectedIndex={clampedDay} onIndexChange={handleDay}   width={64} />
      <WheelColumn items={MONTH_LABELS} selectedIndex={monthIdx}   onIndexChange={handleMonth} />
      <WheelColumn items={years}        selectedIndex={yearIdx}    onIndexChange={handleYear}  width={72} />
    </View>
  );
}
```

## How the animations work

### Scale + opacity per item

Every `WheelItem` runs a `useAnimatedStyle` worklet on the UI thread. The worklet reads the column's `offset` shared value (updated by the pan gesture) and computes:

| Distance from center | Scale | Opacity |
|---|---|---|
| 0 px (selected) | 1.14× | 1.0 |
| 1 row away | 0.90× | 0.50 |
| 2+ rows away | 0.70× | 0.18 |

`interpolate(..., 'clamp')` ensures the values never go below the final keyframe.

### Spring snap

On gesture release the velocity is projected forward (`velocity × 0.18 s`) to find the natural landing row. `withSpring` then animates the `offset` to that row's exact pixel position, giving the characteristic quick-settle feel.

### Rubber-band resistance

When the user drags past the first or last item, the `onUpdate` worklet scales the excess translation by `0.25` — the same coefficient iOS uses for its own scroll resistance.

### Fade edges

`FadeOverlay` stacks 10 thin `View` layers using a power curve (`t^1.6`) to approximate a smooth gradient without importing `expo-linear-gradient` or any other library.

## Customisation tips

- **Item height** — change `ITEM_H`. `VISIBLE`, `WHEEL_H`, and `CENTER` derive from it automatically.
- **Number of visible rows** — change `VISIBLE` (use an odd number to keep the selection centered).
- **Spring feel** — increase `stiffness` for snappier snap; decrease `damping` for a bouncier feel (disable `overshootClamping` too).
- **Velocity multiplier** — `0.18` in the `onEnd` worklet controls how far momentum carries. Increase for a more "flywheel" feel.
- **Colors** — swap `C.surface` in `FadeOverlay` to match your background so the fade blends seamlessly.
