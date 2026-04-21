module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/engine/**/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-.*|@unimodules/.*|unimodules-.*|sentry-expo|native-base|react-native-svg)/)',
  ],
};
