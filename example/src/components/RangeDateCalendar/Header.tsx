import { View, Text } from 'react-native';
import { IconButton } from '../Button/Button';
import {
  useRangeCalendarActions,
  useRangeCalendarSelector,
} from 'react-native-fast-calendar';

export function Header() {
  const { goPrevMonth, goNextMonth } = useRangeCalendarActions();
  const displayedMonthLabel = useRangeCalendarSelector(
    (s) => s.days.displayedMonthLabel
  );
  const displayedYearLabel = useRangeCalendarSelector(
    (s) => s.days.displayedYearLabel
  );
  const systemId = useRangeCalendarSelector((s) => s.system.id);
  return (
    <View className="flex-row items-center justify-between mb-2">
      <IconButton onPress={goPrevMonth} label="‹" />
      <View className="items-center">
        <Text className="text-foreground text-sm font-semibold">
          {displayedMonthLabel} {displayedYearLabel}
        </Text>
        <Text className="text-muted text-[10px] font-medium tracking-widest uppercase mt-0.5">
          {systemId}
        </Text>
      </View>
      <IconButton onPress={goNextMonth} label="›" />
    </View>
  );
}
