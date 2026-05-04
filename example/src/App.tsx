import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BottomSheetCalendarDemo from './BottomSheetExample';
import CalendarDemo from './CalendarDemo';
import VerticalCalendarDemo from './VerticalCalendarExample';
import {
  VerticalBoundedExample,
  VerticalCustomSlotsExample,
  VerticalImageCellExample,
  VerticalLocalisedExample,
  VerticalMultiMonthExample,
  VerticalMultiSystemExample,
  VerticalMultipleExample,
  VerticalRangeExample,
} from './VerticalCalendarExamples';

type DemoId =
  | 'standard'
  | 'bottomSheet'
  | 'vertical'
  | 'verticalRange'
  | 'verticalMultiple'
  | 'verticalBounded'
  | 'verticalMultiMonth'
  | 'verticalMultiSystem'
  | 'verticalCustomSlots'
  | 'verticalLocalised'
  | 'verticalImageCells';

const DEMOS: ReadonlyArray<{ id: DemoId; label: string }> = [
  { id: 'standard', label: 'Standard' },
  { id: 'bottomSheet', label: 'Bottom Sheet' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'verticalRange', label: 'Vertical · Range' },
  { id: 'verticalMultiple', label: 'Vertical · Multi' },
  { id: 'verticalBounded', label: 'Vertical · Bounded' },
  { id: 'verticalMultiMonth', label: 'Vertical · Weeks' },
  { id: 'verticalMultiSystem', label: 'Vertical · Multi-system' },
  { id: 'verticalCustomSlots', label: 'Vertical · Slots' },
  { id: 'verticalLocalised', label: 'Vertical · FR' },
  { id: 'verticalImageCells', label: 'Vertical · Images' },
];

export default function App() {
  const [activeDemo, setActiveDemo] = useState<DemoId>('standard');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/*
        Demo Switcher.

        Wrapped in a horizontal ScrollView because we now ship 11 tabs
        (3 originals + 8 vertical examples). Sized to content so each
        label stays legible instead of being squashed by `flex: 1`.
      */}
      <View style={styles.switcherWrapper}>
        <ScrollView
          contentContainerStyle={styles.switcherContent}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {DEMOS.map(({ id, label }) => {
            const isActive = activeDemo === id;
            return (
              <Pressable
                key={id}
                onPress={() => setActiveDemo(id)}
                style={[
                  styles.switcherButton,
                  isActive && styles.switcherButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.switcherText,
                    isActive && styles.switcherTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Demo */}
      {activeDemo === 'standard' && <CalendarDemo />}
      {activeDemo === 'bottomSheet' && <BottomSheetCalendarDemo />}
      {activeDemo === 'vertical' && <VerticalCalendarDemo />}
      {activeDemo === 'verticalRange' && <VerticalRangeExample />}
      {activeDemo === 'verticalMultiple' && <VerticalMultipleExample />}
      {activeDemo === 'verticalBounded' && <VerticalBoundedExample />}
      {activeDemo === 'verticalMultiMonth' && <VerticalMultiMonthExample />}
      {activeDemo === 'verticalMultiSystem' && <VerticalMultiSystemExample />}
      {activeDemo === 'verticalCustomSlots' && <VerticalCustomSlotsExample />}
      {activeDemo === 'verticalLocalised' && <VerticalLocalisedExample />}
      {activeDemo === 'verticalImageCells' && <VerticalImageCellExample />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  switcherWrapper: {
    backgroundColor: '#F4F4F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  switcherContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  switcherButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  switcherButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switcherText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717A',
  },
  switcherTextActive: {
    color: '#18181B',
    fontWeight: '600',
  },
});
