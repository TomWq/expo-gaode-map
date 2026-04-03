import type { GeocodeProvider, RouteProvider, SearchProvider } from './contracts';
import { createGaodeRuntime } from './runtime';
import type { GaodeRuntime, RuntimeClientOptions } from './runtime';

export interface RuntimeCapabilityAdapter {
  source: string;
  priority?: number;
  enabled?: boolean;
  searchProviders?: SearchProvider[];
  geocodeProviders?: GeocodeProvider[];
  routeProviders?: RouteProvider[];
}

export interface RuntimeProviderSet {
  searchProviders: SearchProvider[];
  geocodeProviders: GeocodeProvider[];
  routeProviders: RouteProvider[];
}

export interface AssembleRuntimeProvidersOptions {
  adapters: RuntimeCapabilityAdapter[];
  dedupeByKind?: boolean;
}

export interface CapabilityRuntimeOptions
  extends RuntimeClientOptions,
    AssembleRuntimeProvidersOptions {}

function dedupeProvidersByKind<TProvider extends { kind: string }>(
  providers: TProvider[],
  dedupeByKind: boolean
): TProvider[] {
  if (!dedupeByKind) {
    return providers;
  }

  const seenKinds = new Set<string>();
  return providers.filter((provider) => {
    if (seenKinds.has(provider.kind)) {
      return false;
    }

    seenKinds.add(provider.kind);
    return true;
  });
}

export function assembleRuntimeProviders(
  options: AssembleRuntimeProvidersOptions
): RuntimeProviderSet {
  const sortedAdapters = (options.adapters ?? [])
    .filter((adapter) => adapter.enabled !== false)
    .map((adapter, index) => ({ ...adapter, index }))
    .sort((left, right) => {
      const leftPriority = left.priority ?? 0;
      const rightPriority = right.priority ?? 0;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return left.index - right.index;
    });

  const searchProviders = sortedAdapters.flatMap(
    (adapter) => adapter.searchProviders ?? []
  );
  const geocodeProviders = sortedAdapters.flatMap(
    (adapter) => adapter.geocodeProviders ?? []
  );
  const routeProviders = sortedAdapters.flatMap(
    (adapter) => adapter.routeProviders ?? []
  );
  const dedupeByKind = options.dedupeByKind ?? true;

  return {
    searchProviders: dedupeProvidersByKind(searchProviders, dedupeByKind),
    geocodeProviders: dedupeProvidersByKind(geocodeProviders, dedupeByKind),
    routeProviders: dedupeProvidersByKind(routeProviders, dedupeByKind),
  };
}

export function createCapabilityRuntime(
  options: CapabilityRuntimeOptions
): GaodeRuntime {
  const providers = assembleRuntimeProviders(options);

  return createGaodeRuntime({
    continueOnError: options.continueOnError,
    onProviderError: options.onProviderError,
    searchProviders: providers.searchProviders,
    geocodeProviders: providers.geocodeProviders,
    routeProviders: providers.routeProviders,
  });
}
