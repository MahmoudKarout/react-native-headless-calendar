/**
 * HooksCalendar — shared shadcn-styled building block for every example.
 *
 * Built on the two public hooks:
 *   - useCalendarSelector(selector)  — universal narrow read primitive.
 *   - useCalendarActions()           — every mutator, subscription-free.
 *
 * The bundled "data shapes" (day grid, month chooser, year page) live
 * on the snapshot itself and are reached via the named selectors
 * `selectDays / selectMonths / selectYears`.
 *
 * Visual language is modelled on shadcn/ui's Calendar primitive: a card
 * with a hairline border, ghost icon chevrons, uppercase weekday labels,
 * square-rounded day cells, and the design-system primary accent.
 *
 * Styling is fully driven by Uniwind utilities and CSS theme tokens
 * (see `example/global.css`).
 */
import { memo, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  selectCanConfirm,
  selectDays,
  selectMonths,
  selectYears,
  useCalendarActions,
  useCalendarSelector,
  type CalendarActions,
  type CalendarDays,
  type CalendarMonths,
  type CalendarYears,
  type DayCellInfo,
} from 'react-native-fast-calendar';

type ViewKind = 'day' | 'month' | 'year';

export interface HooksCalendarProps {
  /** Optional caption shown above the navigation header. */
  caption?: string;
  /** Override the per-cell renderer (e.g. flight prices, image cells). */
  renderDay?: (cell: DayCellInfo) => ReactNode;
  /** Map of `modifierName -> className` applied to matched cells. */
  modifierClassNames?: Record<string, string>;
  /** Hide the month / year picker tabs (single-purpose calendars). */
  hidePickers?: boolean;
  /** Hide the confirm / clear actions. */
  hideActions?: boolean;
  /** Wider/taller cells — useful for image / price cells. */
  cellSize?: number;
}

