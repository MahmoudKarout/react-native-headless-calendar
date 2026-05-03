/**
 * Self-contained demo showing 4 different ways to use
 * react-native-fast-calendar.
 *
 * The library is **headless** beyond `<Calendar.Root>` and
 * `<Calendar.DayGrid>` — every other piece of UI is built by the consumer
 * using the `useCalendar*` hooks. The four examples below show different
 * shapes that composition can take.
 *
 *   1. PresetExample          — minimal "just give me a calendar" usage
 *                               using the helper components defined right
 *                               in this file.
 *   2. MultiSystemExample     — Gregorian + Hijri with a custom segmented
 *                               system switcher built from
 *                               `useCalendarSystemSwitcher`.
 *   3. ThemedExample          — design-system tokens + custom labels.
 *   4. FullyComposedExample   — header parts placed in a custom layout,
 *                               custom day cell, custom month + year
 *                               pickers, "Today" shortcut.
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// Hijri converter is brought in by the consumer (see #2 below) — the
// calendar package itself has no converter dependency.
import * as hijriConverter from '@tabby_ai/hijri-converter';

import {
  Calendar,
  useCalendarActions,
  useCalendarLabels,
  useCalendarMonthLabel,
  useCalendarMonthPicker,
  useCalendarNavigation,
  useCalendarSelector,
  useCalendarStore,
  useCalendarSystemSwitcher,
  useCalendarYearLabel,
  useCalendarYearPicker,
  type CalendarSystem,
  type DayCellInfo,
} from 'react-native-fast-calendar';
import { createHijriSystem } from 'react-native-fast-calendar/systems/hijri';
import {
  createGregorianSystem,
  gregorianSystem,
} from 'react-native-fast-calendar/systems/gregorian';

// ===========================================================================
// 1. Preset — the simplest possible usage
// ===========================================================================

function PresetExample() {
  const [picked, setPicked] = useState<Date | undefined>();

  return (
    <>
      <SectionTitle>1. Preset (single date, swipeable)</SectionTitle>
      <Calendar.Root
        mode="single"
        onConfirm={({ date }) => setPicked(date)}
        systems={[gregorianSystem]}
      >
        <DemoHeader />
        {/* Swipe horizontally on the day grid to step between months. */}
        <DemoView swipeable />
        <DemoActions />
      </Calendar.Root>
      <Text style={{ marginTop: 8 }}>
        Selected: {picked?.toDateString() ?? 'none'}
      </Text>
    </>
  );
}

// ===========================================================================
// 2. Multi-system (Gregorian + Hijri) with range selection
// ===========================================================================

// Build the Hijri system once with the consumer-supplied converter.
// Forgetting `converter` throws a clear error pointing at the README.
const MULTI_SYSTEMS: CalendarSystem[] = [
  gregorianSystem,
  createHijriSystem({ converter: hijriConverter }),
];

function MultiSystemExample() {
  const [range, setRange] = useState<{ start?: Date; end?: Date }>({});

  return (
    <View style={{ padding: 16 }}>
      <SectionTitle>2. Gregorian + Hijri, range mode</SectionTitle>
      <Calendar.Root
        onConfirm={({ startDate, endDate }) =>
          setRange({ start: startDate, end: endDate })
        }
        mode="range"
        systems={MULTI_SYSTEMS}
        allowSameDay
      >
        <DemoSystemSwitcher />
        <DemoHeader />
        <DemoView />
        <DemoActions />
      </Calendar.Root>
      <Text style={{ marginTop: 8 }}>
        Range: {range.start?.toDateString() ?? '—'} →{' '}
        {range.end?.toDateString() ?? '—'}
      </Text>
    </View>
  );
}

// ===========================================================================
// 3. Custom theme + localised labels (French Gregorian)
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

function ThemedExample() {
  return (
    <View style={{ padding: 16 }}>
      <SectionTitle>
        3. Custom theme + French labels (Monday-first)
      </SectionTitle>
      <Calendar.Root
        // French calendars start the week on Monday — pass `firstDayOfWeek={1}`
        // and the day grid + weekday header rotate accordingly.
        firstDayOfWeek={1}
        labels={{
          confirm: 'Valider',
          clear: 'Effacer',
          prev: 'Précédent',
          next: 'Suivant',
          selectMonth: 'Choisir le mois',
          selectYear: "Choisir l'année",
        }}
        theme={{
          colors: {
            primary: '#FF6F00',
            onPrimary: '#FFFFFF',
            rangeBackground: '#FFE0B2',
            todayBorder: '#FF6F00',
          },
          cellSize: 44,
          borderRadius: 8,
        }}
        mode="single"
        systems={[FRENCH_SYSTEM]}
      >
        <DemoHeader />
        <DemoView />
        <DemoActions />
      </Calendar.Root>
    </View>
  );
}

