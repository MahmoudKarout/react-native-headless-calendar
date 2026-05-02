/**
 * Self-contained demo showing 4 different ways to use
 * react-native-fast-calendar.
 *
 * Each variant demonstrates a key composition pattern from the package:
 *
 *   1. PresetExample          — minimal "just give me a calendar" usage.
 *   2. MultiSystemExample     — Gregorian + Hijri with system switcher.
 *   3. ThemedExample          — design-system tokens + custom labels.
 *   4. FullyComposedExample   — header parts placed in a custom layout,
 *                               action buttons built by the consumer via
 *                               useCalendarActions(), custom day cell.
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
  useCalendarSelector,
  useCalendarStore,
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
    <View style={{ padding: 16 }}>
      <SectionTitle>1. Preset (single date)</SectionTitle>
      <Calendar.Root
        mode="single"
        onConfirm={({ date }) => setPicked(date)}
        systems={[gregorianSystem]}
      >
        <Calendar.Header />
        <Calendar.View />
        <DemoActions />
      </Calendar.Root>
      <Text style={{ marginTop: 8 }}>
        Selected: {picked?.toDateString() ?? 'none'}
      </Text>
    </View>
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
        <Calendar.SystemSwitcher />
        <Calendar.Header />
        <Calendar.View />
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
      <SectionTitle>3. Custom theme + French labels</SectionTitle>
      <Calendar.Root
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
        <Calendar.Header />
        <Calendar.View />
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 8,
          }}
        >
          <View>
            <Calendar.Header.MonthLabel />
            <Calendar.Header.YearLabel />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Calendar.Header.PrevButton />
            <Calendar.Header.NextButton />
          </View>
        </View>

        {/* Custom day-cell renderer */}
        <Calendar.View renderDay={(info) => <CustomDayCell info={info} />} />

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

// ===========================================================================
// Helpers
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
    <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
      <PresetExample />
      <MultiSystemExample />
      <ThemedExample />
      <FullyComposedExample />
    </ScrollView>
  );
}
