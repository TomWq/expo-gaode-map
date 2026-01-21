---
title: Offline Maps
impact: MEDIUM
tags: offline-map, download, city-manager
---

# Skill: Offline Maps

管理离线地图的下载、更新、删除及加载状态。

## 快速参考

### 核心方法 (OfflineMapManager)

```ts
import { OfflineMapManager } from 'expo-gaode-map';

// 获取所有可用城市列表
const cities = await OfflineMapManager.getAvailableCities();

// 获取当前正在下载的城市列表 (cityCode 数组)
const downloadingCities = await OfflineMapManager.getDownloadingCities();

// 开始/继续下载
await OfflineMapManager.startDownload({
  cityCode: '010', // 北京
  isProvince: false
});

// 暂停下载
await OfflineMapManager.pauseDownload('010');

// 删除已下载地图
await OfflineMapManager.deleteMap('010');

// 监听下载进度
const subscription = OfflineMapManager.addDownloadProgressListener((event) => {
  console.log(`City: ${event.cityCode}, Progress: ${event.progress}%`);
});
```

## 快速模式

### ✅ 正确：使用 cityCode 进行操作
```ts
// ✅ 正确：使用 cityCode 而不是 cityName
await OfflineMapManager.startDownload({ cityCode: '010' });
```

### ✅ 正确：在下载前检查状态
```ts
const downloadedMaps = await OfflineMapManager.getDownloadedMaps();
const beijing = downloadedMaps.find(item => item.cityCode === '010');
if (!beijing) {
  await OfflineMapManager.startDownload({ cityCode: '010' });
}
```

### ❌ 错误：使用城市名称
```ts
// ❌ 错误：API 期待的是 cityCode 字符串
await OfflineMapManager.deleteMap("北京"); 
```

## 何时使用

- 允许用户在无网络环境下查看地图。
- 预下载特定区域的数据以提高加载速度。
- 实现地图数据包的管理界面。

## 深度挖掘

### 状态码详解
`OfflineMapStatus` 通常包含以下状态：
- `Waiting`: 等待下载。
- `Downloading`: 正在下载。
- `Pause`: 暂停。
- `Completed`: 下载完成。
- `Error`: 下载失败。
- `Unzip`: 正在解压。

### 常见陷阱
1. **cityCode**: 必须使用高德定义的 cityCode。可以通过 `getAvailableCities` 或 `getAvailableProvinces` 获取。
2. **并发限制**: 建议不要同时开启过多下载任务，高德 SDK 内部会有一定的队列管理。
3. **空间占用**: 提醒用户离线地图会占用大量存储空间。
