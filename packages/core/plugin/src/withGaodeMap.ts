import {
  ConfigPlugin,
  withInfoPlist,
  withAndroidManifest,
  withAppBuildGradle,
  createRunOncePlugin,
  WarningAggregator,
  AndroidConfig,
  IOSConfig,
} from '@expo/config-plugins';

const pkg = require('../../package.json');

/**
 * 高德地图插件配置类型
 */
export type GaodeMapPluginProps = {
  /** iOS 平台 API Key */
  iosKey?: string;
  /** Android 平台 API Key */
  androidKey?: string;
  /** 是否启用定位功能 */
  enableLocation?: boolean;
  /** iOS 定位权限描述 */
  locationDescription?: string;
  /** 是否启用后台定位（Android & iOS） */
  enableBackgroundLocation?: boolean;
};

/** 默认定位权限描述 */
const DEFAULT_LOCATION_USAGE = '需要访问您的位置信息以提供地图服务';

/**
 * iOS: 使用 IOSConfig 添加定位权限
 */
const withGaodeMapIOSPermissions: ConfigPlugin<GaodeMapPluginProps> = (config, props) => {
  if (props.enableLocation === false) {
    return config;
  }

  const description = props.locationDescription || DEFAULT_LOCATION_USAGE;

  // 构建权限配置对象
  const permissionDefaults: Record<string, string> = {
    NSLocationWhenInUseUsageDescription: DEFAULT_LOCATION_USAGE,
  };
  
  const permissionValues: Record<string, string> = {
    NSLocationWhenInUseUsageDescription: description,
  };

  // 如果启用后台定位，添加额外权限
  if (props.enableBackgroundLocation) {
    permissionDefaults.NSLocationAlwaysUsageDescription = DEFAULT_LOCATION_USAGE;
    permissionDefaults.NSLocationAlwaysAndWhenInUseUsageDescription = DEFAULT_LOCATION_USAGE;
    permissionValues.NSLocationAlwaysUsageDescription = description;
    permissionValues.NSLocationAlwaysAndWhenInUseUsageDescription = description;
  }

  // 使用 IOSConfig.Permissions 简化权限配置
  return IOSConfig.Permissions.createPermissionsPlugin(permissionDefaults)(config, permissionValues);
};

/**
 * iOS: 修改 Info.plist 添加 API Key 和后台模式
 */
const withGaodeMapInfoPlist: ConfigPlugin<GaodeMapPluginProps> = (config, props) => {
  return withInfoPlist(config, (config) => {
    // 添加高德地图 API Key
    if (props.iosKey) {
      config.modResults.AMapApiKey = props.iosKey;
    }

    // 添加后台定位模式（如果启用）
    if (props.enableBackgroundLocation) {
      const modes = config.modResults.UIBackgroundModes;
      if (!modes) {
        config.modResults.UIBackgroundModes = ['location'];
      } else if (Array.isArray(modes)) {
        if (modes.indexOf('location') === -1) {
          (config.modResults.UIBackgroundModes as string[]).push('location');
        }
      }
    }

    return config;
  });
};

/**
 * iOS: 注意 - 不再需要修改 AppDelegate
 *
 * 高德地图 SDK 已经支持从 Info.plist 自动读取 API Key
 * 并且我们在 ExpoGaodeMapModule.swift 中提供了 initSDK 方法
 * 用户可以选择以下任一方式初始化：
 * 1. 通过 Info.plist 中的 AMapApiKey 字段（自动读取）
 * 2. 通过 JavaScript 调用 ExpoGaodeMap.initSDK({ iosKey: 'your-key' })
 */

/**
 * Android: 使用 AndroidConfig 添加基础权限
 */
const withGaodeMapAndroidPermissions: ConfigPlugin<GaodeMapPluginProps> = (config, props) => {
  // 基础定位权限（高德地图 SDK 必需）
  const basePermissions = [
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.ACCESS_WIFI_STATE',
  ];

  // 后台定位权限（可选）
  if (props.enableBackgroundLocation) {
    basePermissions.push(
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_LOCATION'
    );
  }

  // 使用 AndroidConfig.Permissions 简化权限配置（自动去重）
  return AndroidConfig.Permissions.withPermissions(config, basePermissions);
};

/**
 * Android: 修改 AndroidManifest.xml 添加 API Key 和服务
 */
const withGaodeMapAndroidManifest: ConfigPlugin<GaodeMapPluginProps> = (config, props) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    // 添加高德定位服务（APSService）- 必需
    const mainApplication = androidManifest.application?.[0];
    if (mainApplication) {
      if (!mainApplication['service']) {
        mainApplication['service'] = [];
      }

      // 1. 添加高德定位服务 APSService（必需）
      const hasAPSService = mainApplication['service'].some(
        (item) => item.$?.['android:name'] === 'com.amap.api.location.APSService'
      );

      if (!hasAPSService) {
        mainApplication['service'].push({
          $: {
            'android:name': 'com.amap.api.location.APSService',
          },
        });
      }

      // 2. 添加前台服务（如果启用后台定位）
      if (props.enableBackgroundLocation) {
        const hasLocationService = mainApplication['service'].some(
          (item) => item.$?.['android:name'] === 'expo.modules.gaodemap.services.LocationForegroundService'
        );

        if (!hasLocationService) {
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
    }

    // 添加 API Key 到 application 标签
    if (mainApplication && props.androidKey) {
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
            'android:value': props.androidKey,
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
            'android:value': props.androidKey,
          };
        }
      }
    }

    return config;
  });
};

/**
 * Android: 修改 app/build.gradle（预留扩展）
 */
const withGaodeMapAppBuildGradle: ConfigPlugin<GaodeMapPluginProps> = (config, props) => {
  return withAppBuildGradle(config, (config) => {
    // Android 3D 地图 SDK 10.0+ 已内置搜索功能
    // 不需要额外的 Gradle 配置
    return config;
  });
};

/**
 * 主插件函数 - 组合所有修改器
 */
const withGaodeMap: ConfigPlugin<GaodeMapPluginProps> = (config, props = {}) => {
  // 验证配置
  if (!props.iosKey && !props.androidKey) {
    WarningAggregator.addWarningIOS(
      'expo-gaode-map',
      '未配置 API Key。请在 app.json 的 plugins 中配置 iosKey 和 androidKey'
    );
  }

  // 应用 iOS 配置
  config = withGaodeMapIOSPermissions(config, props);  // 使用 IOSConfig 添加权限
  config = withGaodeMapInfoPlist(config, props);       // 添加 API Key 和后台模式


  // 应用 Android 配置
  config = withGaodeMapAndroidPermissions(config, props);  // 使用 AndroidConfig 添加权限
  config = withGaodeMapAndroidManifest(config, props);     // 添加服务和 API Key
  config = withGaodeMapAppBuildGradle(config, props);

  return config;
};

/**
 * 导出为可运行一次的插件
 * 这确保插件只会运行一次，即使在配置中被多次引用
 */
export default createRunOncePlugin(withGaodeMap, pkg.name, pkg.version);
