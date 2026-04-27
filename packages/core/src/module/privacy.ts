import type { PrivacyConfig, PrivacyStatus } from '../types/common.types';
import { ErrorHandler } from '../utils/ErrorHandler';
import { getNativeModule } from './nativeModule';

export function assertPrivacyReady(scene: 'map' | 'sdk' = 'sdk'): void {
  const nativeModule = getNativeModule();
  if (!nativeModule) {
    throw ErrorHandler.nativeModuleUnavailable();
  }
  const status = nativeModule.getPrivacyStatus();
  if (!status.isReady) {
    throw ErrorHandler.privacyNotAgreed(scene);
  }
}

export const privacyMethods = {
  /**
   * 设置当前隐私协议版本
   * 当版本号变化时，之前的同意状态会失效
   */
  setPrivacyVersion(version: string): void {
    const nativeModule = getNativeModule();
    if (!nativeModule) throw ErrorHandler.nativeModuleUnavailable();
    nativeModule.setPrivacyVersion(version);
  },

  /**
   * 清空已持久化的隐私同意状态
   */
  resetPrivacyConsent(): void {
    const nativeModule = getNativeModule();
    if (!nativeModule) throw ErrorHandler.nativeModuleUnavailable();
    nativeModule.resetPrivacyConsent();
  },

  /**
   * 一次性同步完整的隐私状态
   * 推荐业务层只调用这个方法
   */
  setPrivacyConfig(config: PrivacyConfig): void {
    const nativeModule = getNativeModule();
    if (!nativeModule) throw ErrorHandler.nativeModuleUnavailable();
    nativeModule.setPrivacyConfig(config);
  },

  getPrivacyStatus(): PrivacyStatus {
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      return {
        hasShow: false,
        hasContainsPrivacy: false,
        hasAgree: false,
        isReady: false,
        privacyVersion: null,
        agreedPrivacyVersion: null,
        restoredFromStorage: false,
      };
    }
    return nativeModule.getPrivacyStatus();
  },
};
