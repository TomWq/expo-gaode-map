
/**
 * 一个轻量级的节流函数，用于限制函数调用的频率。
 * 特别适用于处理高频事件，如地图移动、滚动等。
 *
 * @param func 需要节流的函数
 * @param limit 时间间隔（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (this: ThisParameterType<T>, ...args: Parameters<T>) => void>(
  func: T,
  limit: number
): T {
  let inThrottle = false;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  } as T;
}
