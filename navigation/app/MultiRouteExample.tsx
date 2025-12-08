import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { toast } from 'sonner-native';
import * as ExpoGaodeMapNavigation from 'expo-gaode-map-navigation';
import type { DriveRouteOptions, RouteResult, DriveRouteResult, Coordinates } from 'expo-gaode-map-navigation';
import { RouteType, DriveStrategy,MapView, Marker, Polyline, MapViewRef, NaviView, type NaviViewRef  } from 'expo-gaode-map-navigation';
import { Stack } from 'expo-router';

// 定义带有策略信息的路线接口
interface ExtendedRouteResult extends RouteResult {
  strategyName: string;
  strategyId: number;
  color: string;
  strategy: DriveStrategy;
}

const { width, height } = Dimensions.get('window');

// 路线颜色配置
const ROUTE_COLORS = [
  '#2196F3', // 蓝色 - 最快
  '#4CAF50', // 绿色 - 少收费
  '#FF9800', // 橙色 - 最短
  '#9C27B0', // 紫色 - 少高速
];

const ROUTE_NAMES = ['最快', '少收费', '最短', '少高速'];

export default function MultiRouteExample() {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [allRoutes, setAllRoutes] = useState<ExtendedRouteResult[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [showNaviView, setShowNaviView] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeStrategies, setRouteStrategies] = useState<{ id: number; name: string; strategy: DriveStrategy; color: string }[]>([]);
  const [calculatingProgress, setCalculatingProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
  } | null>(null);
  
  const mapRef = useRef<MapViewRef>(null);
  const naviViewRef = useRef<NaviViewRef>(null);
  const isCalculatingRef = useRef(false);

  // 获取当前位置
  const getCurrentLocation = async (moveMap: boolean = false) => {
    try {
      // 使用北京西站作为起点
      const location = {
        latitude: 39.8943,
        longitude: 116.3220,
        accuracy: 10,
        timestamp: Date.now(),
      };
      
      if (location) {
        setCurrentLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        
        // 只有在用户手动点击刷新时才移动地图
        if (moveMap && mapRef.current) {
          setTimeout(() => {
            mapRef.current?.moveCamera({
              target: {
                latitude: location.latitude,
                longitude: location.longitude,
              },
              zoom: 12,
            }, 1000);
          }, 300);
        }
      }
    } catch (error) {
      console.error('获取位置失败:', error);
      toast.error('获取位置失败，请检查定位权限');
    }
  };

  // 计算多条驾车路线
  const calculateMultipleRoutes = async () => {
    if (!currentLocation) {
      toast.warning('请先获取当前位置');
      return;
    }
    
    if (isCalculatingRef.current) {
      toast.warning('路径计算中，请稍候...');
      return;
    }

    setIsCalculating(true);
    isCalculatingRef.current = true;
    setAllRoutes([]);
    setSelectedRouteIndex(0);
    setRouteStrategies([]);
    setCalculatingProgress(null);

    // 目的地：首都机场
    const destination = {
      latitude: 40.0799,
      longitude: 116.6031,
    };

    try {
      console.log('[MultiRoute] 开始计算多条驾车路线...');
      
      // 定义不同的策略
      const strategies = [
        { id: 0, name: '最快', strategy: DriveStrategy.FASTEST, color: ROUTE_COLORS[0] },
        { id: 1, name: '少收费', strategy: DriveStrategy.FEE_FIRST, color: ROUTE_COLORS[1] },
        { id: 2, name: '最短', strategy: DriveStrategy.SHORTEST, color: ROUTE_COLORS[2] },
        { id: 3, name: '少高速', strategy: DriveStrategy.NO_HIGHWAY, color: ROUTE_COLORS[3] }
      ];
      
      // 顺序计算多条路线，避免 AMapNavi 实例冲突
      const validRoutes: ExtendedRouteResult[] = [];
      
      for (let i = 0; i < strategies.length; i++) {
        const s = strategies[i];
        
        // 更新计算进度
        setCalculatingProgress({
          current: i + 1,
          total: strategies.length,
          currentName: s.name,
        });
        
        console.log(`[MultiRoute] 计算第 ${i + 1} 条路线: ${s.name}`);
        
        const options: DriveRouteOptions = {
          from: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          to: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
          type: RouteType.DRIVE,
          strategy: s.strategy,
        };
        
        try {
          const result = await ExpoGaodeMapNavigation.calculateDriveRoute(options);
          console.log(`[MultiRoute] ${s.name} 计算结果:`, result);
          
          if (result && 'routes' in result && result.routes && result.routes.length > 0) {
            const route = result.routes[0];
            // 为路线添加策略信息
            const extendedRoute: ExtendedRouteResult = {
              ...route,
              strategyName: s.name,
              strategyId: s.id,
              color: s.color,
              strategy: s.strategy,
            };
            validRoutes.push(extendedRoute);
            console.log(`[MultiRoute] ${s.name} 计算成功`);
          } else {
            console.warn(`[MultiRoute] ${s.name} 没有返回有效路线`);
          }
          
          // 在每次计算后添加短暂延迟，避免冲突
          if (i < strategies.length - 1) {
            console.log(`[MultiRoute] 等待 500ms 后计算下一条路线...`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`[MultiRoute] ${s.name}路线计算失败:`, error);
        }
      }
      
      const results = validRoutes;
      
      if (results.length > 0) {
        setAllRoutes(results);
        setRouteStrategies(strategies.filter((_, index) => results[index]));
        console.log(`[MultiRoute] 成功计算${results.length}条路线`);
        
        toast.success(`成功计算${results.length}条路线！请选择合适的路线进行导航`);
      } else {
        toast.error('未能计算出任何路线，请重试');
      }
    } catch (error) {
      console.error('[MultiRoute] 计算路线失败:', error);
      toast.error(`计算路线失败: ${String(error)}`);
    } finally {
      setIsCalculating(false);
      isCalculatingRef.current = false;
      setCalculatingProgress(null);
    }
  };

  // 选择路线
  const selectRoute = (index: number) => {
    setSelectedRouteIndex(index);
  };

  // 启动导航
  const startNavigation = async () => {
    if (!currentLocation || allRoutes.length === 0) {
      toast.warning('请先规划路径');
      return;
    }

    const selectedRoute = allRoutes[selectedRouteIndex];
    const destination = {
      latitude: 40.0799,
      longitude: 116.6031,
    };

    setShowNaviView(true);
    
    setTimeout(async () => {
      try {
        // 正确的调用方式：传入起点、终点对象和导航类型
        await naviViewRef.current?.startNavigation(
          currentLocation,  // 起点坐标对象
          destination,      // 终点坐标对象
          1                 // 1 = 模拟导航
        );
      } catch (error) {
        console.error('启动导航失败:', error);
        toast.error(`启动导航失败: ${String(error)}`);
        setShowNaviView(false);
      }
    }, 500);
  };

  // 关闭导航视图
  const closeNaviView = () => {
    setShowNaviView(false);
  };

  useEffect(() => {
    getCurrentLocation();
    
    // 组件卸载时清理
    return () => {
      console.log('[MultiRoute] 组件卸载，清理路径计算状态');
      setIsCalculating(false);
      isCalculatingRef.current = false;
      setCalculatingProgress(null);
      
      // 清理原生层的计算实例
      try {
        ExpoGaodeMapNavigation.destroyAllCalculators?.();
      } catch (error) {
        console.warn('[MultiRoute] 清理原生计算器失败:', error);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '多路线导航示例' }} />
      {showNaviView ? (
        <View style={styles.navContainer}>
          <NaviView
            ref={naviViewRef}
            style={styles.naviView}
            naviType={1}
            showCamera={true}
            enableVoice={true}
            onNaviStart={(e) => console.log('导航开始', e.nativeEvent)}
            onNaviEnd={(e) => {
              console.log('导航结束', e.nativeEvent);
              toast.info(`导航结束: ${e.nativeEvent.reason}`);
              setShowNaviView(false);
            }}
            onArrive={(e) => {
              console.log('到达目的地', e.nativeEvent);
              toast.success('恭喜，您已到达目的地！');
              setShowNaviView(false);
            }}
          />
          <TouchableOpacity style={styles.closeButton} onPress={closeNaviView}>
            <Text style={styles.closeButtonText}>关闭导航</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialCameraPosition={{
              target: {
                latitude: 39.8943,
                longitude: 116.3220,
              },
              zoom: 10,
            }}
            myLocationEnabled={true}
            compassEnabled={true}
          >
            {/* 显示当前位置 */}
            {currentLocation && (
              <Marker
                position={currentLocation}
                title="起点：北京西站"
                pinColor="green"
              />
            )}

            {/* 只显示选中的路线 */}
            {allRoutes.map((route, index) => {
              const points = route.polyline || [];
              const routeColor = route.color || ROUTE_COLORS[index] || '#2196F3';
              const isSelected = selectedRouteIndex === index;
              
              // 只显示选中的路线，避免多条路线重叠造成混乱
              if (!isSelected) return null;
              
              console.log(`[MultiRoute] 显示路线 ${index} (${route.strategyName}), 颜色: ${routeColor}, 点数: ${points.length}`);
              
              return (
                <Polyline
                  key={`route-${index}`}
                  points={points}
                  strokeWidth={8}
                  strokeColor={routeColor}
                  zIndex={10}
                />
              );
            })}

            {/* 显示目的地 */}
            <Marker
              position={{
                latitude: 40.0799,
                longitude: 116.6031,
              }}
              title="终点：首都机场"
              pinColor="red"
            />
          </MapView>

          {/* 控制按钮 */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.button, styles.refreshButton]}
              onPress={() => getCurrentLocation(true)}
            >
              <Text style={styles.buttonText}>刷新位置</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.calculateButton, isCalculating && styles.disabledButton]} 
              onPress={calculateMultipleRoutes}
              disabled={isCalculating}
            >
              <Text style={styles.buttonText}>
                {isCalculating ? '计算中...' : '计算多条路线'}
              </Text>
            </TouchableOpacity>

            {allRoutes.length > 0 && (
              <TouchableOpacity 
                style={[styles.button, styles.navigationButton]} 
                onPress={startNavigation}
              >
                <Text style={styles.buttonText}>开始导航</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 计算进度指示器 */}
          {isCalculating && calculatingProgress && (
            <View style={styles.progressOverlay}>
              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>正在计算路线...</Text>
                <Text style={styles.progressText}>
                  {calculatingProgress.current} / {calculatingProgress.total}
                </Text>
                <Text style={styles.progressRoute}>
                  当前: {calculatingProgress.currentName}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(calculatingProgress.current / calculatingProgress.total) * 100}%`,
                        backgroundColor: ROUTE_COLORS[calculatingProgress.current - 1] || '#2196F3'
                      }
                    ]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* 路线选择器 */}
          {allRoutes.length > 0 && (
            <View style={styles.routeSelector}>
              <Text style={styles.selectorTitle}>选择路线（点击查看详情）:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.routeCards}>
                  {allRoutes.map((route, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.routeCard,
                        selectedRouteIndex === index && styles.selectedRouteCard,
                        { borderColor: (route as any).color }
                      ]}
                      onPress={() => selectRoute(index)}
                    >
                      <View style={styles.routeHeader}>
                        <Text style={[
                          styles.routeTitle,
                          { color: (route as any).color }
                        ]}>
                          {(route as any).strategyName}
                        </Text>
                        {selectedRouteIndex === index && (
                          <Text style={styles.selectedBadge}>当前选择</Text>
                        )}
                      </View>
                      
                      <Text style={styles.routeDistance}>
                        {typeof route.distance === 'number' ? route.distance : '未知'}米
                      </Text>
                      
                      <Text style={styles.routeDuration}>
                        {typeof route.duration === 'number' ? Math.floor(route.duration / 60) : '未知'}分钟
                      </Text>
                      
                      {typeof (route as any).tollCost === 'number' && (route as any).tollCost > 0 && (
                        <Text style={styles.routeToll}>
                          过路费: ¥{(route as any).tollCost}
                        </Text>
                      )}
                      
                      <View style={[
                        styles.routeIndicator,
                        { backgroundColor: (route as any).color }
                      ]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* 路线对比信息 */}
          {allRoutes.length > 1 && (
            <View style={styles.comparisonInfo}>
              <Text style={styles.comparisonTitle}>路线对比</Text>
              <View style={styles.comparisonGrid}>
                {allRoutes.map((route, index) => (
                  <View key={index} style={styles.comparisonItem}>
                    <Text style={[
                      styles.comparisonLabel,
                      { color: (route as any).color }
                    ]}>
                      {(route as any).strategyName}
                    </Text>
                    <Text style={styles.comparisonValue}>
                      {typeof route.duration === 'number' ? Math.floor(route.duration / 60) : '未知'}分
                    </Text>
                    <Text style={styles.comparisonDetail}>
                      {typeof route.distance === 'number' ? route.distance : '未知'}米
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
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
  controls: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#607D8B',
  },
  calculateButton: {
    backgroundColor: '#2196F3',
  },
  navigationButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  routeSelector: {
    position: 'absolute',
    top: 190,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  routeCards: {
    flexDirection: 'row',
    gap: 10,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    minWidth: 120,
    alignItems: 'center',
    position: 'relative',
  },
  selectedRouteCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  routeHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 5,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedBadge: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 2,
  },
  routeDistance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  routeDuration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  routeToll: {
    fontSize: 12,
    color: '#999',
  },
  routeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  comparisonInfo: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 8,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  comparisonDetail: {
    fontSize: 12,
    color: '#ccc',
  },
  navContainer: {
    flex: 1,
    position: 'relative',
  },
  naviView: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 8,
  },
  progressRoute: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});