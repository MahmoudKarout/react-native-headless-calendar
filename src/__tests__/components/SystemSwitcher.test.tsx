import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { Root } from '../../components/Root';
import { SystemSwitcher } from '../../components/SystemSwitcher';
import {
  createGregorianSystem,
  gregorianSystem,
} from '../../systems/gregorian';
import type { CalendarSystem } from '../../types';

const makeSystem = (id: string, label: string): CalendarSystem => {
  const sys = createGregorianSystem({ label });
  Object.defineProperty(sys, 'id', { value: id });
  return sys;
};

describe('<Calendar.SystemSwitcher />', () => {
  it('renders nothing when only a single system is configured', () => {
    const { toJSON } = render(
      <Root systems={[gregorianSystem]} testID="cal">
        <SystemSwitcher />
      </Root>
    );
    // Tree renders the wrapper but not the switcher itself.
    expect(JSON.stringify(toJSON())).not.toContain('systemSwitcher');
  });

  it('renders a pill for every configured system', () => {
    const second = makeSystem('mock-hijri', 'Hijri');
    const { getByTestId } = render(
      <Root systems={[gregorianSystem, second]} testID="cal">
        <SystemSwitcher />
      </Root>
    );
    expect(getByTestId('cal.calendar.systemSwitcher')).toBeTruthy();
    expect(getByTestId('cal.calendar.systemSwitcher.gregorian')).toBeTruthy();
    expect(getByTestId('cal.calendar.systemSwitcher.mock-hijri')).toBeTruthy();
  });

  it('marks the active system as selected', () => {
    const second = makeSystem('mock-hijri', 'Hijri');
    const { getByTestId } = render(
      <Root systems={[gregorianSystem, second]} testID="cal">
        <SystemSwitcher />
      </Root>
    );
    expect(
      getByTestId('cal.calendar.systemSwitcher.gregorian').props
        .accessibilityState
    ).toEqual(expect.objectContaining({ selected: true }));
    expect(
      getByTestId('cal.calendar.systemSwitcher.mock-hijri').props
        .accessibilityState
    ).toEqual(expect.objectContaining({ selected: false }));
  });

  it('switches systems on press and fires onSystemChange', () => {
    const second = makeSystem('mock-hijri', 'Hijri');
    const onSystemChange = jest.fn();
    const { getByTestId } = render(
      <Root
        onSystemChange={onSystemChange}
        systems={[gregorianSystem, second]}
        testID="cal"
      >
        <SystemSwitcher />
      </Root>
    );
    fireEvent.press(getByTestId('cal.calendar.systemSwitcher.mock-hijri'));
    expect(onSystemChange).toHaveBeenCalledWith('mock-hijri');
  });

  it('honours the render-prop API', () => {
    const second = makeSystem('mock-hijri', 'Hijri');
    const { getByText } = render(
      <Root systems={[gregorianSystem, second]} testID="cal">
        <SystemSwitcher>
          {({ systems, activeId, setActive }) => (
            <>
              {systems.map((s) => (
                <Text
                  key={s.id}
                  onPress={() => setActive(s.id)}
                  testID={`pill-${s.id}`}
                >
                  {s.id === activeId ? `[${s.label}]` : s.label}
                </Text>
              ))}
            </>
          )}
        </SystemSwitcher>
      </Root>
    );
    expect(getByText('[Gregorian]')).toBeTruthy();
    expect(getByText('Hijri')).toBeTruthy();
  });

  it('ignores setActive calls for unknown ids', () => {
    const second = makeSystem('mock-hijri', 'Hijri');
    const onSystemChange = jest.fn();
    let capturedSetActive: ((id: string) => void) | null = null;
    render(
      <Root
        onSystemChange={onSystemChange}
        systems={[gregorianSystem, second]}
        testID="cal"
      >
        <SystemSwitcher>
          {({ setActive }) => {
            capturedSetActive = setActive;
            return <Text>render</Text>;
          }}
        </SystemSwitcher>
      </Root>
    );
    capturedSetActive!('does-not-exist');
    expect(onSystemChange).not.toHaveBeenCalled();
  });

  it('renders without a testID prefix when none is configured', () => {
    const second = makeSystem('mock-hijri', 'Hijri');
    const { queryByTestId } = render(
      <Root systems={[gregorianSystem, second]}>
        <SystemSwitcher />
      </Root>
    );
    expect(queryByTestId('calendar.systemSwitcher')).toBeNull();
  });
});
