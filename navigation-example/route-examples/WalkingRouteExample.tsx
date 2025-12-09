import React, { useState, useMemo } from 'react';
import { View, Button, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

/**
 * 步行路径规划示例
 * 展示新版 V5 API 的各种参数
 */
export default function WalkingRouteExample() {
  const api = useMemo(() => new GaodeWebAPI({ key: '' }), []);
  
  // 起点终点
  const [origin, setOrigin] = useState('116.481028,39.989643'); // 望京
  const [destination, setDestination] = useState('116.484527,39.990893'); // 望京附近
  
  // 结果
  const [result, setResult] = useState('');


  // 单条路线
  const testSingleRoute = async () => {
    try {
      const res = await api.route.walking(origin, destination, {
        show_fields: 'cost', // 返回时间和打车费用
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      // 输出完整数据供调试
      console.log('=== 单条路线 API 返回数据 ===');
      console.log('完整响应:', JSON.stringify(res, null, 2));
      console.log('path.taxi:', path.taxi);
      console.log('path.cost:', cost);
      
      setResult(`
🚶 步行路径规划（单条路线）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
🚕 打车费用：约${path.taxi || '未知'} 元

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 多备选路线（2条）
  const testTwoRoutes = async () => {
    try {
      const res = await api.route.walking(origin, destination, {
        alternative_route: 2, // 返回2条路线
        show_fields: 'cost',
      });

      // 输出完整数据供调试
      console.log('=== 2条备选路线 API 返回数据 ===');
      console.log('完整响应:', JSON.stringify(res, null, 2));
      res.route.paths.forEach((p, i) => {
        console.log(`路线${i + 1} - path.taxi:`, p.taxi);
        console.log(`路线${i + 1} - path.cost:`, p.cost);
      });

      const routeText = res.route.paths.map((path, i) => {
        const cost = path.cost;
        return `
--- 路线 ${i + 1} ---
📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
🚕 打车费用：约${path.taxi || 'API未返回'} 元

导航步骤：
${path.steps.map((step, j) =>
  `${j + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `;
      }).join('\n');

      setResult(`
🚶 步行路径规划（2条备选路线）

${routeText}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 多备选路线（3条）
  const testThreeRoutes = async () => {
    try {
      const res = await api.route.walking(origin, destination, {
        alternative_route: 3, // 返回3条路线
        show_fields: 'cost',
      });

      // 输出完整数据供调试
      console.log('=== 3条备选路线 API 返回数据 ===');
      console.log('完整响应:', JSON.stringify(res, null, 2));
      res.route.paths.forEach((p, i) => {
        console.log(`路线${i + 1} - path.taxi:`, p.taxi);
      });

      const routeText = res.route.paths.map((path, i) => {
        const cost = path.cost;
        return `
路线${i + 1}：${(parseInt(path.distance) / 1000).toFixed(2)}公里 | ${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + '分钟' : '未返回'} | 打车约${path.taxi || 'API未返回'}元
      `;
      }).join('');

      setResult(`
🚶 步行路径规划（3条备选路线）

${routeText}

💡 提示：选择最适合您的路线
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 详细导航信息（包含 navi）
  const testDetailedNavi = async () => {
    try {
      const res = await api.route.walking(origin, destination, {
        show_fields: 'cost,navi',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      // 输出完整数据供调试
      console.log('=== 详细导航 API 返回数据 ===');
      console.log('完整响应:', JSON.stringify(res, null, 2));
      console.log('path.taxi:', path.taxi);
      
      setResult(`
🚶 步行路径规划（详细导航）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
🚕 打车费用：约${path.taxi || 'API未返回'} 元

详细导航：
${path.steps.map((step, i) => {
  let text = `${i + 1}. ${step.instruction} (${step.step_distance}米)`;
  if (step.action) {
    text += `\n   动作：${step.action}`;
  }
  if (step.assistant_action) {
    text += `\n   辅助：${step.assistant_action}`;
  }
  if (step.walk_type) {
    const walkTypes: Record<string, string> = {
      '0': '普通道路', '1': '人行横道', '3': '地下通道', '4': '过街天桥',
      '5': '地铁通道', '20': '阶梯', '21': '斜坡', '22': '桥', '23': '隧道'
    };
    text += `\n   道路类型：${walkTypes[step.walk_type] || step.walk_type}`;
  }
  return text;
}).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 室内算路
  const testIndoorRoute = async () => {
    try {
      const res = await api.route.walking(origin, destination, {
        isindoor: 1, // 启用室内算路
        show_fields: 'cost,navi',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      // 输出完整数据供调试
      console.log('=== 室内算路 API 返回数据 ===');
      console.log('完整响应:', JSON.stringify(res, null, 2));
      console.log('path.taxi:', path.taxi);
      
      setResult(`
🚶 步行路径规划（室内算路）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
🚕 打车费用：约${path.taxi || 'API未返回'} 元

💡 特点：包含室内路径规划（如商场、地铁站内部）

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 长距离步行（望京 → 天安门）
  const testLongDistance = async () => {
    try {
      const res = await api.route.walking(
        '116.481028,39.989643', // 望京
        '116.397477,39.908692', // 天安门
        {
          alternative_route: 2,
          show_fields: 'cost',
        }
      );

      const path = res.route.paths[0];
      const cost = path.cost;
      
      // 输出完整数据供调试
      console.log('=== 长距离步行 API 返回数据 ===');
      console.log('完整响应:', JSON.stringify(res, null, 2));
      console.log('path.taxi:', path.taxi);
      console.log('path.cost:', cost);
      
      setResult(`
🚶 步行路径规划（长距离）

起点：望京
终点：天安门

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
🚕 建议打车费用：约${path.taxi || 'API未返回'} 元

⚠️ 距离较长，建议选择公共交通或打车

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
      <Text style={styles.title}>🚶 步行路径规划示例</Text>


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
          💡 默认：望京附近短途步行
        </Text>
      </View>

      {/* 基础测试 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 基础路径规划</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title="单条路线"
            onPress={testSingleRoute}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="2条备选路线"
            onPress={testTwoRoutes}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="3条备选路线"
            onPress={testThreeRoutes}
          />
        </View>
      </View>

      {/* 高级功能 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. 高级功能</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title="详细导航信息"
            onPress={testDetailedNavi}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="室内算路"
            onPress={testIndoorRoute}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title="长距离步行（望京→天安门）"
            onPress={testLongDistance}
          />
        </View>
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
          • alternative_route: 1/2/3 返回不同条数的路线{'\n'}
          • show_fields=cost 返回时间和打车费用{'\n'}
          • show_fields=navi 返回详细导航信息{'\n'}
          • isindoor=1 启用室内路径规划{'\n'}
          • 支持 POI ID 提升路径准确性{'\n'}
          • walk_type 字段标识道路类型（天桥、地下通道等）
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