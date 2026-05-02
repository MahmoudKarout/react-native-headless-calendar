import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { Root } from '../../components/Root';
import {
  useCalendarConfig,
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

  it('merges primitives overrides with defaults', () => {
    const CustomView = () => null;
    let captured: CalendarConfig | null = null;
    render(
      <Root
        primitives={{
          View: CustomView as unknown as CalendarConfig['primitives']['View'],
        }}
        systems={[gregorianSystem]}
      >
        <Probe capture={(c) => (captured = c.config)} />
      </Root>
    );
    expect(captured!.primitives.View).toBe(CustomView);
    expect(captured!.primitives.Text).toBeDefined();
    expect(captured!.primitives.Pressable).toBeDefined();
    expect(captured!.primitives.Icon).toBeDefined();
  });

  it('passes onConfirm / onClear / onSystemChange / onSelectHaptic / testID through', () => {
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
    expect(captured!.onConfirm).toBe(onConfirm);
    expect(captured!.onClear).toBe(onClear);
    expect(captured!.onSystemChange).toBe(onSystemChange);
    expect(captured!.onSelectHaptic).toBe(onSelectHaptic);
    expect(captured!.testID).toBe('cal');
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
