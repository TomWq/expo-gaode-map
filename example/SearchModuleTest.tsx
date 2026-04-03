import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createNativeSearchRuntime } from 'expo-gaode-map-search';

type Suggestion = {
  id?: string;
  name: string;
  address?: string;
};

export default function SearchModuleTest() {
  const runtime = useMemo(() => createNativeSearchRuntime(), []);
  const [log, setLog] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('餐厅');
  const [city, setCity] = useState('北京');
  const [tips, setTips] = useState<Suggestion[]>([]);
  const [showTips, setShowTips] = useState(false);

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testRuntimeLoad = () => {
    addLog('═══ 测试 v3 runtime 加载 ═══');
    addLog(`✅ runtime.search 可用: ${typeof runtime.search.searchKeyword === 'function'}`);
    addLog(`✅ runtime.geocode 可用: ${typeof runtime.geocode.reverseGeocode === 'function'}`);
  };

  const testKeywordSearch = async () => {
    addLog('═══ 测试关键词搜索 ═══');
    try {
      const result = await runtime.search.searchKeyword({
        keyword,
        city,
        page: 1,
        pageSize: 10,
      });

      addLog(`✅ 搜索成功，总数: ${result.total ?? result.items.length}`);
      result.items.slice(0, 3).forEach((poi, index) => {
        addLog(`${index + 1}. ${poi.name}`);
        addLog(`   地址: ${poi.address ?? '无'}`);
      });
    } catch (error) {
      addLog(`❌ 搜索失败: ${error}`);
    }
  };

  const testNearbySearch = async () => {
    addLog('═══ 测试周边搜索 ═══');
    try {
      const result = await runtime.search.searchNearby({
        keyword,
        center: { latitude: 39.9, longitude: 116.4 },
        radius: 1000,
        page: 1,
        pageSize: 10,
      });
      addLog(`✅ 周边搜索成功，结果: ${result.items.length}`);
      result.items.slice(0, 3).forEach((poi, index) => {
        addLog(`${index + 1}. ${poi.name} (${poi.distanceMeters ?? 0}米)`);
      });
    } catch (error) {
      addLog(`❌ 周边搜索失败: ${error}`);
    }
  };

  const testAlongSearch = async () => {
    addLog('═══ 测试沿途搜索 ═══');
    try {
      const result = await runtime.search.searchAlong({
        keyword: 'ATM',
        polyline: [
          { latitude: 39.9042, longitude: 116.4074 },
          { latitude: 39.91, longitude: 116.4074 },
          { latitude: 39.925, longitude: 116.4074 },
        ],
      });
      addLog(`✅ 沿途搜索成功，结果: ${result.items.length}`);
    } catch (error) {
      addLog(`❌ 沿途搜索失败: ${error}`);
    }
  };

  const testPolygonSearch = async () => {
    addLog('═══ 测试多边形搜索 ═══');
    try {
      const result = await runtime.search.searchPolygon({
        keyword,
        polygon: [
          { latitude: 39.9, longitude: 116.395 },
          { latitude: 39.9, longitude: 116.42 },
          { latitude: 39.915, longitude: 116.42 },
          { latitude: 39.915, longitude: 116.395 },
        ],
        page: 1,
        pageSize: 10,
      });
      addLog(`✅ 多边形搜索成功，结果: ${result.items.length}`);
    } catch (error) {
      addLog(`❌ 多边形搜索失败: ${error}`);
    }
  };

  const fetchInputTips = async (text: string) => {
    if (text.trim().length < 2) {
      setTips([]);
      setShowTips(false);
      return;
    }

    try {
      const result = await runtime.search.getInputTips({
        keyword: text,
        city,
      });
      const items = result.items.map((item) => ({
        id: item.id,
        name: item.name,
        address: item.address,
      }));
      setTips(items);
      setShowTips(items.length > 0);
    } catch {
      setTips([]);
      setShowTips(false);
    }
  };

  const testPoiDetail = async () => {
    addLog('═══ 测试 POI 详情 ═══');
    try {
      const page = await runtime.search.searchKeyword({
        keyword: '天安门',
        city: '北京',
        page: 1,
        pageSize: 1,
      });

      const id = page.items[0]?.id;
      if (!id) {
        addLog('⚠️ 未拿到可用 POI id');
        return;
      }

      const detail = await runtime.search.getPoiDetail(id);
      addLog(`✅ 详情查询成功: ${detail?.name ?? '未知'}`);
    } catch (error) {
      addLog(`❌ 详情查询失败: ${error}`);
    }
  };

  const testReverseGeocode = async () => {
    addLog('═══ 测试逆地理编码 ═══');
    try {
      const result = await runtime.geocode.reverseGeocode({
        location: { latitude: 39.908823, longitude: 116.39747 },
        radius: 1000,
        extensions: 'all',
      });
      addLog(`✅ 逆地理编码成功: ${result.formattedAddress}`);
      addLog(`📍 周边 POI: ${result.pois.length}`);
    } catch (error) {
      addLog(`❌ 逆地理编码失败: ${error}`);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchInputTips(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, city]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 搜索模块测试（v3 Runtime）</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>搜索关键词:</Text>
        <View>
          <TextInput
            style={styles.input}
            value={keyword}
            onChangeText={setKeyword}
            onFocus={() => {
              if (tips.length > 0) setShowTips(true);
            }}
            placeholder="输入关键词（如：餐厅、酒店）"
          />

          {showTips && tips.length > 0 ? (
            <View style={styles.tipsContainer}>
              <FlatList
                data={tips.slice(0, 5)}
                nestedScrollEnabled
                keyExtractor={(item, index) => `${item.id ?? index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.tipItem}
                    onPress={() => {
                      setKeyword(item.name);
                      setShowTips(false);
                      addLog(`✅ 选择提示: ${item.name}`);
                    }}
                  >
                    <Text style={styles.tipName}>{item.name}</Text>
                    {item.address ? <Text style={styles.tipAddress}>{item.address}</Text> : null}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.tipSeparator} />}
              />
              <TouchableOpacity style={styles.closeTips} onPress={() => setShowTips(false)}>
                <Text style={styles.closeTipsText}>关闭</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <Text style={styles.inputLabel}>城市:</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="输入城市" />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testRuntimeLoad}>
          <Text style={styles.buttonText}>🔌 测试 Runtime 加载</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => void testKeywordSearch()}>
          <Text style={styles.buttonText}>🔍 关键词搜索</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => void testNearbySearch()}>
          <Text style={styles.buttonText}>📍 周边搜索</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => void testAlongSearch()}>
          <Text style={styles.buttonText}>🛣️ 沿途搜索</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => void testPolygonSearch()}>
          <Text style={styles.buttonText}>📐 多边形搜索</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => void testReverseGeocode()}>
          <Text style={styles.buttonText}>🗺️ 逆地理编码</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => void testPoiDetail()}>
          <Text style={styles.buttonText}>📍 POI 详情</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={() => setLog([])}>
          <Text style={styles.buttonText}>🗑️ 清空日志</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>📝 测试日志 (共 {log.length} 条)</Text>
        <ScrollView style={styles.logScroll}>
          {log.length === 0 ? (
            <Text style={styles.logEmpty}>点击上方按钮开始测试...</Text>
          ) : (
            log.map((item, index) => (
              <Text key={`${index}-${item}`} style={styles.logItem}>
                {item}
              </Text>
            ))
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    minHeight: 220,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logScroll: {
    flex: 1,
  },
  logEmpty: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  logItem: {
    fontSize: 12,
    color: '#333',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  tipsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 250,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tipItem: {
    padding: 12,
  },
  tipName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  tipAddress: {
    fontSize: 12,
    color: '#666',
  },
  tipSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  closeTips: {
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  closeTipsText: {
    fontSize: 13,
    color: '#666',
  },
});
