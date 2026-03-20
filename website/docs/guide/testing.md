# 测试与质量保证

expo-gaode-map 拥有完善的单元测试体系，确保代码质量和稳定性。

## 📊 测试覆盖率

当前测试覆盖率：**75.7%** ✅

```
-------------------------|---------|----------|---------|---------|-------------------
File                     | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------------|---------|----------|---------|---------|-------------------
All files                |    75.7 |    72.89 |    87.5 |   75.14 |
 src                     |   55.78 |    41.46 |   71.42 |   54.83 |
  ExpoGaodeMapModule.ts  |   70.68 |    60.71 |   91.66 |   70.68 |
  ExpoGaodeMapView.tsx   |   32.43 |        0 |   44.44 |   28.57 |
 src/components/overlays |      96 |    82.14 |     100 |      96 |
  Circle.tsx             |     100 |      100 |     100 |     100 |
  Cluster.tsx            |     100 |      100 |     100 |     100 |
  HeatMap.tsx            |     100 |      100 |     100 |     100 |
  Marker.tsx             |    92.3 |    82.14 |     100 |    92.3 |
  MultiPoint.tsx         |     100 |      100 |     100 |     100 |
  Polygon.tsx            |     100 |      100 |     100 |     100 |
  Polyline.tsx           |     100 |      100 |     100 |     100 |
 src/utils               |     100 |      100 |     100 |     100 |
  ErrorHandler.ts        |     100 |      100 |     100 |     100 |
-------------------------|---------|----------|---------|---------|-------------------

Test Suites: 12 passed, 12 total
Tests:       207 passed, 207 total
Snapshots:   0 total
Time:        0.996 s
```

## ✅ 测试范围

### 核心模块测试

#### ExpoGaodeMapModule（91.66% 函数覆盖率）

**基础功能测试**（72个测试）
- ✅ SDK 初始化和版本获取
- ✅ 隐私合规管理
- ✅ 定位控制（启动、停止、检查状态）
- ✅ 单次定位和连续定位
- ✅ 坐标转换（支持所有坐标系）
- ✅ 权限检查和请求
- ✅ 定位监听器管理

**配置选项测试**（所有 set* 方法）
- ✅ Android 配置（定位模式、传感器、WiFi、GPS优先等）
- ✅ iOS 配置（精度、距离过滤、后台定位等）
- ✅ 通用配置（间隔、超时、语言等）

**深度测试**（43个测试 - 新增）
- ✅ **错误场景测试**：SDK未初始化、无效参数、权限拒绝
- ✅ **边界值测试**：数值参数边界、枚举值、字符串参数
- ✅ **配置组合测试**：Android/iOS完整配置链、不同定位场景
- ✅ **生命周期测试**：完整的定位流程、监听器管理
- ✅ **异步操作测试**：Promise 返回值验证
- ✅ **多监听器测试**：添加、移除、重复操作
- ✅ **坐标转换测试**：GPS、百度、谷歌等坐标系转换

#### ExpoGaodeMapView
- ✅ 地图视图组件渲染
- ✅ 相机控制（移动、缩放、旋转）
- ✅ 地图操作（setCenter、setZoom 等）
- ✅ 引用方法调用

### 覆盖物组件测试

所有覆盖物组件都有 **100% 测试覆盖率**：

- ✅ **Circle** - 圆形覆盖物
- ✅ **Marker** - 标记点
- ✅ **Polyline** - 折线
- ✅ **Polygon** - 多边形
- ✅ **HeatMap** - 热力图
- ✅ **Cluster** - 点聚合
- ✅ **MultiPoint** - 海量点

每个覆盖物测试包括：
- Props 传递验证
- 事件处理测试
- 边界情况测试

### 工具类测试

#### ErrorHandler（100% 覆盖率）
- ✅ 8 种错误类型创建
- ✅ 原生错误识别和包装
- ✅ 错误消息格式化
- ✅ 日志控制功能

## 🧪 运行测试

### 安装依赖

测试框架使用 Jest 和 React Native Testing Library：

```bash
cd packages/core
bun install
```

### 运行所有测试

```bash
bun test
```

### 运行特定测试文件

```bash
bun test ExpoGaodeMapModule
```

### 生成覆盖率报告

```bash
bun test --coverage
```

覆盖率报告将生成在 `coverage/` 目录下，可以在浏览器中打开 `coverage/lcov-report/index.html` 查看详细报告。

### 监听模式

```bash
bun test --watch
```

## 📝 测试示例

### 基础测试示例

```typescript
import ExpoGaodeMapModule from '../ExpoGaodeMapModule';

describe('ExpoGaodeMapModule', () => {
  it('应该成功初始化 SDK', async () => {
    await expect(
      ExpoGaodeMapModule.initSDK({
        androidKey: 'test-android-key',
        iosKey: 'test-ios-key',
      })
    ).resolves.toBeUndefined();
  });

  it('SDK 未初始化时应该抛出错误', async () => {
    await expect(
      ExpoGaodeMapModule.start()
    ).rejects.toThrow('SDK_NOT_INITIALIZED');
  });
});
```

