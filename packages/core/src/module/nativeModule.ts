/**
 * 高德地图原生模块
 */
import { requireNativeModule } from 'expo';

import type { NativeExpoGaodeMapModule } from '../types/native-module.types';
import { ErrorHandler, ErrorLogger } from '../utils/ErrorHandler';

let nativeModuleCache: NativeExpoGaodeMapModule | null = null;

/**
 * 获取原生模块
 * @param optional 是否可选
 * @returns 原生模块
 */
export function getNativeModule(optional = false): NativeExpoGaodeMapModule | null {
  if (nativeModuleCache) {
    return nativeModuleCache;
  }

  try {
    nativeModuleCache = requireNativeModule<NativeExpoGaodeMapModule>('ExpoGaodeMap');
    return nativeModuleCache;
  } catch (error) {
    if (optional) {
      return null;
    }
    const moduleError = ErrorHandler.nativeModuleUnavailable();
    ErrorLogger.log(moduleError);
    throw moduleError;
  }
}

/**
 * 获取原生模块的属性或方法
 * @param module 原生模块
 * @param prop 属性或方法名
 * @returns 原生模块的属性或方法
 */
export function getBoundNativeValue(
  module: NativeExpoGaodeMapModule,
  prop: PropertyKey
): unknown {
  const value = Reflect.get(module as object, prop, module as object);
  if (typeof value === 'function') {
    return (...args: unknown[]) =>
      (value as (...fnArgs: unknown[]) => unknown).apply(module, args);
  }
  return value;
}

export const nativeModule = new Proxy({} as NativeExpoGaodeMapModule, {
  get(_target, prop) {
    const module = getNativeModule(true);
    return module ? getBoundNativeValue(module, prop) : undefined;
  },
});
