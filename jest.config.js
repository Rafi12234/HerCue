/**
 * Test setup for pure domain logic only.
 *
 * Deliberately runs in a plain Node environment rather than pulling in the full
 * React Native preset: the modules under test (cycle maths, interval planning,
 * date helpers) have no native dependencies, so nothing heavier is justified.
 * Repository SQL is verified on-device instead — see the persistence checklist.
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', { presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]] }],
  },
  transformIgnorePatterns: ['node_modules/(?!(date-fns)/)'],
  globals: {
    __DEV__: true,
  },
};
