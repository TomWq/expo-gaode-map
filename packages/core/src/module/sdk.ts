import type { SDKConfig } from '../types/common.types';
import { ErrorHandler, ErrorLogger } from '../utils/ErrorHandler';
import { getNativeModule } from './nativeModule';

let sdkConfig: SDKConfig | null = null;
let isSDKInitialized = false;

export const sdkMethods = {
  /**
   * 初始化 SDK，并缓存配置（包含 webKey）
   * 注意：允许不提供任何 API Key，因为原生端可能已通过 Config Plugin 配置
   */
  initSDK(config: SDKConfig): void {
    const nativeModule = getNativeModule();
    if (!nativeModule) throw ErrorHandler.nativeModuleUnavailable();
    try {
      const privacyStatus = nativeModule.getPrivacyStatus();
      if (!privacyStatus.isReady) {
        throw ErrorHandler.privacyNotAgreed('sdk');
      }

      // 检查是否有任何 key 被提供
      const hasJSKeys = !!(config.androidKey || config.iosKey);
      const hasWebKey = !!config.webKey;

      // 如果 JS 端没有提供 androidKey/iosKey,检查原生端是否已配置
      if (!hasJSKeys) {
        const isNativeConfigured = nativeModule.isNativeSDKConfigured();
        if (!isNativeConfigured && !hasWebKey) {
          throw ErrorHandler.invalidApiKey('both');
        }

        // 如果原生已配置,或者只提供了 webKey,继续初始化
        ErrorLogger.warn(
          isNativeConfigured
            ? 'SDK 使用原生端配置的 API Key'
            : 'SDK 初始化仅使用 webKey',
          { config }
        );
      }

      sdkConfig = config ?? null;
      nativeModule.initSDK(config);
      isSDKInitialized = true;
      ErrorLogger.warn('SDK 初始化成功', { config });
    } catch (error) {
      isSDKInitialized = false;
      throw ErrorHandler.wrapNativeError(error, 'SDK 初始化');
    }
  },

  isSDKInitialized(): boolean {
    return isSDKInitialized;
  },

  setLoadWorldVectorMap(enabled: boolean): void {
    const nativeModule = getNativeModule(true);
    if (!nativeModule) return;
    try {
      nativeModule.setLoadWorldVectorMap(enabled);
    } catch (error) {
      ErrorLogger.warn('setLoadWorldVectorMap 失败', { enabled, error });
    }
  },

  getVersion(): string {
    const nativeModule = getNativeModule(true);
    if (!nativeModule) return '0.0.0';
    try {
      return nativeModule.getVersion();
    } catch (error) {
      ErrorLogger.warn('getVersion 失败', { error });
      return '0.0.0';
    }
  },
};

/**
* 获取最近一次 initSDK 的配置
*/
export function getSDKConfig(): SDKConfig | null {
  return sdkConfig;
}

/**
* 获取用于 Web API 的 webKey（若未初始化或未提供则返回 undefined）
*/
export function getWebKey(): string | undefined {
  return sdkConfig?.webKey;
}
