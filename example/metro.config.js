

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');
const corePackageRoot = path.resolve(monorepoRoot, 'packages/core');
const webApiPackageRoot = path.resolve(monorepoRoot, 'packages/web-api');

const config = getDefaultConfig(projectRoot);

const escapePathForRegex = (value) =>
  value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');

// 1. 只监听 example 实际依赖的 workspace 包。不要监听整个 monorepo，
// 否则 packages/*/node_modules 也会进入 Metro 文件图，容易污染依赖解析缓存。
config.watchFolders = [
  path.resolve(monorepoRoot, 'node_modules'),
  corePackageRoot,
  webApiPackageRoot,
];

// 2. 解析 workspace 包
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList].filter(Boolean)),
  new RegExp(`${escapePathForRegex(path.resolve(monorepoRoot, 'packages'))}/[^/]+/node_modules/.*`),
];

// 3. 强制使用 example 的 React（解决多实例问题）
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'expo-gaode-map': corePackageRoot,
  'expo-gaode-map-web-api': webApiPackageRoot,
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
