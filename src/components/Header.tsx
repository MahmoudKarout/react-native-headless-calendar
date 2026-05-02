/**
 * Calendar.Header — composable navigation row.
 *
 * Two ways to use it:
 *
 *   1. The all-in-one preset — adds prev arrow, month label, year label,
 *      next arrow, in that order:
 *
 *      <Calendar.Header />
 *
 *   2. The compound form — pick the parts you want, place them anywhere:
 *
 *      <Calendar.Header.Root>
 *        <Calendar.Header.PrevButton />
 *        <Calendar.Header.MonthLabel />
 *        <Calendar.Header.YearLabel />
 *        <Calendar.Header.NextButton />
 *      </Calendar.Header.Root>
 */
import React, { memo, useCallback, type ReactNode } from 'react';
import { I18nManager } from 'react-native';

import {
  useCalendarConfig,
  useCalendarLabels,
  useCalendarPrimitives,
  useCalendarSelector,
  useCalendarStore,
  useCalendarTheme,
} from '../context';
import { YEAR_PAGE_SIZE, getYearPage } from '../utils/grid';

// ---------------------------------------------------------------------------
// Header.Root — the layout container only. Children compose freely.
// ---------------------------------------------------------------------------

const HeaderRoot: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { View } = useCalendarPrimitives();
  const theme = useCalendarTheme();
  const { testID } = useCalendarConfig();

  return (
    <View
      accessibilityRole="header"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
      }}
      testID={testID ? `${testID}.calendar.header` : undefined}
    >
      {children}
    </View>
  );
};
HeaderRoot.displayName = 'Calendar.Header.Root';

// ---------------------------------------------------------------------------
// Header.PrevButton / Header.NextButton — RTL-aware step controls.
// ---------------------------------------------------------------------------

export interface ArrowProps {
  /** Override the default chevron icon. */
  children?: ReactNode;
}

const PrevButtonComponent: React.FC<ArrowProps> = ({ children }) => {
  const { Pressable, Icon } = useCalendarPrimitives();
  const labels = useCalendarLabels();
  const theme = useCalendarTheme();
  const store = useCalendarStore();
  const { testID } = useCalendarConfig();

  const onPress = useCallback(() => {
    const s = store.getSnapshot();
    const step = I18nManager.isRTL ? 1 : -1;
    if (s.view === 'day') store.changeMonth(step);
    else if (s.view === 'month') store.changeYear(step);
    else store.changeYear(step * YEAR_PAGE_SIZE);
  }, [store]);

  return (
    <Pressable
      accessibilityLabel={labels.prev}
      accessibilityRole="button"
      onPress={onPress}
      style={{ padding: theme.spacing.sm }}
      testID={testID ? `${testID}.calendar.prev` : undefined}
    >
      {children ?? <Icon color={theme.colors.primary} name="prev" size={18} />}
    </Pressable>
  );
};
const PrevButton = memo(PrevButtonComponent);
PrevButton.displayName = 'Calendar.Header.PrevButton';

const NextButtonComponent: React.FC<ArrowProps> = ({ children }) => {
  const { Pressable, Icon } = useCalendarPrimitives();
  const labels = useCalendarLabels();
  const theme = useCalendarTheme();
  const store = useCalendarStore();
  const { testID } = useCalendarConfig();

  const onPress = useCallback(() => {
    const s = store.getSnapshot();
    const step = I18nManager.isRTL ? -1 : 1;
    if (s.view === 'day') store.changeMonth(step);
    else if (s.view === 'month') store.changeYear(step);
    else store.changeYear(step * YEAR_PAGE_SIZE);
  }, [store]);

  return (
    <Pressable
      accessibilityLabel={labels.next}
      accessibilityRole="button"
      onPress={onPress}
      style={{ padding: theme.spacing.sm }}
      testID={testID ? `${testID}.calendar.next` : undefined}
    >
      {children ?? <Icon color={theme.colors.primary} name="next" size={18} />}
    </Pressable>
  );
};
const NextButton = memo(NextButtonComponent);
NextButton.displayName = 'Calendar.Header.NextButton';

