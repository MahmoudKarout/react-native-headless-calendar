import type { Preview } from '@storybook/react-native-web-vite';

// Boot the Uniwind + Tailwind v4 stylesheet. The matching Vite plugins are
// registered in `.storybook/main.ts` via `viteFinal`.
import '../global.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;
