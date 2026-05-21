import { Pressable, Text, View } from 'react-native';
import {
  selectMultipleMonths,
  useMultipleCalendarActions,
  useMultipleCalendarSelector,
} from 'react-native-headless-calendar';

interface MonthViewProps {
  onChange: () => void;
}

export function MonthView({ onChange }: MonthViewProps) {
  const { selectMonth } = useMultipleCalendarActions();
  const { months, activeMonth } =
    useMultipleCalendarSelector(selectMultipleMonths);
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {months.map((m) => {
        const active = m.index === activeMonth;
        return (
          <Pressable
            key={m.index}
            onPress={() => {
              selectMonth(m.index);
              onChange();
            }}
            className={`items-center py-3 rounded-md grow basis-[30%] border-hairline ${
              active ? 'bg-primary border-primary' : 'border-border'
            }`}
          >
            <Text
              className={`text-[13px] ${active ? 'text-on-primary font-semibold' : 'text-foreground font-medium'}`}
            >
              {m.label.slice(0, 3)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
