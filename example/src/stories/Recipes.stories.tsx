import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import ArabicCalendarExample from '../ArabicCalendarExample';
import BoundedSelectionExample from '../BoundedSelectionExample';
import BottomSheetPickerExample from '../BottomSheetPickerExample';
import CustomDayCellExample from '../CustomDayCellExample';
import DateRangePickerExample from '../DateRangePickerExample';
import FlightPriceCalendarExample from '../FlightPriceCalendarExample';
import MultiDatePickerExample from '../MultiDatePickerExample';
import MultiMonthGridExample from '../MultiMonthGridExample';
import PerfCalendarExample from '../PerfCalendarExample';
import VerticalListExample from '../VerticalListExample';
import WeekNumbersExample from '../WeekNumbersExample';

const FullScreen = (Story: () => React.JSX.Element) => (
  <View style={{ flex: 1 }}>
    <Story />
  </View>
);

const meta = {
  title: 'Calendar/Recipes',
  component: DateRangePickerExample,
  decorators: [FullScreen],
} satisfies Meta<typeof DateRangePickerExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DateRange: Story = { name: 'Date range picker' };

export const MultiDate: StoryObj = {
  name: 'Multi-date picker',
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
  name: 'Performance counters',
  render: () => <PerfCalendarExample />,
};