// ===========================================================================
// 4. Fully composed — header parts split, custom day cell, today shortcut
//    living OUTSIDE the calendar grid (still inside <Calendar.Root>).
// ===========================================================================

function CustomDayCell({ info }: { info: DayCellInfo }) {
  const store = useCalendarStore();
  const onPress = () => store.selectDate(info.date);

  return (
    <View
      style={{
        width: 40,
        height: 40,
        margin: 2,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: info.isSelected
          ? '#0EA5E9'
          : info.inRange
            ? '#E0F2FE'
            : 'transparent',
        borderWidth: info.isToday ? 2 : 0,
        borderColor: '#0EA5E9',
        opacity: info.isDisabled ? 0.3 : 1,
      }}
      onTouchEnd={info.isDisabled ? undefined : onPress}
    >
      <Text
        style={{
          color: info.isSelected
            ? '#FFFFFF'
            : info.isCurrentMonth
              ? '#0F172A'
              : '#94A3B8',
          fontWeight: info.isToday ? '700' : '500',
        }}
      >
        {info.label}
      </Text>
    </View>
  );
}

function TodayShortcut() {
  const store = useCalendarStore();
  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#E0F2FE',
        alignSelf: 'flex-start',
      }}
      onTouchEnd={() => store.selectDate(store.getSnapshot().system.today())}
    >
      <Text style={{ color: '#0369A1', fontWeight: '600' }}>Today</Text>
    </View>
  );
}

function SelectionPreview() {
  const date = useCalendarSelector((s) => s.selectedDate);
  const system = useCalendarSelector((s) => s.system);
  return (
    <Text style={{ color: '#0369A1' }}>
      {date
        ? `Picked ${system.formatMonthYear(date)} ${system.day(date)}`
        : 'Tap a date'}
    </Text>
  );
}

function FullyComposedExample() {
  return (
    <View style={{ padding: 16 }}>
      <SectionTitle>4. Fully composed (custom layout + cell)</SectionTitle>
      <Calendar.Root mode="single" systems={[gregorianSystem]}>
        {/* Custom header layout — month/year stacked, arrows on the right */}
        <CustomStackedHeader />

        {/* Custom view switching — DayGrid stays as the only built-in
            renderer, the month/year grids are entirely consumer code. */}
        <DemoView renderDay={(info) => <CustomDayCell info={info} />} />

        {/* Custom UI that participates in calendar state, but lives
            OUTSIDE the calendar grid */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
          }}
        >
          <TodayShortcut />
          <SelectionPreview />
        </View>

        {/* Action buttons built by the consumer — they still drive the store
            because they live inside <Calendar.Root>. */}
        <DemoActions />
      </Calendar.Root>
    </View>
  );
}

function CustomStackedHeader() {
  const monthLabel = useCalendarMonthLabel();
  const yearLabel = useCalendarYearLabel();
  const { goPrev, goNext } = useCalendarNavigation();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
      }}
    >
      <View>
        {monthLabel.isVisible && (
          <Pressable onPress={monthLabel.toggle}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>
              {monthLabel.label}
            </Text>
          </Pressable>
        )}
        <Pressable onPress={yearLabel.toggle}>
          <Text style={{ fontSize: 14, color: '#475569' }}>
            {yearLabel.label}
          </Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chevron direction="left" onPress={goPrev} />
        <Chevron direction="right" onPress={goNext} />
      </View>
    </View>
  );
}

// ===========================================================================
// Helpers — these used to be packaged components. Now they are recipe
// snippets a consumer would copy/customise for their own design system.
// ===========================================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
        color: '#0F172A',
      }}
    >
      {children}
    </Text>
  );
}

/**
 * Tiny chevron drawn with two diagonal Views — replaces the icon primitive
 * the library used to ship. Consumers are expected to use whatever icon
 * library they already depend on.
 */
function Chevron({
  direction,
  onPress,
}: {
  direction: 'left' | 'right';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#1F6FEB', fontSize: 18, fontWeight: '700' }}>
        {direction === 'left' ? '‹' : '›'}
      </Text>
    </Pressable>
  );
}

/**
 * Default header — month label + year label on the left, two chevrons on
 * the right. Built entirely from hooks; nothing in here is shipped by the
 * library.
 */
