# Bottom-Sheet Date Pickers

A `@gorhom/bottom-sheet` integration for date pickers that slide up from the bottom — the most common modal date-picker pattern on mobile. Two variants:

1. [Single date — headless `<Calendar.Root>`](#single-date--headless-calendarroot) — for full control over header / footer.
2. [Range — `<SimpleCalendar>`](#range--simplecalendar) — when you don't need custom UI inside the sheet.

## Setup

Peer dependencies (in addition to `react-native-fast-calendar`):

```bash
# pick the install command that matches the user's package manager
yarn add @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
```

Required app-level setup (one-time):

1. Wrap the root with `GestureHandlerRootView`:

   ```tsx
   import { GestureHandlerRootView } from 'react-native-gesture-handler';

   export default function App() {
     return (
       <GestureHandlerRootView style={{ flex: 1 }}>
         {/* …screens… */}
       </GestureHandlerRootView>
     );
   }
   ```

2. Add Reanimated's babel plugin to `babel.config.js`:

   ```js
   module.exports = {
     presets: ['module:metro-react-native-babel-preset'],
     plugins: ['react-native-reanimated/plugin'],
   };
   ```

3. Wrap the screen that uses the picker with `BottomSheetModalProvider`:

   ```tsx
   import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

   <BottomSheetModalProvider>
     {/* screen content */}
   </BottomSheetModalProvider>
   ```

## Single date — headless `<Calendar.Root>`

When the sheet needs custom header / footer (e.g. dark theme that matches the host app, language-specific labels, dismiss-on-confirm). Render `<Calendar.Root>` inside the sheet so children share the store.

```tsx
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {
  Calendar,
  useCalendarActions,
  useCalendarConfig,
  useCalendarHeader,
  useCalendarMonthPicker,
  useCalendarSelector,
  useCalendarTheme,
  useCalendarYearPicker,
  type CalendarThemeOverride,
} from 'react-native-fast-calendar';

const SHEET_THEME: CalendarThemeOverride = {
  colors: {
    background: '#27272A',  // zinc-800 — match sheet card
    primary:    '#60A5FA',  // blue-400
    onPrimary:  '#18181B',
    text:       '#FAFAFA',
    textMuted:  '#A1A1AA',
    todayBorder:'#60A5FA',
    rangeBackground: '#1E3A8A',
    disabled:   '#52525B',
    border:     '#3F3F46',
  },
  cellSize: 40,
  borderRadius: 8,
};

export interface SingleDatePickerRef {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  onSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  initialDate?: Date;
}

export const SingleDatePickerSheet = forwardRef<SingleDatePickerRef, Props>(
  ({ onSelect, minDate, maxDate, initialDate }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleConfirm = useCallback(
      ({ date }: { date?: Date }) => {
        if (date) {
          onSelect(date);
          sheetRef.current?.dismiss();
        }
      },
      [onSelect],
    );

    const renderBackdrop = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#27272A' }}
        handleIndicatorStyle={{ backgroundColor: '#3F3F46', width: 40 }}
        enablePanDownToClose
      >
        <BottomSheetView style={s.content}>
          <Text style={s.title}>Select Date</Text>

          {/*
            Render Calendar.Root inside the sheet so MinimalHeader,
            CalendarBody, CompactFooter — all called as siblings — share
            the same store. SimpleCalendar wouldn't allow that, because
            it owns its own Root internally.
          */}
          <Calendar.Root
            mode="single"
            theme={SHEET_THEME}
            minDate={minDate}
            maxDate={maxDate}
            initialDate={initialDate}
            onConfirm={handleConfirm}
          >
            <View style={s.calendarBlock}>
              <MinimalHeader />
              <CalendarBody />
              <CompactFooter onConfirm={() => sheetRef.current?.dismiss()} />
            </View>
          </Calendar.Root>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

SingleDatePickerSheet.displayName = 'SingleDatePickerSheet';

// ---------------------------------------------------------------------------
// Headless pieces — must be rendered inside <Calendar.Root>.
// ---------------------------------------------------------------------------

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
    <View style={s.headerRow}>
      <View style={s.headerLabels}>
        {isMonthVisible && (
          <Pressable onPress={toggleMonthPicker} style={s.headerLabelBtn}>
            <Text style={[s.headerLabel, { color: theme.colors.text }]}>{monthLabel}</Text>
          </Pressable>
        )}
        <Pressable onPress={toggleYearPicker} style={s.headerLabelBtn}>
          <Text style={[s.headerLabel, { color: theme.colors.text }]}>{yearLabel}</Text>
        </Pressable>
      </View>
      <View style={s.headerNav}>
        <Pressable onPress={goPrev} style={[s.navBtn, { backgroundColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.text, fontSize: 20 }}>‹</Text>
        </Pressable>
        <Pressable onPress={goNext} style={[s.navBtn, { backgroundColor: theme.colors.border }]}>
          <Text style={{ color: theme.colors.text, fontSize: 20 }}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CalendarBody() {
  const view = useCalendarSelector((s) => s.view);
  if (view === 'day')   return <Calendar.DayGrid swipeable />;
  if (view === 'month') return <MonthPickerGrid />;
  return <YearPickerGrid />;
}

function MonthPickerGrid() {
  const theme = useCalendarTheme();
  const { months, activeMonth, selectMonth } = useCalendarMonthPicker();
  return (
    <View style={s.pickerGrid}>
      {months.map((m) => (
        <Pressable
          key={m.index}
          onPress={() => selectMonth(m.index)}
          style={[
            s.pickerCell,
            m.index === activeMonth && { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={{ color: m.index === activeMonth ? theme.colors.onPrimary : theme.colors.text }}>
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
    <View style={s.pickerGrid}>
      {years.map((y) => (
        <Pressable
          key={y}
          onPress={() => selectYear(y)}
          style={[
            s.pickerCell,
            y === activeYear && { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={{ color: y === activeYear ? theme.colors.onPrimary : theme.colors.text }}>
            {y}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function CompactFooter({ onConfirm }: { onConfirm: () => void }) {
  const { confirm, clear } = useCalendarActions();
  const canConfirm = useCalendarSelector(selectCanConfirm);
  const { labels } = useCalendarConfig();
  const theme = useCalendarTheme();

  const handleConfirm = useCallback(() => {
    confirm();      // fires the Root's onConfirm → onSelect(date) → dismiss
    onConfirm();    // belt-and-braces dismiss in case parent wired a no-op handler
  }, [confirm, onConfirm]);

  return (
    <View style={[s.footer, { borderTopColor: theme.colors.border }]}>
      <Pressable onPress={clear} style={s.footerBtn}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 16 }}>{labels.clear}</Text>
      </Pressable>
      <Pressable
        disabled={!canConfirm}
        onPress={handleConfirm}
        style={[
          s.confirmBtn,
          { backgroundColor: theme.colors.primary },
          !canConfirm && { opacity: 0.5 },
        ]}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 16, fontWeight: '600' }}>
          {labels.confirm}
        </Text>
      </Pressable>
    </View>
  );
}
```

Usage:

```tsx
import { useRef, useState } from 'react';

const sheetRef = useRef<SingleDatePickerRef>(null);
const [date, setDate] = useState<Date | null>(null);

<Pressable onPress={() => sheetRef.current?.present()}>
  <Text>{date ? date.toLocaleDateString() : 'Select Date'}</Text>
</Pressable>

<SingleDatePickerSheet
  ref={sheetRef}
  onSelect={setDate}
  minDate={new Date()}
  maxDate={new Date(Date.now() + 365 * 86_400_000)}
  initialDate={date ?? undefined}
/>
```

## Range — `<SimpleCalendar>`

When the sheet just needs a stock calendar without sibling components reading its store. `<SimpleCalendar>` already wires up header + grid + footer.

```tsx
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { SimpleCalendar, type CalendarThemeOverride } from 'react-native-fast-calendar';

export interface RangeDatePickerRef {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  onSelect: (start: Date, end: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  maxRangeDays?: number;
}

const SHEET_THEME: CalendarThemeOverride = {
  /* same SHEET_THEME as the single-date variant */
};

export const RangeDatePickerSheet = forwardRef<RangeDatePickerRef, Props>(
  ({ onSelect, minDate, maxDate, maxRangeDays }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleConfirm = useCallback(
      ({ startDate, endDate }: { startDate?: Date; endDate?: Date }) => {
        if (startDate && endDate) {
          onSelect(startDate, endDate);
          sheetRef.current?.dismiss();
        }
      },
      [onSelect],
    );

    const renderBackdrop = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#27272A' }}
        handleIndicatorStyle={{ backgroundColor: '#3F3F46', width: 40 }}
        enablePanDownToClose
      >
        <BottomSheetView style={s.content}>
          <Text style={s.title}>Select Date Range</Text>
          <View style={{ alignItems: 'center' }}>
            <SimpleCalendar
              mode="range"
              theme={SHEET_THEME}
              minDate={minDate}
              maxDate={maxDate}
              maxRangeDays={maxRangeDays}
              onConfirm={handleConfirm}
              showHeader
              showFooter
              swipeable
              // BottomSheetView already provides padding; SimpleCalendar's
              // default outer padding doubles it and pushes the grid off-centre.
              style={{ padding: 0 }}
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

RangeDatePickerSheet.displayName = 'RangeDatePickerSheet';
```

## Why headless vs `SimpleCalendar`?

Use **headless `<Calendar.Root>`** when:
- The sheet needs a custom header (e.g. small chevrons in a corner).
- The footer should look different from `SimpleCalendar`'s default.
- You want the confirm action to dismiss the sheet (the headless recipe wires both `confirm()` and the `onConfirm` callback's dismiss).
- You're rendering extra UI (a search bar, a "presets" button) next to the calendar that needs to read the store via hooks.

Use **`<SimpleCalendar>`** when:
- You just need a calendar in a sheet, no surrounding chrome.
- You don't need to read selection state from outside the calendar component.

You can't mix them: `SimpleCalendar` renders its own `<Calendar.Root>` internally, so any `useCalendar*` hook called as a sibling of `SimpleCalendar` will throw.

## Common pitfalls

- **Sheet is invisible / app crashes on open.** `GestureHandlerRootView` is missing or the Reanimated babel plugin isn't installed. Both are hard requirements.
- **Backdrop doesn't respond to taps.** `pressBehavior="close"` enables tap-to-dismiss. Without it, taps fall through.
- **Grid clipped by the sheet.** `enableDynamicSizing` lets the sheet auto-size to content. If you need a fixed snap point, pass `snapPoints={['60%', '85%']}` and remove `enableDynamicSizing`.
- **Theme mismatch.** Set `SHEET_THEME.colors.background` to the sheet's `backgroundStyle.backgroundColor` so the calendar blends in. Otherwise the grid floats on top of a different-colored card.
- **`SimpleCalendar` double-padding.** Pass `style={{ padding: 0 }}` because `BottomSheetView` already supplies padding.

## Stylesheet

```tsx
const s = StyleSheet.create({
  content:        { flex: 1, padding: 16 },
  title:          { fontSize: 20, fontWeight: '700', color: '#FAFAFA', marginBottom: 16, textAlign: 'center' },
  calendarBlock:  { alignItems: 'center', paddingVertical: 8 },

  // Header
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 8, marginBottom: 12 },
  headerLabels:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLabelBtn: { paddingVertical: 4 },
  headerLabel:    { fontSize: 16, fontWeight: '600' },
  headerNav:      { flexDirection: 'row', gap: 8 },
  navBtn:         { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },

  // Pickers
  pickerGrid:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingVertical: 16, width: 280 },
  pickerCell:     { width: 64, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },

  // Footer
  footer:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, alignSelf: 'stretch' },
  footerBtn:      { paddingVertical: 12, paddingHorizontal: 16 },
  confirmBtn:     { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
});
```
