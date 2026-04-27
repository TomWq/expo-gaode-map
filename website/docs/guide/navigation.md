
# 导航功能

`expo-gaode-map-navigation` 是高德地图"导航一体化"模块，内置完整的地图渲染和导航能力。

## 安装

导航包是**独立的一体化解决方案**，不需要同时安装 `expo-gaode-map`：

```bash
bun add expo-gaode-map-navigation
# 或
yarn add expo-gaode-map-navigation
# 或
npm install expo-gaode-map-navigation
```

::: danger 二进制冲突警告
导航包与核心包（`expo-gaode-map`）存在二进制冲突，**不能同时安装**。导航包已内置完整的地图功能。
:::

## 特性

- 🗺️ **内置地图**：包含 MapView 和所有覆盖物组件
- 🧭 **路径规划**：驾车、步行、骑行、货车、摩托车等多种方式
- 🚗 **实时导航**：`ExpoGaodeMapNaviView` 组件提供完整的导航界面
- ⚙️ **策略丰富**：最快、最短、避拥堵、少收费等多种策略
- 🔄 **独立服务**：支持无地图的独立路径规划

## 配置

### 使用 Config Plugin（推荐）

在 `app.json` 中配置：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map-navigation",
        {
          "iosKey": "your-ios-api-key",
          "androidKey": "your-android-api-key",
          "enableLocation": true
        }
      ]
    ]
  }
}
```

然后重新构建：

```bash
npx expo prebuild --clean
npx expo run:ios
# 或
npx expo run:android
```

### 初始化

在应用启动时初始化 SDK：

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';

if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
  });
}

// 已通过 Config Plugin 或手动方式配置原生 Key 时，仅 Web API 需要
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key', // 仅在使用 Web API 时需要
});

// 未配置原生 Key 时，才需要运行时传入移动端 Key
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
  webKey: 'your-web-api-key', // 可选
});
```

### 内置地图说明

- `expo-gaode-map-navigation` 内置的 `MapView` / `Marker` / `Cluster` 等组件，API 设计与核心包保持一致
- 但它底层使用导航 SDK 对应的地图能力，不能与 `expo-gaode-map` 同装
- 地图相机事件支持 `cameraEventThrottleMs`
- `moveCamera` 使用 `CameraUpdate`
- `Cluster` 支持 `icon`

## 基础用法

### 驾车路径规划

```typescript
import { calculateDriveRoute, DriveStrategy } from 'expo-gaode-map-navigation';

const result = await calculateDriveRoute({
  type: 'drive',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.FASTEST, // 速度优先
  waypoints: [                      // 途经点（可选）
    { latitude: 39.905, longitude: 116.405 },
  ],
  carNumber: '京A12345',            // 车牌号（可选）
});

// 查看结果
console.log(`找到 ${result.count} 条路线`);
result.routes.forEach((route, index) => {
  console.log(`路线 ${index + 1}:`);
  console.log(`  距离: ${(route.distance / 1000).toFixed(2)}公里`);
  console.log(`  时间: ${Math.floor(route.duration / 60)}分钟`);
  console.log(`  收费: ${route.tollCost}元`);
  console.log(`  红绿灯: ${route.trafficLightCount}个`);
});
```

**DriveStrategy 策略：**

```typescript
enum DriveStrategy {
  FASTEST = 0,                         // 速度优先（时间最短）
  FEE_FIRST = 1,                       // 费用优先（不走收费）
  SHORTEST = 2,                        // 距离优先
  NO_EXPRESSWAYS = 3,                  // 不走快速路
  AVOID_CONGESTION = 4,                // 躲避拥堵
  NO_HIGHWAY = 5,                      // 不走高速
  NO_HIGHWAY_AVOID_CONGESTION = 6,     // 不走高速且避免拥堵
  AVOID_COST_CONGESTION = 7,           // 躲避收费和拥堵
  NO_HIGHWAY_AVOID_COST_CONGESTION = 8,// 不走高速且躲避收费拥堵
  AVOID_CONGESTION_COST = 9,           // 躲避拥堵和收费
}
```

