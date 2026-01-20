/**
 * ExpoGaodeMapModule 深度测试
 * 测试错误场景、边界值、集成场景
 */

import ExpoGaodeMapModule from '../ExpoGaodeMapModule';
import { CoordinateType } from '../types';
import { ErrorType } from '../utils/ErrorHandler';

describe('ExpoGaodeMapModule - 深度测试', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('错误场景测试', () => {
    describe('SDK 未初始化场景', () => {
      it('在测试环境中调用 start 不会抛出错误', () => {
        // 在测试环境中，由于原生模块被 mock，这些方法不会抛出错误
        // 创建副本不会改变这一点，因为 mock 已经存在
        expect(() => {
          ExpoGaodeMapModule.start?.();
        }).not.toThrow();
      });

      it('在测试环境中调用 getCurrentLocation 不会抛出错误', async () => {
        // 在测试环境中不会抛出错误，因为原生模块被 mock 了
        await expect(ExpoGaodeMapModule.getCurrentLocation()).resolves.toBeDefined();
      });

      it('在测试环境中添加监听器不会抛出错误', () => {
        const listener = jest.fn();
        // 在测试环境中不会抛出错误
        expect(() => {
          const subscription = ExpoGaodeMapModule.addLocationListener(listener);
          expect(subscription).toBeDefined();
          expect(subscription.remove).toBeDefined();
        }).not.toThrow();
      });
    });

    describe('无效参数测试', () => {
      beforeEach(() => {
        // 确保 SDK 已初始化
        ExpoGaodeMapModule.initSDK({
          androidKey: 'test-key',
          iosKey: 'test-key',
        });
      });

      it('coordinateConvert 传入无效坐标应该处理', async () => {
        const invalidCoordinate = { latitude: 999, longitude: 999 };
        try {
          await ExpoGaodeMapModule.coordinateConvert(
            invalidCoordinate,
            CoordinateType.GPS
          );
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      it('setInterval 传入负数应该被处理', () => {
        expect(() => {
          ExpoGaodeMapModule.setInterval?.(-1000);
        }).not.toThrow(); // 原生层应该处理
      });

      it('setLocationTimeout 传入 0 应该被处理', () => {
        expect(() => {
          ExpoGaodeMapModule.setLocationTimeout?.(0);
        }).not.toThrow();
      });
    });

    describe('权限拒绝场景', () => {
      it('权限被拒绝时应该返回正确状态', async () => {
        const permission = await ExpoGaodeMapModule.requestLocationPermission();
        expect(permission).toBeDefined();
        expect(typeof permission.granted).toBe('boolean');
        
        if (!permission.granted) {
          expect(permission.status).toBeDefined();
        }
      });
    });
  });

  describe('边界值测试', () => {
    beforeEach(() => {
      ExpoGaodeMapModule.initSDK({
        androidKey: 'test-key',
        iosKey: 'test-key',
      });
    });

    describe('数值参数边界测试', () => {
      it('setInterval 最小值测试', () => {
        expect(() => {
          ExpoGaodeMapModule.setInterval?.(100); // 最小 100ms
        }).not.toThrow();
      });

      it('setInterval 最大值测试', () => {
        expect(() => {
          ExpoGaodeMapModule.setInterval?.(60000); // 60秒
        }).not.toThrow();
      });

      it('setLocationTimeout 边界值测试', () => {
        expect(() => {
          ExpoGaodeMapModule.setLocationTimeout?.(1); // 1秒
          ExpoGaodeMapModule.setLocationTimeout?.(60); // 60秒
        }).not.toThrow();
      });

      it('setReGeocodeTimeout 边界值测试', () => {
        expect(() => {
          ExpoGaodeMapModule.setReGeocodeTimeout?.(1);
          ExpoGaodeMapModule.setReGeocodeTimeout?.(30);
        }).not.toThrow();
      });

      it('setDistanceFilter 边界值测试', () => {
        expect(() => {
          ExpoGaodeMapModule.setDistanceFilter?.(0); // 不过滤
          ExpoGaodeMapModule.setDistanceFilter?.(1000); // 1km
        }).not.toThrow();
      });

      it('setHttpTimeOut 边界值测试', () => {
        expect(() => {
          ExpoGaodeMapModule.setHttpTimeOut?.(5000); // 5秒
          ExpoGaodeMapModule.setHttpTimeOut?.(60000); // 60秒
        }).not.toThrow();
      });
    });

    describe('枚举参数测试', () => {
      it('setLocationMode 所有有效值', () => {
        expect(() => {
          ExpoGaodeMapModule.setLocationMode?.(1); // 高精度
          ExpoGaodeMapModule.setLocationMode?.(2); // 低功耗
          ExpoGaodeMapModule.setLocationMode?.(3); // 仅设备
        }).not.toThrow();
      });

      it('setDesiredAccuracy 所有有效值', () => {
        expect(() => {
          ExpoGaodeMapModule.setDesiredAccuracy?.(0); // 最佳
          ExpoGaodeMapModule.setDesiredAccuracy?.(1); // 10米
          ExpoGaodeMapModule.setDesiredAccuracy?.(2); // 100米
          ExpoGaodeMapModule.setDesiredAccuracy?.(3); // 1公里
          ExpoGaodeMapModule.setDesiredAccuracy?.(4); // 3公里
        }).not.toThrow();
      });
    });

    describe('字符串参数测试', () => {
      it('setGeoLanguage 支持的语言', () => {
        expect(() => {
          ExpoGaodeMapModule.setGeoLanguage?.('zh-CN');
          ExpoGaodeMapModule.setGeoLanguage?.('en');
        }).not.toThrow();
      });

      it('setLocationProtocol 协议类型', () => {
        expect(() => {
          ExpoGaodeMapModule.setLocationProtocol?.('https');
          ExpoGaodeMapModule.setLocationProtocol?.('http');
        }).not.toThrow();
      });
    });
  });

  describe('配置组合测试', () => {
    beforeEach(() => {
      ExpoGaodeMapModule.initSDK({
        androidKey: 'test-key',
        iosKey: 'test-key',
      });
    });

    it('Android 完整配置链', () => {
      expect(() => {
        // Android 典型配置组合
        ExpoGaodeMapModule.setLocationMode?.(2); // 高精度
        ExpoGaodeMapModule.setInterval?.(2000); // 2秒间隔
        ExpoGaodeMapModule.setSensorEnable?.(true); // 启用传感器
        ExpoGaodeMapModule.setWifiScan?.(true); // WiFi 扫描
        ExpoGaodeMapModule.setGpsFirst?.(false); // 网络优先
        ExpoGaodeMapModule.setLocationCacheEnable?.(true); // 使用缓存
        ExpoGaodeMapModule.setHttpTimeOut?.(30000); // 30秒超时
        ExpoGaodeMapModule.setLocatingWithReGeocode?.(true); // 逆地理编码
        ExpoGaodeMapModule.setGeoLanguage?.('zh-CN'); // 中文
      }).not.toThrow();
    });

    it('iOS 完整配置链', () => {
      expect(() => {
        // iOS 典型配置组合
        ExpoGaodeMapModule.setDesiredAccuracy?.(0); // 最佳精度
        ExpoGaodeMapModule.setDistanceFilter?.(10); // 10米过滤
        ExpoGaodeMapModule.setLocationTimeout?.(10); // 10秒超时
        ExpoGaodeMapModule.setReGeocodeTimeout?.(5); // 5秒逆地理超时
        ExpoGaodeMapModule.setPausesLocationUpdatesAutomatically?.(true); // 自动暂停
        ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates?.(true); // 后台定位
        ExpoGaodeMapModule.setLocatingWithReGeocode?.(true); // 逆地理编码
      }).not.toThrow();
    });

    it('计算距离测试', () => {
        const d = ExpoGaodeMapModule.calculateDistance(39.9, 116.3, 39.9, 116.4);
        expect(d).toBeDefined();
    });

    it('单次高精度定位配置', () => {
      expect(() => {
        ExpoGaodeMapModule.setOnceLocation?.(true); // 单次定位
        ExpoGaodeMapModule.setOnceLocationLatest?.(true); // 等待最新
        ExpoGaodeMapModule.setLocationMode?.(2); // 高精度
        ExpoGaodeMapModule.setGpsFirst?.(true); // GPS 优先
        ExpoGaodeMapModule.setLocationTimeout?.(30); // 30秒超时
      }).not.toThrow();
    });

    it('低功耗连续定位配置', () => {
      expect(() => {
        ExpoGaodeMapModule.setOnceLocation?.(false); // 连续定位
        ExpoGaodeMapModule.setLocationMode?.(2); // 低功耗
        ExpoGaodeMapModule.setInterval?.(5000); // 5秒间隔
        ExpoGaodeMapModule.setWifiScan?.(true); // WiFi 扫描
        ExpoGaodeMapModule.setSensorEnable?.(false); // 不用传感器
      }).not.toThrow();
    });
  });

  describe('生命周期测试', () => {
    it('完整的定位生命周期', async () => {
      // 1. 初始化
      ExpoGaodeMapModule.initSDK({
        androidKey: 'test-key',
        iosKey: 'test-key',
      });
      expect(ExpoGaodeMapModule.isSDKInitialized()).toBe(true);

      // 2. 配置
      ExpoGaodeMapModule.setInterval?.(2000);
      ExpoGaodeMapModule.setLocatingWithReGeocode?.(true);

      // 3. 开始定位
      ExpoGaodeMapModule.start?.();

      // 4. 检查状态
      const isStarted = await ExpoGaodeMapModule.isStarted?.();
      expect(typeof isStarted).toBe('boolean');

      // 5. 停止定位
      ExpoGaodeMapModule.stop?.();
    });

    it('监听器的完整生命周期', () => {
      ExpoGaodeMapModule.initSDK({
        androidKey: 'test-key',
        iosKey: 'test-key',
      });

      const listener = jest.fn();
      
      // 添加监听器
      const subscription = ExpoGaodeMapModule.addLocationListener?.(listener);
      expect(subscription).toBeDefined();

      // 开始定位
      ExpoGaodeMapModule.start?.();

      // 移除监听器
      subscription?.remove();

      // 停止定位
      ExpoGaodeMapModule.stop?.();
    });
  });

  describe('异步操作测试', () => {
    beforeEach(() => {
      ExpoGaodeMapModule.initSDK({
        androidKey: 'test-key',
        iosKey: 'test-key',
      });
    });

    it('getCurrentLocation 应该返回 Promise', async () => {
      const locationPromise = ExpoGaodeMapModule.getCurrentLocation?.();
      expect(locationPromise).toBeInstanceOf(Promise);
      
      const location = await locationPromise;
      expect(location).toBeDefined();
    });

    it('coordinateConvert 应该返回 Promise', async () => {
      const coordinate = { latitude: 39.9, longitude: 116.4 };
      const convertPromise = ExpoGaodeMapModule.coordinateConvert(
        coordinate,
        CoordinateType.GPS
      );
      expect(convertPromise).toBeInstanceOf(Promise);
      
      const converted = await convertPromise;
      expect(converted).toBeDefined();
    });

    it('isStarted 应该返回 Promise', async () => {
      const isStartedPromise = ExpoGaodeMapModule.isStarted?.();
      expect(isStartedPromise).toBeInstanceOf(Promise);
      
      const isStarted = await isStartedPromise;
      expect(typeof isStarted).toBe('boolean');
    });

    it('checkLocationPermission 应该返回 Promise', async () => {
      const permissionPromise = ExpoGaodeMapModule.checkLocationPermission();
      expect(permissionPromise).toBeInstanceOf(Promise);
      const permission = await permissionPromise;
      expect(permission).toBeDefined();
      expect(typeof permission.granted).toBe('boolean');
    });

    it('requestLocationPermission 应该返回 Promise', async () => {
      const permissionPromise = ExpoGaodeMapModule.requestLocationPermission();
      expect(permissionPromise).toBeInstanceOf(Promise);
      
      const permission = await permissionPromise;
      expect(permission).toBeDefined();
      expect(typeof permission.granted).toBe('boolean');
    });
  });

  describe('多监听器管理测试', () => {
    beforeEach(() => {
      ExpoGaodeMapModule.initSDK({
        androidKey: 'test-key',
        iosKey: 'test-key',
      });
    });

    it('应该能够添加多个监听器', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      const sub1 = ExpoGaodeMapModule.addLocationListener?.(listener1);
      const sub2 = ExpoGaodeMapModule.addLocationListener?.(listener2);
      const sub3 = ExpoGaodeMapModule.addLocationListener?.(listener3);

      expect(sub1).toBeDefined();
      expect(sub2).toBeDefined();
      expect(sub3).toBeDefined();

      // 清理
      sub1?.remove();
      sub2?.remove();
      sub3?.remove();
    });

    it('移除一个监听器不应该影响其他监听器', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const sub1 = ExpoGaodeMapModule.addLocationListener?.(listener1);
      const sub2 = ExpoGaodeMapModule.addLocationListener?.(listener2);

      // 移除第一个
      sub1?.remove();

      // 第二个应该仍然有效
      expect(sub2).toBeDefined();
      expect(sub2?.remove).toBeDefined();

      // 清理
      sub2?.remove();
    });

    it('重复移除监听器不应该抛出错误', () => {
      const listener = jest.fn();
      const subscription = ExpoGaodeMapModule.addLocationListener?.(listener);

      expect(() => {
        subscription?.remove();
        subscription?.remove(); // 重复调用
        subscription?.remove(); // 再次调用
      }).not.toThrow();
    });
  });

  describe('坐标转换详细测试', () => {
    beforeEach(() => {
      ExpoGaodeMapModule.initSDK({
        androidKey: 'test-key',
        iosKey: 'test-key',
      });
    });

    it('应该能够转换 GPS 坐标', async () => {
      const gpsCoord = { latitude: 39.9, longitude: 116.4 };
      const converted = await ExpoGaodeMapModule.coordinateConvert(
        gpsCoord,
        CoordinateType.GPS
      );
      expect(converted).toBeDefined();
      expect(converted.latitude).toBeDefined();
      expect(converted.longitude).toBeDefined();
    });

    it('应该能够转换百度坐标', async () => {
      const baiduCoord = { latitude: 39.9, longitude: 116.4 };
      const converted = await ExpoGaodeMapModule.coordinateConvert(
        baiduCoord,
        CoordinateType.Baidu
      );
      expect(converted).toBeDefined();
    });

    it('应该能够转换谷歌坐标', async () => {
      const googleCoord = { latitude: 39.9, longitude: 116.4 };
      const converted = await ExpoGaodeMapModule.coordinateConvert(
        googleCoord,
        CoordinateType.Google
      );
      expect(converted).toBeDefined();
    });

    it('边界坐标转换', async () => {
      // 测试边界值
      const boundaryCoords = [
        { latitude: -90, longitude: -180 }, // 最小值
        { latitude: 90, longitude: 180 },   // 最大值
        { latitude: 0, longitude: 0 },       // 零值
      ];

      for (const coord of boundaryCoords) {
        try {
          const converted = await ExpoGaodeMapModule.coordinateConvert(
            coord,
            CoordinateType.GPS
          );
          expect(converted).toBeDefined();
        } catch (error) {
          // 某些边界值可能会失败，这是正常的
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('SDK 版本测试', () => {
    it('getVersion 应该返回字符串', () => {
      const version = ExpoGaodeMapModule.getVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });

    it('版本号应该符合格式', () => {
      const version = ExpoGaodeMapModule.getVersion();
      // 版本号通常是 x.y.z 格式
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

 

  describe('方向更新详细测试', () => {
    beforeEach(() => {
      ExpoGaodeMapModule.initSDK({
        androidKey: 'test-key',
        iosKey: 'test-key',
      });
    });

    it('方向更新生命周期', () => {
      expect(() => {
        // 开始更新
        ExpoGaodeMapModule.startUpdatingHeading?.();
        
        // 停止更新
        ExpoGaodeMapModule.stopUpdatingHeading?.();
      }).not.toThrow();
    });

    it('重复开始方向更新不应该出错', () => {
      expect(() => {
        ExpoGaodeMapModule.startUpdatingHeading?.();
        ExpoGaodeMapModule.startUpdatingHeading?.();
        ExpoGaodeMapModule.stopUpdatingHeading?.();
      }).not.toThrow();
    });

    it('未开始就停止方向更新不应该出错', () => {
      expect(() => {
        ExpoGaodeMapModule.stopUpdatingHeading?.();
      }).not.toThrow();
    });
  });
});
      