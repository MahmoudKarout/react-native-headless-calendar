/**
 * ComposableCalendar — a fully composable calendar built on the
 * react-native-fast-calendar hooks API, following the Vercel composition
 * patterns:
 *
 *   1. Compound components (Calendar.Root, Calendar.Header, …) share
 *      state through a context interface — no prop drilling.
 *   2. Boolean prop proliferation is avoided. Each variant
 *      (DayPicker, MonthYearPicker, RangePicker, MultiSystemPicker)
 *      explicitly composes the pieces it needs.
 *   3. State is decoupled from UI: `Calendar.Root` is the only place
 *      that knows how the calendar's state is wired (it owns the active
 *      calendar system locally and re-mounts the underlying
 *      `CalendarProvider` on system swap). UI subcomponents only consume
 *      the published context interface.
 *   4. Children-over-render-props throughout. No `renderHeader`,
 *      `renderFooter`, etc.
 *   5. React 19 APIs only — `use()` instead of `useContext()`, no
 *      `forwardRef`.
 *
 * Each subcomponent is usable independently, as long as it lives inside
 * a `Calendar.Root`. A consumer can render only `Calendar.DayGrid` for
 * an inline picker, or compose the full
 * `Header → SystemSwitcher → MonthGrid → YearGrid → DayGrid → Footer`
 * stack for a full-blown date picker.
 *
 * Styling: all visuals are driven by Uniwind class names against the
 * design tokens defined in `example/global.css`.
 */
import {
  createContext,
  memo,
  use,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  CalendarProvider,
  gregorianSystem,
  selectCanConfirm,
  selectDays,
  selectMonths,
  selectYears,
  useCalendarActions,
  useCalendarSelector,
  type CalendarActions,
  type CalendarMode,
  type CalendarSystem,
  type DayCellInfo,
  type OnChange,
  type OnConfirm,
} from 'react-native-fast-calendar';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';

// ─── Shell context interface ────────────────────────────────────────────────

interface CalendarShellState {
  systems: readonly CalendarSystem[];
  activeSystemId: string;
}

interface CalendarShellActions {
  setActiveSystem: (id: string) => void;
}

interface CalendarShellMeta {
  mode: CalendarMode;
}

interface CalendarShellContextValue {
  state: CalendarShellState;
  actions: CalendarShellActions;
  meta: CalendarShellMeta;
}

const CalendarShellContext = createContext<CalendarShellContextValue | null>(
  null
);

function useCalendarShell(): CalendarShellContextValue {
  const ctx = use(CalendarShellContext);
  if (!ctx) {
    throw new Error(
      '[ComposableCalendar] subcomponents must be used inside <Calendar.Root>'
    );
  }
  return ctx;
}

// ─── View context ───────────────────────────────────────────────────────────

type CalendarView = 'day' | 'month' | 'year';

interface CalendarViewContextValue {
  view: CalendarView;
  setView: (next: CalendarView) => void;
}

const CalendarViewContext = createContext<CalendarViewContextValue | null>(
  null
);

function useCalendarView(): CalendarViewContextValue {
  const ctx = use(CalendarViewContext);
  if (!ctx) {
    throw new Error(
      '[ComposableCalendar] view-aware subcomponents must be used inside <Calendar.Root>'
    );
  }
  return ctx;
}

// ─── Calendar.Root — shell provider ─────────────────────────────────────────

interface CalendarRootProps {
  children: ReactNode;
  mode?: CalendarMode;
  systems?: readonly CalendarSystem[];
  defaultSystemId?: string;
  onConfirm?: OnConfirm;
  onChange?: OnChange;
}

function CalendarRoot({
  children,
  mode = 'single',
  systems = [gregorianSystem, hijriSystem],
  defaultSystemId,
  onConfirm,
  onChange,
}: CalendarRootProps) {
  const [activeSystemId, setActiveSystemId] = useState<string>(
    defaultSystemId ?? systems[0]!.id
  );
  const [view, setView] = useState<CalendarView>('day');

  const shellValue = useMemo<CalendarShellContextValue>(
    () => ({
      state: { systems, activeSystemId },
      actions: { setActiveSystem: setActiveSystemId },
      meta: { mode },
    }),
    [systems, activeSystemId, mode]
  );

  const viewValue = useMemo<CalendarViewContextValue>(
    () => ({ view, setView }),
    [view]
  );

  return (
    <CalendarShellContext value={shellValue}>
      <CalendarViewContext value={viewValue}>
        <CalendarProvider
          key={activeSystemId}
          mode={mode}
          systems={systems}
          initialSystemId={activeSystemId}
          onConfirm={onConfirm}
          onChange={onChange}
        >
          {children}
        </CalendarProvider>
      </CalendarViewContext>
    </CalendarShellContext>
  );
}

// ─── Frame ──────────────────────────────────────────────────────────────────

