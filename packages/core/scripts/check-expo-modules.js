#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

function resolveProjectRoot() {
  return process.env.INIT_CWD || process.env.npm_config_local_prefix || process.cwd();
}

function hasPackage(pkgName, projectRoot) {
  try {
    require.resolve(`${pkgName}/package.json`, { paths: [projectRoot] });
    return true;
  } catch {
    return false;
  }
}

function printWarning(lines) {
  const prefix = '[expo-gaode-map]';
  console.warn(`${prefix} WARNING: Expo Modules infrastructure was not detected in this React Native project.`);
  for (const line of lines) {
    console.warn(`${prefix} ${line}`);
  }
}

function main() {
  const projectRoot = resolveProjectRoot();

  // Skip non-React Native consumers.
  if (!hasPackage('react-native', projectRoot)) {
    return;
  }

  const hasExpo = hasPackage('expo', projectRoot);
  const hasExpoModulesCore = hasPackage('expo-modules-core', projectRoot);
  const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
  const hasPodfile = fs.existsSync(podfilePath);
  const hasUseExpoModules = hasPodfile
    ? /\buse_expo_modules!\b/m.test(fs.readFileSync(podfilePath, 'utf8'))
    : true;

  if (hasExpo && hasExpoModulesCore && hasUseExpoModules) {
    return;
  }

  const details = [];
  if (!hasExpo) {
    details.push('Missing dependency: expo');
  }
  if (!hasExpoModulesCore) {
    details.push('Missing dependency: expo-modules-core');
  }
  if (!hasUseExpoModules) {
    details.push('iOS Podfile does not contain use_expo_modules!');
  }

  printWarning([
    ...details,
    'This package requires Expo Modules infrastructure even in bare React Native apps.',
    'Suggested fix:',
    '  npx install-expo-modules@latest',
    hasPodfile ? '  (then) cd ios && pod install' : null,
    'Docs: https://docs.expo.dev/bare/installing-expo-modules/',
  ].filter(Boolean));
}

main();
