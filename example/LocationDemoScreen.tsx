import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { MapView, MapViewRef ,useLocation} from 'expo-gaode-map';


export default function LocationDemoScreen() {
  const mapRef = useRef<MapViewRef>(null);

  /**
   * useLocation Hook 使用
   * autoGet: 进入页面时“自动一次定位”
   * autoStart: 若想进入页面就开启连续定位，可设为 true
   */
  const { 
    location,
    isStarted,
    start,
    stop,
    get,
    timestamp,
  } = useLocation({ autoGet: true });

  // 手动一次定位（按钮）
  const handleGetOnce = async () => {
    const loc = await get();
    Alert.alert(`一次定位：${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`)
   

    if (mapRef.current) {
      await mapRef.current.moveCamera({
        target: { latitude: loc.latitude, longitude: loc.longitude },
        zoom: 16,
      });
    }
  };

  // 开始连续定位
  const handleStartContinuous = () => {
    start();
    // toast.success('开始连续定位');
    Alert.alert('开始连续定位')
  };

  // 停止连续定位
  const handleStopContinuous = () => {
    stop();
    // toast.success('已停止连续定位');
    Alert.alert('已停止连续定位')
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        myLocationEnabled={true}
        initialCameraPosition={
          location ? {
            target: { latitude: location.latitude, longitude: location.longitude },
            zoom: 16,
          } : undefined
        }
      />

      {/* 信息显示 */}
      <View style={styles.infoPanel}>
        <Text style={styles.label}>当前位置：</Text>
        {location ? (
          <>
            <Text style={styles.text}>
              📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
            <Text style={styles.textSmall}>
              🕒 更新时间：{timestamp ? new Date(timestamp).toLocaleTimeString() : '--'}
            </Text>
          </>
        ) : (
          <Text style={styles.text}>正在获取定位...</Text>
        )}

        <Text style={[styles.textSmall, { marginTop: 8 }]}>
          连续定位状态：{isStarted ? '运行中' : '已停止'}
        </Text>

        {/* 操作按钮 */}
        <View style={styles.btnRow}>
          <Pressable style={[styles.btn, { backgroundColor: '#4CAF50' }]} onPress={handleGetOnce}>
            <Text style={styles.btnText}>📍 一次定位</Text>
          </Pressable>

          {isStarted ? (
            <Pressable style={[styles.btn, { backgroundColor: '#FF6347' }]} onPress={handleStopContinuous}>
              <Text style={styles.btnText}>🛑 停止</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.btn, { backgroundColor: '#2196F3' }]} onPress={handleStartContinuous}>
              <Text style={styles.btnText}>▶ 连续定位</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}


// ===================== 样式 =====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 40,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  label: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  text: {
    color: '#fff',
    marginBottom: 4,
  },
  textSmall: {
    color: '#ccc',
    fontSize: 12,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
