const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');
const { withUniwindConfig } = require('uniwind/metro');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname,
});

// `withUniwindConfig` must be the OUTERMOST wrapper so it sees the final
// resolver/transformer chain (per the Uniwind setup guide).
module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
});