export function HooksCalendar({
  caption,
  renderDay,
  modifierClassNames,
  hidePickers,
  hideActions,
  cellSize = 36,
}: HooksCalendarProps) {
  const [view, setView] = useState<ViewKind>('day');
  const days = useCalendarSelector(selectDays);
  const months = useCalendarSelector(selectMonths);
  const years = useCalendarSelector(selectYears);
  const actions = useCalendarActions();
  const systemId = useCalendarSelector((s) => s.system.id);
  const canConfirm = useCalendarSelector(selectCanConfirm);

  return (
    <View className="bg-card border-hairline border-border rounded-xl p-4 shadow-sm">
      {caption ? (
        <Text className="text-muted text-[12px] font-medium tracking-wider uppercase mb-3">
          {caption}
        </Text>
      ) : null}

      <View className="flex-row items-center justify-between mb-2">
        <IconButton onPress={actions.goPrevMonth} label="‹" />
        <Pressable
          onPress={() =>
            !hidePickers && setView((v) => (v === 'day' ? 'month' : 'day'))
          }
          className="items-center"
        >
          <Text className="text-foreground text-sm font-semibold">
            {days.displayedMonthLabel} {days.displayedYearLabel}
          </Text>
          <Text className="text-muted text-[10px] font-medium tracking-widest uppercase mt-0.5">
            {systemId}
          </Text>
        </Pressable>
        <IconButton onPress={actions.goNextMonth} label="›" />
      </View>

      {!hidePickers && (
        <View className="bg-surface-muted rounded-md flex-row p-0.5 mb-3">
          {(['day', 'month', 'year'] as const).map((tab) => {
            const active = tab === view;
            return (
              <Pressable
                key={tab}
                onPress={() => setView(tab)}
                className={`flex-1 rounded py-1.5 ${active ? 'bg-card shadow-sm' : ''}`}
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
      )}

      {view === 'day' && (
        <DayView
          days={days}
          selectDate={actions.selectDate}
          renderDay={renderDay}
          modifierClassNames={modifierClassNames}
          cellSize={cellSize}
        />
      )}

      {!hidePickers && view === 'month' && (
        <MonthView
          months={months}
          selectMonth={actions.selectMonth}
          onPick={() => setView('day')}
        />
      )}

      {!hidePickers && view === 'year' && (
        <YearView
          years={years}
          selectYear={actions.selectYear}
          prevYearPage={actions.prevYearPage}
          nextYearPage={actions.nextYearPage}
          onPick={() => setView('day')}
        />
      )}

      {!hideActions && (
        <View className="flex-row gap-2 mt-4">
          <GhostButton onPress={actions.clear} label="Clear" />
          <PrimaryButton
            onPress={actions.confirm}
            disabled={!canConfirm}
            label="Confirm"
          />
        </View>
      )}
    </View>
  );
}

// ─── primitives ─────────────────────────────────────────────────────────────

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

function GhostButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center py-2.5 rounded-md border-hairline border-border active:bg-surface-muted"
    >
      <Text className="text-foreground text-[13px] font-medium">{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({
  onPress,
  label,
  disabled,
}: {
  onPress: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-1 items-center py-2.5 rounded-md bg-primary active:bg-primary-strong disabled:opacity-40"
    >
      <Text className="text-on-primary text-[13px] font-semibold">{label}</Text>
    </Pressable>
  );
}

// ─── views ──────────────────────────────────────────────────────────────────

interface DayViewProps {
  days: CalendarDays;
  selectDate: CalendarActions['selectDate'];
  renderDay?: (cell: DayCellInfo) => ReactNode;
  modifierClassNames?: Record<string, string>;
  cellSize: number;
}

const DayView = memo(function DayView({
  days,
  selectDate,
  renderDay,
  modifierClassNames,
  cellSize,
}: DayViewProps) {
  // Lock the row to exactly 7 columns so the grid can never wrap into
  // 8- or 9-cell rows on wider parents. Width is dynamic per `cellSize`,
  // so it's the one piece that must stay in an inline style.
  const rowWidth = cellSize * 7;
  return (
    <View className="items-center">
      <View className="flex-row mt-1 mb-1" style={{ width: rowWidth }}>
        {days.weekdayLabels.map((label) => (
          <Text
            key={label}
            className="text-muted text-[11px] font-medium tracking-widest text-center uppercase"
            style={{ width: cellSize }}
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
            onPress={() => selectDate(cell.date)}
            cellSize={cellSize}
            renderDay={renderDay}
            modifierClassNames={modifierClassNames}
          />
        ))}
      </View>
    </View>
  );
});

interface DayCellProps {
  cell: DayCellInfo;
  onPress: () => void;
  cellSize: number;
  renderDay?: (cell: DayCellInfo) => ReactNode;
  modifierClassNames?: Record<string, string>;
}

const DayCell = memo(function DayCell({
  cell,
  onPress,
  cellSize,
  renderDay,
  modifierClassNames,
}: DayCellProps) {
  const modifierClass = modifierClassNames
    ? Object.entries(cell.modifiers)
        .filter(([, v]) => v)
        .map(([k]) => modifierClassNames[k])
        .filter(Boolean)
        .join(' ')
    : '';

  const isRangeMiddle = cell.inRange && !cell.isRangeStart && !cell.isRangeEnd;

  // Compose state classes (order matters: later wins on conflicts).
  const stateClass = [
    'items-center justify-center',
    isRangeMiddle ? 'bg-surface-muted rounded-none' : 'rounded-md',
    cell.isRangeStart && 'bg-primary rounded-r-none',
    cell.isRangeEnd && 'bg-primary rounded-l-none',
    cell.isSelected && 'bg-primary',
    cell.isToday && !cell.isSelected && 'bg-surface-muted',
    cell.isDisabled && 'opacity-40',
    modifierClass,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={onPress}
      className={stateClass}
      style={{ width: cellSize, height: cellSize }}
    >
      {renderDay ? (
        renderDay(cell)
      ) : (
        <Text
          className={[
            'text-[13px] font-medium',
            cell.isSelected
              ? 'text-on-primary font-semibold'
              : !cell.isCurrentMonth
                ? 'text-muted opacity-50'
                : 'text-foreground',
          ].join(' ')}
        >
          {cell.label}
        </Text>
      )}
    </Pressable>
  );
});

interface MonthViewProps {
  months: CalendarMonths;
  selectMonth: CalendarActions['selectMonth'];
  onPick: () => void;
}

const MonthView = memo(function MonthView({
  months,
  selectMonth,
  onPick,
}: MonthViewProps) {
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {months.months.map((m) => {
        const active = m.index === months.activeMonth;
        return (
          <Pressable
            key={m.index}
            onPress={() => {
              selectMonth(m.index);
              onPick();
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
});

interface YearViewProps {
  years: CalendarYears;
  selectYear: CalendarActions['selectYear'];
  prevYearPage: CalendarActions['prevYearPage'];
  nextYearPage: CalendarActions['nextYearPage'];
  onPick: () => void;
}

const YearView = memo(function YearView({
  years,
  selectYear,
  prevYearPage,
  nextYearPage,
  onPick,
}: YearViewProps) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <IconButton onPress={prevYearPage} label="‹" />
        <Text className="text-foreground text-sm font-semibold">
          {years.years[0]} – {years.years[years.years.length - 1]}
        </Text>
        <IconButton onPress={nextYearPage} label="›" />
      </View>
      <View className="flex-row flex-wrap gap-1.5">
        {years.years.map((y) => {
          const active = y === years.activeYear;
          return (
            <Pressable
              key={y}
              onPress={() => {
                selectYear(y);
                onPick();
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
});
