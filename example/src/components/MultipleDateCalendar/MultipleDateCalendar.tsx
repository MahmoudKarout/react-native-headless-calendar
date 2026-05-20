import { useState } from 'react';
import { View } from 'react-native';

import {
  MultipleDateProvider,
  type MultipleDateProviderProps,
} from 'react-native-headless-calendar';

import { YearView } from './YearView';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { Header } from './Header';
import { ViewSwitch } from './ViewSwitch';
import { Footer } from './Footer';

export type MultipleDateCalendarProps = Omit<
  MultipleDateProviderProps,
  'children'
>;

export function MultipleDateCalendar(props: MultipleDateCalendarProps) {
  const [view, setView] = useState<'day' | 'month' | 'year'>('day');

  const toggleDayView = () => setView('day');

  return (
    <MultipleDateProvider {...props}>
      <View className="bg-card border-hairline border-border rounded-xl p-4 shadow-sm w-[326px] h-[483px] justify-between">
        <View>
          <Header />
          <ViewSwitch value={view} onChange={setView} />
          {view === 'day' && <DayView />}
          {view === 'month' && <MonthView onChange={toggleDayView} />}
          {view === 'year' && <YearView onChange={toggleDayView} />}
        </View>
        <Footer />
      </View>
    </MultipleDateProvider>
  );
}
