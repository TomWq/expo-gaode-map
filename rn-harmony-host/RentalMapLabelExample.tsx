import React from 'react';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  MapUI,
  MapView,
  Marker,
  type CameraPosition,
  type MapViewRef,
} from 'expo-gaode-map';

import { BEIJING_CENTER } from './playgroundUtils';

type LayerType = 'district' | 'subArea' | 'community';

type AggregatePoint = {
  id: string;
  name: string;
  priceFrom: number;
  supplyLabel?: string;
  position: {
    latitude: number;
    longitude: number;
  };
};

type CommunityPoint = {
  id: string;
  title: string;
  priceFrom: number;
  units: number;
  position: {
    latitude: number;
    longitude: number;
  };
};

const FILTER_TABS = ['位置', '户型', '租金', '租期'] as const;
const MIN_ZOOM = 9;
const MAX_ZOOM = 18;
const LAYER2_ZOOM = 11.6;
const LAYER3_ZOOM = 13.7;
const LAYER_HYSTERESIS = 0.18;

const INITIAL_CAMERA: CameraPosition = {
  target: BEIJING_CENTER,
  zoom: 10.8,
};

const DISTRICT_POINTS: AggregatePoint[] = [
  { id: 'd-haidian', name: '海淀', priceFrom: 1458, position: { latitude: 39.968, longitude: 116.315 } },
  { id: 'd-chaoyang', name: '朝阳', priceFrom: 1330, position: { latitude: 39.928, longitude: 116.484 } },
  { id: 'd-xicheng', name: '西城', priceFrom: 1690, position: { latitude: 39.911, longitude: 116.357 } },
  { id: 'd-fengtai', name: '丰台', priceFrom: 888, position: { latitude: 39.862, longitude: 116.386 } },
  { id: 'd-daxing', name: '大兴', priceFrom: 1096, position: { latitude: 39.79, longitude: 116.382 } },
  { id: 'd-yizhuang', name: '亦庄', priceFrom: 1560, position: { latitude: 39.815, longitude: 116.525 } },
];

const SUBAREA_POINTS: AggregatePoint[] = [
  { id: 's-qilizhuang', name: '七里庄', priceFrom: 888, supplyLabel: '100+套', position: { latitude: 39.905, longitude: 116.325 } },
  { id: 's-xiju', name: '西局', priceFrom: 1690, supplyLabel: '100+套', position: { latitude: 39.899, longitude: 116.369 } },
  { id: 's-lize', name: '丽泽', priceFrom: 888, supplyLabel: '100+套', position: { latitude: 39.906, longitude: 116.415 } },
  { id: 's-fengtai-east', name: '丰台东大街', priceFrom: 1590, supplyLabel: '100+套', position: { latitude: 39.855, longitude: 116.334 } },
  { id: 's-kandanqiao', name: '看丹桥', priceFrom: 1590, supplyLabel: '100+套', position: { latitude: 39.813, longitude: 116.315 } },
  { id: 's-keyilu', name: '科怡路', priceFrom: 1590, supplyLabel: '100+套', position: { latitude: 39.769, longitude: 116.399 } },
  { id: 's-tech-park', name: '科技园', priceFrom: 1590, supplyLabel: '100+套', position: { latitude: 39.728, longitude: 116.398 } },
  { id: 's-hq-base', name: '总部基地', priceFrom: 1678, supplyLabel: '100+套', position: { latitude: 39.726, longitude: 116.339 } },
  { id: 's-nanlishilu', name: '南礼士路', priceFrom: 7290, supplyLabel: '100+套', position: { latitude: 39.915, longitude: 116.352 } },
  { id: 's-zhenwumiao', name: '真武庙', priceFrom: 2950, supplyLabel: '100+套', position: { latitude: 39.894, longitude: 116.357 } },
];

const COMMUNITY_POINTS: CommunityPoint[] = [
  { id: 'c-1', title: '汇龙阁', priceFrom: 2890, units: 7, position: { latitude: 39.9065, longitude: 116.3683 } },
  { id: 'c-2', title: '西便门 6 号楼', priceFrom: 2590, units: 4, position: { latitude: 39.9011, longitude: 116.3536 } },
  { id: 'c-3', title: '中华大厦', priceFrom: 2650, units: 1, position: { latitude: 39.9127, longitude: 116.3942 } },
  { id: 'c-4', title: '真武庙二条', priceFrom: 2950, units: 4, position: { latitude: 39.8935, longitude: 116.3566 } },
  { id: 'c-5', title: '丽泽花园', priceFrom: 888, units: 2, position: { latitude: 39.9058, longitude: 116.4135 } },
  { id: 'c-6', title: '北滨河路 8 号', priceFrom: 11690, units: 2, position: { latitude: 39.8782, longitude: 116.3561 } },
  { id: 'c-7', title: '看丹东里', priceFrom: 1590, units: 6, position: { latitude: 39.8126, longitude: 116.3142 } },
  { id: 'c-8', title: '总部基地十二区', priceFrom: 1678, units: 3, position: { latitude: 39.7256, longitude: 116.3388 } },
  { id: 'c-9', title: '科技园公寓', priceFrom: 1590, units: 5, position: { latitude: 39.7278, longitude: 116.3981 } },
];

