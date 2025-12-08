/**
 * 通用事件管理器
 * 用于管理地图覆盖物的事件回调
 */
export class EventManager<T extends Record<string, any>> {
  private callbacks = new Map<string, T>();
  
  register(id: string, callbacks: T) {
    this.callbacks.set(id, callbacks);
  }
  
  unregister(id: string) {
    this.callbacks.delete(id);
  }
  
  trigger<K extends keyof T>(id: string, eventType: K, data?: any) {
    const callbacks = this.callbacks.get(id);
    const callback = callbacks?.[eventType];
    if (typeof callback === 'function') {
      callback(data);
    }
  }
}