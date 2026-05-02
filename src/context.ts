/**
 * Two contexts, decoupled on purpose:
 *
 *   1. CalendarStoreContext — holds the store INSTANCE (never changes
 *      reference). Compound parts subscribe to slices via
 *      `useCalendarSelector` and only re-render when those slices change.
 *
 *   2. CalendarConfigContext — holds primitives, theme, labels, callbacks,
 *      and the systems list. Updates infrequently. Splitting it from the
 *      store means a date tap doesn't propagate any context change at all.
 */
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react';

import type { CalendarStore, CalendarSnapshot } from './store';
import type {
  CalendarLabels,
  CalendarPrimitives,
  CalendarSystem,
  CalendarTheme,
  OnConfirm,
  OnClear,
  OnSystemChange,
} from './types';

// ---------------------------------------------------------------------------
// Store context
// ---------------------------------------------------------------------------

export const CalendarStoreContext = createContext<CalendarStore | null>(null);

export function useCalendarStore(): CalendarStore {
  const store = useContext(CalendarStoreContext);
  if (!store) {
    throw new Error(
      '[Calendar] useCalendarStore must be used within <Calendar.Root>'
    );
  }
  return store;
}

/**
 * Subscribe to a slice of calendar state.
 *
 * The component re-renders only when the selector's return value differs
 * (Object.is). Prefer primitive returns (number, string, boolean) for
 * maximum stability — e.g. select `s.system.id` instead of `s.system`.
 */
export function useCalendarSelector<T>(
  selector: (snapshot: CalendarSnapshot) => T
): T {
  const store = useCalendarStore();
  return useSyncExternalStore(store.subscribe, () =>
    selector(store.getSnapshot())
  );
}

// ---------------------------------------------------------------------------
// Config context — primitives, theme, labels, external callbacks.
// ---------------------------------------------------------------------------

export interface CalendarConfig {
  primitives: CalendarPrimitives;
  theme: CalendarTheme;
  labels: CalendarLabels;
  systems: readonly CalendarSystem[];
  onConfirm?: OnConfirm;
  onClear?: OnClear;
  onSystemChange?: OnSystemChange;
  /** Optional haptic hook fired on day selection. */
  onSelectHaptic?: () => void;
  testID?: string;
}

export const CalendarConfigContext = createContext<CalendarConfig | null>(null);

export function useCalendarConfig(): CalendarConfig {
  const config = useContext(CalendarConfigContext);
  if (!config) {
    throw new Error(
      '[Calendar] useCalendarConfig must be used within <Calendar.Root>'
    );
  }
  return config;
}

/** Convenience helpers — common slices. */

export const useCalendarPrimitives = (): CalendarPrimitives =>
  useCalendarConfig().primitives;

export const useCalendarTheme = (): CalendarTheme => useCalendarConfig().theme;

export const useCalendarLabels = (): CalendarLabels =>
  useCalendarConfig().labels;

// ---------------------------------------------------------------------------
// useCalendarActions — confirm + clear exposed as plain functions so the
// consumer can wire them to whatever button (or shortcut, or gesture, …)
// they want. The package ships no opinion on what an action button looks
// like.
//
//   const { confirm, clear, canConfirm } = useCalendarActions();
//
//   <MyPrimaryButton disabled={!canConfirm} onPress={confirm}>
//     Done
//   </MyPrimaryButton>
//   <MyGhostButton onPress={clear}>Reset</MyGhostButton>
// ---------------------------------------------------------------------------

export interface CalendarActions {
  /**
   * Fire the configured `onConfirm` (passed to <Calendar.Root>) with the
   * current selection payload. Reads the latest snapshot at call time, so
   * the function identity is stable across renders.
   *
   * No-op when `onConfirm` was not provided on <Calendar.Root>.
   */
  confirm: () => void;
  /**
   * Wipe all selection state (single date + range endpoints) and fire the
   * configured `onClear` callback if one was provided. Stable identity.
   */
  clear: () => void;
  /**
   * `true` when the current selection is confirmable:
   *   - single mode: a date is selected.
   *   - range mode:  both endpoints are selected.
   *
   * Subscribed via a granular selector — toggling between two valid
   * selections doesn't cause this to change, so consumers that pass it to
   * a memoised button will skip re-renders.
   */
  canConfirm: boolean;
}

export function useCalendarActions(): CalendarActions {
  const store = useCalendarStore();
  const { onConfirm, onClear } = useCalendarConfig();

  const canConfirm = useCalendarSelector((s) => {
    if (s.mode === 'single') return !!s.selectedDate;
    return !!(s.rangeStart && s.rangeEnd);
  });

  const confirm = useCallback(() => {
    if (!onConfirm) return;
    const s = store.getSnapshot();
    onConfirm({
      date: s.selectedDate ? s.system.toNativeDate(s.selectedDate) : undefined,
      startDate: s.rangeStart ? s.system.toNativeDate(s.rangeStart) : undefined,
      endDate: s.rangeEnd ? s.system.toNativeDate(s.rangeEnd) : undefined,
      systemId: s.system.id,
    });
  }, [onConfirm, store]);

  const clear = useCallback(() => {
    store.clear();
    onClear?.();
  }, [store, onClear]);

  return { confirm, clear, canConfirm };
}
