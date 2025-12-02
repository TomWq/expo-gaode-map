import {
  ConfigPlugin,
  withAppDelegate,
  withInfoPlist,
  withAndroidManifest,
  withAppBuildGradle,
  createRunOncePlugin,
  WarningAggregator,
} from '@expo/config-plugins';

/**
 * 高德地图插件配置类型
 */
export type GaodeMapPluginProps = {
  /** iOS 平台 API Key */
  iosApiKey?: string;
  /** Android 平台 API Key */
  androidApiKey?: string;
  /** 是否启用定位功能 */
  enableLocation?: boolean;
  /** iOS 定位权限描述 */
  locationDescription?: string;
  /** 是否启用后台定位（Android & iOS） */
  enableBackgroundLocation?: boolean;
};

/**
 * iOS: 修改 Info.plist 添加 API Key 和权限
 */
const withGaodeMapInfoPlist: ConfigPlugin<GaodeMapPluginProps> = (config, props) => {
  return withInfoPlist(config, (config) => {
    // 添加高德地图 API Key
    if (props.iosApiKey) {
      config.modResults.AMapApiKey = props.iosApiKey;
    }

    // 添加定位相关权限
    if (props.enableLocation !== false) {
      const description = props.locationDescription || '需要访问您的位置信息以提供地图服务';
      
      // 使用时定位权限（必需）
      config.modResults.NSLocationWhenInUseUsageDescription = description;
      
      // 后台定位权限（可选）
      if (props.enableBackgroundLocation) {
        config.modResults.NSLocationAlwaysUsageDescription = description;
        config.modResults.NSLocationAlwaysAndWhenInUseUsageDescription = description;
        
        // 添加后台定位模式
        if (!config.modResults.UIBackgroundModes) {
          config.modResults.UIBackgroundModes = [];
        }
        if (!config.modResults.UIBackgroundModes.includes('location')) {
          config.modResults.UIBackgroundModes.push('location');
        }
      }
    }

    return config;
  });
};

/**
 * iOS: 修改 AppDelegate 添加初始化代码
 */
const withGaodeMapAppDelegate: ConfigPlugin<GaodeMapPluginProps> = (config, props) => {
  return withAppDelegate(config, (config) => {
    if (!props.iosApiKey) {
      return config;
    }

    let contents = config.modResults.contents;

    // 添加 import 语句
    if (!contents.includes('#import <AMapFoundationKit/AMapFoundationKit.h>')) {
      // 在 #import "AppDelegate.h" 之后添加
      contents = contents.replace(
        /#import "AppDelegate.h"/g,
        `#import "AppDelegate.h"\n#import <AMapFoundationKit/AMapFoundationKit.h>`
      );
    }

    // 在 didFinishLaunchingWithOptions 方法中添加初始化代码
    const initCode = `  [AMapServices sharedServices].apiKey = @"${props.iosApiKey}";`;
    
    if (!contents.includes(initCode)) {
      // 在 didFinishLaunchingWithOptions 方法的开始处添加
      contents = contents.replace(
        /(- \(BOOL\)application:\(UIApplication \*\)application didFinishLaunchingWithOptions:\(NSDictionary \*\)launchOptions\s*\{)/g,
        `$1\n${initCode}`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};

/**
 * Android: 修改 AndroidManifest.xml 添加 API Key 和权限
 */
const withGaodeMapAndroidManifest: ConfigPlugin<GaodeMapPluginProps> = (config, props) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    // 基础权限（库中已包含，这里不重复添加）
    // INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE
    // ACCESS_COARSE_LOCATION, ACCESS_FINE_LOCATION

    // 后台定位权限（可选）
    if (props.enableBackgroundLocation) {
      const backgroundPermissions = [
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_LOCATION',
      ];

      if (!androidManifest['uses-permission']) {
        androidManifest['uses-permission'] = [];
      }

      backgroundPermissions.forEach((permission) => {
        const hasPermission = androidManifest['uses-permission']?.some(
          (item) => item.$?.['android:name'] === permission
        );
        
        if (!hasPermission) {
          androidManifest['uses-permission']?.push({
            $: { 'android:name': permission },
          });
        }
      });
    }

    // 添加前台服务（如果启用后台定位）
    const mainApplication = androidManifest.application?.[0];
    if (mainApplication && props.enableBackgroundLocation) {
      if (!mainApplication['service']) {
        mainApplication['service'] = [];
      }

      // 检查是否已存在 LocationForegroundService
      const hasService = mainApplication['service'].some(
        (item) => item.$?.['android:name'] === 'expo.modules.gaodemap.services.LocationForegroundService'
      );

      if (!hasService) {
        mainApplication['service'].push({
          $: {
            'android:name': 'expo.modules.gaodemap.services.LocationForegroundService',
            'android:enabled': 'true',
            'android:exported': 'false',
            'android:foregroundServiceType': 'location',
          },
        });
      }
    }

    // 添加 API Key 到 application 标签
    if (mainApplication && props.androidApiKey) {
      if (!mainApplication['meta-data']) {
        mainApplication['meta-data'] = [];
      }

      // 检查是否已存在
      const hasApiKey = mainApplication['meta-data'].some(
        (item) => item.$?.['android:name'] === 'com.amap.api.v2.apikey'
      );

      if (!hasApiKey) {
        mainApplication['meta-data'].push({
          $: {
            'android:name': 'com.amap.api.v2.apikey',
            'android:value': props.androidApiKey,
          },
        });
      } else {
        // 更新现有的 API Key
        const apiKeyIndex = mainApplication['meta-data'].findIndex(
          (item) => item.$?.['android:name'] === 'com.amap.api.v2.apikey'
        );
        if (apiKeyIndex !== -1) {
          mainApplication['meta-data'][apiKeyIndex].$ = {
            'android:name': 'com.amap.api.v2.apikey',
            'android:value': props.androidApiKey,
          };
        }
      }
    }

    return config;
  });
};

/**
 * Android: 修改 app/build.gradle 添加依赖
 */
const withGaodeMapAppBuildGradle: ConfigPlugin<GaodeMapPluginProps> = (config, props) => {
  return withAppBuildGradle(config, (config) => {
    // 这里可以添加额外的 Gradle 配置，如果需要的话
    // 例如添加 maven 仓库或其他依赖
    return config;
  });
};

/**
 * 主插件函数 - 组合所有修改器
 */
const withGaodeMap: ConfigPlugin<GaodeMapPluginProps> = (config, props = {}) => {
  // 验证配置
  if (!props.iosApiKey && !props.androidApiKey) {
    WarningAggregator.addWarningIOS(
      'expo-gaode-map',
      '未配置 API Key。请在 app.json 的 plugins 中配置 iosApiKey 和 androidApiKey'
    );
  }

  // 应用 iOS 配置
  config = withGaodeMapInfoPlist(config, props);
  config = withGaodeMapAppDelegate(config, props);

  // 应用 Android 配置
  config = withGaodeMapAndroidManifest(config, props);
  config = withGaodeMapAppBuildGradle(config, props);

  return config;
};

/**
 * 导出为可运行一次的插件
 * 这确保插件只会运行一次，即使在配置中被多次引用
 */
export default createRunOncePlugin(withGaodeMap, 'expo-gaode-map', '1.0.0');