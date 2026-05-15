import { ScrollView, Text, View } from 'react-native';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar } from './HooksCalendar';

const EMOJIS = ['🌞', '🌧', '⛅', '🌩', '❄️', '🌪', '🌈'];

export default function CustomDayCellExample() {
  return (
    <ScrollView className="bg-background" contentContainerClassName="p-4">
      <CalendarProvider mode="single">
        <HooksCalendar
          caption="Custom day cell"
          cellSize={44}
          renderDay={(cell) => {
            const emoji = EMOJIS[cell.nativeDate.getDate() % EMOJIS.length];
            return (
              <View className="items-center justify-center">
                <Text
                  className={`text-xs font-semibold ${
                    cell.isSelected ? 'text-on-primary' : 'text-foreground'
                  }`}
                >
                  {cell.label}
                </Text>
                <Text className="text-xs mt-px">{emoji}</Text>
              </View>
            );
          }}
        />
      </CalendarProvider>
    </ScrollView>
  );
}