### 步行路径规划

```typescript
import { calculateWalkRoute } from 'expo-gaode-map-navigation';

const result = await calculateWalkRoute({
  type: 'walk',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  multiple: true, // 返回多条路线
});

console.log(`步行距离: ${result.distance}米`);
console.log(`预计时间: ${Math.floor(result.duration / 60)}分钟`);
```

### 骑行路径规划

```typescript
import { calculateRideRoute, RideStrategy } from 'expo-gaode-map-navigation';

const result = await calculateRideRoute({
  type: 'ride',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: RideStrategy.FASTEST, // 速度优先
  multiple: true,
});
```

**RideStrategy 策略：**

```typescript
enum RideStrategy {
  DEFAULT = 0,   // 推荐路线
  FASTEST = 1,   // 速度优先
  SHORTEST = 2,  // 距离优先
}
```

### 货车路径规划

```typescript
import { calculateTruckRoute, TruckSize } from 'expo-gaode-map-navigation';

const result = await calculateTruckRoute({
  type: 'truck',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  size: TruckSize.MEDIUM,  // 货车尺寸
  height: 3.5,             // 高度（米）
  width: 2.5,              // 宽度（米）
  load: 5,                 // 载重（吨）
  weight: 10,              // 总重（吨）
  axis: 2,                 // 轴数
});
```

**TruckSize 尺寸：**

```typescript
enum TruckSize {
  MINI = 1,    // 微型货车
  LIGHT = 2,   // 轻型货车
  MEDIUM = 3,  // 中型货车
  HEAVY = 4,   // 重型货车
}
```

### 电动车路径规划

```typescript
import { calculateEBikeRoute } from 'expo-gaode-map-navigation';

const result = await calculateEBikeRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  multiple: true,
});
```

### 摩托车路径规划

```typescript
import { calculateMotorcycleRoute } from 'expo-gaode-map-navigation';

const result = await calculateMotorcycleRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  motorcycleCC: 250,          // 排量（cc）
  carNumber: '京A12345',      // 车牌号（可选）
  strategy: DriveStrategy.FASTEST,
});
```

## 独立路径规划

独立路径规划**不会影响当前导航状态**，适用于路线预览、对比和切换场景。

### 基础用法

```typescript
import { independentDriveRoute } from 'expo-gaode-map-navigation';

// 1. 规划多条路线
const routes = await independentDriveRoute({
  from: {
    latitude: 39.9,
    longitude: 116.4,
    name: '起点名称',      // 可选
    poiId: 'B000A8VE1H',  // 可选
  },
  to: {
    latitude: 39.91,
    longitude: 116.41,
    name: '终点名称',
    poiId: 'B000A8VE2I',
  },
  waypoints: [
    { latitude: 39.905, longitude: 116.405, name: '途经点1' },
  ],
  strategy: DriveStrategy.FASTEST,
  carNumber: '京A12345',
  restriction: true, // 考虑限行
});

console.log(`找到 ${routes.count} 条路线`);
console.log(`Token: ${routes.token}`); // 用于后续操作
```

### 选择路线

```typescript
import { selectIndependentRoute } from 'expo-gaode-map-navigation';

// 方式1：使用路线索引
await selectIndependentRoute({
  token: routes.token,
  routeIndex: 1, // 从0开始
});

// 方式2：使用路线ID
await selectIndependentRoute({
  token: routes.token,
  routeId: routes.routeIds[1],
});
```

### 启动导航

```typescript
import { startNaviWithIndependentPath } from 'expo-gaode-map-navigation';

await startNaviWithIndependentPath({
  token: routes.token,
  naviType: 0,      // 0=GPS导航, 1=模拟导航
  routeIndex: 0,    // 可选，不传则使用当前主路线
});
```

### 清理路线

```typescript
import { clearIndependentRoute } from 'expo-gaode-map-navigation';

await clearIndependentRoute({
  token: routes.token,
});
```

### 完整示例：路线预览与切换

