/**
 * 高德地图 Web API HTTP 客户端
 */

import { getErrorInfo, isSuccess, type ErrorInfo } from './errorCodes';
import { LRUCache } from './lru';

export type WebApiErrorType =
  | ErrorInfo['type']
  | 'http_error'
  | 'network_error'
  | 'timeout_error'
  | 'abort_error'
  | 'validation_error'
  | 'unknown';

export interface WebApiUnifiedError {
  code: string;
  type: WebApiErrorType;
  message: string;
  retryable: boolean;
  cause?: unknown;
}

function isRetryableInfoCode(infocode: string): boolean {
  const retryableCodes = [
    '10004', // ACCESS_TOO_FREQUENT
    '10014', // QPS_HAS_EXCEEDED_THE_LIMIT
    '10015', // GATEWAY_TIMEOUT
    '10016', // SERVER_IS_BUSY
    '10017', // RESOURCE_UNAVAILABLE
    '10019', // CQPS_HAS_EXCEEDED_THE_LIMIT
    '10020', // CKQPS_HAS_EXCEEDED_THE_LIMIT
    '10021', // CUQPS_HAS_EXCEEDED_THE_LIMIT
  ];
  return retryableCodes.includes(infocode);
}

export class GaodeWebApiRuntimeError
  extends Error
  implements WebApiUnifiedError
{
  public readonly code: string;
  public readonly type: WebApiErrorType;
  public readonly retryable: boolean;
  public readonly cause?: unknown;

  constructor(options: {
    code: string;
    type: WebApiErrorType;
    message: string;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = 'GaodeWebApiRuntimeError';
    this.code = options.code;
    this.type = options.type;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
    Object.setPrototypeOf(this, GaodeWebApiRuntimeError.prototype);
  }

  toJSON(): WebApiUnifiedError {
    return {
      code: this.code,
      type: this.type,
      message: this.message,
      retryable: this.retryable,
      cause: this.cause,
    };
  }
}

/**
 * 从核心包解析 getWebKey（运行时解析，避免类型导出时序问题）
 */
export function resolveWebKey(): string | undefined {
  // 1) 尝试从核心地图包读取
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const core = require('expo-gaode-map');
    const fn = core?.getWebKey;
    if (typeof fn === 'function') {
      return fn();
    }
  } catch {
    // ignore
  }
  // 2) 若未安装核心包，则尝试从导航包读取（导航内置地图）
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nav = require('expo-gaode-map-navigation');
    const fn2 = nav?.getWebKey;
    if (typeof fn2 === 'function') {
      return fn2();
    }
  } catch {
    // ignore
  }
  return undefined;
}


/**
 * 高德地图 API 错误类
 */
export class GaodeAPIError extends Error {
  /** 错误码 */
  public readonly code: string;
  /** 官方错误信息 */
  public readonly info: string;
  /** 友好的错误描述 */
  public readonly description: string;
  /** 问题排查建议 */
  public readonly suggestion: string;
  /** 错误类型 */
  public readonly type: ErrorInfo['type'];
  /** API 响应状态 */
  public readonly status: string;
  /** 是否可重试 */
  public readonly retryable: boolean;
  /** 原始原因 */
  public readonly cause?: unknown;

  constructor(
    status: string,
    info: string,
    infocode: string,
    options: { cause?: unknown } = {}
  ) {
    const errorInfo = getErrorInfo(infocode);
    
    // 使用友好的错误描述作为 message
    super(`${errorInfo.description} (${infocode})`);
    
    this.name = 'GaodeAPIError';
    this.status = status;
    this.code = infocode;
    this.info = info;
    this.description = errorInfo.description;
    this.suggestion = errorInfo.suggestion;
    this.type = errorInfo.type;
    this.retryable = isRetryableInfoCode(infocode);
    this.cause = options.cause;

    // 保持正确的 prototype 链
    Object.setPrototypeOf(this, GaodeAPIError.prototype);
  }

  /**
   * 获取完整的错误信息（用于日志记录）
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      info: this.info,
      description: this.description,
      suggestion: this.suggestion,
      type: this.type,
      status: this.status,
      retryable: this.retryable,
      cause: this.cause,
    };
  }

  /**
   * 获取用户友好的错误提示
   */
  getUserMessage(): string {
    return `${this.description}\n\n💡 ${this.suggestion}`;
  }
}

/**
 * @deprecated 使用 GaodeAPIError 代替
 */
export interface APIError {
  status: string;
  info: string;
  infocode: string;
}

/**
 * HTTP 客户端配置
 */
export interface ClientConfig {
  /** 高德地图 Web API Key ,默认可以通过 getWebKey 获取，所以不再是必传*/
  key?: string;
  /** 基础 URL，默认：https://restapi.amap.com */
  baseURL?: string;
  /** 请求超时时间（毫秒），默认：10000 */
  timeout?: number;
  /** 最大重试次数，默认：3 */
  maxRetries?: number;
  /** 重试延迟（毫秒），默认：1000 */
  retryDelay?: number;
  /** 是否启用缓存，默认：false */
  enableCache?: boolean;
  /** 缓存容量，默认：100 */
  cacheCapacity?: number;
}

/**
 * 请求选项
 */
