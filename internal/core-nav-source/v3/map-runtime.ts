import type { PrivacyConfig, PrivacyStatus, SDKConfig } from '../types/common.types';

export class MapRuntimeError extends Error {
  readonly code: string;
  readonly type: 'runtime' | 'config';
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(options: {
    code: string;
    type: 'runtime' | 'config';
    message: string;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = 'MapRuntimeError';
    this.code = options.code;
    this.type = options.type;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }

  toJSON() {
    return {
      code: this.code,
      type: this.type,
      message: this.message,
      retryable: this.retryable,
      cause: this.cause,
    };
  }
}

export interface MapRuntimeModule {
  setPrivacyConfig(config: PrivacyConfig): void;
  getPrivacyStatus(): PrivacyStatus;
  initSDK(config: SDKConfig): void;
  isSDKInitialized(): boolean;
}

export interface MapRuntimeState {
  privacyStatus: PrivacyStatus;
  sdkInitialized: boolean;
  sdkConfig: SDKConfig | null;
  webKey?: string;
}

export interface MapRuntimeBootstrapOptions {
  privacyConfig?: PrivacyConfig;
  sdkConfig?: SDKConfig;
  autoInitSDK?: boolean;
}

export interface CreateMapRuntimeOptions<
  TModule extends MapRuntimeModule = MapRuntimeModule
> extends MapRuntimeBootstrapOptions {
  module: TModule;
  getSDKConfig?: () => SDKConfig | null;
  getWebKey?: () => string | undefined;
  autoBootstrap?: boolean;
}

export interface MapRuntime<TModule extends MapRuntimeModule = MapRuntimeModule> {
  module: TModule;
  bootstrap(options?: MapRuntimeBootstrapOptions): MapRuntimeState;
  ensurePrivacy(config?: PrivacyConfig): PrivacyStatus;
  ensureSDK(config?: SDKConfig, options?: { force?: boolean }): boolean;
  getState(): MapRuntimeState;
}

function clonePrivacyStatus(status: PrivacyStatus): PrivacyStatus {
  return { ...status };
}

function createState<TModule extends MapRuntimeModule>(
  module: TModule,
  getSDKConfig?: () => SDKConfig | null,
  getWebKey?: () => string | undefined
): MapRuntimeState {
  return {
    privacyStatus: clonePrivacyStatus(module.getPrivacyStatus()),
    sdkInitialized: module.isSDKInitialized(),
    sdkConfig: getSDKConfig?.() ?? null,
    webKey: getWebKey?.(),
  };
}

export function createMapRuntime<TModule extends MapRuntimeModule>(
  options: CreateMapRuntimeOptions<TModule>
): MapRuntime<TModule> {
  const module = options.module;
  let state = createState(module, options.getSDKConfig, options.getWebKey);

  const refresh = () => {
    state = createState(module, options.getSDKConfig, options.getWebKey);
    return state;
  };

  const ensurePrivacy = (config?: PrivacyConfig) => {
    if (config) {
      module.setPrivacyConfig(config);
    }

    return refresh().privacyStatus;
  };

  const ensureSDK = (
    config?: SDKConfig,
    ensureOptions: { force?: boolean } = {}
  ) => {
    if (!ensureOptions.force && module.isSDKInitialized()) {
      return true;
    }

    const effectiveConfig = config ?? options.sdkConfig ?? options.getSDKConfig?.() ?? {};
    module.initSDK(effectiveConfig);
    return refresh().sdkInitialized;
  };

  const bootstrap = (bootstrapOptions: MapRuntimeBootstrapOptions = {}) => {
    const privacyStatus = ensurePrivacy(
      bootstrapOptions.privacyConfig ?? options.privacyConfig
    );
    const autoInitSDK =
      bootstrapOptions.autoInitSDK ?? options.autoInitSDK ?? true;

    if (autoInitSDK) {
      if (!privacyStatus.isReady) {
        throw new MapRuntimeError({
          code: 'MAP_RUNTIME_PRIVACY_NOT_READY',
          type: 'config',
          message:
            '[v3:map-runtime] privacy is not ready; set privacyConfig before SDK init',
          retryable: false,
        });
      }

      ensureSDK(bootstrapOptions.sdkConfig);
    }

    return refresh();
  };

  if (options.autoBootstrap) {
    bootstrap();
  }

  return {
    module,
    bootstrap,
    ensurePrivacy,
    ensureSDK,
    getState: () => refresh(),
  };
}
