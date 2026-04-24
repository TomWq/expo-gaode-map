import type { ComponentType } from 'react';

import AOIOverlayExample from './AOIOverlayExample';
import AddressPickerNativeExample from './AddressPickerNativeExample';
import AddressPickerWebAPIExample from './AddressPickerWebAPIExample';
import AdvancedOverlayExample from './AdvancedOverlayExample';
import DeliveryAddressPickerExample from './DeliveryAddressPickerExample';
import DeliveryRouteExample from './DeliveryRouteExample';
import DispatchWorkbenchExample from './DispatchWorkbenchExample';
import DynamicRouteTrackingExample from './DynamicRouteTrackingExample';
import EnterpriseCheckInExample from './EnterpriseCheckInExample';
import LegacyPlaygroundExample from './App';
import GeometryUtilsExample from './GeometryUtilsExample';
import IndustrySceneExample from './IndustrySceneExample';
import InputTipsExample from './InputTipsExample';
import LBSDemo from './LBSDemo';
import MapBasicsExample from './MapBasicsExample';
import MapDebugExample from './MapDebugExample';
import MayDayFiveDayTripExample from './MayDayFiveDayTripExample';
import MarkerImageCacheExample from './MarkerImageCacheExample';
import MarkerTravelCardExample from './MarkerTravelCardExample';
import MultiFormatExample from './MultiFormatExample';
import OfflineMapExample from './OfflineMapExample';
import OverlayPlaygroundExample from './OverlayPlaygroundExample';
import POIMapSearchWebAPIExample from './POIMapSearchWebAPIExample';
import POISearchMapNativeExample from './POISearchMapNativeExample';
import POISearchNativeExample from './POISearchNativeExample';
import PermissionExample from './PermissionExample';
import PlatformOptimizationDemo from './PlatformOptimizationDemo';
import PolylineExample from './PolylineExample';
import PrivacyInitializationExample from './PrivacyInitializationExample';
import RandomMarkersExample from './RandomMarkersExample';
import RentalMapLabelExample from './RentalMapLabelExample';
import SearchModuleTest from './SearchModuleTest';
import SmoothMoveExample from './SmoothMoveExample';
import TestNewPermissionMethods from './TestNewPermissionMethods';
import TaxiLocationPickerExample from './TaxiLocationPickerExample';
import UseMapExample from './UseMapExample';
import WebAPIAdvancedTest from './WebAPIAdvancedTest';
import WebAPIExample from './WebAPIExample';
import NavigationWithLocationExample from './navigationWithLocation';

export type ExampleDefinition = {
  id: string;
  title: string;
  description: string;
  outcome: string;
  component: ComponentType;
  requiresRuntimeGate?: boolean;
  immersive?: boolean;
};

