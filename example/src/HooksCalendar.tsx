/**
 * HooksCalendar — shared shadcn-styled building block for every example.
 *
 * Built entirely from the five public hooks:
 *   - useCalendarDays
 *   - useCalendarMonths
 *   - useCalendarYears
 *   - useCalendarActions
 *   - useCalendarSelector
 *
 * Visual language is modelled on shadcn/ui's Calendar primitive: a light
 * card with a hairline border, ghost icon chevrons, uppercase weekday
 * labels, square-rounded day cells, and a near-black "primary" accent.
 */
import { memo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  useCalendarActions,
  useCalendarDays,
  useCalendarMonths,
  useCalendarSelector,
  useCalendarYears,
  type DayCellInfo,
} from 'react-native-fast-calendar';

// ─── shadcn-inspired palette ────────────────────────────────────────────────

export const tokens = {
  background: '#ffffff',
  foreground: '#09090b',
  muted: '#f4f4f5',
  mutedForeground: '#71717a',
  border: '#e4e4e7',
  accent: '#f4f4f5',
  accentForeground: '#18181b',
  primary: '#18181b',
  primaryForeground: '#fafafa',
  ring: '#a1a1aa',
  destructive: '#ef4444',
} as const;

type ViewKind = 'day' | 'month' | 'year';

