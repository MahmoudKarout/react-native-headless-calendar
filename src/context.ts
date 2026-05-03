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
 *
 * The library is intentionally **headless** beyond `<Calendar.Root>` and
 * `<Calendar.DayGrid>`. Everything else — system switcher, prev/next
 * buttons, month/year header labels, month picker, year picker — is
 * exposed as a hook so the consumer can render their own UI on top of the
 * same store. See the `useCalendar*` hooks below.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { I18nManager } from 'react-native';

import type { CalendarStore, CalendarSnapshot } from './store';
import type {
  CalendarComponents,
  CalendarLabels,
  CalendarModifiers,
  CalendarSystem,
  CalendarTheme,
  OnConfirm,
  OnClear,
  OnSystemChange,
  Weekday,
} from './types';
import {
  COLS,
  ROWS,
  YEAR_PAGE_SIZE,
  buildMonthGrid,
  getYearPage,
  isoWeekNumber,
  rotateWeekdayLabels,
} from './utils/grid';

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
  theme: CalendarTheme;
  labels: CalendarLabels;
  systems: readonly CalendarSystem[];
  /**
   * Which weekday occupies the first column of the day grid.
   * 0 = Sunday (US default), 1 = Monday (most of Europe), 6 = Saturday
   * (common in MENA), etc. Defaults to `0`.
   */
  firstDayOfWeek: Weekday;
  /**
   * Render days from the previous / next month in the leading and
   * trailing rows of the grid. When `false`, the cells are kept as
   * invisible placeholders so the column layout is preserved.
   */
  showOutsideDays: boolean;
  /**
   * Always render 6 rows in the day grid. When `false`, trailing
   * all-outside rows are collapsed.
   */
  fixedWeeks: boolean;
  /** Named modifiers — see CalendarRootProps.modifiers. */
  modifiers?: CalendarModifiers;
  /**
   * Replaceable component slots. Each slot has a typed prop contract;
   * the built-in implementation is used for any slot left unset.
   */
  components?: CalendarComponents;
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

export const useCalendarTheme = (): CalendarTheme => useCalendarConfig().theme;

export const useCalendarLabels = (): CalendarLabels =>
  useCalendarConfig().labels;

/**
 * Active first-day-of-week from `<Calendar.Root firstDayOfWeek={...}>`.
 *
 * Defaults to Sunday (`0`) when the prop is omitted. Useful when building a
 * custom day grid alongside `useCalendarWeekdayLabels` so the columns match.
 */
export const useCalendarFirstDayOfWeek = (): Weekday =>
  useCalendarConfig().firstDayOfWeek;

/**
 * Weekday labels for the active calendar system, rotated so the column
 * order matches the grid's `firstDayOfWeek`.
 *
 *   const labels = useCalendarWeekdayLabels();
 *   // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']  when firstDayOfWeek=1
 *
 * The rotation is memoised on the underlying labels array + offset, so
 * consumers can use the result as a stable dependency.
 */
export function useCalendarWeekdayLabels(): readonly string[] {
  const baseLabels = useCalendarSelector((s) => s.system.weekdayLabels());
  const firstDayOfWeek = useCalendarFirstDayOfWeek();
  return useMemo(
    () => rotateWeekdayLabels(baseLabels, firstDayOfWeek),
    [baseLabels, firstDayOfWeek]
  );
}

/**
 * Component slots passed to `<Calendar.Root components={...}>`.
 *
 * Returns an empty object when no slots are configured. Use this hook
 * inside a custom day grid (or any consumer-built sub-component) when
 * you want to honour the same slot overrides the built-in
 * `<Calendar.DayGrid>` does.
 */
export function useCalendarComponents(): NonNullable<
  CalendarConfig['components']
> {
  return useCalendarConfig().components ?? {};
}

/**
 * Multiple-mode selection slice. Returns `selectedDates` from the store
 * directly — order matches tap order, identity changes only when the
 * underlying array changes (after a tap or `store.clear()`).
 *
 * In single / range mode this returns `[]`.
 */
