/**
 * Wheel Date Picker
 *
 * An iOS-style drum-roll picker with three columns: day · month · year.
 * Built with react-native-reanimated and react-native-gesture-handler.
 *
 * Features
 *   - Smooth pan + spring-snap physics via Gesture.Pan
 *   - Per-item scale + opacity driven by Reanimated shared values
 *   - Boundary rubber-band resistance
 *   - Vertically-faded edges (no extra deps — stacked translucent Views)
 *   - Automatically clamps day when month / year change
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

// ─── constants ───────────────────────────────────────────────────────────────

const ITEM_H = 52;
const VISIBLE = 5;
const WHEEL_H = ITEM_H * VISIBLE;
const CENTER = Math.floor(VISIBLE / 2) * ITEM_H; // px from top to selected row

const SPRING = {
  damping: 38,
  stiffness: 260,
  mass: 0.85,
  overshootClamping: true,
} as const;

// ─── palette ─────────────────────────────────────────────────────────────────

const C = {
  bg: '#18181B',
  surface: '#27272A',
  fg: '#FAFAFA',
  muted: '#A1A1AA',
  border: '#3F3F46',
  sep: 'rgba(250,250,250,0.1)',
} as const;

// ─── data helpers ─────────────────────────────────────────────────────────────

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function buildDays(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    String(i + 1).padStart(2, '0')
  );
}

function buildYears(from: number, to: number): string[] {
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
}

// ─── WheelItem ────────────────────────────────────────────────────────────────

interface WheelItemProps {
  label: string;
  index: number;
  offset: SharedValue<number>;
}

const WheelItem = memo(function WheelItem({
  label,
  index,
  offset,
}: WheelItemProps) {
  const animStyle = useAnimatedStyle(() => {
    const dist = Math.abs(offset.get() - index * ITEM_H);
    return {
      opacity: interpolate(
        dist,
        [0, ITEM_H, ITEM_H * 2],
        [1, 0.5, 0.18],
        'clamp'
      ),
      transform: [
        {
          scale: interpolate(
            dist,
            [0, ITEM_H, ITEM_H * 2],
            [1.14, 0.9, 0.7],
            'clamp'
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[itemS.wrap, animStyle]}>
      <Text style={itemS.text}>{label}</Text>
    </Animated.View>
  );
});

const itemS = StyleSheet.create({
  wrap: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 19,
    fontWeight: '400',
    color: C.fg,
    letterSpacing: 0.3,
  },
});

// ─── FadeOverlay ─────────────────────────────────────────────────────────────
// Simulates a linear gradient fade using stacked translucent View layers.
// No extra dependencies required.

function FadeOverlay({
  edge,
  color,
}: {
  edge: 'top' | 'bottom';
  color: string;
}) {
  const STEPS = 10;
  return (
    <View
      pointerEvents="none"
      style={[fadeS.base, edge === 'top' ? fadeS.top : fadeS.bottom]}
    >
      {Array.from({ length: STEPS }, (_, i) => {
        const t =
          edge === 'top' ? (STEPS - 1 - i) / (STEPS - 1) : i / (STEPS - 1);
        return (
          <View
            key={i}
            style={[fadeS.layer, { backgroundColor: color, opacity: t ** 1.6 }]}
          />
        );
      })}
    </View>
  );
}

const fadeS = StyleSheet.create({
  base: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: CENTER,
    zIndex: 10,
  },
  top: { top: 0, flexDirection: 'column' },
  bottom: { bottom: 0, flexDirection: 'column-reverse' },
  layer: { flex: 1 },
});

// ─── WheelColumn ─────────────────────────────────────────────────────────────

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onIndexChange: (i: number) => void;
  /** Fixed pixel width; omit to allow flex growth. */
  width?: number;
}

