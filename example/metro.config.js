

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. 监听 monorepo 根目录
config.watchFolders = [monorepoRoot];

// 2. 解析 workspace 包
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. 强制使用 example 的 React（解决多实例问题）
config.resolver.extraNodeModules = {
  'expo-gaode-map': path.resolve(monorepoRoot, 'packages/core'),
  '@expo-gaode-map/search': path.resolve(monorepoRoot, 'packages/search'),
  // 强制所有包使用同一个 React 实例
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react/jsx-runtime': path.resolve(projectRoot, 'node_modules/react/jsx-runtime'),
};

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
