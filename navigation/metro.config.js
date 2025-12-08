
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Monorepo 支持配置
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

// 1. 监听整个 monorepo
config.watchFolders = [workspaceRoot];

// 2. 配置 node_modules 解析路径
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. 确保正确解析源码文件
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'];

module.exports = config;
