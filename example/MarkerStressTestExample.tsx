import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  MapUI,
  MapView,
  Marker,
  type CameraPosition,
} from 'expo-gaode-map';

const MARKER_COUNTS = [50, 100, 150, 200] as const;
const AUTO_RUN_ROUNDS = 20;
const AUTO_RUN_INTERVAL_MS = 500;
const GRID_COLUMNS = 20;
const CENTER = { latitude: 39.90923, longitude: 116.397428 };
const INITIAL_CAMERA: CameraPosition = { target: CENTER, zoom: 12.8 };

type MarkerCount = (typeof MARKER_COUNTS)[number];
type StyleVariant = 'a' | 'b';
type RunStatus = 'idle' | 'running' | 'stopped' | 'completed';

type StressMarker = {
  id: string;
  index: number;
  position: {
    latitude: number;
    longitude: number;
  };
};

function markerCacheKey(markerId: string, variant: StyleVariant) {
  return `marker-stress-${markerId}-${variant}`;
}

function generateStressMarkers(count: number): StressMarker[] {
  const rows = Math.ceil(count / GRID_COLUMNS);

  return Array.from({ length: count }, (_, index) => {
    const column = index % GRID_COLUMNS;
    const row = Math.floor(index / GRID_COLUMNS);

    return {
      id: `stress-${index}`,
      index,
      position: {
        latitude: CENTER.latitude + (row - (rows - 1) / 2) * 0.0015,
        longitude: CENTER.longitude + (column - (GRID_COLUMNS - 1) / 2) * 0.0018,
      },
    };
  });
}

const STATUS_LABELS: Record<RunStatus, string> = {
  idle: '空闲',
  running: '运行中',
  stopped: '已停止',
  completed: '已完成',
};

