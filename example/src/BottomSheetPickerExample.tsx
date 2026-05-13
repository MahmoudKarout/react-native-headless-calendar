/**
 * Bottom-sheet date picker — opens a calendar in a @gorhom/bottom-sheet
 * modal. The trigger and the sheet adopt the same shadcn aesthetic as
 * the rest of the recipe set.
 */
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar, tokens } from './HooksCalendar';

export default function BottomSheetPickerExample() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [picked, setPicked] = useState<Date | null>(null);

  const open = useCallback(() => sheetRef.current?.present(), []);
  const close = useCallback(() => sheetRef.current?.dismiss(), []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <BottomSheetModalProvider>
        <View style={styles.container}>
          <View style={styles.field}>
            <Text style={styles.label}>Date</Text>
            <Pressable onPress={open} style={styles.trigger}>
              <Text style={styles.triggerText}>
                {picked ? picked.toDateString() : 'Pick a date'}
              </Text>
              <Text style={styles.triggerIcon}>▾</Text>
            </Pressable>
          </View>
        </View>

        <BottomSheetModal
          ref={sheetRef}
          snapPoints={['65%']}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <BottomSheetView style={styles.sheet}>
            <CalendarProvider
              mode="single"
              onConfirm={(p) => {
                if (p.date) setPicked(p.date);
                close();
              }}
              onClear={() => setPicked(null)}
            >
              <HooksCalendar caption="Pick a date" />
            </CalendarProvider>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    backgroundColor: tokens.muted,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: tokens.background,
    borderColor: tokens.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerText: {
    color: tokens.foreground,
    fontSize: 14,
    fontWeight: '500',
  },
  triggerIcon: {
    color: tokens.mutedForeground,
    fontSize: 12,
  },
  sheet: { padding: 16 },
  sheetBg: {
    backgroundColor: tokens.background,
  },
  sheetHandle: {
    backgroundColor: tokens.border,
  },
});