// ---------------------------------------------------------------------------
// Header.MonthLabel — month name button. Tapping switches to month-grid.
// Hidden when the year-grid is showing.
// ---------------------------------------------------------------------------

const MonthLabelComponent: React.FC = () => {
  const { Pressable, Text } = useCalendarPrimitives();
  const theme = useCalendarTheme();
  const labels = useCalendarLabels();
  const store = useCalendarStore();
  const { testID } = useCalendarConfig();

  const view = useCalendarSelector((s) => s.view);
  // Computed selector returns a STABLE STRING within the same month.
  // Tapping a date doesn't re-render this component.
  const monthText = useCalendarSelector(
    (s) => s.system.monthLabels()[s.system.month(s.displayed)] ?? ''
  );

  const onPress = useCallback(() => {
    const s = store.getSnapshot();
    store.setView(s.view === 'month' ? 'day' : 'month');
  }, [store]);

  if (view === 'year') return null;

  return (
    <Pressable
      accessibilityLabel={`${labels.selectMonth}, ${monthText}`}
      accessibilityRole="button"
      onPress={onPress}
      style={{
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }}
      testID={testID ? `${testID}.calendar.month` : undefined}
    >
      <Text
        style={{
          color: theme.colors.primary,
          fontSize: theme.fontSize.header,
          fontWeight: '600',
        }}
      >
        {monthText}
      </Text>
    </Pressable>
  );
};
const MonthLabel = memo(MonthLabelComponent);
MonthLabel.displayName = 'Calendar.Header.MonthLabel';

// ---------------------------------------------------------------------------
// Header.YearLabel — year (or "2020 - 2031" range) button. Tapping switches
// to year-grid.
// ---------------------------------------------------------------------------

const YearLabelComponent: React.FC = () => {
  const { Pressable, Text } = useCalendarPrimitives();
  const theme = useCalendarTheme();
  const labels = useCalendarLabels();
  const store = useCalendarStore();
  const { testID } = useCalendarConfig();

  const view = useCalendarSelector((s) => s.view);
  const currentYear = useCalendarSelector((s) => s.system.year(s.displayed));

  const text =
    view === 'year'
      ? (() => {
          const page = getYearPage(currentYear);
          return `${page[0]} - ${page[page.length - 1]}`;
        })()
      : String(currentYear);

  const onPress = useCallback(() => {
    const s = store.getSnapshot();
    store.setView(s.view === 'year' ? 'day' : 'year');
  }, [store]);

  return (
    <Pressable
      accessibilityLabel={`${labels.selectYear}, ${text}`}
      accessibilityRole="button"
      onPress={onPress}
      style={{
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }}
      testID={testID ? `${testID}.calendar.year` : undefined}
    >
      <Text
        style={{
          color: theme.colors.primary,
          fontSize: theme.fontSize.header,
          fontWeight: '600',
        }}
      >
        {text}
      </Text>
    </Pressable>
  );
};
const YearLabel = memo(YearLabelComponent);
YearLabel.displayName = 'Calendar.Header.YearLabel';

// ---------------------------------------------------------------------------
// Header — preset that composes the most common layout.
// ---------------------------------------------------------------------------

const HeaderPresetComponent: React.FC = () => {
  const { View } = useCalendarPrimitives();

  return (
    <HeaderRoot>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <MonthLabel />
        <YearLabel />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <PrevButton />
        <NextButton />
      </View>
    </HeaderRoot>
  );
};
const HeaderPreset = memo(HeaderPresetComponent);
HeaderPreset.displayName = 'Calendar.Header';

// Attach the compound parts as static members of the preset. Consumers can
// either render <Calendar.Header /> or compose with the parts directly.
export const Header = Object.assign(HeaderPreset, {
  Root: HeaderRoot,
  PrevButton,
  NextButton,
  MonthLabel,
  YearLabel,
});
