import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  gregorianSystem,
  type SingleSelectionPayload,
} from 'react-native-headless-calendar';

import { SingleDateCalendar } from '../../components/SingleDateCalendar/SingleDateCalendar';
import { hijriSystem } from 'react-native-headless-calendar/systems/hijri';
import { jalaliSystem } from 'react-native-headless-calendar/systems/jalali';

export default function SingleWithSystems() {
  const [selectedDate, setSelectedDate] =
    useState<SingleSelectionPayload | null>(null);

  const onConfirm = (payload: SingleSelectionPayload) => {
    setSelectedDate(payload);
  };

  const onClear = () => {};

  return (
    <View className="flex-1 items-center justify-center bg-background gap-4">
      <SingleDateCalendar
        activeSystemId="gregorian"
        systems={[gregorianSystem, hijriSystem, jalaliSystem]}
        onConfirm={onConfirm}
        firstDayOfWeek={0}
        onClear={onClear}
        initialDate={selectedDate}
      />

      {selectedDate && (
        <View className="bg-surface-muted rounded-2xl p-4 w-[326px] gap-2">
          <View>
            <Text className="text-muted text-sm font-bold">
              {'gregorian: '}
            </Text>
            <Text className="text-primary text-sm font-bold">
              {selectedDate?.gregorianDate?.toISOString().split('T')[0]}
            </Text>
          </View>
          <View>
            <Text className="text-muted text-sm font-bold">
              {`${selectedDate?.systemId}: `}
            </Text>
            <Text className="text-primary text-sm font-bold">
              {selectedDate?.system?.day}-{selectedDate?.system?.month}-
              {selectedDate?.system?.year}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
