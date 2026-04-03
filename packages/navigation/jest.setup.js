const mockNativeModuleMocks = new Map();

const createMockNativeModule = () =>
  new Proxy(
    {
      initSDK: jest.fn(),
      getPrivacyStatus: jest.fn(() => ({
        hasShow: true,
        hasContainsPrivacy: true,
        hasAgree: true,
        isReady: true,
      })),
      getVersion: jest.fn(() => '1.0.0'),
      isNativeSDKConfigured: jest.fn(() => true),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeAllListeners: jest.fn(),
    },
    {
      get(target, prop) {
        if (prop in target) {
          return target[prop];
        }
        const fn = jest.fn();
        target[prop] = fn;
        return fn;
      },
    }
  );

const getMockNativeModule = (moduleName) => {
  if (!mockNativeModuleMocks.has(moduleName)) {
    mockNativeModuleMocks.set(moduleName, createMockNativeModule());
  }
  return mockNativeModuleMocks.get(moduleName);
};

jest.mock('expo-modules-core', () => ({
  requireNativeModule: jest.fn((moduleName) => getMockNativeModule(moduleName)),
  requireOptionalNativeModule: jest.fn(() => null),
  createPermissionHook: jest.fn(() => () => [null, jest.fn(), jest.fn()]),
  NativeModule: class NativeModule {},
  EventEmitter: jest.fn(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  })),
  requireNativeViewManager: jest.fn((viewName) => {
    const MockView = (props) => null;
    MockView.displayName = `Mock${viewName}`;
    return MockView;
  }),
  NativeModulesProxy: {},
}));

jest.mock('expo', () => ({
  requireNativeModule: jest.fn((moduleName) => getMockNativeModule(moduleName)),
  NativeModule: class NativeModule {},
}));

jest.mock('react-native', () => ({
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 667 }),
  },
  PixelRatio: {
    get: () => 2,
  },
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  TouchableOpacity: 'TouchableOpacity',
  NativeModules: {},
  TurboModuleRegistry: {
    getEnforcing: (name) => {
      if (name === 'DeviceInfo') {
        return {
          getConstants: () => ({
            Dimensions: {
              window: { width: 375, height: 667, scale: 2, fontScale: 1 },
              screen: { width: 375, height: 667, scale: 2, fontScale: 1 },
            },
          }),
        };
      }
      return null;
    },
  },
}));

global.__DEV__ = true;
global.__fbBatchedBridgeConfig = {};
