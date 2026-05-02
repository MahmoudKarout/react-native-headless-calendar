/**
 * <Calendar.Root> — the only required parent.
 *
 * Sole responsibilities:
 *   1. Construct the CalendarStore once (kept in a ref so it survives renders).
 *   2. Inject primitives / theme / labels / systems via CalendarConfigContext.
 *   3. Sync prop changes into the store via a single useEffect.
 *
 * Renders no UI by itself. Compose <Calendar.Header />, <Calendar.View />,
 * etc. inside it. Anything else (custom buttons, sticky footers, dialogs)
 * can live next to the calendar parts and still call useCalendarStore /
 * useCalendarSelector.
 */
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import {
  CalendarConfigContext,
  CalendarStoreContext,
  type CalendarConfig,
} from '../context';
import { defaultLabels, defaultPrimitives, defaultTheme } from '../defaults';
import { CalendarStore } from '../store';
import type {
  CalendarLabels,
  CalendarMode,
  CalendarPrimitives,
  CalendarSystem,
  CalendarTheme,
  CalendarThemeOverride,
  DisabledDateInput,
  DisabledDateRangeInput,
  OnClear,
  OnConfirm,
  OnSystemChange,
} from '../types';

export interface CalendarRootProps {
  /**
   * One or more calendar systems. The first is used by default unless
   * `initialSystemId` is set. Pass `[gregorianSystem, hijriSystem]` to
   * enable a system switcher; pass a single system to lock it.
   */
  systems: CalendarSystem[];
  /** ID of the system to start on. Defaults to `systems[0].id`. */
  initialSystemId?: string;
  /** Selection mode. */
  mode?: CalendarMode;

  /** Initial selected date in single mode. Accepts Date / Moment / native value. */
  initialDate?: unknown;
  /** Initial start date in range mode. */
  initialStart?: unknown;
  /** Initial end date in range mode. */
  initialEnd?: unknown;

  /** Inclusive lower bound for selectable dates. */
  minDate?: unknown;
  /** Inclusive upper bound for selectable dates. */
  maxDate?: unknown;

  /** Individual disabled dates. */
  disabledDates?: readonly DisabledDateInput[];
  /** Inclusive disabled date ranges. */
  disabledRanges?: readonly DisabledDateRangeInput[];

  /** Allow selecting the same day for both range endpoints. */
  allowSameDay?: boolean;

  /** Override visual primitives — see CalendarPrimitives. */
  primitives?: Partial<CalendarPrimitives>;
  /** Override theme tokens — see CalendarTheme. */
  theme?: CalendarThemeOverride;
  /** Override user-facing strings — see CalendarLabels. */
  labels?: Partial<CalendarLabels>;

  /** Called when the user taps the confirm action. */
  onConfirm?: OnConfirm;
  /** Called when the user taps the clear action. */
  onClear?: OnClear;
  /** Called when the user switches calendar system. */
  onSystemChange?: OnSystemChange;
  /** Optional haptic hook fired on day taps. */
  onSelectHaptic?: () => void;

  /** Test-id prefix for all internal nodes. */
  testID?: string;

  children: ReactNode;
}

const mergePrimitives = (
  override: Partial<CalendarPrimitives> | undefined
): CalendarPrimitives => ({
  View: override?.View ?? defaultPrimitives.View,
  Text: override?.Text ?? defaultPrimitives.Text,
  Pressable: override?.Pressable ?? defaultPrimitives.Pressable,
  Icon: override?.Icon ?? defaultPrimitives.Icon,
});

const mergeTheme = (
  override: CalendarThemeOverride | undefined
): CalendarTheme => ({
  colors: { ...defaultTheme.colors, ...(override?.colors ?? {}) },
  spacing: { ...defaultTheme.spacing, ...(override?.spacing ?? {}) },
  fontSize: { ...defaultTheme.fontSize, ...(override?.fontSize ?? {}) },
  cellSize: override?.cellSize ?? defaultTheme.cellSize,
  borderRadius: override?.borderRadius ?? defaultTheme.borderRadius,
});

const mergeLabels = (
  override: Partial<CalendarLabels> | undefined
): CalendarLabels => ({ ...defaultLabels, ...(override ?? {}) });

export const Root: React.FC<CalendarRootProps> = ({
  systems,
  initialSystemId,
  mode = 'single',
  initialDate,
  initialStart,
  initialEnd,
  minDate,
  maxDate,
  disabledDates,
  disabledRanges,
  allowSameDay,
  primitives,
  theme,
  labels,
  onConfirm,
  onClear,
  onSystemChange,
  onSelectHaptic,
  testID,
  children,
}) => {
  // Store — created once, kept in a ref so identity is stable.
  const storeRef = useRef<CalendarStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new CalendarStore({
      systems,
      initialSystemId,
      mode,
      initialDate,
      initialStart,
      initialEnd,
      minDate,
      maxDate,
      disabledDates,
      disabledRanges,
      allowSameDay,
    });
  }
  const store = storeRef.current;

  // Sync props -> store. Bounds, mode, etc. update on prop change. Run
  // before paint so the first render reflects the latest props.
  useLayoutEffect(() => {
    store.syncProps({
      systems,
      mode,
      minDate,
      maxDate,
      disabledDates,
      disabledRanges,
      allowSameDay,
    });
    // Selection inputs are intentionally not synced — they're "initial".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, minDate, maxDate, disabledDates, disabledRanges, allowSameDay]);

  // If the systems prop array changes identity, swap the active system.
  useEffect(() => {
    const currentId = store.getSnapshot().system.id;
    const idx = systems.findIndex((s) => s.id === currentId);
    if (idx === -1) {
      // Active system removed — fall back to the first system if one exists.
      const next = systems[0];
      /* istanbul ignore else — `if (next)` guards against an empty systems[]
       * (CalendarStore would already have rejected at construction time). */
      if (next) store.replaceSystem(next, 0);
    } else if (systems[idx] !== store.getSnapshot().system) {
      // Same id but a fresh adapter instance — adopt it.
      const next = systems[idx];
      /* istanbul ignore else — `next` is guaranteed defined because `idx` was
       * just resolved by findIndex; the guard satisfies TS only. */
      if (next) store.replaceSystem(next, idx);
    }
  }, [systems, store]);

  // Config context — memoised so primitives/theme/labels overrides don't
  // create new context values per render.
  const config = useMemo<CalendarConfig>(
    () => ({
      primitives: mergePrimitives(primitives),
      theme: mergeTheme(theme),
      labels: mergeLabels(labels),
      systems,
      onConfirm,
      onClear,
      onSystemChange,
      onSelectHaptic,
      testID,
    }),
    [
      primitives,
      theme,
      labels,
      systems,
      onConfirm,
      onClear,
      onSystemChange,
      onSelectHaptic,
      testID,
    ]
  );

  return (
    <CalendarConfigContext.Provider value={config}>
      <CalendarStoreContext.Provider value={store}>
        {children}
      </CalendarStoreContext.Provider>
    </CalendarConfigContext.Provider>
  );
};

Root.displayName = 'Calendar.Root';
