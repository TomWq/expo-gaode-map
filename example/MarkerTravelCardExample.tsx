import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  
} from 'react-native';

import { MapUI, MapView, Marker, type CameraPosition } from 'expo-gaode-map';

type CacheMode = 'unique' | 'none' | 'shared';
type ImageMode = 'local' | 'remote';

type TravelCardMarker = {
  id: 'jiuzhaigou' | 'lijiang' | 'dali';
  city: string;
  title: string;
  days: string;
  distanceKm: number;
  position: {
    latitude: number;
    longitude: number;
  };
};

const SOUTHWEST_CAMERA: CameraPosition = {
  target: {
    latitude: 27.9,
    longitude: 103.7,
  },
  zoom: 5.8,
};

const LOCAL_CARD_IMAGES: Record<TravelCardMarker['id'], ImageSourcePropType> = {
  jiuzhaigou: require('./assets/start.png'),
  lijiang: require('./assets/end.png'),
  dali: require('./assets/car.png'),
} as const;

const REMOTE_CARD_IMAGES: Record<TravelCardMarker['id'], ImageSourcePropType> = {
  jiuzhaigou:
    { uri: 'https://n.sinaimg.cn/sinacn08/420/w1248h772/20181017/e350-hmhhnqs7575955.jpg' },
  lijiang:
    { uri: 'https://ts2.tc.mm.bing.net/th/id/OIP-C.A42DQVcp3tqnEl2oE8EtEQHaE8?rs=1&pid=ImgDetMain&o=7&rm=3' },
  dali:
    { uri: 'https://img1.qunarzz.com/travel/d5/1607/27/98b7198c0dc1e370.jpg_r_640x452x70_8c3bd345.jpg' },
} as const;

const CARD_MARKERS: TravelCardMarker[] = [
  {
    id: 'jiuzhaigou',
    city: '阿坝',
    title: '九寨沟景区 · 瀑布海子',
    days: '第1-2天',
    distanceKm: 75,
    position: {
      latitude: 33.252,
      longitude: 103.918,
    },
  },
  {
    id: 'lijiang',
    city: '丽江',
    title: '丽江古城 · 雪山观景',
    days: '第3-4天',
    distanceKm: 125,
    position: {
      latitude: 26.872,
      longitude: 100.238,
    },
  },
  {
    id: 'dali',
    city: '大理',
    title: '洱海环线 · 喜洲日落',
    days: '第5-8天',
    distanceKm: 155,
    position: {
      latitude: 25.607,
      longitude: 100.267,
    },
  },
];

const MODE_LABELS: Record<CacheMode, string> = {
  unique: '唯一 cacheKey',
  none: '不传 cacheKey',
  shared: '错误共享 cacheKey',
};

const MODE_HINTS: Record<CacheMode, string> = {
  unique: '推荐给业务方。每个卡片 Marker 使用稳定且唯一的 cacheKey。',
  none: '用于观察删掉 cacheKey 之后，图片显示是否恢复，以及 iOS 位置是否还稳定。',
  shared: '故意错误示例。多个 Marker 共用同一个 cacheKey，最容易引发串图或错缓存。',
};

function DistanceDot() {
  return <View style={styles.distanceDot} />;
}

