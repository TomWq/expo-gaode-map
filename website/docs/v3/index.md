---
layout: home
recommended: true
package: all
legacy: true
badges:
  - Modular Runtime

hero:
  name: "expo-gaode-map v3"
  text: "React Native 高德地图 SDK"
  tagline: 地图渲染、定位、覆盖物、轨迹、离线地图。导航 / 搜索 / Web API 按需扩展。
  image:
    src: /logo.svg
    alt: expo-gaode-map
  actions:
    - theme: brand
      text: 地图快速开始
      link: /v3/guide/getting-started
    - theme: alt
      text: 30 秒选包
      link: /v3/guide/architecture
    - theme: alt
      text: 旧项目迁移
      link: /v3/guide/migration

features:
  - icon: 🗺️
    title: 地图渲染与相机控制
    details: 标准/卫星/夜间地图，手势、缩放、旋转、相机动画全支持。
  - icon: 📍
    title: 定位与隐私合规
    details: 单次/连续定位、跟随定位、权限处理与隐私初始化流程完整。
  - icon: 🧩
    title: 覆盖物体系
    details: Marker、Polyline、Polygon、Circle、Cluster、HeatMap 等能力可组合。
  - icon: 🛣️
    title: 轨迹与离线能力
    details: 轨迹回放、几何计算、离线地图下载管理，覆盖复杂业务场景。
---

<div class="v3-value-band">
  <div class="v3-value-chip"><strong>地图主包</strong><span><code>expo-gaode-map</code></span></div>
  <div class="v3-value-chip"><strong>地图核心链路</strong><span>渲染 + 定位 + 覆盖物 + 轨迹</span></div>
  <div class="v3-value-chip"><strong>导航独立包</strong><span>与 Core 互斥安装</span></div>
  <div class="v3-value-chip"><strong>扩展按需安装</strong><span>Search / Web API 可选</span></div>
</div>

## 地图能力一览（核心）

<div class="v3-map-cap-grid">
  <div class="v3-map-cap"><h3>地图渲染</h3><p>标准/卫星/夜间图层、手势交互与高性能渲染。</p></div>
  <div class="v3-map-cap"><h3>相机控制</h3><p>定位到点、平移缩放、旋转倾斜、动画控制。</p></div>
  <div class="v3-map-cap"><h3>定位能力</h3><p>单次/连续/后台定位、蓝点样式、跟随模式。</p></div>
  <div class="v3-map-cap"><h3>覆盖物系统</h3><p>Marker/Polyline/Polygon/Circle/Cluster/HeatMap。</p></div>
  <div class="v3-map-cap"><h3>轨迹与几何</h3><p>轨迹回放、路径长度、点位判断、最近点计算。</p></div>
  <div class="v3-map-cap"><h3>离线地图</h3><p>离线包下载、更新、状态管理，弱网场景可用。</p></div>
</div>

## 扩展能力（按需接入）

<div class="v3-home-grid">
  <a class="v3-home-card" href="/v3/guide/navigation">
    <h3>导航全链路</h3>
    <p>路径规划 + 导航 UI + 导航状态，适合出行和物流场景。</p>
    <span>Navigation 能力 →</span>
  </a>
  <a class="v3-home-card" href="/v3/guide/search">
    <h3>原生搜索能力</h3>
    <p>POI 搜索、输入提示、逆地理编码，适合高频检索场景。</p>
    <span>Search 能力 →</span>
  </a>
  <a class="v3-home-card" href="/v3/guide/web-api">
    <h3>纯 JS Web 服务</h3>
    <p>地理编码、算路、搜索服务，前后端都可复用数据模型。</p>
    <span>Web API 能力 →</span>
  </a>
  <a class="v3-home-card" href="/v3/guide/migration">
    <h3>v2 → v3 迁移</h3>
    <p>保留 legacy 默认入口，按模块迁移，不影响线上稳定性。</p>
    <span>迁移说明 →</span>
  </a>
</div>

## 30 秒选包（最关键）

| 需求 | 推荐包 |
| --- | --- |
| 地图渲染、定位、覆盖物 | `expo-gaode-map` |
| 导航地图 + 导航能力 | `expo-gaode-map-navigation` |
| 原生搜索能力 | `expo-gaode-map-search`（可选） |
| 纯 JS Web 服务能力 | `expo-gaode-map-web-api`（可选，可独立） |

::: warning 互斥约束
`expo-gaode-map` 与 `expo-gaode-map-navigation` 不能同时安装。
:::

## 三步接入（地图优先）

<div class="v3-choice-grid">
  <div class="v3-choice-card">
    <h3>1. 先选运行底座</h3>
    <p>地图业务选 <code>expo-gaode-map</code>；导航业务选 <code>expo-gaode-map-navigation</code>（二选一）。</p>
  </div>
  <div class="v3-choice-card">
    <h3>2. 能力按需扩展</h3>
    <p>只有业务需要时再加 <code>expo-gaode-map-search</code> / <code>expo-gaode-map-web-api</code>。</p>
  </div>
  <div class="v3-choice-card">
    <h3>3. 用 v3 入口组织代码</h3>
    <p>新代码优先 runtime/provider，老代码保持 legacy 可用并逐步迁移。</p>
  </div>
</div>

## 安装命令（直接可用）

<div class="v3-install-grid">
  <div class="v3-install-card">
    <h3>地图应用（主路径）</h3>

```bash
yarn add expo-gaode-map
```
  </div>
  <div class="v3-install-card">
    <h3>导航应用</h3>

```bash
yarn add expo-gaode-map-navigation
```
  </div>
  <div class="v3-install-card">
    <h3>可选扩展</h3>

```bash
yarn add expo-gaode-map-search
yarn add expo-gaode-map-web-api
```
  </div>
</div>

## 最小可运行示例（地图主能力）

```tsx
import { MapView } from 'expo-gaode-map'

export default function MapScreen() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
      myLocationEnabled
    />
  )
}
```

Search/Web API 的 runtime/provider 示例放在对应专题页：
- [搜索功能（v3）](/v3/guide/search)
- [Web API（v3）](/v3/guide/web-api)

## 新项目 / 老项目怎么选

- 新项目：直接走 v3 runtime/provider。
- 老项目：保持旧写法继续可跑，按模块逐步迁移。
- 文档分版本：可随时切换回 v2 查看旧接口。

下一步：
- [V3 快速开始](/v3/guide/getting-started)
- [V3 初始化](/v3/guide/initialization)
- [V3 架构说明](/v3/guide/architecture)
- [Web API（v3）](/v3/guide/web-api)
- [v2 → v3 迁移](/v3/guide/migration)
