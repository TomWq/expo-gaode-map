import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  NaviView,
  independentDriveRoute,
  independentTruckRoute,
  independentWalkRoute,
  independentRideRoute,
  independentMotorcycleRoute,
  selectIndependentRoute,
  startNaviWithIndependentPath,
  clearIndependentRoute,
  type IndependentRouteResult,
  type IndependentDriveRouteOptions,
  TravelStrategy,
} from 'expo-gaode-map-navigation';
import { Stack } from 'expo-router';

/**
 * 独立路径规划测试示例
 * 
 * 展示如何使用独立路径规划功能，该功能不会影响当前导航状态
 * 适合用于路线预览和行前选路
 */
export default function IndependentRouteExample() {
  const [result, setResult] = useState<IndependentRouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [showNaviView, setShowNaviView] = useState(false);
  const naviViewRef = useRef<any>(null);
  
  // 测试起点和终点
  const [from, setFrom] = useState({
    latitude: 39.9929,
    longitude: 116.3974,
    name: '天安门',
    poiId: '',
  });
  
  const [to, setTo] = useState({
    latitude: 39.9042,
    longitude: 116.3228,
    name: '北京西站',
    poiId: '',
  });

  const addLog = (message: string) => {
    console.log(`[IndependentRoute] ${message}`);
  };

  // 驾车路径规划
  const handleIndependentDriveRoute = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const options = {
        from: {
          latitude: from.latitude,
          longitude: from.longitude,
          name: from.name,
        },
        to: {
          latitude: to.latitude,
          longitude: to.longitude,
          name: to.name,
        },
        // 使用布尔策略组合
        avoidCongestion: true,
        avoidHighway: false,
        avoidCost: false,
        prioritiseHighway: false,
        carNumber: '京A12345',
      };
      
      addLog('开始独立驾车路径规划...');
      addLog(`选项: ${JSON.stringify(options, null, 2)}`);
      const routeResult = await independentDriveRoute(options);
      
      addLog(`规划成功！token: ${routeResult.token}, 路线数: ${routeResult.count}`);
      setResult(routeResult);
      setSelectedToken(routeResult.token);
      
      Alert.alert(
        '成功',
        `Token: ${routeResult.token}\n路线数: ${routeResult.count}\n主路线: ${routeResult.mainPathIndex}`,
        [{ text: '确定' }]
      );
    } catch (error) {
      addLog(`计算路线失败: ${error}`);
      Alert.alert('错误', `计算路线失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 货车路径规划
  const handleIndependentTruckRoute = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const options = {
        from: {
          latitude: from.latitude,
          longitude: from.longitude,
          name: from.name || undefined,
        },
        to: {
          latitude: to.latitude,
          longitude: to.longitude,
          name: to.name || undefined,
        },
        avoidCongestion: true,
        avoidHighway: false,
        restriction: false,
      };
      
      addLog('开始独立货车路径规划...');
      const routeResult = await independentTruckRoute(options);
      
      addLog(`货车规划成功！token: ${routeResult.token}`);
      setResult(routeResult);
      setSelectedToken(routeResult.token);
      
      Alert.alert('成功', `货车路径规划成功！Token: ${routeResult.token}`);
    } catch (error) {
      addLog(`货车路径规划失败: ${error}`);
      Alert.alert('错误', `货车路径规划失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 步行路径规划
  const handleIndependentWalkRoute = async () => {
    setLoading(true);
    
    try {
      const options = {
        from: {
          latitude: from.latitude,
          longitude: from.longitude,
          name: from.name || undefined,
        },
        to: {
          latitude: to.latitude,
          longitude: to.longitude,
          name: to.name || undefined,
        },
        travelStrategy: TravelStrategy.MULTIPLE, // 返回多条路线
      };
      
      addLog('开始独立步行路径规划...');
      const routeResult = await independentWalkRoute(options);
      
      addLog(`步行规划成功！路线数: ${routeResult.count}`);
      setResult(routeResult);
      setSelectedToken(routeResult.token);
      
      Alert.alert('成功', `步行路径规划成功！找到 ${routeResult.count} 条路线`);
    } catch (error) {
      addLog(`步行路径规划失败: ${error}`);
      Alert.alert('错误', `步行路径规划失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 骑行路径规划
  const handleIndependentRideRoute = async () => {
    setLoading(true);
    
    try {
      const options = {
        from: {
          latitude: from.latitude,
          longitude: from.longitude,
          name: from.name || undefined,
        },
        to: {
          latitude: to.latitude,
          longitude: to.longitude,
          name: to.name || undefined,
        },
        travelStrategy: TravelStrategy.MULTIPLE, // 返回多条路线
      };
      
      addLog('开始独立骑行路径规划...');
      const routeResult = await independentRideRoute(options);
      
      addLog(`骑行规划成功！路线数: ${routeResult.count}`);
      setResult(routeResult);
      setSelectedToken(routeResult.token);
      
      Alert.alert('成功', `骑行路径规划成功！找到 ${routeResult.count} 条路线`);
    } catch (error) {
      addLog(`骑行路径规划失败: ${error}`);
      Alert.alert('错误', `骑行路径规划失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 摩托车路径规划
  const handleIndependentMotorcycleRoute = async () => {
    setLoading(true);
    
    try {
      const options = {
        from: {
          latitude: from.latitude,
          longitude: from.longitude,
          name: from.name || undefined,
        },
        to: {
          latitude: to.latitude,
          longitude: to.longitude,
          name: to.name || undefined,
        },
        avoidCongestion: true,
        avoidHighway: false,
        carNumber: '京B12345', // 摩托车车牌
        motorcycleCC: 150, // 排量
      };
      
      addLog('开始独立摩托车路径规划...');
      const routeResult = await independentMotorcycleRoute(options);
      
      addLog(`摩托车规划成功！路线数: ${routeResult.count}`);
      setResult(routeResult);
      setSelectedToken(routeResult.token);
      
      Alert.alert('成功', `摩托车路径规划成功！找到 ${routeResult.count} 条路线`);
    } catch (error) {
      addLog(`摩托车路径规划失败: ${error}`);
      Alert.alert('错误', `摩托车路径规划失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 选择路线
  const handleSelectRoute = async (routeIndex: number) => {
    if (!selectedToken) {
      Alert.alert('提示', '请先进行路径规划');
      return;
    }
    
    try {
      addLog(`选择路线 ${routeIndex}...`);
      const success = await selectIndependentRoute({
        token: selectedToken,
        routeIndex,
      });
      
      if (success) {
        addLog(`成功选择路线 ${routeIndex}`);
        Alert.alert('成功', `已选择路线 ${routeIndex}`);
      }
    } catch (error) {
      addLog(`选择路线失败: ${error}`);
      Alert.alert('错误', `选择路线失败: ${error}`);
    }
  };

  // 使用选中的路线启动导航
  const handleStartNaviWithIndependentPath = async () => {
    if (!selectedToken) {
      Alert.alert('提示', '请先进行路径规划');
      return;
    }
    
    try {
      addLog('使用独立路径启动导航...');
      const success = await startNaviWithIndependentPath({
        token: selectedToken,
        naviType: 1, // 模拟导航
      });
      
      if (success) {
        addLog('导航启动成功');
        Alert.alert('成功', '导航已启动');
      }
    } catch (error) {
      addLog(`启动导航失败: ${error}`);
      Alert.alert('错误', `启动导航失败: ${error}`);
    }
  };

  // 清理独立路径
  const handleClearIndependentRoute = async () => {
    if (!selectedToken) {
      Alert.alert('提示', '没有可清理的路径');
      return;
    }
    
    try {
      addLog('清理独立路径...');
      const success = await clearIndependentRoute({
        token: selectedToken,
      });
      
      if (success) {
        addLog('路径清理成功');
        setResult(null);
        setSelectedToken(null);
        Alert.alert('成功', '路径已清理');
      }
    } catch (error) {
      addLog(`清理路径失败: ${error}`);
      Alert.alert('错误', `清理路径失败: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
     

      <Stack.Screen options={{
        title: '独立路径规划测试'
      }}/>
       <Text style={styles.subtitle}>不会影响当前导航状态，适合路线预览</Text>
      {/* 起点终点输入 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>起点名称:</Text>
        <TextInput
          style={styles.input}
          value={from.name}
          onChangeText={(text) => setFrom({ ...from, name: text })}
          placeholder="天安门"
        />
        
        <Text style={styles.label}>终点名称:</Text>
        <TextInput
          style={styles.input}
          value={to.name}
          onChangeText={(text) => setTo({ ...to, name: text })}
          placeholder="北京西站"
        />
      </View>

      {/* 操作按钮 */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleIndependentDriveRoute}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '规划中...' : '驾车路径规划'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonTruck]}
          onPress={handleIndependentTruckRoute}
          disabled={loading}
        >
          <Text style={styles.buttonText}>货车路径规划</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonWalk]}
          onPress={handleIndependentWalkRoute}
          disabled={loading}
        >
          <Text style={styles.buttonText}>步行路径规划</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonRide]}
          onPress={handleIndependentRideRoute}
          disabled={loading}
        >
          <Text style={styles.buttonText}>骑行路径规划</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonMotorcycle]}
          onPress={handleIndependentMotorcycleRoute}
          disabled={loading}
        >
          <Text style={styles.buttonText}>摩托车路径规划</Text>
        </TouchableOpacity>
      </View>

      {/* 路线管理 */}
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>规划结果</Text>
          <Text>Token: {result.token}</Text>
          <Text>路线数量: {result.count}</Text>
          <Text>主路线索引: {result.mainPathIndex}</Text>
          
          <View style={styles.routeList}>
            {result.routes.map((route, index) => (
              <View key={index} style={styles.routeItem}>
                <Text>路线 {index + 1}</Text>
                <Text>  ID: {route.id}</Text>
                <Text>  距离: {route.distance} 米</Text>
                <Text>  时间: {route.duration} 秒</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => handleSelectRoute(index)}
                >
                  <Text style={styles.selectButtonText}>选择此路线</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonStart]}
              onPress={handleStartNaviWithIndependentPath}
            >
              <Text style={styles.buttonText}>启动导航</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonClear]}
              onPress={handleClearIndependentRoute}
            >
              <Text style={styles.buttonText}>清理路径</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  inputGroup: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  buttonGroup: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonTruck: {
    backgroundColor: '#FF9500',
  },
  buttonWalk: {
    backgroundColor: '#34C759',
  },
  buttonRide: {
    backgroundColor: '#00C7BE',
  },
  buttonMotorcycle: {
    backgroundColor: '#AF52DE',
  },
  buttonStart: {
    backgroundColor: '#34C759',
  },
  buttonClear: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  routeList: {
    marginTop: 12,
  },
  routeItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },

});