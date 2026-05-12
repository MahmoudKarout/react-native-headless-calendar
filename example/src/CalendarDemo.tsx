/**
 * react-native-fast-calendar — full feature demo, dressed in a
 * shadcn-flavoured black & white visual language.
 *
 * The library is **headless** beyond `<Calendar.Root>` and
 * `<Calendar.DayGrid>`. Every other piece of UI in this file is built by
 * the consumer using the `useCalendar*` hooks and the `components` slot
 * map — there are no built-in chevrons, buttons, segmented controls, or
 * pickers shipped from the package. The atoms / blocks below are the
 * recipe a project would copy into its own design system.
 *
 * Demos covered (one card each):
 *
 *   1. SingleExample      — `mode="single"`, swipeable grid, "Today"
 *                           shortcut, confirm/clear actions.
 *   2. RangeExample       — `mode="range"`, `minRangeDays` / `maxRangeDays`,
 *                           `allowSameDay`, range readout.
 *   3. MultipleExample    — `mode="multiple"`, `maxSelected`, `modifiers`
 *                           (booked / holiday), selected list readout.
 *   4. BoundedExample     — `minDate` / `maxDate`, `disabledDates`,
 *                           dynamic `disabled` predicate (weekends),
 *                           `disabledRanges`.
 *   5. MultiMonthExample  — `numberOfMonths={2}`, `showWeekNumbers`,
 *                           `firstDayOfWeek={1}` (ISO Monday-first),
 *                           `fixedWeeks={false}`, `showOutsideDays={false}`,
 *                           custom `MonthCaption` slot.
 *   6. MultiSystemExample — Gregorian + Hijri systems, system switcher,
 *                           month + year pickers driven by hooks.
 *   7. CustomSlotsExample — `components={{ DayCell, WeekdayHeader,
 *                           WeekNumberCell }}` overrides.
 *   8. LocalisedExample   — `createGregorianSystem` with French month +
 *                           weekday labels, French action labels.
 *   9. ImageCellExample   — `renderDay` swaps the day number for an
 *                           image (e.g. video-upload thumbnails) on
 *                           specific dates while keeping selection.
 */
import React, { useState } from 'react';
import {
  I18nManager,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import {
  Calendar,
  useCalendarActions,
  useCalendarLabels,
  useCalendarMonthLabel,
  useCalendarMonthPicker,
  useCalendarNavigation,
  useCalendarSelectedDates,
  useCalendarSelector,
  useCalendarStore,
  useCalendarSystemSwitcher,
  useCalendarYearLabel,
  useCalendarYearPicker,
  type CalendarComponents,
  type CalendarSystem,
  type CalendarThemeOverride,
  type DayCellInfo,
  type WeekdayHeaderProps,
  type WeekNumberCellProps,
} from 'react-native-fast-calendar';
import { hijriSystem } from 'react-native-fast-calendar/systems/hijri';
import {
  createGregorianSystem,
  gregorianSystem,
} from 'react-native-fast-calendar/systems/gregorian';

// ===========================================================================
// shadcn-flavoured palette (zinc/neutral). Black, white, four greys.
// ===========================================================================

const C = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  foreground: '#0A0A0A',
  mutedForeground: '#71717A', // zinc-500
  muted: '#F4F4F5', // zinc-100
  mutedHover: '#E4E4E7', // zinc-200
  border: '#E4E4E7', // zinc-200
  borderStrong: '#A1A1AA', // zinc-400
  ring: '#0A0A0A',
  primary: '#0A0A0A',
  primaryForeground: '#FAFAFA',
  destructive: '#0A0A0A', // mono — repurpose dot indicators in black
  disabled: '#A1A1AA',
  page: '#FAFAFA', // zinc-50
};

// Theme passed to <Calendar.Root>. The default DayCell / WeekdayCell read
// from this so the built-in grid already looks shadcn-ish out of the box.
const CELL_SIZE = 36;
const COLS = 7;

const SHADCN_THEME: CalendarThemeOverride = {
  colors: {
    background: C.background,
    primary: C.primary,
    onPrimary: C.primaryForeground,
    text: C.foreground,
    textMuted: C.mutedForeground,
    todayBorder: C.foreground,
    rangeBackground: C.muted,
    disabled: C.disabled,
    border: C.border,
  },
  cellSize: CELL_SIZE,
  borderRadius: 6,
  fontSize: { day: 14, weekday: 12, header: 14 },
  spacing: {
    cellInnerGap: 4,
    controlGap: 6,
    controlPadding: 10,
    monthGap: 14,
    containerPadding: 20,
  },
};

