import { fireEvent, render } from '@testing-library/react-native';

import { Root } from '../../components/Root';
import { YearGrid } from '../../components/YearGrid';
import { useCalendarStore } from '../../context';
import { gregorianSystem } from '../../systems/gregorian';
import type { CalendarStore } from '../../store';

const Probe = ({ capture }: { capture: (s: CalendarStore) => void }) => {
  capture(useCalendarStore());
  return null;
};

describe('<Calendar.YearGrid />', () => {
  it('renders 12 year cells', () => {
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <YearGrid />
      </Root>
    );
    // Page containing 2024 starts at 2016 (per the alignment math).
    for (let y = 2016; y <= 2027; y += 1) {
      expect(getByTestId(`cal.calendar.year.${y}`)).toBeTruthy();
    }
  });

  it('marks the active year', () => {
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <YearGrid />
      </Root>
    );
    const active = getByTestId('cal.calendar.year.2024');
    expect(active.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    );
  });

  it('jumps to the tapped year and switches to day view', () => {
    let storeRef: CalendarStore | null = null;
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe capture={(s) => (storeRef = s)} />
        <YearGrid />
      </Root>
    );
    fireEvent.press(getByTestId('cal.calendar.year.2026'));
    const s = storeRef!.getSnapshot();
    expect(s.view).toBe('day');
    expect(s.displayed).toEqual(expect.objectContaining({ y: 2026 }));
  });

  it('renders without testID prefix when one is not configured', () => {
    const { queryByTestId } = render(
      <Root systems={[gregorianSystem]}>
        <YearGrid />
      </Root>
    );
    expect(queryByTestId('calendar.year.2024')).toBeNull();
  });
});
