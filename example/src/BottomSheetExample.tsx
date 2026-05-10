/**
 * Bottom Sheet Calendar Example
 *
 * Demonstrates integrating react-native-fast-calendar with @gorhom/bottom-sheet
 * for a common date picker pattern.
 *
 * Installation:
 *   npm install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
 *
 * Setup:
 *   - Wrap your app with GestureHandlerRootView
 *   - Add Reanimated plugin to babel.config.js:
 *       plugins: ['react-native-reanimated/plugin']
 */
import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  Calendar,
  SimpleCalendar,
  useCalendarActions,
  useCalendarConfig,
  useCalendarHeader,
  useCalendarMonthPicker,
  useCalendarSelector,
  useCalendarTheme,
  useCalendarYearPicker,
  type CalendarThemeOverride,
} from 'react-native-fast-calendar';

// =============================================================================
// Theme — shared between the screen UI and the calendar inside the sheet
// so the sheet looks visually unified.
// =============================================================================

const C = {
  background: '#18181B', // zinc-900
  card: '#27272A', // zinc-800 — sheet background
  foreground: '#FAFAFA', // zinc-50
  mutedForeground: '#A1A1AA', // zinc-400
  primary: '#60A5FA', // blue-400
  border: '#3F3F46', // zinc-700
};

// Calendar theme that matches the sheet's card background so the calendar
// blends seamlessly into the bottom sheet rather than floating on top of it.
const sheetCalendarTheme: CalendarThemeOverride = {
  colors: {
    background: C.card, // matches BottomSheetModal background
    primary: C.primary,
    onPrimary: C.background,
    text: C.foreground,
    textMuted: C.mutedForeground,
    todayBorder: C.primary,
    rangeBackground: '#1E3A8A', // blue-900 — subtle on dark
    disabled: '#52525B', // zinc-600
    border: C.border,
  },
  cellSize: 40,
  borderRadius: 8,
};

// =============================================================================
// Headless building blocks — these MUST be rendered inside <Calendar.Root>.
// They hook into the same store the day grid uses, so they always reflect
// the current selection.
// =============================================================================

