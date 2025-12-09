import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { GaodeWebAPI, GaodeAPIError, getErrorInfo } from 'expo-gaode-map-web-api';

/**
 * 错误处理示例
 * 展示统一的错误处理机制
 */
export default function ErrorHandlingExample() {
  const [result, setResult] = useState('');

  // 测试错误：Key 不正确
  const testInvalidKey = async () => {
    try {
      const api = new GaodeWebAPI({ key: 'invalid_key_12345' });
      await api.geocode.regeocode('116.481028,39.989643');
    } catch (error) {
      handleError(error, '测试场景：Key 不正确');
    }
  };

  // 测试错误：缺少必填参数
  const testMissingParams = async () => {
    try {
      const api = new GaodeWebAPI({ key: 'e9d912a302e6460222ad0bc1e38034bf' });
      // 故意传入空字符串
      await api.geocode.regeocode('');
    } catch (error) {
      handleError(error, '测试场景：缺少必填参数');
    }
  };

  // 测试错误：请求参数非法
  const testInvalidParams = async () => {
    try {
      const api = new GaodeWebAPI({ key: 'e9d912a302e6460222ad0bc1e38034bf' });
      // 传入非法坐标
      await api.geocode.regeocode('invalid,coordinates');
    } catch (error) {
      handleError(error, '测试场景：请求参数非法');
    }
  };

  // 测试错误：路径规划失败
  const testRouteFail = async () => {
    try {
      const api = new GaodeWebAPI({ key: 'e9d912a302e6460222ad0bc1e38034bf' });
      // 使用海外坐标（没有海外权限）
      await api.route.driving('0,0', '1,1');
    } catch (error) {
      handleError(error, '测试场景：路径规划失败');
    }
  };

  // 统一错误处理函数
  const handleError = (error: unknown, scenario: string) => {
    if (error instanceof GaodeAPIError) {
      // 高德 API 错误 - 使用统一的错误信息
      const errorMessage = `
🔴 ${scenario}

错误码：${error.code}
错误类型：${getErrorTypeLabel(error.type)}
错误描述：${error.description}

💡 排查建议：
${error.suggestion}

📋 技术信息：
- 官方信息：${error.info}
- HTTP 状态：${error.status}
      `.trim();

      setResult(errorMessage);
      
      // 友好提示
      Alert.alert(
        '请求失败',
        error.getUserMessage(),
        [{ text: '确定' }]
      );
    } else if (error instanceof Error) {
      // 其他错误（网络错误、超时等）
      const errorMessage = `
⚠️ ${scenario}

${error.message}
      `.trim();

      setResult(errorMessage);
      Alert.alert('错误', error.message);
    } else {
      // 未知错误
      setResult('❌ 未知错误');
      Alert.alert('错误', '发生未知错误');
    }
  };

  // 获取错误类型标签
  const getErrorTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      success: '✅ 成功',
      key_error: '🔑 Key 相关错误',
      param_error: '📝 参数错误',
      route_error: '🛣️ 路径规划错误',
      service_error: '⚙️ 服务错误',
      quota_error: '💰 配额错误',
    };
    return labels[type] || type;
  };

  // 查看错误码说明
  const viewErrorCodeInfo = (code: string) => {
    try {
      const info = getErrorInfo(code);
      Alert.alert(
        `错误码: ${code}`,
        `类型：${getErrorTypeLabel(info.type)}\n\n描述：${info.description}\n\n建议：${info.suggestion}`,
        [{ text: '确定' }]
      );
    } catch (error) {
      Alert.alert('提示', '无效的错误码');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚠️ 错误处理示例</Text>

      {/* 错误测试 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 错误场景测试</Text>
        
        <Button
          title="测试：Key 不正确 (10001)"
          onPress={testInvalidKey}
          color="#f44336"
        />
        <View style={styles.buttonSpacer} />
        
        <Button
          title="测试：缺少必填参数 (20001)"
          onPress={testMissingParams}
          color="#FF9800"
        />
        <View style={styles.buttonSpacer} />
        
        <Button
          title="测试：请求参数非法 (20000)"
          onPress={testInvalidParams}
          color="#FF5722"
        />
        <View style={styles.buttonSpacer} />
        
        <Button
          title="测试：路径规划失败 (20800)"
          onPress={testRouteFail}
          color="#9C27B0"
        />
        
        <Text style={styles.hint}>
          💡 点击按钮触发不同的错误场景
        </Text>
      </View>

      {/* 错误码查询 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 常见错误码速查</Text>
        
        <View style={styles.errorCodesGrid}>
          {['10001', '10002', '10003', '10004', '20000', '20001', '20800', '20802'].map(code => (
            <Button
              key={code}
              title={code}
              onPress={() => viewErrorCodeInfo(code)}
              color="#2196F3"
            />
          ))}
        </View>
        
        <Text style={styles.hint}>
          💡 点击查看错误码详细说明
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
        <Text style={styles.noteTitle}>📚 错误处理机制：</Text>
        <Text style={styles.noteText}>
          <Text style={styles.bold}>统一错误类：GaodeAPIError</Text>{'\n'}
          • code: 错误码{'\n'}
          • description: 友好的错误描述{'\n'}
          • suggestion: 问题排查建议{'\n'}
          • type: 错误类型分类{'\n'}
          • getUserMessage(): 获取用户友好提示{'\n'}
          {'\n'}
          <Text style={styles.bold}>错误处理最佳实践：</Text>{'\n'}
          • 使用 try-catch 捕获错误{'\n'}
          • 判断 error instanceof GaodeAPIError{'\n'}
          • 根据 error.type 进行分类处理{'\n'}
          • 使用 error.getUserMessage() 展示给用户{'\n'}
          • 使用 error.toJSON() 记录日志{'\n'}
          {'\n'}
          <Text style={styles.bold}>支持的错误类型：</Text>{'\n'}
          • key_error: Key 相关（权限、配额等）{'\n'}
          • param_error: 参数错误{'\n'}
          • route_error: 路径规划错误{'\n'}
          • service_error: 服务响应错误{'\n'}
          • quota_error: 配额相关错误
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
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    fontStyle: 'italic',
  },
  buttonSpacer: {
    height: 8,
  },
  errorCodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultBox: {
    backgroundColor: '#ffebee',
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    lineHeight: 18,
  },
  note: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1565C0',
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  spacer: {
    height: 40,
  },
});