export default function MarkerStressTestExample() {
  const [selectedCount, setSelectedCount] = React.useState<MarkerCount>(100);
  const [mountedCount, setMountedCount] = React.useState(0);
  const [variant, setVariant] = React.useState<StyleVariant>('a');
  const [completedRounds, setCompletedRounds] = React.useState(0);
  const [lastCommitLatencyMs, setLastCommitLatencyMs] = React.useState(0);
  const [maxCommitLatencyMs, setMaxCommitLatencyMs] = React.useState(0);
  const [runStatus, setRunStatus] = React.useState<RunStatus>('idle');

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const runTokenRef = React.useRef(0);
  const frameIdsRef = React.useRef<Set<number>>(new Set());

  const markers = React.useMemo(
    () => generateStressMarkers(mountedCount),
    [mountedCount]
  );

  const cancelTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const haltAutoRun = React.useCallback(
    (nextStatus: RunStatus) => {
      runTokenRef.current += 1;
      cancelTimer();
      setRunStatus(nextStatus);
    },
    [cancelTimer]
  );

  const toggleVariant = React.useCallback(() => {
    const startedAt = performance.now();
    setVariant((current) => (current === 'a' ? 'b' : 'a'));

    const firstFrameId = requestAnimationFrame(() => {
      frameIdsRef.current.delete(firstFrameId);
      const secondFrameId = requestAnimationFrame(() => {
        frameIdsRef.current.delete(secondFrameId);
        const latency = performance.now() - startedAt;
        setLastCommitLatencyMs(latency);
        setMaxCommitLatencyMs((current) => Math.max(current, latency));
      });
      frameIdsRef.current.add(secondFrameId);
    });
    frameIdsRef.current.add(firstFrameId);
  }, []);

  const stopAutoRun = React.useCallback(() => {
    haltAutoRun('stopped');
  }, [haltAutoRun]);

  const startAutoRun = React.useCallback(() => {
    if (mountedCount === 0) {
      return;
    }

    cancelTimer();
    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    setCompletedRounds(0);
    setLastCommitLatencyMs(0);
    setMaxCommitLatencyMs(0);
    setRunStatus('running');

    const runRound = (round: number) => {
      if (runTokenRef.current !== token) {
        return;
      }

      toggleVariant();
      setCompletedRounds(round);

      if (round >= AUTO_RUN_ROUNDS) {
        timerRef.current = null;
        setRunStatus('completed');
        return;
      }

      timerRef.current = setTimeout(
        () => runRound(round + 1),
        AUTO_RUN_INTERVAL_MS
      );
    };

    timerRef.current = setTimeout(() => runRound(1), 250);
  }, [cancelTimer, mountedCount, toggleVariant]);

  const mountSelectedMarkers = React.useCallback(() => {
    haltAutoRun('idle');
    setMountedCount(selectedCount);
    setVariant('a');
    setCompletedRounds(0);
    setLastCommitLatencyMs(0);
    setMaxCommitLatencyMs(0);
  }, [haltAutoRun, selectedCount]);

  const clearMarkers = React.useCallback(() => {
    haltAutoRun('idle');
    setMountedCount(0);
    setVariant('a');
    setCompletedRounds(0);
    setLastCommitLatencyMs(0);
    setMaxCommitLatencyMs(0);
  }, [haltAutoRun]);

  React.useEffect(
    () => () => {
      runTokenRef.current += 1;
      cancelTimer();
      frameIdsRef.current.forEach((frameId) => cancelAnimationFrame(frameId));
      frameIdsRef.current.clear();
    },
    [cancelTimer]
  );

  const running = runStatus === 'running';
  const hasMarkers = mountedCount > 0;

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialCameraPosition={INITIAL_CAMERA}>
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            cacheKey={markerCacheKey(marker.id, variant)}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={marker.index}
          >
            <View style={[styles.markerCard, variant === 'b' && styles.markerCardB]}>
              <View style={[styles.markerBadge, variant === 'b' && styles.markerBadgeB]}>
                <Text style={styles.markerBadgeText}>{marker.index + 1}</Text>
              </View>
              <View style={styles.markerTextColumn}>
                <Text
                  numberOfLines={1}
                  style={[styles.markerTitle, variant === 'b' && styles.markerTitleB]}
                >
                  压测点 {marker.index + 1}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.markerSubtitle, variant === 'b' && styles.markerSubtitleB]}
                >
                  STYLE {variant.toUpperCase()}
                </Text>
              </View>
            </View>
          </Marker>
        ))}

        <MapUI>
          <View pointerEvents="box-none" style={styles.overlayRoot}>
            <ScrollView
              style={styles.panel}
              contentContainerStyle={styles.panelContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.panelTitle}>iOS Marker 压力测试</Text>

              <View style={styles.metrics}>
                <Metric label="Marker" value={String(mountedCount)} />
                <Metric label="样式" value={variant.toUpperCase()} />
                <Metric label="轮次" value={`${completedRounds}/${AUTO_RUN_ROUNDS}`} />
                <Metric label="状态" value={STATUS_LABELS[runStatus]} />
                <Metric label="最近 JS 帧" value={`${lastCommitLatencyMs.toFixed(1)} ms`} />
                <Metric label="最大 JS 帧" value={`${maxCommitLatencyMs.toFixed(1)} ms`} />
              </View>

              <Text style={styles.sectionLabel}>数量</Text>
              <View style={styles.segment}>
                {MARKER_COUNTS.map((count) => {
                  const selected = selectedCount === count;
                  return (
                    <Pressable
                      key={count}
                      testID={`marker-stress-count-${count}`}
                      accessibilityRole="button"
                      accessibilityLabel={`选择 ${count} 个 Marker`}
                      style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
                      onPress={() => setSelectedCount(count)}
                      disabled={running}
                    >
                      <Text
                        style={[
                          styles.segmentButtonText,
                          selected && styles.segmentButtonTextSelected,
                        ]}
                      >
                        {count}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.actionGrid}>
                <ActionButton
                  testID="marker-stress-mount"
                  label="挂载"
                  onPress={mountSelectedMarkers}
                  disabled={running}
                />
                <ActionButton
                  testID="marker-stress-toggle"
                  label="切换 A/B"
                  onPress={toggleVariant}
                  disabled={!hasMarkers || running}
                />
                <ActionButton
                  testID="marker-stress-auto-start"
                  label="自动 20 轮"
                  onPress={startAutoRun}
                  disabled={!hasMarkers || running}
                  emphasis
                />
                <ActionButton
                  testID="marker-stress-auto-stop"
                  label="停止"
                  onPress={stopAutoRun}
                  disabled={!running}
                />
                <ActionButton
                  testID="marker-stress-clear"
                  label="清空"
                  onPress={clearMarkers}
                  disabled={!hasMarkers && !running}
                  destructive
                />
              </View>
            </ScrollView>
          </View>
        </MapUI>
      </MapView>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  testID,
  label,
  onPress,
  disabled,
  emphasis = false,
  destructive = false,
}: {
  testID: string;
  label: string;
  onPress: () => void;
  disabled: boolean;
  emphasis?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.actionButton,
        emphasis && styles.actionButtonEmphasis,
        destructive && styles.actionButtonDestructive,
        disabled && styles.actionButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dbe4ea',
  },
  map: {
    flex: 1,
  },
  overlayRoot: {
    position: 'absolute',
    top: 72,
    right: 12,
    bottom: 20,
    width: 286,
    alignItems: 'flex-end',
  },
  panel: {
    width: 286,
    maxHeight: 420,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: '#d7dee5',
  },
  panelContent: {
    padding: 12,
  },
  panelTitle: {
    color: '#17202a',
    fontSize: 16,
    fontWeight: '800',
  },
  metrics: {
    marginTop: 10,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#cbd5df',
  },
  metricRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: '#62707d',
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    color: '#17202a',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  sectionLabel: {
    marginTop: 10,
    color: '#45525e',
    fontSize: 12,
    fontWeight: '700',
  },
  segment: {
    marginTop: 6,
    height: 36,
    flexDirection: 'row',
    padding: 3,
    borderRadius: 7,
    backgroundColor: '#e7ecf0',
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  segmentButtonSelected: {
    backgroundColor: '#1f6f5f',
  },
  segmentButtonText: {
    color: '#52606d',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentButtonTextSelected: {
    color: '#ffffff',
  },
  actionGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    minWidth: 78,
    minHeight: 36,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#3c4a56',
  },
  actionButtonEmphasis: {
    backgroundColor: '#1f6f5f',
  },
  actionButtonDestructive: {
    backgroundColor: '#a33a3a',
  },
  actionButtonDisabled: {
    opacity: 0.35,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  markerCard: {
    width: 160,
    height: 56,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1677a8',
    backgroundColor: '#f5fbff',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  markerCardB: {
    width: 220,
    height: 82,
    paddingHorizontal: 13,
    borderColor: '#d96c1d',
    backgroundColor: '#fff7ed',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  markerBadge: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#1677a8',
  },
  markerBadgeB: {
    width: 48,
    height: 48,
    backgroundColor: '#d96c1d',
  },
  markerBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  markerTextColumn: {
    flex: 1,
    marginLeft: 8,
  },
  markerTitle: {
    color: '#123447',
    fontSize: 13,
    fontWeight: '900',
  },
  markerTitleB: {
    color: '#652c0c',
    fontSize: 17,
  },
  markerSubtitle: {
    marginTop: 3,
    color: '#507082',
    fontSize: 10,
    fontWeight: '700',
  },
  markerSubtitleB: {
    marginTop: 6,
    color: '#96501f',
    fontSize: 12,
  },
});
