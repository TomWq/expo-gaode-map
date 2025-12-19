# 离线地图 API

离线地图 API 提供了完整的离线地图管理功能，包括下载、更新、删除和存储管理。

## OfflineMapManager

离线地图管理器，提供所有离线地图相关功能。

### 方法

#### getAvailableCities()

获取所有可下载的城市列表。

```tsx
const cities = await OfflineMapManager.getAvailableCities();
```

**返回值**
- `Promise<OfflineMapInfo[]>` - 城市信息数组

**示例**
```tsx
const cities = await OfflineMapManager.getAvailableCities();
console.log(`共有 ${cities.length} 个城市可下载`);

cities.forEach(city => {
  console.log(`${city.cityName}: ${(city.size / 1024 / 1024).toFixed(1)} MB`);
});
```

---

#### startDownload(options)

开始下载离线地图。

```tsx
await OfflineMapManager.startDownload(options);
```

**参数**
- `options.cityCode: string` - 城市代码
- `options.allowCellular?: boolean` - 是否允许移动网络下载（默认 `false`）

**示例**
```tsx
// 仅 WiFi 下载
await OfflineMapManager.startDownload({
  cityCode: '110000', // 北京
  allowCellular: false,
});

// 允许移动网络
await OfflineMapManager.startDownload({
  cityCode: '310000', // 上海
  allowCellular: true,
});
```

---

#### pauseDownload(cityCode)

暂停正在下载的地图。

```tsx
await OfflineMapManager.pauseDownload(cityCode);
```

**参数**
- `cityCode: string` - 城市代码

**示例**
```tsx
await OfflineMapManager.pauseDownload('110000');
```

---

#### resumeDownload(cityCode)

恢复已暂停的下载。

```tsx
await OfflineMapManager.resumeDownload(cityCode);
```

**参数**
- `cityCode: string` - 城市代码

**示例**
```tsx
await OfflineMapManager.resumeDownload('110000');
```

---

#### deleteMap(cityCode)

删除指定城市的离线地图。

```tsx
await OfflineMapManager.deleteMap(cityCode);
```

**参数**
- `cityCode: string` - 城市代码

**示例**
```tsx
await OfflineMapManager.deleteMap('110000');
console.log('北京离线地图已删除');
```

---

#### clearAll()

清除所有已下载的离线地图。

```tsx
await OfflineMapManager.clearAll();
```

**示例**
```tsx
await OfflineMapManager.clearAll();
console.log('所有离线地图已清除');
```

---

#### getDownloadedMaps()

获取已下载的地图列表。

```tsx
const maps = await OfflineMapManager.getDownloadedMaps();
```

**返回值**
- `Promise<OfflineMapInfo[]>` - 已下载的城市信息数组

**示例**
```tsx
const downloaded = await OfflineMapManager.getDownloadedMaps();
console.log(`已下载 ${downloaded.length} 个城市`);

downloaded.forEach(city => {
  console.log(`✓ ${city.cityName}`);
});
```

---

#### getStorageInfo()

获取离线地图存储信息。

```tsx
const storage = await OfflineMapManager.getStorageInfo();
```

**返回值**
- `Promise<StorageInfo>` - 存储信息对象

**示例**
```tsx
const storage = await OfflineMapManager.getStorageInfo();

console.log('已用空间:', (storage.usedSpace / 1024 / 1024).toFixed(2), 'MB');
console.log('可用空间:', (storage.availableSpace / 1024 / 1024).toFixed(2), 'MB');
console.log('总空间:', (storage.totalSpace / 1024 / 1024).toFixed(2), 'MB');
```

---

#### checkUpdate(cityCode)

检查指定城市的地图是否有更新。

```tsx
const hasUpdate = await OfflineMapManager.checkUpdate(cityCode);
```

**参数**
- `cityCode: string` - 城市代码

**返回值**
- `Promise<boolean>` - 是否有更新