function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

function resolveLayer(zoom: number): LayerType {
  if (zoom >= LAYER3_ZOOM) return 'community';
  if (zoom >= LAYER2_ZOOM) return 'subArea';
  return 'district';
}

function resolveLayerWithHysteresis(current: LayerType, zoom: number): LayerType {
  if (current === 'district') {
    return zoom >= LAYER2_ZOOM + LAYER_HYSTERESIS ? 'subArea' : 'district';
  }
  if (current === 'subArea') {
    if (zoom < LAYER2_ZOOM - LAYER_HYSTERESIS) return 'district';
    if (zoom >= LAYER3_ZOOM + LAYER_HYSTERESIS) return 'community';
    return 'subArea';
  }
  return zoom < LAYER3_ZOOM - LAYER_HYSTERESIS ? 'subArea' : 'community';
}

function CircleBadge({
  point,
  size,
}: {
  point: AggregatePoint;
  size: number;
}) {
  return (
    <View
      style={[
        styles.circleBadge,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.circleTitle, size >= 82 ? styles.circleTitleLarge : null]}>
        {point.name}
      </Text>
      <Text style={[styles.circlePrice, size >= 82 ? styles.circlePriceLarge : null]}>
        ¥{point.priceFrom}起
      </Text>
      {point.supplyLabel ? (
        <Text style={styles.circleSupply}>{point.supplyLabel}</Text>
      ) : null}
    </View>
  );
}

function CommunityTag({
  point,
}: {
  point: CommunityPoint;
}) {
  return (
    <View style={styles.communityTag}>
      <Text style={styles.communityTagText} numberOfLines={1}>
        {point.title} · ¥{point.priceFrom}起 ({point.units}套)
      </Text>
    </View>
  );
}

