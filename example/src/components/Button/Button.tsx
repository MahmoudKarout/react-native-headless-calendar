import { Pressable, Text } from 'react-native';

function IconButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center w-7 h-7 rounded-md border-hairline border-border active:bg-surface-muted"
    >
      <Text className="text-foreground text-base font-medium leading-4">
        {label}
      </Text>
    </Pressable>
  );
}

function GhostButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center py-2.5 rounded-md border-hairline border-border active:bg-surface-muted"
    >
      <Text className="text-foreground text-[13px] font-medium">{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({
  onPress,
  label,
  disabled,
}: {
  onPress: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-1 items-center py-2.5 rounded-md bg-primary active:bg-primary-strong disabled:opacity-40"
    >
      <Text className="text-on-primary text-[13px] font-semibold">{label}</Text>
    </Pressable>
  );
}

export { IconButton, GhostButton, PrimaryButton };
