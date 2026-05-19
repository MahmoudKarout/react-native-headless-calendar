import { useState } from 'react';
import { View } from 'react-native';

import {
  MultipleDateProvider,
  type MultipleOnChange,
  type MultipleOnClear,
  type MultipleOnConfirm,
} from 'react-native-fast-calendar';

import { YearView } from './YearView';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { Header } from './Header';
import { ViewSwitch } from './ViewSwitch';
import { Footer } from './Footer';

export interface MultipleDateCalendarProps {
  onChange?: MultipleOnChange;
  onClear?: MultipleOnClear;
  onConfirm?: MultipleOnConfirm;
}

export function MultipleDateCalendar({
  onChange,
  onClear,
  onConfirm,
}: MultipleDateCalendarProps) {
  const [view, setView] = useState<'day' | 'month' | 'year'>('day');

  const toggleDayView = () => setView('day');

  return (
    <MultipleDateProvider
      onClear={onClear}
      onChange={onChange}
      onConfirm={onConfirm}
      maxSelected={10}
    >
      <View className="bg-card border-hairline border-border rounded-xl p-4 shadow-sm">
        <Header />
        <ViewSwitch value={view} onChange={setView} />
        {view === 'day' && <DayView />}
        {view === 'month' && <MonthView onChange={toggleDayView} />}
        {view === 'year' && <YearView onChange={toggleDayView} />}
        <Footer />
      </View>
    </MultipleDateProvider>
  );
}
