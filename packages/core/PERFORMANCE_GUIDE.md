# 性能优化指南：事件节流 (Throttling)

## 为什么需要节流？

高德地图组件会触发一些非常高频的事件，最典型的就是 `onCameraMove`（相机移动）。当用户拖动地图或缩放时，这个事件可能会在 1 秒内触发几十次甚至上百次。

如果在 `onCameraMove` 回调中直接执行耗时操作（如 `setState`、复杂计算、打印日志），会导致：
1. **JS 线程阻塞**：UI 响应变慢，动画卡顿。
2. **掉帧**：地图滑动不流畅。
3. **设备发热**：CPU 占用率过高。

为了解决这个问题，我们建议对高频事件进行**节流 (Throttling)** 处理。

## 如何使用内置节流函数

`expo-gaode-map` 提供了一个轻量级的内置 `throttle` 工具函数，无需安装 lodash 等第三方库。

### 1. 引入工具

```typescript
import { throttle } from 'expo-gaode-map';
import { useMemo } from 'react';
```

### 2. 在组件中使用

使用 `useMemo` 创建一个节流后的回调函数，确保在组件重渲染时保持节流状态。

```typescript
export default function MapScreen() {
  // 创建节流回调，每 100ms 最多触发一次
  const onCameraMoveThrottled = useMemo(
    () =>
      throttle(({ nativeEvent }) => {
        // 在这里处理高频更新逻辑
        const { cameraPosition } = nativeEvent;
        console.log('当前缩放级别:', cameraPosition.zoom);
        
        // 比如更新状态用于 UI 显示
        // setCameraInfo(cameraPosition); 
      }, 100), // 100ms 是一个推荐的平衡值
    []
  );

  return (
    <MapView
      // ...其他属性
      onCameraMove={onCameraMoveThrottled} // 使用节流后的回调
      onCameraIdle={({ nativeEvent }) => {
        // 相机停止时触发一次，不需要节流
        // 适合做最后的数据同步或重度计算
        console.log('移动结束:', nativeEvent);
      }}
    />
  );
}
```

## 什么时候需要节流？

| 事件名 | 触发频率 | 是否建议节流 | 典型场景 |
| :--- | :--- | :--- | :--- |
| `onCameraMove` | **极高** | ✅ **强烈建议** | 实时显示中心点坐标、联动其他 UI |
| `onLocation` | 中等 | ❌ 一般不需要 | 只有设置了极短的 `interval` 时才需要 |
| `onCameraIdle` | 低 | ❌ 不需要 | 移动结束后的数据加载、反向地理编码 |
| `onMapPress` | 低 | ❌ 不需要 | 点击打点、交互 |

## 最佳实践

1. **优先使用 `onCameraIdle`**：如果你的业务逻辑不需要在移动过程中实时更新（例如“移动结束后加载周边数据”），请直接使用 `onCameraIdle`，它只在停止时触发一次，完全不需要节流。
2. **避免在回调中做重计算**：即使使用了节流，也尽量不要在 `onCameraMove` 中进行复杂的逻辑运算或大量的 DOM 操作。
3. **合理设置时间间隔**：
   - **16ms** (约 60fps)：极度流畅，适合动画联动。
   - **100ms - 200ms**：适合更新文本显示，肉眼几乎无延迟感，性能开销小。
   - **500ms+**：适合网络请求（但更建议用 `debounce` 或 `onCameraIdle`）。
