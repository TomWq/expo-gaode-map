# 地图预加载指南

## 概述

地图预加载功能允许你在后台预先初始化地图实例，从而显著提升用户首次打开地图时的加载速度。这对于提升用户体验特别重要，尤其是在地图作为应用核心功能的场景下。

## 🚀 混合预加载方案（推荐）

本项目提供了**统一的混合预加载 API**，自动选择最优策略：

- **原生预加载**：iOS/Android 原生层预加载，性能提升 **60-80%** ⚡
- **JS 层预加载**：JavaScript 层预加载，性能提升 **5-25%** 📈
- **自动回退**：原生不可用时自动使用 JS 层预加载 🔄

### 快速开始

```tsx
import { MapPreloader } from '@pansy/expo-gaode-map';

function App() {
  useEffect(() => {
    // 一行代码启用混合预加载，自动选择最优策略
    MapPreloader.getInstance().initialize({
      poolSize: 2,
      strategy: 'auto'  // 自动选择：原生优先，JS 层回退
    });
  }, []);
  
  return <YourApp />;
}
```

**详细文档**：[混合预加载 API 文档](./HYBRID_PRELOAD_API.md)

## 工作原理

### 混合预加载策略

```
初始化
  ↓
检测原生模块
  ↓
原生可用？
  ├─ 是 → 原生预加载 (60-80% 提升)
  └─ 否 → JS 层预加载 (5-25% 提升)
```

### 原生预加载
1. **iOS**: 后台线程预创建 `MAMapView` 实例
2. **Android**: 协程预创建 `MapView` 实例
3. 实例池管理，线程安全
4. 性能提升 **60-80%**

### JS 层预加载
1. 后台渲染隐藏的 `MapView` 组件
2. 触发地图初始化流程
3. 缓存初始化状态
4. 性能提升 **5-25%**

## 使用方式

### 方式一：使用管理器（推荐）

最简单的方式是使用 [`MapPreloader`](../packages/core/src/utils/MapPreloader.ts) 单例管理器：

```tsx
import { MapPreloader } from '@pansy/expo-gaode-map';

function App() {
  useEffect(() => {
    // 初始化混合预加载，自动选择最优策略
    MapPreloader.getInstance().initialize({
      poolSize: 2,
      strategy: 'auto'  // 'auto' | 'native' | 'js'
    });
  }, []);
  
  return <YourApp />;
}
```

### 方式二：使用 Hook

使用 [`useMapPreload()`](../packages/core/src/hooks/useMapPreload.ts) Hook 获取完整控制：

```tsx
import { useMapPreload } from '@pansy/expo-gaode-map';

function App() {
  const { status, stats, initialize, clear } = useMapPreload();
  
  useEffect(() => {
    initialize({
      poolSize: 2,
      strategy: 'auto'
    });
  }, []);
  
  return (
    <View>
      <Text>策略: {status.strategy}</Text>
      <Text>原生可用: {status.nativeAvailable ? '是' : '否'}</Text>
      <Text>已预加载: {stats.totalPreloaded}</Text>
    </View>
  );
}
```

### 方式三：使用组件

使用 [`MapPreloader`](../packages/core/src/components/MapPreloader.tsx) 组件声明式管理：

```tsx
import { MapPreloader } from '@pansy/expo-gaode-map';

function App() {
  return (
    <View>
      <MapPreloader
        poolSize={2}
        strategy="auto"
        onComplete={() => console.log('预加载完成')}
        onError={(error) => console.error('预加载失败:', error)}
      />
      <YourContent />
    </View>
  );
}
```

### 方式四：使用状态 Hook

如果只需要监控状态，使用 [`useMapPreloadStatus()`](../packages/core/src/hooks/useMapPreload.ts)：

```tsx
import { useMapPreloadStatus } from '@pansy/expo-gaode-map';

function StatusDisplay() {
  const status = useMapPreloadStatus();
  
  return (
    <View>
      <Text>状态: {status.isPreloading ? '预加载中' : '就绪'}</Text>
      <Text>策略: {status.strategy}</Text>
    </View>
  );
}
```

## 配置选项

### PreloadConfig

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `poolSize` | `number` | `2` | 预加载的地图实例数量 |
| `delayMs` | `number` | `0` | 延迟启动预加载的时间（毫秒） |
| `timeoutMs` | `number` | `10000` | 预加载超时时间（毫秒） |
| `strategy` | `'auto' \| 'native' \| 'js'` | `'auto'` | 预加载策略 |

### 策略说明

- **`'auto'`** (推荐)：自动检测并选择最优策略
  - 原生可用 → 使用原生预加载（60-80% 提升）
  - 原生不可用 → 自动回退到 JS 层（5-25% 提升）

- **`'native'`**：强制使用原生预加载
  - 最佳性能（60-80% 提升）
  - 原生不可用时会失败

