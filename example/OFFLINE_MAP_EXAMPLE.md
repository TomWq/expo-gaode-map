# 离线地图示例使用说明

## 📝 文件说明

`OfflineMapExample.tsx` - 完整的离线地图管理示例应用

## 🎯 示例功能

### 1. 城市列表展示
- 显示可下载的城市列表（前20个城市）
- 显示城市大小、状态信息
- 实时更新下载状态

### 2. 下载管理
- ✅ 开始下载离线地图
- ✅ 暂停/恢复下载
- ✅ 实时进度显示（进度条 + 百分比）
- ✅ 仅 WiFi 下载（`allowCellular: false`）

### 3. 地图管理
- ✅ 删除单个离线地图
- ✅ 清除所有离线地图
- ✅ 检查地图更新
- ✅ 更新离线地图

### 4. 存储管理
- ✅ 显示已下载城市数量
- ✅ 显示占用存储空间
- ✅ 下载前检查可用空间

### 5. 事件监听
- ✅ 下载进度事件（实时更新进度条）
- ✅ 下载完成事件（弹窗提示）
- ✅ 下载错误事件（错误提示）

## 🚀 如何使用

### 1. 安装依赖

```bash
cd example
pnpm install expo-gaode-map-offline
```

### 2. 在 App.tsx 中引入

```tsx
import OfflineMapExample from './OfflineMapExample';

export default function App() {
  return <OfflineMapExample />;
}
```

### 3. 运行应用

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

## 📱 界面说明

### 头部区域
- 标题：离线地图管理
- 统计信息：
  - 已下载城市数量
  - 占用存储空间

### 城市列表
每个城市项显示：
- 城市名称
- 地图大小（MB）
- 下载状态（未下载、下载中、已下载等）
- 操作按钮：
  - **未下载**：显示"下载"按钮
  - **下载中**：显示进度条和"暂停"按钮
  - **已暂停**：显示"继续"按钮
  - **已下载**：显示"检查更新"和"删除"按钮

### 底部操作
- "清除所有"按钮：删除所有已下载的离线地图

## 🎨 核心代码说明

### 1. 加载城市列表

```typescript
const loadData = async () => {
  const [availableCities, downloaded, storage] = await Promise.all([
    OfflineMapManager.getAvailableCities(),
    OfflineMapManager.getDownloadedMaps(),
    OfflineMapManager.getStorageInfo(),
  ]);
  
  setCities(availableCities.slice(0, 20));
  setDownloadedCities(downloaded);
  setStorageInfo(storage);
};
```

### 2. 监听下载事件

```typescript
useEffect(() => {
  // 监听进度
  const progressSub = OfflineMapManager.addDownloadProgressListener((event) => {
    setProgress((prev) => ({
      ...prev,
      [event.cityCode]: event.progress,
    }));
  });

  // 监听完成
  const completeSub = OfflineMapManager.addDownloadCompleteListener((event) => {
    Alert.alert('下载完成', `${event.cityName} 离线地图已下载完成`);
    loadData(); // 刷新列表
  });

  // 监听错误
  const errorSub = OfflineMapManager.addDownloadErrorListener((event) => {
    Alert.alert('下载失败', `${event.cityName}: ${event.error}`);
  });

  return () => {
    progressSub.remove();
    completeSub.remove();
    errorSub.remove();
  };
}, []);
```

### 3. 开始下载

```typescript
const handleDownload = async (city: OfflineMapInfo) => {
  // 检查存储空间
  if (storageInfo.availableSpace < city.size) {
    Alert.alert('存储空间不足', '请释放存储空间后重试');
    return;
  }

  setDownloading(city.cityCode);
  
  await OfflineMapManager.startDownload({
    cityCode: city.cityCode,
    allowCellular: false, // 仅 WiFi
  });
};
```

### 4. 暂停/恢复下载

```typescript
// 暂停
const handlePause = async (cityCode: string) => {
  await OfflineMapManager.pauseDownload(cityCode);
  setDownloading(null);
};

// 恢复
const handleResume = async (cityCode: string) => {
  setDownloading(cityCode);
  await OfflineMapManager.resumeDownload(cityCode);
};
```

### 5. 删除地图

```typescript
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
          await OfflineMapManager.deleteMap(city.cityCode);
          loadData();
        },
      },
    ]
  );
};
```

### 6. 检查更新

```typescript
const handleCheckUpdate = async (city: OfflineMapInfo) => {
  const hasUpdate = await OfflineMapManager.checkUpdate(city.cityCode);
  
  if (hasUpdate) {
    Alert.alert(
      '发现更新',
      `${city.cityName} 有新版本可用，是否更新？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '更新',
          onPress: async () => {
            await OfflineMapManager.updateMap(city.cityCode);
          },
        },
      ]
    );
  } else {
    Alert.alert('提示', `${city.cityName} 已是最新版本`);
  }
};
```

## 🎯 最佳实践

### 1. 错误处理
所有异步操作都包含 try-catch 错误处理：

```typescript
try {
  await OfflineMapManager.startDownload({ cityCode });
} catch (error) {
  console.error('下载失败:', error);
  Alert.alert('错误', '开始下载失败');
}
```

### 2. 存储空间检查
下载前检查可用空间：

```typescript
if (storageInfo.availableSpace < city.size) {
  Alert.alert('存储空间不足', '请释放存储空间后重试');
  return;
}
```

### 3. 监听器清理
使用 useEffect 的清理函数：

```typescript
useEffect(() => {
  const progressSub = OfflineMapManager.addDownloadProgressListener(...);
  
  return () => {
    progressSub.remove(); // 清理监听器
  };
}, []);
```

### 4. 状态管理
使用 React Hooks 管理状态：

```typescript
const [cities, setCities] = useState<OfflineMapInfo[]>([]);
const [downloading, setDownloading] = useState<string | null>(null);
const [progress, setProgress] = useState<DownloadProgress>({});
```

## 📊 界面预览

```
┌─────────────────────────────────┐
│  离线地图管理                    │
│  已下载: 2 个城市                │
│  占用空间: 125.45 MB             │
├─────────────────────────────────┤
│  北京                            │
│  98.5 MB | 已下载               │
│  [检查更新] [删除]               │
├─────────────────────────────────┤
│  上海                            │
│  76.2 MB | 下载中               │
│  ████████░░ 85%                 │
│  [暂停]                          │
├─────────────────────────────────┤
│  广州                            │
│  65.8 MB | 未下载               │
│  [下载]                          │
├─────────────────────────────────┤
│         [清除所有]               │
└─────────────────────────────────┘
```

## ⚠️ 注意事项

1. **3D SDK 要求**：离线地图功能仅支持 3D SDK
2. **网络要求**：示例默认仅 WiFi 下载（`allowCellular: false`）
3. **存储空间**：下载前会检查可用空间
4. **同时下载**：示例限制同时只能下载一个城市
5. **自动加载**：下载完成后 SDK 会自动使用离线数据

## 🔗 相关文档

- [离线地图 API 文档](../packages/offline-map/README.md)
- [实现细节](../packages/offline-map/IMPLEMENTATION.md)
- [核心包文档](../packages/core/README.md)