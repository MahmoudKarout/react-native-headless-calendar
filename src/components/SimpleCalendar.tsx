/**
 * SimpleCalendar — a zero-config, opinionated calendar for the 80% use case.
 *
 * Wraps the full headless API into one component with sensible defaults:
 * - Gregorian calendar (no import needed)
 * - Header with month/year labels and navigation
 * - Swipeable day grid
 * - Optional confirm/clear footer
 */
import { type ReactNode, useMemo } from 'react';
import {
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import {
  useCalendarActions,
  useCalendarConfig,
  useCalendarMonthLabel,
  useCalendarNavigation,
  useCalendarSystemSwitcher,
  useCalendarTheme,
  useCalendarYearLabel,
} from '../context';
import { defaultLabels } from '../defaults';
import { gregorianSystem } from '../systems/gregorian';
import type {
  CalendarMode,
  CalendarSystem,
  CalendarThemeOverride,
  OnClear,
  OnConfirm,
  Weekday,
} from '../types';
import { Root } from './Root';
// Need to import Calendar namespace for DayGrid
import { Calendar } from '../Calendar';

export interface SimpleCalendarProps {
  /**
   * Selection mode. Defaults to 'single'.
   */
  mode?: CalendarMode;

  /**
   * Calendar systems to use. Defaults to [gregorianSystem] if not provided.
   * Pass multiple systems to enable system switching.
   */
  systems?: readonly CalendarSystem[];

  /**
   * Called immediately when a date is selected (tapped).
   * Use this for real-time updates; use onConfirm for explicit confirmation.
   */
  onSelect?: (date: Date) => void;

  /**
   * Called when user confirms selection.
   */
  onConfirm?: OnConfirm;

  /**
   * Called when selection is cleared.
   */
  onClear?: OnClear;

  /**
   * Enable horizontal swipe to change months. Default: true.
   * Mutually exclusive with numberOfMonths > 1.
   */
  swipeable?: boolean;

  /**
   * Render multiple months side-by-side. Default: 1.
   * When > 1, swipeable is automatically disabled.
   */
  numberOfMonths?: number;

  /**
   * Show week numbers in the leftmost column. Default: false.
   */
  showWeekNumbers?: boolean;

  /**
   * Which weekday occupies the first column (0=Sunday, 1=Monday, etc).
   * Default: 0.
   */
  firstDayOfWeek?: Weekday;

  /**
   * Show days from previous/next month in the grid. Default: true.
   */
  showOutsideDays?: boolean;

  /**
   * Always render 6 rows (fixed height). Default: true.
   */
  fixedWeeks?: boolean;

  /**
   * Inclusive minimum selectable date.
   */
  minDate?: Date;

  /**
   * Inclusive maximum selectable date.
   */
  maxDate?: Date;

  /**
   * Initial selected date in single mode.
   */
  initialDate?: Date;

  /**
   * Initial start date in range mode.
   */
  initialStart?: Date;

  /**
   * Initial end date in range mode.
   */
  initialEnd?: Date;

  /**
   * Initial selected dates in multiple mode.
   */
  initialDates?: readonly Date[];

  /**
   * Theme override. Deep-merges with default theme.
   */
  theme?: CalendarThemeOverride;

  /**
   * Label overrides. Deep-merges with default labels.
   */
  labels?: Partial<typeof defaultLabels>;

  /**
   * Allow selecting same day as both range endpoints. Default: false.
   */
  allowSameDay?: boolean;

  /**
   * Minimum range length in days (range mode only).
   */
  minRangeDays?: number;

  /**
   * Maximum range length in days (range mode only).
   */
  maxRangeDays?: number;

  /**
   * Maximum number of selectable dates (multiple mode only).
   */
  maxSelected?: number;

  /**
   * Dynamic disabled date predicate.
   */
  disabled?: (date: Date) => boolean;

  /**
   * Test ID prefix for all internal nodes.
   */
  testID?: string;

  /**
   * Container style override.
   */
  style?: ViewStyle;
}

// =============================================================================
// Internal Header Component
// =============================================================================

function SimpleHeader() {
  const theme = useCalendarTheme();
  const { labels, testID } = useCalendarConfig();
  const month = useCalendarMonthLabel();
  const year = useCalendarYearLabel();
  const { goPrev, goNext } = useCalendarNavigation();
  const { systems, activeId, setActive } = useCalendarSystemSwitcher();

  const showSystemSwitcher = systems.length > 1;

  // Subtle background for unselected pills/buttons. Uses border color
  // which is themed for both light and dark modes.
  const subtleBg = theme.colors.border;

  return (
    <View style={styles.header}>
      {showSystemSwitcher && (
        <View style={styles.systemSwitcher}>
          {systems.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setActive(s.id)}
              style={[
                styles.systemButton,
                {
                  backgroundColor:
                    s.id === activeId ? theme.colors.primary : subtleBg,
                },
              ]}
              testID={testID ? `${testID}.simple.system.${s.id}` : undefined}
            >
              <Text
                style={[
                  styles.systemButtonText,
                  {
                    color:
                      s.id === activeId
                        ? theme.colors.onPrimary
                        : theme.colors.text,
                  },
                ]}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.headerRow}>
        <View style={styles.monthYear}>
          {month.isVisible && (
            <Pressable
              onPress={month.toggle}
              style={styles.monthButton}
              testID={testID ? `${testID}.simple.month` : undefined}
            >
              <Text style={[styles.monthText, { color: theme.colors.text }]}>
                {month.label}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={year.toggle}
            style={styles.yearButton}
            testID={testID ? `${testID}.simple.year` : undefined}
          >
            <Text style={[styles.yearText, { color: theme.colors.text }]}>
              {year.label}
            </Text>
          </Pressable>
        </View>

        <View style={styles.navButtons}>
          <Pressable
            onPress={goPrev}
            style={[styles.navButton, { backgroundColor: subtleBg }]}
            accessibilityLabel={labels.prev}
            testID={testID ? `${testID}.simple.prev` : undefined}
          >
            <Text style={[styles.navArrow, { color: theme.colors.text }]}>
              {I18nManager.isRTL ? '›' : '‹'}
            </Text>
          </Pressable>
          <Pressable
            onPress={goNext}
            style={[styles.navButton, { backgroundColor: subtleBg }]}
            accessibilityLabel={labels.next}
            testID={testID ? `${testID}.simple.next` : undefined}
          >
            <Text style={[styles.navArrow, { color: theme.colors.text }]}>
              {I18nManager.isRTL ? '‹' : '›'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// Internal Footer Component
// =============================================================================

function SimpleFooter() {
  const theme = useCalendarTheme();
  const { labels, testID } = useCalendarConfig();
  const { confirm, clear, canConfirm } = useCalendarActions();

  return (
    <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
      <Pressable
        onPress={clear}
        style={styles.clearButton}
        testID={testID ? `${testID}.simple.clear` : undefined}
      >
        <Text style={[styles.clearText, { color: theme.colors.textMuted }]}>
          {labels.clear}
        </Text>
      </Pressable>
      <Pressable
        disabled={!canConfirm}
        onPress={confirm}
        style={[
          styles.confirmButton,
          { backgroundColor: theme.colors.primary },
          !canConfirm && styles.confirmButtonDisabled,
        ]}
        testID={testID ? `${testID}.simple.confirm` : undefined}
      >
        <Text style={[styles.confirmText, { color: theme.colors.onPrimary }]}>
          {labels.confirm}
        </Text>
      </Pressable>
    </View>
  );
}

// =============================================================================
// SimpleCalendarContent — the themed container, rendered inside Root so it
// can access useCalendarTheme() for the background color.
//
// Accepts children instead of boolean flags so the caller explicitly composes
// whatever header/footer/grid combination it needs. This makes the structure
// visible at the call site rather than hidden behind `showHeader`/`showFooter`
// booleans.
// =============================================================================

export interface SimpleCalendarContentProps {
  children?: ReactNode;
  style?: ViewStyle;
}

export function SimpleCalendarContent({
  children,
  style,
}: SimpleCalendarContentProps) {
  const theme = useCalendarTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// =============================================================================
// Main SimpleCalendar Component
// =============================================================================

// SimpleCalendarBase intentionally keeps a handful of pass-through boolean
// config flags (swipeable, showWeekNumbers, showOutsideDays, fixedWeeks,
// allowSameDay) because it is an opinionated convenience wrapper around
// Calendar.Root — each flag maps directly to a Root/DayGrid prop the
// consumer would otherwise have to set individually. Layout customisation
// (showing/hiding Header, Footer) is handled via the compound sub-components.
// eslint-disable-next-line react-doctor/no-many-boolean-props
function SimpleCalendarBase({
  mode = 'single',
  systems: systemsProp,
  onSelect,
  onConfirm,
  onClear,
  swipeable = true,
  numberOfMonths = 1,
  showWeekNumbers = false,
  firstDayOfWeek,
  showOutsideDays = true,
  fixedWeeks = true,
  minDate,
  maxDate,
  initialDate,
  initialStart,
  initialEnd,
  initialDates,
  theme: themeOverride,
  labels: labelsOverride,
  allowSameDay = false,
  minRangeDays,
  maxRangeDays,
  maxSelected,
  disabled,
  testID,
  style,
}: SimpleCalendarProps) {
  // Use provided systems or default to Gregorian
  const systems = systemsProp ?? [gregorianSystem];

  // Create a wrapped onConfirm that also calls onSelect for single-date feedback
  const wrappedOnConfirm: OnConfirm | undefined = useMemo(() => {
    if (!onConfirm && !onSelect) return undefined;
    return (payload) => {
      onConfirm?.(payload);
      // For onSelect, extract the appropriate date
      if (onSelect) {
        if (payload.date) onSelect(payload.date);
        else if (payload.startDate) onSelect(payload.startDate);
        else if (payload.dates && payload.dates.length > 0) {
          onSelect(payload.dates[payload.dates.length - 1]!);
        }
      }
    };
  }, [onConfirm, onSelect]);

  return (
    <Root
      systems={systems}
      mode={mode}
      theme={themeOverride}
      labels={labelsOverride}
      firstDayOfWeek={firstDayOfWeek}
      showOutsideDays={showOutsideDays}
      fixedWeeks={fixedWeeks}
      minDate={minDate}
      maxDate={maxDate}
      initialDate={initialDate}
      initialStart={initialStart}
      initialEnd={initialEnd}
      initialDates={initialDates}
      allowSameDay={allowSameDay}
      minRangeDays={minRangeDays}
      maxRangeDays={maxRangeDays}
      maxSelected={maxSelected}
      disabled={disabled}
      onConfirm={wrappedOnConfirm}
      onClear={onClear}
      testID={testID}
    >
      <SimpleCalendarContent style={style}>
        <SimpleHeader />
        <Calendar.DayGrid
          swipeable={swipeable && numberOfMonths <= 1}
          numberOfMonths={numberOfMonths}
          showWeekNumbers={showWeekNumbers}
        />
        <SimpleFooter />
      </SimpleCalendarContent>
    </Root>
  );
}

/**
 * SimpleCalendar — a zero-config, opinionated calendar for the 80% use case.
 *
 * **Simple usage** (batteries included):
 * ```tsx
 * <SimpleCalendar mode="single" onConfirm={({ date }) => console.log(date)} />
 * ```
 *
 * **Compound usage** (custom layout, same themed primitives):
 * ```tsx
 * <Calendar.Root mode="range" onConfirm={onConfirm}>
 *   <SimpleCalendar.Content>
 *     <SimpleCalendar.Header />
 *     <Calendar.DayGrid showWeekNumbers />
 *     <SimpleCalendar.Footer />
 *   </SimpleCalendar.Content>
 * </Calendar.Root>
 * ```
 *
 * `Header`, `Footer`, and `Content` must be descendants of a `<Calendar.Root>`
 * because they read the calendar context.
 */
export const SimpleCalendar = Object.assign(SimpleCalendarBase, {
  Header: SimpleHeader,
  Footer: SimpleFooter,
  Content: SimpleCalendarContent,
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
  },
  header: {
    marginBottom: 16,
  },
  systemSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  systemButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  systemButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthYear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthButton: {
    paddingVertical: 4,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  yearButton: {
    paddingVertical: 4,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  navArrow: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
