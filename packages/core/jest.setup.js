// Jest Setup - Mock Expo Modules
// 这个文件在所有测试运行前执行

// 创建可重用的原生模块 Mock 工厂
const createNativeModuleMock = () => ({
  initSDK: jest.fn(() => Promise.resolve()),
  getVersion: jest.fn(() => '1.0.0'),
  checkLocationPermission: jest.fn(() => Promise.resolve({ granted: true })),
  requestLocationPermission: jest.fn(() => Promise.resolve({ granted: true })),
  getCurrentLocation: jest.fn(() => Promise.resolve({
    latitude: 39.9,
    longitude: 116.4,
    accuracy: 10,
  })),
  coordinateConvert: jest.fn((coord, type) => Promise.resolve({
    latitude: coord.latitude,
    longitude: coord.longitude,
  })),
  start: jest.fn(),
  stop: jest.fn(),
  isStarted: jest.fn(() => Promise.resolve(false)),
  startLocation: jest.fn(() => Promise.resolve()),
  stopLocation: jest.fn(() => Promise.resolve()),
  setLocatingWithReGeocode: jest.fn(),
  setLocationMode: jest.fn(),
  setInterval: jest.fn(),
  setLocationTimeout: jest.fn(),
  setOnceLocation: jest.fn(),
  updatePrivacyCompliance: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeAllListeners: jest.fn(),
  // 地图预加载相关
  startMapPreload: jest.fn(),
  getMapPreloadStatus: jest.fn(() => ({
    poolSize: 0,
    isPreloading: false,
    maxPoolSize: 5,
  })),
  clearMapPreloadPool: jest.fn(),
  hasPreloadedMapView: jest.fn(() => false),
  configurePreload: jest.fn(),
  startPreload: jest.fn(),
  stopPreload: jest.fn(),
  getPreloadStatus: jest.fn(() => 'idle'),
});

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeModule: jest.fn((moduleName) => createNativeModuleMock()),
  requireOptionalNativeModule: jest.fn(() => null),
  NativeModulesProxy: {},
  EventEmitter: jest.fn(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  })),
  requireNativeViewManager: jest.fn((viewName) => {
    // 返回一个模拟的 React 组件
    const MockView = (props) => null;
    MockView.displayName = `Mock${viewName}`;
    return MockView;
  }),
}));

// Mock expo package
jest.mock('expo', () => ({
  requireNativeModule: jest.fn((moduleName) => createNativeModuleMock()),
  NativeModule: class NativeModule {},
}));

// Mock React Native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  RN.StyleSheet = {
    create: (styles) => styles,
    flatten: (style) => style,
  };
  
  RN.Platform = {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  };
  
  RN.Dimensions = {
    get: () => ({ width: 375, height: 667 }),
  };
  
  RN.PixelRatio = {
    get: () => 2,
  };
  
  // Mock TurboModuleRegistry
  RN.TurboModuleRegistry = {
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
  };
  
  return RN;
});

// 设置 React Native 需要的全局变量
global.__DEV__ = true;
global.__fbBatchedBridgeConfig = {};

// 禁用 console.error 和 console.warn 在测试中的输出
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};