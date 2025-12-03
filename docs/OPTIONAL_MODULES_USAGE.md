# 可选模块使用指南

## 概述

`expo-gaode-map` 采用模块化设计,核心包只包含地图显示和定位功能。其他高级功能(如搜索、导航等)作为可选模块,用户可按需安装,避免不必要的包体积增加。

## 安装

### 仅安装核心功能

```bash
npm install expo-gaode-map
```

**包含功能:**
- ✅ 地图显示
- ✅ 基础定位
- ✅ 覆盖物(Marker、Polyline、Polygon 等)
- ✅ 相机控制
- ✅ UI 交互

**包大小:** ~5MB

### 安装可选模块

```bash
# 搜索功能
npm install expo-gaode-map-search

# 导航功能
npm install expo-gaode-map-navigation

# 路径规划
npm install expo-gaode-map-route

# 地理编码
npm install expo-gaode-map-geocoder
```

## 使用方式

### 1. 检查模块是否可用

```typescript
import { isModuleAvailable, OptionalModules } from 'expo-gaode-map';

if (isModuleAvailable(OptionalModules.SEARCH)) {
  console.log('搜索功能可用');
} else {
  console.log('请安装 expo-gaode-map-search');
}

import { printModuleInfo } from 'expo-gaode-map';
printModuleInfo();
```

### 2. 动态加载模块

```typescript
import { loadModule, OptionalModules } from 'expo-gaode-map';

async function useSearch() {
  const SearchModule = await loadModule(OptionalModules.SEARCH);
  
  if (SearchModule) {
    const results = await SearchModule.searchPOI('餐厅', {
      city: '北京',
      limit: 20
    });
    console.log('搜索结果:', results);
  } else {
    console.warn('搜索功能未安装');
  }
}

import { loadModuleSync } from 'expo-gaode-map';

const SearchModule = loadModuleSync(OptionalModules.SEARCH);
if (SearchModule) {
  console.log('模块已加载');
}
```

### 3. 必需模块检查

如果某个功能必须要求可选模块,可以使用 `requireModule`:

```typescript
import { requireModule, OptionalModules } from 'expo-gaode-map';

function MySearchComponent() {
  requireModule(OptionalModules.SEARCH, '搜索功能');
  
  const SearchModule = require('expo-gaode-map-search');
  return <div>搜索组件</div>;
}
```

### 4. 完整示例

```typescript
import React, { useEffect, useState } from 'react';
import { View, Button, Text } from 'react-native';
import { 
  MapView, 
  isModuleAvailable, 
  OptionalModules,
  loadModule 
} from 'expo-gaode-map';

export default function App() {
  const [hasSearch, setHasSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    setHasSearch(isModuleAvailable(OptionalModules.SEARCH));
  }, []);

  const handleSearch = async () => {
    if (!hasSearch) {
      alert('请先安装 expo-gaode-map-search');
      return;
    }

    const SearchModule = await loadModule(OptionalModules.SEARCH);
    if (SearchModule) {
      const results = await SearchModule.searchPOI('咖啡', {
        city: '北京',
        limit: 10
      });
      setSearchResults(results);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 39.9042,
          longitude: 116.4074,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      />
      
      {hasSearch ? (
        <Button title="搜索咖啡店" onPress={handleSearch} />
      ) : (
        <Text>搜索功能未安装</Text>
      )}
      
      {searchResults.map((result, index) => (
        <Text key={index}>{result.name}</Text>
      ))}
    </View>
  );
}
```

## 可选模块列表

### expo-gaode-map-search (搜索功能)

**功能:**
- POI 搜索
- 周边搜索
- 关键字搜索
- 分类搜索

**安装:**
```bash
npm install expo-gaode-map-search
```

**使用:**
```typescript
import { searchPOI, searchNearby } from 'expo-gaode-map-search';

const results = await searchPOI('餐厅', {
  city: '北京',
  limit: 20
});

const nearby = await searchNearby({
  latitude: 39.9042,
  longitude: 116.4074,
  radius: 1000,
  type: '餐饮'
});
```

