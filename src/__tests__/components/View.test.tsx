import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { Root } from '../../components/Root';
import { View } from '../../components/View';
import { useCalendarStore } from '../../context';
import { gregorianSystem } from '../../systems/gregorian';
import type { CalendarStore } from '../../store';

const Probe = ({ capture }: { capture: (s: CalendarStore) => void }) => {
  capture(useCalendarStore());
  return null;
};

describe('<Calendar.View />', () => {
  it('renders the day grid by default', () => {
    const { queryByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <View />
      </Root>
    );
    // DayGrid renders cell testIDs like cal.calendar.day.YYYY-MM-DD
    expect(queryByTestId('cal.calendar.day.2024-05-15')).toBeTruthy();
  });

  it('renders the month grid when view is "month"', () => {
    let storeRef: CalendarStore | null = null;
    const { getByTestId } = render(
      <Root systems={[gregorianSystem]} testID="cal">
        <Probe capture={(s) => (storeRef = s)} />
        <View />
      </Root>
    );
    act(() => {
      storeRef!.setView('month');
    });
    expect(getByTestId('cal.calendar.month.0')).toBeTruthy();
  });

  it('renders the year grid when view is "year"', () => {
    let storeRef: CalendarStore | null = null;
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe capture={(s) => (storeRef = s)} />
        <View />
      </Root>
    );
    act(() => {
      storeRef!.setView('year');
    });
    expect(getByTestId('cal.calendar.year.2024')).toBeTruthy();
  });

  it('forwards the renderDay prop into DayGrid', () => {
    const { getAllByText } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <View renderDay={() => <Text>x</Text>} />
      </Root>
    );
    expect(getAllByText('x').length).toBeGreaterThan(0);
  });
});
