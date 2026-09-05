const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// React Native 0.81 ships DOMRect with `#private` fields, which the bundled
// hermesc rejects unless Babel downlevels them for the Hermes profile.
config.transformer = {
  ...config.transformer,
  unstable_transformProfile: 'hermes-stable',
};

module.exports = config;
