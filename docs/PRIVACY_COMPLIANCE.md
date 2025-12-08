# 隐私合规指南

## 概述

根据中国法律法规和高德地图 SDK 要求，应用在使用定位和地图功能前，必须：

1. **告知用户**：向用户展示隐私政策
2. **获得同意**：用户明确同意隐私协议
3. **合规初始化**：在用户同意后才能调用 SDK 功能

## 平台差异

- **iOS**: 使用 `MAMapView.updatePrivacyAgree` 和 `MAMapView.updatePrivacyShow`
- **Android**: 使用 `MapsInitializer.updatePrivacyAgree` 和 `AMapLocationClient.updatePrivacyAgree`

两个平台都需要在用户同意隐私协议后才能使用 SDK 功能。

## 使用流程

### 1. 创建隐私同意弹窗（跨平台）

```javascript
import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { ExpoGaodeMapModule } from 'expo-gaode-map';

const PrivacyAgreement = ({ onAgreed }) => {
  useEffect(() => {
    // 显示隐私协议弹窗
    Alert.alert(
      '隐私协议提示',
      '在使用地图和定位功能前，请您阅读并同意我们的隐私政策。\n\n' +
      '我们将收集您的位置信息，用于提供地图显示、定位导航等服务。\n\n' +
      '点击"同意"表示您已阅读并同意我们的隐私政策。',
      [
        {
          text: '不同意',
          onPress: () => {
            // 用户不同意，退出应用或限制功能
            console.log('用户不同意隐私协议');
            // 可以导航到限制功能的页面
          },
          style: 'cancel',
        },
        {
          text: '同意',
          onPress: () => {
            // 用户同意，更新合规状态并初始化 SDK
            ExpoGaodeMapModule.updatePrivacyCompliance(true);
            
            // 初始化 SDK
            ExpoGaodeMapModule.initSDK({
              iosKey: 'your-ios-api-key',
              androidKey: 'your-android-api-key',
            });
            
            onAgreed();
          },
        },
      ],
      { cancelable: false }
    );
  }, []);

  return null;
};
```

### 2. 在应用启动时处理隐私协议

```javascript
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { PrivacyAgreement } from './PrivacyAgreement';

export default function App() {
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [location, setLocation] = useState(null);

  const handlePrivacyAgreed = async () => {
    setPrivacyAgreed(true);
    
    // 隐私协议已同意，可以使用 SDK 功能
    try {
      // 请求定位权限
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      if (!status.granted) {
        const result = await ExpoGaodeMapModule.requestLocationPermission();
        if (!result.granted) {
          console.log('定位权限被拒绝');
          return;
        }
      }
      
      // 开始定位
      const loc = await ExpoGaodeMapModule.getCurrentLocation();
      setLocation(loc);
    } catch (error) {
      console.error('定位失败:', error);
    }
  };

  if (!privacyAgreed) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>等待用户同意隐私协议...</Text>
        <PrivacyAgreement onAgreed={handlePrivacyAgreed} />
      </View>
    );
  }

  // 隐私协议已同意，显示应用主界面
  return (
    <View style={{ flex: 1 }}>
      {/* 您的应用内容 */}
      {location && (
        <Text>
          当前位置: {location.latitude}, {location.longitude}
        </Text>
      )}
    </View>
  );
}
```

### 3. 错误处理

SDK 会在以下情况抛出错误：

```javascript
try {
  await ExpoGaodeMapModule.getCurrentLocation();
} catch (error) {
  if (error.code === 'PRIVACY_NOT_AGREED') {
    // 用户未同意隐私协议
    Alert.alert('提示', '请先同意隐私协议');
  } else if (error.code === 'API_KEY_NOT_SET') {
    // 未设置 API Key
    Alert.alert('错误', '未设置 API Key');
  } else if (error.code === 'LOCATION_ERROR') {
    // 定位错误
    Alert.alert('定位失败', error.message);
  }
}
```

## 最佳实践

### 1. 隐私政策内容

您的隐私政策应包含以下内容：

- 收集的信息类型（位置信息、设备信息等）
- 信息的使用目的（提供地图、导航等服务）
- 信息的存储和保护措施
- 用户的权利（访问、更正、删除等）
- 联系方式

### 2. 记录用户同意

建议在本地记录用户的同意选择：

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const savePrivacyAgreement = async (agreed: boolean) => {
  try {
    await AsyncStorage.setItem('privacy_agreed', agreed.toString());
  } catch (error) {
    console.error('保存隐私协议状态失败:', error);
  }
};

const checkPrivacyAgreement = async () => {
  try {
    const agreed = await AsyncStorage.getItem('privacy_agreed');
    return agreed === 'true';
  } catch (error) {
    console.error('读取隐私协议状态失败:', error);
    return false;
  }
};
```

### 3. 应用启动检查

```javascript
useEffect(() => {
  const initialize = async () => {
    // 检查是否已同意隐私协议
    const agreed = await checkPrivacyAgreement();
    
    if (agreed) {
      // 已同意，直接更新合规状态
      ExpoGaodeMapModule.updatePrivacyCompliance(true);
      
      // 初始化 SDK
      ExpoGaodeMapModule.initSDK({
        iosKey: 'your-ios-api-key',
        androidKey: 'your-android-api-key',
      });
      
      setPrivacyAgreed(true);
    } else {
      // 未同意，显示隐私协议
      // PrivacyAgreement 组件会处理
    }
  };
  
  initialize();
}, []);
```

## 注意事项

1. **必须先同意才能使用**：所有 SDK 功能（包括地图显示和定位）都需要在用户同意隐私协议后才能使用

2. **建议一次同意**：隐私协议只需要用户同意一次，建议在应用启动时处理

3. **明确告知**：必须清楚告知用户将收集哪些信息以及用途

4. **提供拒绝选项**：用户可以选择不同意，此时不应使用任何 SDK 功能

5. **更新隐私政策**：如果隐私政策有更新，需要重新获得用户同意