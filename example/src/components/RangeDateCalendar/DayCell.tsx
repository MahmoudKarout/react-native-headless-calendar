import { memo, useCallback } from 'react';
import { Pressable, Text } from 'react-native';
import type { RangeDayCellInfo } from 'react-native-headless-calendar';
import { tv } from 'tailwind-variants/lite';

export const CELL_SIZE = 42;

interface DayCellProps {
  cell: RangeDayCellInfo;
  onPress: (cell: RangeDayCellInfo) => void;
}

type RangeState = 'default' | 'today' | 'inside' | 'start' | 'end' | 'single';

function getRangeState(cell: RangeDayCellInfo): RangeState {
  if (cell.isRangeStart && cell.isRangeEnd) return 'single';
  if (cell.isRangeStart) return 'start';
  if (cell.isRangeEnd) return 'end';
  if (cell.inRange) return 'inside';
  if (cell.isToday) return 'today';

  return 'default';
}

function isRangeEndpoint(state: RangeState) {
  return state === 'start' || state === 'end' || state === 'single';
}

const dayCellContainer = tv({
  base: 'items-center justify-center w-[42px] h-[42px]',
  variants: {
    state: {
      default: '',
      today: 'bg-surface-muted rounded-full',
      inside: 'bg-surface-muted',
      start: 'bg-primary rounded-l-full',
      end: 'bg-primary rounded-r-full',
      single: 'bg-primary rounded-full',
    },
    disabled: {
      true: 'opacity-40',
    },
  },
});

const dayCellText = tv({
  base: 'text-[14px] font-medium',
  variants: {
    month: {
      current: 'text-foreground',
      outside: 'text-muted opacity-50',
    },
    selected: {
      true: 'font-semibold text-on-primary',
    },
  },
});

export const DayCell = memo(function DayCell({ cell, onPress }: DayCellProps) {
  const handlePress = useCallback(() => {
    onPress(cell);
  }, [cell, onPress]);

  const state = getRangeState(cell);
  const selected = isRangeEndpoint(state);

  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={handlePress}
      className={dayCellContainer({
        state,
        disabled: cell.isDisabled,
      })}
    >
      <Text
        className={dayCellText({
          month: cell.isCurrentMonth ? 'current' : 'outside',
          selected,
        })}
      >
        {cell.label}
      </Text>
    </Pressable>
  );
});