export function useCalendarSelectedDates<T = unknown>(): readonly T[] {
  return useCalendarSelector((s) => s.selectedDates as readonly T[]);
}

/**
 * Per-row ISO 8601 week numbers for the displayed month, lined up with
 * the rows produced by `buildMonthGrid`.
 *
 * Implementation prefers the active system's own `weekNumber()` when
 * available (Gregorian implements it natively); otherwise falls back to
 * deriving an ISO week from `system.toNativeDate(d)` so the result still
 * works for Gregorian-aligned visual layouts.
 *
 *   const weekNumbers = useCalendarWeekNumbers();
 *   //  -> [18, 19, 20, 21, 22, 23] for May 2024
 *
 * Re-renders only when the displayed month or active system change.
 */
export function useCalendarWeekNumbers(): readonly number[] {
  const system = useCalendarSelector((s) => s.system);
  const displayed = useCalendarSelector((s) => s.displayed);
  const firstDayOfWeek = useCalendarFirstDayOfWeek();
  return useMemo(() => {
    const cells = buildMonthGrid(system, displayed, firstDayOfWeek);
    const out = new Array<number>(ROWS);
    const compute = (d: unknown): number =>
      system.weekNumber
        ? system.weekNumber(d as never)
        : isoWeekNumber(system.toNativeDate(d as never));
    // ISO weeks are Mon-based with Thursday as the canonical day-in-the-week.
    // Picking the Thursday cell of each row gives the correct ISO week
    // regardless of the column the row starts on (Sun / Mon / Sat / …).
    const thursdayCol = (4 - firstDayOfWeek + 7) % 7;
    for (let r = 0; r < ROWS; r += 1) {
      const idx = r * COLS + thursdayCol;
      const cell = cells[idx];
      /* istanbul ignore next — buildMonthGrid always returns ROWS*COLS
       * cells, so `cell` is defined for every row. */
      out[r] = cell ? compute(cell.date) : 0;
    }
    return out;
  }, [system, displayed, firstDayOfWeek]);
}

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
    if (s.mode === 'multiple') return s.selectedDates.length > 0;
    return !!(s.rangeStart && s.rangeEnd);
  });

  const confirm = useCallback(() => {
    if (!onConfirm) return;
    const s = store.getSnapshot();
    onConfirm({
      date: s.selectedDate ? s.system.toNativeDate(s.selectedDate) : undefined,
      startDate: s.rangeStart ? s.system.toNativeDate(s.rangeStart) : undefined,
      endDate: s.rangeEnd ? s.system.toNativeDate(s.rangeEnd) : undefined,
      dates: s.selectedDates.length
        ? s.selectedDates.map((d) => s.system.toNativeDate(d))
        : undefined,
      systemId: s.system.id,
    });
  }, [onConfirm, store]);

  const clear = useCallback(() => {
    store.clear();
    onClear?.();
  }, [store, onClear]);

  return { confirm, clear, canConfirm };
}

// ---------------------------------------------------------------------------
// useCalendarNavigation — view-aware, RTL-aware "go previous / go next"
// shortcuts for whatever pair of buttons the consumer renders.
//
//   const { goPrev, goNext } = useCalendarNavigation();
//
//   <MyChevronLeft  onPress={goPrev} />
//   <MyChevronRight onPress={goNext} />
//
// Stepping rules (match the original built-in header):
//   - day view   → step 1 month
//   - month view → step 1 year
//   - year view  → step 1 page (YEAR_PAGE_SIZE years)
// In RTL, prev/next are swapped so the visual chevrons match reading order.
// ---------------------------------------------------------------------------

export interface CalendarNavigation {
  /** Step backward one month / year / year-page depending on the active view. */
  goPrev: () => void;
  /** Step forward one month / year / year-page depending on the active view. */
  goNext: () => void;
}

const stepForView = (
  store: CalendarStore,
  direction: 1 | -1,
  rtl: boolean
): void => {
  const visualStep = rtl ? -direction : direction;
  const s = store.getSnapshot();
  if (s.view === 'day') store.changeMonth(visualStep);
  else if (s.view === 'month') store.changeYear(visualStep);
  else store.changeYear(visualStep * YEAR_PAGE_SIZE);
};

