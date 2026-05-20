import { Pressable, Text, View } from 'react-native';
import {
  selectSingleMonths,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-headless-calendar';
import { tv } from 'tailwind-variants/lite';

interface MonthViewProps {
  onChange: () => void;
}

const monthViewContainerVariant = tv({
  base: 'items-center py-3 rounded-md grow basis-[30%] border-hairline',
  variants: {
    active: {
      true: 'bg-primary border-primary',
      false: 'border-border',
    },
  },
});

export function MonthView({ onChange }: MonthViewProps) {
  const { selectMonth } = useSingleCalendarActions();
  const { months, activeMonth } = useSingleCalendarSelector(selectSingleMonths);
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {months.map((m: any) => {
        const active = m.index === activeMonth;
        return (
          <Pressable
            key={m.index}
            onPress={() => {
              selectMonth(m.index);
              onChange();
            }}
            className={monthViewContainerVariant({ active })}
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
