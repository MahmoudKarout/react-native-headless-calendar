import { View, Text } from 'react-native';
import { IconButton } from '../Button/Button';
import {
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-headless-calendar';

export function Header() {
  const { goPrevMonth, goNextMonth } = useSingleCalendarActions();
  const displayedMonthLabel = useSingleCalendarSelector(
    (s) => s.days.displayedMonthLabel
  );
  const displayedYearLabel = useSingleCalendarSelector(
    (s) => s.days.displayedYearLabel
  );
  const systemId = useSingleCalendarSelector((s) => s.system.id);

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