```typescript
import React, { useState } from 'react';
import { View, Button, FlatList, Text, TouchableOpacity } from 'react-native';
import {
  independentDriveRoute,
  selectIndependentRoute,
  startNaviWithIndependentPath,
  clearIndependentRoute,
  DriveStrategy,
} from 'expo-gaode-map-navigation';

export default function RoutePreviewScreen() {
  const [routes, setRoutes] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const planRoutes = async () => {
    const result = await independentDriveRoute({
      from: { latitude: 39.9, longitude: 116.4, name: '起点' },
      to: { latitude: 39.91, longitude: 116.41, name: '终点' },
      strategy: DriveStrategy.FASTEST,
    });
    setRoutes(result);
  };

  const handleSelectRoute = async (index: number) => {
    if (!routes) return;
    
    await selectIndependentRoute({
      token: routes.token,
      routeIndex: index,
    });
    setSelectedIndex(index);
  };

  const startNavigation = async () => {
    if (!routes) return;
    
    await startNaviWithIndependentPath({
      token: routes.token,
      naviType: 0, // GPS导航
    });
  };

  const cleanup = async () => {
    if (!routes) return;
    
    await clearIndependentRoute({
      token: routes.token,
    });
    setRoutes(null);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="规划路线" onPress={planRoutes} />

      {routes && (
        <>
          <FlatList
            data={routes.routes}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => handleSelectRoute(index)}
                style={{
                  padding: 15,
                  marginTop: 10,
                  backgroundColor:
                    selectedIndex === index ? '#e8f5e9' : '#fff',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#ccc',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                  路线 {index + 1}
                  {index === routes.mainPathIndex && ' (推荐)'}
                </Text>
                <Text style={{ marginTop: 5 }}>
                  距离: {(item.distance / 1000).toFixed(2)}公里
                </Text>
                <Text>时间: {Math.floor(item.duration / 60)}分钟</Text>
                <Text>收费: {item.tollCost}元</Text>
                <Text>红绿灯: {item.trafficLightCount}个</Text>
              </TouchableOpacity>
            )}
          />

          <View style={{ marginTop: 20 }}>
            <Button title="开始导航" onPress={startNavigation} />
            <Button title="清理路线" onPress={cleanup} color="red" />
          </View>
        </>
      )}
    </View>
  );
}
```

## 官方导航页（openOfficialNaviPage）

`openOfficialNaviPage` 会调起高德官方导航组件（非 `ExpoGaodeMapNaviView` 内嵌模式），适合快速接入官方完整 UI。

支持两种页面模式：

- `pageType: 'ROUTE'`：先打开官方路线规划页
- `pageType: 'NAVI'`：直接进入官方导航页

### 基础示例（直接进入导航 + 模拟）

```typescript
import { openOfficialNaviPage } from 'expo-gaode-map-navigation';

await openOfficialNaviPage({
  from: { latitude: 39.909186, longitude: 116.397411, name: '天安门' }, // 可选
  to: { latitude: 39.908823, longitude: 116.39747, name: '目的地' },      // 必填
  pageType: 'NAVI',
  startNaviDirectly: true,
  naviMode: 2,             // 1=实时导航, 2=模拟导航（官方组件）
  routeStrategy: 10,       // 策略值，默认推荐多路径策略
  theme: 'BLACK',          // BLUE | WHITE | BLACK
  trafficEnabled: true,
  showCrossImage: true,
  carInfo: {
    carType: '1',          // 1=货车, 0=小客车, 11=摩托车
    carNumber: '京A12345',
    restriction: true,
  },
});
```

### 平台特有参数

