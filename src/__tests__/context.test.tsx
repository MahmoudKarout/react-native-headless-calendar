import { useEffect } from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { Root } from '../components/Root';
import {
  CalendarConfigContext,
  useCalendarConfig,
  useCalendarLabels,
  useCalendarPrimitives,
  useCalendarSelector,
  useCalendarStore,
  useCalendarTheme,
} from '../context';
import { gregorianSystem } from '../systems/gregorian';

const Capture = <T,>({ run }: { run: () => T }) => {
  run();
  return null;
};

describe('useCalendarStore', () => {
  it('throws when used outside <Calendar.Root>', () => {
    expect(() => render(<Capture run={() => useCalendarStore()} />)).toThrow(
      /<Calendar.Root>/
    );
  });

  it('returns the store inside <Calendar.Root>', () => {
    let captured: unknown;
    render(
      <Root systems={[gregorianSystem]}>
        <Capture
          run={() => {
            captured = useCalendarStore();
          }}
        />
      </Root>
    );
    expect(captured).toBeDefined();
  });
});

describe('useCalendarSelector', () => {
  it('subscribes to a slice of state and updates on change', () => {
    let storeRef: ReturnType<typeof useCalendarStore> | null = null;
    let lastView = '';
    const Probe = () => {
      storeRef = useCalendarStore();
      lastView = useCalendarSelector((s) => s.view);
      return null;
    };
    render(
      <Root systems={[gregorianSystem]}>
        <Probe />
      </Root>
    );
    expect(lastView).toBe('day');
    act(() => {
      storeRef!.setView('month');
    });
    expect(lastView).toBe('month');
  });
});

describe('useCalendarConfig', () => {
  it('throws when used outside <Calendar.Root>', () => {
    expect(() => render(<Capture run={() => useCalendarConfig()} />)).toThrow(
      /<Calendar.Root>/
    );
  });

  it('throws when the provider value is null', () => {
    // Force a null context value to exercise the fallback branch.
    expect(() =>
      render(
        <CalendarConfigContext.Provider value={null}>
          <Capture run={() => useCalendarConfig()} />
        </CalendarConfigContext.Provider>
      )
    ).toThrow(/<Calendar.Root>/);
  });

  it('returns the merged config inside <Calendar.Root>', () => {
    let captured: ReturnType<typeof useCalendarConfig> | null = null;
    render(
      <Root systems={[gregorianSystem]} testID="cal">
        <Capture
          run={() => {
            captured = useCalendarConfig();
          }}
        />
      </Root>
    );
    expect(captured).not.toBeNull();
    expect(captured!.systems).toEqual([gregorianSystem]);
    expect(captured!.testID).toBe('cal');
  });
});

describe('useCalendarPrimitives / useCalendarTheme / useCalendarLabels', () => {
  it('returns slices of the merged config', () => {
    const captured: Record<string, unknown> = {};
    const Probe = () => {
      captured.primitives = useCalendarPrimitives();
      captured.theme = useCalendarTheme();
      captured.labels = useCalendarLabels();
      // Suppress unused warning by rendering something.
      useEffect(() => undefined, []);
      return <Text>ok</Text>;
    };
    const { getByText } = render(
      <Root systems={[gregorianSystem]}>
        <Probe />
      </Root>
    );
    expect(getByText('ok')).toBeTruthy();
    expect(captured.primitives).toBeDefined();
    expect(captured.theme).toBeDefined();
    expect(captured.labels).toBeDefined();
  });
});
