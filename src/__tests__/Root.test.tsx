/**
 * Tests for <CalendarProvider> — store construction, callback wiring,
 * prop-sync layout effects, and the active-system swap when `systems`
 * changes identity.
 *
 * The provider is tested as a black box through the public hooks: a
 * Probe component reads slices via `useCalendarSelector`, and the test
 * mutates parent props with `rerender`. Anything observable from
 * consumer-land is fair game.
 */
import { useState } from 'react';
import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Root as CalendarProvider } from '../components/Root';
import {
  selectCanConfirm,
  useCalendarActions,
  useCalendarSelector,
} from '../context';
import { createGregorianSystem, gregorianSystem } from '../systems/gregorian';

describe('<CalendarProvider>', () => {
  it('renders children and wires the store via context', () => {
    const { getByText } = render(
      <CalendarProvider>
        <Text>hello</Text>
      </CalendarProvider>
    );
    expect(getByText('hello')).toBeTruthy();
  });

  it('seeds the store from initialDate / mode props', () => {
    let mode: string | undefined;
    function Probe() {
      mode = useCalendarSelector((s) => s.mode);
      return null;
    }
    render(
      <CalendarProvider mode="range" initialStart={new Date(2024, 0, 1)}>
        <Probe />
      </CalendarProvider>
    );
    expect(mode).toBe('range');
  });

  it('fires onChange / onConfirm / onClear with the live payload', () => {
    const onChange = jest.fn();
    const onConfirm = jest.fn();
    const onClear = jest.fn();

    function PickAndConfirm() {
      const { selectDate, confirm, clear } = useCalendarActions();
      return (
        <>
          <Text testID="pick" onPress={() => selectDate(new Date(2024, 0, 1))}>
            pick
          </Text>
          <Text testID="confirm" onPress={confirm}>
            confirm
          </Text>
          <Text testID="clear" onPress={clear}>
            clear
          </Text>
        </>
      );
    }

    const { getByTestId } = render(
      <CalendarProvider
        onChange={onChange}
        onConfirm={onConfirm}
        onClear={onClear}
      >
        <PickAndConfirm />
      </CalendarProvider>
    );
    act(() => {
      getByTestId('pick').props.onPress();
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    act(() => {
      getByTestId('confirm').props.onPress();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    act(() => {
      getByTestId('clear').props.onPress();
    });
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('action identity is stable across re-renders for the lifetime of the provider', () => {
    const seen: ReturnType<typeof useCalendarActions>[] = [];
    function Probe() {
      seen.push(useCalendarActions());
      return null;
    }
    function Parent({ tick }: { tick: number }) {
      return (
        <CalendarProvider>
          <Probe />
          <Text>{tick}</Text>
        </CalendarProvider>
      );
    }
    const { rerender } = render(<Parent tick={0} />);
    rerender(<Parent tick={1} />);
    rerender(<Parent tick={2} />);
    expect(seen[0]).toBe(seen[1]);
    expect(seen[1]).toBe(seen[2]);
  });

  it('syncs mutable props into the store via useLayoutEffect', () => {
    let snapshotCanConfirm: boolean | undefined;
    function Probe() {
      snapshotCanConfirm = useCalendarSelector(selectCanConfirm);
      return null;
    }
    function PickButton() {
      const { selectDate } = useCalendarActions();
      return (
        <Text testID="pick" onPress={() => selectDate(new Date(2024, 0, 15))}>
          pick
        </Text>
      );
    }

    function Wrapper() {
      const [allowSame, setAllow] = useState(false);
      return (
        <>
          <Text testID="toggle" onPress={() => setAllow(true)}>
            toggle
          </Text>
          <CalendarProvider mode="range" allowSameDay={allowSame}>
            <Probe />
            <PickButton />
          </CalendarProvider>
        </>
      );
    }

    const { getByTestId } = render(<Wrapper />);
    expect(snapshotCanConfirm).toBe(false);

    // Toggle a syncable prop — the layout effect should sync into the
    // store without throwing or losing the active store identity.
    act(() => {
      getByTestId('toggle').props.onPress();
    });
    act(() => {
      getByTestId('pick').props.onPress();
    });
    // We selected a start but no end yet, so range is not confirmable.
    expect(snapshotCanConfirm).toBe(false);
  });

  it('swaps the active system when `systems` changes identity', () => {
    const alt = createGregorianSystem({ label: 'Alt' });
    Object.defineProperty(alt, 'id', { value: 'alt-gregorian' });

    let activeSystemId: string | undefined;
    function Probe() {
      activeSystemId = useCalendarSelector((s) => s.system.id);
      return null;
    }

    function Wrapper({ which }: { which: 'a' | 'b' }) {
      const systems = which === 'a' ? [gregorianSystem] : [alt];
      return (
        <CalendarProvider systems={systems}>
          <Probe />
        </CalendarProvider>
      );
    }

    const { rerender } = render(<Wrapper which="a" />);
    expect(activeSystemId).toBe(gregorianSystem.id);

    rerender(<Wrapper which="b" />);
    expect(activeSystemId).toBe('alt-gregorian');
  });

  it('replaces the active system instance when a new reference with the same id arrives', () => {
    // Build two distinct system instances that report the same id. The
    // first render uses `original`; the second render uses `twin`. Since
    // `findIndex(s.id === currentId)` returns 0 but the instance at
    // index 0 is no longer the one in the store, the provider should
    // call `replaceSystem(twin, 0)`.
    const original = createGregorianSystem({ label: 'Original' });
    Object.defineProperty(original, 'id', { value: 'twin-id' });
    const twin = createGregorianSystem({ label: 'Twin' });
    Object.defineProperty(twin, 'id', { value: 'twin-id' });

    let activeSystemLabel: string | undefined;
    function Probe() {
      activeSystemLabel = useCalendarSelector((s) => s.system.label);
      return null;
    }
    function Wrapper({ which }: { which: 'orig' | 'twin' }) {
      const systems = which === 'orig' ? [original] : [twin];
      return (
        <CalendarProvider systems={systems}>
          <Probe />
        </CalendarProvider>
      );
    }
    const { rerender } = render(<Wrapper which="orig" />);
    expect(activeSystemLabel).toBe('Original');
    rerender(<Wrapper which="twin" />);
    expect(activeSystemLabel).toBe('Twin');
  });

  it('handles a system-list reorder where the active system stays present', () => {
    const alt = createGregorianSystem({ label: 'Alt' });
    Object.defineProperty(alt, 'id', { value: 'alt-greg-reorder' });

    let activeSystemId: string | undefined;
    function Probe() {
      activeSystemId = useCalendarSelector((s) => s.system.id);
      return null;
    }
    function Wrapper({ order }: { order: 'forward' | 'reverse' }) {
      const systems =
        order === 'forward' ? [gregorianSystem, alt] : [alt, gregorianSystem];
      return (
        <CalendarProvider systems={systems}>
          <Probe />
        </CalendarProvider>
      );
    }
    const { rerender } = render(<Wrapper order="forward" />);
    expect(activeSystemId).toBe(gregorianSystem.id);
    rerender(<Wrapper order="reverse" />);
    // Active system id is preserved across the reorder.
    expect(activeSystemId).toBe(gregorianSystem.id);
  });

  it('updates modifiers when the prop reference changes', () => {
    let mondayHit: boolean | undefined;
    function Probe() {
      mondayHit = useCalendarSelector((s) =>
        s.days.cells.some((c) => c.modifiers.monday)
      );
      return null;
    }
    function Wrapper({ on }: { on: boolean }) {
      return (
        <CalendarProvider
          initialDate={new Date(2024, 0, 1)}
          modifiers={on ? { monday: (d: Date) => d.getDay() === 1 } : undefined}
        >
          <Probe />
        </CalendarProvider>
      );
    }
    const { rerender } = render(<Wrapper on={false} />);
    expect(mondayHit).toBe(false);
    rerender(<Wrapper on={true} />);
    expect(mondayHit).toBe(true);
  });
});
