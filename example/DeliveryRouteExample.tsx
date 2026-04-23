import { ExpoGaodeMapModule, MapView, MapViewRef, Marker, Polyline } from 'expo-gaode-map';
import { BicyclingRouteResponse, GaodeWebAPI, Step } from 'expo-gaode-map-web-api';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 定义路线数据的接口
interface RouteSegment {
  distance: number; // 米
  duration: number; // 秒
  polyline: Array<{ latitude: number; longitude: number }>;
}
const endIcon = Image.resolveAssetSource(require('./assets/end.png')).uri;
const startIcon = Image.resolveAssetSource(require('./assets/start.png')).uri;

export default function DeliveryRouteExample() {
  const api = useMemo(() => new GaodeWebAPI({ key: '' }), []);
  const mapRef = useRef<MapViewRef>(null);

  const [loading, setLoading] = useState(false);
  
  // 模拟坐标点
  const [locations] = useState({
    rider: { latitude: 39.9042, longitude: 116.4074, name: '当前位置(骑手)' },
    pickup: { latitude: 39.915, longitude: 116.404, name: '取货点(商家)' },
    delivery: { latitude: 39.925, longitude: 116.414, name: '送货点(客户)' },
  });

  const [routes, setRoutes] = useState<{
    toPickup: RouteSegment | null;
    toDelivery: RouteSegment | null;
  }>({
    toPickup: null,
    toDelivery: null,
  });

  // 初始化并计算路线
  useEffect(() => {
    calculateDeliveryRoutes();
  }, []);

 

  const calculateDeliveryRoutes = async () => {
    setLoading(true);
    try {
      // 1. 骑手 -> 取货点 (骑行)
      const pickupRes = await api.route.bicycling(
        `${locations.rider.longitude},${locations.rider.latitude}`,
        `${locations.pickup.longitude},${locations.pickup.latitude}`,
        { show_fields: 'polyline' }
      );

      // 2. 取货点 -> 送货点 (骑行)
      const deliveryRes = await api.route.bicycling(
        `${locations.pickup.longitude},${locations.pickup.latitude}`,
        `${locations.delivery.longitude},${locations.delivery.latitude}`,
        { show_fields: 'polyline' }
      );

      if (pickupRes.count === '0' || deliveryRes.count === '0') {
        Alert.alert('提示', '未找到有效路线');
        return;
      }

      const parseRoute = (res: BicyclingRouteResponse): RouteSegment => {
        const path = res.route.paths[0];
        const steps = path.steps;
        let points: Array<{ latitude: number; longitude: number }> = [];
        
        steps.forEach((step: Step) => {
          if (step.polyline) {
             const coords = ExpoGaodeMapModule.parsePolyline(step.polyline);
             points.push(...coords);
          }
        });

        // 抽稀路径点，减少渲染压力
        // 容差值 5 米，意味着偏离直线小于 5 米的点会被移除
        points = ExpoGaodeMapModule.simplifyPolyline(points, 5);

        const durationStr = path.cost?.duration || path.duration || '0';

        return {
          distance: parseInt(path.distance),
          duration: parseInt(durationStr),
          polyline: points,
        };
      };

      const toPickupRoute = parseRoute(pickupRes);
      const toDeliveryRoute = parseRoute(deliveryRes);

      setRoutes({
        toPickup: toPickupRoute,
        toDelivery: toDeliveryRoute,
      });

      // 调整视野以包含所有点
      setTimeout(async () => {
        const allPoints = [
          locations.rider,
          locations.pickup,
          locations.delivery,
          ...toPickupRoute.polyline,
          ...toDeliveryRoute.polyline
        ];
        
        // 使用原生模块计算边界
        const bounds =  ExpoGaodeMapModule.calculatePathBounds(allPoints);
        
        if (bounds) {
            mapRef.current?.moveCamera({
                 target: {
                  latitude: 39.9042, longitude: 116.4074,
                    //  latitude: Array.isArray(bounds.center) ? bounds.center[1] : bounds.center.latitude,
                    //  longitude: Array.isArray(bounds.center) ? bounds.center[0] : bounds.center.longitude
                 },
                 zoom: 14
             }, 500);
        }
      }, 500);

    } catch (error) {
      console.error('路线规划失败:', error);
      Alert.alert('错误', '路线规划失败，使用模拟数据展示');
      
      // 模拟数据 fallback
      const mockRoutePoints = (start: any, end: any) => [
        start,
        { latitude: (start.latitude + end.latitude) / 2, longitude: (start.longitude + end.longitude) / 2 },
        end
      ];

      setRoutes({
        toPickup: {
            distance: 1200,
            duration: 600,
            polyline: mockRoutePoints(locations.rider, locations.pickup)
        },
        toDelivery: {
            distance: 2500,
            duration: 1200,
            polyline: mockRoutePoints(locations.pickup, locations.delivery)
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.ceil(seconds / 60);
    if (mins < 60) return `${mins}分钟`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}小时${remainingMins}分钟`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}米`;
    return `${(meters / 1000).toFixed(1)}公里`;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialCameraPosition={{
          target: locations.rider,
          zoom: 14,
        }}
      >
        {/* 标记点 */}
        <Marker
          position={locations.rider}
          title={locations.rider.name}
          icon={startIcon}
          iconWidth={40}
          iconHeight={40}
          // pinColor="blue" // 骑手
        />
        <Marker
          position={locations.pickup}
          title={locations.pickup.name}
          // pinColor="orange" // 商家
        >
        
        </Marker>
        <Marker
          position={locations.delivery}
          title={locations.delivery.name}
          icon={endIcon}
          iconWidth={40}
          iconHeight={40}
          // pinColor="red" // 客户
        />

        {/* 路线 - 骑手到商家 (iOS不支持虚线，使用颜色区分) */}
        {routes.toPickup && routes.toPickup.polyline.length > 0 && (
          <Polyline
            points={routes.toPickup.polyline}
            strokeWidth={10}
            strokeColor="#4A90E2" // 蓝色
          />
        )}

        {/* 路线 - 商家到客户 (实线) */}
        {routes.toDelivery && routes.toDelivery.polyline.length > 0 && (
          <Polyline
            points={routes.toDelivery.polyline}
            strokeWidth={10}
            strokeColor="#2ecc71" // 绿色
          />
        )}
      </MapView>

      {/* 底部信息面板 */}
      <View style={styles.bottomPanel}>
        <View style={styles.handleBar} />
        
        <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>配送任务进行中</Text>
            <View style={styles.statusBadge}>
                <Text style={styles.statusText}>赶往商家</Text>
            </View>
        </View>

        {loading ? (
            <ActivityIndicator size="large" color="#2196F3" style={{marginTop: 20}} />
        ) : (
            <>
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>总距离</Text>
                        <Text style={styles.statValue}>
                            {routes.toPickup && routes.toDelivery 
                                ? formatDistance(routes.toPickup.distance + routes.toDelivery.distance)
                                : '--'}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>预计用时</Text>
                        <Text style={styles.statValue}>
                            {routes.toPickup && routes.toDelivery 
                                ? formatTime(routes.toPickup.duration + routes.toDelivery.duration)
                                : '--'}
                        </Text>
                    </View>
                </View>

                <ScrollView style={styles.detailsList}>
                    {/* 阶段 1: 取货 */}
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                            <View style={[styles.dot, { backgroundColor: '#4A90E2' }]} />
                            <View style={styles.line} />
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={styles.stepTitle}>前往取货点</Text>
                            <Text style={styles.stepDesc}>
                                距离 {routes.toPickup ? formatDistance(routes.toPickup.distance) : '--'} · 
                                预计 {routes.toPickup ? formatTime(routes.toPickup.duration) : '--'}
                            </Text>
                        </View>
                    </View>

                    {/* 阶段 2: 取货点 */}
                    <View style={styles.timelineItem}>
                         <View style={styles.timelineLeft}>
                            <View style={[styles.dot, { backgroundColor: 'orange', width: 12, height: 12, borderRadius: 6 }]} />
                            <View style={styles.line} />
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={styles.locationName}>{locations.pickup.name}</Text>
                            <Text style={styles.addressText}>北京市东城区王府井大街88号</Text>
                        </View>
                    </View>

                    {/* 阶段 3: 送货 */}
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                            <View style={[styles.dot, { backgroundColor: '#2ecc71' }]} />
                            <View style={styles.line} />
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={styles.stepTitle}>送往收货点</Text>
                            <Text style={styles.stepDesc}>
                                距离 {routes.toDelivery ? formatDistance(routes.toDelivery.distance) : '--'} · 
                                预计 {routes.toDelivery ? formatTime(routes.toDelivery.duration) : '--'}
                            </Text>
                        </View>
                    </View>

                    {/* 阶段 4: 收货点 */}
                    <View style={styles.timelineItem}>
                         <View style={styles.timelineLeft}>
                            <View style={[styles.dot, { backgroundColor: 'red', width: 12, height: 12, borderRadius: 6 }]} />
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={styles.locationName}>{locations.delivery.name}</Text>
                            <Text style={styles.addressText}>北京市西城区西单大悦城</Text>
                        </View>
                    </View>
                </ScrollView>

                <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={calculateDeliveryRoutes}
                >
                    <Text style={styles.refreshButtonText}>刷新路线</Text>
                </TouchableOpacity>
            </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    height: '45%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsList: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineLeft: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: '#999',
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
