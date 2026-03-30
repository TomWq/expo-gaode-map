import React from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AOIOverlayExample from './AOIOverlayExample';
import AdvancedOverlayExample from './AdvancedOverlayExample';
import LegacyPlaygroundExample from './App';
import ExampleRuntimeGate from './ExampleRuntimeGate';
import GeometryUtilsExample from './GeometryUtilsExample';
import LBSDemo from './LBSDemo';
import MapBasicsExample from './MapBasicsExample';
import MapDebugExample from './MapDebugExample';
import MarkerImageCacheExample from './MarkerImageCacheExample';
import MultiFormatExample from './MultiFormatExample';
import OfflineMapExample from './OfflineMapExample';
import OverlayPlaygroundExample from './OverlayPlaygroundExample';
import PermissionExample from './PermissionExample';
import PlatformOptimizationDemo from './PlatformOptimizationDemo';
import PolylineExample from './PolylineExample';
import PrivacyInitializationExample from './PrivacyInitializationExample';
import RandomMarkersExample from './RandomMarkersExample';
import SearchModuleTest from './SearchModuleTest';
import SmoothMoveExample from './SmoothMoveExample';
import TestNewPermissionMethods from './TestNewPermissionMethods';
import UseMapExample from './UseMapExample';
import WebAPIAdvancedTest from './WebAPIAdvancedTest';
import WebAPIExample from './WebAPIExample';
import NavigationWithLocationExample from './navigationWithLocation';

type ExampleCategory =
  | 'featured'
  | 'map'
  | 'overlay'
  | 'location'
  | 'web-api'
  | 'tooling'
  | 'legacy';

type ExampleDefinition = {
  id: string;
  title: string;
  description: string;
  category: ExampleCategory;
  component: React.ComponentType;
  requiresRuntimeGate?: boolean;
};

/**
 * 示例目录。
 * 目标是把散落的 example 页面统一收口成一个可浏览入口，
 * 便于快速找到某个 API 对应的真实用法。
 */
const EXAMPLES: ExampleDefinition[] = [
  {
    id: 'privacy-init',
    title: '隐私与初始化',
    description: '单独演示 setPrivacyConfig、initSDK 和定位权限请求的推荐启动顺序。',
    category: 'featured',
    component: PrivacyInitializationExample,
    requiresRuntimeGate: false,
  },
  {
    id: 'map-basics',
    title: '地图基础能力',
    description: '聚合查看 MapView、相机事件、定位按钮和连续定位的标准写法。',
    category: 'featured',
    component: MapBasicsExample,
  },
  {
    id: 'overlay-playground',
    title: '基础覆盖物 Playground',
    description: '集中查看 Circle、Marker、Polyline、Polygon 以及 fitToCoordinates。',
    category: 'featured',
    component: OverlayPlaygroundExample,
  },
  {
    id: 'advanced-playground',
    title: '高级覆盖物 Playground',
    description: '集中查看 HeatMap、MultiPoint、Cluster、AreaMaskOverlay 和截图能力。',
    category: 'featured',
    component: AdvancedOverlayExample,
  },
  {
    id: 'route-playback',
    title: '路线回放（core）',
    description: '演示 core 侧 RouteOverlay、fitToCoordinates 和 useRoutePlayback 的标准组合。',
    category: 'map',
    component: NavigationWithLocationExample,
  },
  {
    id: 'use-map',
    title: 'useMap Hook',
    description: '演示如何在 MapView 子树里直接获取地图实例并控制相机。',
    category: 'map',
    component: UseMapExample,
  },
  {
    id: 'map-debug',
    title: '地图调试事件',
    description: '演示相机事件计数、原生节流切换和 POI 点击验证。',
    category: 'map',
    component: MapDebugExample,
  },
  {
    id: 'polyline',
    title: '折线与轨迹',
    description: '演示折线绘制、路径展示和轨迹点组织方式。',
    category: 'overlay',
    component: PolylineExample,
  },
  {
    id: 'smooth-move',
    title: 'Marker 平滑移动',
    description: '演示 smoothMovePath 和 smoothMoveDuration 的使用方式。',
    category: 'overlay',
    component: SmoothMoveExample,
  },
  {
    id: 'marker-image-cache',
    title: 'Marker 图片缓存复现',
    description: '对比唯一 cacheKey、不传 cacheKey、共享 cacheKey 三种 children + Image 场景。',
    category: 'overlay',
    component: MarkerImageCacheExample,
  },
  {
    id: 'random-markers',
    title: '随机标记点',
    description: '演示批量 Marker 的渲染、更新和地图交互。',
    category: 'overlay',
    component: RandomMarkersExample,
  },
  {
    id: 'multi-format',
    title: '多格式坐标',
    description: '演示对象坐标、数组坐标和 GeoJSON 风格坐标的兼容输入。',
    category: 'overlay',
    component: MultiFormatExample,
  },
  {
    id: 'aoi-mask',
    title: 'AOI 区域遮罩',
    description: '演示 AreaMaskOverlay 与多环边界输入，适合区域高亮场景。',
    category: 'overlay',
    component: AOIOverlayExample,
  },
  {
    id: 'geometry-utils',
    title: '几何计算',
    description: '演示距离、抽稀、最近点、路径长度等原生几何能力。',
    category: 'tooling',
    component: GeometryUtilsExample,
  },
  {
    id: 'permissions',
    title: '权限基础示例',
    description: '演示定位权限检查、请求和常见权限流程。',
    category: 'location',
    component: PermissionExample,
  },
  {
    id: 'new-permissions',
    title: '新权限接口',
    description: '演示增强权限接口与后台定位相关能力。',
    category: 'location',
    component: TestNewPermissionMethods,
  },
  {
    id: 'lbs',
    title: 'LBS 综合能力',
    description: '演示定位、逆地理编码和地图联动的典型 LBS 用法。',
    category: 'location',
    component: LBSDemo,
  },
  {
    id: 'offline-map',
    title: '离线地图',
    description: '演示离线城市列表、下载、暂停、取消和存储信息。',
    category: 'location',
    component: OfflineMapExample,
  },
  {
    id: 'web-api-basic',
    title: 'Web API 基础',
    description: '演示地理编码、逆地理编码和 Web API 初始化。',
    category: 'web-api',
    component: WebAPIExample,
  },
  {
    id: 'web-api-advanced',
    title: 'Web API 高级',
    description: '演示更完整的 Web API 测试入口与高级能力。',
    category: 'web-api',
    component: WebAPIAdvancedTest,
  },
  {
    id: 'search-module',
    title: '搜索模块',
    description: '演示搜索模块调用、结果查看和调试日志。',
    category: 'web-api',
    component: SearchModuleTest,
  },
  {
    id: 'platform-optimization',
    title: '平台优化',
    description: '演示折叠屏、平板等平台适配相关能力。',
    category: 'tooling',
    component: PlatformOptimizationDemo,
  },
  {
    id: 'legacy-playground',
    title: '综合演示（旧版）',
    description: '保留原来的大而全调试页，适合回归验证和补充查阅。',
    category: 'legacy',
    component: LegacyPlaygroundExample,
  },
];

