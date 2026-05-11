import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import WheelDatePickerExample from '../WheelDatePickerExample';

const meta = {
  title: 'Calendar/Wheel Date Picker',
  component: WheelDatePickerExample,
  decorators: [
    (Story: () => React.JSX.Element) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof WheelDatePickerExample>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * An iOS-style drum-roll wheel picker with three independent columns:
 * **day**, **month**, and **year**.
 *
 * Drag any column up or down to spin it. The selected item scales up
 * slightly and the rows towards the edges fade out. Spring physics
 * snap the column to the nearest value on release.
 *
 * Implemented with `react-native-reanimated` (shared-value animations)
 * and `react-native-gesture-handler` (pan gesture + rubber-band resistance).
 * Zero additional dependencies.
 */
export const Default: Story = {
  name: 'Wheel Date Picker',
};