- **`'js'`**：强制使用 JS 层预加载
  - 纯 JavaScript 实现
  - 性能提升有限（5-25%）

## 最佳实践

### 1. 选择合适的预加载时机

```tsx
// ✅ 推荐：在应用启动后延迟预加载
<MapPreloaderComponent
  config={{
    delay: 2000,  // 等待 2 秒，让应用先完成关键初始化
  }}
/>

// ❌ 不推荐：立即预加载可能影响启动性能
<MapPreloaderComponent
  config={{
    delay: 0,
  }}
/>
```

### 2. 根据使用场景调整池大小

```tsx
// 单地图应用
<MapPreloaderComponent config={{ poolSize: 1 }} />

// 多地图视图应用（如地图列表）
<MapPreloaderComponent config={{ poolSize: 3 }} />
```

### 3. 条件性启用预加载

```tsx
import { Platform } from 'react-native';

function App() {
  // 只在性能较好的设备上启用预加载
  const shouldPreload = Platform.OS === 'ios' || Platform.Version >= 29;

  return (
    <>
      <MapPreloaderComponent
        config={{
          enabled: shouldPreload,
          poolSize: shouldPreload ? 2 : 1,
        }}
      />
      <YourAppContent />
    </>
  );
}
```

### 4. 监控预加载性能

```tsx
function App() {
  const { stats, status } = useMapPreload({
    poolSize: 2,
  });

  useEffect(() => {
    if (status === 'ready') {
      console.log('预加载完成，耗时:', Date.now() - startTime);
      // 上报到分析服务
      Analytics.track('map_preload_complete', {
        duration: Date.now() - startTime,
        poolSize: stats.total,
      });
    }
  }, [status]);

  return <YourApp />;
}
```

### 5. 内存管理

```tsx
function MapScreen() {
  const { clearInstances } = useMapPreload();

  useEffect(() => {
    // 组件卸载时清理未使用的预加载实例
    return () => {
      clearInstances();
    };
  }, []);

  return <MapView />;
}
```

## 性能对比

### 原生预加载 vs JS 层预加载

| 指标 | 未预加载 | JS 层预加载 | 原生预加载 |
|------|---------|------------|-----------|
| 首次显示时间 | ~2000ms | ~1500-1900ms | ~400-800ms |
| 性能提升 | - | **5-25%** | **60-80%** |
| 内存占用 | 基准 | +10-15MB | +15-20MB |
| 实现复杂度 | - | 简单 | 中等 |

### 推荐配置

```tsx
// 生产环境：使用 auto 策略
initialize({ strategy: 'auto', poolSize: 2 });

// 开发环境：可以测试不同策略
initialize({ strategy: 'native', poolSize: 2 });  // 测试原生
initialize({ strategy: 'js', poolSize: 2 });      // 测试 JS 层
```

## 注意事项

1. **内存占用**：每个预加载实例会占用额外内存（约 10-20MB），请根据设备性能合理配置 `poolSize`

2. **启动性能**：如果 `delay` 设置为 0，可能会影响应用启动速度，建议设置适当的延迟

3. **生命周期**：预加载实例在被使用后会自动从池中移除，不会被重复使用

4. **平台差异**：iOS 和 Android 的地图初始化性能可能不同，建议分别测试

5. **网络依赖**：预加载不会预先下载地图瓦片，仍需要网络连接来加载地图数据

## 故障排查

### 预加载未生效

```tsx
// 检查预加载状态
const status = MapPreloader.getStatus();
const stats = MapPreloader.getStats();
console.log('状态:', status, '统计:', stats);

// 确认配置
const config = MapPreloader.getConfig();
console.log('配置:', config);
```

### 内存占用过高

```tsx
// 减少池大小
MapPreloader.configure({ poolSize: 1 });

// 及时清理未使用的实例
MapPreloader.clearPreloadedInstances();
```

### 预加载超时

```tsx
// 增加超时时间
MapPreloader.configure({ timeout: 10000 });
```

## API 参考

完整的 API 文档请参考：

- [`MapPreloader`](../packages/core/src/utils/MapPreloader.ts) - 预加载管理器
- [`useMapPreload()`](../packages/core/src/hooks/useMapPreload.ts) - 预加载 Hook
- [`MapPreloaderComponent`](../packages/core/src/components/MapPreloader.tsx) - 预加载组件

## 示例项目

查看完整示例：

```bash
cd example
npm install
npm start
```

## 相关文档

- **[混合预加载 API 文档](./HYBRID_PRELOAD_API.md)** - 完整的混合预加载 API 参考
- [预加载限制说明](./PRELOAD_LIMITATIONS.md) - 了解 JS 层预加载的限制
- [性能测试指南](./BENCHMARK_GUIDE.md) - 如何测试预加载性能
- [原生实现指南](./NATIVE_PRELOAD_IMPLEMENTATION.md) - 原生预加载实现细节
- [初始化指南](./INITIALIZATION.md)
- [API 文档](./API.md)