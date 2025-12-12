# 混合预加载 API 文档

## 概述

混合预加载方案提供了**统一的 API**，自动选择最优的预加载策略：
- **原生预加载**：iOS/Android 原生层预加载，性能提升 60-80%
- **JS 层预加载**：JavaScript 层预加载，性能提升 5-25%
- **自动回退**：原生不可用时自动使用 JS 层预加载

## 核心特性

### 🎯 统一 API
- 一套 API 同时支持原生和 JS 层预加载
- 自动检测原生模块可用性
- 无需手动切换策略

### 🚀 智能策略
- **'auto'** (默认)：自动选择最优策略
- **'native'**：强制使用原生预加载
- **'js'**：强制使用 JS 层预加载

### 📊 性能对比
| 策略 | 性能提升 | 适用场景 |
|------|---------|---------|
| 原生预加载 | 60-80% | 生产环境推荐 |
| JS 层预加载 | 5-25% | 开发调试、原生不可用 |

## API 参考

### MapPreloader 类

单例模式的预加载管理器，提供全局预加载控制。

#### 方法

##### `getInstance()`
获取预加载管理器单例实例。

```typescript
import { MapPreloader } from '@pansy/expo-gaode-map';

const preloader = MapPreloader.getInstance();
```

##### `initialize(config)`
初始化预加载配置。

**参数：**
```typescript
interface PreloadConfig {
  poolSize?: number;        // 预加载实例数量，默认 2
  delayMs?: number;         // 延迟启动时间(ms)，默认 0
  timeoutMs?: number;       // 超时时间(ms)，默认 10000
  strategy?: 'auto' | 'native' | 'js';  // 预加载策略，默认 'auto'
}
```

**示例：**
```typescript
// 使用默认配置（推荐）
preloader.initialize();

// 自定义配置
preloader.initialize({
  poolSize: 3,
  delayMs: 1000,
  strategy: 'auto'  // 自动选择最优策略
});

// 强制使用原生预加载
preloader.initialize({
  strategy: 'native'
});

// 强制使用 JS 层预加载
preloader.initialize({
  strategy: 'js'
});
```

##### `getStatus()`
获取当前预加载状态。

**返回值：**
```typescript
interface PreloadStatus {
  isInitialized: boolean;   // 是否已初始化
  isPreloading: boolean;    // 是否正在预加载
  poolSize: number;         // 当前池大小
  strategy: 'native' | 'js'; // 实际使用的策略
  nativeAvailable: boolean; // 原生预加载是否可用
}
```

**示例：**
```typescript
const status = preloader.getStatus();
console.log('预加载状态:', status);
console.log('使用策略:', status.strategy);
console.log('原生可用:', status.nativeAvailable);
```

##### `getStats()`
获取预加载统计信息。

**返回值：**
```typescript
interface PreloadStats {
  totalPreloaded: number;   // 总预加载次数
  totalUsed: number;        // 总使用次数
  currentPoolSize: number;  // 当前池大小
  strategy: 'native' | 'js'; // 使用的策略
}
```

##### `clear()`
清空预加载池。

```typescript
preloader.clear();
```

---

### useMapPreload Hook

React Hook，提供完整的预加载控制和状态监控。

**返回值：**
```typescript
interface UseMapPreloadReturn {
  status: PreloadStatus;    // 预加载状态
  stats: PreloadStats;      // 统计信息
  initialize: (config?: PreloadConfig) => void;  // 初始化
  clear: () => void;        // 清空池
}
```

**示例：**
```typescript
import { useMapPreload } from '@pansy/expo-gaode-map';

function App() {
  const { status, stats, initialize, clear } = useMapPreload();
  
  useEffect(() => {
    // 应用启动时初始化预加载
    initialize({
      poolSize: 2,
      strategy: 'auto'  // 自动选择策略
    });
  }, []);
  
  return (
    <View>
      <Text>策略: {status.strategy}</Text>
      <Text>原生可用: {status.nativeAvailable ? '是' : '否'}</Text>
      <Text>已预加载: {stats.totalPreloaded}</Text>
      <Text>已使用: {stats.totalUsed}</Text>
    </View>
  );
}
```

---

### useMapPreloadStatus Hook

简化版 Hook，仅返回状态信息。

**返回值：**
```typescript
PreloadStatus
```

**示例：**
```typescript
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

---

### MapPreloader 组件

声明式预加载组件，自动管理预加载生命周期。

**Props：**
```typescript
interface MapPreloaderProps {
  poolSize?: number;        // 预加载数量
  delayMs?: number;         // 延迟时间
  strategy?: 'auto' | 'native' | 'js';  // 预加载策略
  onComplete?: () => void;  // 完成回调
  onError?: (error: Error) => void;  // 错误回调
}
```

**示例：**
```typescript
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
      
      {/* 其他内容 */}
    </View>
  );
}
```

---

## 使用场景

### 1. 应用启动时预加载（推荐）

```typescript
import { MapPreloader } from '@pansy/expo-gaode-map';