| 参数 | 平台 | 说明 |
|------|------|------|
| `dayAndNightMode` | Android | 昼夜模式：`0` 自动、`1` 白天、`2` 夜间 |
| `broadcastMode` | Android | 语音播报：`1` 简洁、`2` 详细、`3` 静音 |
| `carDirectionMode` | Android | 视角：`1` 正北朝上、`2` 车头朝上 |
| `showVoiceSettings` | Android | 是否显示语音设置项 |
| `secondActionVisible` | Android | 是否显示“下下个路口”引导 |
| `mapViewModeType` | iOS | 地图样式类型（覆盖 `dayAndNightMode`） |
| `broadcastType` | iOS | 播报类型（覆盖 `broadcastMode`） |
| `trackingMode` | iOS | 跟随模式（覆盖 `carDirectionMode`） |
| `showNextRoadInfo` | iOS | 是否显示随后转向图标 |
| `showBackupRoute` | iOS | 多路线模式下是否显示备选路线 |
| `showRestrictareaEnable` | iOS | 是否显示限行图层（付费能力） |
| `removePolylineAndVectorlineWhenArrivedDestination` | iOS | 到达后移除路线和牵引线 |
| `showCameraDistanceEnable` | iOS | 是否显示电子眼距离（SDK 支持时生效） |
| `scaleFactor` | iOS | 地图缩放比例（SDK 支持时生效） |

### 重要限制

- iOS 直接进导航页（`pageType: 'NAVI'` 或 `startNaviDirectly: true`）要求开启后台定位 `UIBackgroundModes: location`。
- iOS 官方导航组件模式不支持模拟导航；若传 `naviMode: 2` 会直接返回错误提示。
- 若未开启，接口会返回 `BACKGROUND_LOCATION_NOT_ENABLED`。
- Android 官方组件依赖 `com.amap.api.navi.AmapRouteActivity`，插件已自动注入；自定义原生工程请确保 Manifest 已声明该 Activity。

## ExpoGaodeMapNaviView 导航组件

`ExpoGaodeMapNaviView` 是高德官方提供的完整导航界面组件。

如果你要做业务成品页，建议同时参考仓库内 `example-navigation` 的两个示例：

- `app/examples/ui-props.tsx`：自定义嵌入式导航 UI
- `app/examples/route-picker.tsx`：自定义路线选择页 / 多路线规划

### 效果示例

下面这组截图用于快速对比官方默认嵌入式导航样式和自定义 UI 导航样式：

<table>
  <tr>
    <td align="center">
      <strong>官方默认 1</strong><br />
      <img src="/images/navigation/official-default-1.jpg" alt="官方默认导航样式 1" width="260" />
    </td>
    <td align="center">
      <strong>官方默认 2</strong><br />
      <img src="/images/navigation/official-default-2.jpg" alt="官方默认导航样式 2" width="260" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>自定义 UI 1</strong><br />
      <img src="/images/navigation/custom-ui-1.jpg" alt="自定义导航样式 1" width="260" />
    </td>
    <td align="center">
      <strong>自定义 UI 2</strong><br />
      <img src="/images/navigation/custom-ui-2.jpg" alt="自定义导航样式 2" width="260" />
    </td>
  </tr>
</table>

### 多路线规划示例

如果你需要起点 / 终点 / 多途经点输入，以及底部多条候选路线切换，可以参考“自定义路线选择页”：

<p align="center">
  <img src="/images/navigation/route-picker-multi-route.jpg" alt="多路线规划示例" width="320" />
</p>

### 基础用法

```typescript
import React, { useRef } from 'react';
import { View, Button } from 'react-native';
import { ExpoGaodeMapNaviView, type ExpoGaodeMapNaviViewRef } from 'expo-gaode-map-navigation';

function NavigationScreen() {
  const naviViewRef = useRef<ExpoGaodeMapNaviViewRef>(null);

  const startNavigation = async () => {
    await naviViewRef.current?.startNavigation(
      { latitude: 39.9, longitude: 116.4 },   // 起点（null=当前位置）
      { latitude: 39.91, longitude: 116.41 }, // 终点
      1  // 0=GPS导航, 1=模拟导航
    );
  };

  const stopNavigation = async () => {
    await naviViewRef.current?.stopNavigation();
  };

  return (
    <View style={{ flex: 1 }}>
      <ExpoGaodeMapNaviView
        ref={naviViewRef}
        style={{ flex: 1 }}
        naviType={1}
        enableVoice={true}
        showCamera={true}
        onNaviStart={(e) => console.log('导航开始')}
        onNaviEnd={(e) => console.log('导航结束')}
        onArrive={(e) => console.log('到达目的地')}
        onNaviInfoUpdate={(e) => {
          const { pathRetainDistance, pathRetainTime } = e.nativeEvent;
          console.log(`剩余: ${pathRetainDistance}米, ${pathRetainTime}秒`);
        }}
      />
      
      <View style={{ position: 'absolute', bottom: 20, right: 20 }}>
        <Button title="开始" onPress={startNavigation} />
        <Button title="停止" onPress={stopNavigation} color="red" />
      </View>
    </View>
  );
}
```

