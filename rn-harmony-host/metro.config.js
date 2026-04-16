/**
 * Copyright (c) 2025 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {mergeConfig, getDefaultConfig} = require('@react-native/metro-config');
const {
  createHarmonyMetroConfig,
} = require('@react-native-oh/react-native-harmony/metro.config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const projectNodeModules = path.resolve(projectRoot, 'node_modules');
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');
const expoGaodeMapRoot = path.resolve(projectRoot, '../packages/core');

/**
 * @type {import("metro-config").MetroConfig}
 */
const config = {
  watchFolders: [workspaceRoot, expoGaodeMapRoot],
  resolver: {
    unstable_enableSymlinks: true,
    disableHierarchicalLookup: true,
    nodeModulesPaths: [projectNodeModules, workspaceNodeModules],
    extraNodeModules: {
      react: path.resolve(projectNodeModules, 'react'),
      'react-native': path.resolve(projectNodeModules, 'react-native'),
      'expo-gaode-map': expoGaodeMapRoot,
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(
  getDefaultConfig(__dirname),
  createHarmonyMetroConfig({
    reactNativeHarmonyPackageName: '@react-native-oh/react-native-harmony',
  }),
  config,
);
