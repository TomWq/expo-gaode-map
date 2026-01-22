/**
 * 高德地图错误处理工具
 * 提供友好的错误提示和解决方案指引
 */

/**
 * 错误类型枚举
 */
export enum ErrorType {
  /** SDK 未初始化 */
  SDK_NOT_INITIALIZED = 'SDK_NOT_INITIALIZED',
  /** API Key 配置错误 */
  INVALID_API_KEY = 'INVALID_API_KEY',
  /** 权限未授予 */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  /** 定位失败 */
  LOCATION_FAILED = 'LOCATION_FAILED',
  /** 原生模块不可用 */
  NATIVE_MODULE_UNAVAILABLE = 'NATIVE_MODULE_UNAVAILABLE',
  /** 地图视图未初始化 */
  MAP_VIEW_NOT_INITIALIZED = 'MAP_VIEW_NOT_INITIALIZED',
  /** 参数错误 */
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
}

/**
 * 错误详情接口
 */
export interface ErrorDetails {
  /** 错误类型 */
  type: ErrorType;
  /** 错误消息 */
  message: string;
  /** 解决方案 */
  solution: string;
  /** 文档链接 */
  docUrl?: string;
  /** 原始错误 */
  originalError?: Error;
}

/**
 * 自定义错误类
 */
export class GaodeMapError extends Error {
  type: ErrorType;
  solution: string;
  docUrl?: string;
  originalError?: Error;

  constructor(details: ErrorDetails) {
    const fullMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️  高德地图错误 [${details.type}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 错误信息：
   ${details.message}

💡 解决方案：
   ${details.solution}

${details.docUrl ? `📖 详细文档：\n   ${details.docUrl}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    super(fullMessage);
    this.name = 'GaodeMapError';
    this.type = details.type;
    this.solution = details.solution;
    this.docUrl = details.docUrl;
    this.originalError = details.originalError;
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private static docBaseUrl = 'https://TomWq.github.io/expo-gaode-map';

  /**
   * SDK 未初始化错误
   */
  static sdkNotInitialized(): GaodeMapError {
    return new GaodeMapError({
      type: ErrorType.SDK_NOT_INITIALIZED,
      message: '高德地图 SDK 尚未初始化',
      solution: `请在使用地图功能前先调用 initSDK()：

import ExpoGaodeMapModule from 'expo-gaode-map';

useEffect(() => {
  // 在组件挂载时初始化
  ExpoGaodeMapModule.initSDK({
    androidKey: 'your-android-key',
    iosKey: 'your-ios-key',
  });
}, []);

⚠️  常见原因：
1. 忘记调用 initSDK() 就使用了定位或地图功能
2. initSDK() 调用时机过晚（应在 useEffect 中尽早调用）
3. 使用 Config Plugin 但未重新构建原生代码`,
      docUrl: `${this.docBaseUrl}/guide/initialization.html`,
    });
  }

  /**
   * API Key 配置错误
   */
  static invalidApiKey(platform: 'android' | 'ios' | 'both'): GaodeMapError {
    const platformText = {
      android: 'Android',
      ios: 'iOS',
      both: 'Android 和 iOS',
    }[platform];

    return new GaodeMapError({
      type: ErrorType.INVALID_API_KEY,
      message: `${platformText} API Key 配置错误或未配置`,
      solution: `⚠️  API Key 与 Bundle ID 不匹配是最常见的原因！

请检查以下步骤：

1️⃣  确认 API Key 的配置：
   • 访问高德开放平台：https://lbs.amap.com/
   • 检查您的应用配置中的 Bundle ID 是否与当前项目一致
   • iOS Bundle ID：在 Xcode → Target → General → Bundle Identifier 查看
   • Android 包名：在 android/app/build.gradle → applicationId 查看

2️⃣  重新创建正确的 API Key（如果 Bundle ID 不同）：
   • 在高德开放平台创建新应用
   • 填写正确的 Bundle ID（iOS）或包名（Android）
   • 获取新的 API Key

3️⃣  配置 API Key（推荐使用 Config Plugin）：

在 app.json 中配置：
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key"
        }
      ]
    ]
  }
}

然后重新构建：
npx expo prebuild --clean
npx expo run:${platform === 'ios' ? 'ios' : 'android'}

