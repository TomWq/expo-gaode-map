# 可选模块实施方案

## 问题:是否需要创建多个独立项目?

**答案:不是必须的!** 有多种实施方案可选。

## 方案对比

### 方案 1: Monorepo 单仓库多包 (推荐)

**优点:**
- ✅ 统一管理所有模块
- ✅ 共享配置和工具
- ✅ 方便开发和测试
- ✅ 独立发布每个包

**结构:**
```
expo-gaode-map/
├── packages/
│   ├── core/                    
│   │   ├── package.json         
│   │   ├── src/
│   │   ├── android/
│   │   └── ios/
│   │
│   ├── search/                  
│   │   ├── package.json         
│   │   ├── src/
│   │   ├── android/
│   │   └── ios/
│   │
│   ├── navigation/              
│   │   ├── package.json         
│   │   └── (其他文件)
│   │
│   └── route/                   
│       └── (其他文件)
│
├── package.json                 
└── lerna.json 或 pnpm-workspace.yaml
```

**实施步骤:**
```bash
npm install -g pnpm

cat > pnpm-workspace.yaml << EOF
packages:
  - 'packages/*'
EOF

mkdir -p packages
mv android ios src packages/core/
mv package.json packages/core/

mkdir -p packages/search

cd packages/core && npm publish
cd packages/search && npm publish
```

### 方案 2: 同一包内可选功能 (最简单)

**优点:**
- ✅ 不需要创建新项目
- ✅ 用户安装一个包即可
- ✅ 使用条件导入控制包大小

**实施方法:**

在当前项目中添加可选功能,通过条件导入和 Tree Shaking 优化:

```typescript
export async function searchPOI(keyword: string, options: any) {
  return {};
}

export { isModuleAvailable } from './utils/ModuleLoader';

import { isModuleAvailable } from 'expo-gaode-map';

if (isModuleAvailable('expo-gaode-map/search')) {
  const { searchPOI } = await import('expo-gaode-map/search');
}
```

**package.json 配置:**
```json
{
  "name": "expo-gaode-map",
  "exports": {
    ".": "./build/index.js",
    "./search": {
      "import": "./build/optional/search.js",
      "require": "./build/optional/search.js"
    },
    "./navigation": {
      "import": "./build/optional/navigation.js",
      "require": "./build/optional/navigation.js"
    }
  }
}
```

**Android build.gradle:**
```gradle
dependencies {
    implementation 'com.amap.api:3dmap:10.0.600'
    
    def enableSearch = project.hasProperty('gaodeMapEnableSearch') ? 
        project.gaodeMapEnableSearch : false
    
    if (enableSearch) {
        implementation 'com.amap.api:search:9.7.0'
    }
}
```

**用户配置 (app.json):**
```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "modules": {
            "search": true,
            "navigation": false
          }
        }
      ]
    ]
  }
}
```

### 方案 3: 子目录分包 (中等复杂度)

在当前项目中创建子目录,每个有独立的 package.json:

```
expo-gaode-map/
├── package.json              
├── search/
│   └── package.json          
├── navigation/
│   └── package.json          
└── (其他目录)
```

然后使用 npm/yarn link 或发布为独立包。

## 推荐方案

### 如果你想要:

1. **最快实施** → 使用**方案 2**(同一包内可选功能)
   - 修改当前项目
   - 添加可选功能代码
   - 通过配置控制是否编译

2. **最佳架构** → 使用**方案 1**(Monorepo)
   - 创建 packages 目录
   - 使用 pnpm workspaces
   - 每个模块独立发布

3. **先不创建可选包** → 使用当前已实现的方案
   - 只提供检测工具
   - 在文档中说明未来会提供可选模块
   - 用户可以自己实现或等待官方模块

## 当前已完成的功能(无需新建项目)

你现在已经完成了核心架构:

1. ✅ **模块检测工具** - `isModuleAvailable()`
2. ✅ **动态加载工具** - `loadModule()`
3. ✅ **Android 配置** - `compileOnly` 支持
4. ✅ **iOS 配置** - podspec 注释
5. ✅ **文档** - 使用指南和架构说明

**这已经足够用户使用了!**

## 分阶段实施建议

### 第一阶段(当前) - 核心功能
- ✅ 发布核心包
- ✅ 提供模块检测 API
- ✅ 文档说明未来的可选模块计划

### 第二阶段(根据需求) - 添加第一个可选模块
- 选择最需要的功能(如搜索)
- 使用方案 2 在当前项目中实现
- 或使用方案 1 创建 monorepo

### 第三阶段(长期) - 完整的模块生态
- 根据用户反馈逐步添加
- 社区可以贡献自己的可选模块

## 示例:在当前项目中添加搜索功能(方案 2)

```bash
mkdir -p src/optional

touch src/optional/search.ts

vi package.json

vi android/build.gradle
```

这样用户可以:
```typescript
import { searchPOI } from 'expo-gaode-map/search';
```

## 总结

**你不需要立即创建 4 个新项目!**

当前实现已经为可选模块预留了架构,你可以:
- 先发布核心包
- 根据用户需求决定是否添加可选功能
- 选择最适合的实施方案(推荐方案 2 最简单)

需要我帮你实现方案 2 的具体代码吗?