function App() {
  useEffect(() => {
    // 应用启动时初始化，自动选择最优策略
    MapPreloader.getInstance().initialize({
      poolSize: 2,
      strategy: 'auto'
    });
  }, []);
  
  return <YourApp />;
}
```

### 2. 使用 Hook 管理

```typescript
import { useMapPreload } from '@pansy/expo-gaode-map';

function App() {
  const { status, initialize } = useMapPreload();
  
  useEffect(() => {
    initialize({ strategy: 'auto' });
  }, []);
  
  return (
    <View>
      <Text>使用策略: {status.strategy}</Text>
      <Text>原生可用: {status.nativeAvailable ? '是' : '否'}</Text>
    </View>
  );
}
```

### 3. 使用组件方式

```typescript
import { MapPreloader } from '@pansy/expo-gaode-map';

function App() {
  return (
    <View>
      <MapPreloader
        strategy="auto"
        onComplete={() => console.log('预加载完成')}
      />
      <YourContent />
    </View>
  );
}
```

---

## 策略选择指南

### 'auto' 策略（推荐）
- ✅ 自动检测原生模块可用性
- ✅ 优先使用原生预加载（60-80% 提升）
- ✅ 原生不可用时自动回退到 JS 层
- ✅ 适合所有场景

```typescript
initialize({ strategy: 'auto' });
```

### 'native' 策略
- ✅ 强制使用原生预加载
- ✅ 最佳性能（60-80% 提升）
- ⚠️ 原生不可用时会失败
- 适合：生产环境，确保原生模块可用

```typescript
initialize({ strategy: 'native' });
```

### 'js' 策略
- ✅ 纯 JavaScript 实现
- ✅ 无需原生模块
- ⚠️ 性能提升有限（5-25%）
- 适合：开发调试、原生模块不可用

```typescript
initialize({ strategy: 'js' });
```

---

## 工作原理

### 自动策略选择流程

```
初始化
  ↓
检测原生模块
  ↓
原生可用？
  ├─ 是 → 使用原生预加载 (60-80% 提升)
  └─ 否 → 使用 JS 层预加载 (5-25% 提升)
```

### 原生预加载
1. **iOS**: 后台线程预创建 `MAMapView` 实例
2. **Android**: 协程预创建 `MapView` 实例
3. 实例池管理，线程安全
4. 自动配置基础参数

### JS 层预加载
1. 后台渲染隐藏的 `MapView` 组件
2. 触发地图初始化流程
3. 缓存初始化状态
4. 复用已初始化的组件

---

## 性能数据

### 原生预加载
- **首次显示时间**: 减少 60-80%
- **内存占用**: 每个实例约 15-20MB
- **推荐池大小**: 2-3 个实例

### JS 层预加载
- **首次显示时间**: 减少 5-25%
- **内存占用**: 每个实例约 10-15MB
- **推荐池大小**: 1-2 个实例

---

## 最佳实践

### ✅ 推荐做法

1. **使用 'auto' 策略**
```typescript
initialize({ strategy: 'auto' });
```

2. **应用启动时初始化**
```typescript
useEffect(() => {
  MapPreloader.getInstance().initialize();
}, []);
```

3. **监控预加载状态**
```typescript
const { status } = useMapPreload();
console.log('使用策略:', status.strategy);
```

4. **合理设置池大小**
```typescript
initialize({ poolSize: 2 }); // 推荐 2-3 个
```

### ❌ 避免做法

1. ❌ 不要设置过大的池大小
```typescript
initialize({ poolSize: 10 }); // 浪费内存
```

2. ❌ 不要频繁初始化
```typescript
// 错误：每次渲染都初始化
useEffect(() => {
  initialize();
}); // 缺少依赖数组
```

3. ❌ 不要忽略错误处理
```typescript
// 推荐：添加错误处理
<MapPreloader
  onError={(error) => console.error(error)}
/>
```

---

## 内存管理和清理

### 🔄 自动清理机制

预加载实例在以下情况下会**自动清理**，无需手动处理：

#### 1. 使用时自动移除
```typescript
// 预加载实例被使用后会自动从池中移除
const mapView = <MapView />; // 自动使用预加载实例并移除
```

#### 2. 使用 Hook 时自动清理
```typescript
function App() {
  const { initialize } = useMapPreload();
  
  useEffect(() => {
    initialize({ poolSize: 2 });
  }, []);
  
  // ✅ 组件卸载时自动清理，无需手动处理
}
```

#### 3. 使用组件时自动清理
```typescript
function App() {
  return (
    <MapPreloader poolSize={2} />
    // ✅ 组件卸载时自动清理
  );
}
```

#### 4. 应用退出时自动清理
```typescript
// ✅ 原生模块销毁时自动清理所有预加载实例
// iOS: OnDestroy { MapPreloadManager.shared.cleanup() }
// Android: OnDestroy { MapPreloadManager.cleanup() }
```

### 🛠️ 手动清理场景

在以下特殊场景下，你可能需要**手动清理**：

#### 场景 1: 直接使用管理器（不使用 Hook）

```typescript
function App() {
  useEffect(() => {
    MapPreloader.getInstance().initialize({ poolSize: 2 });
    
    return () => {
      // ⚠️ 需要手动清理
      MapPreloader.getInstance().clear();
    };
  }, []);
}
```

**推荐做法**：使用 Hook 代替直接使用管理器
```typescript
// ✅ 推荐：使用 Hook，自动清理
function App() {
  const { initialize } = useMapPreload();
  
  useEffect(() => {
    initialize({ poolSize: 2 });
  }, []); // 自动清理，无需手动处理
}
```

#### 场景 2: 内存压力大时主动清理

```typescript
import { AppState } from 'react-native';