export interface HooksCalendarProps {
  /** Optional caption shown above the navigation header. */
  caption?: string;
  /** Override the per-cell renderer (e.g. flight prices, image cells). */
  renderDay?: (cell: DayCellInfo) => ReactNode;
  /** Map of `modifierName -> style` merged onto matched cells. */
  modifierStyles?: Record<string, object>;
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
  modifierStyles,
  hidePickers,
  hideActions,
  cellSize = 36,
}: HooksCalendarProps) {
  const [view, setView] = useState<ViewKind>('day');
  const days = useCalendarDays();
  const months = useCalendarMonths();
  const years = useCalendarYears();
  const actions = useCalendarActions();
  const systemId = useCalendarSelector((s) => s.system.id);

  return (
    <View style={styles.card}>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}

      <View style={styles.headerRow}>
        <IconButton onPress={days.goPrevMonth} label="‹" />
        <Pressable
          onPress={() =>
            !hidePickers && setView((v) => (v === 'day' ? 'month' : 'day'))
          }
          style={styles.headerLabels}
        >
          <Text style={styles.title}>
            {days.displayedMonthLabel} {days.displayedYearLabel}
          </Text>
          <Text style={styles.subtitle}>{systemId}</Text>
        </Pressable>
        <IconButton onPress={days.goNextMonth} label="›" />
      </View>

      {!hidePickers && (
        <View style={styles.tabs}>
          {(['day', 'month', 'year'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setView(tab)}
              style={[styles.tab, tab === view && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, tab === view && styles.tabTextActive]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {view === 'day' && (
        <DayView
          days={days}
          renderDay={renderDay}
          modifierStyles={modifierStyles}
          cellSize={cellSize}
        />
      )}

      {!hidePickers && view === 'month' && (
        <MonthView months={months} onPick={() => setView('day')} />
      )}

      {!hidePickers && view === 'year' && (
        <YearView years={years} onPick={() => setView('day')} />
      )}

      {!hideActions && (
        <View style={styles.actionRow}>
          <GhostButton onPress={actions.clear} label="Clear" />
          <PrimaryButton
            onPress={actions.confirm}
            disabled={!actions.canConfirm}
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
    <Pressable onPress={onPress} style={styles.iconButton}>
      <Text style={styles.iconButtonText}>{label}</Text>
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
    <Pressable onPress={onPress} style={styles.ghostButton}>
      <Text style={styles.ghostButtonText}>{label}</Text>
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
      style={[styles.primaryButton, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

// ─── views ──────────────────────────────────────────────────────────────────

interface DayViewProps {
  days: ReturnType<typeof useCalendarDays>;
  renderDay?: (cell: DayCellInfo) => ReactNode;
  modifierStyles?: Record<string, object>;
  cellSize: number;
}

const DayView = memo(function DayView({
  days,
  renderDay,
  modifierStyles,
  cellSize,
}: DayViewProps) {
  // Lock the row to exactly 7 columns so the grid can never wrap into
  // 8- or 9-cell rows on wider parents.
  const rowWidth = cellSize * 7;
  return (
    <View style={styles.daysWrapper}>
      <View style={[styles.weekdays, { width: rowWidth }]}>
        {days.weekdayLabels.map((label) => (
          <Text key={label} style={[styles.weekday, { width: cellSize }]}>
            {label.slice(0, 2)}
          </Text>
        ))}
      </View>
      <View style={[styles.grid, { width: rowWidth }]}>
        {days.cells.map((cell) => (
          <DayCell
            key={cell.nativeDate.toISOString()}
            cell={cell}
            onPress={() => days.selectDate(cell.date)}
            cellSize={cellSize}
            renderDay={renderDay}
            modifierStyles={modifierStyles}
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
  modifierStyles?: Record<string, object>;
}

const DayCell = memo(function DayCell({
  cell,
  onPress,
  cellSize,
  renderDay,
  modifierStyles,
}: DayCellProps) {
  const matchedModStyle = modifierStyles
    ? Object.entries(cell.modifiers)
        .filter(([, v]) => v)
        .map(([k]) => modifierStyles[k])
        .filter(Boolean)
    : null;

  // Range middle cells get a flat (non-rounded) background to form a pill
  const isRangeMiddle = cell.inRange && !cell.isRangeStart && !cell.isRangeEnd;

  return (
    <Pressable
      disabled={cell.isDisabled}
      onPress={onPress}
      style={[
        styles.day,
        { width: cellSize, height: cellSize },
        !cell.isCurrentMonth && styles.dayOutside,
        isRangeMiddle && styles.dayInRange,
        cell.isRangeStart && styles.dayRangeStart,
        cell.isRangeEnd && styles.dayRangeEnd,
        cell.isSelected && styles.daySelected,
        cell.isToday && !cell.isSelected && styles.dayToday,
        cell.isDisabled && styles.dayDisabled,
        ...(matchedModStyle ?? []),
      ]}
    >
      {renderDay ? (
        renderDay(cell)
      ) : (
        <Text
          style={[
            styles.dayText,
            !cell.isCurrentMonth && styles.dayTextOutside,
            cell.isSelected && styles.dayTextSelected,
          ]}
        >
          {cell.label}
        </Text>
      )}
    </Pressable>
  );
});

interface MonthViewProps {
  months: ReturnType<typeof useCalendarMonths>;
  onPick: () => void;
}

const MonthView = memo(function MonthView({ months, onPick }: MonthViewProps) {
  return (
    <View style={styles.pickerGrid}>
      {months.months.map((m) => (
        <Pressable
          key={m.index}
          onPress={() => {
            months.selectMonth(m.index);
            onPick();
          }}
          style={[
            styles.pickerCell,
            m.index === months.activeMonth && styles.pickerCellActive,
          ]}
        >
          <Text
            style={[
              styles.pickerText,
              m.index === months.activeMonth && styles.pickerTextActive,
            ]}
          >
            {m.label.slice(0, 3)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});

interface YearViewProps {
  years: ReturnType<typeof useCalendarYears>;
  onPick: () => void;
}

const YearView = memo(function YearView({ years, onPick }: YearViewProps) {
  return (
    <View>
      <View style={styles.headerRow}>
        <IconButton onPress={years.goPrevPage} label="‹" />
        <Text style={styles.title}>
          {years.years[0]} – {years.years[years.years.length - 1]}
        </Text>
        <IconButton onPress={years.goNextPage} label="›" />
      </View>
      <View style={styles.pickerGrid}>
        {years.years.map((y) => (
          <Pressable
            key={y}
            onPress={() => {
              years.selectYear(y);
              onPick();
            }}
            style={[
              styles.pickerCell,
              y === years.activeYear && styles.pickerCellActive,
            ]}
          >
            <Text
              style={[
                styles.pickerText,
                y === years.activeYear && styles.pickerTextActive,
              ]}
            >
              {y}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
});

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.background,
    borderColor: tokens.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  caption: {
    color: tokens.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLabels: {
    alignItems: 'center',
  },
  title: {
    color: tokens.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: tokens.mutedForeground,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  iconButton: {
    alignItems: 'center',
    borderColor: tokens.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  iconButtonText: {
    color: tokens.foreground,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 16,
  },
  tabs: {
    backgroundColor: tokens.muted,
    borderRadius: 6,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 2,
  },
  tab: {
    borderRadius: 4,
    flex: 1,
    paddingVertical: 6,
  },
  tabActive: {
    backgroundColor: tokens.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    color: tokens.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: tokens.foreground,
  },
  daysWrapper: {
    alignItems: 'center',
  },
  weekdays: {
    flexDirection: 'row',
    marginBottom: 4,
    marginTop: 4,
  },
  weekday: {
    color: tokens.mutedForeground,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
  },
  dayOutside: {
    opacity: 1,
  },
  daySelected: {
    backgroundColor: tokens.primary,
  },
  dayInRange: {
    backgroundColor: tokens.muted,
    borderRadius: 0,
  },
  dayRangeStart: {
    backgroundColor: tokens.primary,
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
  },
  dayRangeEnd: {
    backgroundColor: tokens.primary,
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
  },
  dayToday: {
    backgroundColor: tokens.accent,
  },
  dayDisabled: {
    opacity: 0.4,
  },
  dayText: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '500',
  },
  dayTextOutside: {
    color: tokens.mutedForeground,
    opacity: 0.5,
  },
  dayTextSelected: {
    color: tokens.primaryForeground,
    fontWeight: '600',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pickerCell: {
    alignItems: 'center',
    borderColor: tokens.border,
    borderRadius: 6,
    borderWidth: 1,
    flexBasis: '30%',
    flexGrow: 1,
    paddingVertical: 12,
  },
  pickerCellActive: {
    backgroundColor: tokens.primary,
    borderColor: tokens.primary,
  },
  pickerText: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '500',
  },
  pickerTextActive: {
    color: tokens.primaryForeground,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  ghostButton: {
    alignItems: 'center',
    borderColor: tokens.border,
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  ghostButtonText: {
    color: tokens.foreground,
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: tokens.primary,
    borderRadius: 6,
    flex: 1,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: tokens.primaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