export default function RentalMapLabelExample() {
  const mapRef = React.useRef<MapViewRef>(null);
  const [zoom, setZoom] = React.useState(INITIAL_CAMERA.zoom ?? 10.8);
  const [layer, setLayer] = React.useState<LayerType>(resolveLayer(INITIAL_CAMERA.zoom ?? 10.8));
  const [activeFilter, setActiveFilter] =
    React.useState<(typeof FILTER_TABS)[number]>('位置');

  const topInset =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 12;

  const layerLabel = React.useMemo(() => {
    if (layer === 'district') return '一级：行政区聚合';
    if (layer === 'subArea') return '二级：小区域聚合';
    return '三级：小区明细';
  }, [layer]);

  const handleZoom = React.useCallback(
    async (delta: number) => {
      const current = await mapRef.current?.getCameraPosition();
      if (!current) return;
      const nextZoom = clampZoom((current.zoom ?? zoom) + delta);
      setZoom(nextZoom);
      await mapRef.current?.moveCamera({ ...current, zoom: nextZoom }, 220);
    },
    [zoom]
  );

  const handleLocateCenter = React.useCallback(async () => {
    await mapRef.current?.moveCamera(
      {
        target: BEIJING_CENTER,
        zoom: 13.0,
        bearing: 0,
        tilt: 0,
      },
      280
    );
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialCameraPosition={INITIAL_CAMERA}
        onCameraMove={({ nativeEvent }) => {
          const nextZoom = nativeEvent.cameraPosition.zoom;
          if (typeof nextZoom === 'number') {
            setZoom(nextZoom);
          }
        }}
        onCameraIdle={({ nativeEvent }) => {
          const stableZoom = nativeEvent.cameraPosition.zoom;
          if (typeof stableZoom === 'number') {
            setLayer((current) => resolveLayerWithHysteresis(current, stableZoom));
          }
        }}
      >
        {layer === 'district'
          ? DISTRICT_POINTS.map((point) => (
              <Marker
                key={`district_${point.id}`}
                position={point.position}
                anchor={{ x: 0.5, y: 0.5 }}
                cacheKey={`district_badge_${point.id}`}
                zIndex={40}
              >
                <CircleBadge point={point} size={78} />
              </Marker>
            ))
          : null}

        {layer === 'subArea'
          ? SUBAREA_POINTS.map((point) => (
              <Marker
                key={`sub_${point.id}`}
                position={point.position}
                anchor={{ x: 0.5, y: 0.5 }}
                cacheKey={`sub_badge_${point.id}`}
                zIndex={48}
              >
                <CircleBadge point={point} size={86} />
              </Marker>
            ))
          : null}

        {layer === 'community'
          ? COMMUNITY_POINTS.map((point) => (
              <Marker
                key={`community_${point.id}`}
                position={point.position}
                anchor={{ x: 0.5, y: 0.5 }}
                cacheKey={`community_tag_${point.id}`}
                zIndex={56}
              >
                <CommunityTag point={point} />
              </Marker>
            ))
          : null}

        <MapUI>
          <View pointerEvents="box-none" style={[styles.overlayRoot, { paddingTop: topInset }]}>
            <View pointerEvents="box-none" style={styles.topArea}>
              <View style={styles.searchRow}>
                <Pressable style={styles.backButton}>
                  <Text style={styles.backButtonText}>{'<'}</Text>
                </Pressable>
                <View style={styles.searchInput}>
                  <Text numberOfLines={1} style={styles.searchInputText}>
                    小区/地铁/商圈/公司附近
                  </Text>
                </View>
                <Pressable style={styles.headActionButton}>
                  <Text style={styles.headActionText}>入住日期 v</Text>
                </Pressable>
              </View>

              <View style={styles.filterRow}>
                {FILTER_TABS.map((tab) => {
                  const active = tab === activeFilter;
                  return (
                    <Pressable
                      key={tab}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setActiveFilter(tab)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {tab} v
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View pointerEvents="box-none" style={styles.rightArea}>
              <View style={styles.toolPanel}>
                <Pressable style={styles.toolButton}>
                  <Text style={styles.toolButtonIcon}>O</Text>
                  <Text style={styles.toolButtonText}>画圈</Text>
                </Pressable>
                <Pressable style={styles.toolButton}>
                  <Text style={styles.toolButtonIcon}>S</Text>
                  <Text style={styles.toolButtonText}>收藏</Text>
                </Pressable>
                <Pressable style={styles.toolButton}>
                  <Text style={styles.toolButtonIcon}>F</Text>
                  <Text style={styles.toolButtonText}>反馈</Text>
                </Pressable>
              </View>

              <View style={styles.zoomPanel}>
                <Pressable style={styles.zoomButton} onPress={handleLocateCenter}>
                  <Text style={styles.zoomButtonText}>定位</Text>
                </Pressable>
                <Pressable style={styles.zoomButton} onPress={() => void handleZoom(1)}>
                  <Text style={styles.zoomButtonText}>+</Text>
                </Pressable>
                <Pressable style={styles.zoomButton} onPress={() => void handleZoom(-1)}>
                  <Text style={styles.zoomButtonText}>-</Text>
                </Pressable>
              </View>
            </View>

            <View pointerEvents="box-none" style={styles.bottomArea}>
              <View style={styles.modeHintCard}>
                <Text style={styles.modeHintTitle}>{layerLabel}</Text>
                <Text style={styles.modeHintMeta}>
                  缩放 {zoom.toFixed(1)} · L1 &lt; {LAYER2_ZOOM} · L2 {LAYER2_ZOOM}-{LAYER3_ZOOM} · L3 ≥ {LAYER3_ZOOM}
                </Text>
              </View>
            </View>
          </View>
        </MapUI>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f7',
  },
  map: {
    flex: 1,
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 10,
  },
  topArea: {
    alignItems: 'stretch',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    paddingHorizontal: 6,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  backButtonText: {
    fontSize: 18,
    color: '#222',
    fontWeight: '700',
  },
  searchInput: {
    flex: 1,
    marginRight: 6,
  },
  searchInputText: {
    fontSize: 14,
    color: '#c7c7c7',
  },
  headActionButton: {
    paddingHorizontal: 8,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#ececec',
  },
  headActionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  filterRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  filterChip: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  filterChipActive: {
    backgroundColor: '#f0f6ff',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6f6f6f',
  },
  filterChipTextActive: {
    color: '#246bdb',
    fontWeight: '600',
  },
  rightArea: {
    position: 'absolute',
    right: 8,
    top: 172,
    alignItems: 'flex-end',
  },
  toolPanel: {
    width: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: '#e9e9e9',
    overflow: 'hidden',
  },
  toolButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  toolButtonIcon: {
    fontSize: 14,
    color: '#4a4a4a',
    lineHeight: 16,
  },
  toolButtonText: {
    marginTop: 2,
    fontSize: 11,
    color: '#4d4d4d',
  },
  zoomPanel: {
    marginTop: 8,
    width: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: '#e9e9e9',
    overflow: 'hidden',
  },
  zoomButton: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  zoomButtonText: {
    fontSize: 15,
    color: '#3a3a3a',
    fontWeight: '600',
  },
  bottomArea: {
    position: 'absolute',
    left: 10,
    right: 66,
    bottom: 16,
  },
  modeHintCard: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: '#ececec',
  },
  modeHintTitle: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '700',
  },
  modeHintMeta: {
    marginTop: 3,
    fontSize: 12,
    color: '#6b7280',
  },
  circleBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74425',
    borderWidth: 0.6,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#7f1d1d',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  circleTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  circleTitleLarge: {
    fontSize: 15,
    lineHeight: 18,
  },
  circlePrice: {
    marginTop: 2,
    color: '#fff7ed',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  circlePriceLarge: {
    fontSize: 15,
    lineHeight: 18,
  },
  circleSupply: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.96)',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
  communityTag: {
    minWidth: 140,
    maxWidth: 240,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c93f27',
    borderWidth: 1,
    borderColor: '#d75742',
    shadowColor: '#7f1d1d',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  communityTagText: {
    fontSize: 14,
    color: '#fff6eb',
    fontWeight: '700',
  },
});
