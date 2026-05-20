import { Pressable, Text, View } from 'react-native';
import { tv } from 'tailwind-variants/lite';

const viewKinds = ['day', 'month', 'year'] as const;

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

interface SystemSwitchProps {
  value: (typeof viewKinds)[number];
  onChange: (value: (typeof viewKinds)[number]) => void;
}

export function SystemSwitch({ value, onChange }: SystemSwitchProps) {
  return (
    <View className="bg-surface-muted rounded-md flex-row p-0.5 mb-3">
      {viewKinds.map((tab) => {
        const active = tab === value;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            className={systemSwitchVariant({ active })}
          >
            <Text className={systemSwitchTextVariant({ active })}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