export function useCalendarNavigation(): CalendarNavigation {
  const store = useCalendarStore();
  const goPrev = useCallback(
    () => stepForView(store, -1, I18nManager.isRTL),
    [store]
  );
  const goNext = useCallback(
    () => stepForView(store, 1, I18nManager.isRTL),
    [store]
  );
  return { goPrev, goNext };
}

// ---------------------------------------------------------------------------
// useCalendarMonthLabel — header "month name" affordance.
//
//   const { label, isVisible, toggle } = useCalendarMonthLabel();
//
//   {isVisible && (
//     <MyButton onPress={toggle}>
//       <MyText>{label}</MyText>
//     </MyButton>
//   )}
//
// `toggle` swaps between the day grid and the month picker. The label is
// hidden when the year picker is open (matching the original header) so
// the consumer doesn't have to special-case it.
// ---------------------------------------------------------------------------

export interface CalendarMonthLabel {
  /** Localised month name for the displayed month, in the active system. */
  label: string;
  /**
   * `false` while the year picker is open — the original header hid the
   * month label there because it would jump confusingly per page.
   */
  isVisible: boolean;
  /** Switch the active view between `'day'` and `'month'`. */
  toggle: () => void;
}

export function useCalendarMonthLabel(): CalendarMonthLabel {
  const store = useCalendarStore();
  // Two granular slices — both return primitives so consumers don't
  // re-render on unrelated state changes (date taps in single mode, etc).
  const label = useCalendarSelector(
    (s) => s.system.monthLabels()[s.system.month(s.displayed)] ?? ''
  );
  const isVisible = useCalendarSelector((s) => s.view !== 'year');
  const toggle = useCallback(() => {
    const s = store.getSnapshot();
    store.setView(s.view === 'month' ? 'day' : 'month');
  }, [store]);
  return { label, isVisible, toggle };
}

// ---------------------------------------------------------------------------
// useCalendarYearLabel — header "year (or year range)" affordance.
//
//   const { label, toggle } = useCalendarYearLabel();
//
//   <MyButton onPress={toggle}>
//     <MyText>{label}</MyText>
//   </MyButton>
//
// In year-picker mode, `label` reads as the inclusive page span
// (e.g. "2016 - 2027"). Otherwise it's the displayed year as a string.
// ---------------------------------------------------------------------------

export interface CalendarYearLabel {
  /** Single year string in day/month view, "YYYY - YYYY" in year view. */
  label: string;
  /** Switch the active view between `'day'` and `'year'`. */
  toggle: () => void;
}

export function useCalendarYearLabel(): CalendarYearLabel {
  const store = useCalendarStore();
  // Compute the label fully inside the selector so it returns a stable
  // primitive — prevents re-renders on date taps that don't move the year.
  const label = useCalendarSelector((s) => {
    const year = s.system.year(s.displayed);
    if (s.view !== 'year') return String(year);
    const page = getYearPage(year);
    return `${page[0]} - ${page[page.length - 1]}`;
  });
  const toggle = useCallback(() => {
    const s = store.getSnapshot();
    store.setView(s.view === 'year' ? 'day' : 'year');
  }, [store]);
  return { label, toggle };
}

// ---------------------------------------------------------------------------
// useCalendarSystemSwitcher — list of configured systems + active id +
// setter. Render whatever segmented control / dropdown / radio group fits
// your design.
//
//   const { systems, activeId, setActive } = useCalendarSystemSwitcher();
//
//   if (systems.length < 2) return null;
//   return systems.map((s) => (
//     <MyPill
//       key={s.id}
//       active={s.id === activeId}
//       onPress={() => setActive(s.id)}
//     >
//       {s.label}
//     </MyPill>
//   ));
// ---------------------------------------------------------------------------

