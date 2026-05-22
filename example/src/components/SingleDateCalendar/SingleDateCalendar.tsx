import { useState } from 'react';
import { View } from 'react-native';

import {
  SingleDateProvider,
  type SingleDateProviderProps,
} from 'react-native-headless-calendar';

import { YearView } from './YearView';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { Header } from './Header';
import { ViewSwitch } from './ViewSwitch';
import { Footer } from './Footer';
import { SystemSwitch } from './SystemSwitch';

export type SingleDateCalendarProps = Omit<SingleDateProviderProps, 'children'>;

export function SingleDateCalendar(props: SingleDateCalendarProps) {
  const [view, setView] = useState<'day' | 'month' | 'year'>('day');

  const toggleDayView = () => setView('day');

  return (
    <SingleDateProvider {...props}>
      <View className="bg-card border-2 border-border rounded-xl p-4 shadow-sm w-[326px] h-[483px] justify-between">
        <View>
          {props?.systems && props?.systems?.length > 1 && <SystemSwitch />}
          <Header />
          <ViewSwitch value={view} onChange={setView} />
          {view === 'day' && <DayView />}
          {view === 'month' && <MonthView onChange={toggleDayView} />}
          {view === 'year' && <YearView onChange={toggleDayView} />}
        </View>
        <Footer />
      </View>
    </SingleDateProvider>
  );
}
