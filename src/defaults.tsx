/**
 * Default primitives, theme tokens, and labels.
 *
 * Everything here is overridable via <Calendar.Root>'s props. The defaults
 * use raw RN primitives so the package has no design-system dependencies.
 */
import React, { forwardRef, type ComponentRef } from 'react';
import {
  Pressable as RNPressable,
  Text as RNText,
  View as RNView,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from 'react-native';

import type {
  CalendarLabels,
  CalendarPrimitives,
  CalendarTheme,
  IconProps,
} from './types';

// ---------------------------------------------------------------------------
// Default primitives — paper-thin wrappers around RN. Forward refs so that
// consumers replacing them with animated/measured variants don't lose the
// ref API.
//
// We use `ComponentRef<typeof X>` rather than `X` itself because the
// `react-native-strict-api` types expose ref instances as
// `ReactNativeElement`, not the legacy class component type.
// ---------------------------------------------------------------------------

const DefaultView = forwardRef<ComponentRef<typeof RNView>, ViewProps>(
  (props, ref) => <RNView ref={ref} {...props} />
);
DefaultView.displayName = 'Calendar.DefaultView';

const DefaultText = forwardRef<ComponentRef<typeof RNText>, TextProps>(
  (props, ref) => <RNText ref={ref} {...props} />
);
DefaultText.displayName = 'Calendar.DefaultText';

const DefaultPressable = forwardRef<
  ComponentRef<typeof RNPressable>,
  PressableProps
>((props, ref) => <RNPressable ref={ref} {...props} />);
DefaultPressable.displayName = 'Calendar.DefaultPressable';

/**
 * Tiny chevron icon drawn with two diagonal Views — no SVG dependency.
 * Replace via <Calendar.Root primitives={{ Icon: MyIcon }}> for anything
 * fancier (vector-icons, react-native-svg, etc).
 */
const DefaultIcon: React.FC<IconProps> = ({
  name,
  size = 16,
  color = '#0A0A0A',
  style,
}) => {
  const stroke = Math.max(1.5, size / 10);
  const half = size / 2;
  const armSize = size * 0.45;
  const offset = (size - armSize) / 2;

  return (
    <RNView
      accessible={false}
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <RNView
        style={{
          position: 'absolute',
          left: name === 'next' ? half - armSize / 2 - offset / 2 : offset,
          top: half - stroke / 2 - armSize / 2.4,
          width: armSize,
          height: stroke,
          backgroundColor: color,
          transform: [{ rotate: name === 'next' ? '45deg' : '-45deg' }],
        }}
      />
      <RNView
        style={{
          position: 'absolute',
          left: name === 'next' ? half - armSize / 2 - offset / 2 : offset,
          top: half - stroke / 2 + armSize / 2.4,
          width: armSize,
          height: stroke,
          backgroundColor: color,
          transform: [{ rotate: name === 'next' ? '-45deg' : '45deg' }],
        }}
      />
    </RNView>
  );
};

export const defaultPrimitives: CalendarPrimitives = {
  View: DefaultView as CalendarPrimitives['View'],
  Text: DefaultText as CalendarPrimitives['Text'],
  Pressable: DefaultPressable as CalendarPrimitives['Pressable'],
  Icon: DefaultIcon,
};

// ---------------------------------------------------------------------------
// Default theme — neutral, light. Override via <Calendar.Root theme={...}>.
// ---------------------------------------------------------------------------

export const defaultTheme: CalendarTheme = {
  colors: {
    background: '#FFFFFF',
    primary: '#1F6FEB',
    onPrimary: '#FFFFFF',
    text: '#0A0A0A',
    textMuted: '#6B7280',
    todayBorder: '#1F6FEB',
    rangeBackground: '#DBEAFE',
    disabled: '#D1D5DB',
    border: '#E5E7EB',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  cellSize: 40,
  borderRadius: 999,
  fontSize: {
    day: 14,
    weekday: 12,
    header: 16,
  },
};

// ---------------------------------------------------------------------------
// Default labels — English. Override via <Calendar.Root labels={...}>.
// ---------------------------------------------------------------------------

export const defaultLabels: CalendarLabels = {
  prev: 'Previous',
  next: 'Next',
  confirm: 'Confirm',
  clear: 'Clear',
  selectMonth: 'Select month',
  selectYear: 'Select year',
};