**示例**
```tsx
const hasUpdate = await OfflineMapManager.checkUpdate('110000');

if (hasUpdate) {
  console.log('北京地图有新版本可用');
  await OfflineMapManager.updateMap('110000');
} else {
  console.log('北京地图已是最新版本');
}
```

---

#### updateMap(cityCode)

更新指定城市的离线地图。

```tsx
await OfflineMapManager.updateMap(cityCode);
```

**参数**
- `cityCode: string` - 城市代码

**示例**
```tsx
await OfflineMapManager.updateMap('110000');
console.log('开始更新北京地图');
```

---

### 事件监听

#### addDownloadProgressListener(callback)

监听下载进度事件。

```tsx
const subscription = OfflineMapManager.addDownloadProgressListener(callback);
```

**参数**
- `callback: (event: OfflineMapProgressEvent) => void` - 回调函数

**返回值**
- `Subscription` - 订阅对象，调用 `remove()` 取消监听

**事件对象**
```tsx
interface OfflineMapProgressEvent {
  cityCode: string;
  cityName: string;
  progress: number; // 0-100
}
```

**示例**
```tsx
const subscription = OfflineMapManager.addDownloadProgressListener((event) => {
  console.log(`${event.cityName}: ${event.progress}%`);
  
  // 更新 UI 进度条
  setProgress(event.progress);
});

// 清理监听器
return () => subscription.remove();
```

---

#### addDownloadCompleteListener(callback)

监听下载完成事件。

```tsx
const subscription = OfflineMapManager.addDownloadCompleteListener(callback);
```

**参数**
- `callback: (event: OfflineMapCompleteEvent) => void` - 回调函数

**事件对象**
```tsx
interface OfflineMapCompleteEvent {
  cityCode: string;
  cityName: string;
}
```

**示例**
```tsx
const subscription = OfflineMapManager.addDownloadCompleteListener((event) => {
  Alert.alert('下载完成', `${event.cityName} 离线地图已下载完成`);
  loadData(); // 刷新列表
});

return () => subscription.remove();
```

---

#### addDownloadErrorListener(callback)

监听下载错误事件。

```tsx
const subscription = OfflineMapManager.addDownloadErrorListener(callback);
```

**参数**
- `callback: (event: OfflineMapErrorEvent) => void` - 回调函数

**事件对象**
```tsx
interface OfflineMapErrorEvent {
  cityCode: string;
  cityName: string;
  error: string;
}
```

**示例**
```tsx
const subscription = OfflineMapManager.addDownloadErrorListener((event) => {
  console.error(`${event.cityName} 下载失败: ${event.error}`);
  Alert.alert('下载失败', event.error);
});

return () => subscription.remove();
```

---

#### addDownloadPausedListener(callback)

监听下载暂停事件。

```tsx
const subscription = OfflineMapManager.addDownloadPausedListener(callback);
```

**参数**
- `callback: (event: OfflineMapPausedEvent) => void` - 回调函数

**事件对象**
```tsx
interface OfflineMapPausedEvent {
  cityCode: string;
  cityName: string;
}
```

**示例**
```tsx
const subscription = OfflineMapManager.addDownloadPausedListener((event) => {
  console.log(`${event.cityName} 下载已暂停`);
});

return () => subscription.remove();
```

---

#### addDownloadCancelledListener(callback)

监听下载取消事件。

```tsx
const subscription = OfflineMapManager.addDownloadCancelledListener(callback);
```

**参数**
- `callback: (event: OfflineMapCancelledEvent) => void` - 回调函数

**事件对象**
```tsx
interface OfflineMapCancelledEvent {
  cityCode: string;
  cityName: string;
}
```

**示例**
```tsx
const subscription = OfflineMapManager.addDownloadCancelledListener((event) => {
  console.log(`${event.cityName} 下载已取消`);
});

return () => subscription.remove();
```

---

## 类型定义

