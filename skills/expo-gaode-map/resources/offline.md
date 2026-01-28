# 核心参考: 离线地图 (Offline Maps)

管理离线地图的下载、更新、删除及加载状态。

## 快速参考

### 核心方法 (ExpoGaodeMapOfflineModule)

```ts
import { ExpoGaodeMapOfflineModule } from 'expo-gaode-map';

// 获取所有可用城市列表
const cities = await ExpoGaodeMapOfflineModule.getAvailableCities();

// 单个下载
await ExpoGaodeMapOfflineModule.startDownload({ cityCode: '010' });

// 批量下载 (省份或多城市)
await ExpoGaodeMapOfflineModule.batchDownload(['010', '021']);

// 检查更新
const hasUpdate = await ExpoGaodeMapOfflineModule.checkUpdate('010');
if (hasUpdate) await ExpoGaodeMapOfflineModule.updateMap('010');

// 监听下载进度
const subscription = ExpoGaodeMapOfflineModule.addListener('onDownloadProgress', (event) => {
  // event: { cityCode, state, progress }
  console.log(`City: ${event.cityCode}, Progress: ${event.progress}%`);
});
```

## 快速模式

### ✅ 正确：使用 cityCode 进行操作
```ts
// ✅ 正确：使用 cityCode 而不是 cityName
await ExpoGaodeMapOfflineModule.startDownload({ cityCode: '010' });
```

### ✅ 正确：批量管理
```ts
// 一键下载全省数据
const province = cities.find(c => c.name === '浙江省');
if (province) {
  // 此时 province.childCities 包含下属城市
  await ExpoGaodeMapOfflineModule.batchDownload(province.childCities.map(c => c.code));
}
```

## 深度挖掘

### 状态码详解
`OfflineMapStatus` 通常包含以下状态：
- `Waiting`: 等待下载。
- `Downloading`: 正在下载。
- `Pause`: 暂停。
- `Completed`: 下载完成。
- `Error`: 下载失败。
- `Unzip`: 正在解压（不应中断）。

### 存储管理
可以使用 `ExpoGaodeMapOfflineModule.getStorageInfo()` 获取离线地图占用的总磁盘空间，以便在 UI 上展示或进行清理建议。