4️⃣  或在代码中配置：
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
});`,
      docUrl: `${this.docBaseUrl}/guide/initialization.html`,
    });
  }

  /**
   * 权限未授予错误
   */
  static permissionDenied(permissionType: 'location'): GaodeMapError {
    return new GaodeMapError({
      type: ErrorType.PERMISSION_DENIED,
      message: '定位权限未授予，无法使用定位功能',
      solution: `请按以下步骤授予权限：

1️⃣  请求权限：
import ExpoGaodeMapModule from 'expo-gaode-map';

const checkPermission = async () => {
  // 检查权限状态
  const status = await ExpoGaodeMapModule.checkLocationPermission();
  
  if (!status.granted) {
    // 请求权限
    const result = await ExpoGaodeMapModule.requestLocationPermission();
    
    if (!result.granted) {
      // 用户拒绝授权，引导用户去设置
      Alert.alert(
        '需要定位权限',
        '请在设置中开启定位权限以使用地图功能',
        [
          { text: '取消', style: 'cancel' },
          { text: '去设置', onPress: () => Linking.openSettings() }
        ]
      );
    }
  }
};

2️⃣  iOS 配置（在 app.json 中）：
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "需要获取您的位置信息以显示地图",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "需要获取您的位置信息"
      }
    }
  }
}

