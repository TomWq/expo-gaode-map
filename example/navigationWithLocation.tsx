
import { getRouteBounds, parsePolyline } from './routeUtils';
import {
    ExpoGaodeMapModule,
    MapView,
    MapViewRef,
    Marker,
    Polyline,
    type CameraPosition,
    type LatLng,
} from 'expo-gaode-map';
import { DrivingStrategy, GaodeWebAPI } from 'expo-gaode-map-web-api';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useColorScheme,
    View
} from 'react-native';
import Colors from './Colors';

const carIcon = Image.resolveAssetSource(require('./assets/car.png')).uri;
const startIcon = Image.resolveAssetSource(require('./assets/start.png')).uri;
const endIcon = Image.resolveAssetSource(require('./assets/end.png')).uri;

/**
 * 路径规划与定位平滑移动示例
 * 遵循 .cursor/skills/agent-skills/skills/expo-gaode-map/ 中的规范
 */
export default function NavigationWithLocation() {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const mapRef = useRef<MapViewRef>(null);
  
  // 按照规范，Web API 需要初始化
  const api = useMemo(() => new GaodeWebAPI({ key: '' }), []);

  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<LatLng[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
  const [initialCamera, setInitialCamera] = useState<CameraPosition | null>(null);
  const [trackingMode, setTrackingMode] = useState<'simulation' | 'realtime'>('simulation');

  // 标记相关的 key，用于强制刷新某些状态
  const [markerKey, setMarkerKey] = useState(0);
  // 平滑移动时长
  const [smoothDuration, setSmoothDuration] = useState<number>(10);
  // 模拟速度倍率
  const [speed, setSpeed] = useState<number>(1);
  // 专门用于动画的路径
  const [activePath, setActivePath] = useState<LatLng[] | undefined>(undefined);
  // 新增：用于平滑移动的同步位置（手动补偿模式）
  const [smoothPosition, setSmoothPosition] = useState<LatLng | null>(null);

  // 相机跟随引用
  const cameraFollowIntervalRef = useRef<any>(null);
  // 记录模拟开始的时间
  const simulationStartTimeRef = useRef<number>(0);
  // 记录上一次的角度，用于平滑过渡
  const lastAngleRef = useRef<number>(0);

  // 初始化位置（北京天安门附近作为默认起点）
  const defaultOrigin: LatLng = { latitude: 39.908692, longitude: 116.397477 };
  const defaultDest: LatLng = { latitude: 39.992806, longitude: 116.310905 }; // 清华大学

  useEffect(() => {
    // 权限处理最佳实践
    const checkPermission = async () => {
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      if (!status.granted) {
        await ExpoGaodeMapModule.requestLocationPermission();
      }
      
      const loc = await ExpoGaodeMapModule.getCurrentLocation();
      if (loc) {
        setInitialCamera({
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 15,
        });
        setCurrentPosition({ latitude: loc.latitude, longitude: loc.longitude });
      } else {
        setInitialCamera({
          target: defaultOrigin,
          zoom: 15,
        });
        setCurrentPosition(defaultOrigin);
      }
    };

    checkPermission();

    // 监听实时定位
    const subscription = ExpoGaodeMapModule.addLocationListener((location) => {
     if (trackingMode === 'realtime' && !isNavigatingRef.current) {
        const newPos = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
        setCurrentPosition(newPos);
        
        // 实时追踪时移动相机，保持用户在中心
        mapRef.current?.moveCamera({
          target: newPos,
          zoom: 17,
          bearing: location.heading || 0, // 如果有方向信息则跟随方向
        }, 1000);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [trackingMode]);

  // 路径规划
  const planRoute = async () => {
    setLoading(true);
    try {
      const startLoc = await ExpoGaodeMapModule.getCurrentLocation() || defaultOrigin;
      const originStr = `${startLoc.longitude},${startLoc.latitude}`;
      const destStr = `${defaultDest.longitude},${defaultDest.latitude}`;
      
      const res = await api.route.driving(originStr, destStr, {
        strategy: DrivingStrategy.DEFAULT,
        show_fields: 'polyline',
      });

      if (res.route && res.route.paths && res.route.paths.length > 0) {
        const path = res.route.paths[0];
        let allPoints: LatLng[] = [];
        path.steps.forEach(step => {
          if (step.polyline) {
            allPoints.push(...parsePolyline(step.polyline));
          }
        });

        // 路径点预处理：确保坐标精度和有效性
        const validPoints = allPoints.filter(p => 
          !isNaN(p.latitude) && !isNaN(p.longitude) && 
          p.latitude !== 0 && p.longitude !== 0
        ).map(p => ({
          latitude: Number(p.latitude.toFixed(6)),
          longitude: Number(p.longitude.toFixed(6))
        }));

        // 性能建议：使用原生轨迹简化 (simplifyPolyline)
        let simplified = validPoints;
        if (simplified.length > 500) {
          simplified = ExpoGaodeMapModule.simplifyPolyline(simplified, 2);
        }

        setRouteData(simplified);
        // 规划完成后，小车自动“吸附”到起点
        if (simplified.length > 0) {
          setCurrentPosition(simplified[0]);
        }

        const bounds = getRouteBounds(simplified);
        if (bounds && mapRef.current) {
          mapRef.current.moveCamera({
            target: bounds.center,
            zoom: 12.5,
          }, 500);
        }
      }
    } catch (error) {
      Alert.alert('规划失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 开始模拟
  const startSimulation = () => {
    if (routeData.length < 2) {
      Alert.alert('提示', '请先规划路径');
      return;
    }

    const pathLength = ExpoGaodeMapModule.calculatePathLength(routeData);
    if (!pathLength || pathLength <= 0) {
      Alert.alert('错误', '无法计算路径长度，请重试');
      return;
    }

    // 1. 计算动画时长 (单位：秒)
    const baseSpeed = 15;
    const duration = Math.max(5, pathLength / (baseSpeed * speed));
    setSmoothDuration(duration);
    
    // 2. 重置状态，准备新动画
     setMarkerKey(prev => prev + 1); 
    setIsNavigating(false);
    setActivePath(undefined);
    setSmoothPosition(null);
    
    // 3. 启动新动画
    const pathForNative = [...routeData];
    
    // 初始化第一个点的角度，防止相机启动时突跳
    const firstPointInfo = ExpoGaodeMapModule.getPointAtDistance(pathForNative, 0);
    if (firstPointInfo) {
      lastAngleRef.current = firstPointInfo.angle;
    }
    
    // 先将小车放在起点
    setCurrentPosition(pathForNative[0]);
    
    // 延迟 50ms 注入 path 触发动画，给状态同步一点时间
    setTimeout(() => {
      setActivePath(pathForNative);
      setTrackingMode('simulation');
      simulationStartTimeRef.current = Date.now();
      setIsNavigating(true);
    }, 150);
  };

  // 停止模拟
  const stopSimulation = async () => {
    // 1. 立即停止相机跟随定时器
    if (cameraFollowIntervalRef.current) {
      clearInterval(cameraFollowIntervalRef.current);
      cameraFollowIntervalRef.current = null;
    }

    // 2. 重置状态
    setIsNavigating(false);
    setActivePath([]); // 🔑 触发原生侧 path.isEmpty 逻辑
    setSmoothPosition(null);
    simulationStartTimeRef.current = 0;
    // 🔑 强制重置 markerKey，确保小车 Marker 彻底重建，消除任何残余的原生动画状态
    setMarkerKey(prev => prev + 1);

    // 3. 将小车位置重置到路径起点
    if (routeData.length > 0) {
      setCurrentPosition({...routeData[0]}); // 🔑 使用解构强制创建一个新对象，确保触发 Marker 的 position 更新
    } 
  };

  // 当导航状态或追踪模式改变时，管理相机跟随
  useEffect(() => {
    if (isNavigating && trackingMode === 'simulation' && routeData.length > 0) {
      if (cameraFollowIntervalRef.current) clearInterval(cameraFollowIntervalRef.current);
      
      const dist = ExpoGaodeMapModule.calculatePathLength(routeData);
      const durationMs = smoothDuration * 1000;
      const updateInterval = 100; // 恢复到 100ms 高频更新
      
      cameraFollowIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - simulationStartTimeRef.current;
        const progress = Math.min(1, elapsed / durationMs);
        
        const targetDist = dist * progress;
        const pointInfo = ExpoGaodeMapModule.getPointAtDistance(routeData, targetDist);
        
        if (pointInfo && mapRef.current) {
          // 更新同步位置
          setSmoothPosition({ latitude: pointInfo.latitude, longitude: pointInfo.longitude });

          // 优化角度旋转：增加预读 (Look-ahead) 逻辑，使转弯更自然
          const lookAheadDist = 5; 
          const futurePoint = ExpoGaodeMapModule.getPointAtDistance(routeData, Math.min(dist, targetDist + lookAheadDist));
          
          let targetAngle = pointInfo.angle;
          if (futurePoint && targetDist + lookAheadDist < dist) {
            const diffNext = futurePoint.angle - pointInfo.angle;
            let normalizedDiff = diffNext;
            if (normalizedDiff > 180) normalizedDiff -= 360;
            if (normalizedDiff < -180) normalizedDiff += 360;
            targetAngle = pointInfo.angle + normalizedDiff * 0.4;
          }
          
          let currentAngle = lastAngleRef.current;
          let diff = targetAngle - currentAngle;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;

          const smoothFactor = 0.2;
          const interpolatedAngle = currentAngle + diff * smoothFactor;
          lastAngleRef.current = interpolatedAngle;

          mapRef.current.moveCamera({
            target: { latitude: pointInfo.latitude, longitude: pointInfo.longitude },
            zoom: 17,
            bearing: interpolatedAngle,
          }, Platform.OS === 'android' ? 200 : updateInterval); // Android 赋予稍长的动画缓冲时间，减少抖动
        }

        if (progress >= 1) {
          stopSimulation();
        }
      }, updateInterval);
    } else {
      if (cameraFollowIntervalRef.current) {
        clearInterval(cameraFollowIntervalRef.current);
        cameraFollowIntervalRef.current = null;
      }
    }
  }, [isNavigating, trackingMode, routeData, smoothDuration]);

  useEffect(() => {
    return () => {
      if (cameraFollowIntervalRef.current) clearInterval(cameraFollowIntervalRef.current);
    };
  }, []);

  // 缓存导航路径，只有在导航状态切换时才改变引用，防止动画因重绘而重启
  const memoizedRouteData = useMemo(() => {
    return isNavigating ? routeData : undefined;
  }, [isNavigating, routeData]);

  return (
    <View style={styles.container}>
      {initialCamera && (
        <MapView
          ref={mapRef}
          style={styles.map}
          mapType={2}
          initialCameraPosition={initialCamera}
          myLocationEnabled={trackingMode === 'realtime'}
          myLocationButtonEnabled={true}
          indoorViewEnabled
          buildingsEnabled
          labelsEnabled
        >
          {routeData.length > 0 && (
            <>
              <Polyline
                points={routeData}
                strokeWidth={8}
                strokeColor={'#FFF'}
              />
              <Marker
                position={routeData[0]}
                // title="起点"
                icon={startIcon}
                iconWidth={40}
                iconHeight={40}
                zIndex={100}
              />
              <Marker
                position={routeData[routeData.length - 1]}
                // title="终点"
                icon={endIcon}
                iconWidth={40}
                iconHeight={40}
                zIndex={100}
              />
            </>
          )}
          
          {currentPosition && (
            <Marker
              key={markerKey}
              // 🔑 修复：针对 Android 和 iOS 采用不同的 position 策略
              // Android: 必须通过 smoothPosition 持续更新属性，相机视角才能跟随车辆
              // iOS: 必须保持 position 稳定（锚定在起点），否则会与原生动画冲突导致抖动
              position={
                Platform.OS === 'android'
                  ? (isNavigating && smoothPosition ? smoothPosition : (isNavigating && activePath ? activePath[0] : (currentPosition || defaultOrigin)))
                  : (isNavigating && activePath ? activePath[0] : (currentPosition || defaultOrigin))
              }
              smoothMovePath={isNavigating ? activePath : undefined}
              smoothMoveDuration={isNavigating ? smoothDuration : undefined}
              icon={carIcon}
              iconWidth={18}
              iconHeight={18 * 200 / 120}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={100}
              flat={true}
            />
          )}
        </MapView>
      )}

      <View style={[styles.controlPanel, { backgroundColor: C.background }]}>
        <Text style={[styles.title, { color: C.text }]}>路径规划与平滑移动</Text>
        
        <View style={styles.modeSelector}>
          <Pressable 
            style={[styles.modeButton, trackingMode === 'simulation' && { backgroundColor: C.tint + '22' }]}
            onPress={() => setTrackingMode('simulation')}
          >
            <Text style={[styles.modeText, { color: trackingMode === 'simulation' ? C.tint : C.text }]}>模拟导航</Text>
          </Pressable>
          <Pressable 
            style={[styles.modeButton, trackingMode === 'realtime' && { backgroundColor: C.tint + '22' }]}
            onPress={() => setTrackingMode('realtime')}
          >
            <Text style={[styles.modeText, { color: trackingMode === 'realtime' ? C.tint : C.text }]}>实时追踪</Text>
          </Pressable>
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, { backgroundColor: C.tint }]}
            onPress={planRoute}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>规划路径</Text>
            )}
          </Pressable>

          {trackingMode === 'simulation' && (
            <Pressable
              style={[
                styles.button,
                { backgroundColor: isNavigating ? '#ff4d4f' : '#52c41a' },
                routeData.length === 0 && styles.disabledButton
              ]}
              onPress={isNavigating ? stopSimulation : startSimulation}
              disabled={routeData.length === 0}
            >
              <Text style={styles.buttonText}>
                {isNavigating ? '停止模拟' : '开始模拟'}
              </Text>
            </Pressable>
          )}
        </View>

        {trackingMode === 'simulation' && !isNavigating && (
          <View style={styles.speedRow}>
            <Text style={[styles.speedLabel, { color: C.text }]}>模拟速度:</Text>
            {[1, 2, 5, 10].map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.speedButton,
                  speed === s && { backgroundColor: C.tint },
                  { borderColor: C.tint }
                ]}
                onPress={() => setSpeed(s)}
              >
                <Text style={[styles.speedText, speed === s ? { color: '#fff' } : { color: C.tint }]}>
                  {s}x
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controlPanel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  modeSelector: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 16, padding: 4 },
  modeButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  modeText: { fontSize: 14, fontWeight: '500' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 0.48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  disabledButton: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  speedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  speedLabel: { fontSize: 14, marginRight: 12 },
  speedButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, marginRight: 8 },
  speedText: { fontSize: 12, fontWeight: '600' },
});
