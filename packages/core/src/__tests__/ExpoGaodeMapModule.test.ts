/**
 * ExpoGaodeMapModule 单元测试
 * 测试核心模块的功能
 */

import ExpoGaodeMapModule, { getSDKConfig, getWebKey } from '../ExpoGaodeMapModule';
import { CoordinateType } from '../types';
import { requireNativeModule } from 'expo';

describe('ExpoGaodeMapModule', () => {
  
  beforeEach(() => {
    // 清除所有 mock
    jest.clearAllMocks();
  });

  const getNativeMock = () => requireNativeModule('ExpoGaodeMap') as {
    [key: string]: any;
    coordinateConvert: jest.Mock;
    setGeoLanguage: jest.Mock;
    getVersion: jest.Mock;
    addListener: jest.Mock;
    checkLocationPermission: jest.Mock;
    requestLocationPermission: jest.Mock;
    requestBackgroundLocationPermission: jest.Mock;
  };

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
      expect(permission.status).toBe('granted');
    });

    it('应该能够请求定位权限', async () => {
      const permission = await ExpoGaodeMapModule.requestLocationPermission();
      expect(permission).toBeDefined();
      expect(permission.granted).toBe(true);
      expect(permission.status).toBe('granted');
    });

    it('应该归一化 iOS 风格的权限状态', async () => {
      const nativeModule = getNativeMock();
      nativeModule.checkLocationPermission.mockResolvedValue({
        granted: true,
        status: 'authorizedWhenInUse',
        backgroundLocation: false,
      });

      const permission = await ExpoGaodeMapModule.checkLocationPermission();

      expect(permission).toMatchObject({
        granted: true,
        status: 'granted',
        canAskAgain: true,
        backgroundLocation: false,
      });
    });

    it('应该归一化被拒绝且不可再次请求的权限状态', async () => {
      const nativeModule = getNativeMock();
      nativeModule.requestLocationPermission.mockResolvedValue({
        granted: false,
        status: 'denied',
        isPermanentlyDenied: true,
      });

      const permission = await ExpoGaodeMapModule.requestLocationPermission();

      expect(permission).toMatchObject({
        granted: false,
        status: 'denied',
        canAskAgain: false,
        isPermanentlyDenied: true,
      });
    });

    it('应该能够获取当前位置', async () => {
      const location = await ExpoGaodeMapModule.getCurrentLocation?.();
      
      expect(location).toBeDefined();
      expect(location.latitude).toBeDefined();
      expect(location.longitude).toBeDefined();
      expect(location.heading).toBeDefined();
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

    it('应该能够添加方向监听器并归一化事件数据', () => {
      const nativeModule = getNativeMock();
      const remove = jest.fn();
      nativeModule.addListener.mockImplementation(
        (_eventName: string, listener: (payload: Record<string, unknown>) => void) => {
          listener({
            heading: 123,
            accuracy: 5,
            timestamp: 1000,
          });
          return { remove };
        }
      );

      const listener = jest.fn();
      const subscription = ExpoGaodeMapModule.addHeadingListener(listener);

      expect(nativeModule.addListener).toHaveBeenCalledWith(
        'onHeadingUpdate',
        expect.any(Function)
      );
      expect(listener).toHaveBeenCalledWith({
        magneticHeading: 123,
        trueHeading: 123,
        headingAccuracy: 5,
        x: 0,
        y: 0,
        z: 0,
        timestamp: 1000,
      });
      expect(subscription.remove).toBe(remove);
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

    it('AMap 坐标系应直接返回，不调用原生转换', async () => {
      const nativeModule = getNativeMock();
      const coordinate = { latitude: 31.2304, longitude: 121.4737 };

      const converted = await ExpoGaodeMapModule.coordinateConvert(coordinate, CoordinateType.AMap);

      expect(converted).toEqual(coordinate);
      expect(nativeModule.coordinateConvert).not.toHaveBeenCalled();
    });

    it('百度坐标应映射到原生 Baidu 类型值', async () => {
      const nativeModule = getNativeMock();
      const coordinate = { latitude: 39.9, longitude: 116.4 };

      await ExpoGaodeMapModule.coordinateConvert(coordinate, CoordinateType.Baidu);

      expect(nativeModule.coordinateConvert).toHaveBeenCalledWith(coordinate, 2);
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

    it('应该同步完整隐私配置', () => {
      const nativeModule = getNativeMock();
      nativeModule.setPrivacyVersion = jest.fn();
      nativeModule.setPrivacyShow = jest.fn();
      nativeModule.setPrivacyAgree = jest.fn();

      ExpoGaodeMapModule.setPrivacyConfig({
        hasShow: true,
        hasContainsPrivacy: true,
        hasAgree: true,
        privacyVersion: 'v2',
      });

      expect(nativeModule.setPrivacyVersion).toHaveBeenCalledWith('v2');
      expect(nativeModule.setPrivacyShow).toHaveBeenCalledWith(true, true);
      expect(nativeModule.setPrivacyAgree).toHaveBeenCalledWith(true);
    });

    it('应该兼容旧版隐私设置接口', () => {
      const nativeModule = getNativeMock();
      nativeModule.setPrivacyShow = jest.fn();
      nativeModule.setPrivacyAgree = jest.fn();
      nativeModule.setPrivacyVersion = jest.fn();
      nativeModule.resetPrivacyConsent = jest.fn();

      ExpoGaodeMapModule.setPrivacyShow(true);
      ExpoGaodeMapModule.setPrivacyAgree(false);
      ExpoGaodeMapModule.setPrivacyVersion('v3');
      ExpoGaodeMapModule.resetPrivacyConsent();

      expect(nativeModule.setPrivacyShow).toHaveBeenCalledWith(true, true);
      expect(nativeModule.setPrivacyAgree).toHaveBeenCalledWith(false);
      expect(nativeModule.setPrivacyVersion).toHaveBeenCalledWith('v3');
      expect(nativeModule.resetPrivacyConsent).toHaveBeenCalled();
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

    it('原生版本方法失败时应该回退为默认值', async () => {
      const nativeModule = getNativeMock();
      nativeModule.getVersion.mockImplementation(() => {
        throw new Error('boom');
      });
      nativeModule.isStarted.mockImplementation(() => {
        throw new Error('boom');
      });

      expect(ExpoGaodeMapModule.getVersion()).toBe('0.0.0');
      await expect(ExpoGaodeMapModule.isStarted()).resolves.toBe(false);
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

    it('应该将常见语言别名归一化后再传给原生层', () => {
      const nativeModule = getNativeMock();

      ExpoGaodeMapModule.setGeoLanguage?.('zh-CN');
      ExpoGaodeMapModule.setGeoLanguage?.('en');
      ExpoGaodeMapModule.setGeoLanguage?.('DEFAULT');

      expect(nativeModule.setGeoLanguage).toHaveBeenNthCalledWith(1, 'ZH');
      expect(nativeModule.setGeoLanguage).toHaveBeenNthCalledWith(2, 'EN');
      expect(nativeModule.setGeoLanguage).toHaveBeenNthCalledWith(3, 'DEFAULT');
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
    it('应该支持 calculateDistanceBetweenPoints 别名方法', () => {
      const distance = ExpoGaodeMapModule.calculateDistanceBetweenPoints(
        [116.4, 39.9],
        [116.41, 39.91]
      );

      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
    });

    it("应该能够计算点到点的距离", async () => {
      // 检查方法是否存在
      expect(ExpoGaodeMapModule.distanceBetweenCoordinates).toBeDefined();
      
      const distance =  ExpoGaodeMapModule.distanceBetweenCoordinates(
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.9, longitude: 116.4 }
      );
      
      expect(distance).toBeDefined();
      expect(typeof distance).toBe('number');
      // 相同坐标点的距离应该是0
      expect(distance).toBe(0);
    });

    it("应该能够计算两个不同点的距离", async () => {
      const distance =  ExpoGaodeMapModule.distanceBetweenCoordinates(
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.91, longitude: 116.41 }
      );
      
      expect(distance).toBeDefined();
      expect(typeof distance).toBe('number');
      // 不同坐标的距离应该大于0
      expect(distance).toBeGreaterThan(0);
    });

    it("应该判断点是否在圆内", async () => {
      const inCircle =  ExpoGaodeMapModule.isPointInCircle(
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.9, longitude: 116.4 },
        1000
      );
      
      expect(inCircle).toBeDefined();
      expect(typeof inCircle).toBe('boolean');
      // 坐标点在圆内
      expect(inCircle).toBe(true);
    });
    it("应该判断点是否在多边形内 (支持各种 LatLngPoint 格式)", async () => {
      // 测试对象格式
      const inPolygon1 =  ExpoGaodeMapModule.isPointInPolygon(
        { latitude: 39.9, longitude: 116.4 },
        [
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.9, longitude: 116.41 },
          { latitude: 39.91, longitude: 116.41 },
          { latitude: 39.91, longitude: 116.4 },
        ]
      );
      expect(inPolygon1).toBe(true);

      // 测试 [number, number] 数组格式
      const inPolygon2 =  ExpoGaodeMapModule.isPointInPolygon(
        [116.4, 39.9],
        [
          [116.4, 39.9],
          [116.41, 39.9],
          [116.41, 39.91],
          [116.4, 39.91],
        ]
      );
      expect(inPolygon2).toBe(true);

      // 测试 number[] 格式
      const inPolygon3 =  ExpoGaodeMapModule.isPointInPolygon(
        [116.4, 39.9, 0],
        [
          [116.4, 39.9, 0],
          [116.41, 39.9, 0],
          [116.41, 39.91, 0],
          [116.4, 39.91, 0],
        ]
      );
      expect(inPolygon3).toBe(true);
    });
    it("应该计算多边形面积", async () => {
      const area =  ExpoGaodeMapModule.calculatePolygonArea([
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
    it("应该支持嵌套多边形参数类型", async () => {
      const nestedPolygon = [
        [
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.9, longitude: 116.41 },
          { latitude: 39.91, longitude: 116.41 },
          { latitude: 39.91, longitude: 116.4 },
        ],
        [
          { latitude: 39.902, longitude: 116.402 },
          { latitude: 39.902, longitude: 116.408 },
          { latitude: 39.908, longitude: 116.408 },
          { latitude: 39.908, longitude: 116.402 },
        ],
      ] as const;

      const isInside = ExpoGaodeMapModule.isPointInPolygon(
        { latitude: 39.901, longitude: 116.401 },
        nestedPolygon as unknown as Parameters<typeof ExpoGaodeMapModule.isPointInPolygon>[1]
      );
      const area = ExpoGaodeMapModule.calculatePolygonArea(
        nestedPolygon as unknown as Parameters<typeof ExpoGaodeMapModule.calculatePolygonArea>[0]
      );

      expect(typeof isInside).toBe('boolean');
      expect(typeof area).toBe('number');
    });
    it("应该计算矩形面积", async () => {
      const area =  ExpoGaodeMapModule.calculateRectangleArea(
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.91, longitude: 116.41 }
      );
      
      expect(area).toBeDefined();
      expect(typeof area).toBe('number');
      // 矩形面积应该大于0
      expect(area).toBeGreaterThan(0);
    });

    it('应该计算路径边界并处理空输入', () => {
      const nativeModule = getNativeMock();
      nativeModule.calculatePathBounds = jest.fn(() => ({
        north: 40,
        south: 39,
        east: 117,
        west: 116,
        center: { latitude: 39.5, longitude: 116.5 },
      }));

      expect(ExpoGaodeMapModule.calculatePathBounds([])).toBeNull();
      expect(
        ExpoGaodeMapModule.calculatePathBounds([
          [116.4, 39.9],
          [116.41, 39.91],
        ])
      ).toEqual({
        north: 40,
        south: 39,
        east: 117,
        west: 116,
        center: { latitude: 39.5, longitude: 116.5 },
      });
    });

    it('应该支持 GeoHash、路径长度、路径点查询与 polyline 解析', () => {
      const nativeModule = getNativeMock();
      nativeModule.encodeGeoHash = jest.fn(() => 'wx4g0ec1');
      nativeModule.calculatePathLength = jest.fn(() => 1234);
      nativeModule.getPointAtDistance = jest.fn(() => ({
        latitude: 39.905,
        longitude: 116.405,
        angle: 45,
      }));
      nativeModule.parsePolyline = jest.fn((value: string) =>
        value.split(';').map((item) => {
          const [longitude, latitude] = item.split(',').map(Number);
          return { latitude, longitude };
        })
      );

      expect(ExpoGaodeMapModule.encodeGeoHash([116.4, 39.9], 8)).toBe('wx4g0ec1');
      expect(
        ExpoGaodeMapModule.calculatePathLength([
          [116.4, 39.9],
          [116.41, 39.91],
        ])
      ).toBe(1234);
      expect(
        ExpoGaodeMapModule.getPointAtDistance(
          [
            [116.4, 39.9],
            [116.41, 39.91],
          ],
          100
        )
      ).toEqual({
        latitude: 39.905,
        longitude: 116.405,
        angle: 45,
      });
      expect(
        ExpoGaodeMapModule.parsePolyline({ polyline: '116.4,39.9;116.41,39.91' })
      ).toEqual([
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.91, longitude: 116.41 },
      ]);
      expect(ExpoGaodeMapModule.parsePolyline('')).toEqual([]);
    });

    it('应该支持 tile/pixel 转换与多边形索引映射', () => {
      const nativeModule = getNativeMock();
      nativeModule.latLngToTile = jest.fn(() => ({ x: 1, y: 2, z: 10 }));
      nativeModule.tileToLatLng = jest.fn(() => ({ latitude: 39.9, longitude: 116.4 }));
      nativeModule.latLngToPixel = jest.fn(() => ({ x: 256, y: 512 }));
      nativeModule.pixelToLatLng = jest.fn(() => ({ latitude: 39.91, longitude: 116.41 }));
      nativeModule.findPointInPolygons = jest.fn(() => 1);

      expect(ExpoGaodeMapModule.latLngToTile([116.4, 39.9], 10)).toEqual({ x: 1, y: 2, z: 10 });
      expect(ExpoGaodeMapModule.tileToLatLng({ x: 1, y: 2, z: 10 })).toEqual({
        latitude: 39.9,
        longitude: 116.4,
      });
      expect(ExpoGaodeMapModule.latLngToPixel([116.4, 39.9], 10)).toEqual({ x: 256, y: 512 });
      expect(ExpoGaodeMapModule.pixelToLatLng({ x: 256, y: 512 }, 10)).toEqual({
        latitude: 39.91,
        longitude: 116.41,
      });
      expect(
        ExpoGaodeMapModule.findPointInPolygons(
          [116.401, 39.901],
          [
            [
              [
                [116.4, 39.9],
                [116.42, 39.9],
                [116.42, 39.92],
                [116.4, 39.92],
              ],
              [
                [116.405, 39.905],
                [116.406, 39.905],
                [116.406, 39.906],
                [116.405, 39.906],
              ],
            ],
            [
              [
                [117.0, 40.0],
                [117.1, 40.0],
                [117.1, 40.1],
                [117.0, 40.1],
              ],
            ],
          ]
        )
      ).toBe(0);
    });

    it('应该支持热力网格生成与几个降级分支', () => {
      const nativeModule = getNativeMock();
      nativeModule.generateHeatmapGrid = jest.fn(() => [
        { latitude: 39.9, longitude: 116.4, intensity: 2 },
      ]);
      nativeModule.setLoadWorldVectorMap = jest.fn(() => {
        throw new Error('fail');
      });
      nativeModule.parsePolyline = jest.fn(() => {
        throw new Error('fail');
      });
      nativeModule.calculatePathBounds = jest.fn(() => {
        throw new Error('fail');
      });
      nativeModule.calculatePathLength = jest.fn(() => {
        throw new Error('fail');
      });
      nativeModule.latLngToTile = jest.fn(() => {
        throw new Error('fail');
      });
      nativeModule.findPointInPolygons = jest.fn(() => {
        throw new Error('fail');
      });

      expect(
        ExpoGaodeMapModule.generateHeatmapGrid(
          [{ latitude: 39.9, longitude: 116.4, weight: 2 }],
          100
        )
      ).toEqual([{ latitude: 39.9, longitude: 116.4, intensity: 2 }]);
      expect(ExpoGaodeMapModule.generateHeatmapGrid([], 100)).toEqual([]);

      expect(() => ExpoGaodeMapModule.setLoadWorldVectorMap(true)).not.toThrow();
      expect(ExpoGaodeMapModule.parsePolyline('116.4,39.9')).toEqual([]);
      expect(
        ExpoGaodeMapModule.calculatePathBounds([
          [116.4, 39.9],
          [116.41, 39.91],
        ])
      ).toBeNull();
      expect(
        ExpoGaodeMapModule.calculatePathLength([
          [116.4, 39.9],
          [116.41, 39.91],
        ])
      ).toBe(0);
      expect(ExpoGaodeMapModule.latLngToTile([116.4, 39.9], 10)).toBeNull();
      expect(
        ExpoGaodeMapModule.findPointInPolygons([116.4, 39.9], [
          [
            [116.4, 39.9],
            [116.41, 39.9],
            [116.41, 39.91],
            [116.4, 39.91],
          ],
        ])
      ).toBe(-1);
    });
  });
});
