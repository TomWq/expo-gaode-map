import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Image, Platform, Pressable } from 'react-native';
import {
  MapView,
  Cluster,
  ExpoGaodeMapModule,
  type CameraPosition,
  type ClusterPoint,
} from 'expo-gaode-map';

const iconUri = Image.resolveAssetSource(require('./assets/icon.png')).uri;

export default function ClusterCustomDemo() {
  const [points, setPoints] = useState<ClusterPoint[]>([]);
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>({
    target: { latitude: 39.90923, longitude: 116.397428 },
    zoom: 10,
  });

  useEffect(() => {
    // 模拟 500 个随机点
    const newPoints: ClusterPoint[] = [];
    for (let i = 0; i < 500; i++) {
      newPoints.push({
        position: {
          latitude: 39.90923 + (Math.random() - 0.5) * 0.2,
          longitude: 116.397428 + (Math.random() - 0.5) * 0.2,
        },
        properties: { id: i, title: `Point ${i}` },
      });
    }
    setPoints(newPoints);
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={cameraPosition}
      >
        <Cluster
          points={points}
          radius={50} // 聚合范围
          minClusterSize={2} // 至少 2 个点才聚合
          
          // 使用自定义图标作为聚合背景
          // 注意：图标会被缩放到 clusterStyle 中指定的宽高 (默认 40x40)
          icon={iconUri}
          
          // 设置聚合点的大小 (dp)
          clusterStyle={{
            width: 60,
            height: 60,
            // 也可以设置边框等，会绘制在图片之上或作为辅助
            borderWidth: 0, 
            backgroundColor: 'transparent', // 透明背景，完全显示图片
          }}
          
          // 设置文字样式
          clusterTextStyle={{
            color: '#FFFFFF', // 白色文字
            fontSize: 16,
            fontWeight: 'bold',
          }}
          
          // 允许点击显示气泡
        

          onClusterPress={(e) => {
            console.log('Cluster pressed:', e.nativeEvent);
          }}
        />
      </MapView>
      
      <View style={styles.panel}>
        <Text style={styles.title}>自定义聚合图标示例</Text>
        <Text style={styles.desc}>使用 icon.png 作为聚合背景</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  desc: {
    color: '#666',
  },
});
