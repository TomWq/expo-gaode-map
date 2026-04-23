import { useSafeScrollViewStyle } from './hooks/useSafeScrollView';
import { GaodeWebAPI, InputTip } from 'expo-gaode-map-web-api';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

/**
 * 输入提示示例
 * 依赖全局初始化的 Web API Key（在 example/App.tsx 中初始化）
 */
export default function InputTipsExample() {
  // 全局已初始化 Key，这里直接构造实例；内部会自动解析全局 webKey
  const api = useMemo(() => new GaodeWebAPI(), []);

  // 搜索参数
  const [keywords, setKeywords] = useState('');
  const [city, setCity] = useState('北京');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('116.481028,39.989643'); // 望京
  
  // 结果
  const [result, setResult] = useState('');
  const [tips, setTips] = useState<InputTip[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 基础输入提示
  const testBasicTips = async () => {
    if (!keywords.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.inputTips.getTips(keywords, {
        city,
      });

      setTips(res.tips);
      
      setResult(`
🔍 搜索关键词：${keywords}
📍 搜索城市：${city}

📊 找到 ${res.count} 个建议：
${res.tips.slice(0, 10).map((tip, i) =>
  `${i + 1}. ${tip.name}
   📍 ${tip.district}
   🏷️ ID: ${tip.id}
   ${tip.address ? `📮 地址: ${tip.address}` : ''}
   ${tip.location ? `🗺️ 坐标: ${tip.location}` : ''}
`
).join('\n')}
${res.tips.length > 10 ? `\n... 还有 ${parseInt(res.count) - 10} 个结果` : ''}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSearching(false);
    }
  };

  // POI 类型提示
  const testPOITips = async () => {
    if (!keywords.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.inputTips.getPOITips(keywords, {
        city,
        type: type || undefined,
      });

      setTips(res.tips);
      
      setResult(`
🏢 POI 搜索：${keywords}
${type ? `🏷️ 类型限制：${type}` : ''}

📊 找到 ${res.count} 个 POI 建议：
${res.tips.slice(0, 10).map((tip, i) =>
  `${i + 1}. ${tip.name}
   📍 ${tip.district}
   ${tip.address ? `📮 ${tip.address}` : ''}
   ${tip.location ? `🗺️ ${tip.location}` : ''}
`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSearching(false);
    }
  };

  // 公交站点提示
  const testBusTips = async () => {
    if (!keywords.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.inputTips.getBusTips(keywords, {
        city,
      });

      setTips(res.tips);
      
      setResult(`
🚏 公交站点搜索：${keywords}

📊 找到 ${res.count} 个站点：
${res.tips.slice(0, 10).map((tip, i) =>
  `${i + 1}. ${tip.name}
   📍 ${tip.district}
   ${tip.location ? `🗺️ ${tip.location}` : ''}
`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSearching(false);
    }
  };

  // 公交线路提示
  const testBuslineTips = async () => {
    if (!keywords.trim()) {
      Alert.alert('提示', '请输入搜索关键词（如：1路）');
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.inputTips.getBuslineTips(keywords, {
        city,
      });

      setTips(res.tips);
      
      setResult(`
🚌 公交线路搜索：${keywords}

📊 找到 ${res.count} 条线路：
${res.tips.slice(0, 10).map((tip, i) =>
  `${i + 1}. ${tip.name}
   📍 ${tip.district}
`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSearching(false);
    }
  };

  // 位置优先提示
  const testLocationPriorityTips = async () => {
    if (!keywords.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.inputTips.getTips(keywords, {
        city,
        location,
      });

      setTips(res.tips);
      
      setResult(`
📍 位置优先搜索：${keywords}
🎯 优先位置：${location}

📊 找到 ${res.count} 个建议（按距离优先）：
${res.tips.slice(0, 10).map((tip, i) =>
  `${i + 1}. ${tip.name}
   📍 ${tip.district}
   ${tip.location ? `🗺️ ${tip.location}` : ''}
`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSearching(false);
    }
  };

  // 查看提示详情
  const viewTipDetail = (tip: InputTip) => {
    Alert.alert(
      tip.name,
      `ID: ${tip.id}\n区域: ${tip.district}\nAdcode: ${tip.adcode}${tip.address ? `\n地址: ${tip.address}` : ''}${tip.location ? `\n坐标: ${tip.location}` : ''}${tip.typecode ? `\n类型码: ${tip.typecode}` : ''}`,
      [{ text: '确定' }]
    );
  };


   const contentStyle = useSafeScrollViewStyle(styles.container);

  return (
    <ScrollView style={contentStyle}>

      {/* 搜索参数 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 搜索参数</Text>
        <TextInput
          style={styles.input}
          value={keywords}
          onChangeText={setKeywords}
          placeholder="搜索关键词（如：肯德基、天安门）"
        />
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="城市（如：北京、010、110000）"
        />
        <TextInput
          style={styles.input}
          value={type}
          onChangeText={setType}
          placeholder="POI 类型（可选，如：050000）"
        />
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="优先位置（可选）"
        />
      </View>

      {/* 搜索功能 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 搜索功能</Text>
        
        <Button
          title={isSearching ? "🔍 搜索中…" : "🔍 基础搜索"}
          onPress={testBasicTips}
          disabled={isSearching}
        />
        <View style={styles.buttonSpacer} />
        
        <Button
          title={isSearching ? "🏢 搜索中…" : "🏢 POI 提示"}
          onPress={testPOITips}
          disabled={isSearching}
          color="#4CAF50"
        />
        <View style={styles.buttonSpacer} />
        
        <Button
          title={isSearching ? "🚏 搜索中…" : "🚏 公交站点"}
          onPress={testBusTips}
          disabled={isSearching}
          color="#FF9800"
        />
        <View style={styles.buttonSpacer} />
        
        <Button
          title={isSearching ? "🚌 搜索中…" : "🚌 公交线路"}
          onPress={testBuslineTips}
          disabled={isSearching}
          color="#9C27B0"
        />
        <View style={styles.buttonSpacer} />
        
        <Button
          title={isSearching ? "📍 搜索中…" : "📍 位置优先"}
          onPress={testLocationPriorityTips}
          disabled={isSearching}
          color="#2196F3"
        />
        
        <Text style={styles.hint}>
          💡 输入关键词后点击上方按钮查看建议
        </Text>
      </View>

      {/* 结果显示 / 加载中 */}
      {isSearching ? (
        <View style={styles.resultBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={[styles.resultText, { marginLeft: 8, color: '#666' }]}>正在搜索，请稍候...</Text>
          </View>
        </View>
      ) : result ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}

      {/* 提示列表 */}
      {tips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 点击查看详情</Text>
          {tips.map((tip, index) => (
            <TouchableOpacity
              key={tip.id || index}
              style={styles.tipItem}
              onPress={() => viewTipDetail(tip)}
            >
              <Text style={styles.tipName}>{tip.name}</Text>
              <Text style={styles.tipDistrict}>{tip.district}</Text>
              {tip.address && (
                <Text style={styles.tipAddress}>{tip.address}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 说明 */}
      <View style={styles.note}>
        <Text style={styles.noteTitle}>📝 使用说明：</Text>
        <Text style={styles.noteText}>
          • 基础搜索：返回所有类型的建议（POI、公交站、公交线路）{'\n'}
          • POI 提示：仅返回 POI 类型的建议{'\n'}
          • 公交站点：仅返回公交站点的建议{'\n'}
          • 公交线路：仅返回公交线路的建议{'\n'}
          • 位置优先：在指定位置附近优先返回建议{'\n'}
          • type 参数：可以指定 POI 分类代码（如：050000=餐饮服务）{'\n'}
          • 点击列表项查看详细信息
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
    marginTop: 12,
    fontStyle: 'italic',
  },
  buttonSpacer: {
    height: 8,
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
  tipItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  tipName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tipDistrict: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  tipAddress: {
    fontSize: 11,
    color: '#999',
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
