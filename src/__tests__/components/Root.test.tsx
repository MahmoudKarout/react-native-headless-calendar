import { memo } from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { Root } from '../../components/Root';
import {
  useCalendarActions,
  useCalendarConfig,
  useCalendarLabels,
  useCalendarSelector,
  useCalendarStore,
} from '../../context';
import {
  createGregorianSystem,
  gregorianSystem,
} from '../../systems/gregorian';
import type { CalendarConfig } from '../../context';
import type { CalendarStore } from '../../store';

const Probe = ({
  capture,
}: {
  capture: (data: {
    config: CalendarConfig;
    store: CalendarStore;
    systemId: string;
  }) => void;
}) => {
  const config = useCalendarConfig();
  const store = useCalendarStore();
  const systemId = useCalendarSelector((s) => s.system.id);
  capture({ config, store, systemId });
  return <Text>ready</Text>;
};

describe('<Calendar.Root>', () => {
  it('creates a stable store across re-renders', () => {
    const captured: CalendarStore[] = [];
    const Wrapper = () => (
      <Root systems={[gregorianSystem]}>
        <Probe capture={(c) => captured.push(c.store)} />
      </Root>
    );
    const { rerender } = render(<Wrapper />);
    rerender(<Wrapper />);
    expect(captured.length).toBeGreaterThanOrEqual(2);
    expect(captured[0]).toBe(captured[1]);
  });

  it('merges theme overrides with defaults', () => {
    let captured: CalendarConfig | null = null;
    render(
      <Root
        systems={[gregorianSystem]}
        theme={{ colors: { primary: '#FF0000' }, cellSize: 50 }}
      >
        <Probe capture={(c) => (captured = c.config)} />
      </Root>
    );
    expect(captured!.theme.colors.primary).toBe('#FF0000');
    // Untouched keys still come from defaults.
    expect(captured!.theme.colors.background).toBeDefined();
    expect(captured!.theme.cellSize).toBe(50);
  });

  it('merges label overrides with defaults', () => {
    let captured: CalendarConfig | null = null;
    render(
      <Root systems={[gregorianSystem]} labels={{ confirm: 'Save' }}>
        <Probe capture={(c) => (captured = c.config)} />
      </Root>
    );
    expect(captured!.labels.confirm).toBe('Save');
    expect(captured!.labels.clear).toBeDefined();
  });

  it('forwards onConfirm / onClear / onSystemChange / onSelectHaptic via stable wrappers and exposes testID', () => {
    const onConfirm = jest.fn();
    const onClear = jest.fn();
    const onSystemChange = jest.fn();
    const onSelectHaptic = jest.fn();
    let captured: CalendarConfig | null = null;
    render(
      <Root
        onClear={onClear}
        onConfirm={onConfirm}
        onSelectHaptic={onSelectHaptic}
        onSystemChange={onSystemChange}
        systems={[gregorianSystem]}
        testID="cal"
      >
        <Probe capture={(c) => (captured = c.config)} />
      </Root>
    );
    // Wrappers are functions (not the raw user callback) — calling them
    // forwards to the underlying function so behaviour is preserved.
    expect(typeof captured!.onConfirm).toBe('function');
    expect(typeof captured!.onClear).toBe('function');
    expect(typeof captured!.onSystemChange).toBe('function');
    expect(typeof captured!.onSelectHaptic).toBe('function');
    expect(captured!.onConfirm).not.toBe(onConfirm);
    expect(captured!.testID).toBe('cal');

    captured!.onConfirm!({
      systemId: 'gregorian',
      date: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    captured!.onClear!();
    captured!.onSystemChange!('gregorian');
    captured!.onSelectHaptic!();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onSystemChange).toHaveBeenCalledWith('gregorian');
    expect(onSelectHaptic).toHaveBeenCalledTimes(1);
  });

  it('returns undefined for callback slots that the user did not provide', () => {
    let captured: CalendarConfig | null = null;
    render(
      <Root systems={[gregorianSystem]}>
        <Probe capture={(c) => (captured = c.config)} />
      </Root>
    );
    expect(captured!.onConfirm).toBeUndefined();
    expect(captured!.onClear).toBeUndefined();
    expect(captured!.onSystemChange).toBeUndefined();
    expect(captured!.onSelectHaptic).toBeUndefined();
  });

  it('initialises with the configured initialSystemId', () => {
    const second = createGregorianSystem();
    // Force a unique id so findIndex resolves to 1.
    Object.defineProperty(second, 'id', { value: 'second' });
    let captured: { systemId: string } | null = null;
    render(
      <Root initialSystemId="second" systems={[gregorianSystem, second]}>
        <Probe capture={(c) => (captured = { systemId: c.systemId })} />
      </Root>
    );
    expect(captured!.systemId).toBe('second');
  });

  it('adopts a fresh adapter instance with the same id when systems prop changes', () => {
    const second = createGregorianSystem();
    Object.defineProperty(second, 'id', { value: 'second' });
    const replacement = createGregorianSystem();
    Object.defineProperty(replacement, 'id', { value: 'second' });

    const ids: string[] = [];
    const stores: CalendarStore[] = [];
    const captureFn = (c: { store: CalendarStore; systemId: string }) => {
      ids.push(c.systemId);
      stores.push(c.store);
    };

    const { rerender } = render(
      <Root initialSystemId="second" systems={[gregorianSystem, second]}>
        <Probe capture={captureFn} />
      </Root>
    );
    rerender(
      <Root initialSystemId="second" systems={[gregorianSystem, replacement]}>
        <Probe capture={captureFn} />
      </Root>
    );
    // Same id; the effect should swap the adapter without throwing.
    expect(ids).toContain('second');
    expect(stores[0]).toBe(stores[stores.length - 1]);
  });

  it('falls back to the first system when the active id disappears', () => {
    const removable = createGregorianSystem();
    Object.defineProperty(removable, 'id', { value: 'removable' });

    const ids: string[] = [];
    const captureFn = (c: { systemId: string }) => {
      ids.push(c.systemId);
    };

    const { rerender } = render(
      <Root initialSystemId="removable" systems={[gregorianSystem, removable]}>
        <Probe capture={captureFn} />
      </Root>
    );
    rerender(
      <Root systems={[gregorianSystem]}>
        <Probe capture={captureFn} />
      </Root>
    );
    expect(ids[ids.length - 1]).toBe('gregorian');
  });

  it('syncs prop updates into the store', () => {
    let storeRef: CalendarStore | null = null;
    const captureFn = (c: { store: CalendarStore }) => {
      storeRef = c.store;
    };

    const { rerender } = render(
      <Root mode="single" systems={[gregorianSystem]}>
        <Probe capture={captureFn} />
      </Root>
    );
    rerender(
      <Root mode="range" systems={[gregorianSystem]}>
        <Probe capture={captureFn} />
      </Root>
    );
    expect(storeRef!.getSnapshot().mode).toBe('range');
  });
});

// ---------------------------------------------------------------------------
// Regression: prop-stability guarantees.
//
// The fixes covered here exist so that the user's app pressing "confirm"
// (which triggers their own setState and therefore a parent re-render
// with new inline callback / array identities) does NOT cascade into a
// full calendar re-render. We assert it at two levels:
//   1. the published config object identity stays the same;
//   2. memoised consumers of useCalendarConfig / useCalendarLabels do not
//      re-render.
// ---------------------------------------------------------------------------

describe('<Calendar.Root> — referential stability', () => {
  it('keeps config identity stable when only the inline onConfirm changes', () => {
    const captured: CalendarConfig[] = [];
    const Capture = () => {
      captured.push(useCalendarConfig());
      return null;
    };
    const { rerender } = render(
      <Root onConfirm={() => {}} systems={[gregorianSystem]}>
        <Capture />
      </Root>
    );
    rerender(
      <Root onConfirm={() => {}} systems={[gregorianSystem]}>
        <Capture />
      </Root>
    );
    expect(captured.length).toBeGreaterThanOrEqual(2);
    expect(captured[0]).toBe(captured[captured.length - 1]);
  });

  it('keeps config identity stable when only the inline systems array changes', () => {
    const captured: CalendarConfig[] = [];
    const Capture = () => {
      captured.push(useCalendarConfig());
      return null;
    };
    const { rerender } = render(
      <Root systems={[gregorianSystem]}>
        <Capture />
      </Root>
    );
    rerender(
      <Root systems={[gregorianSystem]}>
        <Capture />
      </Root>
    );
    expect(captured[0]).toBe(captured[captured.length - 1]);
  });

  it('does not re-render a memoised useCalendarLabels consumer on parent re-render', () => {
    let consumerRenders = 0;
    const Consumer = memo(() => {
      useCalendarLabels();
      consumerRenders += 1;
      return null;
    });

    const { rerender } = render(
      <Root onConfirm={() => {}} systems={[gregorianSystem]}>
        <Consumer />
      </Root>
    );
    const after = consumerRenders;
    rerender(
      <Root onConfirm={() => {}} systems={[gregorianSystem]}>
        <Consumer />
      </Root>
    );
    expect(consumerRenders).toBe(after);
  });

  it('rebuilds config when systems content actually changes (different ids)', () => {
    const second = createGregorianSystem();
    Object.defineProperty(second, 'id', { value: 'second' });

    const captured: CalendarConfig[] = [];
    const Capture = () => {
      captured.push(useCalendarConfig());
      return null;
    };
    const { rerender } = render(
      <Root systems={[gregorianSystem]}>
        <Capture />
      </Root>
    );
    rerender(
      <Root systems={[gregorianSystem, second]}>
        <Capture />
      </Root>
    );
    expect(captured[0]).not.toBe(captured[captured.length - 1]);
    expect(captured[captured.length - 1]!.systems).toHaveLength(2);
  });

  it('the stable confirm wrapper always invokes the latest onConfirm', () => {
    // Bug we are guarding against: caching the wrapper but not the
    // underlying callback would call the FIRST onConfirm forever.
    const first = jest.fn();
    const second = jest.fn();

    const Trigger = () => {
      const { confirm } = useCalendarActions();
      return (
        <Text onPress={confirm} testID="go">
          go
        </Text>
      );
    };

    const { getByTestId, rerender } = render(
      <Root
        initialDate={new Date(2024, 4, 15)}
        onConfirm={first}
        systems={[gregorianSystem]}
      >
        <Trigger />
      </Root>
    );
    rerender(
      <Root
        initialDate={new Date(2024, 4, 15)}
        onConfirm={second}
        systems={[gregorianSystem]}
      >
        <Trigger />
      </Root>
    );
    fireEvent.press(getByTestId('go'));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
