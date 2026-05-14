import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import SingleDatePickerExample from '../SingleDatePickerExample';

const meta = {
  title: 'Calendar/Single Date',
  component: SingleDatePickerExample,
  decorators: [
    (Story: () => React.JSX.Element) => (
      <View className="flex-1">
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SingleDatePickerExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Single date picker',
};
