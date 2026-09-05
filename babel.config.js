module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 executes UI-thread code through react-native-worklets, so its
    // plugin must stay last in the chain.
    plugins: ['react-native-worklets/plugin'],
  };
};
