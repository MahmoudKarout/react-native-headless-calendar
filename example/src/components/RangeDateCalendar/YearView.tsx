import { Pressable, Text, View } from 'react-native';
import {
  selectRangeYears,
  useRangeCalendarActions,
  useRangeCalendarSelector,
} from 'react-native-fast-calendar';
import { tv } from 'tailwind-variants/lite';
import { IconButton } from '../Button/Button';

interface YearViewProps {
  onChange: () => void;
}

const yearContainer = tv({
  base: 'items-center py-3 rounded-md grow basis-[30%] border-hairline',
  variants: {
    active: {
      true: 'bg-primary border-primary',
      false: 'border-border',
    },
  },
});

const yearText = tv({
  base: 'text-[13px]',
  variants: {
    active: {
      true: 'text-on-primary font-semibold',
      false: 'text-foreground font-medium',
    },
  },
});

export function YearView({ onChange }: YearViewProps) {
  const { years, activeYear } = useRangeCalendarSelector(selectRangeYears);
  const { selectYear, prevYearPage, nextYearPage } = useRangeCalendarActions();
  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <IconButton onPress={prevYearPage} label="‹" />
        <Text className="text-foreground text-sm font-semibold">
          {years[0]} – {years[years.length - 1]}
        </Text>
        <IconButton onPress={nextYearPage} label="›" />
      </View>
      <View className="flex-row flex-wrap gap-1.5">
        {years.map((_year) => {
          const active = _year === activeYear;
          return (
            <Pressable
              key={_year}
              onPress={() => {
                selectYear(_year);
                onChange();
              }}
              className={yearContainer({ active })}
            >
              <Text className={yearText({ active })}>{_year}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
