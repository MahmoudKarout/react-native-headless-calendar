import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';

import ComposableCalendarShowcase, {
  DayPicker,
  FullPicker,
  MultiSystemPicker,
  RangePicker,
} from '../../src/ComposableCalendar';

const FullScreen = (Story: () => React.JSX.Element) => (
  <View className="flex-1">
    <Story />
  </View>
);

const meta = {
  title: 'Calendar/Composable',
  component: ComposableCalendarShowcase,
  decorators: [FullScreen],
} satisfies Meta<typeof ComposableCalendarShowcase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  name: 'Showcase (all variants)',
};

export const Day: StoryObj = {
  name: 'Day picker (Header + DayGrid)',
  render: () => <DayPicker />,
};

export const Full: StoryObj = {
  name: 'Full picker (Header + SystemSwitcher + Day/Month/Year + Footer)',
  render: () => <FullPicker />,
};

export const Range: StoryObj = {
  name: 'Range picker (custom Footer labels)',
  render: () => <RangePicker />,
};

export const MultiSystem: StoryObj = {
  name: 'Multi-system (Hijri default)',
  render: () => <MultiSystemPicker />,
};
