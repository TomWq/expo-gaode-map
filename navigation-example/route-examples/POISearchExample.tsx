import React, { useState } from 'react';
import { View, Button, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { GaodeWebAPI, POIInfo } from 'expo-gaode-map-web-api';

/**
 * POI 搜索示例
 * 展示关键字搜索、周边搜索等功能
 */
export default function POISearchExample() {
  const [apiKey, setApiKey] = useState('');
  const [api, setApi] = useState<GaodeWebAPI | null>(null);
  
  // 搜索参数
  const [keywords, setKeywords] = useState('肯德基');
  const [region, setRegion] = useState('北京市');
  const [location, setLocation] = useState('116.481028,39.989643'); // 望京
  const [radius, setRadius] = useState('1000');
  
  // 结果
  const [result, setResult] = useState('');
  const [pois, setPois] = useState<POIInfo[]>([]);

  // 初始化 API
  const handleInitialize = () => {
    if (!apiKey.trim()) {
      Alert.alert('错误', '请输入 Web API Key');
      return;
    }
    const newApi = new GaodeWebAPI({ key: apiKey });
    setApi(newApi);
    Alert.alert('成功', 'API 初始化成功');
  };

  // 关键字搜索
  const testKeywordSearch = async () => {
    if (!api) {
      Alert.alert('错误', '请先初始化 API');
      return;
    }

    try {
      const res = await api.poi.search(keywords, {
        region,
        city_limit: true,
        page_size: 10,
        show_fields: 'children,business,photos',
      });

      setPois(res.pois);
      
      setResult(`
🔍 关键字搜索：${keywords}

📊 搜索结果：共找到 ${res.count} 个

前 ${Math.min(10, res.pois.length)} 个结果：
${res.pois.slice(0, 10).map((poi, i) =>
  `${i + 1}. ${poi.name}
   📍 地址：${poi.address}
   📞 电话：${poi.business?.tel || '暂无'}
   🗺️ 坐标：${poi.location}
`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 周边搜索
  const testAroundSearch = async () => {
    if (!api) {
      Alert.alert('错误', '请先初始化 API');
      return;
    }

    try {
      const res = await api.poi.searchAround(location, {
        keywords,
        radius: parseInt(radius),
        sortrule: 'distance',
        page_size: 10,
        show_fields: 'children,business,photos',
      });

      setPois(res.pois);
      
      setResult(`
📍 周边搜索：${keywords}

🎯 中心点：${location}
📏 搜索半径：${radius}米
📊 搜索结果：共找到 ${res.count} 个

按距离排序（前 ${Math.min(10, res.pois.length)} 个）：
${res.pois.slice(0, 10).map((poi, i) =>
  `${i + 1}. ${poi.name}
   📍 地址：${poi.address}
   📞 电话：${poi.business?.tel || '暂无'}
   🗺️ 坐标：${poi.location}
   📏 距离：${poi.distance || '0'}米
`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 类型搜索
  const testTypeSearch = async () => {
    if (!api) {
      Alert.alert('错误', '请先初始化 API');
      return;
    }

    try {
      // 050000 = 餐饮服务
      const res = await api.poi.search('', {
        types: '050000',
        region,
        city_limit: true,
        page_size: 10,
        show_fields: 'children,business,photos',
      });

      setPois(res.pois);
      
      setResult(`
🍴 类型搜索：餐饮服务

📊 搜索结果：共找到 ${res.count} 个

前 ${Math.min(10, res.pois.length)} 个结果：
${res.pois.slice(0, 10).map((poi, i) =>
  `${i + 1}. ${poi.name}
   📍 地址：${poi.address}
   📞 电话：${poi.business?.tel || '暂无'}
   🏷️ 类型：${poi.type}
   🗺️ 坐标：${poi.location}
`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 查看 POI 详情
  const viewPOIDetail = async (poiId: string, poiName: string) => {
    if (!api) {
      Alert.alert('错误', '请先初始化 API');
      return;
    }

    try {
      const res = await api.poi.getDetail(poiId);
      
      if (res.pois && res.pois.length > 0) {
        const poi = res.pois[0];
        const business = poi.business;
        Alert.alert(
          `📍 ${poiName}`,
          `地址：${poi.address}\n电话：${business?.tel || '暂无'}\n类型：${poi.type}\n坐标：${poi.location}${business?.opentime_today ? `\n营业时间：${business.opentime_today}` : ''}${business?.rating ? `\n评分：${business.rating}` : ''}${business?.cost ? `\n人均：${business.cost}元` : ''}`,
          [{ text: '确定' }]
        );
      }
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 POI 搜索示例</Text>

      {/* 初始化 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 初始化 API</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="输入 Web API Key"
          secureTextEntry
        />
        <Button title="初始化" onPress={handleInitialize} />
      </View>

      {/* 关键字搜索参数 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 关键字搜索</Text>
        <TextInput
          style={styles.input}
          value={keywords}
          onChangeText={setKeywords}
          placeholder="搜索关键字（如：肯德基）"
        />
        <TextInput
          style={styles.input}
          value={region}
          onChangeText={setRegion}
          placeholder="搜索区划（如：北京市）"
        />
        <Button
          title="搜索"
          onPress={testKeywordSearch}
          disabled={!api}
        />
        <Text style={styles.hint}>
          💡 在指定城市搜索关键字
        </Text>
      </View>

      {/* 周边搜索参数 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 周边搜索</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="中心点坐标（经度,纬度）"
        />
        <TextInput
          style={styles.input}
          value={radius}
          onChangeText={setRadius}
          placeholder="搜索半径（米）"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={keywords}
          onChangeText={setKeywords}
          placeholder="搜索关键字"
        />
        <Button
          title="搜索周边"
          onPress={testAroundSearch}
          disabled={!api}
        />
        <Text style={styles.hint}>
          💡 搜索指定位置周边的POI，默认：望京
        </Text>
      </View>

      {/* 类型搜索 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. 类型搜索</Text>
        <Button
          title="搜索餐饮服务（050000）"
          onPress={testTypeSearch}
          disabled={!api}
        />
        <Text style={styles.hint}>
          💡 按POI类型搜索，不需要关键字
        </Text>
      </View>

      {/* 结果显示 */}
      {result ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}

      {/* POI 列表 */}
      {pois.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 点击查看详情</Text>
          {pois.map((poi, index) => (
            <TouchableOpacity
              key={poi.id || index}
              style={styles.poiItem}
              onPress={() => viewPOIDetail(poi.id, poi.name)}
            >
              <Text style={styles.poiName}>{poi.name}</Text>
              <Text style={styles.poiAddress}>{poi.address}</Text>
              {poi.distance && (
                <Text style={styles.poiDistance}>📏 {poi.distance}米</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 说明 */}
      <View style={styles.note}>
        <Text style={styles.noteTitle}>📝 POI 搜索说明：</Text>
        <Text style={styles.noteText}>
          • 关键字搜索：在指定区域搜索关键字（无距离信息）{'\n'}
          • 周边搜索：搜索指定坐标周边的POI（按距离排序）{'\n'}
          • 类型搜索：按POI类型码搜索（无距离信息）{'\n'}
          • POI详情：点击列表项查看详情{'\n'}
          • 支持参数：page_size（每页数量）、page_num（页码）{'\n'}
          • show_fields：控制返回字段（children,business,indoor,navi,photos）
        </Text>
      </View>

      <View style={styles.spacer} />
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
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  resultBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    marginBottom: 16,
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
  poiItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  poiName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  poiAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  poiDistance: {
    fontSize: 12,
    color: '#2196F3',
  },
  note: {
    backgroundColor: '#fff3e0',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#E65100',
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  spacer: {
    height: 40,
  },
});