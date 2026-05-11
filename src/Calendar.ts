/**
 * Namespaced compound API.
 *
 * The library is **headless** beyond two pieces:
 *
 *   - `<Calendar.Root>`    — the provider every other piece needs.
 *   - `<Calendar.DayGrid>` — the only stable rendered component, because
 *                            laying out and memoising a 6×7 grid of day
 *                            cells is the one thing that genuinely
 *                            benefits from a built-in implementation.
 *                            (Per-cell visuals are still overridable via
 *                            its `renderDay` prop and via the `Pressable`
 *                            / `Text` primitives on `<Calendar.Root>`.)
 *
 * Everything else — system switcher, prev/next buttons, month/year
 * header labels, month picker grid, year picker grid, confirm/clear
 * buttons — is exposed as a hook so the consumer brings their own UI
 * and wires it to the same store:
 *
 *   useCalendarActions       — confirm / clear / canConfirm
 *   useCalendarNavigation    — goPrev / goNext (view + RTL aware)
 *   useCalendarMonthLabel    — header "month" affordance
 *   useCalendarYearLabel     — header "year" affordance
 *   useCalendarSystemSwitcher— systems list + activeId + setter
 *   useCalendarMonthPicker   — 12-cell month chooser data + actions
 *   useCalendarYearPicker    — 12-cell year chooser data + actions
 *
 * Typical composition:
 *
 *   <Calendar.Root systems={[gregorianSystem]} mode="single">
 *     <MyHeader />        // built with useCalendarNavigation +
 *                         //            useCalendarMonthLabel +
 *                         //            useCalendarYearLabel
 *     <MyView />          // calls useCalendarSelector(s => s.view)
 *                         // and renders <Calendar.DayGrid /> /
 *                         //              <MyMonthPicker /> /
 *                         //              <MyYearPicker />
 *     <MyConfirmBar />    // useCalendarActions()
 *   </Calendar.Root>
 */
import { DayCell, DayGrid, SwipeableDayGrid } from './components/DayGrid';
import { Root } from './components/Root';

export const Calendar = {
  Root,
  DayGrid,
  DayCell,
  /**
   * Explicit swipeable variant — equivalent to `<Calendar.DayGrid swipeable />`
   * but self-documenting: the component name signals the virtualised-FlashList
   * strategy without a boolean flag on the static grid.
   *
   * Requires `@shopify/flash-list` to be installed.
   */
  SwipeableDayGrid,
} as const;

export type CalendarNamespace = typeof Calendar;