function App() {
  const { clear } = useMapPreload();
  
  useEffect(() => {
    // 收到内存警告时清理预加载池
    const subscription = AppState.addEventListener('memoryWarning', () => {
      console.log('⚠️ 内存警告，清理预加载池');
      clear();
    });
    
    return () => subscription.remove();
  }, []);
}
```

#### 场景 3: 长时间不使用地图时清理

```typescript
function App() {
  const { clear } = useMapPreload();
  
  useEffect(() => {
    // 如果 5 分钟内没有使用地图，清理预加载池释放内存
    const timer = setTimeout(() => {
      console.log('⏰ 长时间未使用，清理预加载池');
      clear();
    }, 5 * 60 * 1000);
    
    return () => clearTimeout(timer);
  }, []);
}
```

#### 场景 4: 用户切换账号或登出时清理

```typescript
function App() {
  const { clear } = useMapPreload();
  
  const handleLogout = () => {
    // 用户登出时清理预加载池
    clear();
    // 其他登出逻辑...
  };
  
  return (
    <Button title="登出" onPress={handleLogout} />
  );
}
```

### 📊 清理策略对比

| 场景 | 是否需要手动清理 | 推荐做法 |
|------|----------------|---------|
| 使用 Hook | ❌ 自动清理 | 推荐使用 |
| 使用组件 | ❌ 自动清理 | 推荐使用 |
| 直接使用管理器 | ⚠️ 需要手动清理 | 不推荐 |
| 内存警告 | ✅ 主动清理 | 监听系统事件 |
| 长时间不使用 | ✅ 主动清理 | 设置定时器 |
| 用户登出 | ✅ 主动清理 | 在登出逻辑中清理 |

### 💡 最佳实践

#### ✅ 推荐做法

```typescript
// 1. 使用 Hook，享受自动清理
function App() {
  const { initialize, clear } = useMapPreload();
  
  useEffect(() => {
    initialize({ poolSize: 2 });
    // ✅ 自动清理，无需手动处理
  }, []);
  
  // 2. 在特殊场景下主动清理
  useEffect(() => {
    const subscription = AppState.addEventListener('memoryWarning', clear);
    return () => subscription.remove();
  }, []);
}
```

#### ❌ 避免做法

```typescript
// ❌ 不推荐：直接使用管理器且忘记清理
function App() {
  useEffect(() => {
    MapPreloader.getInstance().initialize({ poolSize: 2 });
    // ❌ 忘记清理，可能导致内存泄漏
  }, []);
}

// ❌ 不推荐：过度清理
function App() {
  const { clear } = useMapPreload();
  
  useEffect(() => {
    // ❌ 每次渲染都清理，失去预加载意义
    clear();
  });
}
```

### 🔍 监控内存使用

```typescript
function App() {
  const { stats, status } = useMapPreload();
  
  useEffect(() => {
    // 监控预加载池状态
    console.log('当前池大小:', stats.currentPoolSize);
    console.log('已预加载:', stats.totalPreloaded);
    console.log('已使用:', stats.totalUsed);
    
    // 根据使用情况决定是否清理
    if (stats.currentPoolSize > 0 && stats.totalUsed === 0) {
      console.log('⚠️ 有未使用的预加载实例');
    }
  }, [stats]);
}
```

---

## 故障排查

### 问题：原生预加载不工作

**检查步骤：**
1. 确认原生模块已正确安装
2. 检查 `status.nativeAvailable` 是否为 `true`
3. 查看控制台是否有错误日志

**解决方案：**
```typescript
const { status } = useMapPreload();
if (!status.nativeAvailable) {
  console.log('原生预加载不可用，使用 JS 层预加载');
}
```

### 问题：性能提升不明显

**可能原因：**
1. 使用了 JS 层预加载（提升有限）
2. 池大小设置过小
3. 设备性能较差

**解决方案：**
```typescript
// 1. 确认使用原生预加载
const { status } = useMapPreload();
console.log('策略:', status.strategy); // 应该是 'native'

// 2. 增加池大小
initialize({ poolSize: 3 });

// 3. 使用性能测试工具
import { MapPreloadBenchmark } from './example/MapPreloadBenchmark';
```

---

## 相关文档

- [地图预加载使用指南](./MAP_PRELOAD_GUIDE.md)
- [预加载限制说明](./PRELOAD_LIMITATIONS.md)
- [性能测试指南](./BENCHMARK_GUIDE.md)
- [原生实现指南](./NATIVE_PRELOAD_IMPLEMENTATION.md)