const mockNativeModuleMocks = new Map();

const createCoreModuleMock = () => ({
  initSDK: jest.fn(),
  getPrivacyStatus: jest.fn(() => ({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
    isReady: true,
  })),
  isNativeSDKConfigured: jest.fn(() => true),
  distanceBetweenCoordinates: jest.fn((pointA, pointB) => {
    if (
      pointA?.latitude === pointB?.latitude &&
      pointA?.longitude === pointB?.longitude
    ) {
      return 0;
    }
    return 1000;
  }),
  calculatePathLength: jest.fn(() => 300),
  simplifyPolyline: jest.fn((points) => points),
  getNearestPointOnPath: jest.fn(() => ({ distanceMeters: 0 })),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
});

const createNavigationModuleMock = () => ({
  initNavigation: jest.fn(),
  destroyAllCalculators: jest.fn(),
  calculateDriveRoute: jest.fn(),
  calculateWalkRoute: jest.fn(),
  calculateRideRoute: jest.fn(),
  calculateEBikeRoute: jest.fn(),
  calculateTruckRoute: jest.fn(),
  calculateMotorcycleRoute: jest.fn(),
  independentDriveRoute: jest.fn(),
  independentTruckRoute: jest.fn(),
  independentWalkRoute: jest.fn(),
  independentRideRoute: jest.fn(),
  independentMotorcycleRoute: jest.fn(),
  selectIndependentRoute: jest.fn(),
  startNaviWithIndependentPath: jest.fn(),
  openOfficialNaviPage: jest.fn(),
  clearIndependentRoute: jest.fn(),
});

const mockGetNativeModule = (moduleName) => {
  if (!mockNativeModuleMocks.has(moduleName)) {
    if (moduleName === 'ExpoGaodeMap') {
      mockNativeModuleMocks.set(moduleName, createCoreModuleMock());
    } else if (moduleName === 'ExpoGaodeMapNavigation') {
      mockNativeModuleMocks.set(moduleName, createNavigationModuleMock());
    } else {
      mockNativeModuleMocks.set(moduleName, {});
    }
  }

  return mockNativeModuleMocks.get(moduleName);
};

global.__navigationNativeMocks = {
  core: mockGetNativeModule('ExpoGaodeMap'),
  navigation: mockGetNativeModule('ExpoGaodeMapNavigation'),
};

jest.mock('expo-modules-core', () => ({
  requireNativeModule: jest.fn((moduleName) => mockGetNativeModule(moduleName)),
  requireOptionalNativeModule: jest.fn(() => null),
  createPermissionHook: jest.fn(() => () => [null, jest.fn()]),
  NativeModule: class NativeModule {},
  EventEmitter: jest.fn(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  })),
  NativeModulesProxy: {},
}));

jest.mock('expo', () => ({
  requireNativeModule: jest.fn((moduleName) => mockGetNativeModule(moduleName)),
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
    getEnforcing: () => null,
  },
}));

global.__DEV__ = true;
global.__fbBatchedBridgeConfig = {};

global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