### ExpoGaodeMapNaviView 属性

#### 核心属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `naviType` | `number` | `0` | 导航类型：`0`=GPS导航, `1`=模拟导航 |
| `enableVoice` | `boolean` | `true` | 是否启用语音播报 |
| `showCamera` | `boolean` | `true` | 是否显示摄像头提示 |
| `autoLockCar` | `boolean` | `true` | 是否自动锁车 |
| `autoChangeZoom` | `boolean` | `true` | 是否自动缩放地图 |
| `trafficLayerEnabled` | `boolean` | `true` | 是否显示交通路况 |
| `realCrossDisplay` | `boolean` | `true` | 是否显示路口放大图 |
| `naviMode` | `number` | `0` | 视角模式：`0`=车头朝上, `1`=正北朝上 |
| `showMode` | `number` | `1` | 显示模式：`1`=锁车态, `2`=全览态, `3`=普通态 |
| `isNightMode` | `boolean` | `false` | 是否开启夜间模式 |

### ExpoGaodeMapNaviView 事件

#### onNaviStart - 导航开始

```typescript
onNaviStart={(e) => {
  const { type } = e.nativeEvent;
  console.log(`导航开始，类型: ${type === 1 ? '模拟' : 'GPS'}`);
}}
```

#### onNaviEnd - 导航结束

```typescript
onNaviEnd={(e) => {
  const { reason } = e.nativeEvent;
  console.log(`导航结束: ${reason}`);
}}
```

#### onArrive - 到达目的地

```typescript
onArrive={(e) => {
  console.log('已到达目的地');
}}
```

#### onNaviInfoUpdate - 实时导航信息

```typescript
onNaviInfoUpdate={(e) => {
  const {
    pathRetainDistance,  // 剩余距离（米）
    pathRetainTime,      // 剩余时间（秒）
    currentRoadName,     // 当前道路名称
    nextRoadName,        // 下一道路名称
    currentSpeed,        // 当前速度（米/秒）
    iconType,            // 转向图标类型
    iconDirection,       // 转向方向
  } = e.nativeEvent;
}}
```

#### onCalculateRouteSuccess - 路径规划成功

```typescript
onCalculateRouteSuccess={(e) => {
  const { routeIds } = e.nativeEvent;
  console.log('路径规划成功');
}}
```

#### onCalculateRouteFailure - 路径规划失败

```typescript
onCalculateRouteFailure={(e) => {
  const { error, errorCode } = e.nativeEvent;
  console.error(`规划失败: ${error}`);
}}
```

### 完整示例

