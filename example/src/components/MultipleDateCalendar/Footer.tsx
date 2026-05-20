import { View } from 'react-native';
import { GhostButton, PrimaryButton } from '../Button/Button';
import {
  selectMultipleCanConfirm,
  useMultipleCalendarActions,
  useMultipleCalendarSelector,
} from 'react-native-headless-calendar';

export function Footer() {
  const { clear, confirm } = useMultipleCalendarActions();
  const canConfirm = useMultipleCalendarSelector(selectMultipleCanConfirm);
  return (
    <View className="flex-row gap-2 mt-4">
      <GhostButton onPress={clear} label="Clear" />
      <PrimaryButton onPress={confirm} disabled={!canConfirm} label="Confirm" />
    </View>
  );
}
