# expo-gaode-map

[English](./README.en.md) | 简体中文

一个功能完整的高德地图 React Native 组件库，**基于 Expo Modules 开发**，提供地图显示、定位、覆盖物等功能。

> 💡 本组件使用 [Expo Modules API](https://docs.expo.dev/modules/overview/) 构建，提供了类型安全的原生模块接口和优秀的开发体验。

## 📖 完整文档

**👉 [在线文档网站](https://TomWq.github.io/expo-gaode-map/)** - 包含完整的 API 文档、使用指南和示例代码

## ✨ 主要特性

- ✅ 完整的地图功能（多种地图类型、手势控制、相机操作）
- ✅ 精准定位（连续定位、单次定位、坐标转换）
- ✅ 丰富的覆盖物（Circle、Marker、Polyline、Polygon、HeatMap、Cluster 等）
- ✅ 完整的 TypeScript 类型定义
- ✅ 跨平台支持（Android、iOS）
- ✅ 同时支持 React Native 新旧架构（Paper & Fabric）

## 📦 安装

### 稳定版本（推荐）

```bash
npm install expo-gaode-map
# 或
yarn add expo-gaode-map
# 或
pnpm add expo-gaode-map
```

## 🚀 快速开始

### 1. 获取高德地图 API Key

前往 [高德开放平台](https://lbs.amap.com/) 注册并创建应用，获取 API Key。

> ⚠️ **重要提示**: 高德地图 SDK 需要在原生项目中进行配置（API Key、权限、隐私合规等）
> 
> 详细配置请查看：[初始化指南](https://TomWq.github.io/expo-gaode-map/guide/initialization.html)

### 2. 基础使用

```tsx
import { useEffect, useState } from 'react';
import { MapView, ExpoGaodeMapModule } from 'expo-gaode-map';

export default function App() {
  const [initialPosition, setInitialPosition] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      // 1. 初始化 SDK
      ExpoGaodeMapModule.initSDK({
        androidKey: 'your-android-api-key',
        iosKey: 'your-ios-api-key',
      });
      
      // 2. 检查并请求权限
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      if (!status.granted) {
        await ExpoGaodeMapModule.requestLocationPermission();
      }
      
      // 3. 获取位置并设置地图
      try {
        const location = await ExpoGaodeMapModule.getCurrentLocation();
        setInitialPosition({
          target: { latitude: location.latitude, longitude: location.longitude },
          zoom: 15
        });
      } catch (error) {
        // 使用默认位置
        setInitialPosition({
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10
        });
      }
    };
    
    initialize();
  }, []);

  if (!initialPosition) return null;

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={initialPosition}
      myLocationEnabled={true}
    />
  );
}
```

## 📚 文档导航

- [快速开始](https://TomWq.github.io/expo-gaode-map/guide/getting-started.html) - 快速上手指南
- [初始化指南](https://TomWq.github.io/expo-gaode-map/guide/initialization.html) - SDK 初始化和权限配置
- [API 文档](https://TomWq.github.io/expo-gaode-map/api/) - 完整的 API 参考
- [使用示例](https://TomWq.github.io/expo-gaode-map/examples/) - 详细的代码示例
- [架构文档](https://TomWq.github.io/expo-gaode-map/guide/architecture.html) - 项目结构说明

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 🔗 相关链接

- [在线文档](https://TomWq.github.io/expo-gaode-map/)
- [GitHub 仓库](https://github.com/TomWq/expo-gaode-map)
- [高德地图开放平台](https://lbs.amap.com/)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

## 🙏 致谢

本项目在开发过程中参考了以下优秀项目：

- **[react-native-amap3d](https://github.com/qiuxiang/react-native-amap3d)** - 一个优秀的 React Native 高德地图组件

感谢这些开源项目的贡献者们！

## 📮 反馈与支持

如果你在使用过程中遇到问题或有任何建议，欢迎：

- 📝 提交 [GitHub Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 参与 [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- ⭐ 给项目点个 Star 支持一下
- 💬 加入 QQ 群：952241387
