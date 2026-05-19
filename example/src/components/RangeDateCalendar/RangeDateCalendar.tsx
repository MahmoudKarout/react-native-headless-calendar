import { useState } from 'react';
import { View } from 'react-native';

import {
  RangeDateProvider,
  type RangeOnChange,
  type RangeOnClear,
  type RangeOnConfirm,
} from 'react-native-fast-calendar';

import { YearView } from './YearView';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { Header } from './Header';
import { SystemSwitch } from './SystemSwitch';
import { Footer } from './Footer';

export interface RangeDateCalendarProps {
  onChange?: RangeOnChange;
  onClear?: RangeOnClear;
  onConfirm?: RangeOnConfirm;
}

export function RangeDateCalendar({
  onChange,
  onClear,
  onConfirm,
}: RangeDateCalendarProps) {
  const [view, setView] = useState<'day' | 'month' | 'year'>('day');

  const toggleDayView = () => setView('day');

  return (
    <RangeDateProvider
      onClear={onClear}
      onChange={onChange}
      onConfirm={onConfirm}
      allowSameDay
      initialStart={new Date().setDate(new Date().getDate() - 10)}
      initialEnd={new Date().setDate(new Date().getDate() + 10)}
      initialSystemId="gregory"
      firstDayOfWeek={1}
      disabledDates={[new Date().setDate(new Date().getDate() + 1)]}
      disabledRanges={[
        {
          start: new Date().setDate(new Date().getDate() + 1),
          end: new Date().setDate(new Date().getDate() + 5),
        },
      ]}
      minDate={new Date().setDate(new Date().getDate() - 10)}
      maxDate={new Date().setDate(new Date().getDate() + 11)}
    >
      <View className="bg-card border-hairline border-border rounded-xl p-4 shadow-sm">
        <Header />
        <SystemSwitch value={view} onChange={setView} />
        {view === 'day' && <DayView />}
        {view === 'month' && <MonthView onChange={toggleDayView} />}
        {view === 'year' && <YearView onChange={toggleDayView} />}
        <Footer />
      </View>
    </RangeDateProvider>
  );
}
