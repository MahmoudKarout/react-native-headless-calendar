import type { StorybookConfig } from '@storybook/react-native-web-vite';

import { dirname } from 'path';

import { fileURLToPath } from 'url';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  framework: getAbsolutePath('@storybook/react-native-web-vite'),
  // Register the Tailwind v4 + Uniwind Vite plugins so the web-storybook
  // build can compile the same `className`s our examples ship.
  // Requires `@tailwindcss/vite` to be installed as a dev dependency.
  viteFinal: async (vite) => {
    const { default: tailwindcss } = await import('@tailwindcss/vite');
    const { uniwind } = await import('uniwind/vite');
    vite.plugins = vite.plugins ?? [];
    vite.plugins.push(
      tailwindcss(),
      uniwind({
        cssEntryFile: './global.css',
      })
    );
    return vite;
  },
};
export default config;