export const EXAMPLE_REGISTRY: Record<string, ExampleDefinition> = {
  'privacy-init': {
    id: 'privacy-init',
    title: '隐私与初始化',
    description: '单独演示 setPrivacyConfig、initSDK 和定位权限请求的推荐启动顺序。',
    outcome: '完成 SDK 初始化与权限准备',
    component: PrivacyInitializationExample,
    requiresRuntimeGate: false,
  },
  'map-basics': {
    id: 'map-basics',
    title: '地图基础能力',
    description: '聚合查看 MapView、相机事件、定位按钮和连续定位的标准写法。',
    outcome: '进入基础地图交互页',
    component: MapBasicsExample,
  },
  'overlay-playground': {
    id: 'overlay-playground',
    title: '基础覆盖物 Playground',
    description: '集中查看 Circle、Marker、Polyline、Polygon 以及 fitToCoordinates。',
    outcome: '进入基础覆盖物验证页',
    component: OverlayPlaygroundExample,
  },
  'advanced-playground': {
    id: 'advanced-playground',
    title: '高级覆盖物 Playground',
    description: '集中查看 HeatMap、MultiPoint、Cluster、AreaMaskOverlay 和截图能力。',
    outcome: '进入高级覆盖物验证页',
    component: AdvancedOverlayExample,
  },
  'route-playback': {
    id: 'route-playback',
    title: '路线回放（core）',
    description: '演示 core 侧 RouteOverlay、fitToCoordinates 和 useRoutePlayback 的标准组合。',
    outcome: '进入路线回放联动页',
    component: NavigationWithLocationExample,
  },
  'use-map': {
    id: 'use-map',
    title: 'useMap Hook',
    description: '演示如何在 MapView 子树里直接获取地图实例并控制相机。',
    outcome: '进入 Hook 调用示例页',
    component: UseMapExample,
  },
  'map-debug': {
    id: 'map-debug',
    title: '地图调试事件',
    description: '演示相机事件计数、原生节流切换和 POI 点击验证。',
    outcome: '进入地图调试面板页',
    component: MapDebugExample,
  },
  polyline: {
    id: 'polyline',
    title: '折线与轨迹',
    description: '演示折线绘制、路径展示和轨迹点组织方式。',
    outcome: '进入轨迹渲染页',
    component: PolylineExample,
  },
  'smooth-move': {
    id: 'smooth-move',
    title: 'Marker 平滑移动',
    description: '演示 smoothMovePath 和 smoothMoveDuration 的使用方式。',
    outcome: '进入平滑移动效果页',
    component: SmoothMoveExample,
  },
  'marker-image-cache': {
    id: 'marker-image-cache',
    title: 'Marker 图片缓存复现',
    description: '对比唯一 cacheKey、不传 cacheKey、共享 cacheKey 三种 children + Image 场景。',
    outcome: '进入缓存一致性验证页',
    component: MarkerImageCacheExample,
  },
  'marker-travel-card': {
    id: 'marker-travel-card',
    title: '景点卡片 Marker 复现',
    description: '更贴近群友截图的横向卡片 Marker，继续使用远程图片与 cacheKey 切换。',
    outcome: '进入卡片 Marker 复现页',
    component: MarkerTravelCardExample,
  },
  'rental-map-label': {
    id: 'rental-map-label',
    title: '租房地图标签（截图同款）',
    description: '复现气泡价签与列表标签两种地图标记样式，支持缩放自动切换。',
    outcome: '进入标签样式对比页',
    component: RentalMapLabelExample,
  },
  'random-markers': {
    id: 'random-markers',
    title: '随机标记点',
    description: '演示批量 Marker 的渲染、更新和地图交互。',
    outcome: '进入批量 Marker 压力页',
    component: RandomMarkersExample,
  },
  'multi-format': {
    id: 'multi-format',
    title: '多格式坐标',
    description: '演示对象坐标、数组坐标和 GeoJSON 风格坐标的兼容输入。',
    outcome: '进入坐标兼容验证页',
    component: MultiFormatExample,
  },
  'aoi-mask': {
    id: 'aoi-mask',
    title: 'AOI 区域遮罩',
    description: '演示 AreaMaskOverlay 与多环边界输入，适合区域高亮场景。',
    outcome: '进入 AOI 遮罩渲染页',
    component: AOIOverlayExample,
  },
  'geometry-utils': {
    id: 'geometry-utils',
    title: '几何计算',
    description: '演示距离、抽稀、最近点、路径长度等原生几何能力。',
    outcome: '进入几何工具验证页',
    component: GeometryUtilsExample,
  },
  permissions: {
    id: 'permissions',
    title: '权限基础示例',
    description: '演示定位权限检查、请求和常见权限流程。',
    outcome: '进入权限流程示例页',
    component: PermissionExample,
  },
  'new-permissions': {
    id: 'new-permissions',
    title: '新权限接口',
    description: '演示增强权限接口与后台定位相关能力。',
    outcome: '进入新权限接口示例页',
    component: TestNewPermissionMethods,
  },
  lbs: {
    id: 'lbs',
    title: 'LBS 综合能力',
    description: '演示定位、逆地理编码和地图联动的典型 LBS 用法。',
    outcome: '进入 LBS 联调页',
    component: LBSDemo,
  },
  'offline-map': {
    id: 'offline-map',
    title: '离线地图',
    description: '演示离线城市列表、下载、暂停、取消和存储信息。',
    outcome: '进入离线地图管理页',
    component: OfflineMapExample,
  },
  'address-picker-web': {
    id: 'address-picker-web',
    title: '地址选择器（Web API）',
    description: '通过输入提示和地理编码完成地址选择，并联动地图定位。',
    outcome: '进入 Web API 地址选点页',
    component: AddressPickerWebAPIExample,
  },
  'address-picker-native': {
    id: 'address-picker-native',
    title: '地址选择器（Native Search）',
    description: '使用 search 模块的 getInputTips/searchPOI 完成地址选择。',
    outcome: '进入原生搜索地址选点页',
    component: AddressPickerNativeExample,
  },
  'taxi-location-picker': {
    id: 'taxi-location-picker',
    title: '打车上车点选择',
    description: '地图中心固定大头针 + 周边 POI 列表，模拟打车选点流程。',
    outcome: '进入打车选点页',
    component: TaxiLocationPickerExample,
  },
  'web-api-basic': {
    id: 'web-api-basic',
    title: 'Web API 基础',
    description: '演示地理编码、逆地理编码和 Web API 初始化。',
    outcome: '进入 Web API 基础页',
    component: WebAPIExample,
  },
  'web-api-advanced': {
    id: 'web-api-advanced',
    title: 'Web API 高级',
    description: '演示更完整的 Web API 测试入口与高级能力。',
    outcome: '进入 Web API 高级页',
    component: WebAPIAdvancedTest,
  },
  'search-module': {
    id: 'search-module',
    title: '搜索模块',
    description: '演示搜索模块调用、结果查看和调试日志。',
    outcome: '进入搜索模块调试页',
    component: SearchModuleTest,
  },
  'input-tips-web': {
    id: 'input-tips-web',
    title: '输入提示（Web API）',
    description: '集中验证 getTips/getPOITips/getBusTips 等输入提示能力。',
    outcome: '进入输入提示测试页',
    component: InputTipsExample,
  },
  'poi-search-native': {
    id: 'poi-search-native',
    title: 'POI 搜索（Native）',
    description: '使用 search 模块执行关键字、周边、类型、输入提示四类搜索。',
    outcome: '进入原生 POI 搜索页',
    component: POISearchNativeExample,
  },
  'poi-search-map-native': {
    id: 'poi-search-map-native',
    title: 'POI 地图标记（Native）',
    description: '将 search 模块结果直接投放到地图 Marker 上进行验证。',
    outcome: '进入原生搜索地图联动页',
    component: POISearchMapNativeExample,
  },
  'poi-search-map-web': {
    id: 'poi-search-map-web',
    title: 'POI 地图标记（Web API）',
    description: '将 Web API 的 POI 结果投放到地图并校验周边搜索中心点。',
    outcome: '进入 Web API 搜索地图联动页',
    component: POIMapSearchWebAPIExample,
  },
  'delivery-route': {
    id: 'delivery-route',
    title: '配送路线面板',
    description: '模拟骑手取货与配送的双段骑行路线及状态面板。',
    outcome: '进入配送路线演示页',
    component: DeliveryRouteExample,
  },
  'mayday-five-day-trip': {
    id: 'mayday-five-day-trip',
    title: '五一五日游（旅游 App）',
    description: '完整旅游场景模板：分日行程、地图线路、自定义 Marker 与产品化底部面板。',
    outcome: '进入五一五日游可视化模板页',
    component: MayDayFiveDayTripExample,
    immersive: true,
  },
  'delivery-address-picker': {
    id: 'delivery-address-picker',
    title: '外卖地址选择器',
    description: '地图拖拽选点 + 输入联想 + 周边 POI，模拟外卖收货地址选择。',
    outcome: '进入外卖地址选择页',
    component: DeliveryAddressPickerExample,
  },
  'dispatch-workbench': {
    id: 'dispatch-workbench',
    title: '调度工作台',
    description: '订单池、服务区、动态路线规划与骑手轨迹模拟的综合调度示例。',
    outcome: '进入调度工作台页',
    component: DispatchWorkbenchExample,
  },
  'dynamic-route-tracking': {
    id: 'dynamic-route-tracking',
    title: '动态路线跟踪',
    description: '地址输入后动态规划路线，展示行程阶段和骑手进度。',
    outcome: '进入动态路线跟踪页',
    component: DynamicRouteTrackingExample,
  },
  'enterprise-check-in': {
    id: 'enterprise-check-in',
    title: '企业打卡场景',
    description: '展示打卡范围、当前定位、通勤路线与打卡状态。',
    outcome: '进入企业打卡页',
    component: EnterpriseCheckInExample,
  },
  'industry-scene': {
    id: 'industry-scene',
    title: '行业场景综合',
    description: '展示区域 Polygon、站点 Marker 与配送路径的组合场景。',
    outcome: '进入行业场景综合页',
    component: IndustrySceneExample,
  },
  'platform-optimization': {
    id: 'platform-optimization',
    title: '平台优化',
    description: '演示折叠屏、平板等平台适配相关能力。',
    outcome: '进入平台适配验证页',
    component: PlatformOptimizationDemo,
  },
  'legacy-playground': {
    id: 'legacy-playground',
    title: '综合演示（旧版）',
    description: '保留原来的大而全调试页，适合回归验证和补充查阅。',
    outcome: '进入历史综合调试页',
    component: LegacyPlaygroundExample,
  },
};

