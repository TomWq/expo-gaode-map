import {
  DeviceType,
  FoldState,
  PlatformDetector,
  isAndroid14Plus,
  isFoldable,
  isIPad,
  isTablet,
  isiOS17Plus,
} from '../PlatformDetector';
import { Dimensions, Platform } from 'react-native';

describe('PlatformDetector', () => {
  beforeEach(() => {
    PlatformDetector.resetCache();
    (Platform as any).OS = 'ios';
    (Platform as any).Version = '17';
    (Dimensions as any).get = jest.fn(() => ({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    }));
    (Dimensions as any).addEventListener = jest.fn(() => ({
      remove: jest.fn(),
    }));
  });

  it('应该缓存并重置系统版本信息', () => {
    const version1 = PlatformDetector.getSystemVersion();
    expect(version1.platform).toBe('ios');
    expect(version1.isIOS17Plus).toBe(true);

    (Platform as any).Version = '16';
    const cached = PlatformDetector.getSystemVersion();
    expect(cached.version).toBe(17);

    PlatformDetector.resetCache();
    const version2 = PlatformDetector.getSystemVersion();
    expect(version2.version).toBe(16);
    expect(version2.isIOS17Plus).toBe(false);
  });

  it('应该识别普通手机设备信息', () => {
    const info = PlatformDetector.getDeviceInfo();

    expect(info.type).toBe(DeviceType.PHONE);
    expect(info.isTablet).toBe(false);
    expect(info.isFoldable).toBe(false);
    expect(info.isLandscape).toBe(false);
    expect(info.aspectRatio).toBeGreaterThan(2);
    expect(isTablet()).toBe(false);
    expect(isFoldable()).toBe(false);
  });

  it('应该识别 iPad 并支持多任务', () => {
    (Dimensions as any).get = jest.fn(() => ({
      width: 834,
      height: 1112,
      scale: 2,
      fontScale: 1,
    }));

    const info = PlatformDetector.getDeviceInfo();
    expect(info.type).toBe(DeviceType.TABLET);
    expect(info.isTablet).toBe(true);
    expect(PlatformDetector.isIPad()).toBe(true);
    expect(PlatformDetector.supportsMultitasking()).toBe(true);
    expect(isIPad()).toBe(true);
  });

  it('应该识别 Android 14 折叠屏并判断折叠状态', () => {
    (Platform as any).OS = 'android';
    (Platform as any).Version = '34';
    (Dimensions as any).get = jest.fn(() => ({
      width: 884,
      height: 2208,
      scale: 3,
      fontScale: 1,
    }));
    PlatformDetector.resetCache();

    const version = PlatformDetector.getSystemVersion();
    const info = PlatformDetector.getDeviceInfo();

    expect(version.isAndroid14Plus).toBe(true);
    expect(info.type).toBe(DeviceType.FOLDABLE);
    expect(info.isFoldable).toBe(true);
    expect(PlatformDetector.getFoldState()).toBe(FoldState.FOLDED);
    expect(isAndroid14Plus()).toBe(true);
    expect(isiOS17Plus()).toBe(false);
  });

  it('非折叠屏设备的折叠状态应为 unknown', () => {
    expect(PlatformDetector.getFoldState()).toBe(FoldState.UNKNOWN);
  });

  it('应该监听尺寸变化并在回调前刷新缓存', () => {
    const remove = jest.fn();
    let changeHandler: (() => void) | undefined;

    (Dimensions as any).addEventListener = jest.fn((_event: string, handler: () => void) => {
      changeHandler = handler;
      return { remove };
    });

    const callback = jest.fn();
    PlatformDetector.getDeviceInfo();

    (Dimensions as any).get = jest.fn(() => ({
      width: 900,
      height: 1200,
      scale: 2,
      fontScale: 1,
    }));

    const unsubscribe = PlatformDetector.addDimensionChangeListener(callback);
    changeHandler?.();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].isTablet).toBe(true);

    unsubscribe();
    expect(remove).toHaveBeenCalled();
  });
});