**增加包大小:** ~2MB

### expo-gaode-map-navigation (导航功能)

**功能:**
- 实时导航
- 路线规划
- 语音播报
- 路况显示

**安装:**
```bash
npm install expo-gaode-map-navigation
```

**使用:**
```typescript
import { startNavigation, calculateRoute } from 'expo-gaode-map-navigation';

const route = await calculateRoute({
  start: { latitude: 39.9042, longitude: 116.4074 },
  end: { latitude: 39.9142, longitude: 116.4174 },
  strategy: 'fastest'
});

await startNavigation(route);
```

**增加包大小:** ~8MB

### expo-gaode-map-route (路径规划)

**功能:**
- 驾车路径规划
- 步行路径规划
- 骑行路径规划
- 公交路径规划

**安装:**
```bash
npm install expo-gaode-map-route
```

**使用:**
```typescript
import { planDrivingRoute, planWalkingRoute } from 'expo-gaode-map-route';

const drivingRoute = await planDrivingRoute({
  start: { latitude: 39.9042, longitude: 116.4074 },
  end: { latitude: 39.9142, longitude: 116.4174 }
});

const walkingRoute = await planWalkingRoute({
  start: { latitude: 39.9042, longitude: 116.4074 },
  end: { latitude: 39.9142, longitude: 116.4174 }
});
```

**增加包大小:** ~3MB

### expo-gaode-map-geocoder (地理编码)

**功能:**
- 地址转坐标
- 坐标转地址
- 批量地理编码

**安装:**
```bash
npm install expo-gaode-map-geocoder
```

**使用:**
```typescript
import { geocode, reverseGeocode } from 'expo-gaode-map-geocoder';

const location = await geocode('北京市朝阳区');

const address = await reverseGeocode({
  latitude: 39.9042,
  longitude: 116.4074
});
```

**增加包大小:** ~1MB

## 配置

在 `app.json` 中配置已安装的模块(可选):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "androidApiKey": "your-android-key",
          "iosApiKey": "your-ios-key",
          "modules": ["search", "navigation"]
        }
      ]
    ]
  }
}
```

## 包大小对比

| 配置 | 包大小 | 功能 |
|------|--------|------|
| 仅核心包 | ~5MB | 地图显示 + 定位 |
| + 搜索 | ~7MB | + POI搜索 |
| + 导航 | ~13MB | + 实时导航 |
| + 路径规划 | ~8MB | + 多种路径规划 |
| + 地理编码 | ~6MB | + 地址转换 |
| 全部安装 | ~15MB | 所有功能 |

## 最佳实践

1. **按需安装**: 只安装应用实际需要的功能模块
2. **延迟加载**: 使用 `loadModule` 动态加载,避免启动时加载
3. **错误处理**: 始终检查模块是否可用,提供友好的错误提示
4. **类型安全**: 使用 TypeScript 获得完整的类型支持

## 常见问题

### Q: 如何知道用户是否需要安装可选模块?

A: 使用 `isModuleAvailable` 检查,并在 UI 中提示用户:

```typescript
if (!isModuleAvailable(OptionalModules.SEARCH)) {
  Alert.alert(
    '功能不可用',
    '搜索功能需要安装 expo-gaode-map-search',
    [
      { text: '取消' },
      { text: '查看安装说明', onPress: () => openInstallGuide() }
    ]
  );
}
```

### Q: 可选模块会自动更新吗?

A: 可选模块遵循语义化版本,与核心包独立发布。建议在 `package.json` 中固定版本或使用兼容版本范围。

### Q: 如何为可选模块贡献代码?

A: 每个可选模块都有独立的 GitHub 仓库,欢迎提交 PR 或 Issue。

## 技术支持

- 核心包 Issues: https://github.com/TomWq/expo-gaode-map/issues
- 文档: https://github.com/TomWq/expo-gaode-map#readme