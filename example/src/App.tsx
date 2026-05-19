import '../global.css';
import { Alert, ScrollView, Text, View } from 'react-native';
import {
  SingleDateCalendar,
  type SingleDateCalendarProps,
} from './components/SingleDateCalendar/SingleDateCalendar';
import {
  RangeDateCalendar,
  type RangeDateCalendarProps,
} from './components/RangeDateCalendar/RangeDateCalendar';
import { MultipleDateCalendar } from './components/MultipleDateCalendar/MultipleDateCalendar';
import {
  SafeAreaListener,
  type EdgeInsets,
} from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';
import type {
  DateParts,
  SingleDateProviderProps,
  SingleSelectionPayload,
} from 'react-native-fast-calendar';
import { gregorianSystem } from 'react-native-fast-calendar/systems/gregorian';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';
import { jalaliSystem } from 'react-native-fast-calendar/systems/jalali';

const onInsetChange = ({ insets }: { insets: EdgeInsets }) => {
  Uniwind?.updateInsets(insets);
};

const onConfirm = (payload: SingleSelectionPayload) => {
  const { month, day, year } = payload?.parts as DateParts;
  Alert.alert('onConfirm', `${day}-${month}-${year}`);
};

const onClear = () => {
  Alert.alert('onClear');
};

const singleDateCalendar: SingleDateCalendarProps = {
  activeSystemId: 'gregorian',
  onConfirm: onConfirm,
  firstDayOfWeek: 1,
  onClear: onClear,
  initialDate: new Date(),
  systems: [gregorianSystem, hijriSystem, jalaliSystem],
};

const rangeDateCalendar: Partial<RangeDateCalendarProps> = {
  onClear: onClear,
  onConfirm: onConfirm,
  allowSameDay: true,
  initialStart: new Date().setDate(new Date().getDate() - 10),
  initialEnd: new Date().setDate(new Date().getDate() + 10),
  activeSystemId: 'gregorian',
  firstDayOfWeek: 1,
  disabledDates: [new Date().setDate(new Date().getDate() + 1)],
  disabledRanges: [
    {
      start: new Date().setDate(new Date().getDate() + 1),
      end: new Date().setDate(new Date().getDate() + 5),
    },
  ],
  minDate: new Date().setDate(new Date().getDate() - 10),
  maxDate: new Date().setDate(new Date().getDate() + 11),
};
const App = () => {
  return (
    <SafeAreaListener onChange={onInsetChange}>
      <ScrollView contentContainerClassName="pt-safe pb-safe gap-5">
        <ScrollView horizontal contentContainerClassName="p-4 gap-5">
          <SingleDateCalendar {...singleDateCalendar} />
          <SingleDateCalendar
            {...singleDateCalendar}
            minDate={new Date()}
            maxDate={new Date(2026, 4, 31)}
          />
        </ScrollView>
        <ScrollView horizontal contentContainerClassName="p-4 gap-5">
          <RangeDateCalendar {...rangeDateCalendar} />
          <RangeDateCalendar {...rangeDateCalendar} />
        </ScrollView>
      </ScrollView>
    </SafeAreaListener>
  );
};

export default App;