const CATEGORY_LABELS: Record<ExampleCategory, string> = {
  featured: '推荐入口',
  map: '地图与相机',
  overlay: '覆盖物与区域',
  location: '定位与权限',
  'web-api': 'Web API / 搜索',
  tooling: '工具与性能',
  legacy: '历史综合页',
};

function ExamplePreview({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </Pressable>
  );
}

export default function ExampleHub() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selectedExample = React.useMemo(
    () => EXAMPLES.find((example) => example.id === selectedId) ?? null,
    [selectedId]
  );
  const SelectedComponent = selectedExample?.component;
  const needsRuntimeGate = selectedExample?.requiresRuntimeGate !== false;
  const ViewerContent = selectedExample ? (
    <View style={styles.viewerContainer}>
      {SelectedComponent ? <SelectedComponent /> : null}
      <SafeAreaView pointerEvents="box-none" style={styles.viewerOverlay}>
        <Pressable style={styles.backButton} onPress={() => setSelectedId(null)}>
          <Text style={styles.backButtonText}>返回目录</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  ) : null;

  if (selectedExample) {
    return needsRuntimeGate ? (
      <ExampleRuntimeGate>{ViewerContent}</ExampleRuntimeGate>
    ) : (
      ViewerContent
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>expo-gaode-map 示例中心</Text>
          <Text style={styles.subtitle}>
            这里把当前 example 工程里的主要示例按能力分类整理好了，优先把最常用的
            API 拆成独立入口，减少从大杂烩页面里翻代码的成本。
          </Text>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>关于 core / navigation 的边界</Text>
          <Text style={styles.noticeText}>
            `core` 和 `navigation` 里的地图保持两套实现，不合并原生 MapView。
            当前目录优先展示 `core + web-api` 这条链路；导航 SDK
            相关示例仍建议放在独立 navigation 工程里查看。
          </Text>
        </View>

        {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
          const items = EXAMPLES.filter((example) => example.category === category);
          if (!items.length) {
            return null;
          }

          return (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>{label}</Text>
              {items.map((example) => (
                <ExamplePreview
                  key={example.id}
                  title={example.title}
                  description={example.description}
                  onPress={() => setSelectedId(example.id)}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  hero: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: '#dbeafe',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },
  noticeCard: {
    marginTop: 18,
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe3ef',
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  noticeText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 21,
    color: '#475569',
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  card: {
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe3ef',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 14 : 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
