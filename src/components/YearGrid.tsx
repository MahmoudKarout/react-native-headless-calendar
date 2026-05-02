/**
 * Calendar.YearGrid — paginated 4x3 grid of years.
 *
 * The window of 12 years is centered on the displayed year. Use the
 * <Calendar.Header.PrevButton /> / <Calendar.Header.NextButton /> to page.
 */
import React, { memo, useCallback, useMemo } from 'react';

import {
  useCalendarConfig,
  useCalendarPrimitives,
  useCalendarSelector,
  useCalendarStore,
  useCalendarTheme,
} from '../context';
import { getYearPage } from '../utils/grid';

interface YearCellProps {
  year: number;
  isActive: boolean;
  onSelect: (year: number) => void;
}

function YearCellComponent({ year, isActive, onSelect }: YearCellProps) {
  const { Pressable, Text } = useCalendarPrimitives();
  const theme = useCalendarTheme();
  const { testID } = useCalendarConfig();

  const onPress = useCallback(() => onSelect(year), [onSelect, year]);

  return (
    <Pressable
      accessibilityLabel={String(year)}
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
      testID={testID ? `${testID}.calendar.year.${year}` : undefined}
    >
      <Text
        style={{
          color: isActive ? theme.colors.onPrimary : theme.colors.text,
          fontSize: theme.fontSize.day,
          fontWeight: isActive ? '600' : '500',
        }}
      >
        {year}
      </Text>
    </Pressable>
  );
}
const YearCell = memo(YearCellComponent);
YearCell.displayName = 'Calendar.YearCell';

const YearGridComponent: React.FC = () => {
  const { View } = useCalendarPrimitives();
  const store = useCalendarStore();

  const currentYear = useCalendarSelector((s) => s.system.year(s.displayed));

  const years = useMemo(() => getYearPage(currentYear), [currentYear]);

  const onSelect = useCallback((year: number) => store.goToYear(year), [store]);

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
      }}
    >
      {years.map((year) => (
        <YearCell
          isActive={year === currentYear}
          key={year}
          onSelect={onSelect}
          year={year}
        />
      ))}
    </View>
  );
};

export const YearGrid = memo(YearGridComponent);
YearGrid.displayName = 'Calendar.YearGrid';
