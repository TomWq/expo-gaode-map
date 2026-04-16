import type { ComponentType } from 'react';
import { Platform, requireNativeComponent } from 'react-native';

type RequireNativeViewManager = <Props extends object = Record<string, unknown>>(
  name: string
) => ComponentType<Props>;

declare const require: ((id: string) => unknown) | undefined;

const isHarmonyPlatform = (): boolean =>
  (Platform.OS as string) === 'harmony';

function optionalRequire(moduleName: string): unknown | null {
  const runtimeRequire = (globalThis as { __r?: (id: string) => unknown }).__r
    ?? (typeof require === 'function' ? require : null);
  if (typeof runtimeRequire !== 'function') {
    return null;
  }

  try {
    return runtimeRequire(moduleName);
  } catch {
    return null;
  }
}

function resolveRequireNativeViewManager(): RequireNativeViewManager | null {
  const expoModulesCore = optionalRequire('expo-modules-core') as {
    requireNativeViewManager?: RequireNativeViewManager;
  } | null;
  if (typeof expoModulesCore?.requireNativeViewManager === 'function') {
    return expoModulesCore.requireNativeViewManager;
  }
  return null;
}

export function createLazyNativeViewManager<Props extends object = Record<string, unknown>>(
  name: string
): () => ComponentType<Props> {
  let cached: ComponentType<Props> | null = null;
  const requireNativeViewManager = resolveRequireNativeViewManager();

  return () => {
    if (!cached) {
      if (isHarmonyPlatform()) {
        cached = requireNativeComponent<Props>(name) as ComponentType<Props>;
      } else {
        if (!requireNativeViewManager) {
          throw new Error('expo-modules-core is required on iOS/Android to create native view manager');
        }
        cached = requireNativeViewManager<Props>(name);
      }
    }
    return cached!;
  };
}
