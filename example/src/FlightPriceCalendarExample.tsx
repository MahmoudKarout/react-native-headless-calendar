/**
 * Flight-price range calendar — shadcn-style. Fares are painted into a
 * custom cell renderer driven by `useCalendarSelector(selectDays)`.
 *
 * Wrapped in a `ScopedTheme` so the demo always renders against the dark
 * palette regardless of the surrounding app theme.
 */
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ScopedTheme } from 'uniwind';
import {
  CalendarProvider,
  selectCanConfirm,
  selectDays,
  useCalendarActions,
  useCalendarSelector,
  type DayCellInfo,
} from 'react-native-fast-calendar';

const SEED = 7919;
function priceFor(date: Date): number {
  const k = date.getFullYear() * 372 + date.getMonth() * 31 + date.getDate();
  return 79 + ((k * SEED) % 281);
}

const CELL_W = 48;
const CELL_H = 56;

function PriceCalendar() {
  const days = useCalendarSelector(selectDays);
  const actions = useCalendarActions();
  const rangeStart = useCalendarSelector((s) => s.rangeStart);
  const rangeEnd = useCalendarSelector((s) => s.rangeEnd);
  const canConfirm = useCalendarSelector(selectCanConfirm);

  return (
    <View className="bg-card border-hairline border-border rounded-xl p-4">
      <View className="flex-row items-center justify-between mb-2">
        <IconButton onPress={actions.goPrevMonth} label="‹" />
        <View className="items-center">
          <Text className="text-foreground text-sm font-semibold">
            {days.displayedMonthLabel} {days.displayedYearLabel}
          </Text>
          <Text className="text-muted text-[10px] font-medium tracking-widest uppercase mt-0.5">
            fares per night
          </Text>
        </View>
        <IconButton onPress={actions.goNextMonth} label="›" />
      </View>

      <View className="items-center">
        <View className="flex-row mb-1" style={{ width: CELL_W * 7 }}>
          {days.weekdayLabels.map((l) => (
            <Text
              key={l}
              className="text-muted text-[11px] font-medium tracking-widest text-center uppercase"
              style={{ width: CELL_W }}
            >
              {l.slice(0, 2)}
            </Text>
          ))}
        </View>

        <View className="flex-row flex-wrap" style={{ width: CELL_W * 7 }}>
          {days.cells.map((cell) => (
            <PriceCell
              key={cell.nativeDate.toISOString()}
              cell={cell}
              onPress={() => actions.selectDate(cell.date)}
            />
          ))}
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-4 pt-4 border-t-hairline border-border">
        <Text className="text-muted text-xs font-medium">
          {rangeStart && rangeEnd
            ? 'Range complete'
            : rangeStart
              ? 'Pick the return flight'
              : 'Pick the departure flight'}
        </Text>
        <Pressable
          onPress={actions.confirm}
          disabled={!canConfirm}
          className="px-4 py-2 rounded-md bg-primary disabled:bg-surface-muted"
        >
          <Text
            className={`text-[13px] font-semibold ${canConfirm ? 'text-on-primary' : 'text-muted'}`}
          >
            Confirm
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function IconButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center w-7 h-7 rounded-md border-hairline border-border active:bg-surface-muted"
    >
      <Text className="text-foreground text-base font-medium leading-4">
        {label}
      </Text>
    </Pressable>
  );
}

interface PriceCellProps {
  cell: DayCellInfo;
  onPress: () => void;
}

function PriceCell({ cell, onPress }: PriceCellProps) {
  const price = priceFor(cell.nativeDate);
  const isRangeMiddle = cell.inRange && !cell.isRangeStart && !cell.isRangeEnd;

  const stateClass = [
    'items-center justify-center',
    !cell.isCurrentMonth && 'opacity-35',
    isRangeMiddle ? 'bg-surface-muted rounded-none' : 'rounded-md',
    cell.isRangeStart && 'bg-primary rounded-r-none',
    cell.isRangeEnd && 'bg-primary rounded-l-none',
    cell.isSelected && 'bg-primary',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={onPress}
      className={stateClass}
      style={{ width: CELL_W, height: CELL_H }}
    >
      <Text
        className={`text-[13px] font-semibold ${cell.isSelected ? 'text-on-primary' : 'text-foreground'}`}
      >
        {cell.label}
      </Text>
      <Text
        className={`text-[10px] mt-0.5 ${cell.isSelected ? 'text-on-primary opacity-70' : 'text-muted'}`}
      >
        ${price}
      </Text>
    </Pressable>
  );
}

export default function FlightPriceCalendarExample() {
  const today = useMemo(() => new Date(), []);
  return (
    <ScopedTheme theme="dark">
      <ScrollView className="bg-background" contentContainerClassName="p-4">
        <CalendarProvider mode="range" minDate={today}>
          <PriceCalendar />
        </CalendarProvider>
      </ScrollView>
    </ScopedTheme>
  );
}
