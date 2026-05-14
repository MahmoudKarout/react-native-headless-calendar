/**
 * Bottom-sheet date picker — opens a calendar in a @gorhom/bottom-sheet
 * modal. The trigger and the sheet adopt the same shadcn aesthetic as
 * the rest of the recipe set.
 */
import { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CalendarProvider } from 'react-native-fast-calendar';
import { useResolveClassNames } from 'uniwind';

import { HooksCalendar } from './HooksCalendar';

export default function BottomSheetPickerExample() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [picked, setPicked] = useState<Date | null>(null);

  const open = useCallback(() => sheetRef.current?.present(), []);
  const close = useCallback(() => sheetRef.current?.dismiss(), []);

  // @gorhom/bottom-sheet only accepts plain `style` objects for its
  // background, handle, and inner view, so we resolve the Uniwind
  // classes upfront.
  const backgroundStyle = useResolveClassNames('bg-card');
  const handleIndicatorStyle = useResolveClassNames('bg-border-strong');
  const sheetContentStyle = useResolveClassNames('p-4');
  const rootStyle = useResolveClassNames('flex-1');

  return (
    <GestureHandlerRootView style={rootStyle}>
      <BottomSheetModalProvider>
        <View className="flex-1 justify-center p-6 bg-background">
          <View className="gap-2">
            <Text className="text-foreground text-[13px] font-semibold">
              Date
            </Text>
            <Pressable
              onPress={open}
              className="flex-row items-center justify-between px-3.5 py-3 bg-card border-hairline border-border rounded-lg active:bg-surface-muted"
            >
              <Text className="text-foreground text-sm font-medium">
                {picked ? picked.toDateString() : 'Pick a date'}
              </Text>
              <Text className="text-muted text-xs">▾</Text>
            </Pressable>
          </View>
        </View>

        <BottomSheetModal
          ref={sheetRef}
          snapPoints={['65%']}
          backgroundStyle={backgroundStyle}
          handleIndicatorStyle={handleIndicatorStyle}
        >
          <BottomSheetView style={sheetContentStyle}>
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
