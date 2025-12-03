import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { createLazyLoader, OptionalModules, printModuleInfo } from 'expo-gaode-map';

// 演示：如何创建延迟加载器
// 在实际项目中，当你安装了可选模块后，可以这样使用：
// const loadSearch = createLazyLoader(() => require('expo-gaode-map-search'));

// 为了演示目的，我们创建一个模拟的加载器
const mockLoadSearch = createLazyLoader(() => {
  // 模拟模块不存在的情况
  throw new Error('Module not installed');
});

export default function OptionalModuleDemo() {
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testModuleInfo = () => {
    addLog('═══ 调用 printModuleInfo() ═══');
    printModuleInfo();
    addLog('✅ 已在控制台打印模块信息');
    addLog('请查看开发者工具控制台');
  };

  const testOptionalModules = () => {
    addLog('═══ 可选模块常量 ═══');
    addLog(`📦 SEARCH: ${OptionalModules.SEARCH}`);
    addLog(`📦 NAVIGATION: ${OptionalModules.NAVIGATION}`);
    addLog(`📦 ROUTE: ${OptionalModules.ROUTE}`);
    addLog(`📦 GEOCODER: ${OptionalModules.GEOCODER}`);
    addLog('');
    addLog('ℹ️  这些是可选模块的包名');
    addLog('用户可以根据需要安装');
  };

  const testLazyLoad = () => {
    addLog('═══ 测试延迟加载 ═══');
    addLog('🔄 调用 mockLoadSearch()...');
    
    const SearchModule = mockLoadSearch();
    
    if (SearchModule) {
      addLog('✅ 搜索模块加载成功!');
      addLog(`📦 模块导出: ${Object.keys(SearchModule).join(', ')}`);
    } else {
      addLog('⚠️  搜索模块未安装或加载失败');
      addLog('这是正常的,因为我们还没有发布该模块');
    }
    
    addLog('');
    addLog('💡 createLazyLoader 的优势:');
    addLog('1. 延迟加载，不影响启动速度');
    addLog('2. 缓存结果，避免重复尝试');
    addLog('3. 优雅降级，不会崩溃应用');
  };

  const testUsageExample = () => {
    addLog('═══ 使用示例代码 ═══');
    addLog('');
    addLog('// 1. 创建延迟加载器');
    addLog('const loadSearch = createLazyLoader(');
    addLog('  () => require("expo-gaode-map-search")');
    addLog(');');
    addLog('');
    addLog('// 2. 使用时加载');
    addLog('function MyComponent() {');
    addLog('  const Search = loadSearch();');
    addLog('  if (Search) {');
    addLog('    // 模块已安装，可以使用');
    addLog('    return <Search.Component />;');
    addLog('  } else {');
    addLog('    // 模块未安装，显示提示');
    addLog('    return <Text>请安装搜索模块</Text>;');
    addLog('  }');
    addLog('}');
    addLog('');
    addLog('✅ 这样用户可以选择性安装功能');
    addLog('✅ 减小基础包体积');
  };

  const testArchitecture = () => {
    addLog('═══ 架构说明 ═══');
    addLog('');
    addLog('📦 核心包 (expo-gaode-map):');
    addLog('  • 地图显示和定位功能');
    addLog('  • 覆盖物（标记、圆形等）');
    addLog('  • 相机控制');
    addLog('  • 模块检测工具');
    addLog('');
    addLog('🔌 可选模块 (按需安装):');
    addLog('  • expo-gaode-map-search: 搜索功能');
    addLog('  • expo-gaode-map-navigation: 导航功能');
    addLog('  • expo-gaode-map-route: 路线规划');
    addLog('  • expo-gaode-map-geocoder: 地理编码');
    addLog('');
    addLog('✨ 优势:');
    addLog('  • 用户只安装需要的功能');
    addLog('  • 减小应用体积');
    addLog('  • 降低维护成本');
    addLog('  • 灵活的功能组合');
  };

  const clearLog = () => {
    setLog([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔌 可选模块演示</Text>
      <Text style={styles.subtitle}>测试模块检测和延迟加载功能</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testModuleInfo}>
          <Text style={styles.buttonText}>📋 打印模块信息</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testOptionalModules}>
          <Text style={styles.buttonText}>📦 查看模块常量</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testLazyLoad}>
          <Text style={styles.buttonText}>🔄 测试延迟加载</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testUsageExample}>
          <Text style={styles.buttonText}>💡 使用示例</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testArchitecture}>
          <Text style={styles.buttonText}>🏗️ 架构说明</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearLog}
        >
          <Text style={styles.buttonText}>🗑️ 清空日志</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>📝 日志输出:</Text>
        <ScrollView style={styles.logScroll}>
          {log.length === 0 ? (
            <Text style={styles.logEmpty}>点击上方按钮测试功能...</Text>
          ) : (
            log.map((item, index) => (
              <Text key={index} style={styles.logItem}>
                {item}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>💡 重要说明</Text>
        <Text style={styles.infoText}>
          • 本演示展示了可选模块的架构设计{'\n'}
          • 由于可选模块尚未发布，加载会失败（这是正常的）{'\n'}
          • Metro bundler 的限制：不能 require 不存在的模块{'\n'}
          • 实际使用时，用户安装对应模块后即可正常使用{'\n'}
          • 这种设计让用户可以按需安装功能，减小包体积
        </Text>
      </View>
    </View>
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
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
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
    marginBottom: 20,
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
  infoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
});