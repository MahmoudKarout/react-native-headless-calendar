import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';

import ArabicCalendarExample from '../../src/ArabicCalendarExample';
import BoundedSelectionExample from '../../src/BoundedSelectionExample';
import BottomSheetPickerExample from '../../src/BottomSheetPickerExample';
import CustomDayCellExample from '../../src/CustomDayCellExample';
import DateRangePickerExample from '../../src/DateRangePickerExample';
import FlightPriceCalendarExample from '../../src/FlightPriceCalendarExample';
import MultiDatePickerExample from '../../src/MultiDatePickerExample';
import MultiMonthGridExample from '../../src/MultiMonthGridExample';
import PerfCalendarExample from '../../src/PerfCalendarExample';
import SingleDatePickerExample from '../../src/SingleDatePickerExample';
import VerticalListExample from '../../src/VerticalListExample';
import WeekNumbersExample from '../../src/WeekNumbersExample';
import WheelDatePickerExample from '../../src/WheelDatePickerExample';

const FullScreen = (Story: () => React.JSX.Element) => (
  <View style={{ flex: 1 }}>
    <Story />
  </View>
);

const meta = {
  title: 'Calendar/Recipes',
  component: SingleDatePickerExample,
  decorators: [FullScreen],
} satisfies Meta<typeof SingleDatePickerExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleDate: Story = {
  name: 'Single date picker',
};

export const DateRange: StoryObj = {
  name: 'Date range picker',
  render: () => <DateRangePickerExample />,
};

export const MultiDate: StoryObj = {
  name: 'Multi-date picker (modifiers)',
  render: () => <MultiDatePickerExample />,
};

export const Bounded: StoryObj = {
  name: 'Bounded selection',
  render: () => <BoundedSelectionExample />,
};

export const MultiMonth: StoryObj = {
  name: 'Multi-month grid',
  render: () => <MultiMonthGridExample />,
};

export const CustomCell: StoryObj = {
  name: 'Custom day cell',
  render: () => <CustomDayCellExample />,
};

export const WeekNumbers: StoryObj = {
  name: 'Week numbers',
  render: () => <WeekNumbersExample />,
};

export const BottomSheet: StoryObj = {
  name: 'Bottom-sheet picker',
  render: () => <BottomSheetPickerExample />,
};

export const Vertical: StoryObj = {
  name: 'Vertical infinite list',
  render: () => <VerticalListExample />,
};

export const FlightPrice: StoryObj = {
  name: 'Flight price calendar',
  render: () => <FlightPriceCalendarExample />,
};

export const Arabic: StoryObj = {
  name: 'Arabic / Hijri',
  render: () => <ArabicCalendarExample />,
};

export const Perf: StoryObj = {
  name: 'Performance — render counters',
  render: () => <PerfCalendarExample />,
};

export const Wheel: StoryObj = {
  name: 'Wheel date picker',
  render: () => <WheelDatePickerExample />,
};
