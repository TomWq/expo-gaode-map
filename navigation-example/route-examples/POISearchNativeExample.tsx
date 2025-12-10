import React, { useState } from 'react';
import { View, Button, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { searchPOI, searchNearby, getInputTips, type POI, type InputTip } from 'expo-gaode-map-search';

/**
 * POI 原生搜索示例
 * 使用 expo-gaode-map-search 原生模块进行搜索
 */
export default function POISearchNativeExample() {
  // 搜索参数
  const [keywords, setKeywords] = useState('肯德基');
  const [city, setCity] = useState('北京');
  const [location, setLocation] = useState('116.481028,39.989643'); // 望京
  const [radius, setRadius] = useState('1000');
  
  // 结果
  const [result, setResult] = useState('');
  const [pois, setPois] = useState<POI[]>([]);
  const [tips, setTips] = useState<InputTip[]>([]);

  // 关键字搜索
  const testKeywordSearch = async () => {
    try {
      const res = await searchPOI({
        keyword: keywords,
        city: city,
        pageSize: 20,
        pageNum: 1,
      });

      setPois(res.pois);
      
      setResult(`
🔍 关键字搜索：${keywords}

📊 搜索结果：共找到 ${res.total} 个
📄 当前页：${res.pageNum}/${res.pageCount}

前 ${Math.min(10, res.pois.length)} 个结果：
${res.pois.slice(0, 10).map((poi, i) =>
  `${i + 1}. ${poi.name}
   📍 地址：${poi.address}
   📞 电话：${poi.tel || '暂无'}
   🗺️ 坐标：${poi.location.latitude},${poi.location.longitude}
   🏷️ 类型：${poi.typeDes}
`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 周边搜索
  const testAroundSearch = async () => {
    try {
      const [lng, lat] = location.split(',').map(Number);
      const res = await searchNearby({
        keyword: keywords,
        center: { latitude: lat, longitude: lng },
        radius: parseInt(radius),
        pageSize: 20,
        pageNum: 1,
      });

      setPois(res.pois);
      
      setResult(`
📍 周边搜索：${keywords}

🎯 中心点：${location}
📏 搜索半径：${radius}米
📊 搜索结果：共找到 ${res.total} 个

按距离排序（前 ${Math.min(10, res.pois.length)} 个）：
${res.pois.slice(0, 10).map((poi, i) =>
  `${i + 1}. ${poi.name}
   📍 地址：${poi.address}
   📞 电话：${poi.tel || '暂无'}
   🗺️ 坐标：${poi.location.latitude},${poi.location.longitude}
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
    try {
      // 050000 = 餐饮服务
      const res = await searchPOI({
        keyword: '',
        city: city,
        types: '050000',
        pageSize: 20,
        pageNum: 1,
      });

      setPois(res.pois);
      
      setResult(`
🍴 类型搜索：餐饮服务

📊 搜索结果：共找到 ${res.total} 个

前 ${Math.min(10, res.pois.length)} 个结果：
${res.pois.slice(0, 10).map((poi, i) =>
  `${i + 1}. ${poi.name}
   📍 地址：${poi.address}
   📞 电话：${poi.tel || '暂无'}
   🏷️ 类型：${poi.typeDes}
   🗺️ 坐标：${poi.location.latitude},${poi.location.longitude}
`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 输入提示
  const testInputTips = async () => {
    try {
      const res = await getInputTips({
        keyword: keywords,
        city: city,
      });

      setTips(res.tips);
      
      setResult(`
💡 输入提示：${keywords}

📊 提示结果：共 ${res.tips.length} 个

${res.tips.map((tip, i) =>
  `${i + 1}. ${tip.name}
   📍 地址：${tip.address}
   🏙️ 城市：${tip.cityName || '暂无'}
   🗺️ 区域：${tip.adName || '暂无'}
`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 查看 POI 详情
  const viewPOIDetail = (poi: POI) => {
    Alert.alert(
      `📍 ${poi.name}`,
      `地址：${poi.address}\n电话：${poi.tel || '暂无'}\n类型：${poi.typeDes}\n坐标：${poi.location.latitude},${poi.location.longitude}\n城市：${poi.cityName || '暂无'}`,
      [{ text: '确定' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 POI 原生搜索示例</Text>
      <Text style={styles.subtitle}>使用 expo-gaode-map-search 模块</Text>

      {/* 关键字搜索参数 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 关键字搜索</Text>
        <TextInput
          style={styles.input}
          value={keywords}
          onChangeText={setKeywords}
          placeholder="搜索关键字（如：肯德基）"
        />
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="城市（如：北京）"
        />
        <Button
          title="搜索"
          onPress={testKeywordSearch}
        />
        <Text style={styles.hint}>
          💡 使用原生 searchPOI() 在指定城市搜索关键字
        </Text>
      </View>

      {/* 周边搜索参数 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 周边搜索</Text>
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
        />
        <Text style={styles.hint}>
          💡 使用原生 searchNearby() 搜索指定位置周边的POI
        </Text>
      </View>

      {/* 类型搜索 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 类型搜索</Text>
        <Button
          title="搜索餐饮服务（050000）"
          onPress={testTypeSearch}
        />
        <Text style={styles.hint}>
          💡 使用原生 searchPOI() 按POI类型搜索
        </Text>
      </View>

      {/* 输入提示 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. 输入提示</Text>
        <Button
          title="获取输入提示"
          onPress={testInputTips}
        />
        <Text style={styles.hint}>
          💡 使用原生 getInputTips() 获取搜索建议
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
              onPress={() => viewPOIDetail(poi)}
            >
              <Text style={styles.poiName}>{poi.name}</Text>
              <Text style={styles.poiAddress}>{poi.address}</Text>
              {poi.distance !== undefined && (
                <Text style={styles.poiDistance}>📏 {poi.distance}米</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 提示列表 */}
      {tips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 输入提示列表</Text>
          {tips.map((tip, index) => (
            <View key={tip.id || index} style={styles.tipItem}>
              <Text style={styles.tipName}>{tip.name}</Text>
              <Text style={styles.tipAddress}>{tip.address}</Text>
              {tip.cityName && (
                <Text style={styles.tipCity}>🏙️ {tip.cityName}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* 说明 */}
      <View style={styles.note}>
        <Text style={styles.noteTitle}>📝 原生搜索说明：</Text>
        <Text style={styles.noteText}>
          • searchPOI：关键字搜索，支持城市限定{'\n'}
          • searchNearby：周边搜索，返回距离信息{'\n'}
          • searchAlong：沿途搜索（需要路线坐标）{'\n'}
          • searchPolygon：多边形区域搜索{'\n'}
          • getInputTips：输入提示（自动补全）{'\n'}
          • 所有方法都是原生实现，性能更好{'\n'}
          • 支持分页、类型过滤等高级功能
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
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
  tipItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff9e6',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  tipName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tipAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  tipCity: {
    fontSize: 12,
    color: '#FF9800',
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