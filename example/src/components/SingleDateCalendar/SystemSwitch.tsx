import { Pressable, Text, View } from 'react-native';
import {
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-headless-calendar';
import { tv } from 'tailwind-variants/lite';

const systemKinds = ['gregorian', 'hijri', 'jalali'] as const;

const systemSwitchTextVariant = tv({
  base: 'text-[11px] font-semibold tracking-wider text-center uppercase ',
  variants: {
    active: {
      true: 'text-foreground',
      false: 'text-muted',
    },
  },
});

const systemSwitchVariant = tv({
  base: 'flex-1 rounded py-1.5',
  variants: {
    active: {
      true: 'bg-card shadow-sm',
    },
  },
});

export function SystemSwitch() {
  const id = useSingleCalendarSelector((s) => s.system.id);
  const { setActiveSystem } = useSingleCalendarActions();
  return (
    <View className="bg-surface-muted rounded-md flex-row p-0.5 mb-3">
      {systemKinds.map((system) => {
        const active = id === system;
        return (
          <Pressable
            key={system}
            onPress={() => setActiveSystem(system)}
            className={systemSwitchVariant({ active })}
          >
            <Text className={systemSwitchTextVariant({ active })}>
              {system}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
