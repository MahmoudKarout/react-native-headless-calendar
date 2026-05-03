import React from 'react';
import { render } from '@testing-library/react-native';

import {
  useStableArray,
  useStableCallback,
  useStablePredicate,
  useStableRecord,
} from '../../utils/stableProps';

// Tiny harness: renders a noop component that pipes a hook through a
// capture so we can poke its inputs from the test and snapshot the
// output identity across renders.
const makeHarness = <Args extends unknown[], Out>(
  hook: (...args: Args) => Out
) => {
  let capture: Out;
  const Harness: React.FC<{ args: Args }> = ({ args }) => {
    capture = hook(...args);
    return null;
  };
  return {
    Harness,
    get value() {
      return capture;
    },
  };
};

describe('useStableCallback', () => {
  it('returns undefined when the callback is undefined and a stable wrapper otherwise', () => {
    const h = makeHarness((cb: (() => void) | undefined) =>
      useStableCallback(cb)
    );
    const { rerender } = render(<h.Harness args={[undefined]} />);
    expect(h.value).toBeUndefined();
    rerender(<h.Harness args={[() => undefined]} />);
    const first = h.value;
    expect(first).toBeDefined();
    rerender(<h.Harness args={[() => undefined]} />);
    expect(h.value).toBe(first);
  });

  it('always invokes the latest callback identity', () => {
    const h = makeHarness((cb: () => void) => useStableCallback(cb));
    const a = jest.fn();
    const b = jest.fn();
    const { rerender } = render(<h.Harness args={[a]} />);
    h.value!();
    rerender(<h.Harness args={[b]} />);
    h.value!();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});

describe('useStablePredicate', () => {
  it('returns the latest predicate result through a stable wrapper', () => {
    const h = makeHarness((cb: ((n: number) => number) | undefined) =>
      useStablePredicate(cb)
    );
    const double = (n: number) => n * 2;
    const triple = (n: number) => n * 3;
    const { rerender } = render(<h.Harness args={[double]} />);
    const first = h.value;
    expect(first!(2)).toBe(4);
    rerender(<h.Harness args={[triple]} />);
    expect(h.value).toBe(first);
    expect(h.value!(2)).toBe(6);
    rerender(<h.Harness args={[undefined]} />);
    expect(h.value).toBeUndefined();
  });
});

describe('useStableArray', () => {
  it('returns the previous reference when contents are strictly equal', () => {
    const h = makeHarness((arr: readonly number[]) => useStableArray(arr));
    const { rerender } = render(<h.Harness args={[[1, 2, 3]]} />);
    const first = h.value;
    rerender(<h.Harness args={[[1, 2, 3]]} />);
    expect(h.value).toBe(first);
    rerender(<h.Harness args={[[1, 2, 4]]} />);
    expect(h.value).not.toBe(first);
    rerender(<h.Harness args={[[1, 2]]} />);
    // Length-mismatch path.
    expect(h.value).toEqual([1, 2]);
  });
});

describe('useStableRecord', () => {
  // The record stabiliser has more interesting branches than the
  // others — it has to account for prev/next being undefined (one or
  // both) and for differing keys vs differing values.
  it('caches a non-undefined record across re-renders with shallow-equal keys', () => {
    const h = makeHarness((rec: Record<string, number> | undefined) =>
      useStableRecord(rec)
    );
    const { rerender } = render(<h.Harness args={[{ a: 1 }]} />);
    const first = h.value;
    rerender(<h.Harness args={[{ a: 1 }]} />);
    expect(h.value).toBe(first);
  });

  it('updates the cache when transitioning from undefined to defined', () => {
    const h = makeHarness((rec: Record<string, number> | undefined) =>
      useStableRecord(rec)
    );
    const { rerender } = render(<h.Harness args={[undefined]} />);
    expect(h.value).toBeUndefined();
    rerender(<h.Harness args={[{ a: 1 }]} />);
    expect(h.value).toEqual({ a: 1 });
  });

  it('updates the cache when transitioning from defined to undefined', () => {
    const h = makeHarness((rec: Record<string, number> | undefined) =>
      useStableRecord(rec)
    );
    const { rerender } = render(<h.Harness args={[{ a: 1 }]} />);
    expect(h.value).toEqual({ a: 1 });
    rerender(<h.Harness args={[undefined]} />);
    expect(h.value).toBeUndefined();
  });

  it('replaces the cache when a key value differs', () => {
    const h = makeHarness((rec: Record<string, number> | undefined) =>
      useStableRecord(rec)
    );
    const { rerender } = render(<h.Harness args={[{ a: 1 }]} />);
    const first = h.value;
    rerender(<h.Harness args={[{ a: 2 }]} />);
    expect(h.value).not.toBe(first);
    expect(h.value).toEqual({ a: 2 });
  });

  it('replaces the cache when key sets differ', () => {
    const h = makeHarness((rec: Record<string, number> | undefined) =>
      useStableRecord(rec)
    );
    const { rerender } = render(<h.Harness args={[{ a: 1 }]} />);
    rerender(<h.Harness args={[{ a: 1, b: 2 }]} />);
    expect(h.value).toEqual({ a: 1, b: 2 });
  });
});
