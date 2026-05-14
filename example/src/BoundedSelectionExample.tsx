import { useMemo } from 'react';
import { ScrollView } from 'react-native';
import { CalendarProvider } from 'react-native-fast-calendar';

import { HooksCalendar } from './HooksCalendar';

export default function BoundedSelectionExample() {
  const today = useMemo(() => new Date(), []);
  const minDate = today;
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 3);
    return d;
  }, [today]);

  const disabledRanges = useMemo(
    () => [
      {
        start: new Date(today.getFullYear(), today.getMonth(), 10),
        end: new Date(today.getFullYear(), today.getMonth(), 14),
      },
    ],
    [today]
  );

  return (
    <ScrollView className="bg-background" contentContainerClassName="p-4">
      <CalendarProvider
        mode="single"
        minDate={minDate}
        maxDate={maxDate}
        disabledRanges={disabledRanges}
        disabled={(d) => d.getDay() === 0}
      >
        <HooksCalendar caption="Bounded · next 3 months · no Sundays" />
      </CalendarProvider>
    </ScrollView>
  );
}
