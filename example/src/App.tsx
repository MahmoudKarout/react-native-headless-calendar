import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BottomSheetCalendarDemo from './BottomSheetExample';
import CalendarDemo from './CalendarDemo';

export default function App() {
  const [activeDemo, setActiveDemo] = useState<'standard' | 'bottomSheet'>(
    'standard'
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Demo Switcher */}
      <View style={styles.switcher}>
        <Pressable
          style={[
            styles.switcherButton,
            activeDemo === 'standard' && styles.switcherButtonActive,
          ]}
          onPress={() => setActiveDemo('standard')}
        >
          <Text
            style={[
              styles.switcherText,
              activeDemo === 'standard' && styles.switcherTextActive,
            ]}
          >
            Standard
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.switcherButton,
            activeDemo === 'bottomSheet' && styles.switcherButtonActive,
          ]}
          onPress={() => setActiveDemo('bottomSheet')}
        >
          <Text
            style={[
              styles.switcherText,
              activeDemo === 'bottomSheet' && styles.switcherTextActive,
            ]}
          >
            Bottom Sheet
          </Text>
        </Pressable>
      </View>

      {/* Active Demo */}
      {activeDemo === 'standard' ? (
        <CalendarDemo />
      ) : (
        <BottomSheetCalendarDemo />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  switcher: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#F4F4F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  switcherButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
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
