import { View } from 'react-native';
import { GhostButton, PrimaryButton } from '../Button/Button';
import {
  selectSingleCanConfirm,
  useSingleCalendarActions,
  useSingleCalendarSelector,
} from 'react-native-fast-calendar';

export function Footer() {
  const { clear, confirm } = useSingleCalendarActions();
  const canConfirm = useSingleCalendarSelector(selectSingleCanConfirm);
  return (
    <View className="flex-row gap-2 mt-4">
      <GhostButton onPress={clear} label="Clear" />
      <PrimaryButton onPress={confirm} disabled={!canConfirm} label="Confirm" />
    </View>
  );
}
