# rn-harmony-host

当前仓库内的独立 RN + Harmony Host 示例工程，用于验证 `expo-gaode-map` 的鸿蒙接入。

## 已接入内容

- Harmony 依赖：
  - `@rnoh/react-native-openharmony@0.72.82`
  - 本地包 `expo-gaode-map`（指向 `../../packages/core/harmony/expo_gaode_map`）
- C++ 手动链接 `expo_gaode_map`
- `PackageProvider.cpp` 注册 `ExpoGaodeMapPackage`
- ArkTS:
  - `RNPackagesFactory.ets` 注册 `ExpoGaodeMapPackage`
  - `buildCustomRNComponent` 注册 `ExpoGaodeMapView`
  - `arkTsComponentNames` 添加 `ExpoGaodeMapView.NAME`
- JS `App.tsx` 使用 `requireNativeComponent('ExpoGaodeMapView')` 直接渲染地图

## 运行步骤

1. 安装 Harmony 依赖

```bash
cd harmony/entry
/Volumes/wangqiang/harmonyos/command-line-tools/bin/ohpm install
```

2. 构建 HAP（Debug）

```bash
cd ..
/Volumes/wangqiang/harmonyos/command-line-tools/bin/hvigorw --mode module -p module=entry@default -p product=default -p buildMode=debug assembleHap
```

3. 产物路径

```text
harmony/entry/build/default/outputs/default/entry-default-unsigned.hap
```

4. （可选）启动 Metro

```bash
cd ..
npm install
npm run start
```

## 说明

- 当前 `build-profile.json5` 已开启 `useNormalizedOHMUrl: true`，满足 AMap Bytecode HAR 要求。
- 构建阶段会有较多 ArkTS 警告（来自 RNOH/AMap 三方包），但不影响本工程编译通过。
