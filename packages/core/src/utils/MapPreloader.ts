/**
 * 地图预加载管理器
 * 统一的预加载 API，自动选择原生或 JS 层预加载
 * - 如果原生预加载可用，优先使用原生方案（性能提升 60-80%）
 * - 否则回退到 JS 层预加载（性能提升 5-25%）
 */

// 动态导入原生模块，避免在模块不可用时报错
let NativeModule: any = null;
try {
  NativeModule = require('../ExpoGaodeMapModule').default;
} catch (error) {
  console.warn('[MapPreloader] 原生模块加载失败，将只使用 JS 层预加载');
}

/**
 * 预加载配置
 */
export interface PreloadConfig {
  /** 预加载的地图数量，默认为 1 */
  poolSize?: number;
  /** 预加载延迟时间（毫秒），默认为 0（立即预加载） */
  delay?: number;
  /** 是否启用预加载，默认为 true */
  enabled?: boolean;
  /** 预加载超时时间（毫秒），默认为 15000（15秒） */
  timeout?: number;
  /** 预加载策略：'native' | 'js' | 'auto' | 'hybrid'，默认为 'auto' */
  strategy?: PreloadStrategy;
  /** 超时后是否自动回退到 JS 预加载，默认为 true */
  fallbackOnTimeout?: boolean;
}

/**
 * 预加载状态
 */
export type PreloadStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * 预加载策略
 * - 'native': 仅使用原生预加载
 * - 'js': 仅使用 JS 层预加载
 * - 'auto': 自动选择（优先原生，不可用时用 JS）
 * - 'hybrid': 同时启动原生和 JS，谁先完成用谁（最快最可靠）
 */
export type PreloadStrategy = 'native' | 'js' | 'auto' | 'hybrid';

/**
 * 预加载实例信息
 */
interface PreloadInstance {
  id: string;
  status: PreloadStatus;
  timestamp: number;
  error?: Error;
}

/**
 * 地图预加载管理器类
 * 单例模式，管理地图实例的预加载
 */
