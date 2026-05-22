import { router, type RelativePathString } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const calendars = [
  'single',
  'single-with-systems',
  'single-vertical',
  'single-with-disabled-dates',
  'single-with-modifiers',

  'range',
  'range-with-systems',
  'range-with-disabled-dates',
  'range-vertical',
  'range-with-custom-cells',

  'multiple',
  'multiple-with-systems',
  'multiple-with-disabled-dates',
  'multiple-vertical',
];

export default function Index() {
  return (
    <View className="flex-1 pt-safe px-4 gap-4 bg-background">
      <Text className="text-3xl font-semibold text-primary">Calendars</Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4 pb-safe"
      >
        {calendars.map((calendar) => (
          <TouchableOpacity
            activeOpacity={0.8}
            key={calendar}
            className="p-4 rounded-lg bg-muted"
            onPress={() => {
              router.push(`/(components)/${calendar}` as RelativePathString);
            }}
          >
            <Text className="text-primary text-lg font-semibold">
              {calendar.split('-').join(' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
