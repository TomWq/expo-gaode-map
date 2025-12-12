/**
 * 地图预加载性能测试
 * 对比预加载和不预加载的启动时间差距
 * 支持原生预加载和 JS 层预加载的性能对比
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  Alert,
} from 'react-native';
import {
  ExpoGaodeMapModule,
  MapView,
  MapPreloaderComponent,
  useMapPreload,
} from 'expo-gaode-map';


/**
 * 性能测试结果
 */
interface BenchmarkResult {
  type: 'with-preload' | 'without-preload';
  startTime: number;
  endTime: number;
  duration: number;
  timestamp: string;
  strategy?: string; // 预加载策略: 'native' | 'js' | 'auto'
}

/**
 * 测试 1: 使用预加载
 */
function TestWithPreload({ onResult }: { onResult: (result: BenchmarkResult) => void }) {
  const [showMap, setShowMap] = useState(false);
  const startTimeRef = useRef<number>(0);
  const hasRecordedRef = useRef(false);
  const { isReady, stats } = useMapPreload({ poolSize: 1, delay: 100, strategy: 'native' }, true);

  // 重置状态
  useEffect(() => {
    return () => {
      setShowMap(false);
      hasRecordedRef.current = false;
    };
  }, []);

  const handleShowMap = () => {
    startTimeRef.current = Date.now();
    hasRecordedRef.current = false;
    setShowMap(true);
  };

  const handleMapLoad = () => {
    // 防止重复记录
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    
    onResult({
      type: 'with-preload',
      startTime: startTimeRef.current,
      endTime,
      duration,
      timestamp: new Date().toLocaleTimeString(),
      strategy: (stats as any)?.strategy || 'unknown',
    });
  };

  return (
    <View style={styles.testContainer}>
      <MapPreloaderComponent
        config={{ poolSize: 1, delay: 0, strategy: 'auto' }}
        onPreloadComplete={() => console.log('✅ 预加载完成')}
      />
      
      <View style={styles.testHeader}>
        <Text style={styles.testTitle}>测试 A: 使用预加载</Text>
        <Text style={styles.testStatus}>
          {isReady ? '✅ 已就绪' : '⏳ 准备中...'}
        </Text>
        {isReady && stats && (
          <Text style={styles.testStrategy}>
            策略: {(stats as any).strategy === 'native' ? '原生预加载' : 'JS 层预加载'}
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="显示地图（计时开始）"
          onPress={handleShowMap}
          disabled={!isReady || showMap}
        />
      </View>

      {showMap && (
        <MapView
          style={styles.map}
          initialCameraPosition={{
            target: { latitude: 39.9042, longitude: 116.4074 },
            zoom: 12,
          }}
          onLoad={handleMapLoad}
        />
      )}
    </View>
  );
}

/**
 * 测试 2: 不使用预加载
 */
function TestWithoutPreload({ onResult }: { onResult: (result: BenchmarkResult) => void }) {
  const [showMap, setShowMap] = useState(false);
  const startTimeRef = useRef<number>(0);
  const hasRecordedRef = useRef(false);

  // 重置状态
  useEffect(() => {
    return () => {
      setShowMap(false);
      hasRecordedRef.current = false;
    };
  }, []);

  const handleShowMap = () => {
    startTimeRef.current = Date.now();
    hasRecordedRef.current = false;
    setShowMap(true);
  };

  const handleMapLoad = () => {
    // 防止重复记录
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    
    onResult({
      type: 'without-preload',
      startTime: startTimeRef.current,
      endTime,
      duration,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  return (
    <View style={styles.testContainer}>
      <View style={styles.testHeader}>
        <Text style={styles.testTitle}>测试 B: 不使用预加载</Text>
        <Text style={styles.testStatus}>✅ 已就绪</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="显示地图（计时开始）"
          onPress={handleShowMap}
          disabled={showMap}
        />
      </View>

      {showMap && (
        <MapView
          style={styles.map}
          initialCameraPosition={{
            target: { latitude: 39.9042, longitude: 116.4074 },
            zoom: 12,
          }}
          onLoad={handleMapLoad}
        />
      )}
    </View>
  );
}

/**
 * 性能对比结果显示
 */
function BenchmarkResults({ results }: { results: BenchmarkResult[] }) {
  const withPreload = results.filter((r) => r.type === 'with-preload');
  const withoutPreload = results.filter((r) => r.type === 'without-preload');

  const avgWithPreload =
    withPreload.length > 0
      ? withPreload.reduce((sum, r) => sum + r.duration, 0) / withPreload.length
      : 0;

  const avgWithoutPreload =
    withoutPreload.length > 0
      ? withoutPreload.reduce((sum, r) => sum + r.duration, 0) / withoutPreload.length
      : 0;

  const improvement =
    avgWithoutPreload > 0
      ? ((avgWithoutPreload - avgWithPreload) / avgWithoutPreload) * 100
      : 0;

  return (
    <View style={styles.resultsContainer}>
      <Text style={styles.resultsTitle}>📊 测试结果</Text>

      {/* 统计摘要 */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>使用预加载平均耗时:</Text>
          <Text style={[styles.summaryValue, styles.goodValue]}>
            {avgWithPreload.toFixed(0)} ms
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>不使用预加载平均耗时:</Text>
          <Text style={[styles.summaryValue, styles.badValue]}>
            {avgWithoutPreload.toFixed(0)} ms
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.improvementRow]}>
          <Text style={styles.summaryLabel}>性能提升:</Text>
          <Text style={[styles.summaryValue, styles.improvementValue]}>
            {improvement.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* 详细记录 */}
      <ScrollView style={styles.detailsScroll}>
        <Text style={styles.detailsTitle}>详细记录:</Text>
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultTypeContainer}>
              <Text style={styles.resultType}>
                {result.type === 'with-preload' ? '✅ 预加载' : '❌ 无预加载'}
              </Text>
              {result.strategy && (
                <Text style={styles.resultStrategy}>
                  ({result.strategy === 'native' ? '原生' : 'JS'})
                </Text>
              )}
            </View>
            <Text style={styles.resultTime}>{result.timestamp}</Text>
            <Text style={styles.resultDuration}>{result.duration} ms</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * 主测试组件
 */
export default function MapPreloadBenchmark() {
  const [currentTest, setCurrentTest] = useState<'A' | 'B' | null>(null);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [testCount, setTestCount] = useState({ A: 0, B: 0 });
  ExpoGaodeMapModule.updatePrivacyCompliance(true)

  useEffect(()=>{

  },[])

  const handleResult = (result: BenchmarkResult) => {
    setResults((prev) => [...prev, result]);
    
    // 显示结果提示
    Alert.alert(
      '测试完成',
      `${result.type === 'with-preload' ? '预加载' : '无预加载'}\n耗时: ${result.duration} ms`,
      [{ text: '确定' }]
    );

    // 更新测试计数
    setTestCount((prev) => ({
      ...prev,
      [result.type === 'with-preload' ? 'A' : 'B']: prev[result.type === 'with-preload' ? 'A' : 'B'] + 1,
    }));
  };

  const handleStartTest = (test: 'A' | 'B') => {
    setCurrentTest(test);
  };

  const handleReset = () => {
    setCurrentTest(null);
    setResults([]);
    setTestCount({ A: 0, B: 0 });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* 标题和说明 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚡ 地图预加载性能测试</Text>
          <Text style={styles.headerDescription}>
            对比使用预加载和不使用预加载的地图启动时间
          </Text>
        </View>

        {/* 测试说明 */}
        {!currentTest && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>📝 测试步骤:</Text>
            <Text style={styles.instructionsText}>
              1. 先点击"开始测试 A"，等待预加载完成{'\n'}
              2. 点击"显示地图"按钮，记录加载时间{'\n'}
              3. 返回后点击"开始测试 B"{'\n'}
              4. 点击"显示地图"按钮，记录加载时间{'\n'}
              5. 对比两次测试的时间差异{'\n'}
              {'\n'}
              💡 建议: 每个测试重复 3-5 次取平均值
            </Text>
          </View>
        )}

        {/* 测试按钮 */}
        {!currentTest && (
          <View style={styles.testButtons}>
            <Button
              title={`开始测试 A (已测 ${testCount.A} 次)`}
              onPress={() => handleStartTest('A')}
            />
            <View style={{ height: 12 }} />
            <Button
              title={`开始测试 B (已测 ${testCount.B} 次)`}
              onPress={() => handleStartTest('B')}
              color="#FF6B6B"
            />
            {results.length > 0 && (
              <>
                <View style={{ height: 12 }} />
                <Button title="重置所有测试" onPress={handleReset} color="#999" />
              </>
            )}
          </View>
        )}

        {/* 测试区域 */}
        {currentTest === 'A' && <TestWithPreload onResult={handleResult} />}
        {currentTest === 'B' && <TestWithoutPreload onResult={handleResult} />}

        {/* 返回按钮 */}
        {currentTest && (
          <View style={styles.backButton}>
            <Button title="← 返回选择测试" onPress={() => setCurrentTest(null)} />
          </View>
        )}

        {/* 结果显示 - 只在没有进行测试时显示 */}
        {!currentTest && results.length > 0 && <BenchmarkResults results={results} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop:80
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: '#666',
  },
  instructions: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  testButtons: {
    padding: 16,
  },
  testContainer: {
    flex: 1,
    padding: 16,
  },
  testHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  testStatus: {
    fontSize: 14,
    color: '#666',
  },
  testStrategy: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 4,
    fontWeight: '600',
  },
  buttonContainer: {
    marginVertical: 8,
  },
  map: {
    width: '100%',
    height: 400,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  backButton: {
    padding: 16,
    paddingTop: 0,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  goodValue: {
    color: '#4CAF50',
  },
  badValue: {
    color: '#FF6B6B',
  },
  improvementRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginBottom: 0,
  },
  improvementValue: {
    color: '#2196F3',
    fontSize: 20,
  },
  detailsScroll: {
    maxHeight: 200,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultTypeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultType: {
    fontSize: 12,
  },
  resultStrategy: {
    fontSize: 10,
    color: '#2196F3',
    marginLeft: 4,
  },
  resultTime: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  resultDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
});