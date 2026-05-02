/**
 * Calendar.MonthGrid — 4x3 grid of month names.
 *
 * Renders the active system's month labels. Tapping a cell jumps to that
 * month and switches back to the day view.
 *
 * Per-cell React.memo + stable props means flipping the active month
 * re-renders only the 2 affected cells.
 */
import React, { memo, useCallback, useMemo } from 'react';

import {
  useCalendarConfig,
  useCalendarPrimitives,
  useCalendarSelector,
  useCalendarStore,
  useCalendarTheme,
} from '../context';

interface MonthCellProps {
  index: number;
  label: string;
  isActive: boolean;
  onSelect: (index: number) => void;
}

function MonthCellComponent({
  index,
  label,
  isActive,
  onSelect,
}: MonthCellProps) {
  const { Pressable, Text } = useCalendarPrimitives();
  const theme = useCalendarTheme();
  const { testID } = useCalendarConfig();

  const onPress = useCallback(() => onSelect(index), [onSelect, index]);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={{
        width: `${100 / 3}%`,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isActive ? theme.colors.primary : 'transparent',
        borderRadius: theme.borderRadius,
      }}
      testID={testID ? `${testID}.calendar.month.${index}` : undefined}
    >
      <Text
        style={{
          color: isActive ? theme.colors.onPrimary : theme.colors.text,
          fontSize: theme.fontSize.day,
          fontWeight: isActive ? '600' : '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
const MonthCell = memo(MonthCellComponent);
MonthCell.displayName = 'Calendar.MonthCell';

const MonthGridComponent: React.FC = () => {
  const { View } = useCalendarPrimitives();
  const store = useCalendarStore();

  const months = useCalendarSelector((s) => s.system.monthLabels());
  const activeMonth = useCalendarSelector((s) => s.system.month(s.displayed));

  const onSelect = useCallback((idx: number) => store.goToMonth(idx), [store]);

  // Cell list is stable across selection changes.
  const cells = useMemo(
    () =>
      months.map((label, idx) => ({
        label,
        idx,
      })),
    [months]
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
      }}
    >
      {cells.map((c) => (
        <MonthCell
          index={c.idx}
          isActive={c.idx === activeMonth}
          key={c.idx}
          label={c.label}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
};

export const MonthGrid = memo(MonthGridComponent);
MonthGrid.displayName = 'Calendar.MonthGrid';