3️⃣  Android 配置（Config Plugin 会自动添加）：
使用 expo-gaode-map 的 Config Plugin 会自动添加必要的权限声明`,
      docUrl: `${this.docBaseUrl}/guide/getting-started.html#权限配置`,
    });
  }

  /**
   * 定位失败错误
   */
  static locationFailed(reason?: string): GaodeMapError {
    return new GaodeMapError({
      type: ErrorType.LOCATION_FAILED,
      message: `定位失败${reason ? `：${reason}` : ''}`,
      solution: `⚠️  最常见原因：API Key 与 Bundle ID 不匹配！

请按以下顺序排查：

1️⃣  检查 API Key 配置（最常见问题）：
   • 访问高德开放平台：https://lbs.amap.com/
   • 确认您的应用的 Bundle ID 与当前项目一致
   • iOS Bundle ID：在 Xcode → Target → General → Bundle Identifier
   • Android 包名：在 android/app/build.gradle → applicationId
   
   如果 Bundle ID 不同，必须在高德平台重新创建应用并获取新 Key

2️⃣  检查设备 GPS 和网络：
   • 确认设备 GPS 已开启
   • 检查网络连接是否正常
   • 尝试在室外空旷处测试

3️⃣  检查定位权限：
   • iOS：设置 → 隐私 → 定位服务 → 允许应用访问
   • Android：设置 → 应用 → 权限管理 → 位置信息

4️⃣  配置定位参数（如果 API Key 正确但定位仍失败）：
ExpoGaodeMapModule.setLocationTimeout(30); // 增加超时时间
ExpoGaodeMapModule.setInterval(2000); // 设置定位间隔

// Android 特有配置
ExpoGaodeMapModule.setLocationMode(2); // 高精度模式
ExpoGaodeMapModule.setGpsFirst(true);  // GPS 优先

// iOS 特有配置
ExpoGaodeMapModule.setDesiredAccuracy(0); // 最佳精度`,
      docUrl: `${this.docBaseUrl}/api/location.html`,
    });
  }

  /**
   * 原生模块不可用错误
   */
  static nativeModuleUnavailable(): GaodeMapError {
    return new GaodeMapError({
      type: ErrorType.NATIVE_MODULE_UNAVAILABLE,
      message: 'expo-gaode-map 原生模块不可用',
      solution: `请检查以下步骤：

1️⃣  确认已正确安装：
npm install expo-gaode-map
# 或
bun install expo-gaode-map

2️⃣  重新构建原生代码：
npx expo prebuild --clean
npx expo run:android
npx expo run:ios

3️⃣  检查 Expo 版本兼容性：
• expo-gaode-map 需要 Expo SDK 49+
• 不支持 Expo Go，必须使用 Development Build

4️⃣  检查是否与其他包冲突：
• 不能同时安装 expo-gaode-map 和 expo-gaode-map-navigation
• 两个包选择其一使用

5️⃣  清理缓存后重试：
cd android && ./gradlew clean && cd ..
cd ios && pod deintegrate && pod install && cd ..`,
      docUrl: `${this.docBaseUrl}/guide/getting-started.html`,
    });
  }

  /**
   * 地图视图未初始化错误
   */
  static mapViewNotInitialized(methodName: string): GaodeMapError {
    return new GaodeMapError({
      type: ErrorType.MAP_VIEW_NOT_INITIALIZED,
      message: `无法调用 ${methodName}：地图视图尚未初始化`,
      solution: `请确保：

1️⃣  MapView 已经渲染完成
2️⃣  使用 ref 获取地图实例后再调用方法

正确用法：
import { MapView, MapViewRef } from 'expo-gaode-map';

const App = () => {
  const mapRef = useRef<MapViewRef>(null);
  
  // ❌ 错误：在渲染前调用
  // mapRef.current?.moveCamera(...);
  
  // ✅ 正确：等待地图加载完成
  const handleMapReady = () => {
    mapRef.current?.moveCamera({
      target: { latitude: 39.9, longitude: 116.4 },
      zoom: 15,
    });
  };
  
  return (
    <MapView
      ref={mapRef}
      onMapReady={handleMapReady}
    />
  );
};`,
      docUrl: `${this.docBaseUrl}/api/mapview.html`,
    });
  }

  /**
   * 参数错误
   */
  static invalidParameter(paramName: string, expected: string, received: unknown): GaodeMapError {
    return new GaodeMapError({
      type: ErrorType.INVALID_PARAMETER,
      message: `参数 "${paramName}" 类型错误`,
      solution: `期望类型：${expected}
实际接收：${typeof received} (${JSON.stringify(received)})

请检查传入的参数是否符合要求。

💡 提示：
• 使用 TypeScript 可以在编译时发现类型错误
• 参考 API 文档了解正确的参数类型`,
      docUrl: `${this.docBaseUrl}/api/`,
    });
  }

  /**
   * 网络错误
   */
  static networkError(originalError?: Error): GaodeMapError {
    return new GaodeMapError({
      type: ErrorType.NETWORK_ERROR,
      message: '网络请求失败',
      solution: `请检查：

1️⃣  网络连接是否正常
2️⃣  API Key 是否有效
3️⃣  是否超出配额限制

💡 如果问题持续，请：
• 检查高德开放平台控制台
• 查看 API 调用量和配额
• 确认 Key 的服务是否已开通`,
      docUrl: `${this.docBaseUrl}/guide/troubleshooting.html`,
      originalError,
    });
  }

  /**
   * 包装原生错误，提供更友好的提示
   */
  static wrapNativeError(error: unknown, context: string): GaodeMapError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // SDK 未初始化相关错误
    if (
      errorMessage.includes('not initialized') ||
      errorMessage.includes('未初始化') ||
      errorMessage.includes('SDK未设置')
    ) {
      return this.sdkNotInitialized();
    }
    
    // API Key 相关错误
    if (
      errorMessage.includes('key') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('鉴权失败')
    ) {
      return this.invalidApiKey('both');
    }
    
    // 权限相关错误
    if (
      errorMessage.includes('permission') ||
      errorMessage.includes('权限')
    ) {
      return this.permissionDenied('location');
    }
    
    // 定位相关错误
    if (
      errorMessage.includes('location') ||
      errorMessage.includes('定位')
    ) {
      return this.locationFailed(errorMessage);
    }
    
    // 通用错误
    return new GaodeMapError({
      type: ErrorType.INVALID_PARAMETER,
      message: `${context} 失败`,
      solution: `原始错误信息：${errorMessage}

如果问题持续，请：
1. 查看完整的错误堆栈
2. 检查 API 调用参数
3. 提交 Issue：https://github.com/TomWq/expo-gaode-map/issues`,
      originalError: error instanceof Error ? error : undefined,
    });
  }
}

/**
 * 错误日志工具
 */
export class ErrorLogger {
  // 兼容不同环境：Bun/Jest/Node
  private static isEnabled = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

  /**
   * 启用/禁用错误日志
   */
  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * 记录错误
   */
  static log(error: GaodeMapError) {
    if (!this.isEnabled) return;

    console.error(error.message);
    
    if (error.originalError) {
      console.error('原始错误：', error.originalError);
    }
  }

  /**
   * 记录警告
   */
  static warn(message: string, details?: unknown) {
    if (!this.isEnabled) return;
    
    console.warn(`⚠️  expo-gaode-map: ${message}`, details || '');
  }
}
