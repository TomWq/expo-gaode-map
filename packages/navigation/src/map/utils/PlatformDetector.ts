/**
 * 平台检测工具
 * 用于检测设备特性、系统版本等
 */

import { Platform, Dimensions } from 'react-native';

/**
 * 设备类型
 */
export enum DeviceType {
  PHONE = 'phone',
  TABLET = 'tablet',
  FOLDABLE = 'foldable',
  UNKNOWN = 'unknown',
}

/**
 * 折叠状态
 */
export enum FoldState {
  FOLDED = 'folded',
  UNFOLDED = 'unfolded',
  HALF_FOLDED = 'half_folded',
  UNKNOWN = 'unknown',
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  type: DeviceType;
  isTablet: boolean;
  isFoldable: boolean;
  screenSize: {
    width: number;
    height: number;
    scale: number;
    fontScale: number;
  };
  aspectRatio: number;
  isLandscape: boolean;
}

/**
 * 系统版本信息
 */
export interface SystemVersion {
  platform: 'ios' | 'android';
  version: number;
  isAndroid14Plus: boolean;
  isIOS17Plus: boolean;
}

/**
 * 平台检测器类
 */
export class PlatformDetector {
  private static deviceInfo: DeviceInfo | null = null;
  private static systemVersion: SystemVersion | null = null;

  /**
   * 获取系统版本信息
   */
  static getSystemVersion(): SystemVersion {
    if (this.systemVersion) {
      return this.systemVersion;
    }

    const version = parseInt(Platform.Version.toString(), 10);
    
    this.systemVersion = {
      platform: Platform.OS as 'ios' | 'android',
      version,
      isAndroid14Plus: Platform.OS === 'android' && version >= 34, // Android 14 = API 34
      isIOS17Plus: Platform.OS === 'ios' && version >= 17,
    };

    return this.systemVersion;
  }

  /**
   * 获取设备信息
   */
  static getDeviceInfo(): DeviceInfo {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    const { width, height, scale, fontScale } = Dimensions.get('window');
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    const isLandscape = width > height;

    // 判断是否为平板（基于屏幕尺寸和宽高比）
    const smallerDimension = Math.min(width, height);
    const isTablet = smallerDimension >= 600 || aspectRatio < 1.6;

    // 检测折叠屏（基于极端宽高比）
    const isFoldable = this.detectFoldable(width, height, aspectRatio);

    let type: DeviceType = DeviceType.PHONE;
    if (isFoldable) {
      type = DeviceType.FOLDABLE;
    } else if (isTablet) {
      type = DeviceType.TABLET;
    }

    this.deviceInfo = {
      type,
      isTablet,
      isFoldable,
      screenSize: { width, height, scale, fontScale },
      aspectRatio,
      isLandscape,
    };

    return this.deviceInfo;
  }

  /**
   * 检测折叠屏设备
   */
  private static detectFoldable(width: number, height: number, aspectRatio: number): boolean {
    // 常见折叠屏特征：
    // 1. 展开时宽高比接近正方形或较小（1.2-1.6）
    // 2. 折叠时宽高比很大（>2.1）
    
    if (Platform.OS === 'android') {
      // 检查是否为极端宽高比
      if (aspectRatio > 2.1 || aspectRatio < 1.3) {
        return true;
      }
      
      // 检查是否为特定分辨率（已知折叠屏设备）
      const knownFoldableResolutions = [
        { w: 2208, h: 1768 }, // Galaxy Z Fold 展开
        { w: 2176, h: 1812 }, // Galaxy Z Fold 3/4 展开
        { w: 884, h: 2208 },  // Galaxy Z Fold 折叠
        { w: 1768, h: 2208 }, // Huawei Mate X
      ];

      return knownFoldableResolutions.some(
        (res) =>
          (Math.abs(width - res.w) < 50 && Math.abs(height - res.h) < 50) ||
          (Math.abs(width - res.h) < 50 && Math.abs(height - res.w) < 50)
      );
    }

    return false;
  }

  /**
   * 检测当前折叠状态（需要原生支持）
   */
  static getFoldState(): FoldState {
    const info = this.getDeviceInfo();
    if (!info.isFoldable) {
      return FoldState.UNKNOWN;
    }

    // 基于宽高比判断折叠状态
    if (info.aspectRatio > 2.0) {
      return FoldState.FOLDED;
    } else if (info.aspectRatio < 1.5) {
      return FoldState.UNFOLDED;
    } else {
      return FoldState.HALF_FOLDED;
    }
  }

  /**
   * 是否为 iPad
   */
  static isIPad(): boolean {
    if (Platform.OS !== 'ios') {
      return false;
    }
    return this.getDeviceInfo().isTablet;
  }

  /**
   * 是否支持多任务
   */
  static supportsMultitasking(): boolean {
    return Platform.OS === 'ios' && this.isIPad();
  }

  /**
   * 是否需要 Android 14+ 新权限流程
   */
  static needsAndroid14Permissions(): boolean {
    return this.getSystemVersion().isAndroid14Plus;
  }

  /**
   * 是否支持 iOS 17+ 新特性
   */
  static supportsiOS17Features(): boolean {
    return this.getSystemVersion().isIOS17Plus;
  }

  /**
   * 监听屏幕尺寸变化（折叠屏展开/折叠）
   */
  static addDimensionChangeListener(callback: (info: DeviceInfo) => void): () => void {
    const subscription = Dimensions.addEventListener('change', () => {
      // 清除缓存，重新计算
      this.deviceInfo = null;
      const newInfo = this.getDeviceInfo();
      callback(newInfo);
    });

    return () => subscription.remove();
  }

  /**
   * 重置缓存（用于测试或强制刷新）
   */
  static resetCache(): void {
    this.deviceInfo = null;
    this.systemVersion = null;
  }
}

/**
 * 便捷的导出函数
 */
export const isAndroid14Plus = () => PlatformDetector.needsAndroid14Permissions();
export const isiOS17Plus = () => PlatformDetector.supportsiOS17Features();
export const isTablet = () => PlatformDetector.getDeviceInfo().isTablet;
export const isFoldable = () => PlatformDetector.getDeviceInfo().isFoldable;
export const isIPad = () => PlatformDetector.isIPad();