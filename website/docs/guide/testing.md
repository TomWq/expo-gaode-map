# 测试与质量保证

expo-gaode-map 的测试覆盖整个 monorepo：`core`、`navigation`、`web-api`，以及 `example-navigation` 的关键联调路径。

## ✅ 测试范围

### Core 包

- SDK 初始化、隐私、定位和权限
- `MapView` 与覆盖物组件
- 工具函数与错误处理

### Navigation 包

- 路径几何与锚点提取
- Web API 回退映射
- 近似跟线导航
- 独立路径链路

### 示例工程

- `example-navigation` 的 smoke tests
- 关键导航页面的启动和渲染验证

## 🧪 运行测试

从 monorepo 根目录运行：

```bash
yarn test
```

运行单个包：

```bash
yarn test:core
yarn test:navigation
yarn test:web-api
```

运行示例工程测试：

```bash
yarn test:example-navigation
```

运行完整验证：

```bash
yarn verify
```

如果你只想在某个包里调试：

```bash
cd packages/core && bun test
cd packages/navigation && yarn test
cd example-navigation && npm test -- --runInBand
```

生成 coverage：

```bash
cd packages/core && bun test --coverage
cd packages/navigation && yarn test --coverage
```

> coverage 报告是按包生成的，所以具体数字会随着你运行的包而变化。

## 📝 测试建议

- 单元测试优先覆盖纯逻辑函数，例如 route 解析、normalizer、评分函数。
- 组件测试优先覆盖 props 传递、事件回调和条件渲染。
- 集成测试优先覆盖“一个入口串起多个动作”的链路，例如独立算路到启动导航。
- 做 web 适配时，不要只测原生路径，也要补 fallback 或 adapter 分支。

## 🔍 调试

```bash
yarn test:navigation -- --testNamePattern="followWebPlannedRoute"
```

```bash
cd packages/navigation && yarn test --watch
```

## 相关文档

- [架构](/guide/architecture)
- [导航指南](/guide/navigation)
- [Web API](/guide/web-api)
