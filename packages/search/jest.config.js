module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.(test|spec).[jt]s?(x)', '**/*.(test|spec).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo|@expo|@expo/vector-icons|react-navigation)/)',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
};
