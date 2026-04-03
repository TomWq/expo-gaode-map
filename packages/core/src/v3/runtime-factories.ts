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

export type CoreRuntimeModule = typeof ExpoGaodeMapModule;
export type CoreRuntime = MapRuntime<CoreRuntimeModule>;
export type CoreCapabilityRuntime = GaodeRuntime;
export type CoreRuntimeOptions = Omit<
  CreateMapRuntimeOptions<CoreRuntimeModule>,
  'module' | 'getSDKConfig' | 'getWebKey'
> & {
  module?: CoreRuntimeModule;
};
export type CoreCapabilityRuntimeOptions = InstalledCapabilityRuntimeOptions;
export type CoreCapabilityAdaptersResult = InstalledCapabilityAdaptersResult;
export interface CoreCapabilityAssemblyOptions
  extends CoreCapabilityRuntimeOptions {
  selection?: CapabilitySelectionOptions;
}

export interface CorePlatformRuntimeOptions {
  map?: CoreRuntimeOptions;
  mapBootstrap?: MapRuntimeBootstrapOptions;
  autoBootstrapMap?: boolean;
  capability?: CoreCapabilityAssemblyOptions;
}

export interface CorePlatformRuntime {
  map: CoreRuntime;
  capabilities: CoreCapabilityRuntime;
  installed: CoreCapabilityAdaptersResult['installed'];
  selection: CapabilityModuleSelection;
}

function applyCapabilitySelection(
  options: CoreCapabilityAssemblyOptions = {}
): {
  runtimeOptions: CoreCapabilityRuntimeOptions;
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

export function createCoreRuntime(options: CoreRuntimeOptions = {}): CoreRuntime {
  return createMapRuntime({
    ...options,
    module: options.module ?? ExpoGaodeMapModule,
    getSDKConfig,
    getWebKey,
  });
}

export function resolveCoreCapabilityAdapters(
  options: CoreCapabilityRuntimeOptions = {}
): CoreCapabilityAdaptersResult {
  return resolveInstalledCapabilityAdapters(options);
}

export function createCoreCapabilityRuntime(
  options: CoreCapabilityRuntimeOptions = {}
): CoreCapabilityRuntime {
  return createInstalledCapabilityRuntime(options);
}

export function createCorePlatformRuntime(
  options: CorePlatformRuntimeOptions = {}
): CorePlatformRuntime {
  const map = createCoreRuntime(options.map);
  if (options.autoBootstrapMap) {
    map.bootstrap(options.mapBootstrap);
  }

  const { runtimeOptions, selection } = applyCapabilitySelection(
    options.capability
  );
  const resolved = resolveCoreCapabilityAdapters(runtimeOptions);
  const capabilities = createCoreCapabilityRuntime(runtimeOptions);

  return {
    map,
    capabilities,
    installed: resolved.installed,
    selection,
  };
}
