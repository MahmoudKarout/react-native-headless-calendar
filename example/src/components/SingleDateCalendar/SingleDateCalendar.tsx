import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  SingleDateProvider,
  type SingleOnChange,
  type SingleOnClear,
  type SingleOnConfirm,
} from 'react-native-fast-calendar';

import { YearView } from './YearView';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { Header } from './Header';
import { SystemSwitch } from './SystemSwitch';
import { Footer } from './Footer';

export interface SingleDateCalendarProps {
  /** Optional caption shown above the navigation header. */
  onChange?: SingleOnChange;
  onClear?: SingleOnClear;
  onConfirm?: SingleOnConfirm;
}

export function SingleDateCalendar({
  onChange,
  onClear,
  onConfirm,
}: SingleDateCalendarProps) {
  const [view, setView] = useState<'day' | 'month' | 'year'>('day');

  const toggleDayView = () => setView('day');

  return (
    <SingleDateProvider
      onClear={onClear}
      onChange={onChange}
      onConfirm={onConfirm}
    >
      <View className="bg-card border-hairline border-border rounded-xl p-4 shadow-sm">
        <Header />
        <SystemSwitch value={view} onChange={setView} />
        {view === 'day' && <DayView />}
        {view === 'month' && <MonthView onChange={toggleDayView} />}
        {view === 'year' && <YearView onChange={toggleDayView} />}
        <Footer />
      </View>
    </SingleDateProvider>
  );
}
