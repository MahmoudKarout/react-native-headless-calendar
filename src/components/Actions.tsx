/**
 * Calendar.Actions — confirm + clear button row.
 *
 * Two ways to use it:
 *
 *   1. Preset (most common):
 *
 *      <Calendar.Actions />
 *
 *   2. Compound parts — drop the buttons anywhere outside the calendar
 *      (sticky footer, dialog actions, ...) and they still work because
 *      they read from CalendarStoreContext:
 *
 *      <Calendar.Actions.ClearButton />
 *      <Calendar.Actions.ConfirmButton />
 *
 * The buttons compute their disabled state via a single granular selector
 * — within two consecutive valid date taps, the boolean stays `false` and
 * the buttons skip re-renders.
 */
import React, { memo, useCallback, type ReactNode } from 'react';

import {
  useCalendarConfig,
  useCalendarLabels,
  useCalendarPrimitives,
  useCalendarSelector,
  useCalendarStore,
  useCalendarTheme,
} from '../context';

interface ButtonShellProps {
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary';
  disabled?: boolean;
  children?: ReactNode;
  testID?: string;
}

/** Internal shared button — uses primitives + theme tokens only. */
function ButtonShell({
  label,
  onPress,
  variant,
  disabled,
  children,
  testID,
}: ButtonShellProps) {
  const { Pressable, Text } = useCalendarPrimitives();
  const theme = useCalendarTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius,
        backgroundColor: isPrimary
          ? disabled
            ? theme.colors.disabled
            : theme.colors.primary
          : 'transparent',
        borderWidth: isPrimary ? 0 : 1,
        borderColor: theme.colors.border,
        opacity: disabled ? 0.6 : 1,
      }}
      testID={testID}
    >
      {children ?? (
        <Text
          style={{
            color: isPrimary ? theme.colors.onPrimary : theme.colors.text,
            fontSize: theme.fontSize.day,
            fontWeight: '600',
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const ConfirmButtonComponent: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const labels = useCalendarLabels();
  const { onConfirm, testID } = useCalendarConfig();
  const store = useCalendarStore();

  const isDisabled = useCalendarSelector((s) => {
    if (s.mode === 'single') return !s.selectedDate;
    return !(s.rangeStart && s.rangeEnd);
  });

  const onPress = useCallback(() => {
    if (!onConfirm) return;
    const s = store.getSnapshot();
    onConfirm({
      date: s.selectedDate ? s.system.toNativeDate(s.selectedDate) : undefined,
      startDate: s.rangeStart ? s.system.toNativeDate(s.rangeStart) : undefined,
      endDate: s.rangeEnd ? s.system.toNativeDate(s.rangeEnd) : undefined,
      systemId: s.system.id,
    });
  }, [onConfirm, store]);

  return (
    <ButtonShell
      disabled={isDisabled}
      label={labels.confirm}
      onPress={onPress}
      testID={testID ? `${testID}.calendar.confirm` : undefined}
      variant="primary"
    >
      {children}
    </ButtonShell>
  );
};
const ConfirmButton = memo(ConfirmButtonComponent);
ConfirmButton.displayName = 'Calendar.Actions.ConfirmButton';

const ClearButtonComponent: React.FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const labels = useCalendarLabels();
  const { onClear, testID } = useCalendarConfig();
  const store = useCalendarStore();

  const onPress = useCallback(() => {
    store.clear();
    onClear?.();
  }, [store, onClear]);

  return (
    <ButtonShell
      label={labels.clear}
      onPress={onPress}
      testID={testID ? `${testID}.calendar.clear` : undefined}
      variant="secondary"
    >
      {children}
    </ButtonShell>
  );
};
const ClearButton = memo(ClearButtonComponent);
ClearButton.displayName = 'Calendar.Actions.ClearButton';

const ActionsPresetComponent: React.FC = () => {
  const { View } = useCalendarPrimitives();
  const theme = useCalendarTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }}
    >
      <ClearButton />
      <ConfirmButton />
    </View>
  );
};
const ActionsPreset = memo(ActionsPresetComponent);
ActionsPreset.displayName = 'Calendar.Actions';

export const Actions = Object.assign(ActionsPreset, {
  ConfirmButton,
  ClearButton,
});
