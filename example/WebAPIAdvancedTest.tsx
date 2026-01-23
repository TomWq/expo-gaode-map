
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { GaodeWebAPI, } from 'expo-gaode-map-web-api';

export default function WebAPIAdvancedTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // 初始化 API 实例，启用缓存
  // 使用 useMemo 确保只初始化一次，且在组件渲染时（即 SDK init 后）进行
  const api = React.useMemo(() => new GaodeWebAPI({
    enableCache: true,
    maxRetries: 3,
    retryDelay: 1000,
  }), []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  const clearLogs = () => setLogs([]);

  // 测试 1: 请求取消 (InputTips)
  const handleInputChange = async (text: string) => {
    setInputText(text);
    if (!text) return;

    // 取消上一次未完成的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog(`❌ 取消了上一次搜索请求`);
    }

    // 创建新的 Controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      addLog(`🔍 发起搜索: "${text}"...`);
      const result = await api.inputTips.getTips(text, {
        city: '北京',
        signal: controller.signal,
      });
      addLog(`✅ 搜索成功: 找到 ${result.tips.length} 个结果`);
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Request aborted') {
        addLog(`ℹ️ 请求已中断 (预期行为)`);
      } else {
        addLog(`❌ 搜索出错: ${error.message}`);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  // 测试 2: 缓存验证
  const testCache = async () => {
    setLoading(true);
    const location = '116.481028,39.989643';
    
    try {
      // 第一次请求
      addLog(`📡 发起第 1 次逆地理编码 (网络请求)...`);
      const start1 = performance.now();
      await api.geocode.regeocode(location);
      const end1 = performance.now();
      addLog(`✅ 第 1 次耗时: ${(end1 - start1).toFixed(2)}ms`);

      // 第二次请求 (应该命中缓存)
      addLog(`💾 发起第 2 次逆地理编码 (期望命中缓存)...`);
      const start2 = performance.now();
      await api.geocode.regeocode(location);
      const end2 = performance.now();
      addLog(`✅ 第 2 次耗时: ${(end2 - start2).toFixed(2)}ms`);
      
      if (end2 - start2 < 50) {
        addLog(`🎉 缓存验证通过！速度提升显著`);
      } else {
        addLog(`⚠️ 缓存可能未命中，请检查网络或配置`);
      }

    } catch (error: any) {
      addLog(`❌ 测试失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试 3: 批量接口参数校验
  const testBatchValidation = async () => {
    setLoading(true);
    try {
      addLog(`🧪 测试批量接口非法参数拦截...`);
      // 故意构造包含 | 分隔符的非法地址
      const invalidAddresses = ['北京市朝阳区|非法字符', '北京市海淀区'];
      
      await api.geocode.batchGeocode(invalidAddresses, '北京');
      addLog(`❌ 错误：未拦截非法参数！`);
    } catch (error: any) {
      addLog(`✅ 成功拦截错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 测试 4: 坐标格式校验
  const testCoordinateValidation = async () => {
    setLoading(true);
    try {
      addLog(`🧪 测试非法坐标拦截...`);
      await api.geocode.regeocode('invalid,coordinate');
      addLog(`❌ 错误：未拦截非法坐标！`);
    } catch (error: any) {
      addLog(`✅ 成功拦截错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Web API 高级功能测试</Text>
        <Text style={styles.subtitle}>缓存 / 取消 / 重试 / 校验</Text>
      </View>

      <View style={styles.content}>
        {/* 输入提示测试区 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 请求取消 (InputTips)</Text>
          <TextInput
            style={styles.input}
            placeholder="快速输入文字以触发取消机制..."
            value={inputText}
            onChangeText={handleInputChange}
          />
        </View>

        {/* 按钮测试区 */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.btn} onPress={testCache} disabled={loading}>
            <Text style={styles.btnText}>测试 LRU 缓存</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.btn, styles.btnWarn]} onPress={testBatchValidation} disabled={loading}>
            <Text style={styles.btnText}>测试参数校验</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnWarn]} onPress={testCoordinateValidation} disabled={loading}>
            <Text style={styles.btnText}>测试坐标校验</Text>
          </TouchableOpacity>
        </View>

        {/* 日志区 */}
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
              <Text key={index} style={styles.logText}>{log}</Text>
            ))
          )}
        </ScrollView>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
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
