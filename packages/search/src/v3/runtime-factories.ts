import { createNativeGeocodeProvider, createNativeSearchProvider } from './native-search-provider';
import { createCapabilityRuntime } from './runtime-assembly';
import type { GaodeRuntime, RuntimeClientOptions } from './runtime';
import type { RuntimeCapabilityAdapter } from './runtime-assembly';

export type NativeSearchRuntimeOptions = RuntimeClientOptions;

export interface NativeSearchCapabilityAdapterOptions {
  source?: string;
  priority?: number;
  enabled?: boolean;
}

export function createNativeSearchCapabilityAdapter(
  options: NativeSearchCapabilityAdapterOptions = {}
): RuntimeCapabilityAdapter {
  return {
    source: options.source ?? 'native-search',
    priority: options.priority,
    enabled: options.enabled,
    searchProviders: [createNativeSearchProvider()],
    geocodeProviders: [createNativeGeocodeProvider()],
    routeProviders: [],
  };
}

export function createNativeSearchRuntime(
  options: NativeSearchRuntimeOptions = {}
): GaodeRuntime {
  return createCapabilityRuntime({
    ...options,
    adapters: [createNativeSearchCapabilityAdapter()],
  });
}
