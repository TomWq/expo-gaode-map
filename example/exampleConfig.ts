/**
 * example 工程统一使用的 Web API Key。
 *
 * 优先读取环境变量，便于后续切回正式配置；
 * 如果本地只是快速验证示例，也允许先在这里放一个临时 key。
 */
export const EXAMPLE_WEB_API_KEY =
  process.env.EXPO_PUBLIC_AMAP_WEB_KEY?.trim() ||
  '';

export const EXAMPLE_ANDROID_KEY =
  process.env.EXPO_PUBLIC_AMAP_ANDROID_KEY?.trim() || undefined;

export const EXAMPLE_IOS_KEY =
  process.env.EXPO_PUBLIC_AMAP_IOS_KEY?.trim() || undefined;