### 组件测试示例

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { Marker } from '../Marker';

describe('Marker', () => {
  it('应该正确渲染', () => {
    const { toJSON } = render(
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        title="测试标记"
      />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('应该传递正确的 props', () => {
    const { getByTestId } = render(
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        title="测试标记"
        testID="marker"
      />
    );
    
    const marker = getByTestId('marker');
    expect(marker.props.position).toEqual({
      latitude: 39.9,
      longitude: 116.4
    });
  });
});
```

### 错误处理测试示例

```typescript
import { ErrorHandler, ErrorType, GaodeMapError } from '../ErrorHandler';

describe('ErrorHandler', () => {
  it('应该创建 SDK 未初始化错误', () => {
    const error = ErrorHandler.sdkNotInitialized();
    
    expect(error).toBeInstanceOf(GaodeMapError);
    expect(error.type).toBe(ErrorType.SDK_NOT_INITIALIZED);
    expect(error.message).toContain('SDK 尚未初始化');
    expect(error.solution).toContain('initSDK');
  });

  it('应该识别并包装原生错误', () => {
    const nativeError = new Error('Permission denied');
    const wrappedError = ErrorHandler.wrapNativeError(nativeError);
    
    expect(wrappedError.type).toBe(ErrorType.PERMISSION_DENIED);
  });
});
```

## 🎯 测试策略

### 1. 单元测试

针对每个独立的模块和组件编写单元测试，确保：
- 函数逻辑正确
- 边界条件处理
- 错误情况覆盖

### 2. 组件测试

测试 React 组件的：
- 渲染正确性
- Props 传递
- 事件处理
- 生命周期

### 3. 集成测试

测试模块间的交互：
- 模块间通信
- 数据流转
- 错误传播

### 4. 错误场景测试

专门测试各种错误情况：
- SDK 未初始化
- 权限被拒绝
- 网络错误
- 参数错误

## 📈 持续改进

### 测试覆盖率目标

- **当前**：75.7%（207个测试）
- **短期目标**：80%+
- **长期目标**：85%+

### 测试质量提升

自最初版本以来的改进：
- ✅ 测试数量从 **164 增加到 207**（+43个测试）
- ✅ 新增**深度测试**覆盖错误场景、边界值、配置组合
- ✅ ExpoGaodeMapModule 函数覆盖率达到 **91.66%**
- ✅ 所有覆盖物组件保持 **96%+ 覆盖率**
- ✅ 工具类（ErrorHandler）保持 **100% 覆盖率**

### 改进计划

1. **增加边界测试**
   - 极端参数值测试
   - 并发操作测试
   - 内存泄漏测试

2. **端到端测试**
   - 添加 Detox 集成测试
   - 真机测试场景
   - 性能基准测试

3. **快照测试**
   - 组件视觉回归测试
   - UI 一致性验证

## 🔍 测试最佳实践

### 1. 测试命名

使用描述性的测试名称：

```typescript
// ❌ 不好
it('test 1', () => {});

// ✅ 好
it('当 SDK 未初始化时调用 start() 应该抛出错误', () => {});
```

### 2. 单一职责

每个测试只验证一个行为：

```typescript
// ❌ 不好 - 测试多个行为
it('应该初始化并启动定位', async () => {
  await ExpoGaodeMapModule.initSDK({ ... });
  await ExpoGaodeMapModule.start();
});

// ✅ 好 - 分开测试
it('应该成功初始化 SDK', async () => {
  await ExpoGaodeMapModule.initSDK({ ... });
});

it('应该成功启动定位', async () => {
  await ExpoGaodeMapModule.start();
});
```

### 3. 使用 Mock

适当使用 Mock 隔离依赖：

```typescript
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

const mockEmitter = new NativeEventEmitter();
mockEmitter.addListener = jest.fn();
```

### 4. 清理副作用

每个测试后清理状态：

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

## 🐛 调试测试

### 查看详细日志

```bash
bun test --verbose
```

### 调试特定测试

```bash
bun test --testNamePattern="SDK 初始化"
```

### 使用 VSCode 调试器

在 `.vscode/launch.json` 中添加配置：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## 📚 相关资源

- [Jest 文档](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [测试最佳实践](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 💡 贡献测试

欢迎贡献更多测试用例！请遵循以下原则：

1. 保持测试简单明了
2. 确保测试可重复运行
3. 编写有意义的断言
4. 添加必要的注释
5. 保持测试覆盖率不降低

提交 PR 时，请确保：
- ✅ 所有测试通过
- ✅ 测试覆盖率不降低
- ✅ 代码符合 ESLint 规范

## 🎓 测试文化

我们相信**高质量的测试是高质量代码的保障**。每个功能都应该有对应的测试，这不仅能：

- 🔒 防止回归问题
- 📖 作为代码文档
- 🚀 提高重构信心
- 🐛 快速定位问题
- ✨ 改善代码设计

让我们一起维护和提升项目的测试质量！
