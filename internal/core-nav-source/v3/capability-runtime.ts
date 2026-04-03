import type { GaodeRuntime, RuntimeClientOptions } from './runtime';
import { createCapabilityRuntime } from './runtime-assembly';
import type { RuntimeCapabilityAdapter } from './runtime-assembly';

type FactoryOptions = Record<string, unknown>;
type RuntimeRequire = (moduleName: string) => unknown;
type AdapterFactory = (options?: FactoryOptions) => RuntimeCapabilityAdapter;

interface CapabilityModuleExports {
  V3?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface OptionalCapabilityModuleOptions {
  enabled?: boolean;
  priority?: number;
  source?: string;
  factoryOptions?: FactoryOptions;
}

export interface InstalledCapabilityRuntimeOptions extends RuntimeClientOptions {
  adapters?: RuntimeCapabilityAdapter[];
  nativeSearch?: OptionalCapabilityModuleOptions;
  webApi?: OptionalCapabilityModuleOptions;
}

export interface InstalledCapabilityAdaptersResult {
  adapters: RuntimeCapabilityAdapter[];
  installed: {
    nativeSearch: boolean;
    webApi: boolean;
  };
}

function getRuntimeRequire(): RuntimeRequire | null {
  try {
    const fn = Function(
      'return typeof require === "function" ? require : null;'
    )() as RuntimeRequire | null;
    return typeof fn === 'function' ? fn : null;
  } catch {
    return null;
  }
}

function resolveAdapterFactory(
  moduleName: string,
  factoryName: string
): AdapterFactory | null {
  const runtimeRequire = getRuntimeRequire();
  if (!runtimeRequire) {
    return null;
  }

  try {
    const moduleExports = runtimeRequire(moduleName) as CapabilityModuleExports;
    const directFactory = moduleExports[factoryName];
    if (typeof directFactory === 'function') {
      return directFactory as AdapterFactory;
    }

    const v3Factory = moduleExports.V3?.[factoryName];
    if (typeof v3Factory === 'function') {
      return v3Factory as AdapterFactory;
    }
  } catch {
    return null;
  }

  return null;
}

function buildFactoryOptions(
  options: OptionalCapabilityModuleOptions,
  defaults: { priority: number; source: string }
): FactoryOptions {
  return {
    ...(options.factoryOptions ?? {}),
    enabled: options.enabled ?? true,
    priority: options.priority ?? defaults.priority,
    source: options.source ?? defaults.source,
  };
}

function maybeCreateAdapter(
  moduleName: string,
  factoryName: string,
  options: OptionalCapabilityModuleOptions,
  defaults: { priority: number; source: string }
): RuntimeCapabilityAdapter | null {
  if (options.enabled === false) {
    return null;
  }

  const factory = resolveAdapterFactory(moduleName, factoryName);
  if (!factory) {
    return null;
  }

  return factory(buildFactoryOptions(options, defaults));
}

export function resolveInstalledCapabilityAdapters(
  options: InstalledCapabilityRuntimeOptions = {}
): InstalledCapabilityAdaptersResult {
  const adapters = [...(options.adapters ?? [])];

  const nativeAdapter = maybeCreateAdapter(
    'expo-gaode-map-search',
    'createNativeSearchCapabilityAdapter',
    options.nativeSearch ?? {},
    { priority: 10, source: 'native-search' }
  );

  if (nativeAdapter) {
    adapters.push(nativeAdapter);
  }

  const webAdapter = maybeCreateAdapter(
    'expo-gaode-map-web-api',
    'createWebCapabilityAdapter',
    options.webApi ?? {},
    { priority: 20, source: 'web-api' }
  );

  if (webAdapter) {
    adapters.push(webAdapter);
  }

  return {
    adapters,
    installed: {
      nativeSearch: nativeAdapter !== null,
      webApi: webAdapter !== null,
    },
  };
}

export function createInstalledCapabilityRuntime(
  options: InstalledCapabilityRuntimeOptions = {}
): GaodeRuntime {
  const resolved = resolveInstalledCapabilityAdapters(options);

  return createCapabilityRuntime({
    continueOnError: options.continueOnError,
    onProviderError: options.onProviderError,
    adapters: resolved.adapters,
  });
}