### OfflineMapInfo

城市离线地图信息。

```tsx
interface OfflineMapInfo {
  cityCode: string;      // 城市代码
  cityName: string;      // 城市名称
  size: number;          // 地图大小（字节）
  status: OfflineMapStatus;
}
```

**示例**
```tsx
const city: OfflineMapInfo = {
  cityCode: '110000',
  cityName: '北京',
  size: 103809024, // 约 99 MB
  status: 'DOWNLOADED',
};
```

---

### OfflineMapStatus

离线地图状态。

```tsx
type OfflineMapStatus = 
  | 'NOT_DOWNLOADED'     // 未下载
  | 'DOWNLOADING'        // 下载中
  | 'PAUSED'            // 已暂停
  | 'DOWNLOADED'        // 已下载
  | 'ERROR';            // 错误
```

**示例**
```tsx
const renderStatus = (status: OfflineMapStatus) => {
  switch (status) {
    case 'NOT_DOWNLOADED':
      return '未下载';
    case 'DOWNLOADING':
      return '下载中';
    case 'PAUSED':
      return '已暂停';
    case 'DOWNLOADED':
      return '已下载';
    case 'ERROR':
      return '错误';
  }
};
```

---

### StorageInfo

存储空间信息。

```tsx
interface StorageInfo {
  usedSpace: number;      // 已用空间（字节）
  availableSpace: number; // 可用空间（字节）
  totalSpace: number;     // 总空间（字节）
}
```

**示例**
```tsx
const storage: StorageInfo = {
  usedSpace: 209715200,     // 200 MB
  availableSpace: 5368709120, // 5 GB
  totalSpace: 10737418240,   // 10 GB
};

const usagePercent = (storage.usedSpace / storage.totalSpace) * 100;
console.log(`已使用 ${usagePercent.toFixed(1)}%`);
```

---

## 使用示例

### 基础下载流程

```tsx
import { useState, useEffect } from 'react';
import { OfflineMapManager } from 'expo-gaode-map';

function DownloadExample() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sub = OfflineMapManager.addDownloadProgressListener((event) => {
      setProgress(event.progress);
    });

    return () => sub.remove();
  }, []);

  const handleDownload = async () => {
    await OfflineMapManager.startDownload({
      cityCode: '110000',
      allowCellular: false,
    });
  };

  return (
    <View>
      <Button title="下载北京地图" onPress={handleDownload} />
      <ProgressBar progress={progress} />
    </View>
  );
}
```

### 存储空间检查

```tsx
const handleDownload = async (city: OfflineMapInfo) => {
  // 检查存储空间
  const storage = await OfflineMapManager.getStorageInfo();
  
  if (storage.availableSpace < city.size) {
    Alert.alert(
      '存储空间不足',
      `需要 ${(city.size / 1024 / 1024).toFixed(1)} MB，` +
      `可用 ${(storage.availableSpace / 1024 / 1024).toFixed(1)} MB`
    );
    return;
  }
  
  await OfflineMapManager.startDownload({
    cityCode: city.cityCode,
    allowCellular: false,
  });
};
```

### 批量更新检查

```tsx
const checkAllUpdates = async () => {
  const downloaded = await OfflineMapManager.getDownloadedMaps();
  const updates: string[] = [];
  
  for (const city of downloaded) {
    const hasUpdate = await OfflineMapManager.checkUpdate(city.cityCode);
    if (hasUpdate) {
      updates.push(city.cityName);
    }
  }
  
  if (updates.length > 0) {
    Alert.alert(
      '发现更新',
      `以下城市有新版本：\n${updates.join(', ')}`
    );
  } else {
    Alert.alert('提示', '所有地图都是最新版本');
  }
};
```

## 相关文档

- [离线地图指南](/guide/offline-map)
- [完整示例](https://github.com/TomWq/expo-gaode-map/tree/main/example/OfflineMapExample.tsx)