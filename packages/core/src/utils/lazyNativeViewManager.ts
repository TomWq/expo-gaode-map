import type { ComponentType } from 'react';
import { requireNativeViewManager } from 'expo-modules-core';

export function createLazyNativeViewManager<Props extends object = Record<string, unknown>>(
  name: string
): () => ComponentType<Props> {
  let cached: ComponentType<Props> | null = null;

  return () => {
    if (!cached) {
      cached = requireNativeViewManager<Props>(name);
    }
    return cached!;
  };
}