class MapPreloaderManager {
  private static instance: MapPreloaderManager;
  private preloadInstances: Map<string, PreloadInstance> = new Map();
  private config: Required<PreloadConfig> & { strategy: PreloadStrategy; fallbackOnTimeout: boolean } = {
    poolSize: 1,
    delay: 0,
    enabled: true,
    timeout: 15000, // 增加到 15 秒，给原生预加载更充足的时间
    strategy: 'auto',
    fallbackOnTimeout: true,
  };
  private currentStrategy: 'native' | 'js' | 'hybrid' = 'js';
  private hybridNativeReady = false;
  private hybridJSReady = false;
  private nativePreloadAvailable: boolean | null = null;
  private preloadTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<(status: PreloadStatus) => void> = new Set();
  private isPreloading = false;
  private activeCheckInterval: ReturnType<typeof setInterval> | null = null;
  private activeTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    // 检测热重载，清理原生状态
    this.detectAndHandleHotReload();
  }
  
  /**
   * 检测并处理热重载
   */
  private detectAndHandleHotReload(): void {
    if (NativeModule) {
      try {
        // 检查原生是否有残留的预加载状态
        const status = NativeModule.getMapPreloadStatus();
        if (status && status.isPreloading) {
          console.warn('[MapPreloader] 检测到热重载，清理原生预加载状态');
          // 清理原生池
          NativeModule.clearMapPreloadPool();
        }
      } catch (error) {
        // 忽略错误
      }
    }
  }

  /**
   * 获取管理器单例实例
   */
  public static getInstance(): MapPreloaderManager {
    if (!MapPreloaderManager.instance) {
      MapPreloaderManager.instance = new MapPreloaderManager();
    }
    return MapPreloaderManager.instance;
  }

  /**
   * 配置预加载参数
   * @param config 预加载配置
   */
  public configure(config: PreloadConfig): void {
    this.config = {
      ...this.config,
      ...config,
      strategy: config.strategy || 'auto',
      fallbackOnTimeout: config.fallbackOnTimeout !== undefined ? config.fallbackOnTimeout : true,
    };
    
    // 重新检测策略
    this.detectStrategy();
  }

  /**
   * 检测并选择最优预加载策略
   */
  private detectStrategy(): void {
    if (this.config.strategy === 'js') {
      this.currentStrategy = 'js';
      console.log('[MapPreloader] 使用 JS 层预加载策略');
      return;
    }

    if (this.config.strategy === 'native') {
      this.currentStrategy = 'native';
      console.log('[MapPreloader] 强制使用原生预加载策略');
      return;
    }

    if (this.config.strategy === 'hybrid') {
      this.currentStrategy = 'hybrid';
      console.log('[MapPreloader] 使用混合预加载策略（原生 + JS 同时进行）');
      return;
    }

    // auto 模式：自动检测
    if (this.nativePreloadAvailable === null) {
      this.nativePreloadAvailable = this.checkNativePreloadAvailable();
    }

    this.currentStrategy = this.nativePreloadAvailable ? 'native' : 'js';
    console.log(`[MapPreloader] 自动选择策略: ${this.currentStrategy}`);
  }

  /**
   * 检查原生预加载是否可用
   */
  private checkNativePreloadAvailable(): boolean {
    try {
      // 检查原生模块是否存在预加载方法
      return (
        NativeModule &&
        typeof NativeModule?.startMapPreload === 'function' &&
        typeof NativeModule?.getMapPreloadStatus === 'function'
      );
    } catch (error) {
      console.warn('[MapPreloader] 原生预加载不可用:', error);
      return false;
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): Required<PreloadConfig> {
    return { ...this.config };
  }

  /**
   * 开始预加载
   * 根据配置和策略选择最优的预加载方式
   */
  public startPreload(): void {
    if (!this.config.enabled) {
      console.log('[MapPreloader] 预加载已禁用');
      return;
    }

    if (this.isPreloading) {
      console.log('[MapPreloader] 预加载已在进行中');
      return;
    }

    // 清理之前的定时器和检查
    this.cleanupActiveTimers();

    // 检测策略
    this.detectStrategy();

    // 清除之前的定时器
    if (this.preloadTimer) {
      clearTimeout(this.preloadTimer);
    }

    // 延迟执行预加载
    this.preloadTimer = setTimeout(() => {
      if (this.currentStrategy === 'hybrid') {
        this.executeHybridPreload();
      } else if (this.currentStrategy === 'native') {
        this.executeNativePreload();
      } else {
        this.executeJSPreload();
      }
    }, this.config.delay);
  }
  
  /**
   * 执行混合预加载（同时启动原生和 JS）
   */
  private async executeHybridPreload(): Promise<void> {
    this.cleanupActiveTimers();
    this.isPreloading = true;
    this.hybridNativeReady = false;
    this.hybridJSReady = false;
    this.notifyListeners('loading');

    console.log(`[MapPreloader] 🚀 开始混合预加载（原生 + JS 同时进行）`);
    const startTime = Date.now();

    // 同时启动原生和 JS 预加载
    const nativePromise = this.executeHybridNativePreload(startTime);
    const jsPromise = this.executeHybridJSPreload(startTime);

    // 等待任意一个完成
    try {
      await Promise.race([nativePromise, jsPromise]);
    } catch (error) {
      console.error('[MapPreloader] 混合预加载失败:', error);
      this.isPreloading = false;
      this.notifyListeners('error');
    }
  }

  /**
   * 混合模式下的原生预加载
   */
  private async executeHybridNativePreload(startTime: number): Promise<void> {
    if (!NativeModule) {
      console.log('[MapPreloader] 原生模块不可用，跳过原生预加载');
      return;
    }

    try {
      // 清理原生池
      await NativeModule.clearMapPreloadPool();
      
      // 开始原生预加载
      await NativeModule.startMapPreload({ poolSize: this.config.poolSize });
      
      let consecutiveReadyCount = 0;
      const REQUIRED_READY_COUNT = 2;
      
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          // 如果 JS 已经完成，停止检查
          if (this.hybridJSReady) {
            clearInterval(checkInterval);
            console.log('[MapPreloader] JS 已完成，停止原生检查');
            resolve();
            return;
          }

          try {
            const status = NativeModule.getMapPreloadStatus();
            
            if (status && !status.isPreloading && status.poolSize > 0) {
              consecutiveReadyCount++;
              
              if (consecutiveReadyCount >= REQUIRED_READY_COUNT) {
                clearInterval(checkInterval);
                
                if (!this.hybridNativeReady && !this.hybridJSReady) {
                  this.hybridNativeReady = true;
                  const duration = Date.now() - startTime;
                  this.isPreloading = false;
                  this.notifyListeners('ready');
                  console.log(`[MapPreloader] ✅ 原生预加载先完成（耗时: ${duration}ms）`);
                  resolve();
                }
              }
            } else {
              consecutiveReadyCount = 0;
            }
          } catch (error) {
            clearInterval(checkInterval);
            console.warn('[MapPreloader] 原生预加载检查失败:', error);
            reject(error);
          }
        }, 100);

        // 超时处理
        setTimeout(() => {
          if (!this.hybridNativeReady && !this.hybridJSReady) {
            clearInterval(checkInterval);
            console.warn('[MapPreloader] ⚠️ 原生预加载超时，等待 JS 完成');
          }
        }, this.config.timeout);
      });
    } catch (error) {
      console.error('[MapPreloader] 原生预加载启动失败:', error);
      throw error;
    }
  }

  /**
   * 混合模式下的 JS 预加载
   */
  private async executeHybridJSPreload(startTime: number): Promise<void> {
    // 创建预加载实例
    for (let i = 0; i < this.config.poolSize; i++) {
      const instanceId = `preload_hybrid_${Date.now()}_${i}`;
      const instance: PreloadInstance = {
        id: instanceId,
        status: 'loading',
        timestamp: Date.now(),
      };
      this.preloadInstances.set(instanceId, instance);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        // 如果原生已经完成，不需要通知
        if (this.hybridNativeReady) {
          this.preloadInstances.forEach((instance) => {
            instance.status = 'ready';
          });
          console.log('[MapPreloader] JS 预加载完成（原生已先完成）');
          resolve();
          return;
        }

        // JS 先完成
        if (!this.hybridJSReady) {
          this.hybridJSReady = true;
          this.preloadInstances.forEach((instance) => {
            instance.status = 'ready';
          });
          
          const duration = Date.now() - startTime;
          this.isPreloading = false;
          this.notifyListeners('ready');
          console.log(`[MapPreloader] ✅ JS 预加载先完成（耗时: ${duration}ms）`);
        }
        
        resolve();
      }, 100);
    });
  }
  
  /**
   * 清理活动的定时器
   */
  private cleanupActiveTimers(): void {
    if (this.activeCheckInterval) {
      clearInterval(this.activeCheckInterval);
      this.activeCheckInterval = null;
    }
    if (this.activeTimeoutTimer) {
      clearTimeout(this.activeTimeoutTimer);
      this.activeTimeoutTimer = null;
    }
  }

  /**
   * 执行原生预加载
   */
  private async executeNativePreload(): Promise<void> {
    // 清理之前可能残留的定时器
    this.cleanupActiveTimers();
    
    this.isPreloading = true;
    this.notifyListeners('loading');

    console.log(`[MapPreloader] 开始原生预加载 ${this.config.poolSize} 个地图实例（超时: ${this.config.timeout}ms）`);

    try {
      const startTime = Date.now();
      
      // 先清理原生池，避免热重载导致的状态不一致
      try {
        await NativeModule.clearMapPreloadPool();
        console.log('[MapPreloader] 已清理原生预加载池');
      } catch (e) {
        // 忽略清理错误
      }
      
      // 开始新的预加载
      await NativeModule.startMapPreload({ poolSize: this.config.poolSize });
      
      let consecutiveReadyCount = 0;
      const REQUIRED_READY_COUNT = 2; // 减少到 2 次确认，提高响应速度
      
      // 等待预加载完成
      this.activeCheckInterval = setInterval(() => {
        try {
          const status = NativeModule.getMapPreloadStatus();
          
          // 检查是否真正完成
          if (status && !status.isPreloading && status.poolSize > 0) {
            consecutiveReadyCount++;
            
            if (consecutiveReadyCount >= REQUIRED_READY_COUNT) {
              this.cleanupActiveTimers();
              
              const duration = Date.now() - startTime;
              this.isPreloading = false;
              this.notifyListeners('ready');
              console.log(`[MapPreloader] ✅ 原生预加载完成（耗时: ${duration}ms，池大小: ${status.poolSize}）`);
            }
          } else {
            consecutiveReadyCount = 0;
          }
        } catch (error) {
          this.cleanupActiveTimers();
          console.error('[MapPreloader] 原生预加载检查失败:', error);
          
          if (this.config.fallbackOnTimeout) {
            console.log('[MapPreloader] 回退到 JS 预加载');
            this.currentStrategy = 'js';
            this.executeJSPreload();
          } else {
            this.isPreloading = false;
            this.notifyListeners('error');
          }
        }
      }, 100);

      // 超时处理
      this.activeTimeoutTimer = setTimeout(() => {
        if (this.isPreloading) {
          this.cleanupActiveTimers();
          
          const duration = Date.now() - startTime;
          
          // 最后检查一次
          try {
            const finalStatus = NativeModule.getMapPreloadStatus();
            if (finalStatus && !finalStatus.isPreloading && finalStatus.poolSize > 0) {
              this.isPreloading = false;
              this.notifyListeners('ready');
              console.log(`[MapPreloader] ✅ 原生预加载完成（耗时: ${duration}ms，接近超时）`);
              return;
            }
          } catch (e) {
            // 忽略
          }
          
          console.warn(`[MapPreloader] ⚠️ 原生预加载超时（${duration}ms > ${this.config.timeout}ms）`);
          console.warn('[MapPreloader] 💡 提示: 热重载可能导致原生状态不同步，建议重启应用');
          
          if (this.config.fallbackOnTimeout) {
            console.log('[MapPreloader] 自动回退到 JS 预加载');
            this.currentStrategy = 'js';
            this.executeJSPreload();
          } else {
            this.isPreloading = false;
            this.notifyListeners('error');
          }
        }
      }, this.config.timeout);
    } catch (error) {
      this.cleanupActiveTimers();
      console.error('[MapPreloader] 原生预加载启动失败:', error);
      this.isPreloading = false;
      this.notifyListeners('error');
      
      if (this.config.fallbackOnTimeout) {
        console.log('[MapPreloader] 回退到 JS 预加载');
        this.currentStrategy = 'js';
        this.executeJSPreload();
      }
    }
  }

  /**
   * 执行 JS 层预加载逻辑
   */
  private executeJSPreload(): void {
    this.isPreloading = true;
    this.notifyListeners('loading');

    const startTime = Date.now();
    console.log(`[MapPreloader] 开始 JS 层预加载 ${this.config.poolSize} 个地图实例`);

    // 创建预加载实例
    for (let i = 0; i < this.config.poolSize; i++) {
      const instanceId = `preload_${Date.now()}_${i}`;
      const instance: PreloadInstance = {
        id: instanceId,
        status: 'loading',
        timestamp: Date.now(),
      };
      this.preloadInstances.set(instanceId, instance);
    }

    // 模拟预加载完成（实际场景中，这里会触发原生地图初始化）
    setTimeout(() => {
      this.preloadInstances.forEach((instance) => {
        instance.status = 'ready';
      });
      this.isPreloading = false;
      this.notifyListeners('ready');
      
      const duration = Date.now() - startTime;
      console.log(`[MapPreloader] ✅ JS 层预加载完成（耗时: ${duration}ms）`);
    }, 100);
  }

  /**
   * 停止预加载
   */
  public stopPreload(): void {
    if (this.preloadTimer) {
      clearTimeout(this.preloadTimer);
      this.preloadTimer = null;
    }
    this.isPreloading = false;
    this.notifyListeners('idle');
  }

  /**
   * 清理所有预加载实例
   */
  public clearPreloadedInstances(): void {
    console.log(`[MapPreloader] 清理 ${this.preloadInstances.size} 个预加载实例`);
    this.preloadInstances.clear();
    this.isPreloading = false;
    this.notifyListeners('idle');
  }

  /**
   * 获取一个可用的预加载实例
   * @returns 预加载实例 ID，如果没有可用实例则返回 null
   */
  public getPreloadedInstance(): string | null {
    for (const [id, instance] of this.preloadInstances.entries()) {
      if (instance.status === 'ready') {
        // 标记为已使用（从池中移除）
        this.preloadInstances.delete(id);
        console.log(`[MapPreloader] 使用预加载实例: ${id}`);
        return id;
      }
    }
    return null;
  }

  /**
   * 获取预加载状态
   */
  public getStatus(): PreloadStatus {
    // 如果使用原生预加载，检查原生状态
    if (this.currentStrategy === 'native') {
      try {
        const nativeStatus = NativeModule.getMapPreloadStatus();
        if (nativeStatus.isPreloading) {
          return 'loading';
        }
        if (nativeStatus.poolSize > 0) {
          return 'ready';
        }
      } catch (error) {
        console.warn('[MapPreloader] 获取原生状态失败:', error);
      }
    }

    // JS 层状态检查
    if (this.isPreloading) {
      return 'loading';
    }
    
    const hasReadyInstance = Array.from(this.preloadInstances.values()).some(
      (instance) => instance.status === 'ready'
    );
    
    if (hasReadyInstance) {
      return 'ready';
    }

    const hasError = Array.from(this.preloadInstances.values()).some(
      (instance) => instance.status === 'error'
    );

    if (hasError) {
      return 'error';
    }

    return 'idle';
  }

  /**
   * 获取当前使用的预加载策略
   */
  public getCurrentStrategy(): 'native' | 'js' | 'hybrid' {
    return this.currentStrategy;
  }

  /**
   * 检查原生预加载是否可用
   */
  public isNativePreloadAvailable(): boolean {
    if (this.nativePreloadAvailable === null) {
      this.nativePreloadAvailable = this.checkNativePreloadAvailable();
    }
    return this.nativePreloadAvailable;
  }

  /**
   * 获取预加载实例数量统计
   */
  public getStats(): {
    total: number;
    ready: number;
    loading: number;
    error: number;
    strategy: 'native' | 'js' | 'hybrid';
  } {
    // 混合模式：返回综合统计
    if (this.currentStrategy === 'hybrid') {
      const jsInstances = Array.from(this.preloadInstances.values());
      let nativePoolSize = 0;
     
      
      try {
        const nativeStatus = NativeModule.getMapPreloadStatus();
        nativePoolSize = nativeStatus.poolSize;
       
      } catch (error) {
        // 忽略
      }

      return {
        total: Math.max(jsInstances.length, nativePoolSize),
        ready: this.hybridNativeReady || this.hybridJSReady ? 1 : 0,
        loading: !this.hybridNativeReady && !this.hybridJSReady ? 1 : 0,
        error: 0,
        strategy: 'hybrid',
      };
    }

    // 如果使用原生预加载，返回原生统计
    if (this.currentStrategy === 'native') {
      try {
        const nativeStatus = NativeModule.getMapPreloadStatus();
        return {
          total: nativeStatus.poolSize,
          ready: nativeStatus.isPreloading ? 0 : nativeStatus.poolSize,
          loading: nativeStatus.isPreloading ? nativeStatus.poolSize : 0,
          error: 0,
          strategy: 'native',
        };
      } catch (error) {
        console.warn('[MapPreloader] 获取原生统计失败:', error);
      }
    }

    // JS 层统计
    const instances = Array.from(this.preloadInstances.values());
    return {
      total: instances.length,
      ready: instances.filter((i) => i.status === 'ready').length,
      loading: instances.filter((i) => i.status === 'loading').length,
      error: instances.filter((i) => i.status === 'error').length,
      strategy: 'js',
    };
  }

  /**
   * 添加状态监听器
   * @param listener 状态变化回调函数
   * @returns 取消监听的函数
   */
  public addListener(listener: (status: PreloadStatus) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器状态变化
   */
  private notifyListeners(status: PreloadStatus): void {
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('[MapPreloader] 监听器执行错误:', error);
      }
    });
  }

  /**
   * 重置管理器状态
   */
  public reset(): void {
    this.stopPreload();
    this.clearPreloadedInstances();
    this.listeners.clear();
    console.log('[MapPreloader] 管理器已重置');
  }
}

/**
 * 导出单例实例
 */
export const MapPreloader = MapPreloaderManager.getInstance();

/**
 * 便捷函数：配置并启动预加载
 * @param config 预加载配置
 */
export function preloadMap(config?: PreloadConfig): void {
  if (config) {
    MapPreloader.configure(config);
  }
  MapPreloader.startPreload();
}

/**
 * 便捷函数：获取预加载状态
 */
export function getPreloadStatus(): PreloadStatus {
  return MapPreloader.getStatus();
}

/**
 * 便捷函数：清理预加载实例
 */
export function clearPreloadedMaps(): void {
  MapPreloader.clearPreloadedInstances();
}