/**
 * Natural width of the day grid. The library renders cells at a fixed
 * `theme.cellSize` (36) regardless of the parent width, so any wrapper
 * UI that should "line up" with the grid (header chevrons, action bar,
 * pickers) needs to be constrained to this width too — otherwise it
 * stretches to fill the card and the chevrons appear way to the right
 * of the column they're supposed to navigate.
 */
const GRID_WIDTH = CELL_SIZE * COLS; // 252
const GRID_WIDTH_WEEKS = CELL_SIZE * (COLS + 1); // 288 — incl. week-number column

/**
 * One-stop wrapper that centers a stack of calendar pieces (header,
 * grid, footer, …) inside its parent and constrains them to the grid's
 * natural width so they all line up. Drop your `<Calendar*>` blocks
 * inside it.
 */
function CalendarShell({
  children,
  width = GRID_WIDTH,
}: {
  children: React.ReactNode;
  width?: number;
}) {
  return <View style={[styles.shell, { width }]}>{children}</View>;
}

// ===========================================================================
// Reusable atoms — Card, Button, IconButton, Badge, …
// ===========================================================================

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function CardHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md';

function Button({
  children,
  disabled,
  onPress,
  size = 'md',
  variant = 'primary',
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        size === 'sm' && styles.btnSm,
        variantStyles[variant].container,
        pressed && variantStyles[variant].pressed,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text
        style={[
          styles.btnLabel,
          size === 'sm' && styles.btnLabelSm,
          variantStyles[variant].label,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

function IconButton({
  ariaLabel,
  children,
  onPress,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={ariaLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconBtn,
        pressed && styles.iconBtnPressed,
      ]}
    >
      <Text style={styles.iconBtnGlyph}>{children}</Text>
    </Pressable>
  );
}

function Chevron({
  direction,
  onPress,
}: {
  direction: 'left' | 'right';
  onPress?: () => void;
}) {
  // RTL aware so the visual matches the navigation hook's direction.
  const visual = I18nManager.isRTL
    ? direction === 'left'
      ? '›'
      : '‹'
    : direction === 'left'
      ? '‹'
      : '›';
  return (
    <IconButton
      ariaLabel={direction === 'left' ? 'Previous' : 'Next'}
      onPress={onPress}
    >
      {visual}
    </IconButton>
  );
}

function Badge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'muted' | 'inverted';
}) {
  return (
    <View
      style={[
        styles.badge,
        tone === 'muted' && styles.badgeMuted,
        tone === 'inverted' && styles.badgeInverted,
      ]}
    >
      <Text
        style={[
          styles.badgeLabel,
          tone === 'inverted' && styles.badgeLabelInverted,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

// ===========================================================================
// Calendar pieces — built once, reused across every demo.
// ===========================================================================

/**
 * Header — month + year tappable labels on the left, two chevrons on the
 * right. `month.toggle` opens the month picker; `year.toggle` opens the
 * year picker; both are no-ops when already in the matching view.
 */
function CalendarHeader() {
  const month = useCalendarMonthLabel();
  const year = useCalendarYearLabel();
  const { goPrev, goNext } = useCalendarNavigation();

  return (
    <View style={styles.header}>
      <View style={styles.headerLabels}>
        {month.isVisible && (
          <Pressable
            accessibilityRole="button"
            onPress={month.toggle}
            style={({ pressed }) => [
              styles.headerLabel,
              pressed && styles.headerLabelPressed,
            ]}
          >
            <Text style={styles.headerLabelText}>{month.label}</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={year.toggle}
          style={({ pressed }) => [
            styles.headerLabel,
            pressed && styles.headerLabelPressed,
          ]}
        >
          <Text style={styles.headerLabelText}>{year.label}</Text>
        </Pressable>
      </View>
      <View style={styles.headerNav}>
        <Chevron direction="left" onPress={goPrev} />
        <Chevron direction="right" onPress={goNext} />
      </View>
    </View>
  );
}

/**
 * Switches between the day grid (built-in) and the consumer-built month /
 * year pickers, driven by the `view` slice of the store.
 */
function CalendarView({
  multiMonth,
  showWeekNumbers,
  swipeable,
}: {
  multiMonth?: number;
  showWeekNumbers?: boolean;
  swipeable?: boolean;
}) {
  const view = useCalendarSelector((s) => s.view);
  if (view === 'month') return <MonthPicker />;
  if (view === 'year') return <YearPicker />;
  return (
    <Calendar.DayGrid
      numberOfMonths={multiMonth}
      showWeekNumbers={showWeekNumbers}
      swipeable={swipeable}
    />
  );
}

function MonthPicker() {
  const { months, activeMonth, selectMonth } = useCalendarMonthPicker();
  return (
    <View style={styles.pickerGrid}>
      {months.map((m) => {
        const isActive = m.index === activeMonth;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={m.index}
            onPress={() => selectMonth(m.index)}
            style={({ pressed }) => [
              styles.pickerCell,
              isActive && styles.pickerCellActive,
              pressed && !isActive && styles.pickerCellPressed,
            ]}
          >
            <Text
              style={[
                styles.pickerCellText,
                isActive && styles.pickerCellTextActive,
              ]}
            >
              {m.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function YearPicker() {
  const { years, activeYear, selectYear } = useCalendarYearPicker();
  return (
    <View style={styles.pickerGrid}>
      {years.map((y) => {
        const isActive = y === activeYear;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={y}
            onPress={() => selectYear(y)}
            style={({ pressed }) => [
              styles.pickerCell,
              isActive && styles.pickerCellActive,
              pressed && !isActive && styles.pickerCellPressed,
            ]}
          >
            <Text
              style={[
                styles.pickerCellText,
                isActive && styles.pickerCellTextActive,
              ]}
            >
              {y}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Segmented control for `useCalendarSystemSwitcher`. The hook returns
 * `{ systems, activeId, setActive }` — the visual is entirely consumer
 * code.
 */
function SystemSwitcher() {
  const { systems, activeId, setActive } = useCalendarSystemSwitcher();
  if (systems.length < 2) return null;
  return (
    <View style={styles.segmented}>
      {systems.map((s) => {
        const isActive = s.id === activeId;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={s.id}
            onPress={() => setActive(s.id)}
            style={({ pressed }) => [
              styles.segmentedItem,
              isActive && styles.segmentedItemActive,
              pressed && !isActive && styles.segmentedItemPressed,
            ]}
          >
            <Text
              style={[
                styles.segmentedItemLabel,
                isActive && styles.segmentedItemLabelActive,
              ]}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Confirm + clear actions. `useCalendarActions().canConfirm` flips only
 * when the boolean changes, so the confirm button doesn't churn on every
 * displayed-month change.
 */
function ActionBar() {
  const { canConfirm, clear, confirm } = useCalendarActions();
  const labels = useCalendarLabels();
  return (
    <View style={styles.actionBar}>
      <View style={styles.actionBtn}>
        <Button onPress={clear} variant="outline">
          {labels.clear}
        </Button>
      </View>
      <View style={styles.actionBtn}>
        <Button disabled={!canConfirm} onPress={confirm} variant="primary">
          {labels.confirm}
        </Button>
      </View>
    </View>
  );
}

/** Selects today and jumps the displayed month to it. */
function TodayButton() {
  const store = useCalendarStore();
  return (
    <Button
      onPress={() => {
        const snapshot = store.getSnapshot();
        const today = snapshot.system.today();
        const todayYear = snapshot.system.year(today);
        const todayMonth = snapshot.system.month(today);

        // Navigate to today's year and month, then select the date
        // This ensures we switch back to day view if in month/year picker
        store.goToYear(todayYear);
        store.goToMonth(todayMonth);
        store.selectDate(today);
      }}
      size="md"
      variant="primary"
    >
      Today
    </Button>
  );
}

// ===========================================================================
// 1. Single date — basic shadcn calendar
// ===========================================================================

function SingleExample() {
  const [picked, setPicked] = useState<Date | undefined>();

  return (
    <Card>
      <CardHeader
        title="Single date"
        description="Default mode. Swipe horizontally or use the chevrons to step between months."
      />
      <Calendar.Root
        mode="single"
        onConfirm={({ date }) => setPicked(date)}
        systems={SINGLE_GREGORIAN}
        theme={SHADCN_THEME}
      >
        {/* <CalendarShell>
          <CalendarHeader />
          <CalendarView swipeable />
          <Separator />
          <View style={styles.row}>
            <TodayButton />
            <View style={styles.flex} />
            <Badge tone="muted">
              {picked ? picked.toDateString() : 'No selection'}
            </Badge>
          </View>
          <ActionBar />
        </CalendarShell> */}
      </Calendar.Root>
    </Card>
  );
}

// ===========================================================================
// 2. Date range — minRangeDays / maxRangeDays / allowSameDay
// ===========================================================================

function RangeExample() {
  const [range, setRange] = useState<{ start?: Date; end?: Date }>({});
  const nights =
    range.start && range.end
      ? Math.max(
          1,
          Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000)
        )
      : 0;

  return (
    <Card>
      <CardHeader
        title="Date range"
        description="2-14 night stays. minRangeDays / maxRangeDays kick in when the second tap completes the range."
      />
      <Calendar.Root
        allowSameDay={false}
        maxRangeDays={14}
        minRangeDays={2}
        mode="range"
        onConfirm={({ startDate, endDate }) =>
          setRange({ start: startDate, end: endDate })
        }
        systems={SINGLE_GREGORIAN}
        theme={SHADCN_THEME}
      >
        <CalendarShell>
          <CalendarHeader />
          <CalendarView />
          <Separator />
          <View style={styles.rangeRow}>
            <RangeReadout label="Check-in" date={range.start} />
            <Text style={styles.rangeArrow}>→</Text>
            <RangeReadout label="Check-out" date={range.end} />
            <View style={styles.flex} />
            {nights > 0 && (
              <Badge tone="inverted">
                {nights} night{nights === 1 ? '' : 's'}
              </Badge>
            )}
          </View>
          <ActionBar />
        </CalendarShell>
      </Calendar.Root>
    </Card>
  );
}

function RangeReadout({ date, label }: { date?: Date; label: string }) {
  return (
    <View>
      <Text style={styles.rangeLabel}>{label}</Text>
      <Text style={styles.rangeValue}>{date ? date.toDateString() : '—'}</Text>
    </View>
  );
}

// ===========================================================================
// 3. Multiple selection — modifiers + maxSelected
// ===========================================================================

const BOOKED_DATES = nextNDates(2);
const HOLIDAYS = nextNDates(5).slice(3);

function MultipleExample() {
  return (
    <Card>
      <CardHeader
        title="Multi-select with modifiers"
        description="Pick up to 5 days. Booked days render with a dot; weekends are tagged via predicate."
      />
      <Calendar.Root
        firstDayOfWeek={1}
        initialDates={[]}
        maxSelected={5}
        mode="multiple"
        modifiers={{
          booked: BOOKED_DATES,
          holiday: HOLIDAYS,
          weekend: (d) => d.getDay() === 0 || d.getDay() === 6,
        }}
        systems={SINGLE_GREGORIAN}
        theme={SHADCN_THEME}
      >
        <CalendarShell>
          <CalendarHeader />
          <Calendar.DayGrid
            renderDay={(info) => <DotMarkedCell info={info} />}
          />
          <Separator />
          <MultipleSelectionList />
          <ActionBar />
        </CalendarShell>
      </Calendar.Root>
    </Card>
  );
}

function DotMarkedCell({ info }: { info: DayCellInfo }) {
  const store = useCalendarStore();
  const isBooked = !!info.modifiers.booked;
  const isHoliday = !!info.modifiers.holiday;
  const isWeekend = !!info.modifiers.weekend;

  const onPress = () => store.selectDate(info.date);

  const cellStyle: ViewStyle = {
    backgroundColor: info.isSelected ? C.primary : 'transparent',
    borderColor: info.isToday ? C.foreground : 'transparent',
    borderWidth: info.isToday && !info.isSelected ? 1 : 0,
    opacity: info.isDisabled ? 0.4 : 1,
  };

  const textColor = info.isSelected
    ? C.primaryForeground
    : info.isCurrentMonth && !info.isDisabled
      ? isWeekend
        ? C.mutedForeground
        : C.foreground
      : C.disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: info.isSelected }}
      disabled={info.isDisabled}
      onPress={info.isDisabled ? undefined : onPress}
      style={[styles.dotCell, cellStyle]}
    >
      <Text style={[styles.dotCellLabel, { color: textColor }]}>
        {info.label}
      </Text>
      <View style={styles.dotRow}>
        {isBooked && <View style={styles.dotBooked} />}
        {isHoliday && <View style={styles.dotHoliday} />}
      </View>
    </Pressable>
  );
}

function MultipleSelectionList() {
  const dates = useCalendarSelectedDates<unknown>();
  const system = useCalendarSelector((s) => s.system);
  return (
    <View style={styles.tagRow}>
      {dates.length === 0 ? (
        <Text style={styles.empty}>Tap up to 5 days</Text>
      ) : (
        dates.map((d) => (
          <Badge key={String(system.toNativeDate(d as never))} tone="muted">
            {system.toNativeDate(d as never).toDateString()}
          </Badge>
        ))
      )}
    </View>
  );
}

// ===========================================================================
// 4. Bounded — minDate, maxDate, disabledDates, dynamic disabled predicate
// ===========================================================================

function BoundedExample() {
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const horizon = new Date(todayUtc + 60 * 86_400_000);

  return (
    <Card>
      <CardHeader
        title="Bounded selection"
        description="minDate=today, maxDate=+60d. Weekends disabled via predicate. Two specific dates blacklisted."
      />
      <Calendar.Root
        disabled={(d) => d.getDay() === 0 || d.getDay() === 6}
        disabledDates={[
          new Date(today.getFullYear(), today.getMonth(), 15),
          new Date(today.getFullYear(), today.getMonth() + 1, 1),
        ]}
        disabledRanges={[
          {
            start: new Date(today.getFullYear(), today.getMonth(), 25),
            end: new Date(today.getFullYear(), today.getMonth(), 27),
          },
        ]}
        maxDate={horizon}
        minDate={today}
        mode="single"
        systems={SINGLE_GREGORIAN}
        theme={SHADCN_THEME}
      >
        <CalendarShell>
          <CalendarHeader />
          <CalendarView />
          <Separator />
          <View style={styles.legendRow}>
            <Legend color={C.foreground} label="Today / selected" />
            <Legend color={C.muted} label="Weekend / OOO" />
            <Legend color={C.disabled} label="Out of bounds" />
          </View>
        </CalendarShell>
      </Calendar.Root>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// ===========================================================================
// 5. Multi-month + week numbers + Monday-first + collapsing weeks
// ===========================================================================

const MONTH_CAPTION: NonNullable<CalendarComponents['MonthCaption']> = ({
  label,
}) => (
  <View style={styles.monthCaption}>
    <Text style={styles.monthCaptionText}>{label}</Text>
  </View>
);

const WEEK_NUMBER_CELL: NonNullable<CalendarComponents['WeekNumberCell']> = ({
  weekNumber,
}) => (
  <View style={styles.weekNumberCell}>
    <Text style={styles.weekNumberLabel}>{weekNumber}</Text>
  </View>
);

function MultiMonthExample() {
  return (
    <Card>
      <CardHeader
        title="Multi-month layout"
        description="Two months side by side, ISO Monday-first, ISO week numbers, no outside days, collapsing weeks."
      />
      <Calendar.Root
        components={{
          MonthCaption: MONTH_CAPTION,
          WeekNumberCell: WEEK_NUMBER_CELL,
        }}
        firstDayOfWeek={1}
        fixedWeeks={false}
        mode="range"
        showOutsideDays={false}
        systems={SINGLE_GREGORIAN}
        theme={SHADCN_THEME}
      >
        <CalendarShell width={GRID_WIDTH_WEEKS}>
          <CalendarHeader />
        </CalendarShell>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.multiMonthScroll}
        >
          <Calendar.DayGrid numberOfMonths={2} showWeekNumbers />
        </ScrollView>
      </Calendar.Root>
    </Card>
  );
}

// ===========================================================================
// 6. Multi-system — Gregorian + Hijri with switcher and pickers.
//
//    The library ships pre-configured Hijri / Jalali systems alongside the
//    default Gregorian one. Install the optional peer dep
//    (`@tabby_ai/hijri-converter` for Hijri, `moment-jalaali` for Jalali)
//    and import the ready-to-use instance — no factory call needed. For
//    custom converters, use `createHijriSystem({ converter })` /
//    `createJalaliSystem({ converter })` from the same module.
// ===========================================================================

const MULTI_SYSTEMS: CalendarSystem[] = [gregorianSystem, hijriSystem];

function MultiSystemExample() {
  return (
    <Card>
      <CardHeader
        title="Multi-system: Gregorian + Hijri"
        description="Same store, different calendar systems. Tap the month or year label to open the picker."
      />
      <Calendar.Root
        allowSameDay
        mode="range"
        systems={MULTI_SYSTEMS}
        theme={SHADCN_THEME}
      >
        <CalendarShell>
          <SystemSwitcher />
          <CalendarHeader />
          <CalendarView />
          <ActionBar />
        </CalendarShell>
      </Calendar.Root>
    </Card>
  );
}

// ===========================================================================
// 7. Custom slots — DayCell + WeekdayHeader + WeekNumberCell
// ===========================================================================

const SquareDayCell: NonNullable<CalendarComponents['DayCell']> = ({
  info,
  onSelect,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: info.isSelected }}
    disabled={info.isDisabled}
    onPress={info.isDisabled ? undefined : () => onSelect(info.date)}
    style={[
      styles.squareCell,
      info.isToday && !info.isSelected && styles.squareCellToday,
      info.isSelected && styles.squareCellSelected,
      info.isDisabled && styles.squareCellDisabled,
    ]}
  >
    <Text
      style={[
        styles.squareCellLabel,
        info.isSelected && styles.squareCellLabelSelected,
        !info.isCurrentMonth && styles.squareCellLabelOutside,
      ]}
    >
      {info.label}
    </Text>
  </Pressable>
);

const BorderedWeekdayHeader: NonNullable<
  CalendarComponents['WeekdayHeader']
> = ({ labels }: WeekdayHeaderProps) => (
  <View style={styles.borderedWeekdayHeader}>
    {labels.map((l, i) => (
      <View
        key={l}
        style={[
          styles.borderedWeekdayCell,
          i < labels.length - 1 && styles.borderedWeekdayCellDivider,
        ]}
      >
        <Text style={styles.borderedWeekdayLabel}>{l.toUpperCase()}</Text>
      </View>
    ))}
  </View>
);

const ShoutyWeekNumberCell: NonNullable<
  CalendarComponents['WeekNumberCell']
> = ({ weekNumber }: WeekNumberCellProps) => (
  <View style={styles.shoutyWeekNumber}>
    <Text style={styles.shoutyWeekNumberText}>w{weekNumber}</Text>
  </View>
);

function CustomSlotsExample() {
  return (
    <Card>
      <CardHeader
        title="Custom component slots"
        description="WeekdayHeader, DayCell, and WeekNumberCell are all swapped via <Calendar.Root components={{ ... }}>."
      />
      <Calendar.Root
        components={{
          DayCell: SquareDayCell,
          WeekdayHeader: BorderedWeekdayHeader,
          WeekNumberCell: ShoutyWeekNumberCell,
        }}
        mode="single"
        systems={SINGLE_GREGORIAN}
        theme={SHADCN_THEME}
      >
        <CalendarShell width={GRID_WIDTH_WEEKS}>
          <CalendarHeader />
          <Calendar.DayGrid showWeekNumbers />
        </CalendarShell>
      </Calendar.Root>
    </Card>
  );
}

// ===========================================================================
// 8. Localised — French Gregorian, French labels, Monday-first
// ===========================================================================

const FRENCH_SYSTEM = createGregorianSystem({
  label: 'Grégorien',
  monthLabels: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ],
  weekdayLabels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
});

function LocalisedExample() {
  return (
    <Card>
      <CardHeader
        title="Localised — French"
        description="createGregorianSystem with French labels + Monday-first week + translated action labels."
      />
      <Calendar.Root
        firstDayOfWeek={1}
        labels={{
          confirm: 'Valider',
          clear: 'Effacer',
          prev: 'Précédent',
          next: 'Suivant',
          selectMonth: 'Choisir le mois',
          selectYear: "Choisir l'année",
        }}
        mode="single"
        systems={[FRENCH_SYSTEM]}
        theme={SHADCN_THEME}
      >
        <CalendarShell>
          <CalendarHeader />
          <CalendarView />
          <ActionBar />
        </CalendarShell>
      </Calendar.Root>
    </Card>
  );
}

// ===========================================================================
// 9. Image cells — render an image instead of the day number
// ===========================================================================

// A real consumer would ship the asset locally and `require()` it, but a
// remote URL is the simplest way to demonstrate the API. The library
// puts no constraint on what `renderDay` returns — any RN node (Image,
// SVG, video poster, …) drops in here.
const YT_LOGO_URI =
  'https://img.freepik.com/premium-vector/youtube-logo-round-button-vector_768467-361.jpg';

// Fake "video upload" schedule — kept relative to today so the example
// always shows a few highlighted cells regardless of when it's run. In
// a real app this would come from your CMS / API.
const UPLOAD_DAYS: Date[] = (() => {
  const today = new Date();
  return [0, 3, 7, 12, 18, 24, 30].map(
    (d) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + d)
  );
})();

const isUploadDay = (info: DayCellInfo): boolean =>
  UPLOAD_DAYS.some(
    (d) =>
      d.getFullYear() === info.nativeDate.getFullYear() &&
      d.getMonth() === info.nativeDate.getMonth() &&
      d.getDate() === info.nativeDate.getDate()
  );

/**
 * Per-cell renderer used by `<Calendar.DayGrid renderDay={...}>`. On
 * "upload" days we render the YouTube logo in place of the day number;
 * every other day falls back to the standard text label. Selection,
 * today indicator, and disabled state are all still honoured because we
 * read `info.isSelected / isToday / isDisabled` ourselves — the library
 * computes the flags, the consumer paints the pixels.
 */
function ImageDayCell({ info }: { info: DayCellInfo }) {
  const store = useCalendarStore();
  const onPress = () => store.selectDate(info.date);
  const showLogo = info.isCurrentMonth && isUploadDay(info);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: info.isDisabled,
        selected: info.isSelected,
      }}
      disabled={info.isDisabled}
      onPress={info.isDisabled ? undefined : onPress}
      style={[
        styles.imageCell,
        info.isToday && !info.isSelected && styles.imageCellToday,
        info.isSelected && styles.imageCellSelected,
        info.isDisabled && styles.imageCellDisabled,
      ]}
    >
      {showLogo ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: YT_LOGO_URI }}
          style={styles.imageCellLogo}
        />
      ) : (
        <Text
          style={[
            styles.imageCellLabel,
            info.isSelected && styles.imageCellLabelSelected,
            !info.isCurrentMonth && styles.imageCellLabelOutside,
          ]}
        >
          {info.label}
        </Text>
      )}
    </Pressable>
  );
}

function ImageCellExample() {
  return (
    <Card>
      <CardHeader
        title="Image cells"
        description="renderDay swaps the day number for any RN node. Here, video-upload days show a YouTube logo in place of the number while still being normally selectable."
      />
      <Calendar.Root
        mode="single"
        systems={SINGLE_GREGORIAN}
        theme={SHADCN_THEME}
      >
        <CalendarShell>
          <CalendarHeader />
          <Calendar.DayGrid
            renderDay={(info) => <ImageDayCell info={info} />}
          />
          <Separator />
          <View style={styles.imageLegendRow}>
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: YT_LOGO_URI }}
              style={styles.imageLegendDot}
            />
            <Text style={styles.legendLabel}>Video upload day</Text>
          </View>
        </CalendarShell>
      </Calendar.Root>
    </Card>
  );
}

// ===========================================================================
// Demo entry point
// ===========================================================================

const SINGLE_GREGORIAN: CalendarSystem[] = [gregorianSystem];

function nextNDates(n: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= n; i += 1) {
    out.push(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + i * 2)
    );
  }
  return out;
}

export default function CalendarDemo() {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      <View style={styles.intro}>
        <Text style={styles.introEyebrow}>react-native-fast-calendar</Text>
        <Text style={styles.introTitle}>Headless calendar, your UI</Text>
        <Text style={styles.introBody}>
          Nine self-contained recipes. Every visual in this demo is consumer
          code: the library only ships &lt;Calendar.Root&gt; and
          &lt;Calendar.DayGrid&gt;.
        </Text>
      </View>
      <SingleExample />
      <RangeExample />
      <MultipleExample />
      <BoundedExample />
      <MultiMonthExample />
      <MultiSystemExample />
      <CustomSlotsExample />
      <LocalisedExample />
      <ImageCellExample />
    </ScrollView>
  );
}

// ===========================================================================
// Styles — single StyleSheet so React Native can hoist & dedupe.
// ===========================================================================

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: C.page,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 16,
  },
  intro: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  introEyebrow: {
    color: C.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  introTitle: {
    color: C.foreground,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: -0.4,
  },
  introBody: {
    color: C.mutedForeground,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },

  // Card -----------------------------------------------------------------
  card: {
    backgroundColor: C.card,
    borderColor: C.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    color: C.foreground,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cardDescription: {
    color: C.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  separator: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },

  // Header ---------------------------------------------------------------
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  headerLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  headerLabelPressed: {
    backgroundColor: C.muted,
  },
  headerLabelText: {
    color: C.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Buttons --------------------------------------------------------------
  btn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSm: {
    height: 30,
    paddingHorizontal: 10,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  btnLabelSm: {
    fontSize: 13,
  },

  // IconButton -----------------------------------------------------------
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
  },
  iconBtnPressed: {
    backgroundColor: C.muted,
  },
  iconBtnGlyph: {
    color: C.foreground,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Action bar -----------------------------------------------------------
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
  },

  // Badges ---------------------------------------------------------------
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    alignSelf: 'flex-start',
  },
  badgeMuted: {
    backgroundColor: C.muted,
    borderColor: C.muted,
  },
  badgeInverted: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  badgeLabel: {
    color: C.foreground,
    fontSize: 12,
    fontWeight: '500',
  },
  badgeLabelInverted: {
    color: C.primaryForeground,
  },

  // Pickers --------------------------------------------------------------
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 4,
  },
  pickerCell: {
    width: '33.333%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  pickerCellPressed: {
    backgroundColor: C.muted,
  },
  pickerCellActive: {
    backgroundColor: C.primary,
  },
  pickerCellText: {
    color: C.foreground,
    fontSize: 14,
    fontWeight: '500',
  },
  pickerCellTextActive: {
    color: C.primaryForeground,
    fontWeight: '600',
  },

  // Segmented control ----------------------------------------------------
  segmented: {
    flexDirection: 'row',
    backgroundColor: C.muted,
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  segmentedItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentedItemActive: {
    backgroundColor: C.background,
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  },
  segmentedItemPressed: {
    backgroundColor: C.mutedHover,
  },
  segmentedItemLabel: {
    color: C.mutedForeground,
    fontSize: 13,
    fontWeight: '500',
  },
  segmentedItemLabelActive: {
    color: C.foreground,
    fontWeight: '600',
  },

  // Layout helpers -------------------------------------------------------
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex: {
    flex: 1,
  },

  // Range readout --------------------------------------------------------
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  rangeArrow: {
    color: C.mutedForeground,
    fontSize: 14,
  },
  rangeLabel: {
    color: C.mutedForeground,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '500',
  },
  rangeValue: {
    color: C.foreground,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },

  // DotMarkedCell --------------------------------------------------------
  dotCell: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCellLabel: {
    fontSize: 14,
  },
  dotRow: {
    position: 'absolute',
    bottom: 3,
    flexDirection: 'row',
    gap: 2,
  },
  dotBooked: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.foreground,
  },
  dotHoliday: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderStrong,
  },

  // Tag row --------------------------------------------------------------
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minHeight: 24,
    alignItems: 'center',
  },
  empty: {
    color: C.mutedForeground,
    fontSize: 13,
  },

  // Legend ---------------------------------------------------------------
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  legendLabel: {
    color: C.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
  },

  // Multi-month ----------------------------------------------------------
  multiMonthScroll: {
    marginHorizontal: -4,
  },
  monthCaption: {
    paddingVertical: 6,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: C.border,
    marginBottom: 4,
  },
  monthCaptionText: {
    color: C.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  weekNumberCell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNumberLabel: {
    color: C.mutedForeground,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },

  // CalendarShell — centers + constrains the calendar UI block to the
  // grid's natural width so headers + actions line up with the cells.
  shell: {
    alignSelf: 'center',
    gap: 12,
  },

  // Custom slots — square cell ------------------------------------------
  squareCell: {
    width: 36,
    height: 36,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
  },
  squareCellToday: {
    borderColor: C.foreground,
  },
  squareCellSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  squareCellDisabled: {
    opacity: 0.4,
  },
  squareCellLabel: {
    color: C.foreground,
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  squareCellLabelSelected: {
    color: C.primaryForeground,
    fontWeight: '600',
  },
  squareCellLabelOutside: {
    color: C.disabled,
  },

  // Custom slots — bordered weekday header -------------------------------
  borderedWeekdayHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingBottom: 4,
    marginBottom: 4,
  },
  borderedWeekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  borderedWeekdayCellDivider: {
    borderRightWidth: 1,
    borderColor: C.border,
  },
  borderedWeekdayLabel: {
    color: C.mutedForeground,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
  },

  // Custom slots — shouty week number -----------------------------------
  shoutyWeekNumber: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.muted,
    borderRadius: 4,
    margin: 2,
  },
  shoutyWeekNumberText: {
    color: C.foreground,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  subtleWeekday: {
    color: C.mutedForeground,
    fontSize: 11,
    width: 36,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Image cell ----------------------------------------------------------
  imageCell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  imageCellToday: {
    borderWidth: 1,
    borderColor: C.foreground,
  },
  imageCellSelected: {
    backgroundColor: C.primary,
  },
  imageCellDisabled: {
    opacity: 0.4,
  },
  imageCellLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    resizeMode: 'cover',
  },
  imageCellLabel: {
    fontSize: 14,
    color: C.foreground,
    fontVariant: ['tabular-nums'],
  },
  imageCellLabelSelected: {
    color: C.primaryForeground,
    fontWeight: '600',
  },
  imageCellLabelOutside: {
    color: C.disabled,
  },
  imageLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageLegendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});

const variantStyles: Record<
  ButtonVariant,
  { container: ViewStyle; pressed: ViewStyle; label: { color: string } }
> = {
  primary: {
    container: {
      backgroundColor: C.primary,
    },
    pressed: {
      backgroundColor: '#27272A', // zinc-800
    },
    label: {
      color: C.primaryForeground,
    },
  },
  secondary: {
    container: {
      backgroundColor: C.muted,
    },
    pressed: {
      backgroundColor: C.mutedHover,
    },
    label: {
      color: C.foreground,
    },
  },
  outline: {
    container: {
      backgroundColor: C.background,
      borderWidth: 1,
      borderColor: C.border,
    },
    pressed: {
      backgroundColor: C.muted,
    },
    label: {
      color: C.foreground,
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    pressed: {
      backgroundColor: C.muted,
    },
    label: {
      color: C.foreground,
    },
  },
};
