/**
 * <Calendar.Root> — the only required parent.
 *
 * Sole responsibilities:
 *   1. Construct the CalendarStore once (kept in a ref so it survives renders).
 *   2. Inject theme / labels / systems via CalendarConfigContext.
 *   3. Sync prop changes into the store via a single useLayoutEffect.
 *
 * Renders no UI by itself. The library is **headless** beyond
 * `<Calendar.DayGrid>`: every other piece of UI is exposed as a hook
 * (`useCalendarNavigation`, `useCalendarMonthLabel`, `useCalendarYearLabel`,
 * `useCalendarSystemSwitcher`, `useCalendarMonthPicker`,
 * `useCalendarYearPicker`, `useCalendarActions`, …) so the consumer
 * brings their own buttons, layouts, and icons. Anything that calls one
 * of those hooks must be a descendant of `<Calendar.Root>`.
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
import { defaultLabels, defaultTheme } from '../defaults';
import { CalendarStore } from '../store';
import type {
  CalendarComponents,
  CalendarLabels,
  CalendarMode,
  CalendarModifiers,
  CalendarSelectionPayload,
  CalendarSystem,
  CalendarTheme,
  CalendarThemeOverride,
  DisabledDateInput,
  DisabledDateRangeInput,
  OnClear,
  OnConfirm,
  OnSystemChange,
  Weekday,
} from '../types';
import { DEFAULT_FIRST_DAY_OF_WEEK } from '../utils/grid';
import {
  useStableArray,
  useStableCallback,
  useStablePredicate,
  useStableRecord,
} from '../utils/stableProps';

export interface CalendarRootProps {
  /**
   * One or more calendar systems. The first is used by default unless
   * `initialSystemId` is set. Pass `[gregorianSystem, hijriSystem]` to
   * enable a system switcher; pass a single system to lock it.
   */
  systems: readonly CalendarSystem[];
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
  /**
   * Initial selection in `'multiple'` mode. Order is preserved; later
   * `selectedDates.length > 0`.
   */
  initialDates?: readonly unknown[];

  /** Inclusive lower bound for selectable dates. */
  minDate?: unknown;
  /** Inclusive upper bound for selectable dates. */
  maxDate?: unknown;

  /** Individual disabled dates. */
  disabledDates?: readonly DisabledDateInput[];
  /** Inclusive disabled date ranges. */
  disabledRanges?: readonly DisabledDateRangeInput[];
  /**
   * Optional dynamic-disabled predicate. Receives the native JS Date for
   * each candidate cell — return `true` to mark it as disabled. Composes
   * (OR) with `disabledDates`, `disabledRanges`, and `min/max` bounds.
   *
   * Example:
   *
   *   disabled={(d) => d.getDay() === 0 || d.getDay() === 6}
   */
  disabled?: (nativeDate: Date) => boolean;

  /** Allow selecting the same day for both range endpoints. */
  allowSameDay?: boolean;
  /**
   * Inclusive minimum length, in days, of a confirmable range selection.
   * Picks that would produce a shorter range are silently ignored.
   * Range mode only.
   */
  minRangeDays?: number;
  /**
   * Inclusive maximum length, in days, of a confirmable range selection.
   * Picks that would produce a longer range are silently ignored.
   * Range mode only.
   */
  maxRangeDays?: number;
  /**
   * Inclusive cap on the number of dates that can be selected in
   * `'multiple'` mode. Picks beyond the cap are silently ignored —
   * consumers wanting LRU eviction should clear-then-select.
   */
  maxSelected?: number;

  /**
   * Named modifiers — each value is a list of dates / inclusive date
   * ranges, or a `(nativeDate) => boolean` predicate. The DayGrid
   * evaluates them per cell and exposes the boolean flags via
   * `DayCellInfo.modifiers` so consumers can style them however they
   * like (booked / holiday / available / …).
   */
  modifiers?: CalendarModifiers;

  /**
   * Show days from the previous / next month in the grid's leading and
   * trailing rows. When `false`, those slots render an invisible
   * placeholder so the grid stays a 7-column matrix. Defaults to `true`.
   */
  showOutsideDays?: boolean;
  /**
   * Always render 6 rows in the grid, even when the displayed month fits
   * in 4 or 5 weeks. When `false`, trailing all-outside rows are
   * collapsed so the calendar is shorter on those months. Defaults to
   * `true` for layout-stable parents.
   */
  fixedWeeks?: boolean;

  /**
   * Replaceable component slots — pass any subset to override the
   * built-in atoms. The render-prop on `<Calendar.DayGrid renderDay>`
   * still wins per call; otherwise this slot is used for every cell.
   */
  components?: CalendarComponents;

  /** Override theme tokens — see CalendarTheme. */
  theme?: CalendarThemeOverride;
  /** Override user-facing strings — see CalendarLabels. */
  labels?: Partial<CalendarLabels>;

  /**
   * Which weekday occupies the first column of the day grid (and the
   * weekday header). Defaults to `0` (Sunday). Common values:
   *   - `0` Sunday   — US, Canada, Japan, …
   *   - `1` Monday   — most of Europe, UK, ISO 8601
   *   - `6` Saturday — many MENA locales
   */
  firstDayOfWeek?: Weekday;

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
  initialDates,
  minDate,
  maxDate,
  disabledDates,
  disabledRanges,
  disabled,
  allowSameDay,
  minRangeDays,
  maxRangeDays,
  maxSelected,
  modifiers,
  showOutsideDays = true,
  fixedWeeks = true,
  components,
  theme,
  labels,
  firstDayOfWeek = DEFAULT_FIRST_DAY_OF_WEEK,
  onConfirm,
  onClear,
  onSystemChange,
  onSelectHaptic,
  testID,
  children,
}) => {
  // Stabilise inputs that consumers commonly write inline. Without this,
  // every parent re-render (e.g. after a `setState` triggered by the
  // user's own `onConfirm`) would create new identities for these props,
  // rebuild `config` below, and force every CalendarConfigContext consumer
  // to re-render. See ../utils/stableProps for the rationale.
  const stableSystems = useStableArray(systems);
  const stableOnConfirm: OnConfirm | undefined =
    useStableCallback<[CalendarSelectionPayload]>(onConfirm);
  const stableOnClear: OnClear | undefined = useStableCallback<[]>(onClear);
  const stableOnSystemChange: OnSystemChange | undefined =
    useStableCallback<[string]>(onSystemChange);
  const stableOnSelectHaptic = useStableCallback<[]>(onSelectHaptic);
  const stableDisabled = useStablePredicate<[Date], boolean>(disabled);
  const stableModifiers = useStableRecord(modifiers);
  const stableComponents = useStableRecord(components);

  // Store — created once, kept in a ref so identity is stable.
  const storeRef = useRef<CalendarStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new CalendarStore({
      systems: stableSystems,
      initialSystemId,
      mode,
      initialDate,
      initialStart,
      initialEnd,
      initialDates,
      minDate,
      maxDate,
      disabledDates,
      disabledRanges,
      disabled: stableDisabled,
      allowSameDay,
      minRangeDays,
      maxRangeDays,
      maxSelected,
    });
  }
  const store = storeRef.current;

  // Sync props -> store. Bounds, mode, etc. update on prop change. Run
  // before paint so the first render reflects the latest props.
  useLayoutEffect(() => {
    store.syncProps({
      systems: stableSystems,
      mode,
      minDate,
      maxDate,
      disabledDates,
      disabledRanges,
      disabled: stableDisabled,
      allowSameDay,
      minRangeDays,
      maxRangeDays,
      maxSelected,
    });
    // Selection inputs are intentionally not synced — they're "initial".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    minDate,
    maxDate,
    disabledDates,
    disabledRanges,
    stableDisabled,
    allowSameDay,
    minRangeDays,
    maxRangeDays,
    maxSelected,
  ]);

  // If the systems prop array changes identity (and therefore content),
  // swap the active system. `stableSystems` only changes when an element
  // identity actually changed, so inline `[gregorianSystem]` literals
  // don't fire this effect.
  useEffect(() => {
    const currentId = store.getSnapshot().system.id;
    const idx = stableSystems.findIndex((s) => s.id === currentId);
    if (idx === -1) {
      // Active system removed — fall back to the first system if one exists.
      const next = stableSystems[0];
      /* istanbul ignore else — `if (next)` guards against an empty systems[]
       * (CalendarStore would already have rejected at construction time). */
      if (next) store.replaceSystem(next, 0);
    } else if (stableSystems[idx] !== store.getSnapshot().system) {
      // Same id but a fresh adapter instance — adopt it.
      const next = stableSystems[idx];
      /* istanbul ignore else — `next` is guaranteed defined because `idx` was
       * just resolved by findIndex; the guard satisfies TS only. */
      if (next) store.replaceSystem(next, idx);
    }
  }, [stableSystems, store]);

  // create new context values per render. All callback / array inputs
  // were stabilised above, so inline-prop usage at the call site does not
  // churn this value.
  const config = useMemo<CalendarConfig>(
    () => ({
      theme: mergeTheme(theme),
      labels: mergeLabels(labels),
      systems: stableSystems,
      firstDayOfWeek,
      showOutsideDays,
      fixedWeeks,
      modifiers: stableModifiers,
      components: stableComponents,
      onConfirm: stableOnConfirm,
      onClear: stableOnClear,
      onSystemChange: stableOnSystemChange,
      onSelectHaptic: stableOnSelectHaptic,
      testID,
    }),
    [
      theme,
      labels,
      stableSystems,
      firstDayOfWeek,
      showOutsideDays,
      fixedWeeks,
      stableModifiers,
      stableComponents,
      stableOnConfirm,
      stableOnClear,
      stableOnSystemChange,
      stableOnSelectHaptic,
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
