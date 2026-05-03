/**
 * Tiny helpers used by <Calendar.Root> to keep its context value identity-
 * stable when consumers pass inline arrow functions / inline arrays.
 *
 * Why this matters
 * ----------------
 * <Calendar.Root> publishes `primitives`, `theme`, `labels`, `systems`, the
 * action callbacks (`onConfirm`, `onClear`, …) and `testID` through a single
 * context. If any of those values change reference, every consumer of
 * `useCalendarConfig` (and the derived theme/labels/primitives hooks) re-
 * renders.
 *
 * Inline arrow callbacks like `onConfirm={({ date }) => setPicked(date)}`
 * are recreated on every parent render — and `setPicked` IS a parent
 * render — so without these helpers the act of confirming a date would
 * re-render the entire calendar tree. Same for `systems={[gregorianSystem]}`
 * written inline.
 */
import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Returns a stable wrapper around `cb` that always invokes the latest
 * version. The wrapper identity is preserved across renders for as long as
 * `cb` stays defined (or stays undefined). Transitions between
 * defined ↔ undefined are observed at the public surface — that is the
 * one case where the returned reference flips, which is the correct
 * behaviour because consumers that branch on `cb` truthiness must re-run.
 *
 * The wrapper reads the latest callback from a ref kept in sync via
 * `useLayoutEffect`. By the time any handler is invoked (always after
 * commit, e.g. inside an `onPress`), the ref is guaranteed to be current.
 */
export function useStableCallback<TArgs extends unknown[]>(
  cb: ((...args: TArgs) => void) | undefined
): ((...args: TArgs) => void) | undefined {
  const ref = useRef(cb);
  useLayoutEffect(() => {
    ref.current = cb;
  });
  // Identity-stable wrapper — created once. The non-null assertion is
  // safe: the wrapper is only handed out below when `cb` is defined, and
  // `useRef(cb)` seeds the ref with that same defined value on the
  // render we hand it out.
  const wrapper = useCallback((...args: TArgs) => {
    ref.current!(...args);
  }, []);
  return cb ? wrapper : undefined;
}

/**
 * Same contract as {@link useStableCallback} but for predicates / mappers
 * that return a value. Used for `disabled?: (date) => boolean` and
 * similarly typed props on `<Calendar.Root>`.
 */
export function useStablePredicate<TArgs extends unknown[], TReturn>(
  cb: ((...args: TArgs) => TReturn) | undefined
): ((...args: TArgs) => TReturn) | undefined {
  const ref = useRef(cb);
  useLayoutEffect(() => {
    ref.current = cb;
  });
  const wrapper = useCallback(
    (...args: TArgs) => ref.current!(...args),
    []
  ) as (...args: TArgs) => TReturn;
  return cb ? wrapper : undefined;
}

/**
 * Returns the previous array reference when the new array's elements are
 * each strictly equal (===) to the previous one's, so inline literals
 * like `[gregorianSystem]` don't churn the consumer.
 *
 * Ref-mutation in render is intentional: this hook is a pure cache and
 * does not subscribe to anything, so React's strict-mode double render is
 * still correct (the second pass observes the cached value and short-
 * circuits).
 */
export function useStableArray<T>(arr: readonly T[]): readonly T[] {
  const ref = useRef(arr);
  const prev = ref.current;
  if (prev !== arr) {
    if (prev.length !== arr.length || prev.some((item, i) => item !== arr[i])) {
      ref.current = arr;
    }
  }
  return ref.current;
}

/**
 * Identity-stable cache for shallow-equal record values. Returns the
 * previous reference when the new object has the same set of keys with
 * each value strictly-equal (===) to the previous one. Lets consumers
 * write inline `modifiers={{ booked }}` / `components={{ DayCell }}`
 * without churning context.
 *
 * Accepts any object-typed value (including typed interfaces with
 * optional fields like `CalendarComponents`); the caller's static type
 * is preserved.
 */
export function useStableRecord<T extends object>(
  rec: T | undefined
): T | undefined {
  const ref = useRef(rec);
  const prev = ref.current;
  if (prev !== rec) {
    if (prev === undefined || rec === undefined) {
      ref.current = rec;
    } else {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(rec);
      let same = prevKeys.length === nextKeys.length;
      if (same) {
        for (const k of nextKeys) {
          if (
            (prev as Record<string, unknown>)[k] !==
            (rec as Record<string, unknown>)[k]
          ) {
            same = false;
            break;
          }
        }
      }
      if (!same) ref.current = rec;
    }
  }
  return ref.current;
}
