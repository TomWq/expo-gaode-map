import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MapUI, MapView, Marker, type CameraPosition } from 'expo-gaode-map-navigation';

import { BEIJING_CENTER } from './playgroundUtils';

type CacheMode = 'unique' | 'none' | 'shared';

type DemoMarker = {
  id: 'A' | 'B' | 'C';
  title: string;
  subtitle: string;
  imageUri: string;
  position: {
    latitude: number;
    longitude: number;
  };
};

const MARKERS: DemoMarker[] = [
  {
    id: 'A',
    title: 'Marker A',
    subtitle: '左上角点位',
    imageUri:
      'https://raw.githubusercontent.com/github/explore/main/topics/react/react.png',
    position: {
      latitude: BEIJING_CENTER.latitude + 0.008,
      longitude: BEIJING_CENTER.longitude - 0.01,
    },
  },
  {
    id: 'B',
    title: 'Marker B',
    subtitle: '中心点位',
    imageUri:
      'https://raw.githubusercontent.com/github/explore/main/topics/typescript/typescript.png',
    position: {
      latitude: BEIJING_CENTER.latitude,
      longitude: BEIJING_CENTER.longitude,
    },
  },
  {
    id: 'C',
    title: 'Marker C',
    subtitle: '右下角点位',
    imageUri:
      'https://raw.githubusercontent.com/github/explore/main/topics/javascript/javascript.png',
    position: {
      latitude: BEIJING_CENTER.latitude - 0.008,
      longitude: BEIJING_CENTER.longitude + 0.01,
    },
  },
];

const MODE_LABELS: Record<CacheMode, string> = {
  unique: '唯一 cacheKey',
  none: '不传 cacheKey',
  shared: '共享同一个 cacheKey',
};

const MODE_DESCRIPTIONS: Record<CacheMode, string> = {
  unique: '推荐模式。每个 Marker 都有稳定且唯一的 cacheKey。',
  none: '用于观察不传 cacheKey 时，iOS/Android 的实际表现。',
  shared: '故意错误示例。多个 Marker 共用同一个 cacheKey，最容易触发串图或缓存错配。',
};

export default function MarkerImageCacheExample() {
  const [cacheMode, setCacheMode] = React.useState<CacheMode>('unique');
  const [mountSeed, setMountSeed] = React.useState(0);
  const [reverseOrder, setReverseOrder] = React.useState(false);
  const [imageStatusMap, setImageStatusMap] = React.useState<
    Record<string, 'idle' | 'loading' | 'loaded' | 'error'>
  >({});

  const initialCamera = React.useMemo<CameraPosition>(
    () => ({
      target: BEIJING_CENTER,
      zoom: 12.8,
    }),
    []
  );

  const orderedMarkers = React.useMemo(
    () => (reverseOrder ? [...MARKERS].reverse() : MARKERS),
    [reverseOrder]
  );

  const getCacheKey = React.useCallback(
    (id: string) => {
      if (cacheMode === 'none') {
        return undefined;
      }

      if (cacheMode === 'shared') {
        return 'marker_image_cache_shared';
      }

      return `marker_image_cache_${id}`;
    },
    [cacheMode]
  );

  const setStatus = React.useCallback(
    (id: string, status: 'idle' | 'loading' | 'loaded' | 'error') => {
      setImageStatusMap((current) => {
        if (current[id] === status) {
          return current;
        }

        return {
          ...current,
          [id]: status,
        };
      });
    },
    []
  );

  return (
    <View style={styles.container}>
      <MapView
        key={`marker-image-cache-map-${mountSeed}`}
        style={styles.map}
        initialCameraPosition={initialCamera}
      >
        {orderedMarkers.map((marker) => (
          <Marker
            key={`${mountSeed}-${marker.id}`}
            position={marker.position}
            cacheKey={getCacheKey(marker.id)}
          >
            <View style={styles.markerCard}>
              <Image
                style={styles.markerImage}
                resizeMode="cover"
                source={{ uri: marker.imageUri }}
                onLoadStart={() => setStatus(marker.id, 'loading')}
                onLoad={() => setStatus(marker.id, 'loaded')}
                onError={() => setStatus(marker.id, 'error')}
              />
              <View style={styles.markerTextWrap}>
                <Text style={styles.markerBadge}>{marker.id}</Text>
                <Text style={styles.markerTitle}>{marker.title}</Text>
                <Text style={styles.markerSubtitle}>{marker.subtitle}</Text>
              </View>
            </View>
          </Marker>
        ))}

        <MapUI>
          <View pointerEvents="box-none" style={styles.overlayRoot}>
            <View style={styles.panel}>
              <Text style={styles.panelEyebrow}>Marker children + 远程图片</Text>
              <Text style={styles.panelTitle}>图片缓存复现页</Text>
              <Text style={styles.panelDescription}>
                这一页专门用来观察 `Marker` 里包 `Image` 时，不同 `cacheKey`
                策略在真机上的表现。建议重点看 Android 的空图问题，以及 iOS 的位置是否稳定。
              </Text>

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

              <Text style={styles.modeHint}>{MODE_DESCRIPTIONS[cacheMode]}</Text>

              <View style={styles.actionRow}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => setMountSeed((value) => value + 1)}
                >
                  <Text style={styles.actionButtonText}>重新挂载 Marker</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setReverseOrder((value) => !value)}
                >
                  <Text style={styles.secondaryButtonText}>
                    {reverseOrder ? '恢复顺序' : '倒序渲染'}
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusRow}
              >
                {MARKERS.map((marker) => (
                  <View key={marker.id} style={styles.statusCard}>
                    <Text style={styles.statusTitle}>{marker.title}</Text>
                    <Text style={styles.statusValue}>
                      图片状态：{imageStatusMap[marker.id] ?? 'idle'}
                    </Text>
                    <Text style={styles.statusValue}>
                      cacheKey：{getCacheKey(marker.id) ?? 'undefined'}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <Text style={styles.tipText}>
                观察建议：先看 `唯一 cacheKey` 是否稳定，再切到 `不传 cacheKey`
                连点“重新挂载 Marker”，最后切到 `共享同一个 cacheKey` 看是否出现串图。
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
    backgroundColor: '#0f172a',
  },
  map: {
    flex: 1,
  },
  overlayRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  panel: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
  },
  panelEyebrow: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  panelTitle: {
    marginTop: 8,
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
  },
  panelDescription: {
    marginTop: 10,
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modeChipActive: {
    backgroundColor: '#38bdf8',
  },
  modeChipText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  modeChipTextActive: {
    color: '#082f49',
  },
  modeHint: {
    marginTop: 10,
    color: '#93c5fd',
    fontSize: 12,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  statusRow: {
    gap: 10,
    marginTop: 14,
    paddingRight: 8,
  },
  statusCard: {
    width: 188,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statusTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  statusValue: {
    marginTop: 6,
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
  },
  tipText: {
    marginTop: 14,
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  markerCard: {
    width: 116,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  markerImage: {
    width: 116,
    height: 74,
    backgroundColor: '#1e293b',
  },
  markerTextWrap: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  markerBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '800',
  },
  markerTitle: {
    marginTop: 8,
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  markerSubtitle: {
    marginTop: 4,
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
  },
});
