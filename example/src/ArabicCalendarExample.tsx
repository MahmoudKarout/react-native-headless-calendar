/**
 * Arabic / Hijri calendar — switches the active calendar system at
 * runtime by changing the `<CalendarProvider key>` and re-rendering with
 * a different `initialSystemId`. RTL-style layout via `firstDayOfWeek=6`
 * (Saturday-first).
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CalendarProvider } from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';

import { HooksCalendar } from './HooksCalendar';

type SystemId = 'gregorian' | 'hijri';

export default function ArabicCalendarExample() {
  const [activeSystemId, setActiveSystemId] = useState<SystemId>('hijri');
  const systems = useMemo(() => [gregorianSystem, hijriSystem], []);

  return (
    <ScrollView className="bg-background" contentContainerClassName="p-4">
      <View className="bg-card border-hairline border-border rounded-lg flex-row p-0.5 mb-3">
        {(['gregorian', 'hijri'] as const).map((id) => {
          const active = activeSystemId === id;
          return (
            <Pressable
              key={id}
              onPress={() => setActiveSystemId(id)}
              className={`flex-1 py-2 rounded-md ${active ? 'bg-primary' : ''}`}
            >
              <Text
                className={`text-xs font-semibold tracking-wider text-center uppercase ${
                  active ? 'text-on-primary' : 'text-muted'
                }`}
              >
                {id}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <CalendarProvider
        key={activeSystemId}
        systems={systems}
        initialSystemId={activeSystemId}
        firstDayOfWeek={6}
        mode="single"
      >
        <HooksCalendar caption={`Active · ${activeSystemId}`} />
      </CalendarProvider>
    </ScrollView>
  );
}
