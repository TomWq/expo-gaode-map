# Package.json 配置说明

## 核心包 (expo-gaode-map)

对于核心包,`package.json` **不需要**声明可选模块的依赖。核心包保持纯净,只包含必需的依赖。

### 当前配置已足够

```json
{
  "name": "expo-gaode-map",
  "version": "2.0.0",
  "dependencies": {
    "supercluster": "^8.0.1"
  },
  "peerDependencies": {
    "expo": "*",
    "react": "*",
    "react-native": "*"
  }
}
```

**核心包不需要添加任何可选依赖声明**,因为:

1. ✅ 可选模块由用户自主安装
2. ✅ 使用 `require.resolve()` 动态检测模块是否存在
3. ✅ Android 使用 `compileOnly` (已配置)
4. ✅ iOS 不在 podspec 中声明可选依赖 (已配置)

## 可选模块包的 package.json

当你创建可选模块包时,需要声明对核心包的依赖。

### 示例: expo-gaode-map-search/package.json

```json
{
  "name": "expo-gaode-map-search",
  "version": "1.0.0",
  "description": "高德地图搜索功能模块",
  "main": "build/index.js",
  "types": "build/index.d.ts",
  "peerDependencies": {
    "expo": "*",
    "react": "*",
    "react-native": "*",
    "expo-gaode-map": "^2.0.0"
  },
  "dependencies": {
    
  },
  "keywords": [
    "expo-gaode-map",
    "amap",
    "search",
    "poi"
  ]
}
```

### 示例: expo-gaode-map-navigation/package.json

```json
{
  "name": "expo-gaode-map-navigation",
  "version": "1.0.0",
  "description": "高德地图导航功能模块",
  "main": "build/index.js",
  "types": "build/index.d.ts",
  "peerDependencies": {
    "expo": "*",
    "react": "*",
    "react-native": "*",
    "expo-gaode-map": "^2.0.0"
  },
  "dependencies": {
    
  },
  "keywords": [
    "expo-gaode-map",
    "amap",
    "navigation"
  ]
}
```

## 用户项目的 package.json

### 只使用核心功能

```json
{
  "dependencies": {
    "expo-gaode-map": "^2.0.0"
  }
}
```

### 使用搜索功能

```json
{
  "dependencies": {
    "expo-gaode-map": "^2.0.0",
    "expo-gaode-map-search": "^1.0.0"
  }
}
```

### 使用多个可选模块

```json
{
  "dependencies": {
    "expo-gaode-map": "^2.0.0",
    "expo-gaode-map-search": "^1.0.0",
    "expo-gaode-map-navigation": "^1.0.0",
    "expo-gaode-map-route": "^1.0.0"
  }
}
```

## 关键点总结

### 核心包 (expo-gaode-map)

- ❌ **不需要**在 dependencies 中添加可选模块
- ❌ **不需要**在 optionalDependencies 中添加可选模块
- ❌ **不需要**在 peerDependencies 中添加可选模块
- ✅ **只需要**导出检测工具 (isModuleAvailable 等)
- ✅ **已完成**配置 Android Gradle (compileOnly)
- ✅ **已完成**配置 iOS Podspec (不声明可选依赖)

### 可选模块包

- ✅ **需要**在 peerDependencies 中声明 `expo-gaode-map: ^2.0.0`
- ✅ **需要**在 Android build.gradle 中使用 `implementation` 添加对应的高德 SDK
- ✅ **需要**在 iOS podspec 中添加对应的 pod 依赖

## 工作原理

```
用户项目
├── expo-gaode-map (核心包)
│   ├── 地图显示 ✅
│   ├── 基础定位 ✅
│   └── 模块检测工具 ✅
│
└── expo-gaode-map-search (可选,用户安装)
    ├── 搜索功能 ✅
    └── 依赖核心包 ✅
```

当用户调用:
```typescript
import { isModuleAvailable } from 'expo-gaode-map';

if (isModuleAvailable('expo-gaode-map-search')) {
  // 模块已安装,可以使用
  const SearchModule = require('expo-gaode-map-search');
} else {
  // 模块未安装,提示用户
  console.log('请安装 expo-gaode-map-search');
}
```

`isModuleAvailable` 使用 `require.resolve()` 检测模块是否存在,不需要在 package.json 中声明。

## 总结

**你的核心包 `package.json` 不需要任何修改**,当前配置已经完美支持可选模块架构!

只需要:
1. ✅ 已完成 - 创建模块检测工具 (src/utils/ModuleLoader.ts)
2. ✅ 已完成 - 导出检测工具 (src/index.ts)
3. ✅ 已完成 - 配置 Android Gradle compileOnly
4. ✅ 已完成 - 配置 iOS podspec 注释

当需要创建可选模块包时,再创建新的 npm 包即可!