function MinimalHeader() {
  const theme = useCalendarTheme();
  const {
    monthLabel,
    yearLabel,
    isMonthVisible,
    toggleMonthPicker,
    toggleYearPicker,
    goPrev,
    goNext,
  } = useCalendarHeader();

  return (
    <View style={headerStyles.row}>
      <View style={headerStyles.labels}>
        {isMonthVisible && (
          <Pressable onPress={toggleMonthPicker} style={headerStyles.labelBtn}>
            <Text style={[headerStyles.label, { color: theme.colors.text }]}>
              {monthLabel}
            </Text>
          </Pressable>
        )}
        <Pressable onPress={toggleYearPicker} style={headerStyles.labelBtn}>
          <Text style={[headerStyles.label, { color: theme.colors.text }]}>
            {yearLabel}
          </Text>
        </Pressable>
      </View>
      <View style={headerStyles.nav}>
        <Pressable
          onPress={goPrev}
          style={[
            headerStyles.navBtn,
            { backgroundColor: theme.colors.border },
          ]}
        >
          <Text style={[headerStyles.navTxt, { color: theme.colors.text }]}>
            ‹
          </Text>
        </Pressable>
        <Pressable
          onPress={goNext}
          style={[
            headerStyles.navBtn,
            { backgroundColor: theme.colors.border },
          ]}
        >
          <Text style={[headerStyles.navTxt, { color: theme.colors.text }]}>
            ›
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function CompactFooter({ onConfirm }: { onConfirm: () => void }) {
  const { confirm, clear, canConfirm } = useCalendarActions();
  const { labels } = useCalendarConfig();
  const theme = useCalendarTheme();

  const handleConfirm = useCallback(() => {
    confirm();
    onConfirm();
  }, [confirm, onConfirm]);

  return (
    <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
      <Pressable onPress={clear} style={styles.footerButton}>
        <Text
          style={[styles.footerButtonText, { color: theme.colors.textMuted }]}
        >
          {labels.clear}
        </Text>
      </Pressable>
      <Pressable
        disabled={!canConfirm}
        onPress={handleConfirm}
        style={[
          styles.confirmButton,
          { backgroundColor: theme.colors.primary },
          !canConfirm && styles.disabledButton,
        ]}
      >
        <Text
          style={[styles.confirmButtonText, { color: theme.colors.onPrimary }]}
        >
          {labels.confirm}
        </Text>
      </Pressable>
    </View>
  );
}

function CalendarBody() {
  const view = useCalendarSelector((s) => s.view);
  if (view === 'day') {
    return <Calendar.DayGrid swipeable />;
  }
  if (view === 'month') {
    return <MonthPickerGrid />;
  }
  return <YearPickerGrid />;
}

function MonthPickerGrid() {
  const theme = useCalendarTheme();
  const { months, activeMonth, selectMonth } = useCalendarMonthPicker();
  return (
    <View style={pickerStyles.grid}>
      {months.map((m) => (
        <Pressable
          key={m.index}
          onPress={() => selectMonth(m.index)}
          style={[
            pickerStyles.cell,
            m.index === activeMonth && {
              backgroundColor: theme.colors.primary,
            },
          ]}
        >
          <Text
            style={{
              color:
                m.index === activeMonth
                  ? theme.colors.onPrimary
                  : theme.colors.text,
            }}
          >
            {m.label.slice(0, 3)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function YearPickerGrid() {
  const theme = useCalendarTheme();
  const { years, activeYear, selectYear } = useCalendarYearPicker();
  return (
    <View style={pickerStyles.grid}>
      {years.map((y) => (
        <Pressable
          key={y}
          onPress={() => selectYear(y)}
          style={[
            pickerStyles.cell,
            y === activeYear && { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text
            style={{
              color:
                y === activeYear ? theme.colors.onPrimary : theme.colors.text,
            }}
          >
            {y}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// =============================================================================
// Single Date Picker Bottom Sheet
// =============================================================================

export interface SingleDatePickerRef {
  present: () => void;
  dismiss: () => void;
}

interface SingleDatePickerProps {
  onSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  initialDate?: Date;
}

function SingleDatePickerSheet({
  onSelect,
  minDate,
  maxDate,
  initialDate,
  ref,
}: SingleDatePickerProps & { ref?: Ref<SingleDatePickerRef> }) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    present: () => {
      bottomSheetModalRef.current?.present();
    },
    dismiss: () => {
      bottomSheetModalRef.current?.dismiss();
    },
  }));

  const handleConfirm = useCallback(
    (payload: { date?: Date }) => {
      if (payload.date) {
        onSelect(payload.date);
        bottomSheetModalRef.current?.dismiss();
      }
    },
    [onSelect]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose
    >
      <BottomSheetView style={styles.contentContainer}>
        <Text style={styles.title}>Select Date</Text>
        {/*
         * Headless API: render Calendar.Root, then any children that call
         * useCalendar* hooks (header, footer, custom views) all share the
         * same store. This is the correct way to compose custom UI around
         * the calendar — SimpleCalendar wouldn't allow CompactFooter as a
         * sibling because SimpleCalendar contains its own Root internally.
         */}
        <Calendar.Root
          mode="single"
          theme={sheetCalendarTheme}
          minDate={minDate}
          maxDate={maxDate}
          initialDate={initialDate}
          onConfirm={handleConfirm}
        >
          <View
            style={[
              styles.headlessContainer,
              { backgroundColor: sheetCalendarTheme.colors!.background },
            ]}
          >
            <MinimalHeader />
            <CalendarBody />
            <CompactFooter
              onConfirm={() => bottomSheetModalRef.current?.dismiss()}
            />
          </View>
        </Calendar.Root>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

// =============================================================================
// Range Date Picker Bottom Sheet
// =============================================================================

export interface RangeDatePickerRef {
  present: () => void;
  dismiss: () => void;
}

interface RangeDatePickerProps {
  onSelect: (startDate: Date, endDate: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  maxRangeDays?: number;
}

function RangeDatePickerSheet({
  onSelect,
  minDate,
  maxDate,
  maxRangeDays,
  ref,
}: RangeDatePickerProps & { ref?: Ref<RangeDatePickerRef> }) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    present: () => {
      bottomSheetModalRef.current?.present();
    },
    dismiss: () => {
      bottomSheetModalRef.current?.dismiss();
    },
  }));

  const handleConfirm = useCallback(
    ({ startDate, endDate }: { startDate?: Date; endDate?: Date }) => {
      if (startDate && endDate) {
        onSelect(startDate, endDate);
        bottomSheetModalRef.current?.dismiss();
      }
    },
    [onSelect]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose
    >
      <BottomSheetView style={styles.contentContainer}>
        <Text style={styles.title}>Select Date Range</Text>
        <View style={styles.calendarWrapper}>
          <SimpleCalendar
            mode="range"
            theme={sheetCalendarTheme}
            minDate={minDate}
            maxDate={maxDate}
            maxRangeDays={maxRangeDays}
            onConfirm={handleConfirm}
            showHeader
            showFooter
            swipeable
            style={styles.calendarInSheet}
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

// =============================================================================
// Demo Screen
// =============================================================================

export default function BottomSheetCalendarDemo() {
  const singlePickerRef = useRef<SingleDatePickerRef>(null);
  const rangePickerRef = useRef<RangeDatePickerRef>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRange, setSelectedRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        <View style={styles.container}>
          <Text style={styles.header}>Bottom Sheet Calendar</Text>
          <Text style={styles.subheader}>
            Tap a button to open the calendar in a bottom sheet
          </Text>

          {/* Single Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Single Date</Text>
            <Pressable
              style={styles.button}
              onPress={() => singlePickerRef.current?.present()}
            >
              <Text style={styles.buttonText}>
                {selectedDate
                  ? selectedDate.toLocaleDateString()
                  : 'Select Date'}
              </Text>
            </Pressable>
            {selectedDate && (
              <Pressable
                style={styles.clearLink}
                onPress={() => setSelectedDate(null)}
              >
                <Text style={styles.clearLinkText}>Clear</Text>
              </Pressable>
            )}
          </View>

          {/* Range Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Range</Text>
            <Pressable
              style={styles.button}
              onPress={() => rangePickerRef.current?.present()}
            >
              <Text style={styles.buttonText}>
                {selectedRange.start && selectedRange.end
                  ? `${selectedRange.start.toDateString()} - ${selectedRange.end.toDateString()}`
                  : 'Select Range'}
              </Text>
            </Pressable>
            {selectedRange.start && (
              <Pressable
                style={styles.clearLink}
                onPress={() => setSelectedRange({ start: null, end: null })}
              >
                <Text style={styles.clearLinkText}>Clear</Text>
              </Pressable>
            )}
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Features</Text>
            <Text style={styles.infoText}>• Swipe between months</Text>
            <Text style={styles.infoText}>• Tap backdrop to close</Text>
            <Text style={styles.infoText}>• Drag down to dismiss</Text>
            <Text style={styles.infoText}>• Dark theme optimized</Text>
          </View>

          {/* Bottom Sheet Instances */}
          <SingleDatePickerSheet
            ref={singlePickerRef}
            onSelect={setSelectedDate}
            minDate={new Date()}
            maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year
            initialDate={selectedDate ?? undefined}
          />

          <RangeDatePickerSheet
            ref={rangePickerRef}
            onSelect={(start, end) => setSelectedRange({ start, end })}
            minDate={new Date()}
            maxRangeDays={30}
          />
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: C.foreground,
    marginBottom: 8,
    marginTop: 60,
  },
  subheader: {
    fontSize: 14,
    color: C.mutedForeground,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: C.mutedForeground,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: C.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  buttonText: {
    fontSize: 16,
    color: C.foreground,
  },
  clearLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearLinkText: {
    fontSize: 14,
    color: C.primary,
  },
  infoCard: {
    backgroundColor: C.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.foreground,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: C.mutedForeground,
    marginBottom: 4,
  },
  sheetBackground: {
    backgroundColor: C.card,
  },
  handleIndicator: {
    backgroundColor: C.border,
    width: 40,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: C.foreground,
    marginBottom: 16,
    textAlign: 'center',
  },
  calendarWrapper: {
    alignItems: 'center',
  },
  calendarInSheet: {
    // Strip SimpleCalendar's outer padding — the BottomSheetView already
    // provides its own padding, so doubling it pushes the grid off-centre.
    padding: 0,
  },
  headlessContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    alignSelf: 'stretch',
  },
  footerButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  footerButtonText: {
    fontSize: 16,
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelBtn: {
    paddingVertical: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  nav: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  navTxt: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 20,
  },
});

const pickerStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    width: 280,
  },
  cell: {
    width: 64,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
