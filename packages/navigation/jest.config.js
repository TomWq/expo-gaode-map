module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.(test|spec).[jt]s?(x)', '**/*.(test|spec).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo|@expo|@expo/vector-icons|react-navigation)/)',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: ['babel-preset-expo'],
      },
    ],
  },
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|svg|ttf|woff|woff2)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
