/**
 * 高德地图 Web API HTTP 客户端
 */

import { getErrorInfo, isSuccess, type ErrorInfo } from './errorCodes';

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

  constructor(status: string, info: string, infocode: string) {
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
  /** 高德地图 Web API Key */
  key: string;
  /** 基础 URL，默认：https://restapi.amap.com */
  baseURL?: string;
  /** 请求超时时间（毫秒），默认：10000 */
  timeout?: number;
}

/**
 * 高德地图 Web API HTTP 客户端
 */
export class GaodeWebAPIClient {
  private key: string;
  private baseURL: string;
  private timeout: number;

  constructor(config: ClientConfig) {
    this.key = config.key;
    this.baseURL = config.baseURL || 'https://restapi.amap.com';
    this.timeout = config.timeout || 10000;
  }

  /**
   * 发起 HTTP 请求
   */
  async request<T>(path: string, params: Record<string, any> = {}): Promise<T> {
    // 构建 URL
    const url = new URL(path, this.baseURL);
    
    // 添加 key 参数
    url.searchParams.append('key', this.key);
    
    // 添加其他参数
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // 发起请求
      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 检查 HTTP 状态
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      // 解析 JSON
      const data = await response.json();

      // 检查 API 状态
      if (data.status !== '1' && !isSuccess(data.infocode)) {
        throw new GaodeAPIError(
          data.status,
          data.info || 'Unknown error',
          data.infocode || '0'
        );
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
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