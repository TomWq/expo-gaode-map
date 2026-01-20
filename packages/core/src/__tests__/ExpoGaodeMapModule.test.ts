/**
 * ExpoGaodeMapModule 单元测试
 * 测试核心模块的功能
 */

import ExpoGaodeMapModule, { getSDKConfig, getWebKey } from '../ExpoGaodeMapModule';
import { CoordinateType } from '../types';

describe('ExpoGaodeMapModule', () => {
  
  beforeEach(() => {
    // 清除所有 mock
    jest.clearAllMocks();
  });

  describe('SDK 初始化', () => {
    it('应该能够初始化 SDK', () => {
      const config = {
        androidKey: 'test-android-key',
        iosKey: 'test-ios-key',
        webKey: 'test-web-key',
      };
      
      ExpoGaodeMapModule.initSDK(config);
      
      // 验证配置被保存
      expect(getSDKConfig()).toEqual(config);
      expect(getWebKey()).toBe('test-web-key');
    });

    it('应该能够获取 SDK 版本', () => {
      const version = ExpoGaodeMapModule.getVersion();
      expect(version).toBe('1.0.0');
    });
  });

  describe('定位功能', () => {
    it('应该能够检查定位权限', async () => {
      const permission = await ExpoGaodeMapModule.checkLocationPermission();
      expect(permission).toBeDefined();
      expect(permission.granted).toBe(true);
    });

    it('应该能够请求定位权限', async () => {
      const permission = await ExpoGaodeMapModule.requestLocationPermission();
      expect(permission).toBeDefined();
      expect(permission.granted).toBe(true);
    });

    it('应该能够获取当前位置', async () => {
      const location = await ExpoGaodeMapModule.getCurrentLocation?.();
      
      expect(location).toBeDefined();
      expect(location.latitude).toBeDefined();
      expect(location.longitude).toBeDefined();
      expect(typeof location.latitude).toBe('number');
      expect(typeof location.longitude).toBe('number');
    });

    it('位置数据应该在合理范围内', async () => {
      const location = await ExpoGaodeMapModule.getCurrentLocation?.();
      
      if (location) {
        expect(location.latitude).toBeGreaterThanOrEqual(-90);
        expect(location.latitude).toBeLessThanOrEqual(90);
        expect(location.longitude).toBeGreaterThanOrEqual(-180);
        expect(location.longitude).toBeLessThanOrEqual(180);
      }
    });
  });

  describe('定位监听器', () => {
    it('应该能够添加定位监听器', () => {
      const listener = jest.fn();
      const subscription = ExpoGaodeMapModule.addLocationListener?.(listener);
      
      expect(subscription).toBeDefined();
      expect(subscription.remove).toBeDefined();
      expect(typeof subscription.remove).toBe('function');
    });

    it('应该能够移除定位监听器', () => {
      const listener = jest.fn();
      const subscription = ExpoGaodeMapModule.addLocationListener?.(listener);
      
      expect(() => {
        subscription.remove();
      }).not.toThrow();
    });
  });

  describe('定位配置', () => {
    it('应该能够设置逆地理编码', () => {
      expect(() => {
        ExpoGaodeMapModule.setLocatingWithReGeocode?.(true);
      }).not.toThrow();
    });

    it('应该能够设置定位间隔', () => {
      expect(() => {
        ExpoGaodeMapModule.setInterval?.(2000);
      }).not.toThrow();
    });

    it('应该能够设置定位超时', () => {
      expect(() => {
        ExpoGaodeMapModule.setLocationTimeout?.(10);
      }).not.toThrow();
    });
  });

  describe('坐标转换', () => {
    it('应该能够转换坐标', async () => {
      const coordinate = { latitude: 39.9, longitude: 116.4 };
      const converted = await ExpoGaodeMapModule.coordinateConvert(coordinate, CoordinateType.GPS);
      
      expect(converted).toBeDefined();
      expect(converted.latitude).toBe(39.9);
      expect(converted.longitude).toBe(116.4);
    });
  });


  describe('配置管理', () => {
    it('允许不提供任何 API Key（原生端可能已配置）', () => {
      // 允许空配置，因为原生端可能已通过 Config Plugin 配置
      expect(() => {
        ExpoGaodeMapModule.initSDK({});
      }).not.toThrow();
    });

    it('应该能够获取 webKey', () => {
      const config = {
        androidKey: 'android',
        iosKey: 'ios',
        webKey: 'web-key-test',
      };
      
      ExpoGaodeMapModule.initSDK(config);
      expect(getWebKey()).toBe('web-key-test');
    });

    it('没有 webKey 时应该返回 undefined', () => {
      ExpoGaodeMapModule.initSDK({
        androidKey: 'android',
        iosKey: 'ios',
      });
      
      expect(getWebKey()).toBeUndefined();
    });

    it('应该能够检查 SDK 是否已初始化', () => {
      ExpoGaodeMapModule.initSDK({
        androidKey: 'test-key',
      });
      
      expect(ExpoGaodeMapModule.isSDKInitialized()).toBe(true);
    });
  });

  describe('定位控制', () => {
    it('应该能够开始定位', () => {
      // 确保 SDK 已初始化
      ExpoGaodeMapModule.initSDK({
        androidKey: 'test-key',
        iosKey: 'test-key',
      });
      
      expect(() => {
        ExpoGaodeMapModule.start?.();
      }).not.toThrow();
    });

    it('应该能够停止定位', () => {
      expect(() => {
        ExpoGaodeMapModule.stop?.();
      }).not.toThrow();
    });

    it('应该能够检查是否正在定位', async () => {
      const isStarted = await ExpoGaodeMapModule.isStarted?.();
      expect(typeof isStarted).toBe('boolean');
    });
  });

  describe('Android 定位配置', () => {
    it('应该能够设置定位模式', () => {
      expect(() => {
        ExpoGaodeMapModule.setLocationMode?.(2);
      }).not.toThrow();
    });

    it('应该能够设置单次定位', () => {
      expect(() => {
        ExpoGaodeMapModule.setOnceLocation?.(true);
      }).not.toThrow();
    });

    it('应该能够设置传感器使用', () => {
      expect(() => {
        ExpoGaodeMapModule.setSensorEnable?.(true);
      }).not.toThrow();
    });

    it('应该能够设置 WiFi 扫描', () => {
      expect(() => {
        ExpoGaodeMapModule.setWifiScan?.(true);
      }).not.toThrow();
    });

    it('应该能够设置 GPS 优先', () => {
      expect(() => {
        ExpoGaodeMapModule.setGpsFirst?.(true);
      }).not.toThrow();
    });

    it('应该能够设置等待 WiFi 刷新', () => {
      expect(() => {
        ExpoGaodeMapModule.setOnceLocationLatest?.(true);
      }).not.toThrow();
    });

    it('应该能够设置地理编码语言', () => {
      expect(() => {
        ExpoGaodeMapModule.setGeoLanguage?.('zh-CN');
      }).not.toThrow();
    });

    it('应该能够设置缓存策略', () => {
      expect(() => {
        ExpoGaodeMapModule.setLocationCacheEnable?.(true);
      }).not.toThrow();
    });

    it('应该能够设置网络超时', () => {
      expect(() => {
        ExpoGaodeMapModule.setHttpTimeOut?.(30000);
      }).not.toThrow();
    });
  });

  describe('iOS 定位配置', () => {
    it('应该能够设置期望精度', () => {
      expect(() => {
        ExpoGaodeMapModule.setDesiredAccuracy?.(0);
      }).not.toThrow();
    });

    it('应该能够设置逆地理编码超时', () => {
      expect(() => {
        ExpoGaodeMapModule.setReGeocodeTimeout?.(5);
      }).not.toThrow();
    });

    it('应该能够设置距离过滤器', () => {
      expect(() => {
        ExpoGaodeMapModule.setDistanceFilter?.(10);
      }).not.toThrow();
    });

    it('应该能够设置自动暂停', () => {
      expect(() => {
        ExpoGaodeMapModule.setPausesLocationUpdatesAutomatically?.(true);
      }).not.toThrow();
    });

    it('应该能够设置后台定位', () => {
      expect(() => {
        ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates?.(true);
      }).not.toThrow();
    });

    it('应该能够设置定位协议', () => {
      expect(() => {
        ExpoGaodeMapModule.setLocationProtocol?.('https');
      }).not.toThrow();
    });
  });

  describe('iOS 方向更新', () => {
    it('应该能够开始更新方向', () => {
      expect(() => {
        ExpoGaodeMapModule.startUpdatingHeading?.();
      }).not.toThrow();
    });

    it('应该能够停止更新方向', () => {
      expect(() => {
        ExpoGaodeMapModule.stopUpdatingHeading?.();
      }).not.toThrow();
    });
  });

  describe('几何计算', () => {
    it("应该能够计算点到点的距离", async () => {
      // 检查方法是否存在
      expect(ExpoGaodeMapModule.distanceBetweenCoordinates).toBeDefined();
      
      const distance = await ExpoGaodeMapModule.distanceBetweenCoordinates(
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.9, longitude: 116.4 }
      );
      
      expect(distance).toBeDefined();
      expect(typeof distance).toBe('number');
      // 相同坐标点的距离应该是0
      expect(distance).toBe(0);
    });

    it("应该能够计算两个不同点的距离", async () => {
      const distance = await ExpoGaodeMapModule.distanceBetweenCoordinates(
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.91, longitude: 116.41 }
      );
      
      expect(distance).toBeDefined();
      expect(typeof distance).toBe('number');
      // 不同坐标的距离应该大于0
      expect(distance).toBeGreaterThan(0);
    });

    it("应该判断点是否在圆内", async () => {
      const inCircle = await ExpoGaodeMapModule.isPointInCircle(
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.9, longitude: 116.4 },
        1000
      );
      
      expect(inCircle).toBeDefined();
      expect(typeof inCircle).toBe('boolean');
      // 坐标点在圆内
      expect(inCircle).toBe(true);
    });
    it("应该判断点是否在多边形内", async () => {
      const inPolygon = await ExpoGaodeMapModule.isPointInPolygon(
        { latitude: 39.9, longitude: 116.4 },
        [
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.9, longitude: 116.41 },
          { latitude: 39.91, longitude: 116.41 },
          { latitude: 39.91, longitude: 116.4 },
        ]
      );
      
      expect(inPolygon).toBeDefined();
      expect(typeof inPolygon).toBe('boolean');
      // 坐标点在多边形内
      expect(inPolygon).toBe(true);
    });
    it("应该计算多边形面积", async () => {
      const area = await ExpoGaodeMapModule.calculatePolygonArea([
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.9, longitude: 116.41 },
        { latitude: 39.91, longitude: 116.41 },
        { latitude: 39.91, longitude: 116.4 },
      ]);
      
      expect(area).toBeDefined();
      expect(typeof area).toBe('number');
      // 多边形面积应该大于0
      expect(area).toBeGreaterThan(0);
    });
    it("应该计算矩形面积", async () => {
      const area = await ExpoGaodeMapModule.calculateRectangleArea(
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.91, longitude: 116.41 }
      );
      
      expect(area).toBeDefined();
      expect(typeof area).toBe('number');
      // 矩形面积应该大于0
      expect(area).toBeGreaterThan(0);
    });
  });
});