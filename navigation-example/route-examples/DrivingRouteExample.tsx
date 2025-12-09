import React, { useState, useMemo } from 'react';
import { View, Button, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { GaodeWebAPI, DrivingStrategy } from 'expo-gaode-map-web-api';

/**
 * 驾车路径规划示例
 * 展示新版 V5 API 的各种策略和参数
 */
export default function DrivingRouteExample() {
  const api = useMemo(() => new GaodeWebAPI({ key: '' }), []);
  
  // 起点终点
  const [origin, setOrigin] = useState('116.481028,39.989643'); // 望京
  const [destination, setDestination] = useState('116.397477,39.908692'); // 天安门
  
  // 结果
  const [result, setResult] = useState('');


  // 策略 32：速度优先（默认）
  const testSpeedFirst = async () => {
    try {
      const res = await api.route.driving(origin, destination, {
        strategy: DrivingStrategy.DEFAULT,
        show_fields: 'cost,polyline',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚗 速度优先（策略32）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
💰 过路费：${cost?.tolls || '0'} 元
🚦 红绿灯：${cost?.traffic_lights || '0'} 个
🚫 限行：${path.restriction === '0' ? '未限行' : '限行'}

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 33：躲避拥堵
  const testAvoidJam = async () => {
    try {
      const res = await api.route.driving(origin, destination, {
        strategy: DrivingStrategy.AVOID_JAM,
        show_fields: 'cost,polyline',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚗 躲避拥堵（策略33）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
💰 过路费：${cost?.tolls || '0'} 元
🚦 红绿灯：${cost?.traffic_lights || '0'} 个

💡 特点：根据实时路况躲避拥堵路段

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 34：高速优先
  const testHighwayFirst = async () => {
    try {
      const res = await api.route.driving(origin, destination, {
        strategy: DrivingStrategy.HIGHWAY_FIRST, // 高速优先（策略34）
        show_fields: 'cost',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚗 高速优先（策略34）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
💰 过路费：${cost?.tolls || '0'} 元

💡 特点：优先选择高速公路

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 35：不走高速
  const testAvoidHighway = async () => {
    try {
      const res = await api.route.driving(origin, destination, {
        strategy: DrivingStrategy.NO_HIGHWAY,
        show_fields: 'cost',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚗 不走高速（策略35）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
💰 过路费：${cost?.tolls || '0'} 元（应该为0）

💡 特点：完全避开高速公路

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 新能源车（纯电）
  const testElectricCar = async () => {
    try {
      const res = await api.route.driving(origin, destination, {
        strategy: DrivingStrategy.DEFAULT,
        cartype: 1, // 纯电动车
        show_fields: 'cost',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🔋 纯电动车路径规划

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
💰 过路费：${cost?.tolls || '0'} 元

💡 特点：考虑电动车特性，如充电站位置

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 避免收费
  const testAvoidFee = async () => {
    try {
      const res = await api.route.driving(origin, destination, {
        strategy: DrivingStrategy.LESS_TOLL,
        show_fields: 'cost',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚗 少收费（策略36）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
💰 过路费：${cost?.tolls || '0'} 元（尽量为0）

💡 特点：尽量避开收费路段

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🚗 驾车路径规划示例</Text>

      {/* 起点终点 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 设置起点终点</Text>
        <TextInput
          style={styles.input}
          value={origin}
          onChangeText={setOrigin}
          placeholder="起点坐标（经度,纬度）"
        />
        <TextInput
          style={styles.input}
          value={destination}
          onChangeText={setDestination}
          placeholder="终点坐标（经度,纬度）"
        />
        <Text style={styles.hint}>
          💡 默认：望京 → 天安门
        </Text>
      </View>

      {/* 策略测试 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 测试不同策略</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title="策略32：速度优先（默认）"
            onPress={testSpeedFirst}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="策略33：躲避拥堵"
            onPress={testAvoidJam}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="策略34：高速优先"
            onPress={testHighwayFirst}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="策略35：不走高速"
            onPress={testAvoidHighway}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="策略36：避免收费"
            onPress={testAvoidFee}
          />
        </View>
      </View>

      {/* 车辆类型测试 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. 车辆类型</Text>
        
        <Button
          title="🔋 纯电动车路径"
          onPress={testElectricCar}
        />
        
        <Text style={styles.hint}>
          💡 cartype: 0=燃油 1=纯电 2=插混
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
          • 策略编号从32-45（旧版0-9已废弃）{'\n'}
          • 支持 show_fields 控制返回字段{'\n'}
          • 支持车牌号（plate）避开限行{'\n'}
          • 支持车辆类型（cartype）{'\n'}
          • 支持轮渡控制（ferry）{'\n'}
          • 支持 POI ID 提升准确性
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