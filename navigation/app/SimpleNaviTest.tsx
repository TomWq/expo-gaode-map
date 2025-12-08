import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { NaviView, type NaviViewRef } from 'expo-gaode-map-navigation';
import { Stack } from 'expo-router';

export default function SimpleNaviTest() {
  const [showNavi, setShowNavi] = useState(false);
  const [naviType, setNaviType] = useState(1); // 1=模拟导航, 2=GPS导航
  const [selectedRoute, setSelectedRoute] = useState(0); // 0=北京西站->首都机场, 1=天安门->颐和园
  const naviViewRef = useRef<NaviViewRef>(null);

  // 预设路线
  const routes = [
    {
      name: '北京西站 → 首都机场',
      start: { latitude: 39.8943, longitude: 116.3220 },
      end: { latitude: 40.0799, longitude: 116.6031 },
      description: '约32公里，驾车约40分钟'
    },
    {
      name: '天安门 → 颐和园',
      start: { latitude: 39.9087, longitude: 116.3975 },
      end: { latitude: 39.9999, longitude: 116.2755 },
      description: '约15公里，驾车约30分钟'
    }
  ];

  const currentRoute = routes[selectedRoute];

  const startNavi = async () => {
    setShowNavi(true);
    
    // 等待导航视图加载
    setTimeout(async () => {
      try {
        console.log('[SimpleNavi] 开始启动导航...');
        console.log('[SimpleNavi] 路线:', currentRoute.name);
        console.log('[SimpleNavi] 起点:', currentRoute.start);
        console.log('[SimpleNavi] 终点:', currentRoute.end);
        console.log('[SimpleNavi] 导航类型:', naviType === 1 ? '模拟导航' : 'GPS导航');
        
        await naviViewRef.current?.startNavigation(
          currentRoute.start,
          currentRoute.end,
          naviType
        );
        
        console.log('[SimpleNavi] 导航启动成功');
      } catch (error) {
        console.error('[SimpleNavi] 启动导航失败:', error);
        Alert.alert('错误', `启动导航失败: ${String(error)}`);
        setShowNavi(false);
      }
    }, 1000);
  };

  const stopNavi = async () => {
    try {
      await naviViewRef.current?.stopNavigation();
      setShowNavi(false);
      console.log('[SimpleNavi] 导航已停止');
    } catch (error) {
      console.error('[SimpleNavi] 停止导航失败:', error);
    }
  };

  const toggleNaviType = () => {
    setNaviType(prev => prev === 1 ? 2 : 1);
  };

  if (showNavi) {
    return (
      <View style={styles.container}>
        <NaviView
          ref={naviViewRef}
          style={styles.naviView}
          naviType={naviType}
          enableVoice={true}
          showCamera={true}
          autoLockCar={true}
          autoChangeZoom={true}
          trafficLayerEnabled={true}
          realCrossDisplay={true}
          naviMode={0} // 车头朝上
          showMode={1} // 锁车态
          isNightMode={false}
          onNaviStart={(e) => {
            console.log('[SimpleNavi] 导航开始:', e.nativeEvent);
            Alert.alert('导航开始', `${currentRoute.name}\n类型: ${e.nativeEvent.type === 1 ? '模拟导航' : 'GPS导航'}`);
          }}
          onNaviEnd={(e) => {
            console.log('[SimpleNavi] 导航结束:', e.nativeEvent);
            Alert.alert('导航结束', e.nativeEvent.reason || '导航已结束');
            setShowNavi(false);
          }}
          onArrive={(e) => {
            console.log('[SimpleNavi] 到达目的地:', e.nativeEvent);
            Alert.alert('恭喜', `您已到达${currentRoute.name.split(' → ')[1]}！`);
          }}
          onCalculateRouteSuccess={(e) => {
            console.log('[SimpleNavi] 路线计算成功:', e.nativeEvent);
          }}
          onCalculateRouteFailure={(e) => {
            console.error('[SimpleNavi] 路线计算失败:', e.nativeEvent);
            Alert.alert('错误', `路线计算失败: ${e.nativeEvent.error}`);
            setShowNavi(false);
          }}
          onNaviInfoUpdate={(e) => {
            // 实时导航信息
            const info = e.nativeEvent;
            if (info.pathRetainDistance < 1000 && info.pathRetainDistance % 100 === 0) {
              console.log(`[SimpleNavi] 剩余距离: ${info.pathRetainDistance}米`);
            }
          }}
          onPlayVoice={(e) => {
            // 语音播报
            console.log('[SimpleNavi] 语音播报:', e.nativeEvent.text);
          }}
          onGpsSignalWeak={(e) => {
            console.warn('[SimpleNavi] GPS信号弱:', e.nativeEvent);
            Alert.alert('提示', 'GPS信号较弱，可能影响定位精度');
          }}
          onRouteRecalculate={(e) => {
            console.log('[SimpleNavi] 路线重新计算:', e.nativeEvent);
            Alert.alert('路线重算', `原因: ${e.nativeEvent.reason === 'yaw' ? '偏航' : '拥堵'}`);
          }}
        />
        <View style={styles.naviControlBar}>
          <TouchableOpacity style={styles.stopButton} onPress={stopNavi}>
            <Text style={styles.stopButtonText}>停止导航</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
       
        <Stack.Screen options={{title:'导航功能演示'}}/>
        
        {/* 路线选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择路线</Text>
          {routes.map((route, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.routeCard,
                selectedRoute === index && styles.selectedRouteCard
              ]}
              onPress={() => setSelectedRoute(index)}
            >
              <Text style={[
                styles.routeName,
                selectedRoute === index && styles.selectedRouteText
              ]}>
                {route.name}
              </Text>
              <Text style={styles.routeDescription}>{route.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 导航类型选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>导航类型</Text>
          <TouchableOpacity
            style={styles.typeSelector}
            onPress={toggleNaviType}
          >
            <View style={styles.typeInfo}>
              <Text style={styles.typeLabel}>当前选择:</Text>
              <Text style={styles.typeValue}>
                {naviType === 1 ? '🚗 模拟导航' : '📍 GPS导航'}
              </Text>
            </View>
            <Text style={styles.typeToggle}>
              点击切换 {naviType === 1 ? '(GPS导航)' : '(模拟导航)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 功能说明 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能特性</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✓ 实时路线规划</Text>
            <Text style={styles.featureItem}>✓ 语音导航播报</Text>
            <Text style={styles.featureItem}>✓ 路况信息显示</Text>
            <Text style={styles.featureItem}>✓ 路口放大图</Text>
            <Text style={styles.featureItem}>✓ 自动缩放地图</Text>
            <Text style={styles.featureItem}>✓ 偏航重算路线</Text>
          </View>
        </View>

        {/* 当前路线信息 */}
        <View style={styles.info}>
          <Text style={styles.infoTitle}>当前选择路线</Text>
          <Text style={styles.infoText}>路线: {currentRoute.name}</Text>
          <Text style={styles.infoText}>
            起点: ({currentRoute.start.latitude.toFixed(4)}, {currentRoute.start.longitude.toFixed(4)})
          </Text>
          <Text style={styles.infoText}>
            终点: ({currentRoute.end.latitude.toFixed(4)}, {currentRoute.end.longitude.toFixed(4)})
          </Text>
          <Text style={styles.infoText}>
            导航类型: {naviType === 1 ? '模拟导航' : 'GPS导航'}
          </Text>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={startNavi}>
          <Text style={styles.buttonText}>开始导航</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedRouteCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8e9',
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  selectedRouteText: {
    color: '#4CAF50',
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
  },
  typeSelector: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  typeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  typeToggle: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  featureList: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureItem: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
  },
  info: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  naviView: {
    flex: 1,
  },
  naviControlBar: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  stopButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});