import {
  ExpoGaodeMapModule,
  NaviView,
  type Coordinates,
  type NaviViewRef,
} from 'expo-gaode-map-navigation';

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


/**
 * NaviView 使用示例
 * 
 * 展示如何使用高德官方的导航界面进行导航
 */
export default function NaviViewExample() {
  const naviViewRef = useRef<NaviViewRef>(null);
  const [showNaviView, setShowNaviView] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [naviInfo, setNaviInfo] = useState<string>('');

  useEffect(() => {
    
    // 检查并请求位置权限
    ExpoGaodeMapModule.checkLocationPermission().then((status) => {
      if (!status.granted) {
        ExpoGaodeMapModule.requestLocationPermission().then((result) => {
          if (!result.granted) {
            Alert.alert('提示', '请授权位置权限以使用导航功能');
          }
        });
      }
    });

  }, []);

  // 获取当前位置
  const getCurrentLocation = async () => {
    try {
      const location = await ExpoGaodeMapModule.getCurrentLocation();
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      } as Coordinates);
      Alert.alert('定位成功', `${location.latitude}, ${location.longitude}`);
    } catch (error) {
      Alert.alert('定位失败', String(error));
    }
  };

  // 开始导航
  const startNavigation = async () => {
    if (!currentLocation) {
      Alert.alert('提示', '请先获取当前位置');
      return;
    }

    // 目的地：天安门广场（示例）
    const destination = {
      latitude: 39.9075,
      longitude: 116.39723,
    };

    // 显示导航界面
    setShowNaviView(true);
    
    // 等待视图渲染后启动导航
    setTimeout(async () => {
      try {
        await naviViewRef.current?.startNavigation(
          currentLocation,
          destination,
          1  // 1 = 模拟导航，0 = GPS 导航
        );
      } catch (error) {
        console.log('启动导航失败', String(error));
        Alert.alert('启动导航失败', String(error));
      }
    }, 500);
  };

  // 停止导航
  const stopNavigation = async () => {
    try {
      await naviViewRef.current?.stopNavigation();
    } catch (error) {
      console.log('停止导航失败', error);
    }
    setShowNaviView(false);
    setNaviInfo('');
  };

  if (showNaviView) {
    // 导航界面（全屏显示）
    return (
      <View style={styles.naviContainer}>
        <StatusBar translucent barStyle={'dark-content'} backgroundColor={'transparent'}/>
        <NaviView
          ref={naviViewRef}
          style={styles.naviView}
          naviType={1} // 1 = 模拟导航，0 = GPS 导航
          showCamera={true}
          // isNightMode={true}
          enableVoice={true}
          showUIElements={true}
          
          androidStatusBarPaddingTop={20}
          onNaviInfoUpdate={(e) => {
            const { pathRetainDistance, pathRetainTime, currentRoadName } = e.nativeEvent;
            setNaviInfo(
              `剩余: ${pathRetainDistance}米 ${Math.floor(pathRetainTime / 60)}分钟\n` +
              `当前道路: ${currentRoadName || '未知'}`
            );
          }}
          onNaviStart={(e) => {
            console.log('导航开始', e.nativeEvent);
          }}
          onNaviEnd={(e) => {
            console.log('导航结束', e.nativeEvent);
            Alert.alert('导航结束', e.nativeEvent.reason);
            stopNavigation();
          }}
          onArrive={(e) => {
            console.log('到达目的地', e.nativeEvent);
            Alert.alert('恭喜', '您已到达目的地！');
          }}
          onCalculateRouteSuccess={(e) => {
            console.log('路径规划成功', e.nativeEvent);
          }}
          onCalculateRouteFailure={(e) => {
            console.log('路径规划失败', e.nativeEvent);
            Alert.alert('路径规划失败', e.nativeEvent.error || '未知错误');
          }}
          onReCalculate={(e) => {
            console.log('重新规划路径', e.nativeEvent);
          }}
          onPlayVoice={(e) => {
            console.log('语音播报', e.nativeEvent.text);
          }}
        />
        
        {/* 导航信息覆盖层 */}
        {naviInfo !== '' && (
          <View style={styles.infoOverlay}>
            <Text style={styles.infoText}>{naviInfo}</Text>
          </View>
        )}
        
        {/* 退出按钮 */}
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => {
            Alert.alert(
              '确认',
              '确定要退出导航吗？',
              [
                { text: '取消', style: 'cancel' },
                { text: '确定', onPress: stopNavigation },
              ]
            );
          }}
        >
          <Text style={styles.exitButtonText}>退出导航</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 主界面
  return (
    <View style={styles.container}>
     
      
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 当前位置</Text>
          {currentLocation ? (
            <Text style={styles.locationText}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          ) : (
            <Text style={styles.placeholder}>未获取</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={getCurrentLocation}
          >
            <Text style={styles.buttonText}>📍 获取当前位置</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.successButton,
              !currentLocation && styles.disabledButton,
            ]}
            onPress={startNavigation}
            disabled={!currentLocation}
          >
            <Text style={styles.buttonText}>🧭 开始导航到天安门</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>✨ 功能特点</Text>
          <Text style={styles.featureText}>• 使用高德官方导航界面</Text>
          <Text style={styles.featureText}>• 完整的导航信息显示</Text>
          <Text style={styles.featureText}>• 实时路况和转向提示</Text>
          <Text style={styles.featureText}>• 摄像头和限速提醒</Text>
          <Text style={styles.featureText}>• 语音播报导航信息</Text>
          <Text style={styles.featureText}>• 支持模拟导航和GPS导航</Text>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 提示</Text>
          <Text style={styles.tipText}>
            本示例使用模拟导航模式，不需要实际移动。
            {'\n'}如需GPS导航，请将 naviType 设置为 0。
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop:120
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  locationText: {
    fontSize: 14,
    color: '#2196F3',
    fontFamily: 'monospace',
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#F57C00',
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  // 导航界面样式
  naviContainer: {
    flex: 1,
  },
  naviView: {
    flex: 1,
    
  },
  infoOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.95)',
    padding: 15,
    borderRadius: 8,
  },
  infoText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  exitButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  exitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});