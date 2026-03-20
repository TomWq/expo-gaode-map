# 使用示例

完整的使用示例和最佳实践。

> 📖 **推荐阅读**: [初始化指南](/guide/initialization) - 详细的初始化流程和权限处理

## 示例列表

### 基础示例

- [基础地图应用](/examples/basic-map) - 展示基础地图功能
- [定位追踪应用](/examples/location-tracking) - 定位和追踪功能
- [覆盖物示例](/examples/overlays) - 各种覆盖物的使用

## 完整应用示例

包含权限管理、错误处理和加载状态的完整示例：

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Alert, Linking, Platform } from 'react-native';
import {
  MapView,
  ExpoGaodeMapModule,
  type LatLng,
} from 'expo-gaode-map';

export default function App() {
  const [initialPosition, setInitialPosition] = useState<{
    target: LatLng;
    zoom: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. 首次安装时，在用户同意隐私后保存隐私状态
        if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
          ExpoGaodeMapModule.setPrivacyConfig({
            hasShow: true,
            hasContainsPrivacy: true,
            hasAgree: true,
          });
        }

        // 2. 初始化 SDK（使用 Config Plugin 时可传空对象）
        ExpoGaodeMapModule.initSDK({
          webKey: 'your-web-api-key', // 可选
        });
        
        // 3. 检查权限
        const status = await ExpoGaodeMapModule.checkLocationPermission();
        
        // 4. 请求权限（如果需要）
        if (!status.granted) {
          const result = await ExpoGaodeMapModule.requestLocationPermission();
          
          if (!result.granted) {
            // 权限被拒绝
            setInitialPosition({
              target: { latitude: 39.9, longitude: 116.4 },
              zoom: 10
            });
            
            // 引导用户到设置
            Alert.alert(
              '需要定位权限',
              '请在设置中开启定位权限',
              [
                { text: '取消' },
                { text: '去设置', onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }}
              ]
            );
            return;
          }
        }
        
        // 5. 获取位置
        const location = await ExpoGaodeMapModule.getCurrentLocation();
        setInitialPosition({
          target: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          zoom: 15
        });
        
      } catch (err) {
        console.error('初始化失败:', err);
        setError('初始化失败');
        setInitialPosition({
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10
        });
      }
    };

    initialize();
  }, []);

  // 加载状态
  if (!initialPosition && !error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>正在加载地图...</Text>
      </View>
    );
  }

  // 错误状态
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={initialPosition!}
      myLocationEnabled={true}
      onLoad={() => console.log('地图加载完成')}
    />
  );
}
```

## 下一步

- [基础地图应用](/examples/basic-map) - 学习基础地图功能
- [定位追踪应用](/examples/location-tracking) - 学习定位功能
- [覆盖物示例](/examples/overlays) - 学习覆盖物使用
- [API 文档](/api/) - 查看完整 API 参考
