# 离线地图

expo-gaode-map 支持离线地图功能，允许用户下载城市地图数据以便在无网络环境下使用。

::: warning 重要提示
离线地图功能需要使用 **3D 地图 SDK**，2D SDK 不支持离线地图。
:::

::: tip Android 权限要求
离线地图功能需要以下权限（Config Plugin 会自动添加）：
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```
如果使用 Config Plugin，这些权限会自动配置。如果手动配置，请确保在 `AndroidManifest.xml` 中添加这些权限。
:::

## 功能特性

- ✅ **城市地图下载** - 支持下载全国各城市的离线地图数据
- ✅ **下载管理** - 支持暂停、恢复、取消下载
- ✅ **实时进度** - 实时监听下载进度和状态
- ✅ **存储管理** - 查看存储使用情况，支持删除和清空
- ✅ **自动更新** - 检查并更新离线地图数据
- ✅ **网络控制** - 可限制仅 WiFi 下载

## 快速开始

### 1. 获取可用城市列表

```tsx
import { ExpoGaodeMapOfflineModule } from 'expo-gaode-map';

const cities = await ExpoGaodeMapOfflineModule.getAvailableCities();

cities.forEach(city => {
  console.log(`${city.cityName}: ${city.size / 1024 / 1024} MB`);
});
```

### 2. 开始下载

```tsx
// 开始下载北京地图（仅 WiFi）
await ExpoGaodeMapOfflineModule.startDownload({
  cityCode: '110000',
  allowCellular: false, // 仅 WiFi 下载
});
```

### 3. 监听下载进度

```tsx
import { useEffect } from 'react';

