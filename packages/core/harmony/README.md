# Harmony Core 接入说明（RNOH）

本目录提供 `expo-gaode-map` core 在 HarmonyOS 下的实现。
当前阶段目标是先打通启动链路：应用可在鸿蒙端启动并渲染 `ExpoGaodeMapView`。

## 包结构

- Harmony 模块目录：`harmony/expo_gaode_map`
- ArkTS 入口：`harmony/expo_gaode_map/index.ets`
- TS 辅助入口：`harmony/expo_gaode_map/ts.ts`
- C++ 包入口：`harmony/expo_gaode_map/src/main/cpp/ExpoGaodeMapPackage.h`

## 安装与接入

### 0. 前置说明

- 本接入基于 OpenHarmony RN（RNOH）自定义组件体系。
- 本库当前包含一个自定义地图 View：`ExpoGaodeMapView`。
- 由于涉及自定义 View，宿主通常需要做 ArkTS 组件注册（`buildCustomRNComponent` + `arkTsComponentNames`）。

### 1. 在 Harmony 工程根目录配置 overrides

编辑宿主 Harmony 工程根目录 `oh-package.json5`：

```json
{
  "overrides": {
    "@rnoh/react-native-openharmony": "./react_native_openharmony"
  }
}
```

### 2. 引入原生端代码

目前支持两种方式：

1. 通过 HAR 包引入（推荐用于发布产物）
2. 直接链接源码（推荐用于当前开发调试）

#### 方式一：HAR 包引入

HAR 包位于三方库安装路径的 `harmony` 文件夹下（文件名以实际产物为准）。

编辑 `entry/oh-package.json5`，添加依赖：

```json
{
  "dependencies": {
    "@rnoh/react-native-openharmony": "file:../react_native_openharmony",
    "expo-gaode-map": "file:../../node_modules/expo-gaode-map/harmony/expo_gaode_map.har"
  }
}
```

#### 方式二：源码目录引入

编辑 `entry/oh-package.json5`，添加依赖：

```json
{
  "dependencies": {
    "@rnoh/react-native-openharmony": "file:../react_native_openharmony",
    "expo-gaode-map": "file:../../node_modules/expo-gaode-map/harmony/expo_gaode_map"
  }
}
```

然后执行：

```bash
cd entry
ohpm install
```

### 3. 配置 CMakeLists 并引入 ExpoGaodeMapPackage（C++）

编辑 `entry/src/main/cpp/CMakeLists.txt`，增加模块路径与链接：

```cmake
project(rnapp)
cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_SKIP_BUILD_RPATH TRUE)
set(RNOH_APP_DIR "${CMAKE_CURRENT_SOURCE_DIR}")
set(NODE_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../node_modules")
set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")
set(RNOH_CPP_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../react-native-harmony/harmony/cpp")
set(LOG_VERBOSITY_LEVEL 1)
set(CMAKE_ASM_FLAGS "-Wno-error=unused-command-line-argument -Qunused-arguments")
set(CMAKE_CXX_FLAGS "-fstack-protector-strong -Wl,-z,relro,-z,now,-z,noexecstack -s -fPIE -pie")
set(WITH_HITRACE_SYSTRACE 1)
add_compile_definitions(WITH_HITRACE_SYSTRACE)

add_subdirectory("${RNOH_CPP_DIR}" ./rn)

# RNOH_BEGIN: manual_package_linking_1
add_subdirectory("../../../../sample_package/src/main/cpp" ./sample-package)
add_subdirectory("${OH_MODULES}/expo-gaode-map/src/main/cpp" ./expo_gaode_map)
# RNOH_END: manual_package_linking_1

file(GLOB GENERATED_CPP_FILES "./generated/*.cpp")

add_library(rnoh_app SHARED
  ${GENERATED_CPP_FILES}
  "./PackageProvider.cpp"
  "${RNOH_CPP_DIR}/RNOHAppNapiBridge.cpp"
)
target_link_libraries(rnoh_app PUBLIC rnoh)

# RNOH_BEGIN: manual_package_linking_2
target_link_libraries(rnoh_app PUBLIC rnoh_sample_package)
target_link_libraries(rnoh_app PUBLIC expo_gaode_map)
# RNOH_END: manual_package_linking_2
```

编辑 `entry/src/main/cpp/PackageProvider.cpp`：

```cpp
#include "RNOH/PackageProvider.h"
#include "generated/RNOHGeneratedPackage.h"
#include "SamplePackage.h"
#include "ExpoGaodeMapPackage.h"

using namespace rnoh;

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
  return {
    std::make_shared<RNOHGeneratedPackage>(ctx),
    std::make_shared<SamplePackage>(ctx),
    std::make_shared<rnoh::ExpoGaodeMapPackage>(ctx)
  };
}
```

### 4. 在 ArkTS 侧引入并注册自定义组件（View）

找到 `buildCustomRNComponent()`（通常在 `entry/src/main/ets/pages/index.ets` 或 `entry/src/main/ets/rn/LoadBundle.ets`）：

```ts
import { ExpoGaodeMapView } from 'expo-gaode-map';

@Builder
export function buildCustomRNComponent(ctx: ComponentBuilderContext) {
  if (ctx.componentName === ExpoGaodeMapView.NAME) {
    ExpoGaodeMapView({
      ctx: ctx.rnComponentContext,
      tag: ctx.tag,
    });
  }

  // ...其他自定义组件
}
```

### 5. 在 arkTsComponentNames 中增加组件名

同文件中找到 `arkTsComponentNames`，加入：

```ts
const arkTsComponentNames: Array<string> = [
  SampleView.NAME,
  GeneratedSampleView.NAME,
  PropsDisplayer.NAME,
  ExpoGaodeMapView.NAME
];
```

### 6. 在 RNPackagesFactory 注册 ArkTS 包（TurboModule）

编辑 `entry/src/main/ets/RNPackagesFactory.ts`：

```ts
import { ExpoGaodeMapPackage } from 'expo-gaode-map/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new SamplePackage(ctx),
    new ExpoGaodeMapPackage(ctx)
  ];
}
```

### 7. 同步并运行

```bash
cd entry
ohpm install
```

然后在 DevEco Studio 同步并编译运行。

## 当前范围

已实现：
- `ExpoGaodeMap` TurboModule（隐私、权限、SDK 初始化）
- `ExpoGaodeMapView` Fabric 视图 + 基础地图属性与事件
- 地图图层/交互：`mapType`、`trafficEnabled`、`buildingsEnabled`、`labelsEnabled`、手势与 UI 控件开关
- 定位蓝点：`myLocationEnabled`、`followUserLocation`、`userLocationRepresentation`（部分字段）
- 主题能力：`customMapStyle`、`worldMapSwitchEnabled`
- 事件：`onMapPress`、`onMapLongPress`、`onPressPoi`、`onCameraMove`、`onCameraIdle`、`onLocation`、`onLoad`
- 相机命令：`moveCamera`（Harmony command bridge）

部分支持：
- `userLocationRepresentation` 里以下字段暂未对齐：`showsHeadingIndicator`、`enablePulseAnimation`、`locationDotBgColor`、`locationDotFillColor`、`imageWidth`、`imageHeight`
- `userLocationRepresentation.image` 目前仅支持 `rawfile` 资源路径

未实现：
- 覆盖物组件原生实现（`Marker`/`Polyline`/`Polygon`/`Circle`/`HeatMap`/`MultiPoint`/`Cluster`）
- 离线地图能力
