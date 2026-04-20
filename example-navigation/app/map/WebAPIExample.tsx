import React, { useState } from 'react';
import { View, Button, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

import { EXAMPLE_WEB_API_KEY } from '../../exampleConfig';

/**
 * 高德地图 Web API 逆地理编码示例
 */
export default function WebAPIExample() {
  const [apiKey, setApiKey] = useState(EXAMPLE_WEB_API_KEY);
  const [api, setApi] = useState<GaodeWebAPI | null>(null);
  
  // 逆地理编码
  const [longitude, setLongitude] = useState('116.481028');
  const [latitude, setLatitude] = useState('39.989643');
  const [regeocodeResult, setRegeocodeResult] = useState('');
  
  // 地理编码
  const [address, setAddress] = useState('北京市朝阳区阜通东大街6号');
  const [geocodeResult, setGeocodeResult] = useState('');

  // 初始化 API
  const handleInitialize = () => {
    const effectiveKey = apiKey.trim() || EXAMPLE_WEB_API_KEY;
    if (!effectiveKey) {
      Alert.alert('缺少 Web API Key', '请先在 exampleConfig.ts 或环境变量里提供 key。');
      return;
    }

    const newApi = new GaodeWebAPI({ key: effectiveKey });
    setApi(newApi);
    Alert.alert(
      '成功',
      'Web API 实例已按当前 Key 初始化'
    );
  };

  // 测试逆地理编码
  const handleRegeocode = async () => {
    if (!api) {
      Alert.alert('错误', '请先初始化 API');
      return;
    }

    try {
      const result = await api.geocode.regeocode(`${longitude},${latitude}`, {
        extensions: 'all',
      });

      const info = result.regeocode;
      const addr = info.addressComponent;
      const resultText = `
📍 结构化地址：
${info.formatted_address}

🏢 地址组成：
国家：${addr.country || '-'}
省份：${addr.province || '-'}
城市：${addr.city || '直辖市'}
区县：${addr.district || '-'}
乡镇/街道：${addr.township || '-'}
街道名：${addr.street || '-'}
门牌号：${addr.number || '-'}
${addr.towncode ? `街道编码：${addr.towncode}` : ''}

${info.pois && info.pois.length > 0 ? `
🏪 附近POI（前5个）：
${info.pois.slice(0, 5).map((poi, i) => 
  `${i + 1}. ${poi.name}\n   类型：${poi.type}\n   距离：${poi.distance}米`
).join('\n')}
` : ''}

${info.roads && info.roads.length > 0 ? `
🛣️ 附近道路（前3条）：
${info.roads.slice(0, 3).map((road, i) => 
  `${i + 1}. ${road.name} - ${road.distance}米`
).join('\n')}
` : ''}
      `.trim();

      setRegeocodeResult(resultText);
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 测试地理编码
  const handleGeocode = async () => {
    if (!api) {
      Alert.alert('错误', '请先初始化 API');
      return;
    }

    try {
      const result = await api.geocode.geocode(address);

      if (result.geocodes.length === 0) {
        Alert.alert('提示', '未找到该地址');
        return;
      }

      const resultText = `
找到 ${result.count} 个结果：

${result.geocodes.map((geocode, i) => `
--- 结果 ${i + 1} ---
📍 地址：${geocode.formatted_address}
🌍 坐标：${geocode.location}
📊 匹配级别：${geocode.level}
🏛️ 行政区：
   省份：${geocode.province}
   城市：${geocode.city}
   区县：${geocode.district}
   区域码：${geocode.adcode}
`).join('\n')}
      `.trim();

      setGeocodeResult(resultText);
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 批量逆地理编码测试
  const handleBatchRegeocode = async () => {
    if (!api) {
      Alert.alert('错误', '请先初始化 API');
      return;
    }

    try {
      const locations = [
        '116.481028,39.989643', // 北京望京
        '116.434446,39.90816',  // 北京天安门
        '121.472644,31.231706', // 上海外滩
      ];

      const result = await api.geocode.batchRegeocode(locations);
      
      Alert.alert(
        '批量逆地理编码',
        '请查看控制台输出',
        [{ text: '确定' }]
      );
      
      console.log('批量逆地理编码结果：', JSON.stringify(result.regeocodes));
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>高德地图 Web API 测试</Text>

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
        <Text style={styles.hint}>
          💡 提示：如果你已经在示例入口配置了 `EXPO_PUBLIC_AMAP_WEB_KEY`，这里可以直接点初始化。
        </Text>
      </View>

      {/* 逆地理编码 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 逆地理编码（坐标 → 地址）</Text>
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
        <Button
          title="查询地址"
          onPress={handleRegeocode}
          // disabled={!api}
        />
        
        {regeocodeResult ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{regeocodeResult}</Text>
          </View>
        ) : null}
      </View>

      {/* 地理编码 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 地理编码（地址 → 坐标）</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="输入地址"
        />
        <Button
          title="查询坐标"
          onPress={handleGeocode}
          // disabled={!api}
        />
        
        {geocodeResult ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{geocodeResult}</Text>
          </View>
        ) : null}
      </View>

      {/* 高级功能 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. 高级功能</Text>
        <Button
          title="批量逆地理编码"
          onPress={handleBatchRegeocode}
          // disabled={!api}
        />
      </View>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>📝 使用说明：</Text>
        <Text style={styles.noteText}>
          1. Web API Key 与移动端 Key 不同，需单独申请{'\n'}
          2. 个人开发者每天有30万次免费额度{'\n'}
          3. 坐标格式：经度在前，纬度在后{'\n'}
          4. extensions=all 可获取更详细信息{'\n'}
          5. 需要网络连接，无法离线使用
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
