# 可选模块架构指南

## 概述

`expo-gaode-map` 采用模块化架构设计，将功能拆分为核心包和可选模块。用户可以根据实际需求选择性安装功能模块，从而减小应用体积。

## 架构设计

### 核心包 (expo-gaode-map)

包含基础功能：
- ✅ 地图显示和交互
- ✅ 定位服务
- ✅ 覆盖物（标记、圆形、折线、多边形等）
- ✅ 相机控制
- ✅ UI 组件
- ✅ 模块检测工具

### 可选模块（按需安装）

| 模块名称 | 包名 | 功能描述 | 状态 |
|---------|------|---------|------|
| 搜索模块 | `expo-gaode-map-search` | POI搜索、关键词搜索、周边搜索 | 🚧 规划中 |
| 导航模块 | `expo-gaode-map-navigation` | 实时导航、语音播报 | 🚧 规划中 |
| 路线规划 | `expo-gaode-map-route` | 驾车、步行、骑行路线规划 | 🚧 规划中 |
| 地理编码 | `expo-gaode-map-geocoder` | 地址转坐标、坐标转地址 | 🚧 规划中 |

## 使用方法

### 1. 安装核心包

```bash
npm install expo-gaode-map
```

### 2. 按需安装可选模块

```bash
# 只安装需要的功能
npm install expo-gaode-map-search      # 如果需要搜索功能
npm install expo-gaode-map-navigation  # 如果需要导航功能
```

### 3. 在代码中使用

#### 方式一：使用 createLazyLoader（推荐）

```typescript
import { createLazyLoader, OptionalModules } from 'expo-gaode-map';

// 创建延迟加载器
const loadSearch = createLazyLoader(() => 
  require('expo-gaode-map-search')
);

function MyComponent() {
  // 使用时加载
  const SearchModule = loadSearch();
  
  if (SearchModule) {
    // 模块已安装，可以使用
    return <SearchModule.SearchComponent />;
  } else {
    // 模块未安装，显示提示或隐藏功能
    return <Text>请安装搜索模块以使用此功能</Text>;
  }
}
```

#### 方式二：直接导入（如果确定已安装）

```typescript
import Search from 'expo-gaode-map-search';

function MyComponent() {
  return <Search.SearchComponent />;
}
```

### 4. 检测模块是否安装

```typescript
import { 
  OptionalModules, 
  getInstalledModules, 
  printModuleInfo 
} from 'expo-gaode-map';

// 打印所有模块信息到控制台
printModuleInfo();

// 获取已安装的模块列表
const installed = getInstalledModules();
console.log('已安装的模块:', installed);

// 检查特定模块
const loadSearch = createLazyLoader(() => 
  require(OptionalModules.SEARCH)
);
const hasSearch = loadSearch() !== null;
```

## Metro Bundler 注意事项

### 限制说明

React Native 的 Metro bundler 有以下限制：

1. **不支持动态 import**
   ```typescript
   // ❌ 不支持
   const module = await import(moduleName);
   ```

2. **require 必须使用字符串字面量**
   ```typescript
   // ❌ 不支持
   const moduleName = 'some-module';
   const module = require(moduleName);
   
   // ✅ 支持
   const module = require('some-module');
   ```

3. **构建时会解析所有 require**
   ```typescript
   // ❌ 即使在 try-catch 中，不存在的模块也会导致构建失败
   try {
     const module = require('non-existent-module');
   } catch (e) {
     // 永远不会执行到这里
   }
   ```

### 解决方案

使用 `createLazyLoader` 包装 require 调用：

```typescript
// ✅ 正确做法
const loadModule = createLazyLoader(() => 
  require('optional-module')
);

// 第一次调用时尝试加载
const module1 = loadModule(); // 返回模块或 null

// 后续调用直接返回缓存结果
const module2 = loadModule(); // 不会再次尝试 require
```

**工作原理：**
1. 包装静态的 require 调用
2. 第一次调用时执行 require 并缓存结果
3. 如果失败则缓存 null
4. 后续调用直接返回缓存，不会重复尝试

## 配置说明

### Android (build.gradle)

```gradle
dependencies {
    // 核心依赖
    implementation 'com.amap.api:3dmap:10.0.600'
    
    // 可选依赖（使用 compileOnly）
    compileOnly 'com.amap.api:search:9.7.0'
    compileOnly 'com.amap.api:navi-3dmap:9.7.0'
}
```

### iOS (Podspec)

```ruby
Pod::Spec.new do |s|
  # 核心依赖
  s.dependency 'AMapFoundation', '~> 1.8.0'
  s.dependency 'AMap3DMap', '~> 10.0.0'
  
  # 可选依赖在各自的模块包中声明
  # 不在核心包中包含
end
```

## 示例项目

查看 `example/OptionalModuleDemo.tsx` 了解完整的使用示例。

运行示例：
```bash
cd example
npm install
npm start
```

在应用中点击 "🔌 可选模块演示" 按钮查看功能演示。

## 优势

### 对用户的好处
- ✅ **更小的包体积** - 只安装需要的功能
- ✅ **按需付费** - 只为使用的功能买单（流量、存储空间）
- ✅ **灵活组合** - 根据应用需求自由组合功能
- ✅ **更快的下载和安装** - 减少等待时间

### 对开发者的好处
- ✅ **降低维护成本** - 功能模块独立维护
- ✅ **清晰的架构** - 模块职责明确
- ✅ **独立发版** - 各模块可独立更新
- ✅ **易于扩展** - 添加新功能不影响核心包

## 最佳实践

### 1. 优雅降级

```typescript
function SearchFeature() {
  const Search = loadSearch();
  
  if (!Search) {
    // 提供替代方案或友好提示
    return (
      <View>
        <Text>搜索功能需要安装额外模块</Text>
        <Button 
          title="了解如何安装" 
          onPress={showInstallGuide}
        />
      </View>
    );
  }
  
  return <Search.Component />;
}
```

### 2. 提前检测

```typescript
// 在应用启动时检测模块
useEffect(() => {
  const modules = getInstalledModules();
  console.log('可用功能:', modules);
  
  // 根据已安装模块调整 UI
  setFeatures({
    search: modules.includes(OptionalModules.SEARCH),
    navigation: modules.includes(OptionalModules.NAVIGATION),
  });
}, []);
```

### 3. 条件渲染

```typescript
function FeatureMenu() {
  return (
    <View>
      <MenuItem title="地图" onPress={openMap} />
      <MenuItem title="定位" onPress={openLocation} />
      
      {/* 只在模块安装时显示 */}
      {loadSearch() && (
        <MenuItem title="搜索" onPress={openSearch} />
      )}
      
      {loadNavigation() && (
        <MenuItem title="导航" onPress={openNavigation} />
      )}
    </View>
  );
}
```

## 未来计划

1. **搜索模块** - 预计 2024 Q2 发布
2. **导航模块** - 预计 2024 Q3 发布
3. **路线规划模块** - 预计 2024 Q4 发布
4. **地理编码模块** - 预计 2024 Q4 发布

## 技术支持

- 📖 [完整文档](./API.md)
- 🐛 [问题反馈](https://github.com/your-repo/issues)
- 💬 [讨论区](https://github.com/your-repo/discussions)

## 参考资源

- [React Native 延迟加载最佳实践](https://reactnative.dev/docs/ram-bundles-inline-requires)
- [Metro Bundler 配置指南](https://facebook.github.io/metro/)
- [高德地图 SDK 文档](https://lbs.amap.com/)