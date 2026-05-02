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
import { createContext, useContext, useSyncExternalStore } from 'react';

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
  systems: CalendarSystem[];
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
