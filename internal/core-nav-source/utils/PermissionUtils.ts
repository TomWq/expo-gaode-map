import { Platform } from 'react-native';
import { PlatformDetector } from './PlatformDetector';

/**
 * 位置权限类型
 */
export enum LocationPermissionType {
  /** 仅前台（使用时） */
  FOREGROUND = 'foreground',
  /** 后台位置 */
  BACKGROUND = 'background',
  /** 前台+后台 */
  FOREGROUND_AND_BACKGROUND = 'foreground_and_background',
}

/**
 * 权限工具类
 *
 * 🔔 **重要说明**：
 *
 * 本工具类**不执行实际的权限请求**，仅提供：
 * - 平台检测（Android 14+、iOS 17+）
 * - 权限说明文案（适配新系统特性）
 * - 最佳实践建议
 * - 诊断信息
 *
 * **实际权限请求请使用**：
 * ```typescript
 * import ExpoGaodeMapModule from 'expo-gaode-map';
 *
 * // 检查权限
 * const status = await ExpoGaodeMapModule.checkLocationPermission();
 *
 * // 请求权限
 * const result = await ExpoGaodeMapModule.requestLocationPermission();
 * ```
 *
 * 本工具类主要用于在请求权限**之前**向用户展示说明文案。
 */
export class PermissionUtils {
  /**
   * 检查当前平台的系统版本
   */
  static getSystemInfo(): {
    platform: 'android' | 'ios';
    version: number;
    isAndroid14Plus: boolean;
    isiOS17Plus: boolean;
  } {
    const platform = Platform.OS as 'android' | 'ios';
    const systemVersion = PlatformDetector.getSystemVersion();
    
    return {
      platform,
      version: systemVersion.version,
      isAndroid14Plus: PlatformDetector.needsAndroid14Permissions(),
      isiOS17Plus: PlatformDetector.supportsiOS17Features(),
    };
  }

  /**
   * 获取权限说明文案
   */
  static getPermissionRationale(type: LocationPermissionType): string {
    const { platform, isAndroid14Plus, isiOS17Plus } = this.getSystemInfo();
    
    if (platform === 'android') {
      return this.getAndroidRationale(type, isAndroid14Plus);
    } else {
      return this.getiOSRationale(type, isiOS17Plus);
    }
  }

  /**
   * Android 权限说明文案
   */
  private static getAndroidRationale(
    type: LocationPermissionType,
    isAndroid14: boolean
  ): string {
    switch (type) {
      case LocationPermissionType.FOREGROUND:
        if (isAndroid14) {
          return `为了在地图上显示您的位置，应用需要访问您的位置信息。

您可以选择：
• 仅在使用应用时允许
• 每次询问

我们不会在后台收集您的位置数据。`;
        }
        return '为了在地图上显示您的位置，应用需要访问您的位置信息。';

      case LocationPermissionType.BACKGROUND:
        if (isAndroid14) {
          return `为了在后台更新您的位置（如导航、轨迹记录），应用需要始终访问位置权限。

您可以随时在设置中更改此权限。`;
        }
        return '为了在后台更新您的位置，应用需要始终访问位置权限。';

      case LocationPermissionType.FOREGROUND_AND_BACKGROUND:
        if (isAndroid14) {
          return `应用需要位置权限来提供以下功能：
• 在地图上显示您的位置（前台）
• 后台导航和轨迹记录（后台）

我们会先请求前台权限，然后再请求后台权限。`;
        }
        return '应用需要位置权限来显示地图位置和后台导航功能。';
    }
  }

  /**
   * iOS 权限说明文案
   */
  private static getiOSRationale(
    type: LocationPermissionType,
    isiOS17: boolean
  ): string {
    switch (type) {
      case LocationPermissionType.FOREGROUND:
        if (isiOS17) {
          return `为了在地图上显示您的位置，应用需要访问您的位置信息。

您可以选择：
• 使用 App 期间：仅在使用应用时访问位置
• 一次：仅本次使用时访问位置

我们不会在后台收集您的位置数据。`;
        }
        return '为了在地图上显示您的位置，应用需要访问您的位置信息。';

      case LocationPermissionType.BACKGROUND:
      case LocationPermissionType.FOREGROUND_AND_BACKGROUND:
        if (isiOS17) {
          return `为了提供以下功能，应用需要始终访问位置权限：
• 后台导航和路径规划
• 轨迹记录
• 位置提醒

您可以随时在设置中更改此权限。`;
        }
        return '为了在后台更新您的位置，应用需要始终访问位置权限。';
    }
  }

