import '../../global.css';
import { Stack } from 'expo-router';

import {
  SafeAreaListener,
  type EdgeInsets,
} from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

const onInsetChange = ({ insets }: { insets: EdgeInsets }) => {
  Uniwind?.updateInsets(insets);
};

export default function RootLayout() {
  return (
    <SafeAreaListener onChange={onInsetChange}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaListener>
  );
}
