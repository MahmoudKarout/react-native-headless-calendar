import { View, Text } from 'react-native';
import { IconButton } from '../Button/Button';
import {
  useMultipleCalendarActions,
  useMultipleCalendarSelector,
} from 'react-native-fast-calendar';

export function Header() {
  const { goPrevMonth, goNextMonth } = useMultipleCalendarActions();
  const displayedMonthLabel = useMultipleCalendarSelector(
    (s) => s.days.displayedMonthLabel
  );
  const displayedYearLabel = useMultipleCalendarSelector(
    (s) => s.days.displayedYearLabel
  );
  const systemId = useMultipleCalendarSelector((s) => s.system.id);
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
