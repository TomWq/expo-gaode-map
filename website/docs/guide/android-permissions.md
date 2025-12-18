# Android 权限问题排查指南

本指南专门针对 Android 平台的位置权限相关问题进行说明。

## 常见问题

### 问题：权限请求后立即显示未授予

**症状：**
```
⚠️  expo-gaode-map: 前台位置权限未授予 
{
  "coarseLocation": false, 
  "fineLocation": false, 
  "granted": false, 
  "isPermanentlyDenied": false, 
  "shouldShowRationale": false
}
```

用户明明点击了"同意"按钮，但控制台仍然显示权限未授予。

**原因：**

Android 系统在用户点击权限对话框的"同意"按钮后，权限状态的更新存在短暂的异步延迟。如果在权限请求后立即检查权限状态，可能获取到的是旧状态（未授予）。

**解决方案：**

本库已在 v1.x.x 版本中修复此问题。修复方案采用了**轮询机制**：

1. 调用系统权限请求 API
2. 延迟 500ms 后开始轮询检查权限状态
3. 每 100ms 检查一次，最多轮询 5 秒（50 次）
4. 一旦检测到权限已授予或达到超时时间，返回最终结果

核心代码实现（Kotlin）：
```kotlin
AsyncFunction("requestLocationPermission") { promise: expo.modules.kotlin.Promise ->
  val activity = appContext.currentActivity
  if (activity == null) {
    promise.reject("NO_ACTIVITY", "Activity not available", null)
    return@AsyncFunction
  }
  
  // 发起权限请求
  PermissionHelper.requestForegroundLocationPermission(activity, 1001)
  
  // 使用 WeakReference 避免内存泄露
  val contextRef = java.lang.ref.WeakReference(appContext.reactContext)
  val handler = android.os.Handler(android.os.Looper.getMainLooper())
  var attempts = 0
  val maxAttempts = 50 // 5 秒超时
  
  val checkPermission = object : Runnable {
    override fun run() {
      val context = contextRef.get()
      if (context == null) {
        promise.reject("CONTEXT_LOST", "Context was garbage collected", null)
        return
      }
      
      val status = PermissionHelper.checkForegroundLocationPermission(context)
      
      // 权限已授予或达到最大尝试次数，返回结果
      if (status.granted || attempts >= maxAttempts) {
        handler.removeCallbacks(this)
        promise.resolve(mapOf(
          "granted" to status.granted,
          "fineLocation" to status.fineLocation,
          "coarseLocation" to status.coarseLocation,
          "shouldShowRationale" to status.shouldShowRationale,
          "isPermanentlyDenied" to status.isPermanentlyDenied
        ))
      } else {
        attempts++
        handler.postDelayed(this, 100)
      }
    }
  }
  
  // 延迟 500ms 后开始轮询，给权限对话框弹出的时间
  handler.postDelayed(checkPermission, 500)
}
```

## 最佳实践

### 1. 正确的权限请求流程

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

async function requestLocationPermission() {
  try {
    // 1. 先检查当前权限状态
    const status = await ExpoGaodeMapModule.checkLocationPermission();
    
    if (status.granted) {
      console.log('权限已授予');
      return true;
    }
    
    // 2. 如果未授予，请求权限
    const result = await ExpoGaodeMapModule.requestLocationPermission();
    
    if (result.granted) {
      console.log('用户授予了权限');
      return true;
    } else {
      console.log('用户拒绝了权限');
      return false;
    }
  } catch (error) {
    console.error('权限请求失败:', error);
    return false;
  }
}
```

### 2. 处理权限被永久拒绝的情况

```typescript
async function handlePermissionDenied() {
  const status = await ExpoGaodeMapModule.checkLocationPermission();
  
  if (status.isPermanentlyDenied) {
    Alert.alert(
      '需要位置权限',
      '请在设置中手动开启位置权限以使用地图功能',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '去设置',
          onPress: () => ExpoGaodeMapModule.openAppSettings()
        }
      ]
    );
  }
}
```

### 3. 在应用启动时检查权限

```typescript
useEffect(() => {
  const init = async () => {
    try {
      // 更新隐私合规状态
      ExpoGaodeMapModule.updatePrivacyCompliance(true);
      
      // 检查定位权限
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      
      if (!status.granted) {
        // 请求权限
        const result = await ExpoGaodeMapModule.requestLocationPermission();
        
        if (!result.granted) {
          // 权限未授予，使用默认位置
          setInitialPosition({ 
            target: { latitude: 39.9, longitude: 116.4 }, 
            zoom: 16 
          });
          return;
        }
      }
      
      // 配置定位选项
      ExpoGaodeMapModule.setLocatingWithReGeocode(true);
      ExpoGaodeMapModule.setInterval(5000);
      
      // 获取当前位置
      const location = await ExpoGaodeMapModule.getCurrentLocation();
      setLocation(location);
      setInitialPosition({
        target: { latitude: location.latitude, longitude: location.longitude },
        zoom: 16
      });
      
    } catch (error) {
      console.error('初始化失败:', error);
    }
  };

  init();
}, []);
```

## Android 14+ 特殊说明

Android 14 引入了更细粒度的位置权限控制：

- **精确位置** (FINE_LOCATION)：获取精确的 GPS 位置
- **粗略位置** (COARSE_LOCATION)：获取大概的网络位置
- **仅本次** (One-time)：仅本次使用时允许

本库会自动处理这些权限，开发者无需额外配置。

## 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| `NO_ACTIVITY` | Activity 不可用 | 确保在 React Native 生命周期内调用 |
| `PRIVACY_NOT_AGREED` | 用户未同意隐私协议 | 先调用 `updatePrivacyCompliance(true)` |
| `CONTEXT_LOST` | Context 被垃圾回收 | 通常是内存问题，检查应用内存使用 |

## 调试技巧

### 1. 启用详细日志

在 Android Logcat 中过滤 `ExpoGaodeMap` 标签查看详细日志：

```bash
adb logcat | grep ExpoGaodeMap
```

### 2. 手动重置权限

测试时如需重置权限：

```bash
adb shell pm reset-permissions
```

或在设置中卸载应用后重新安装。

### 3. 检查权限状态

使用以下代码打印详细的权限信息：

```typescript
const status = await ExpoGaodeMapModule.checkLocationPermission();
console.log('权限详情:', {
  granted: status.granted,
  fineLocation: status.fineLocation,
  coarseLocation: status.coarseLocation,
  isPermanentlyDenied: status.isPermanentlyDenied,
  shouldShowRationale: status.shouldShowRationale
});
```

## 版本历史

- **v1.x.x**: 修复了权限请求后立即检查显示未授予的问题
  - 实现轮询机制
  - 延迟初始检查时间至 500ms
  - 最大轮询时间增加至 5 秒

## 相关链接

- [Android 权限最佳实践](https://developer.android.com/training/permissions/requesting)
- [Android 14 位置权限变更](https://developer.android.com/about/versions/14/behavior-changes-14#location-permissions)
- [高德地图 Android SDK 权限说明](https://lbs.amap.com/api/android-sdk/guide/create-project/android-studio-create-project)