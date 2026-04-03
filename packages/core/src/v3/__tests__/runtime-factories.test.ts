import {
  createCoreCapabilityRuntime,
  createCorePlatformRuntime,
  createCoreRuntime,
  resolveCoreCapabilityAdapters,
  type CoreRuntimeModule,
} from '../runtime-factories';

const READY_PRIVACY = {
  hasShow: true,
  hasContainsPrivacy: true,
  hasAgree: true,
  isReady: true,
} as const;

const NOT_READY_PRIVACY = {
  hasShow: false,
  hasContainsPrivacy: false,
  hasAgree: false,
  isReady: false,
} as const;

function createMockModule(
  options: {
    privacyReady?: boolean;
    sdkInitialized?: boolean;
  } = {}
): jest.Mocked<Pick<
  CoreRuntimeModule,
  'setPrivacyConfig' | 'getPrivacyStatus' | 'initSDK' | 'isSDKInitialized'
>> {
  let privacyStatus = options.privacyReady ? READY_PRIVACY : NOT_READY_PRIVACY;
  let sdkInitialized = options.sdkInitialized ?? false;

  return {
    setPrivacyConfig: jest.fn(() => {
      privacyStatus = READY_PRIVACY;
    }),
    getPrivacyStatus: jest.fn(() => privacyStatus),
    initSDK: jest.fn(() => {
      sdkInitialized = true;
    }),
    isSDKInitialized: jest.fn(() => sdkInitialized),
  } as unknown as jest.Mocked<Pick<
    CoreRuntimeModule,
    'setPrivacyConfig' | 'getPrivacyStatus' | 'initSDK' | 'isSDKInitialized'
  >>;
}

describe('v3 createCoreRuntime', () => {
  it('bootstrap should apply privacy and initialize sdk', () => {
    const module = createMockModule({
      privacyReady: false,
      sdkInitialized: false,
    });

    const runtime = createCoreRuntime({
      module: module as unknown as CoreRuntimeModule,
      autoInitSDK: true,
      privacyConfig: {
        hasShow: true,
        hasContainsPrivacy: true,
        hasAgree: true,
      },
      sdkConfig: {
        androidKey: 'android-key',
        iosKey: 'ios-key',
      },
    });

    const state = runtime.bootstrap();

    expect(module.setPrivacyConfig).toHaveBeenCalledTimes(1);
    expect(module.initSDK).toHaveBeenCalledTimes(1);
    expect(state.privacyStatus.isReady).toBe(true);
    expect(state.sdkInitialized).toBe(true);
  });

  it('bootstrap should throw when privacy is not ready and autoInitSDK is true', () => {
    const module = createMockModule({
      privacyReady: false,
      sdkInitialized: false,
    });

    const runtime = createCoreRuntime({
      module: module as unknown as CoreRuntimeModule,
      autoInitSDK: true,
    });

    expect(() => runtime.bootstrap()).toThrow(
      '[v3:map-runtime] privacy is not ready; set privacyConfig before SDK init'
    );
    expect(module.initSDK).not.toHaveBeenCalled();
  });

  it('ensureSDK should be a no-op when sdk is already initialized', () => {
    const module = createMockModule({
      privacyReady: true,
      sdkInitialized: true,
    });

    const runtime = createCoreRuntime({
      module: module as unknown as CoreRuntimeModule,
    });

    const initialized = runtime.ensureSDK({
      androidKey: 'android-key',
      iosKey: 'ios-key',
    });

    expect(initialized).toBe(true);
    expect(module.initSDK).not.toHaveBeenCalled();
  });
});

describe('v3 createCoreCapabilityRuntime', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('should build runtime from explicit adapters when optional modules are disabled', async () => {
    const runtime = createCoreCapabilityRuntime({
      nativeSearch: { enabled: false },
      webApi: { enabled: false },
      adapters: [
        {
          source: 'manual-adapter',
          searchProviders: [
            {
              kind: 'manual-search',
              searchKeyword: jest.fn(async () => ({
                items: [],
                total: 0,
                page: 1,
                pageSize: 20,
                raw: {},
              })),
              searchNearby: jest.fn(async () => ({
                items: [],
                total: 0,
                page: 1,
                pageSize: 20,
                raw: {},
              })),
              getInputTips: jest.fn(async () => ({
                items: [],
                total: 0,
                page: 1,
                pageSize: 20,
                raw: {},
              })),
            },
          ],
          geocodeProviders: [
            {
              kind: 'manual-geocode',
              reverseGeocode: jest.fn(async () => ({
                location: { latitude: 0, longitude: 0 },
                formattedAddress: '',
                pois: [],
                raw: {},
              })),
            },
          ],
          routeProviders: [],
        },
      ],
    });

    expect(runtime.providers.search).toHaveLength(1);
    expect(runtime.providers.geocode).toHaveLength(1);
    expect(runtime.providers.route).toHaveLength(0);

    await expect(
      runtime.search.searchKeyword({
        keyword: 'coffee',
      })
    ).resolves.toMatchObject({
      total: 0,
    });
  });

  it('should preserve custom adapters and skip disabled optional modules', () => {
    const customAdapter = {
      source: 'custom',
      searchProviders: [],
      geocodeProviders: [],
      routeProviders: [],
    };
    const resolved = resolveCoreCapabilityAdapters({
      adapters: [customAdapter],
      nativeSearch: {
        enabled: false,
      },
      webApi: {
        enabled: false,
      },
    });

    expect(resolved.installed).toEqual({
      nativeSearch: false,
      webApi: false,
    });
    expect(resolved.adapters).toEqual([customAdapter]);
  });

  it('should assemble map runtime and capability runtime at entry level', () => {
    const module = createMockModule({
      privacyReady: true,
      sdkInitialized: false,
    });

    const platform = createCorePlatformRuntime({
      map: {
        module: module as unknown as CoreRuntimeModule,
      },
      autoBootstrapMap: true,
      capability: {
        selection: {
          requirements: {
            route: true,
          },
        },
        nativeSearch: { enabled: false },
        webApi: { enabled: false },
      },
    });

    expect(module.initSDK).toHaveBeenCalledTimes(1);
    expect(platform.selection).toEqual({
      nativeSearch: false,
      webApi: true,
    });
    expect(platform.installed).toEqual({
      nativeSearch: false,
      webApi: false,
    });
  });
});
