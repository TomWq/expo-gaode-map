import { Platform } from 'react-native';

const warnedOverlayNames = new Set<string>();
const warnedOverlayPropNames = new Set<string>();

export const isHarmonyPlatform = (): boolean => (Platform.OS as string) === 'harmony';

export function warnHarmonyOverlayUnsupported(componentName: string): void {
  if (!isHarmonyPlatform() || warnedOverlayNames.has(componentName)) {
    return;
  }
  warnedOverlayNames.add(componentName);
  console.warn(
    `[expo-gaode-map] ${componentName} is not supported on Harmony yet, overlay will be ignored.`
  );
}

export function warnHarmonyOverlayPropUnsupported(componentName: string, propNames: string[]): void {
  if (!isHarmonyPlatform()) {
    return;
  }

  propNames.forEach((propName) => {
    const key = `${componentName}.${propName}`;
    if (warnedOverlayPropNames.has(key)) {
      return;
    }
    warnedOverlayPropNames.add(key);
    console.warn(
      `[expo-gaode-map] ${componentName}.${propName} is not supported on Harmony yet, this prop will be ignored.`
    );
  });
}
