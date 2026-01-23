
/**
 * 简单的 LRU (Least Recently Used) 缓存实现
 */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // 刷新访问顺序：先删除再重新添加
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // 如果已存在，更新值并刷新位置
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 如果已满，删除最久未使用的项（Map 的第一个项）
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
         this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}
