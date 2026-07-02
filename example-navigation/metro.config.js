const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

const resolveNodeModule = (name) =>
  path.dirname(require.resolve(`${name}/package.json`, { paths: [projectRoot, monorepoRoot] }));

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.extraNodeModules = {
  "expo-gaode-map": path.resolve(monorepoRoot, "packages/navigation"),
  "expo-gaode-map-navigation": path.resolve(monorepoRoot, "packages/navigation"),
  "expo-gaode-map-web-api": path.resolve(monorepoRoot, "packages/web-api"),
  react: resolveNodeModule("react"),
  "react-native": resolveNodeModule("react-native"),
  "react/jsx-runtime": path.join(resolveNodeModule("react"), "jsx-runtime"),
};

module.exports = config;
