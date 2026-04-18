const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = true;

config.resolver.extraNodeModules = {
  "expo-gaode-map": path.resolve(monorepoRoot, "packages/navigation"),
  "expo-gaode-map-navigation": path.resolve(monorepoRoot, "packages/navigation"),
  "expo-gaode-map-web-api": path.resolve(monorepoRoot, "packages/web-api"),
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
  "react/jsx-runtime": path.resolve(projectRoot, "node_modules/react/jsx-runtime"),
};

module.exports = config;