function DemoHeader() {
  const monthLabel = useCalendarMonthLabel();
  const yearLabel = useCalendarYearLabel();
  const { goPrev, goNext } = useCalendarNavigation();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {monthLabel.isVisible && (
          <Pressable onPress={monthLabel.toggle}>
            <Text style={{ color: '#1F6FEB', fontSize: 16, fontWeight: '600' }}>
              {monthLabel.label}
            </Text>
          </Pressable>
        )}
        <Pressable onPress={yearLabel.toggle}>
          <Text style={{ color: '#1F6FEB', fontSize: 16, fontWeight: '600' }}>
            {yearLabel.label}
          </Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Chevron direction="left" onPress={goPrev} />
        <Chevron direction="right" onPress={goNext} />
      </View>
    </View>
  );
}

/**
 * Switches between the day grid (built-in), a consumer-built month
 * picker, and a consumer-built year picker — driven by the active
 * `view` slice of the store. `swipeable` turns on horizontal swipe
 * navigation between months — composes with the arrow buttons in
 * `DemoHeader` because both go through `store.changeMonth`.
 */
function DemoView({
  renderDay,
  swipeable,
}: {
  renderDay?: (info: DayCellInfo) => React.ReactNode;
  swipeable?: boolean;
}) {
  const view = useCalendarSelector((s) => s.view);
  if (view === 'day')
    return <Calendar.DayGrid renderDay={renderDay} swipeable={swipeable} />;
  if (view === 'month') return <DemoMonthPicker />;
  return <DemoYearPicker />;
}

/**
 * 4×3 grid of months — example consumer code built on
 * `useCalendarMonthPicker`.
 */
function DemoMonthPicker() {
  const { months, activeMonth, selectMonth } = useCalendarMonthPicker();
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 8 }}
    >
      {months.map((m) => {
        const isActive = m.index === activeMonth;
        return (
          <Pressable
            key={m.index}
            onPress={() => selectMonth(m.index)}
            style={{
              width: '33.3333%',
              paddingVertical: 12,
              alignItems: 'center',
              borderRadius: 8,
              backgroundColor: isActive ? '#1F6FEB' : 'transparent',
            }}
          >
            <Text
              style={{
                color: isActive ? '#FFFFFF' : '#0F172A',
                fontWeight: isActive ? '600' : '500',
              }}
            >
              {m.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * 4×3 grid of years — example consumer code built on
 * `useCalendarYearPicker`.
 */
function DemoYearPicker() {
  const { years, activeYear, selectYear } = useCalendarYearPicker();
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 8 }}
    >
      {years.map((y) => {
        const isActive = y === activeYear;
        return (
          <Pressable
            key={y}
            onPress={() => selectYear(y)}
            style={{
              width: '33.3333%',
              paddingVertical: 12,
              alignItems: 'center',
              borderRadius: 8,
              backgroundColor: isActive ? '#1F6FEB' : 'transparent',
            }}
          >
            <Text
              style={{
                color: isActive ? '#FFFFFF' : '#0F172A',
                fontWeight: isActive ? '600' : '500',
              }}
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
 * Pill-style segmented control built on `useCalendarSystemSwitcher`.
 */
function DemoSystemSwitcher() {
  const { systems, activeId, setActive } = useCalendarSystemSwitcher();
  if (systems.length < 2) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        padding: 4,
        marginBottom: 8,
      }}
    >
      {systems.map((s) => {
        const isActive = s.id === activeId;
        return (
          <Pressable
            key={s.id}
            onPress={() => setActive(s.id)}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: 'center',
              borderRadius: 6,
              backgroundColor: isActive ? '#FFFFFF' : 'transparent',
            }}
          >
            <Text
              style={{
                color: isActive ? '#1F6FEB' : '#0F172A',
                fontWeight: isActive ? '600' : '500',
              }}
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
 * The package no longer ships <Calendar.Actions /> — confirm/clear are
 * exposed as plain functions so the consumer brings their own buttons.
 * This little helper is a typical recipe.
 */
function DemoActions() {
  const { confirm, clear, canConfirm } = useCalendarActions();
  const labels = useCalendarLabels();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
      }}
    >
      <Pressable
        onPress={clear}
        style={{
          flex: 1,
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#CBD5E1',
        }}
      >
        <Text style={{ color: '#0F172A', fontWeight: '600' }}>
          {labels.clear}
        </Text>
      </Pressable>
      <Pressable
        disabled={!canConfirm}
        onPress={confirm}
        style={{
          flex: 1,
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: 'center',
          backgroundColor: canConfirm ? '#0EA5E9' : '#94A3B8',
          opacity: canConfirm ? 1 : 0.7,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
          {labels.confirm}
        </Text>
      </Pressable>
    </View>
  );
}

// ===========================================================================
// Demo entry point
// ===========================================================================

export default function CalendarDemo() {
  return (
    <ScrollView>
      <PresetExample />
      <MultiSystemExample />
      <ThemedExample />
      <FullyComposedExample />
    </ScrollView>
  );
}
