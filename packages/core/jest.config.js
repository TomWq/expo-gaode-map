
module.exports = {
  // 不使用 preset，完全自定义配置
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // 测试环境
  testEnvironment: 'node',
  
  // 测试匹配模式
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/*.(test|spec).[jt]s?(x)',
  ],
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // 忽略 node_modules 中的转换（除了 expo 和相关包）
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo|@expo|@expo/vector-icons|react-navigation)/)',
  ],
  
  // Babel 转换配置
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: ['babel-preset-expo'],
    }],
  },
  
  // Mock 静态资源
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|svg|ttf|woff|woff2)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // 收集覆盖率的文件模式
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/types/**',
    '!src/**/index.ts',
  ],
  
  // 覆盖率阈值（修复拼写错误：coverageThresholds → coverageThreshold）
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50,
    },
  },
};
