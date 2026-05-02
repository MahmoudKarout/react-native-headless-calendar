import { fireEvent, render } from '@testing-library/react-native';

import { MonthGrid } from '../../components/MonthGrid';
import { Root } from '../../components/Root';
import { useCalendarStore } from '../../context';
import { gregorianSystem } from '../../systems/gregorian';
import type { CalendarStore } from '../../store';

const Probe = ({ capture }: { capture: (s: CalendarStore) => void }) => {
  capture(useCalendarStore());
  return null;
};

describe('<Calendar.MonthGrid />', () => {
  it('renders all 12 month cells', () => {
    const { getByTestId } = render(
      <Root systems={[gregorianSystem]} testID="cal">
        <MonthGrid />
      </Root>
    );
    for (let i = 0; i < 12; i += 1) {
      expect(getByTestId(`cal.calendar.month.${i}`)).toBeTruthy();
    }
  });

  it('marks the active month', () => {
    let storeRef: CalendarStore | null = null;
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe capture={(s) => (storeRef = s)} />
        <MonthGrid />
      </Root>
    );
    const active = getByTestId('cal.calendar.month.4');
    expect(active.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    );
    expect(storeRef!.getSnapshot().displayed).toEqual(
      expect.objectContaining({ m: 4 })
    );
  });

  it('jumps to the tapped month and switches to day view', () => {
    let storeRef: CalendarStore | null = null;
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe capture={(s) => (storeRef = s)} />
        <MonthGrid />
      </Root>
    );
    fireEvent.press(getByTestId('cal.calendar.month.8'));
    const s = storeRef!.getSnapshot();
    expect(s.view).toBe('day');
    expect(s.displayed).toEqual(expect.objectContaining({ m: 8 }));
  });

  it('renders without testID prefix when one is not configured', () => {
    const { queryByTestId } = render(
      <Root systems={[gregorianSystem]}>
        <MonthGrid />
      </Root>
    );
    expect(queryByTestId('calendar.month.0')).toBeNull();
  });
});
