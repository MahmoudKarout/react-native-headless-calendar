import { memo, useCallback } from 'react';
import { Pressable, Text } from 'react-native';
import type { MultipleDayCellInfo } from 'react-native-fast-calendar';
import { tv } from 'tailwind-variants/lite';

export const CELL_SIZE = 42;

interface DayCellProps {
  cell: MultipleDayCellInfo;
  onPress: (cell: MultipleDayCellInfo) => void;
}

const dayCellTextVariant = tv({
  base: 'text-[14px] font-medium',
  variants: {
    isCurrentMonth: {
      true: 'text-foreground',
      false: 'text-muted opacity-50',
    },
    isSelected: {
      true: 'font-semibold text-on-primary',
    },
    isDisabled: {
      true: 'text-muted line-through',
    },
  },
});

const dayCellVariant = tv({
  base: 'items-center justify-center w-[42px] h-[42px] rounded-[100px]',
  variants: {
    isToday: { true: 'bg-surface-muted' },
    isSelected: { true: 'bg-primary' },
    isDisabled: { true: 'opacity-40' },
  },
});

export const DayCell = memo(function DayCell({ cell, onPress }: DayCellProps) {
  const handlePress = useCallback(() => onPress(cell), [cell, onPress]);
  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={handlePress}
      className={dayCellVariant(cell)}
    >
      <Text className={dayCellTextVariant(cell)}>{cell.label}</Text>
    </Pressable>
  );
});
