/**
 * ErrorHandler 工具类测试
 */

import {
  ErrorHandler,
  ErrorLogger,
  GaodeMapError,
  ErrorType,
} from '../ErrorHandler';

describe('ErrorHandler', () => {
  describe('GaodeMapError', () => {
    it('应该创建包含完整信息的错误对象', () => {
      const error = new GaodeMapError({
        type: ErrorType.SDK_NOT_INITIALIZED,
        message: '测试错误',
        solution: '测试解决方案',
        docUrl: 'https://example.com',
      });

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('GaodeMapError');
      expect(error.type).toBe(ErrorType.SDK_NOT_INITIALIZED);
      expect(error.solution).toBe('测试解决方案');
      expect(error.docUrl).toBe('https://example.com');
      expect(error.message).toContain('测试错误');
      expect(error.message).toContain('测试解决方案');
    });

    it('应该包含原始错误', () => {
      const originalError = new Error('原始错误');
      const error = new GaodeMapError({
        type: ErrorType.NETWORK_ERROR,
        message: '网络错误',
        solution: '检查网络',
        originalError,
      });

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('ErrorHandler.sdkNotInitialized', () => {
    it('应该返回 SDK 未初始化错误', () => {
      const error = ErrorHandler.sdkNotInitialized();

      expect(error.type).toBe(ErrorType.SDK_NOT_INITIALIZED);
      expect(error.message).toContain('未初始化');
      expect(error.solution).toContain('initSDK');
      expect(error.docUrl).toContain('initialization');
    });
  });

  describe('ErrorHandler.invalidApiKey', () => {
    it('应该返回 Android API Key 错误', () => {
      const error = ErrorHandler.invalidApiKey('android');

      expect(error.type).toBe(ErrorType.INVALID_API_KEY);
      expect(error.message).toContain('Android');
      expect(error.solution).toContain('androidKey');
    });

    it('应该返回 iOS API Key 错误', () => {
      const error = ErrorHandler.invalidApiKey('ios');

      expect(error.type).toBe(ErrorType.INVALID_API_KEY);
      expect(error.message).toContain('iOS');
      expect(error.solution).toContain('iosKey');
    });

    it('应该返回通用 API Key 错误', () => {
      const error = ErrorHandler.invalidApiKey('both');

      expect(error.type).toBe(ErrorType.INVALID_API_KEY);
      expect(error.message).toContain('Android 和 iOS');
      expect(error.solution).toContain('androidKey');
      expect(error.solution).toContain('iosKey');
    });
  });

  describe('ErrorHandler.permissionDenied', () => {
    it('应该返回权限未授予错误', () => {
      const error = ErrorHandler.permissionDenied('location');

      expect(error.type).toBe(ErrorType.PERMISSION_DENIED);
      expect(error.message).toContain('权限');
      expect(error.solution).toContain('requestLocationPermission');
      expect(error.solution).toContain('checkLocationPermission');
    });
  });

  describe('ErrorHandler.locationFailed', () => {
    it('应该返回定位失败错误', () => {
      const error = ErrorHandler.locationFailed();

      expect(error.type).toBe(ErrorType.LOCATION_FAILED);
      expect(error.message).toContain('定位失败');
      expect(error.solution).toContain('GPS');
    });

    it('应该包含失败原因', () => {
      const error = ErrorHandler.locationFailed('网络超时');

      expect(error.message).toContain('网络超时');
    });
  });

  describe('ErrorHandler.nativeModuleUnavailable', () => {
    it('应该返回原生模块不可用错误', () => {
      const error = ErrorHandler.nativeModuleUnavailable();

      expect(error.type).toBe(ErrorType.NATIVE_MODULE_UNAVAILABLE);
      expect(error.message).toContain('原生模块');
      expect(error.solution).toContain('expo prebuild');
    });
  });

  describe('ErrorHandler.mapViewNotInitialized', () => {
    it('应该返回地图视图未初始化错误', () => {
      const error = ErrorHandler.mapViewNotInitialized('moveCamera');

      expect(error.type).toBe(ErrorType.MAP_VIEW_NOT_INITIALIZED);
      expect(error.message).toContain('moveCamera');
      expect(error.message).toContain('未初始化');
      expect(error.solution).toContain('MapView');
    });
  });

  describe('ErrorHandler.invalidParameter', () => {
    it('应该返回参数错误', () => {
      const error = ErrorHandler.invalidParameter('zoom', 'number', 'string');

      expect(error.type).toBe(ErrorType.INVALID_PARAMETER);
      expect(error.message).toContain('zoom');
      expect(error.solution).toContain('number');
      expect(error.solution).toContain('string');
    });
  });

  describe('ErrorHandler.networkError', () => {
    it('应该返回网络错误', () => {
      const error = ErrorHandler.networkError();

      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.message).toContain('网络');
      expect(error.solution).toContain('API Key');
    });

    it('应该包含原始错误', () => {
      const originalError = new Error('网络超时');
      const error = ErrorHandler.networkError(originalError);

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('ErrorHandler.wrapNativeError', () => {
    it('应该识别 SDK 未初始化错误', () => {
      const nativeError = new Error('SDK not initialized');
      const error = ErrorHandler.wrapNativeError(nativeError, '测试');

      expect(error.type).toBe(ErrorType.SDK_NOT_INITIALIZED);
    });

    it('应该识别 API Key 错误', () => {
      const nativeError = new Error('invalid key');
      const error = ErrorHandler.wrapNativeError(nativeError, '测试');

      expect(error.type).toBe(ErrorType.INVALID_API_KEY);
    });

    it('应该识别权限错误', () => {
      const nativeError = new Error('permission denied');
      const error = ErrorHandler.wrapNativeError(nativeError, '测试');

      expect(error.type).toBe(ErrorType.PERMISSION_DENIED);
    });

    it('应该识别定位错误', () => {
      const nativeError = new Error('location failed');
      const error = ErrorHandler.wrapNativeError(nativeError, '测试');

      expect(error.type).toBe(ErrorType.LOCATION_FAILED);
    });

    it('应该处理未知错误', () => {
      const nativeError = new Error('未知错误');
      const error = ErrorHandler.wrapNativeError(nativeError, '测试上下文');

      expect(error.message).toContain('测试上下文');
      expect(error.solution).toContain('未知错误');
    });

    it('应该处理非 Error 对象', () => {
      const error = ErrorHandler.wrapNativeError('字符串错误', '测试');

      expect(error).toBeInstanceOf(GaodeMapError);
      expect(error.solution).toContain('字符串错误');
    });
  });

  describe('ErrorLogger', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      ErrorLogger.setEnabled(true);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('应该记录错误', () => {
      const error = ErrorHandler.sdkNotInitialized();
      ErrorLogger.log(error);

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('未初始化');
    });

    it('应该记录原始错误', () => {
      const originalError = new Error('原始错误');
      const error = new GaodeMapError({
        type: ErrorType.NETWORK_ERROR,
        message: '网络错误',
        solution: '检查网络',
        originalError,
      });

      ErrorLogger.log(error);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
    });

    it('禁用时不应该记录错误', () => {
      ErrorLogger.setEnabled(false);
      const error = ErrorHandler.sdkNotInitialized();
      ErrorLogger.log(error);

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ErrorLogger.warn', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      ErrorLogger.setEnabled(true);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('应该记录警告', () => {
      ErrorLogger.warn('测试警告');

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('测试警告');
    });

    it('应该记录警告详情', () => {
      ErrorLogger.warn('测试警告', { detail: 'value' });

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][1]).toEqual({ detail: 'value' });
    });

    it('禁用时不应该记录警告', () => {
      ErrorLogger.setEnabled(false);
      ErrorLogger.warn('测试警告');

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});