export interface RequestOptions {
  /** 请求参数 */
  params?: object;
  /** AbortSignal 用于取消请求 */
  signal?: AbortSignal;
  /** 是否使用缓存（仅当全局启用缓存时有效），默认：true */
  useCache?: boolean;
}

/**
 * 高德地图 Web API HTTP 客户端
 */
export class GaodeWebAPIClient {
  
  private key: string;
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private cache?: LRUCache<string, unknown>;

  constructor(config: ClientConfig) {
    this.key = config.key || resolveWebKey() || '';
    this.baseURL = config.baseURL || 'https://restapi.amap.com';
    this.timeout = config.timeout || 10000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;

    if (config.enableCache) {
      this.cache = new LRUCache<string, unknown>(config.cacheCapacity ?? 100);
    }
  }

  /**
   * 发起 HTTP 请求
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params = {}, signal, useCache = true } = options;
    
    // 构建 URL
    const url = new URL(path, this.baseURL);
    
    // 添加 key 参数
    url.searchParams.append('key', this.key);
    
    // 添加其他参数
    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    // 检查缓存
    const cacheKey = url.toString();
    if (this.cache && useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as T;
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      // 如果外部 signal 已经中止，则直接抛出
      if (signal?.aborted) {
        throw new GaodeWebApiRuntimeError({
          code: 'REQUEST_ABORTED',
          type: 'abort_error',
          message: 'Request aborted',
          retryable: false,
        });
      }

      // 创建 AbortController 用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // 处理 signal 合并：如果外部 signal 触发，也要 abort 内部 controller
      const onAbort = () => controller.abort();
      if (signal) {
        signal.addEventListener('abort', onAbort);
      }

      try {
        // 发起请求
        const response = await fetch(url.toString(), {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }

        // 检查 HTTP 状态
        if (!response.ok) {
          throw new GaodeWebApiRuntimeError({
            code: `HTTP_${response.status}`,
            type: 'http_error',
            message: `HTTP Error: ${response.status} ${response.statusText}`,
            retryable: response.status >= 500,
          });
        }

        // 解析 JSON
        const data = await response.json();

        // 检查 API 状态
        if (data.status !== '1' && !isSuccess(data.infocode)) {
          // 检查是否为可重试的错误码 (QPS超限等)
          if (isRetryableInfoCode(data.infocode) && attempt < this.maxRetries) {
             const error = new GaodeAPIError(
              data.status,
              data.info || 'Unknown error',
              data.infocode || '0'
            );
            // 抛出错误以触发重试逻辑
            throw error;
          }

          throw new GaodeAPIError(
            data.status,
            data.info || 'Unknown error',
            data.infocode || '0'
          );
        }

        // 写入缓存
        if (this.cache && useCache) {
          this.cache.set(cacheKey, data);
        }

        return data as T;
      } catch (error) {
        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        
        lastError = error instanceof Error ? error : new Error(String(error));

        // 如果是 AbortError (无论是超时还是手动取消)
        if (lastError.name === 'AbortError') {
           // 如果是手动取消，不重试
           if (signal?.aborted) {
             throw new GaodeWebApiRuntimeError({
               code: 'REQUEST_ABORTED',
               type: 'abort_error',
               message: 'Request aborted',
               retryable: false,
               cause: lastError,
             });
           }
           // 如果是超时，且还有重试机会，则继续
           if (attempt < this.maxRetries) {
             // 继续下一次循环
           } else {
             throw new GaodeWebApiRuntimeError({
               code: 'REQUEST_TIMEOUT',
               type: 'timeout_error',
               message: `Request timeout after ${this.timeout}ms`,
               retryable: true,
               cause: lastError,
             });
           }
        }

        // 如果不是最后一次尝试，且是可重试的错误（网络错误或特定API错误）
        if (attempt < this.maxRetries && this.isRetryableError(lastError)) {
          // 等待一段时间后重试（指数退避）
          const delay = this.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (lastError instanceof GaodeAPIError || lastError instanceof GaodeWebApiRuntimeError) {
          throw lastError;
        }

        throw new GaodeWebApiRuntimeError({
          code: 'NETWORK_REQUEST_FAILED',
          type: 'network_error',
          message: lastError.message,
          retryable: true,
          cause: lastError,
        });
      }
    }

    if (lastError instanceof GaodeAPIError || lastError instanceof GaodeWebApiRuntimeError) {
      throw lastError;
    }

    throw new GaodeWebApiRuntimeError({
      code: 'UNKNOWN_ERROR',
      type: 'unknown',
      message: lastError?.message ?? 'Unknown error occurred',
      retryable: false,
      cause: lastError ?? undefined,
    });
  }

  /**
   * 判断是否为可重试的异常
   */
  private isRetryableError(error: Error): boolean {
    // GaodeAPIError 通过官方 infocode 判断是否可重试
    if (error instanceof GaodeAPIError) {
      return isRetryableInfoCode(error.code);
    }
    if (error instanceof GaodeWebApiRuntimeError) {
      return error.retryable;
    }
    // 网络错误通常没有 status 属性或者 status 为 undefined (fetch 失败)
    // 这里简单认为非 API 业务逻辑错误都可以尝试重试（除了 AbortError 已经在上面处理了）
    return true;
  }

  /**
   * 更新 API Key
   */
  setKey(key: string): void {
    this.key = key;
  }

  /**
   * 获取当前 API Key
   */
  getKey(): string {
    return this.key;
  }
}
