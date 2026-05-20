import { Pressable, Text, View } from 'react-native';
import { tv } from 'tailwind-variants/lite';

const viewKinds = ['day', 'month', 'year'] as const;

const viewSwitchTextVariant = tv({
  base: 'text-[11px] font-semibold tracking-wider text-center uppercase ',
  variants: {
    active: {
      true: 'text-foreground',
      false: 'text-muted',
    },
  },
});

const viewSwitchVariant = tv({
  base: 'flex-1 rounded py-1.5',
  variants: {
    active: {
      true: 'bg-card shadow-sm',
    },
  },
});

interface ViewSwitchProps {
  value: (typeof viewKinds)[number];
  onChange: (value: (typeof viewKinds)[number]) => void;
}

export function ViewSwitch({ value, onChange }: ViewSwitchProps) {
  
  return (
    <View className="bg-surface-muted rounded-md flex-row p-0.5 mb-3">
      {viewKinds.map((tab) => {
        const active = tab === value;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            className={viewSwitchVariant({ active })}
          >
            <Text className={viewSwitchTextVariant({ active })}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