export default function MarkerTravelCardExample() {
  const [cacheMode, setCacheMode] = React.useState<CacheMode>('unique');
  const [imageMode, setImageMode] = React.useState<ImageMode>('local');
  const [mountSeed, setMountSeed] = React.useState(0);
  const [shuffleOrder, setShuffleOrder] = React.useState(false);
  const [statusMap, setStatusMap] = React.useState<
    Record<string, 'idle' | 'loading' | 'loaded' | 'error'>
  >({});

  const markers = React.useMemo(
    () => (shuffleOrder ? [...CARD_MARKERS].reverse() : CARD_MARKERS),
    [shuffleOrder]
  );

  const resolveCacheKey = React.useCallback(
    (markerId: string) => {
      if (cacheMode === 'none') {
        return undefined;
      }

      if (cacheMode === 'shared') {
        return 'travel_card_shared_cache_key';
      }

      return `travel_card_${markerId}`;
    },
    [cacheMode]
  );

  const updateStatus = React.useCallback(
    (markerId: string, status: 'idle' | 'loading' | 'loaded' | 'error') => {
      setStatusMap((current) => {
        if (current[markerId] === status) {
          return current;
        }

        return {
          ...current,
          [markerId]: status,
        };
      });
    },
    []
  );

  return (
    <View style={styles.container}>
      <MapView
        key={`travel-card-map-${mountSeed}`}
        style={styles.map}
        initialCameraPosition={SOUTHWEST_CAMERA}
      >
        {markers.map((marker, index) => {
          const imageStatus = statusMap[marker.id] ?? 'idle';
          const rawCacheKey = resolveCacheKey(marker.id);
          const effectiveCacheKey = rawCacheKey
            ? `${rawCacheKey}|${imageMode}|${imageStatus}`
            : undefined;

          return (
            <Marker
              key={`${mountSeed}-${marker.id}-${imageStatus}`}
              position={marker.position}
              cacheKey={effectiveCacheKey}
              zIndex={30 - index}
            >
              <View style={styles.cardRoot}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>{marker.days}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Image
                    style={styles.cardImage}
                    resizeMode="cover"
                    source={
                      imageMode === 'local'
                        ? LOCAL_CARD_IMAGES[marker.id]
                        : REMOTE_CARD_IMAGES[marker.id]
                    }
                    onLoadStart={() => updateStatus(marker.id, 'loading')}
                    onLoad={() => updateStatus(marker.id, 'loaded')}
                    onError={() => updateStatus(marker.id, 'error')}
                  />
                  <View style={styles.cardContent}>
                    <Text numberOfLines={1} style={styles.cityText}>
                      {marker.city}
                    </Text>
                    <Text numberOfLines={1} style={styles.titleText}>
                      {marker.title}
                    </Text>
                    <View style={styles.distanceRow}>
                      <DistanceDot />
                      <Text style={styles.distanceText}>{marker.distanceKm}km</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Marker>
          );
        })}

        <MapUI>
          <View pointerEvents="box-none" style={styles.overlayRoot}>
            <View style={styles.topPanel}>
              <Text style={styles.panelEyebrow}>截图同款结构</Text>
              <Text style={styles.panelTitle}>景点卡片 Marker 复现</Text>
              <Text style={styles.panelDescription}>
                默认先用本地图片保证能看到卡片，再切到远程图片测试“不显示”问题。
              </Text>

              <View style={styles.modeRow}>
                {(['local', 'remote'] as ImageMode[]).map((mode) => {
                  const active = imageMode === mode;
                  return (
                    <Pressable
                      key={mode}
                      style={[styles.modeChip, active && styles.modeChipActive]}
                      onPress={() => {
                        setImageMode(mode);
                        setStatusMap({});
                        setMountSeed((value) => value + 1);
                      }}
                    >
                      <Text
                        style={[
                          styles.modeChipText,
                          active && styles.modeChipTextActive,
                        ]}
                      >
                        {mode === 'local' ? '本地图片' : '远程图片'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.bottomPanel}>
              <View style={styles.modeRow}>
                {(['unique', 'none', 'shared'] as CacheMode[]).map((mode) => {
                  const active = cacheMode === mode;
                  return (
                    <Pressable
                      key={mode}
                      style={[styles.modeChip, active && styles.modeChipActive]}
                      onPress={() => setCacheMode(mode)}
                    >
                      <Text
                        style={[
                          styles.modeChipText,
                          active && styles.modeChipTextActive,
                        ]}
                      >
                        {MODE_LABELS[mode]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.modeHint}>{MODE_HINTS[cacheMode]}</Text>

              <View style={styles.actionRow}>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => setMountSeed((value) => value + 1)}
                >
                  <Text style={styles.primaryButtonText}>重新挂载卡片</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setShuffleOrder((value) => !value)}
                >
                  <Text style={styles.secondaryButtonText}>
                    {shuffleOrder ? '恢复原顺序' : '倒序渲染'}
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusRow}
              >
                {CARD_MARKERS.map((marker) => (
                  <View key={marker.id} style={styles.statusCard}>
                    <Text style={styles.statusTitle}>{marker.city}</Text>
                    <Text style={styles.statusText}>
                      图：{statusMap[marker.id] ?? 'idle'}
                    </Text>
                    <Text style={styles.statusText}>
                      key：{resolveCacheKey(marker.id) ?? 'undefined'}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <Text style={styles.tipText}>
                复现建议：先用“本地图片”确认卡片结构没问题，再切“远程图片”观察是否出现空图。
              </Text>
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
    backgroundColor: '#eef2ff',
  },
  map: {
    flex: 1,
  },
  overlayRoot: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  topPanel: {
    alignSelf: 'stretch',
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  bottomPanel: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  panelEyebrow: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  panelTitle: {
    marginTop: 6,
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  panelDescription: {
    marginTop: 8,
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#e2e8f0',
  },
  modeChipActive: {
    backgroundColor: '#2563eb',
  },
  modeChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  modeChipTextActive: {
    color: '#ffffff',
  },
  modeHint: {
    marginTop: 8,
    color: '#1d4ed8',
    fontSize: 12,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  statusRow: {
    gap: 10,
    marginTop: 10,
    paddingRight: 8,
  },
  statusCard: {
    width: 146,
    borderRadius: 14,
    padding: 10,
    backgroundColor: '#f8fafc',
  },
  statusTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  statusText: {
    marginTop: 6,
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
  },
  tipText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
  },
  cardRoot: {
    width: 186,
  },
  dayBadge: {
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: -6,
    zIndex: 2,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#4ade80',
  },
  dayBadgeText: {
    color: '#14532d',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardImage: {
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
  },
  cardContent: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  cityText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  titleText: {
    marginTop: 3,
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  distanceDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  distanceText: {
    marginLeft: 6,
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
});