export type ExampleId = keyof typeof EXAMPLE_REGISTRY;

export type ExampleSection = {
  key: string;
  title: string;
  description: string;
  entries: ExampleId[];
};

export const EXAMPLE_SECTIONS: ExampleSection[] = [
  {
    key: 'start',
    title: '起步与推荐路径',
    description: '先跑通初始化和核心链路，再进入更细分能力，减少排查成本。',
    entries: ['privacy-init', 'map-basics', 'overlay-playground', 'advanced-playground', 'route-playback'],
  },
  {
    key: 'map-location',
    title: '地图与定位',
    description: '聚焦地图实例控制、定位权限和离线能力，适合先确认基础稳定性。',
    entries: [
      'use-map',
      'map-debug',
      'permissions',
      'new-permissions',
      'lbs',
      'offline-map',
      'address-picker-web',
      'address-picker-native',
      'taxi-location-picker',
    ],
  },
  {
    key: 'overlay',
    title: '覆盖物与视觉渲染',
    description: '覆盖常见点线面与复杂 Marker 样式，适合验证渲染效果和交互行为。',
    entries: [
      'polyline',
      'smooth-move',
      'marker-image-cache',
      'marker-travel-card',
      'rental-map-label',
      'random-markers',
      'multi-format',
      'aoi-mask',
    ],
  },
  {
    key: 'web-api',
    title: 'Web API 与搜索',
    description: '偏向服务端接口调用和数据联调，不依赖地图渲染也可独立验证。',
    entries: [
      'web-api-basic',
      'web-api-advanced',
      'search-module',
      'input-tips-web',
      'poi-search-native',
      'poi-search-map-native',
      'poi-search-map-web',
    ],
  },
  {
    key: 'biz-scenarios',
    title: '业务场景',
    description: '偏业务化页面，验证多段路线、区域分区和任务面板等组合能力。',
    entries: [
      'mayday-five-day-trip',
      'delivery-route',
      'delivery-address-picker',
      'dispatch-workbench',
      'dynamic-route-tracking',
      'enterprise-check-in',
      'industry-scene',
    ],
  },
  {
    key: 'tooling',
    title: '工具与兼容',
    description: '用于几何能力校验、平台适配和性能调试。',
    entries: ['geometry-utils', 'platform-optimization'],
  },
  {
    key: 'legacy',
    title: '历史综合页',
    description: '保留旧版大而全页面，方便做回归对照。',
    entries: ['legacy-playground'],
  },
];
