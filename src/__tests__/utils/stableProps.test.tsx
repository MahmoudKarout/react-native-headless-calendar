import { act, render } from '@testing-library/react-native';
import { useEffect, useRef, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import {
  useStableArray,
  useStableCallback,
  useStableRecord,
} from '../../utils/stableProps';

// -- useStableCallback -------------------------------------------------------

describe('useStableCallback()', () => {
  it('returns the same wrapper across renders when callback is defined both times', () => {
    const refs: Array<((x: number) => number) | undefined> = [];
    const Comp = ({ cb }: { cb: (x: number) => number }) => {
      const stable = useStableCallback(cb);
      refs.push(stable);
      return null;
    };
    const ui = render(<Comp cb={(x) => x + 1} />);
    ui.rerender(<Comp cb={(x) => x + 2} />);
    expect(refs[0]).toBeDefined();
    expect(refs[0]).toBe(refs[1]);
  });

  it('always invokes the latest callback through the stable wrapper', () => {
    let stable: ((x: number) => number) | undefined;
    const Comp = ({ cb }: { cb: (x: number) => number }) => {
      stable = useStableCallback(cb);
      return null;
    };
    const ui = render(<Comp cb={(x) => x + 10} />);
    expect(stable!(1)).toBe(11);
    ui.rerender(<Comp cb={(x) => x * 100} />);
    expect(stable!(2)).toBe(200);
  });

  it('returns undefined when the underlying callback is undefined', () => {
    const Comp = ({ cb }: { cb?: () => void }) => {
      const stable = useStableCallback(cb);
      return <Text testID="t">{stable ? 'fn' : 'none'}</Text>;
    };
    const ui = render(<Comp />);
    expect(ui.getByTestId('t').props.children).toBe('none');
  });

  it('flips wrapper identity at defined ↔ undefined transitions', () => {
    const refs: Array<((x: number) => number) | undefined> = [];
    const Comp = ({ cb }: { cb?: (x: number) => number }) => {
      refs.push(useStableCallback(cb));
      return null;
    };
    const ui = render(<Comp cb={(x) => x} />);
    ui.rerender(<Comp />);
    ui.rerender(<Comp cb={(x) => x * 2} />);
    expect(refs[0]).toBeDefined();
    expect(refs[1]).toBeUndefined();
    expect(refs[2]).toBeDefined();
  });
});

// -- useStableArray ----------------------------------------------------------

describe('useStableArray()', () => {
  it('returns the same reference when elements are === equal', () => {
    const a = { id: 1 };
    const b = { id: 2 };
    const refs: ReadonlyArray<unknown>[] = [];
    const Comp = ({ arr }: { arr: readonly unknown[] }) => {
      refs.push(useStableArray(arr));
      return null;
    };
    const ui = render(<Comp arr={[a, b]} />);
    ui.rerender(<Comp arr={[a, b]} />);
    expect(refs[0]).toBe(refs[1]);
  });

  it('returns a new reference when an element changes', () => {
    const a = { id: 1 };
    const b = { id: 2 };
    const c = { id: 3 };
    const refs: ReadonlyArray<unknown>[] = [];
    const Comp = ({ arr }: { arr: readonly unknown[] }) => {
      refs.push(useStableArray(arr));
      return null;
    };
    const ui = render(<Comp arr={[a, b]} />);
    ui.rerender(<Comp arr={[a, c]} />);
    expect(refs[0]).not.toBe(refs[1]);
    expect(refs[1]).toEqual([a, c]);
  });

  it('preserves identity across two empty arrays', () => {
    const refs: ReadonlyArray<unknown>[] = [];
    const Comp = ({ arr }: { arr: readonly unknown[] }) => {
      refs.push(useStableArray(arr));
      return null;
    };
    const ui = render(<Comp arr={[]} />);
    ui.rerender(<Comp arr={[]} />);
    expect(refs[0]).toBe(refs[1]);
  });

  it('returns a new reference when array length changes', () => {
    const a = { id: 1 };
    const refs: ReadonlyArray<unknown>[] = [];
    const Comp = ({ arr }: { arr: readonly unknown[] }) => {
      refs.push(useStableArray(arr));
      return null;
    };
    const ui = render(<Comp arr={[a]} />);
    ui.rerender(<Comp arr={[a, a]} />);
    expect(refs[0]).not.toBe(refs[1]);
  });
});

// -- useStableRecord ---------------------------------------------------------

describe('useStableRecord()', () => {
  it('returns the same reference when all keys/values are ===', () => {
    const fn = () => true;
    const refs: Array<unknown> = [];
    const Comp = ({ rec }: { rec?: Readonly<Record<string, unknown>> }) => {
      refs.push(useStableRecord(rec));
      return null;
    };
    const ui = render(<Comp rec={{ a: fn, b: 1 }} />);
    ui.rerender(<Comp rec={{ a: fn, b: 1 }} />);
    expect(refs[0]).toBe(refs[1]);
  });

  it('returns a new reference when a value changes', () => {
    const refs: Array<unknown> = [];
    const Comp = ({ rec }: { rec?: Readonly<Record<string, unknown>> }) => {
      refs.push(useStableRecord(rec));
      return null;
    };
    const ui = render(<Comp rec={{ a: 1 }} />);
    ui.rerender(<Comp rec={{ a: 2 }} />);
    expect(refs[0]).not.toBe(refs[1]);
  });

  it('preserves identity across two empty records', () => {
    const refs: Array<unknown> = [];
    const Comp = ({ rec }: { rec?: Readonly<Record<string, unknown>> }) => {
      refs.push(useStableRecord(rec));
      return null;
    };
    const ui = render(<Comp rec={{}} />);
    ui.rerender(<Comp rec={{}} />);
    expect(refs[0]).toBe(refs[1]);
  });

  it('returns a new reference when keys differ', () => {
    const refs: Array<unknown> = [];
    const Comp = ({ rec }: { rec?: Readonly<Record<string, unknown>> }) => {
      refs.push(useStableRecord(rec));
      return null;
    };
    const ui = render(<Comp rec={{ a: 1 }} />);
    ui.rerender(<Comp rec={{ a: 1, b: 2 }} />);
    expect(refs[0]).not.toBe(refs[1]);
  });

  it('flips between defined and undefined cleanly', () => {
    const refs: Array<unknown> = [];
    const Comp = ({ rec }: { rec?: Readonly<Record<string, unknown>> }) => {
      refs.push(useStableRecord(rec));
      return null;
    };
    const ui = render(<Comp rec={{ a: 1 }} />);
    ui.rerender(<Comp />);
    ui.rerender(<Comp rec={{ a: 1 }} />);
    expect(refs[1]).toBeUndefined();
    expect(refs[2]).toBeDefined();
  });

  it('returns the same undefined across consecutive undefined inputs', () => {
    const refs: Array<unknown> = [];
    const Comp = ({ rec }: { rec?: Readonly<Record<string, unknown>> }) => {
      refs.push(useStableRecord(rec));
      return null;
    };
    const ui = render(<Comp />);
    ui.rerender(<Comp />);
    expect(refs[0]).toBeUndefined();
    expect(refs[1]).toBeUndefined();
  });
});

// Silence the noUnusedLocals warning if any.
export const _utils = { act, useEffect, useRef, View } as const;
export type _T = ReactNode;
