# Monorepo 架构迁移完成 ✅

项目已成功迁移到 Monorepo 架构！现在可以独立开发和发布可选功能模块。

## 🎉 迁移完成内容

### ✅ 已完成

1. **Monorepo 结构** - 使用 pnpm workspaces
2. **核心包** - `packages/core` (expo-gaode-map)
3. **搜索模块** - `packages/search` (expo-gaode-map-search)
4. **示例应用** - 更新为使用 workspace 包
5. **完整文档** - 使用指南和 API 文档

### 📦 包结构

```
expo-gaode-map/
├── packages/
│   ├── core/           → expo-gaode-map@2.0.0
│   └── search/         → expo-gaode-map-search@1.0.0
├── example/            → 示例应用
└── docs/               → 文档
```

## 🚀 快速开始

### 1. 安装 pnpm

```bash
npm install -g pnpm
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 构建所有包

```bash
pnpm build
```

### 4. 运行示例

```bash
cd example
pnpm start
```

## 📝 使用新架构

### 用户使用方式

**安装核心包：**
```bash
npm install expo-gaode-map
```

**按需安装可选模块：**
```bash
npm install expo-gaode-map-search
```

**在代码中使用：**
```typescript
// 核心功能
import { MapView, ExpoGaodeMapModule } from 'expo-gaode-map';

// 可选功能（如果已安装）
import { searchPOI } from 'expo-gaode-map-search';

// 使用延迟加载
import { createLazyLoader } from 'expo-gaode-map';

const loadSearch = createLazyLoader(() =>
  require('expo-gaode-map-search')
);

function MyComponent() {
  const Search = loadSearch();
  if (Search) {
    // 搜索功能可用
  }
}
```

## 🔨 开发工作流

### 开发核心包

```bash
cd packages/core
npm run build -- --watch
```

### 开发搜索模块

```bash
cd packages/search
npm run build -- --watch
```

### 同时开发多个包

```bash
# 终端 1
cd packages/core && npm run build -- --watch

# 终端 2
cd packages/search && npm run build -- --watch

# 终端 3
cd example && pnpm start
```

## 📤 发布流程

### 发布核心包

```bash
cd packages/core
npm version patch  # 或 minor, major
npm run build
npm publish
```

### 发布搜索模块

```bash
cd packages/search
npm version patch
npm run build
npm publish
```

### 批量发布

```bash
# 在根目录
pnpm -r --filter './packages/*' run build
pnpm -r --filter './packages/*' publish
```

## 📋 下一步计划

### 短期目标

1. ✅ **测试构建** - 确保所有包可以正常构建
2. ⏳ **测试示例应用** - 验证 workspace 链接正常工作
3. ⏳ **更新 CI/CD** - 配置自动构建和发布
4. ⏳ **发布第一个版本** - 发布核心包和搜索模块

### 未来模块计划

- **导航模块** (`@expo-gaode-map/navigation`)
  - 实时导航
  - 语音播报
  - 路线规划

- **路线规划模块** (`@expo-gaode-map/route`)
  - 驾车路线
  - 步行路线
  - 骑行路线
  - 公交路线

- **地理编码模块** (`@expo-gaode-map/geocoder`)
  - 地址转坐标
  - 坐标转地址
  - 批量地理编码

## 🎯 优势

### 对用户

- ✅ **更小的包体积** - 只安装需要的功能
- ✅ **灵活的功能组合** - 按需选择
- ✅ **向后兼容** - 核心功能保持稳定

### 对开发者

- ✅ **独立开发** - 模块可以独立迭代
- ✅ **独立发布** - 不需要等待核心包更新
- ✅ **清晰的架构** - 职责明确
- ✅ **易于维护** - 降低复杂度

## 📖 完整文档

- [Monorepo 使用指南](docs/MONOREPO_GUIDE.md)
- [可选模块架构](docs/OPTIONAL_MODULES.md)
- [搜索模块文档](packages/search/README.md)
- [核心包 API](packages/core/README.md)

## 🔍 示例演示

示例应用中已包含：

1. **地图和定位功能** - 核心包演示
2. **可选模块演示** - `OptionalModuleDemo.tsx`
   - 模块检测
   - 延迟加载
   - 使用示例

在应用中点击 **"🔌 可选模块演示"** 查看完整功能。

## ⚙️ 技术细节

### Workspace 配置

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
  - 'example'
```

### 自动链接

`example/package.json`:
```json
{
  "expo": {
    "autolinking": {
      "nativeModulesDir": "../packages"
    }
  }
}
```

### 依赖关系

- `expo-gaode-map-search` → peerDependency → `expo-gaode-map@^2.0.0`
- `example` → workspace → `expo-gaode-map@*` + `expo-gaode-map-search@*`

## 🆘 故障排除

### 构建失败

```bash
# 清理并重新构建
pnpm -r clean
pnpm install
pnpm build
```

### 示例应用无法链接

```bash
cd example
rm -rf node_modules android/build ios/Pods
pnpm install
npx pod-install  # iOS only
```

### TypeScript 错误

```bash
# 重新生成类型定义
pnpm -r clean
pnpm build
```

## 📞 获取帮助

- 📖 [完整文档](docs/MONOREPO_GUIDE.md)
- 🐛 [提交 Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 [讨论区](https://github.com/TomWq/expo-gaode-map/discussions)

---

**迁移日期：** 2024-12-03  
**迁移状态：** ✅ 完成  
**下一步：** 测试和发布