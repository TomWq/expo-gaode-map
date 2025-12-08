/**
 * 高德地图 Web API HTTP 客户端
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
      if (data.status !== '1') {
        const error: APIError = {
          status: data.status,
          info: data.info || 'Unknown error',
          infocode: data.infocode || '0',
        };
        throw new Error(`API Error: ${error.info} (code: ${error.infocode})`);
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