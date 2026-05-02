import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { Root } from '../components/Root';
import {
  CalendarConfigContext,
  useCalendarActions,
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

// ---------------------------------------------------------------------------
// useCalendarActions
// ---------------------------------------------------------------------------

describe('useCalendarActions', () => {
  // Tiny harness that surfaces the hook's API as DOM nodes the test can
  // press / inspect — keeps the assertions focused on the hook contract.
  const ActionsHarness = () => {
    const { confirm, clear, canConfirm } = useCalendarActions();
    return (
      <>
        <Text testID="canConfirm">{canConfirm ? 'yes' : 'no'}</Text>
        <Pressable onPress={confirm} testID="confirm">
          <Text>confirm</Text>
        </Pressable>
        <Pressable onPress={clear} testID="clear">
          <Text>clear</Text>
        </Pressable>
      </>
    );
  };

  it('throws when used outside <Calendar.Root>', () => {
    expect(() => render(<Capture run={() => useCalendarActions()} />)).toThrow(
      /<Calendar.Root>/
    );
  });

  it('canConfirm is false on first render in single mode', () => {
    const { getByTestId } = render(
      <Root systems={[gregorianSystem]}>
        <ActionsHarness />
      </Root>
    );
    expect(getByTestId('canConfirm').props.children).toBe('no');
  });

  it('canConfirm becomes true once a single date is preselected', () => {
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <ActionsHarness />
      </Root>
    );
    expect(getByTestId('canConfirm').props.children).toBe('yes');
  });

  it('canConfirm stays false in range mode without both endpoints', () => {
    const { getByTestId } = render(
      <Root
        initialStart={new Date(2024, 4, 15)}
        mode="range"
        systems={[gregorianSystem]}
      >
        <ActionsHarness />
      </Root>
    );
    expect(getByTestId('canConfirm').props.children).toBe('no');
  });

  it('canConfirm flips to true once both range endpoints exist', () => {
    const { getByTestId } = render(
      <Root
        initialEnd={new Date(2024, 4, 20)}
        initialStart={new Date(2024, 4, 15)}
        mode="range"
        systems={[gregorianSystem]}
      >
        <ActionsHarness />
      </Root>
    );
    expect(getByTestId('canConfirm').props.children).toBe('yes');
  });

  it('confirm fires onConfirm with the single-mode payload', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        onConfirm={onConfirm}
        systems={[gregorianSystem]}
      >
        <ActionsHarness />
      </Root>
    );
    fireEvent.press(getByTestId('confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        systemId: 'gregorian',
        date: expect.any(Date),
      })
    );
  });

  it('confirm fires onConfirm with start/end in range mode', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <Root
        initialEnd={new Date(2024, 4, 20)}
        initialStart={new Date(2024, 4, 15)}
        mode="range"
        onConfirm={onConfirm}
        systems={[gregorianSystem]}
      >
        <ActionsHarness />
      </Root>
    );
    fireEvent.press(getByTestId('confirm'));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        systemId: 'gregorian',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      })
    );
  });

  it('confirm passes undefined date fields when nothing is selected', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <Root onConfirm={onConfirm} systems={[gregorianSystem]}>
        <ActionsHarness />
      </Root>
    );
    fireEvent.press(getByTestId('confirm'));
    expect(onConfirm).toHaveBeenCalledWith({
      systemId: 'gregorian',
      date: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  });

  it('confirm is a no-op when onConfirm is not provided', () => {
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <ActionsHarness />
      </Root>
    );
    expect(() => fireEvent.press(getByTestId('confirm'))).not.toThrow();
  });

  it('clear wipes the selection and fires onClear', () => {
    const onClear = jest.fn();
    const { getByTestId } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        onClear={onClear}
        systems={[gregorianSystem]}
      >
        <ActionsHarness />
      </Root>
    );
    expect(getByTestId('canConfirm').props.children).toBe('yes');
    fireEvent.press(getByTestId('clear'));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(getByTestId('canConfirm').props.children).toBe('no');
  });

  it('clear is safe when onClear was not provided', () => {
    const { getByTestId } = render(
      <Root initialDate={new Date(2024, 4, 15)} systems={[gregorianSystem]}>
        <ActionsHarness />
      </Root>
    );
    expect(() => fireEvent.press(getByTestId('clear'))).not.toThrow();
    expect(getByTestId('canConfirm').props.children).toBe('no');
  });
});
