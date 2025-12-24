/**
 * Jest setup file for @expo-gaode-map/core
 * 配置全局 mocks 和测试环境
 */

// 创建原生模块 Mock
const createNativeModuleMock = () => ({
  initSDK: jest.fn(),
  getVersion: jest.fn(() => '1.0.0'),
  isNativeSDKConfigured: jest.fn(() => true),
  getCurrentLocation: jest.fn(() => Promise.resolve({
    latitude: 39.9,
    longitude: 116.4,
    accuracy: 10,
    altitude: 50,
    speed: 0,
    bearing: 0,
    timestamp: Date.now(),
  })),
  start: jest.fn(),
  stop: jest.fn(),
  isStarted: jest.fn(() => Promise.resolve(false)),
  coordinateConvert: jest.fn((coord) => Promise.resolve(coord)),
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
    poolSize: 2,
    isPreloading: false,
    maxPoolSize: 5,
  })),
  clearMapPreloadPool: jest.fn(),
  hasPreloadedMapView: jest.fn(() => false),
  configurePreload: jest.fn(),
  startPreload: jest.fn(),
  stopPreload: jest.fn(),
  getPreloadStatus: jest.fn(() => 'idle'),
  // 几何计算相关
  distanceBetweenCoordinates: jest.fn((coord1, coord2) => {
    // 如果坐标相同,返回0;否则返回一个模拟距离
    if (coord1.latitude === coord2.latitude && coord1.longitude === coord2.longitude) {
      return Promise.resolve(0);
    }
    return Promise.resolve(1000); // 模拟1000米距离
  }),
  isPointInCircle: jest.fn(() => Promise.resolve(true)),
  isPointInPolygon: jest.fn(() => Promise.resolve(true)),
  calculatePolygonArea: jest.fn(() => Promise.resolve(1000000)), // 模拟面积
  calculateRectangleArea: jest.fn(() => Promise.resolve(500000)), // 模拟面积
  // 权限相关
  checkLocationPermission: jest.fn(() => Promise.resolve({
    granted: true,
    canAskAgain: true,
    status: 'granted'
  })),
  requestLocationPermission: jest.fn(() => Promise.resolve({
    granted: true,
    canAskAgain: true,
    status: 'granted'
  })),
  requestBackgroundLocationPermission: jest.fn(() => Promise.resolve({
    granted: true,
    canAskAgain: true,
    status: 'granted'
  })),
  openAppSettings: jest.fn(),
});

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeModule: jest.fn((moduleName) => createNativeModuleMock()),
  requireOptionalNativeModule: jest.fn(() => null),
  NativeModule: class NativeModule {},
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

  NativeModulesProxy: {},
}));

// 同时 Mock expo package
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