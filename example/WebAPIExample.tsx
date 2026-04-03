import React, { useMemo, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createWebRuntime } from 'expo-gaode-map-web-api';

import { EXAMPLE_WEB_API_KEY } from './exampleConfig';

export default function WebAPIExample() {
  const [apiKey, setApiKey] = useState(EXAMPLE_WEB_API_KEY);
  const [runtime, setRuntime] = useState<ReturnType<typeof createWebRuntime> | null>(null);

  const [longitude, setLongitude] = useState('116.481028');
  const [latitude, setLatitude] = useState('39.989643');
  const [regeocodeResult, setRegeocodeResult] = useState('');

  const [keyword, setKeyword] = useState('咖啡');
  const [searchResult, setSearchResult] = useState('');

  const fallbackRuntime = useMemo(
    () =>
      createWebRuntime({
        search: { config: { key: EXAMPLE_WEB_API_KEY } },
        geocode: { config: { key: EXAMPLE_WEB_API_KEY } },
        route: { config: { key: EXAMPLE_WEB_API_KEY } },
      }),
    []
  );

  const getRuntime = () => runtime ?? fallbackRuntime;

  const handleInitialize = () => {
    const effectiveKey = apiKey.trim() || EXAMPLE_WEB_API_KEY;
    if (!effectiveKey) {
      Alert.alert('缺少 Web API Key', '请先在 exampleConfig.ts 或环境变量里提供 key。');
      return;
    }

    const next = createWebRuntime({
      search: { config: { key: effectiveKey } },
      geocode: { config: { key: effectiveKey } },
      route: { config: { key: effectiveKey } },
    });
    setRuntime(next);
    Alert.alert('成功', '已按当前 Key 初始化 v3 runtime');
  };

  const handleReverseGeocode = async () => {
    try {
      const result = await getRuntime().geocode.reverseGeocode({
        location: {
          longitude: Number(longitude),
          latitude: Number(latitude),
        },
        extensions: 'all',
      });

      const resultText = `
📍 格式化地址：
${result.formattedAddress}

🏪 周边 POI（前 5 个）：
${result.pois
  .slice(0, 5)
  .map((poi, i) => `${i + 1}. ${poi.name} - ${poi.address ?? '无地址'}`)
  .join('\n')}
      `.trim();

      setRegeocodeResult(resultText);
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  const handleKeywordSearch = async () => {
    if (!keyword.trim()) {
      Alert.alert('提示', '请输入关键词');
      return;
    }

    try {
      const result = await getRuntime().search.searchKeyword({
        keyword: keyword.trim(),
        city: '北京',
        page: 1,
        pageSize: 10,
      });

      const resultText = `
找到 ${result.total ?? result.items.length} 个结果

${result.items
  .slice(0, 5)
  .map((item, i) => `${i + 1}. ${item.name}\n   ${item.address ?? '无地址'}`)
  .join('\n')}
      `.trim();

      setSearchResult(resultText);
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>高德 Web API v3 Runtime 示例</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 初始化 Runtime</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="输入 Web API Key"
          secureTextEntry
        />
        <Button title="初始化 v3 Runtime" onPress={handleInitialize} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. reverseGeocode（坐标 → 地址）</Text>
        <TextInput
          style={styles.input}
          value={longitude}
          onChangeText={setLongitude}
          placeholder="经度"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={latitude}
          onChangeText={setLatitude}
          placeholder="纬度"
          keyboardType="numeric"
        />
        <Button title="查询地址" onPress={handleReverseGeocode} />
        {regeocodeResult ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{regeocodeResult}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. searchKeyword（关键词搜索）</Text>
        <TextInput
          style={styles.input}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="输入关键词，如 咖啡"
        />
        <Button title="搜索 POI" onPress={handleKeywordSearch} />
        {searchResult ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{searchResult}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  resultBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    marginTop: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    lineHeight: 18,
  },
});
