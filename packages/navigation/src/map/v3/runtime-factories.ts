import ExpoGaodeMapModule, {
  getSDKConfig,
  getWebKey,
} from '../ExpoGaodeMapModule';
import {
  createInstalledCapabilityRuntime,
  resolveInstalledCapabilityAdapters,
  type InstalledCapabilityAdaptersResult,
  type InstalledCapabilityRuntimeOptions,
} from './capability-runtime';
import {
  createMapRuntime,
  type MapRuntimeBootstrapOptions,
  type CreateMapRuntimeOptions,
  type MapRuntime,
} from './map-runtime';
import {
  resolveCapabilityModuleSelection,
  type CapabilityModuleSelection,
  type CapabilitySelectionOptions,
} from './capability-selection';
import type { GaodeRuntime } from './runtime';

export type NavigationRuntimeModule = typeof ExpoGaodeMapModule;
export type NavigationRuntime = MapRuntime<NavigationRuntimeModule>;
export type NavigationCapabilityRuntime = GaodeRuntime;
export type NavigationRuntimeOptions = Omit<
  CreateMapRuntimeOptions<NavigationRuntimeModule>,
  'module' | 'getSDKConfig' | 'getWebKey'
> & {
  module?: NavigationRuntimeModule;
};
export type NavigationCapabilityRuntimeOptions = InstalledCapabilityRuntimeOptions;
export type NavigationCapabilityAdaptersResult = InstalledCapabilityAdaptersResult;
export interface NavigationCapabilityAssemblyOptions
  extends NavigationCapabilityRuntimeOptions {
  selection?: CapabilitySelectionOptions;
}

export interface NavigationPlatformRuntimeOptions {
  map?: NavigationRuntimeOptions;
  mapBootstrap?: MapRuntimeBootstrapOptions;
  autoBootstrapMap?: boolean;
  capability?: NavigationCapabilityAssemblyOptions;
}

export interface NavigationPlatformRuntime {
  map: NavigationRuntime;
  capabilities: NavigationCapabilityRuntime;
  installed: NavigationCapabilityAdaptersResult['installed'];
  selection: CapabilityModuleSelection;
}

function applyCapabilitySelection(
  options: NavigationCapabilityAssemblyOptions = {}
): {
  runtimeOptions: NavigationCapabilityRuntimeOptions;
  selection: CapabilityModuleSelection;
} {
  const { selection: selectionOptions, nativeSearch, webApi, ...rest } = options;
  const selection = resolveCapabilityModuleSelection(selectionOptions);

  return {
    selection,
    runtimeOptions: {
      ...rest,
      nativeSearch: {
        ...(nativeSearch ?? {}),
        enabled: nativeSearch?.enabled ?? selection.nativeSearch,
      },
      webApi: {
        ...(webApi ?? {}),
        enabled: webApi?.enabled ?? selection.webApi,
      },
    },
  };
}

export function createNavigationRuntime(
  options: NavigationRuntimeOptions = {}
): NavigationRuntime {
  return createMapRuntime({
    ...options,
    module: options.module ?? ExpoGaodeMapModule,
    getSDKConfig,
    getWebKey,
  });
}

export function resolveNavigationCapabilityAdapters(
  options: NavigationCapabilityRuntimeOptions = {}
): NavigationCapabilityAdaptersResult {
  return resolveInstalledCapabilityAdapters(options);
}

export function createNavigationCapabilityRuntime(
  options: NavigationCapabilityRuntimeOptions = {}
): NavigationCapabilityRuntime {
  return createInstalledCapabilityRuntime(options);
}

export function createNavigationPlatformRuntime(
  options: NavigationPlatformRuntimeOptions = {}
): NavigationPlatformRuntime {
  const map = createNavigationRuntime(options.map);
  if (options.autoBootstrapMap) {
    map.bootstrap(options.mapBootstrap);
  }

  const { runtimeOptions, selection } = applyCapabilitySelection(
    options.capability
  );
  const resolved = resolveNavigationCapabilityAdapters(runtimeOptions);
  const capabilities = createNavigationCapabilityRuntime(runtimeOptions);

  return {
    map,
    capabilities,
    installed: resolved.installed,
    selection,
  };
}