function CalendarFrame({ children }: { children: ReactNode }) {
  return (
    <View className="bg-card border-hairline border-border rounded-xl gap-3 p-4">
      {children}
    </View>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────

function CalendarHeader({ children }: { children?: ReactNode }) {
  const monthLabel = useCalendarSelector(
    (s) => s.system.monthLabels()[s.system.month(s.displayed)]
  );
  const yearLabel = useCalendarSelector((s) =>
    String(s.system.year(s.displayed))
  );
  const { goPrevMonth, goNextMonth } = useCalendarActions();
  const { view, setView } = useCalendarView();

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <IconButton onPress={goPrevMonth} label="‹" />
        <Pressable
          onPress={() => setView(view === 'day' ? 'month' : 'day')}
          className="flex-1 items-center"
        >
          <Text className="text-foreground text-sm font-semibold">
            {monthLabel} {yearLabel}
          </Text>
        </Pressable>
        <IconButton onPress={goNextMonth} label="›" />
      </View>
      {children}
    </View>
  );
}

// ─── ViewSwitcher ───────────────────────────────────────────────────────────

function CalendarViewSwitcher() {
  const { view, setView } = useCalendarView();
  return (
    <View className="bg-surface-muted rounded-md flex-row p-0.5">
      {(['day', 'month', 'year'] as const).map((tab) => {
        const active = tab === view;
        return (
          <Pressable
            key={tab}
            onPress={() => setView(tab)}
            className={`flex-1 rounded py-1.5 ${active ? 'bg-card' : ''}`}
          >
            <Text
              className={`text-[11px] font-semibold tracking-wider text-center uppercase ${
                active ? 'text-foreground' : 'text-muted'
              }`}
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── SystemSwitcher ─────────────────────────────────────────────────────────

function CalendarSystemSwitcher() {
  const {
    state: { systems, activeSystemId },
    actions: { setActiveSystem },
  } = useCalendarShell();

  if (systems.length < 2) return null;

  return (
    <View className="bg-surface-muted rounded-md flex-row p-0.5">
      {systems.map((sys) => {
        const isActive = sys.id === activeSystemId;
        return (
          <Pressable
            key={sys.id}
            onPress={() => setActiveSystem(sys.id)}
            className={`flex-1 items-center py-1.5 rounded ${isActive ? 'bg-card' : ''}`}
          >
            <Text
              className={`text-[11px] font-semibold tracking-wider uppercase ${
                isActive ? 'text-foreground' : 'text-muted'
              }`}
            >
              {sys.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── DayGrid ────────────────────────────────────────────────────────────────

const CELL_SIZE = 40;

function CalendarDayGrid() {
  const days = useCalendarSelector(selectDays);
  const { selectDate } = useCalendarActions();
  const { view } = useCalendarView();

  if (view !== 'day') return null;

  const rowWidth = CELL_SIZE * 7;

  return (
    <View className="items-center">
      <View className="flex-row mb-1" style={{ width: rowWidth }}>
        {days.weekdayLabels.map((label) => (
          <Text
            key={label}
            className="text-muted text-[11px] font-medium tracking-widest text-center uppercase"
            style={{ width: CELL_SIZE }}
          >
            {label.slice(0, 2)}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap" style={{ width: rowWidth }}>
        {days.cells.map((cell) => (
          <DayCell
            key={cell.nativeDate.toISOString()}
            cell={cell}
            selectDate={selectDate}
          />
        ))}
      </View>
    </View>
  );
}

interface DayCellProps {
  cell: DayCellInfo;
  selectDate: CalendarActions['selectDate'];
}

const DayCell = memo(function DayCell({ cell, selectDate }: DayCellProps) {
  const stateClass = [
    'items-center justify-center',
    !cell.isCurrentMonth && 'opacity-40',
    cell.inRange ? 'bg-surface-muted rounded-none' : 'rounded-md',
    cell.isSelected && 'bg-primary',
    cell.isToday && !cell.isSelected && 'bg-surface-muted',
    cell.isDisabled && 'opacity-35',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={() => selectDate(cell.date)}
      className={stateClass}
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
    >
      <Text
        className={`text-[13px] ${
          cell.isSelected
            ? 'text-on-primary font-semibold'
            : 'text-foreground font-medium'
        }`}
      >
        {cell.label}
      </Text>
    </Pressable>
  );
});

// ─── MonthGrid ──────────────────────────────────────────────────────────────

function CalendarMonthGrid() {
  const { months, activeMonth } = useCalendarSelector(selectMonths);
  const { selectMonth } = useCalendarActions();
  const { view, setView } = useCalendarView();

  if (view !== 'month') return null;

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {months.map((m) => {
        const active = m.index === activeMonth;
        return (
          <Pressable
            key={m.index}
            onPress={() => {
              selectMonth(m.index);
              setView('day');
            }}
            className={`items-center py-3 rounded-md grow basis-[30%] border-hairline ${
              active ? 'bg-primary border-primary' : 'border-border'
            }`}
          >
            <Text
              className={`text-[13px] ${active ? 'text-on-primary font-semibold' : 'text-foreground font-medium'}`}
            >
              {m.label.slice(0, 3)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── YearGrid ───────────────────────────────────────────────────────────────

function CalendarYearGrid() {
  const { years, activeYear } = useCalendarSelector(selectYears);
  const { selectYear, prevYearPage, nextYearPage } = useCalendarActions();
  const { view, setView } = useCalendarView();

  if (view !== 'year') return null;

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <IconButton onPress={prevYearPage} label="‹" />
        <Text className="text-foreground text-sm font-semibold">
          {years[0]} – {years[years.length - 1]}
        </Text>
        <IconButton onPress={nextYearPage} label="›" />
      </View>
      <View className="flex-row flex-wrap gap-1.5">
        {years.map((y) => {
          const active = y === activeYear;
          return (
            <Pressable
              key={y}
              onPress={() => {
                selectYear(y);
                setView('day');
              }}
              className={`items-center py-3 rounded-md grow basis-[30%] border-hairline ${
                active ? 'bg-primary border-primary' : 'border-border'
              }`}
            >
              <Text
                className={`text-[13px] ${active ? 'text-on-primary font-semibold' : 'text-foreground font-medium'}`}
              >
                {y}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Footer + atoms ─────────────────────────────────────────────────────────

function CalendarFooter({ children }: { children: ReactNode }) {
  return <View className="flex-row gap-2">{children}</View>;
}

function CalendarClearButton({ label = 'Clear' }: { label?: string }) {
  const { clear } = useCalendarActions();
  return (
    <Pressable
      onPress={clear}
      className="flex-1 items-center py-2.5 rounded-md border-hairline border-border active:bg-surface-muted"
    >
      <Text className="text-foreground text-[13px] font-medium">{label}</Text>
    </Pressable>
  );
}

function CalendarConfirmButton({ label = 'Confirm' }: { label?: string }) {
  const { confirm } = useCalendarActions();
  const canConfirm = useCalendarSelector(selectCanConfirm);
  return (
    <Pressable
      onPress={confirm}
      disabled={!canConfirm}
      className="flex-1 items-center py-2.5 rounded-md bg-primary disabled:opacity-40 active:bg-primary-strong"
    >
      <Text className="text-on-primary text-[13px] font-semibold">{label}</Text>
    </Pressable>
  );
}

// ─── Shared atom ────────────────────────────────────────────────────────────

function IconButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center w-7 h-7 rounded-md border-hairline border-border active:bg-surface-muted"
    >
      <Text className="text-foreground text-base font-medium leading-4">
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Compound export ────────────────────────────────────────────────────────

export const Calendar = {
  Root: CalendarRoot,
  Frame: CalendarFrame,
  Header: CalendarHeader,
  ViewSwitcher: CalendarViewSwitcher,
  SystemSwitcher: CalendarSystemSwitcher,
  DayGrid: CalendarDayGrid,
  MonthGrid: CalendarMonthGrid,
  YearGrid: CalendarYearGrid,
  Footer: CalendarFooter,
  ClearButton: CalendarClearButton,
  ConfirmButton: CalendarConfirmButton,
};

// ─── Explicit variant components ────────────────────────────────────────────

export function DayPicker() {
  return (
    <Calendar.Root mode="single">
      <Calendar.Frame>
        <Calendar.Header />
        <Calendar.DayGrid />
      </Calendar.Frame>
    </Calendar.Root>
  );
}

export function FullPicker() {
  return (
    <Calendar.Root mode="single">
      <Calendar.Frame>
        <Calendar.Header>
          <Calendar.SystemSwitcher />
        </Calendar.Header>
        <Calendar.ViewSwitcher />
        <Calendar.DayGrid />
        <Calendar.MonthGrid />
        <Calendar.YearGrid />
        <Calendar.Footer>
          <Calendar.ClearButton />
          <Calendar.ConfirmButton />
        </Calendar.Footer>
      </Calendar.Frame>
    </Calendar.Root>
  );
}

export function RangePicker() {
  return (
    <Calendar.Root mode="range">
      <Calendar.Frame>
        <Calendar.Header />
        <Calendar.DayGrid />
        <Calendar.Footer>
          <Calendar.ClearButton label="Reset" />
          <Calendar.ConfirmButton label="Book" />
        </Calendar.Footer>
      </Calendar.Frame>
    </Calendar.Root>
  );
}

export function MultiSystemPicker() {
  return (
    <Calendar.Root mode="single" defaultSystemId="hijri">
      <Calendar.Frame>
        <Calendar.SystemSwitcher />
        <Calendar.Header />
        <Calendar.DayGrid />
        <Calendar.Footer>
          <Calendar.ClearButton />
          <Calendar.ConfirmButton />
        </Calendar.Footer>
      </Calendar.Frame>
    </Calendar.Root>
  );
}

// ─── Showcase (default export) ──────────────────────────────────────────────

export default function ComposableCalendarShowcase() {
  return (
    <ScrollView className="bg-background" contentContainerClassName="p-4 gap-4">
      <Section title="Day picker">
        <DayPicker />
      </Section>
      <Section title="Full picker (all sub-grids + system switcher)">
        <FullPicker />
      </Section>
      <Section title="Range picker (custom labels)">
        <RangePicker />
      </Section>
      <Section title="Multi-system (Hijri default)">
        <MultiSystemPicker />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-muted text-[11px] font-semibold tracking-widest uppercase">
        {title}
      </Text>
      {children}
    </View>
  );
}