export interface CalendarSystemSwitcher {
  /** All systems configured on `<Calendar.Root systems={...}>`. */
  systems: readonly CalendarSystem[];
  /** `id` of the currently active system. */
  activeId: string;
  /**
   * Activate a different system. Silently ignored when `systemId` is not
   * one of the configured ids. Fires the `onSystemChange` callback if one
   * was provided to `<Calendar.Root>`.
   */
  setActive: (systemId: string) => void;
}

export function useCalendarSystemSwitcher(): CalendarSystemSwitcher {
  const store = useCalendarStore();
  const { systems, onSystemChange } = useCalendarConfig();
  const activeId = useCalendarSelector((s) => s.system.id);

  const setActive = useCallback(
    (systemId: string) => {
      const idx = systems.findIndex((s) => s.id === systemId);
      const next = idx >= 0 ? systems[idx] : undefined;
      if (!next || idx < 0) return;
      store.replaceSystem(next, idx);
      onSystemChange?.(systemId);
    },
    [store, systems, onSystemChange]
  );

  return { systems, activeId, setActive };
}

// ---------------------------------------------------------------------------
// useCalendarMonthPicker — data + actions for a 12-cell month chooser.
//
//   const { months, activeMonth, selectMonth } = useCalendarMonthPicker();
//
//   return (
//     <MyGrid>
//       {months.map((m) => (
//         <MyCell
//           key={m.index}
//           active={m.index === activeMonth}
//           onPress={() => selectMonth(m.index)}
//         >
//           {m.label}
//         </MyCell>
//       ))}
//     </MyGrid>
//   );
//
// `months` is identity-stable while the active system doesn't change.
// Selecting a month jumps the displayed date and switches back to day view.
// ---------------------------------------------------------------------------

export interface CalendarMonthPickerEntry {
  /** 0-based month index expected by `selectMonth`. */
  index: number;
  /** Localised name for that month, in the active system. */
  label: string;
}

export interface CalendarMonthPicker {
  months: readonly CalendarMonthPickerEntry[];
  /** 0-based index of the currently displayed month. */
  activeMonth: number;
  /** Jump to the given month and switch back to the day view. */
  selectMonth: (index: number) => void;
}

export function useCalendarMonthPicker(): CalendarMonthPicker {
  const store = useCalendarStore();
  const monthLabels = useCalendarSelector((s) => s.system.monthLabels());
  const activeMonth = useCalendarSelector((s) => s.system.month(s.displayed));
  const months = useMemo<readonly CalendarMonthPickerEntry[]>(
    () => monthLabels.map((label, index) => ({ index, label })),
    [monthLabels]
  );
  const selectMonth = useCallback(
    (index: number) => store.goToMonth(index),
    [store]
  );
  return { months, activeMonth, selectMonth };
}

// ---------------------------------------------------------------------------
// useCalendarYearPicker — data + actions for a 12-cell paginated year grid.
//
//   const { years, activeYear, selectYear } = useCalendarYearPicker();
//
//   return (
//     <MyGrid>
//       {years.map((y) => (
//         <MyCell
//           key={y}
//           active={y === activeYear}
//           onPress={() => selectYear(y)}
//         >
//           {y}
//         </MyCell>
//       ))}
//     </MyGrid>
//   );
//
// Pagination (forward / backward across pages) is driven by
// `useCalendarNavigation()` which is automatically year-page aware when
// the active view is `'year'`.
// ---------------------------------------------------------------------------

export interface CalendarYearPicker {
  /** 12 years aligned to the YEAR_PAGE_SIZE window containing `activeYear`. */
  years: readonly number[];
  /** Year currently displayed (and centred-ish in `years`). */
  activeYear: number;
  /** Jump to the given year and switch back to the day view. */
  selectYear: (year: number) => void;
}

export function useCalendarYearPicker(): CalendarYearPicker {
  const store = useCalendarStore();
  const activeYear = useCalendarSelector((s) => s.system.year(s.displayed));
  const years = useMemo<readonly number[]>(
    () => getYearPage(activeYear),
    [activeYear]
  );
  const selectYear = useCallback(
    (year: number) => store.goToYear(year),
    [store]
  );
  return { years, activeYear, selectYear };
}
