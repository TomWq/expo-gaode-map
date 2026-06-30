/**
 * example 工程统一使用的 Web API Key。
 *
 * 优先读取环境变量，便于后续切回正式配置；
 * 如果本地只是快速验证示例，也允许先在这里放一个临时 key。
 */
export const EXAMPLE_WEB_API_KEY =
  process.env.EXPO_PUBLIC_AMAP_WEB_KEY?.trim() ||
  '';

/**
 * AI 示例使用的 DeepSeek Key。
 *
 * 注意：EXPO_PUBLIC_* 会进入客户端 bundle，仅适合本地示例验证；
 * 真实业务应通过后端代理调用 LLM，避免把模型密钥下发到 App。
 */
export const EXAMPLE_DEEPSEEK_API_KEY =
  process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY?.trim() || '';

export const EXAMPLE_ANDROID_KEY =
  process.env.EXPO_PUBLIC_AMAP_ANDROID_KEY?.trim() || undefined;

export const EXAMPLE_IOS_KEY =
  process.env.EXPO_PUBLIC_AMAP_IOS_KEY?.trim() || undefined;