function WheelColumn({
  items,
  selectedIndex,
  onIndexChange,
  width,
}: WheelColumnProps) {
  const offset = useSharedValue(selectedIndex * ITEM_H);
  const dragStart = useSharedValue(0);
  // Keep items.length accessible inside worklets without capturing stale closure
  const itemCount = useSharedValue<number>(items.length);

  useEffect(() => {
    itemCount.set(items.length);
  }, [items.length, itemCount]);

  // Animate to new selectedIndex whenever the parent changes it
  const prevSelected = useRef(selectedIndex);
  useEffect(() => {
    if (prevSelected.current !== selectedIndex) {
      prevSelected.current = selectedIndex;
      offset.set(withSpring(selectedIndex * ITEM_H, SPRING));
    }
  }, [selectedIndex, offset]);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      dragStart.set(offset.get());
    })
    .onUpdate((e) => {
      'worklet';
      const raw = dragStart.get() - e.translationY;
      const maxOff = (itemCount.get() - 1) * ITEM_H;
      // Rubber-band resistance beyond edges
      offset.set(
        raw < 0
          ? raw * 0.25
          : raw > maxOff
            ? maxOff + (raw - maxOff) * 0.25
            : raw
      );
    })
    .onEnd((e) => {
      'worklet';
      // Project forward by a fraction of velocity to determine target item
      const proj = offset.get() + -e.velocityY * 0.18;
      const snap = Math.round(
        Math.max(0, Math.min(proj / ITEM_H, itemCount.get() - 1))
      );
      offset.set(withSpring(snap * ITEM_H, SPRING));
      scheduleOnRN(onIndexChange, snap);
    });

  // The list container is translated so item[selectedIndex] sits at CENTER
  const listStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -offset.get() + CENTER }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={[colS.outer, width != null ? { width } : undefined]}>
        {/* Selection-row separator lines */}
        <View pointerEvents="none" style={colS.selector} />

        {/* Scrollable item list */}
        <Animated.View style={[colS.list, listStyle]}>
          {items.map((label, i) => (
            <WheelItem
              key={`${label}-${i}`}
              label={label}
              index={i}
              offset={offset}
            />
          ))}
        </Animated.View>

        {/* Fade edges */}
        <FadeOverlay edge="top" color={C.surface} />
        <FadeOverlay edge="bottom" color={C.surface} />
      </View>
    </GestureDetector>
  );
}

const colS = StyleSheet.create({
  outer: {
    height: WHEEL_H,
    overflow: 'hidden',
    flex: 1,
  },
  list: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  selector: {
    position: 'absolute',
    top: CENTER,
    left: 10,
    right: 10,
    height: ITEM_H,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: C.sep,
    zIndex: 5,
  },
});

// ─── WheelDatePicker ─────────────────────────────────────────────────────────

export interface WheelDatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  minYear?: number;
  maxYear?: number;
}

export function WheelDatePicker({
  value,
  onChange,
  minYear = 1924,
  maxYear = 2124,
}: WheelDatePickerProps) {
  const seed = value ?? new Date();

  const [dayIdx, setDayIdx] = useState(seed.getDate() - 1);
  const [monthIdx, setMonthIdx] = useState(seed.getMonth());
  const [yearIdx, setYearIdx] = useState(seed.getFullYear() - minYear);

  const years = buildYears(minYear, maxYear);
  const numDays = daysInMonth(monthIdx, minYear + yearIdx);
  const days = buildDays(numDays);

  // Clamp day to valid range whenever month / year change
  const clampedDay = Math.min(dayIdx, numDays - 1);

  const emit = useCallback(
    (d: number, m: number, y: number) => {
      const safeDay = Math.min(d + 1, daysInMonth(m, minYear + y));
      onChange?.(new Date(minYear + y, m, safeDay));
    },
    [onChange, minYear]
  );

  const handleDay = useCallback(
    (i: number) => {
      setDayIdx(i);
      emit(i, monthIdx, yearIdx);
    },
    [monthIdx, yearIdx, emit]
  );

  const handleMonth = useCallback(
    (i: number) => {
      setMonthIdx(i);
      const clamped = Math.min(dayIdx, daysInMonth(i, minYear + yearIdx) - 1);
      setDayIdx(clamped);
      emit(clamped, i, yearIdx);
    },
    [dayIdx, yearIdx, emit, minYear]
  );

  const handleYear = useCallback(
    (i: number) => {
      setYearIdx(i);
      const clamped = Math.min(dayIdx, daysInMonth(monthIdx, minYear + i) - 1);
      setDayIdx(clamped);
      emit(clamped, monthIdx, i);
    },
    [dayIdx, monthIdx, emit, minYear]
  );

  return (
    <View style={pickerS.root}>
      <WheelColumn
        items={days}
        selectedIndex={clampedDay}
        onIndexChange={handleDay}
        width={64}
      />
      <WheelColumn
        items={MONTH_LABELS}
        selectedIndex={monthIdx}
        onIndexChange={handleMonth}
      />
      <WheelColumn
        items={years}
        selectedIndex={yearIdx}
        onIndexChange={handleYear}
        width={72}
      />
    </View>
  );
}

const pickerS = StyleSheet.create({
  root: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
});

// ─── Demo screen ─────────────────────────────────────────────────────────────

export default function WheelDatePickerExample() {
  const [date, setDate] = useState(() => new Date());

  return (
    <GestureHandlerRootView style={demoS.root}>
      <Text style={demoS.title}>Wheel Date Picker</Text>
      <Text style={demoS.sub}>iOS-style drum-roll — day · month · year</Text>

      <View style={demoS.card}>
        <WheelDatePicker value={date} onChange={setDate} />
      </View>

      <View style={demoS.result}>
        <Text style={demoS.resultLabel}>Selected date</Text>
        <Text style={demoS.resultValue}>
          {date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>
    </GestureHandlerRootView>
  );
}

const demoS = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: C.fg,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: C.muted,
    marginBottom: 32,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  result: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '500',
    color: C.fg,
  },
});