  /**
   * 获取精确位置权限说明（iOS 14+）
   */
  static getAccuracyRationale(): string {
    const { isiOS17Plus } = this.getSystemInfo();
    
    if (isiOS17Plus) {
      return `为了提供准确的导航和定位服务，应用需要访问精确位置。

选择"模糊位置"可能会导致：
• 地图定位不准确
• 导航路线偏差
• 搜索结果不精确`;
    }
    
    return '为了提供准确的导航和定位服务，应用需要访问精确位置。';
  }

  /**
   * 获取权限请求的最佳实践建议
   */
  static getBestPractices(): {
    android14: string[];
    ios17: string[];
    general: string[];
  } {
    return {
      android14: [
        '先解释为什么需要权限，再发起请求',
        '前台和后台权限分两步请求',
        '永久拒绝后引导用户到设置页面',
        '提供"仅本次"选项的说明',
      ],
      ios17: [
        '在 Info.plist 中提供清晰的权限说明',
        '使用 Privacy Manifest 声明位置访问原因',
        '先请求"使用期间"，再请求"始终允许"',
        '支持"仅一次"权限模式',
      ],
      general: [
        '在用户需要使用功能时再请求权限',
        '清晰解释权限用途和好处',
        '提供拒绝后的替代方案',
        '尊重用户的权限选择',
      ],
    };
  }

  /**
   * 验证 Info.plist 配置（仅 iOS）
   */
  static validateiOSConfiguration(): {
    valid: boolean;
    missingKeys: string[];
    recommendations: string[];
  } {
    if (Platform.OS !== 'ios') {
      return {
        valid: true,
        missingKeys: [],
        recommendations: [],
      };
    }

    const recommendations: string[] = [];
    const { isiOS17Plus } = this.getSystemInfo();

    if (isiOS17Plus) {
      recommendations.push(
        '建议在 Privacy Manifest (PrivacyInfo.xcprivacy) 中声明位置访问原因',
        '确保 NSLocationWhenInUseUsageDescription 文案清晰、具体',
        '如需后台位置，配置 NSLocationAlwaysAndWhenInUseUsageDescription'
      );
    }

    return {
      valid: true,
      missingKeys: [],
      recommendations,
    };
  }

  /**
   * 检查是否支持后台位置权限
   */
  static supportsBackgroundLocation(): boolean {
    const { platform, version } = this.getSystemInfo();
    
    if (platform === 'android') {
      // Android 10 (API 29) 引入后台位置权限
      return version >= 29;
    } else {
      // iOS 8+ 支持
      return version >= 8;
    }
  }

  /**
   * 打印权限诊断信息
   */
  static printDiagnostics(): void {
    const info = this.getSystemInfo();
    console.log('=== 权限管理诊断信息 ===');
    console.log(`平台: ${info.platform}`);
    console.log(`系统版本: ${info.version}`);
    console.log(`Android 14+: ${info.isAndroid14Plus ? '是' : '否'}`);
    console.log(`iOS 17+: ${info.isiOS17Plus ? '是' : '否'}`);
    console.log(`支持后台位置: ${this.supportsBackgroundLocation() ? '是' : '否'}`);
    
    const practices = this.getBestPractices();
    console.log('\n💡 最佳实践建议:');
    
    if (info.isAndroid14Plus) {
      console.log('\nAndroid 14+ 特别注意:');
      practices.android14.forEach((tip, index) => {
        console.log(`  ${index + 1}. ${tip}`);
      });
    }
    
    if (info.isiOS17Plus) {
      console.log('\niOS 17+ 特别注意:');
      practices.ios17.forEach((tip, index) => {
        console.log(`  ${index + 1}. ${tip}`);
      });
    }
    
    console.log('\n通用建议:');
    practices.general.forEach((tip, index) => {
      console.log(`  ${index + 1}. ${tip}`);
    });
    
    if (info.platform === 'ios') {
      const validation = this.validateiOSConfiguration();
      if (validation.recommendations.length > 0) {
        console.log('\niOS 配置建议:');
        validation.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec}`);
        });
      }
    }
    
    console.log('\n📌 实际权限请求：');
    console.log('  使用 ExpoGaodeMapModule.checkLocationPermission()');
    console.log('  使用 ExpoGaodeMapModule.requestLocationPermission()');
  }
}

/**
 * 向后兼容的别名
 * @deprecated 请使用 PermissionUtils
 */
export const PermissionManager = PermissionUtils;