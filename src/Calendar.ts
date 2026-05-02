/**
 * Namespaced compound API.
 *
 *   <Calendar.Root systems={[gregorianSystem]} mode="single">
 *     <Calendar.SystemSwitcher />
 *     <Calendar.Header />
 *     <Calendar.View />
 *   </Calendar.Root>
 *
 * Or fully composed:
 *
 *   <Calendar.Root ...>
 *     <Calendar.SystemSwitcher>
 *       {({ systems, activeId, setActive }) => <MyTabs ... />}
 *     </Calendar.SystemSwitcher>
 *     <Calendar.Header.Root>
 *       <Calendar.Header.PrevButton><MyChevron dir="left" /></Calendar.Header.PrevButton>
 *       <Calendar.Header.MonthLabel />
 *       <Calendar.Header.YearLabel />
 *       <Calendar.Header.NextButton><MyChevron dir="right" /></Calendar.Header.NextButton>
 *     </Calendar.Header.Root>
 *     <Calendar.View renderDay={(info) => <MyCustomCell info={info} />} />
 *   </Calendar.Root>
 *
 * Confirm / clear are intentionally NOT shipped as components — bring your
 * own buttons and wire them via `useCalendarActions()`:
 *
 *   const { confirm, clear, canConfirm } = useCalendarActions();
 *
 *   <MyButton disabled={!canConfirm} onPress={confirm}>Done</MyButton>
 *   <MyButton onPress={clear}>Reset</MyButton>
 */
import { DayCell, DayGrid } from './components/DayGrid';
import { Header } from './components/Header';
import { MonthGrid } from './components/MonthGrid';
import { Root } from './components/Root';
import { SystemSwitcher } from './components/SystemSwitcher';
import { View } from './components/View';
import { YearGrid } from './components/YearGrid';

export const Calendar = {
  Root,
  Header,
  View,
  DayGrid,
  DayCell,
  MonthGrid,
  YearGrid,
  SystemSwitcher,
} as const;

export type CalendarNamespace = typeof Calendar;
