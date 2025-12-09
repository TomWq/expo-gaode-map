import React, { useMemo, useState } from 'react';
import { View, Button, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { GaodeWebAPI, TransitStrategy } from 'expo-gaode-map-web-api';

/**
 * 公交路径规划示例
 * 依赖全局初始化的 Web API Key（在 example/App.tsx 中初始化）
 */
export default function TransitRouteExample() {
  // 起点终点
  const [origin, setOrigin] = useState('116.481028,39.989643'); // 望京
  const [destination, setDestination] = useState('116.397477,39.908692'); // 天安门
  const [city1, setCity1] = useState('010'); // 北京 citycode
  const [city2, setCity2] = useState('010');

  // 结果
  const [result, setResult] = useState('');

  // 全局已初始化 Key，这里直接构造实例；内部会自动解析全局 webKey
  const api = useMemo(() => new GaodeWebAPI({ key: '' }), []);

  // 格式化换乘段信息
  const formatSegments = (segments: any[]) => {
    let stepNum = 0;
    return segments.map((seg) => {
      const parts = [];
      
      // 处理步行段
      if (seg.walking) {
        stepNum++;
        const walkCost = seg.walking.cost || {};
        const duration = walkCost.duration ? Math.floor(parseInt(walkCost.duration) / 60) : 0;
        parts.push(`${stepNum}. 🚶 步行 ${seg.walking.distance}米（约${duration}分钟）`);
      }
      
      // 处理公交/地铁段
      if (seg.bus) {
        stepNum++;
        const line = seg.bus.buslines[0];
        const lineCost = line.cost || {};
        const duration = lineCost.duration ? Math.floor(parseInt(lineCost.duration) / 60) : 0;
        const type = line.type?.includes('地铁') ? '🚇' : '🚌';
        parts.push(`${stepNum}. ${type} ${line.name}\n   ${line.departure_stop.name} → ${line.arrival_stop.name}\n   途经${line.via_num}站 | ${duration}分钟`);
      } else if (seg.railway) {
        stepNum++;
        const line = seg.railway.buslines[0];
        const lineCost = line.cost || {};
        const duration = lineCost.duration ? Math.floor(parseInt(lineCost.duration) / 60) : 0;
        parts.push(`${stepNum}. 🚇 ${line.name}\n   ${line.departure_stop.name} → ${line.arrival_stop.name}\n   途经${line.via_num}站 | ${duration}分钟`);
      }
      
      return parts.join('\n');
    }).filter(Boolean).join('\n');
  };

  // 策略 0：推荐模式
  const testRecommended = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.RECOMMENDED,
        show_fields: 'cost',
      });

      if (res.route.transits.length === 0) {
        Alert.alert('提示', '未找到公交路线');
        return;
      }

      const transit = res.route.transits[0];
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';

      console.log('换乘方案：', JSON.stringify(transit.segments));
      
      setResult(`
🚌 推荐模式（策略0）

💰 总费用：${fee} 元
⏱️ 总时间：${duration} 分钟
🚶 步行距离：${transit.walking_distance}米
🌙 夜班车：${transit.nightflag === '1' ? '是' : '否'}

💡 特点：综合权重，同高德APP默认

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 1：最经济模式
  const testCheapest = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.CHEAPEST,
        show_fields: 'cost',
      });

      const transit = res.route.transits[0];
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 最经济模式（策略1）

💰 总费用：${fee} 元（票价最低）
⏱️ 总时间：${duration} 分钟
🚶 步行距离：${transit.walking_distance}米

💡 特点：选择票价最低的路线

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 2：最少换乘模式
  const testLeastTransfer = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.LEAST_TRANSFER,
        show_fields: 'cost',
      });

      const transit = res.route.transits[0];
      const busSegments = transit.segments.filter((seg: any) => seg.bus || seg.railway);
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 最少换乘模式（策略2）

💰 总费用：${fee} 元
⏱️ 总时间：${duration} 分钟
🚶 步行距离：${transit.walking_distance}米
🔄 换乘次数：${busSegments.length - 1}次

💡 特点：尽量减少换乘次数

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 3：最少步行模式
  const testLeastWalk = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.LEAST_WALK,
        show_fields: 'cost',
      });

      const transit = res.route.transits[0];
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 最少步行模式（策略3）

💰 总费用：${fee} 元
⏱️ 总时间：${duration} 分钟
🚶 步行距离：${transit.walking_distance}米（最少）

💡 特点：尽可能减少步行距离

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 5：不乘地铁模式
  const testNoSubway = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.NO_SUBWAY,
        show_fields: 'cost',
      });

      const transit = res.route.transits[0];
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 不乘地铁模式（策略5）

💰 总费用：${fee} 元
⏱️ 总时间：${duration} 分钟
🚶 步行距离：${transit.walking_distance}米

💡 特点：只乘坐公交车，不乘地铁

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 7：地铁优先模式
  const testSubwayFirst = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.SUBWAY_FIRST,
        show_fields: 'cost',
      });

      const transit = res.route.transits[0];
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 地铁优先模式（策略7）

💰 总费用：${fee} 元
⏱️ 总时间：${duration} 分钟
🚶 步行距离：${transit.walking_distance}米

💡 特点：优先选择地铁（步行不超过4KM）

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 8：时间短模式
  const testTimeFirst = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.TIME_FIRST,
        show_fields: 'cost',
      });

      const transit = res.route.transits[0];
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 时间短模式（策略8）

💰 总费用：${fee} 元
⏱️ 总时间：${duration} 分钟（最短）
🚶 步行距离：${transit.walking_distance}米

💡 特点：方案花费总时间最少

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 多方案对比
  const testMultipleRoutes = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.RECOMMENDED,
        AlternativeRoute: 3, // 返回3个方案
        show_fields: 'cost',
      });

      // 调试信息
      let debugInfo = `总方案数: ${res.route.transits.length}\n\n`;
      
      const routesText = res.route.transits.slice(0, 3).map((transit, i) => {
        const busCount = transit.segments.filter((seg: any) => seg.bus || seg.railway).length;
        const costInfo = transit.cost as any;
        
        // 添加调试信息
        debugInfo += `方案${i + 1} 原始数据:\n`;
        debugInfo += `- cost对象: ${JSON.stringify(costInfo)}\n`;
        debugInfo += `- cost类型: ${typeof costInfo}\n`;
        debugInfo += `- duration: ${costInfo?.duration}\n`;
        debugInfo += `- transit_fee: ${costInfo?.transit_fee}\n`;
        debugInfo += `- walking_distance: ${transit.walking_distance}\n\n`;
        
        const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
        const fee = costInfo?.transit_fee || '0';
        
        return `方案${i + 1}：${fee}元 | ${duration}分钟 | 步行${transit.walking_distance}米 | ${busCount}段乘车`;
      }).join('\n');

      setResult(`
🚌 多方案对比（3个方案）

${routesText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 调试信息:
${debugInfo}
💡 提示：选择最适合您的方案
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🚌 公交路径规划示例</Text>

      {/* 起点终点 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 设置起点终点</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={origin}
            onChangeText={setOrigin}
            placeholder="起点坐标（经度,纬度）"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={destination}
            onChangeText={setDestination}
            placeholder="终点坐标（经度,纬度）"
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={city1}
            onChangeText={setCity1}
            placeholder="起点城市码"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={city2}
            onChangeText={setCity2}
            placeholder="终点城市码"
          />
        </View>
        <Text style={styles.hint}>
          💡 默认：望京 → 天安门（citycode: 010）
        </Text>
      </View>

      {/* 基础策略 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 基础策略</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title="策略0：推荐模式"
            onPress={testRecommended}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="策略1：最经济"
            onPress={testCheapest}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="策略2：最少换乘"
            onPress={testLeastTransfer}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="策略3：最少步行"
            onPress={testLeastWalk}
          />
        </View>
      </View>

      {/* 地铁相关策略 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 地铁相关策略</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title="策略5：不乘地铁"
            onPress={testNoSubway}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="策略7：地铁优先"
            onPress={testSubwayFirst}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="策略8：时间短"
            onPress={testTimeFirst}
          />
        </View>
      </View>

      {/* 多方案 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. 多方案对比</Text>
        
        <Button
          title="返回3个方案对比"
          onPress={testMultipleRoutes}
        />
        
        <Text style={styles.hint}>
          💡 AlternativeRoute: 1-10
        </Text>
      </View>

      {/* 结果显示 */}
      {result ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}

      {/* 说明 */}
      <View style={styles.note}>
        <Text style={styles.noteTitle}>📝 新版 V5 API 说明：</Text>
        <Text style={styles.noteText}>
          • city1/city2 为必填参数（使用citycode）{'\n'}
          • 新增策略6（地铁图）、7（地铁优先）、8（时间短）{'\n'}
          • AlternativeRoute 可返回1-10个方案{'\n'}
          • multiexport 控制地铁出入口数量{'\n'}
          • 支持 originpoi/destinationpoi 提升准确性{'\n'}
          • 支持 date/time 参数规划指定时间的路线{'\n'}
          • 北京citycode: 010, 上海: 021, 广州: 020
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
  buttonGroup: {
    gap: 8,
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