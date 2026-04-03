import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createWebRuntime } from 'expo-gaode-map-web-api';

import { EXAMPLE_WEB_API_KEY } from './exampleConfig';

export default function WebAPIAdvancedTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const requestIdRef = useRef(0);

  const runtime = useMemo(
    () =>
      createWebRuntime({
        search: {
          config: {
            key: EXAMPLE_WEB_API_KEY,
            enableCache: true,
            maxRetries: 3,
            retryDelay: 1000,
          },
        },
        geocode: {
          config: {
            key: EXAMPLE_WEB_API_KEY,
            enableCache: true,
            maxRetries: 3,
            retryDelay: 1000,
          },
        },
        route: {
          config: {
            key: EXAMPLE_WEB_API_KEY,
            enableCache: true,
            maxRetries: 3,
            retryDelay: 1000,
          },
        },
      }),
    []
  );

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const clearLogs = () => setLogs([]);

  const handleInputChange = async (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      return;
    }

    requestIdRef.current += 1;
    const currentId = requestIdRef.current;
    addLog(`🔍 发起搜索: "${text}"`);

    try {
      const result = await runtime.search.getInputTips({
        keyword: text,
        city: '北京',
      });
      if (currentId !== requestIdRef.current) {
        addLog('ℹ️ 丢弃过期结果（新请求已发起）');
        return;
      }
      addLog(`✅ 输入提示成功: ${result.items.length} 条`);
    } catch (error) {
      addLog(`❌ 输入提示失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testCache = async () => {
    setLoading(true);
    try {
      addLog('📡 第 1 次 reverseGeocode（网络）');
      const start1 = performance.now();
      await runtime.geocode.reverseGeocode({
        location: { longitude: 116.481028, latitude: 39.989643 },
      });
      const end1 = performance.now();
      addLog(`✅ 第 1 次耗时: ${(end1 - start1).toFixed(2)}ms`);

      addLog('💾 第 2 次 reverseGeocode（缓存）');
      const start2 = performance.now();
      await runtime.geocode.reverseGeocode({
        location: { longitude: 116.481028, latitude: 39.989643 },
      });
      const end2 = performance.now();
      addLog(`✅ 第 2 次耗时: ${(end2 - start2).toFixed(2)}ms`);
    } catch (error) {
      addLog(`❌ 缓存测试失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testValidation = async () => {
    setLoading(true);
    try {
      addLog('🧪 测试非法坐标校验');
      await runtime.geocode.reverseGeocode({
        location: { longitude: Number.NaN, latitude: 39.9 },
      });
      addLog('❌ 预期应失败，但未失败');
    } catch (error) {
      addLog(`✅ 校验生效: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Web API v3 高级测试</Text>
        <Text style={styles.subtitle}>Runtime / Provider / 缓存 / 校验</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>输入提示（并发结果去重）</Text>
          <TextInput
            style={styles.input}
            placeholder="输入关键字..."
            value={inputText}
            onChangeText={handleInputChange}
          />
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.btn} onPress={testCache} disabled={loading}>
            <Text style={styles.btnText}>测试缓存</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnWarn]} onPress={testValidation} disabled={loading}>
            <Text style={styles.btnText}>测试参数校验</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>运行日志</Text>
          <TouchableOpacity onPress={clearLogs}>
            <Text style={styles.clearText}>清空</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.logBox}>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>等待操作...</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={`${index}-${log}`} style={styles.logText}>
                {log}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: '48%',
    alignItems: 'center',
  },
  btnWarn: {
    backgroundColor: '#FF9500',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearText: {
    color: '#007AFF',
    fontSize: 14,
  },
  logBox: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
  },
  logText: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
