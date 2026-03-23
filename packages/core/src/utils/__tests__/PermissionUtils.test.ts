import { Platform } from 'react-native';

import { PermissionUtils, PermissionManager, LocationPermissionType } from '../PermissionUtils';
import { PlatformDetector } from '../PlatformDetector';

describe('PermissionUtils', () => {
  beforeEach(() => {
    PlatformDetector.resetCache();
    (Platform as any).OS = 'ios';
    (Platform as any).Version = '17';
  });

  it('应该返回当前系统信息', () => {
    const info = PermissionUtils.getSystemInfo();

    expect(info.platform).toBe('ios');
    expect(info.version).toBe(17);
    expect(info.isiOS17Plus).toBe(true);
    expect(info.isAndroid14Plus).toBe(false);
  });

  it('应该返回 Android 14 的前后台权限说明', () => {
    (Platform as any).OS = 'android';
    (Platform as any).Version = '34';
    PlatformDetector.resetCache();

    expect(
      PermissionUtils.getPermissionRationale(LocationPermissionType.FOREGROUND)
    ).toContain('仅在使用应用时允许');
    expect(
      PermissionUtils.getPermissionRationale(LocationPermissionType.BACKGROUND)
    ).toContain('始终访问位置权限');
    expect(
      PermissionUtils.getPermissionRationale(LocationPermissionType.FOREGROUND_AND_BACKGROUND)
    ).toContain('我们会先请求前台权限');
  });

  it('应该返回 iOS 17 的权限与精确位置说明', () => {
    const foreground = PermissionUtils.getPermissionRationale(LocationPermissionType.FOREGROUND);
    const background = PermissionUtils.getPermissionRationale(
      LocationPermissionType.FOREGROUND_AND_BACKGROUND
    );
    const accuracy = PermissionUtils.getAccuracyRationale();

    expect(foreground).toContain('一次');
    expect(background).toContain('始终访问位置权限');
    expect(accuracy).toContain('模糊位置');
  });

  it('应该返回最佳实践建议', () => {
    const practices = PermissionUtils.getBestPractices();

    expect(practices.android14.length).toBeGreaterThan(0);
    expect(practices.ios17.length).toBeGreaterThan(0);
    expect(practices.general.length).toBeGreaterThan(0);
  });

  it('应该验证 iOS 配置并在非 iOS 平台直接通过', () => {
    const iosConfig = PermissionUtils.validateiOSConfiguration();
    expect(iosConfig.valid).toBe(true);
    expect(iosConfig.recommendations.length).toBeGreaterThan(0);

    (Platform as any).OS = 'android';
    (Platform as any).Version = '34';
    PlatformDetector.resetCache();

    const androidConfig = PermissionUtils.validateiOSConfiguration();
    expect(androidConfig).toEqual({
      valid: true,
      missingKeys: [],
      recommendations: [],
    });
  });

  it('应该根据平台和版本判断后台定位支持情况', () => {
    (Platform as any).OS = 'android';
    (Platform as any).Version = '28';
    PlatformDetector.resetCache();
    expect(PermissionUtils.supportsBackgroundLocation()).toBe(false);

    (Platform as any).Version = '29';
    PlatformDetector.resetCache();
    expect(PermissionUtils.supportsBackgroundLocation()).toBe(true);

    (Platform as any).OS = 'ios';
    (Platform as any).Version = '7';
    PlatformDetector.resetCache();
    expect(PermissionUtils.supportsBackgroundLocation()).toBe(false);

    (Platform as any).Version = '8';
    PlatformDetector.resetCache();
    expect(PermissionUtils.supportsBackgroundLocation()).toBe(true);
  });

  it('应该打印诊断信息并保留兼容别名', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    PermissionUtils.printDiagnostics();

    expect(logSpy).toHaveBeenCalled();
    expect(PermissionManager).toBe(PermissionUtils);

    logSpy.mockRestore();
  });
});
