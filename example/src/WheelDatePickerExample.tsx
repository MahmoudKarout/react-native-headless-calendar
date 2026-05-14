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
 *
 * Styling is fully driven by Uniwind utilities, except for the few
 * inline transforms that depend on runtime Reanimated values.
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
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
import { useResolveClassNames } from 'uniwind';

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

// Surface colour used by the column fade overlays — needs to match the
// wheel's background. Resolved from the `--color-surface-muted` token at
// render time so light/dark themes both look right.
const SURFACE_FADE_LIGHT = '#f1f5f9';
const SURFACE_FADE_DARK = '#1f2937';

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
    <Animated.View
      className="items-center justify-center"
      style={[{ height: ITEM_H }, animStyle]}
    >
      <Text className="text-foreground text-lg font-normal tracking-wide">
        {label}
      </Text>
    </Animated.View>
  );
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
      className={`absolute inset-x-0 z-10 ${edge === 'top' ? 'top-0 flex-col' : 'bottom-0 flex-col-reverse'}`}
      style={{ height: CENTER }}
    >
      {Array.from({ length: STEPS }, (_, i) => {
        const t =
          edge === 'top' ? (STEPS - 1 - i) / (STEPS - 1) : i / (STEPS - 1);
        return (
          <View
            key={i}
            className="flex-1"
            style={{ backgroundColor: color, opacity: t ** 1.6 }}
          />
        );
      })}
    </View>
  );
}

// ─── WheelColumn ─────────────────────────────────────────────────────────────

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onIndexChange: (i: number) => void;
  /** Fixed pixel width; omit to allow flex growth. */
  width?: number;
  /** Fade colour (must match the wheel's background). */
  fadeColor: string;
}

function WheelColumn({
  items,
  selectedIndex,
  onIndexChange,
  width,
  fadeColor,
}: WheelColumnProps) {
  const offset = useSharedValue(selectedIndex * ITEM_H);
  const dragStart = useSharedValue(0);
  const itemCount = useSharedValue<number>(items.length);

  useEffect(() => {
    itemCount.set(items.length);
  }, [items.length, itemCount]);

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
      const proj = offset.get() + -e.velocityY * 0.18;
      const snap = Math.round(
        Math.max(0, Math.min(proj / ITEM_H, itemCount.get() - 1))
      );
      offset.set(withSpring(snap * ITEM_H, SPRING));
      scheduleOnRN(onIndexChange, snap);
    });

  const listStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -offset.get() + CENTER }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        className="overflow-hidden flex-1"
        style={[{ height: WHEEL_H }, width != null ? { width } : undefined]}
      >
        {/* Selection-row separator lines */}
        <View
          pointerEvents="none"
          className="absolute left-2.5 right-2.5 z-[5] border-y-hairline border-foreground/10"
          style={{ top: CENTER, height: ITEM_H }}
        />

        {/* Scrollable item list */}
        <Animated.View className="absolute inset-x-0 top-0" style={listStyle}>
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
        <FadeOverlay edge="top" color={fadeColor} />
        <FadeOverlay edge="bottom" color={fadeColor} />
      </View>
    </GestureDetector>
  );
}

// ─── WheelDatePicker ─────────────────────────────────────────────────────────

export interface WheelDatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  minYear?: number;
  maxYear?: number;
  /** Fade colour for the column edge overlays. */
  fadeColor: string;
}

export function WheelDatePicker({
  value,
  onChange,
  minYear = 1924,
  maxYear = 2124,
  fadeColor,
}: WheelDatePickerProps) {
  const seed = value ?? new Date();

  const [dayIdx, setDayIdx] = useState(seed.getDate() - 1);
  const [monthIdx, setMonthIdx] = useState(seed.getMonth());
  const [yearIdx, setYearIdx] = useState(seed.getFullYear() - minYear);

  const years = buildYears(minYear, maxYear);
  const numDays = daysInMonth(monthIdx, minYear + yearIdx);
  const days = buildDays(numDays);

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
    <View className="flex-row bg-surface-muted rounded-2xl overflow-hidden">
      <WheelColumn
        items={days}
        selectedIndex={clampedDay}
        onIndexChange={handleDay}
        width={64}
        fadeColor={fadeColor}
      />
      <WheelColumn
        items={MONTH_LABELS}
        selectedIndex={monthIdx}
        onIndexChange={handleMonth}
        fadeColor={fadeColor}
      />
      <WheelColumn
        items={years}
        selectedIndex={yearIdx}
        onIndexChange={handleYear}
        width={72}
        fadeColor={fadeColor}
      />
    </View>
  );
}

// ─── Demo screen ─────────────────────────────────────────────────────────────

export default function WheelDatePickerExample() {
  const [date, setDate] = useState(() => new Date());
  const rootStyle = useResolveClassNames(
    'flex-1 bg-background px-6 justify-center'
  );

  // The fade colour must match the wheel surface so the edges blend in
  // seamlessly. We pick light or dark based on the current scheme; a
  // single hex pair is enough since there is no in-between state.
  const isDark = useIsDarkTheme();
  const fadeColor = isDark ? SURFACE_FADE_DARK : SURFACE_FADE_LIGHT;

  return (
    <GestureHandlerRootView style={rootStyle}>
      <Text className="text-2xl font-bold text-foreground mb-1.5">
        Wheel Date Picker
      </Text>
      <Text className="text-sm text-muted mb-8">
        iOS-style drum-roll — day · month · year
      </Text>

      <View className="rounded-[20px] border-hairline border-border overflow-hidden mb-5">
        <WheelDatePicker
          value={date}
          onChange={setDate}
          fadeColor={fadeColor}
        />
      </View>

      <View className="bg-surface-muted rounded-[14px] p-4 border-hairline border-border">
        <Text className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-1.5">
          Selected date
        </Text>
        <Text className="text-base font-medium text-foreground">
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

// ─── theme helper ────────────────────────────────────────────────────────────

import { useUniwind } from 'uniwind';

function useIsDarkTheme() {
  const { theme } = useUniwind();
  return theme === 'dark';
}
