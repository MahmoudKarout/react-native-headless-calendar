import { useState } from 'react';
import { View } from 'react-native';

import {
  RangeDateProvider,
  type RangeDateProviderProps,
  type RangeOnChange,
  type RangeOnClear,
  type RangeOnConfirm,
} from 'react-native-headless-calendar';

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

export function RangeDateCalendar(props: RangeDateProviderProps) {
  const [view, setView] = useState<'day' | 'month' | 'year'>('day');

  const toggleDayView = () => setView('day');

  return (
    <RangeDateProvider {...props}>
      <View className="bg-card border-hairline border-border rounded-xl p-4 shadow-sm w-[326px] h-[483px] justify-between">
        <View>
          <Header />
          <SystemSwitch value={view} onChange={setView} />
          {view === 'day' && <DayView />}
          {view === 'month' && <MonthView onChange={toggleDayView} />}
          {view === 'year' && <YearView onChange={toggleDayView} />}
        </View>
        <Footer />
      </View>
    </RangeDateProvider>
  );
}
