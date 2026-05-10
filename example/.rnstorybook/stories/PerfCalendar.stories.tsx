import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';

import PerfCalendarDemo from '../../src/PerfCalendarDemo';

const meta = {
  title: 'Calendar/Performance',
  component: PerfCalendarDemo,
  decorators: [
    (Story: () => React.JSX.Element) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof PerfCalendarDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Each day cell is wrapped in React.memo. The tiny counter inside every cell
 * shows exactly how many times it has rendered since mount.
 *
 * Select a range — only the cells that actually change state (range start,
 * range end, days in between) will increment their counter. Every other cell
 * stays frozen at 1×, proving zero unnecessary re-renders.
 *
 * Hit "Reset counters" to remount the calendar and start fresh.
 */
export const RenderCounters: Story = {
  name: 'Render counters (range)',
};
