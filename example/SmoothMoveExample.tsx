import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, Alert,Image } from 'react-native';
import { MapView, Marker, LatLng, CameraPosition ,MapViewRef,Polyline} from 'expo-gaode-map';

/**
 * Marker 平滑移动示例
 * 
 * 演示如何让 Marker 沿着指定的路径平滑移动
 */
const iconUri = Image.resolveAssetSource(require('./assets/car.png')).uri;

export default function SmoothMoveExample() {
  const mapRef = useRef<MapViewRef>(null);
  const [isMoving, setIsMoving] = useState(false);

  // 定义起始点
  const startPoint: LatLng = {
    latitude: 39.9042,
    longitude: 116.4074,
  };

  // 定义移动路径（示例：从北京天安门到故宫）
  const movePath: LatLng[] = [
    { latitude: 39.9042, longitude: 116.4074 },  // 天安门
    { latitude: 39.9100, longitude: 116.3970 },  // 故宫北门
    { latitude: 39.9163, longitude: 116.3971 },  // 景山公园
    { latitude: 39.9230, longitude: 116.3890 },  // 什刹海
  ];

  const startSmoothMove = () => {
    setIsMoving(true);
  };


  const initialCamera: CameraPosition = {
    target: startPoint,
    zoom: 14,
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialCameraPosition={initialCamera}
        >
          {/* 带平滑移动功能的 Marker */}
          <Marker
            position={startPoint}
            title="平滑移动演示"
            snippet="点击开始按钮查看效果"
            pinColor="red"
            // icon={iconUri}
            icon={iconUri}
            iconWidth={20}
            iconHeight={200/120 * 20}
            smoothMovePath={isMoving ? movePath : undefined}
            smoothMoveDuration={isMoving ? 5 : undefined}
          />
          <Polyline
            points={movePath}
            strokeColor="#fffeeeß"
            strokeWidth={15}
          />
        </MapView>
      </View>

      <View style={styles.controls}>
        <Text style={styles.title}>Marker 平滑移动示例</Text>
        <Text style={styles.description}>
          Marker 会沿着指定的路径平滑移动，持续 5 秒
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="开始平滑移动"
            onPress={startSmoothMove}
            disabled={isMoving}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>使用方法：</Text>
          <Text style={styles.infoText}>
            1. 设置 smoothMovePath - 路径坐标数组
          </Text>
          <Text style={styles.infoText}>
            2. 设置 smoothMoveDuration - 移动时长（秒）
          </Text>
          <Text style={styles.infoText}>
            3. 两个属性同时设置后，Marker 开始移动
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  info: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
});