useEffect(() => {
  // 监听下载进度
  const progressSub = ExpoGaodeMapOfflineModule.addDownloadProgressListener((event) => {
    console.log(`${event.cityName}: ${event.progress}%`);
  });

  // 监听下载完成
  const completeSub = ExpoGaodeMapOfflineModule.addDownloadCompleteListener((event) => {
    console.log(`${event.cityName} 下载完成！`);
  });

  // 监听下载错误
  const errorSub = ExpoGaodeMapOfflineModule.addDownloadErrorListener((event) => {
    console.error(`${event.cityName} 下载失败: ${event.error}`);
  });

  // 清理监听器
  return () => {
    progressSub.remove();
    completeSub.remove();
    errorSub.remove();
  };
}, []);
```

## 完整示例

这是一个包含下载管理、进度显示、状态更新的完整示例：

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { ExpoGaodeMapOfflineModule, type OfflineMapInfo } from 'expo-gaode-map';

export default function OfflineMapScreen() {
  const [cities, setCities] = useState<OfflineMapInfo[]>([]);
  const [downloadedCities, setDownloadedCities] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [downloading, setDownloading] = useState<string | null>(null);

  // 加载城市列表
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    const [available, downloaded] = await Promise.all([
      ExpoGaodeMapOfflineModule.getAvailableCities(),
      ExpoGaodeMapOfflineModule.getDownloadedMaps(),
    ]);
    
    setCities(available.slice(0, 20)); // 显示前20个城市
    setDownloadedCities(downloaded.map(c => c.cityCode));
  };

  // 监听下载事件
  useEffect(() => {
    const progressSub = ExpoGaodeMapOfflineModule.addDownloadProgressListener((event) => {
      setProgress(prev => ({
        ...prev,
        [event.cityCode]: event.progress,
      }));
    });

    const completeSub = ExpoGaodeMapOfflineModule.addDownloadCompleteListener((event) => {
      Alert.alert('下载完成', `${event.cityName} 离线地图已下载完成`);
      setDownloading(null);
      loadCities();
    });

    const errorSub = ExpoGaodeMapOfflineModule.addDownloadErrorListener((event) => {
      Alert.alert('下载失败', `${event.cityName}: ${event.error}`);
      setDownloading(null);
    });

    return () => {
      progressSub.remove();
      completeSub.remove();
      errorSub.remove();
    };
  }, []);

  // 开始下载
  const handleDownload = async (city: OfflineMapInfo) => {
    setDownloading(city.cityCode);
    
    try {
      await ExpoGaodeMapOfflineModule.startDownload({
        cityCode: city.cityCode,
        allowCellular: false, // 仅 WiFi
      });
    } catch (error) {
      console.error('下载失败:', error);
      Alert.alert('错误', '开始下载失败');
      setDownloading(null);
    }
  };

  // 暂停下载
  const handlePause = async (cityCode: string) => {
    try {
      await ExpoGaodeMapOfflineModule.pauseDownload(cityCode);
      setDownloading(null);
    } catch (error) {
      console.error('暂停失败:', error);
    }
  };

  // 删除地图
  const handleDelete = async (city: OfflineMapInfo) => {
    Alert.alert(
      '确认删除',
      `确定要删除 ${city.cityName} 的离线地图吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await ExpoGaodeMapOfflineModule.deleteMap(city.cityCode);
            loadCities();
          },
        },
      ]
    );
  };

  // 渲染城市项
  const renderCity = ({ item }: { item: OfflineMapInfo }) => {
    const isDownloaded = downloadedCities.includes(item.cityCode);
    const isDownloading = downloading === item.cityCode;
    const currentProgress = progress[item.cityCode] || 0;

    return (
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.cityName}</Text>
        <Text style={{ color: '#666', marginTop: 4 }}>
          {(item.size / 1024 / 1024).toFixed(1)} MB
        </Text>

        {isDownloading && (
          <View style={{ marginTop: 8 }}>
            <View style={{ height: 8, backgroundColor: '#eee', borderRadius: 4 }}>
              <View
                style={{
                  height: '100%',
                  width: `${currentProgress}%`,
                  backgroundColor: '#4CAF50',
                  borderRadius: 4,
                }}
              />
            </View>
            <Text style={{ marginTop: 4, color: '#666' }}>{currentProgress}%</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          {!isDownloaded && !isDownloading && (
            <TouchableOpacity
              onPress={() => handleDownload(item)}
              style={{
                backgroundColor: '#2196F3',
                padding: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: 'white' }}>下载</Text>
            </TouchableOpacity>
          )}

          {isDownloading && (
            <TouchableOpacity
              onPress={() => handlePause(item.cityCode)}
              style={{
                backgroundColor: '#FF9800',
                padding: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: 'white' }}>暂停</Text>
            </TouchableOpacity>
          )}

          {isDownloaded && (
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={{
                backgroundColor: '#F44336',
                padding: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: 'white' }}>删除</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16, backgroundColor: '#f5f5f5' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>离线地图管理</Text>
        <Text style={{ marginTop: 4, color: '#666' }}>
          已下载: {downloadedCities.length} 个城市
        </Text>
      </View>

      <FlatList
        data={cities}
        keyExtractor={item => item.cityCode}
        renderItem={renderCity}
      />
    </View>
  );
}
```

## API 参考

### ExpoGaodeMapOfflineModule

#### 方法

##### getAvailableCities()

获取所有可下载的城市列表。

```tsx
const cities = await ExpoGaodeMapOfflineModule.getAvailableCities();
```

**返回值**: `Promise<OfflineMapInfo[]>`

##### startDownload(options)

开始下载离线地图。

```tsx
await ExpoGaodeMapOfflineModule.startDownload({
  cityCode: '110000',
  allowCellular: false,
});
```

**参数**:
- `cityCode`: 城市代码
- `allowCellular`: 是否允许移动网络下载（默认 `false`）

##### pauseDownload(cityCode)

暂停下载。

```tsx
await ExpoGaodeMapOfflineModule.pauseDownload('110000');
```

##### resumeDownload(cityCode)

恢复下载。

```tsx
await ExpoGaodeMapOfflineModule.resumeDownload('110000');
```

##### deleteMap(cityCode)

删除离线地图。

```tsx
await ExpoGaodeMapOfflineModule.deleteMap('110000');
```

##### clearAll()

清除所有离线地图。

```tsx
await ExpoGaodeMapOfflineModule.clearAll();
```

##### getDownloadedMaps()

获取已下载的地图列表。

```tsx
const downloaded = await ExpoGaodeMapOfflineModule.getDownloadedMaps();
```

**返回值**: `Promise<OfflineMapInfo[]>`

##### getStorageInfo()

获取存储信息。

```tsx
const storage = await ExpoGaodeMapOfflineModule.getStorageInfo();
console.log('已用空间:', storage.usedSpace / 1024 / 1024, 'MB');
console.log('可用空间:', storage.availableSpace / 1024 / 1024, 'MB');
```

##### checkUpdate(cityCode)

检查地图是否有更新。

```tsx
const hasUpdate = await ExpoGaodeMapOfflineModule.checkUpdate('110000');
if (hasUpdate) {
  await ExpoGaodeMapOfflineModule.updateMap('110000');
}
```

##### updateMap(cityCode)

更新离线地图。

```tsx
await ExpoGaodeMapOfflineModule.updateMap('110000');
```

#### 事件监听

##### addDownloadProgressListener(callback)

监听下载进度。

```tsx
const subscription = ExpoGaodeMapOfflineModule.addDownloadProgressListener((event) => {
  console.log(`${event.cityName}: ${event.progress}%`);
});

// 清理监听器
subscription.remove();
```

**事件对象**:
```tsx
{
  cityCode: string;
  cityName: string;
  progress: number; // 0-100
}
```

##### addDownloadCompleteListener(callback)

监听下载完成。

```tsx
const subscription = ExpoGaodeMapOfflineModule.addDownloadCompleteListener((event) => {
  console.log(`${event.cityName} 下载完成`);
});
```

##### addDownloadErrorListener(callback)

监听下载错误。

```tsx
const subscription = ExpoGaodeMapOfflineModule.addDownloadErrorListener((event) => {
  console.error(`${event.cityName} 错误: ${event.error}`);
});
```

##### addDownloadPausedListener(callback)

监听下载暂停。

```tsx
const subscription = ExpoGaodeMapOfflineModule.addDownloadPausedListener((event) => {
  console.log(`${event.cityName} 已暂停`);
});
```

##### addDownloadCancelledListener(callback)

监听下载取消。

```tsx
const subscription = ExpoGaodeMapOfflineModule.addDownloadCancelledListener((event) => {
  console.log(`${event.cityName} 已取消`);
});
```

### 类型定义

```tsx
interface OfflineMapInfo {
  cityCode: string;      // 城市代码
  cityName: string;      // 城市名称
  size: number;          // 地图大小（字节）
  status: OfflineMapStatus;
}

type OfflineMapStatus = 
  | 'NOT_DOWNLOADED'     // 未下载
  | 'DOWNLOADING'        // 下载中
  | 'PAUSED'            // 已暂停
  | 'DOWNLOADED'        // 已下载
  | 'ERROR';            // 错误

interface StorageInfo {
  usedSpace: number;      // 已用空间（字节）
  availableSpace: number; // 可用空间（字节）
  totalSpace: number;     // 总空间（字节）
}
```

## 最佳实践

### 1. 检查存储空间

下载前检查可用空间：

```tsx
const handleDownload = async (city: OfflineMapInfo) => {
  const storage = await ExpoGaodeMapOfflineModule.getStorageInfo();
  
  if (storage.availableSpace < city.size) {
    Alert.alert('存储空间不足', '请释放存储空间后重试');
    return;
  }
  
  await ExpoGaodeMapOfflineModule.startDownload({
    cityCode: city.cityCode,
    allowCellular: false,
  });
};
```

### 2. 错误处理

所有异步操作都应包含错误处理：

```tsx
try {
  await ExpoGaodeMapOfflineModule.startDownload({ cityCode });
} catch (error) {
  console.error('下载失败:', error);
  Alert.alert('错误', '开始下载失败，请重试');
}
```

### 3. 监听器清理

使用 useEffect 的清理函数：

```tsx
useEffect(() => {
  const progressSub = ExpoGaodeMapOfflineModule.addDownloadProgressListener(handler);
  
  return () => {
    progressSub.remove(); // 清理监听器
  };
}, []);
```

### 4. 网络控制

建议默认仅 WiFi 下载，保护用户流量：

```tsx
await ExpoGaodeMapOfflineModule.startDownload({
  cityCode: city.cityCode,
  allowCellular: false, // ✅ 推荐
});
```

### 5. 自动更新检查

定期检查地图更新：

```tsx
const checkUpdates = async () => {
  const downloaded = await ExpoGaodeMapOfflineModule.getDownloadedMaps();
  
  for (const city of downloaded) {
    const hasUpdate = await ExpoGaodeMapOfflineModule.checkUpdate(city.cityCode);
    if (hasUpdate) {
      // 提示用户更新
    }
  }
};
```

## 注意事项

1. **SDK 要求**: 离线地图功能仅支持 3D 地图 SDK
2. **Android 权限**: 需要网络权限和存储权限（Config Plugin 自动添加）：
   - `INTERNET` - 下载地图数据
   - `ACCESS_NETWORK_STATE` - 检查网络状态
   - `WRITE_EXTERNAL_STORAGE` - 存储离线地图
3. **存储空间**: 每个城市地图通常需要 50-150 MB
4. **下载时间**: 取决于网络速度和地图大小
5. **自动加载**: 下载完成后 SDK 会自动使用离线数据
6. **数据更新**: 建议定期检查并更新离线地图

## 常见问题

### 离线地图在哪里存储？

离线地图数据存储在应用的私有目录中，卸载应用时会被删除。

### 如何知道地图正在使用离线数据？

SDK 会自动检测并使用离线数据，无需额外配置。在无网络环境下，地图会自动切换到离线模式。

### 可以同时下载多个城市吗？

技术上可以，但建议一次只下载一个城市，以便更好地管理下载进度和错误处理。

### 下载中断后如何恢复？

使用 `resumeDownload()` 方法恢复下载，SDK 会从中断的地方继续下载。

```tsx
await ExpoGaodeMapOfflineModule.resumeDownload(cityCode);
```

### 如何删除所有离线地图？

使用 `clearAll()` 方法：

```tsx
await ExpoGaodeMapOfflineModule.clearAll();
```

## 相关链接

- [完整示例代码](https://github.com/TomWq/expo-gaode-map/tree/main/example/OfflineMapExample.tsx)
- [API 文档](/api/)
- [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)