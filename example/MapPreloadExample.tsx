/**
 * 地图预加载示例
 * 演示如何使用地图预加载功能提升加载速度
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  Alert,
} from 'react-native';
import {
  MapView,
  MapPreloaderComponent,
  useMapPreload,
  useMapPreloadStatus,
  MapPreloader,
} from '../packages/core/src';

/**
 * 示例 1: 使用预加载组件（推荐）
 */
export function Example1_PreloaderComponent() {
  const [showMap, setShowMap] = useState(false);

  return (
    <View style={styles.container}>
      {/* 预加载组件 - 在后台预加载地图 */}
      <MapPreloaderComponent
        config={{
          poolSize: 1,
          delay: 1000,
          enabled: true,
          strategy: 'auto', // 自动选择：原生优先，JS层回退
        }}
        onPreloadComplete={() => {
          console.log('✅ 地图预加载完成');
          Alert.alert('提示', '地图已预加载完成，可以快速显示');
        }}
        onPreloadError={(error: Error) => {
          console.error('❌ 地图预加载失败:', error);
        }}
      />

      <View style={styles.controls}>
        <Text style={styles.title}>示例 1: 预加载组件（推荐）</Text>
        <Text style={styles.description}>
          使用 'auto' 策略自动选择最优方案{'\n'}
          • 原生可用 → 原生预加载（60-80% 提升）{'\n'}
          • 原生不可用 → JS 层预加载（5-25% 提升）
        </Text>
        <Button
          title={showMap ? '隐藏地图' : '显示地图'}
          onPress={() => setShowMap(!showMap)}
        />
      </View>

      {showMap && (
        <MapView
          style={styles.map}
          initialCameraPosition={{
            target: { latitude: 39.9042, longitude: 116.4074 },
            zoom: 12,
          }}
        />
      )}
    </View>
  );
}

/**
 * 示例 2: 使用 Hook
 */
export function Example2_UseHook() {
  const [showMap, setShowMap] = useState(false);
  const {
    status,
    isReady,
    isLoading,
    stats,
    startPreload,
    stopPreload,
    clearInstances,
  } = useMapPreload(
    {
      poolSize: 2,
      delay: 500,
      strategy: 'auto',
    },
    false // 不自动启动
  );

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <Text style={styles.title}>示例 2: 使用 Hook</Text>
        
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>预加载状态:</Text>
          <Text style={styles.statusValue}>{status}</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>统计信息:</Text>
          <Text style={styles.statusValue}>
            总数: {stats.total} | 就绪: {stats.ready} | 加载中: {stats.loading}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>使用策略:</Text>
          <Text style={styles.statusValue}>
            {(stats as any).strategy || 'auto'}
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Button
            title="开始预加载"
            onPress={startPreload}
            disabled={isLoading || isReady}
          />
          <Button
            title="停止预加载"
            onPress={stopPreload}
            disabled={!isLoading}
          />
          <Button
            title="清理实例"
            onPress={clearInstances}
            disabled={stats.total === 0}
          />
        </View>

        <Button
          title={showMap ? '隐藏地图' : '显示地图'}
          onPress={() => setShowMap(!showMap)}
          disabled={!isReady}
        />
      </View>

      {showMap && (
        <MapView
          style={styles.map}
          initialCameraPosition={{
            target: { latitude: 31.2304, longitude: 121.4737 },
            zoom: 12,
          }}
        />
      )}
    </View>
  );
}

/**
 * 示例 3: 简化 Hook
 */
export function Example3_SimpleHook() {
  const isReady = useMapPreloadStatus({ poolSize: 1, delay: 1000, strategy: 'auto' });

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <Text style={styles.title}>示例 3: 简化 Hook</Text>
        <Text style={styles.description}>
          {isReady ? '✅ 地图已就绪' : '⏳ 地图加载中...'}
        </Text>
      </View>

      {isReady ? (
        <MapView
          style={styles.map}
          initialCameraPosition={{
            target: { latitude: 22.5431, longitude: 114.0579 },
            zoom: 12,
          }}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>地图预加载中，请稍候...</Text>
        </View>
      )}
    </View>
  );
}

/**
 * 示例 4: 直接使用管理器
 */
export function Example4_DirectAPI() {
  const [status, setStatus] = useState(MapPreloader.getStatus());
  const [stats, setStats] = useState(MapPreloader.getStats());
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    // 监听状态变化
    const unsubscribe = MapPreloader.addListener((newStatus) => {
      setStatus(newStatus);
      setStats(MapPreloader.getStats());
    });

    return unsubscribe;
  }, []);

  const handlePreload = () => {
    MapPreloader.configure({
      poolSize: 1,
      delay: 0,
      enabled: true,
      strategy: 'auto',
    });
    MapPreloader.startPreload();
  };

  const handleClear = () => {
    MapPreloader.clearPreloadedInstances();
    setStats(MapPreloader.getStats());
    Alert.alert('提示', '预加载实例已清理');
  };

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <Text style={styles.title}>示例 4: 直接使用 API</Text>
        
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>当前状态:</Text>
          <Text style={styles.statusValue}>{status}</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>统计信息:</Text>
          <Text style={styles.statusValue}>
            总数: {stats.total} | 就绪: {stats.ready}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>使用策略:</Text>
          <Text style={styles.statusValue}>
            {(stats as any).strategy || 'auto'}
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Button title="开始预加载" onPress={handlePreload} />
          <Button title="清理实例" onPress={handleClear} />
        </View>

        <Button
          title={showMap ? '隐藏地图' : '显示地图'}
          onPress={() => setShowMap(!showMap)}
        />
      </View>

      {showMap && (
        <MapView
          style={styles.map}
          initialCameraPosition={{
            target: { latitude: 30.5728, longitude: 104.0668 },
            zoom: 12,
          }}
        />
      )}
    </View>
  );
}

/**
 * 主示例组件 - 包含所有示例的导航
 */
export default function MapPreloadExample() {
  const [currentExample, setCurrentExample] = useState(1);

  const examples = [
    { id: 1, title: '预加载组件', component: Example1_PreloaderComponent },
    { id: 2, title: 'Hook 用法', component: Example2_UseHook },
    { id: 3, title: '简化 Hook', component: Example3_SimpleHook },
    { id: 4, title: '直接 API', component: Example4_DirectAPI },
  ];

  const CurrentExample = examples.find((e) => e.id === currentExample)?.component;

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚀 地图预加载示例</Text>
        <Text style={styles.headerSubtitle}>混合预加载：原生 + JS 层</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {examples.map((example) => (
            <Button
              key={example.id}
              title={example.title}
              onPress={() => setCurrentExample(example.id)}
              color={currentExample === example.id ? '#007AFF' : '#999'}
            />
          ))}
        </ScrollView>
      </View>

      {CurrentExample && <CurrentExample />}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 80,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  container: {
    flex: 1,
  },
  controls: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});