```typescript
import React, { useRef, useState } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { ExpoGaodeMapNaviView, type ExpoGaodeMapNaviViewRef } from 'expo-gaode-map-navigation';

export default function FullNavigationScreen() {
  const naviViewRef = useRef<ExpoGaodeMapNaviViewRef>(null);
  const [naviInfo, setNaviInfo] = useState({
    distance: 0,
    time: 0,
    road: '',
  });

  const startNavigation = async () => {
    await naviViewRef.current?.startNavigation(
      null, // 使用当前位置
      { latitude: 39.91, longitude: 116.41 },
      0 // GPS导航
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ExpoGaodeMapNaviView
        ref={naviViewRef}
        style={{ flex: 1 }}
        naviType={0}
        enableVoice={true}
        showCamera={true}
        trafficLayerEnabled={true}
        onNaviStart={() => console.log('导航开始')}
        onNaviEnd={(e) => console.log('导航结束:', e.nativeEvent.reason)}
        onArrive={() => console.log('到达目的地')}
        onNaviInfoUpdate={(e) => {
          const { pathRetainDistance, pathRetainTime, currentRoadName } =
            e.nativeEvent;
          setNaviInfo({
            distance: pathRetainDistance,
            time: pathRetainTime,
            road: currentRoadName,
          });
        }}
        onCalculateRouteFailure={(e) => {
          console.error('路径规划失败:', e.nativeEvent.error);
        }}
      />

      <View style={styles.infoPanel}>
        <Text style={styles.infoText}>
          剩余: {(naviInfo.distance / 1000).toFixed(2)}公里
        </Text>
        <Text style={styles.infoText}>
          时间: {Math.floor(naviInfo.time / 60)}分钟
        </Text>
        <Text style={styles.infoText}>当前道路: {naviInfo.road}</Text>
      </View>

      <View style={styles.buttonPanel}>
        <Button title="开始导航" onPress={startNavigation} />
        <Button
          title="停止导航"
          onPress={() => naviViewRef.current?.stopNavigation()}
          color="red"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoPanel: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 16,
    marginVertical: 2,
  },
  buttonPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});
```

## 地图功能

导航包内置了完整的地图功能，可以直接使用 MapView 和覆盖物组件：

```typescript
import { MapView, Marker, Polyline } from 'expo-gaode-map-navigation';

export default function MapScreen() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 12,
      }}
    >
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        title="起点"
      />
      
      <Polyline
        points={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.91, longitude: 116.41 },
        ]}
        strokeColor="#FF0000"
        strokeWidth={5}
      />
    </MapView>
  );
}
```

更多地图功能请参考 [地图 API 文档](/api/mapview)。

## 常见问题

### 1. 与 expo-gaode-map 冲突

**问题**：同时安装导致编译错误。

**解决**：
```bash
npm uninstall expo-gaode-map
npm install expo-gaode-map-navigation
```

### 2. "Another route calculation is in progress"

**问题**：连续规划路径时报错。

**解决**：页面卸载时清理资源。

```typescript
import { destroyAllCalculators } from 'expo-gaode-map-navigation';

useEffect(() => {
  return () => {
    destroyAllCalculators();
  };
}, []);
```

### 3. ExpoGaodeMapNaviView 启动导航无反应

**问题**：startNavigation 调用后没有效果。

**解决**：
- 确保视图已渲染（使用 setTimeout 延迟）
- 检查坐标是否正确
- 查看 onCalculateRouteFailure 错误信息

```typescript
setShowNavi(true);
setTimeout(async () => {
  await naviViewRef.current?.startNavigation(start, end, 1);
}, 500);
```

### 4. 如何使用当前位置作为起点

```typescript
// 方式1：传 null
await naviViewRef.current?.startNavigation(
  null,  // 使用当前位置
  destination,
  0
);

// 方式2：先获取当前位置
const location = await ExpoGaodeMapModule.getCurrentLocation();
await naviViewRef.current?.startNavigation(
  { latitude: location.latitude, longitude: location.longitude },
  destination,
  0
);
```

### 5. 路径规划失败怎么办

检查以下几点：
- API Key 是否正确配置
- 起终点坐标是否有效
- 网络连接是否正常
- 查看错误信息：

```typescript
onCalculateRouteFailure={(e) => {
  const { error, errorCode } = e.nativeEvent;
  console.error(`错误代码: ${errorCode}, 错误信息: ${error}`);
}}
```

### 6. 如何自定义导航界面

ExpoGaodeMapNaviView 提供了丰富的属性来控制界面元素：

```typescript
<ExpoGaodeMapNaviView
  showCamera={false}          // 隐藏摄像头提示
  showMode={3}                // 普通态（可自由操作地图）
  trafficLayerEnabled={false} // 隐藏路况
/>
```

## 相关文档

- [导航 API](/api/navigation) - 完整 API 参考
- [地图 API](/api/mapview) - MapView 组件文档
- [覆盖物 API](/api/overlays) - 覆盖物组件
- [Web API](/api/web-api) - Web 服务 API
- [快速开始](/guide/getting-started) - 安装和配置
