import { Ionicons } from '@expo/vector-icons';
import { CameraPosition, ExpoGaodeMapModule, MapView, MapViewRef, Marker, Polyline, type CameraEvent, type LatLng } from 'expo-gaode-map';
import { getInputTips, InputTip } from 'expo-gaode-map-search';
import { GaodeWebAPI, PathCost, Step } from 'expo-gaode-map-web-api';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';


interface ExtendedStep extends Step {
  cost?: PathCost;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const VISUAL_CENTER_RATIO = 0.5; // 视觉中心在屏幕 50% 处
const markerIcon = Image.resolveAssetSource(require('./assets/end.png')).uri

export default function DynamicRouteTrackingExample() {
  const mapRef = useRef<MapViewRef | null>(null);
  
  // State
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [routePath, setRoutePath] = useState<LatLng[]>([]);
  const [traveledIndex, setTraveledIndex] = useState(0);
  const [isPlanning, setIsPlanning] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [initialPosition, setInitialPosition] = useState<CameraPosition | null>(null);
  const [routeSteps, setRouteSteps] = useState<ExtendedStep[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false); // 新增：导航状态
  const [isSimulating, setIsSimulating] = useState(false); // 新增：模拟导航状态
  const [simulatedPath, setSimulatedPath] = useState<LatLng[]>([]); // 专门用于模拟的简化路径
  const [simulationProgress, setSimulationProgress] = useState(0);
  const cameraTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Search State
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<InputTip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Helpers
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const api = useMemo(() => new GaodeWebAPI(), []);
  const hasInitialized = useRef(false);

  // 1. 定位初始化
  useEffect(() => {
    (async () => {
      const loc = await ExpoGaodeMapModule.getCurrentLocation();
     
      if (loc) {
        setCurrentLocation(loc);
        // 初始移动到定位点
         setInitialPosition({
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 15
        });
        setTimeout(() => {
            hasInitialized.current = true;
        }, 1000);
      }
    })();

    return () => {
      if (cameraTimer.current) {
        clearInterval(cameraTimer.current);
      }
    };
  }, []);

  // 2. 实时计算进度
  useEffect(() => {
    if (!currentLocation || routePath.length === 0) return;

    // 使用原生方法计算最近点，性能更好且更准确
    const result = ExpoGaodeMapModule.getNearestPointOnPath(routePath, {
        latitude: Number(currentLocation.latitude),
        longitude: Number(currentLocation.longitude)
    });
    
    if (result) {
        // 更新进度（只增不减，防止定位漂移导致回退）
        if (result.index > traveledIndex) {
            setTraveledIndex(result.index);
        }
    }
  }, [currentLocation, routePath]);

  // 模拟导航逻辑
  const startSimulation = () => {
    if (routePath.length === 0) return;
    
    // 1. 简化路径以提高动画性能
    const simplified = ExpoGaodeMapModule.simplifyPolyline(routePath, 2);
    if (simplified.length < 2) return;
    setSimulatedPath(simplified);
    setSimulationProgress(0);
    
    setIsSimulating(true);
    setIsNavigating(true);
    
    // 2. 启动 JS 定时动画
    const duration = Math.max(5000, simplified.length * 100);
    const startedAt = Date.now();

    // 3. 启动相机跟随定时器
    if (cameraTimer.current) clearInterval(cameraTimer.current);
    cameraTimer.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const progress = Math.min(1, elapsed / duration);
        setSimulationProgress(progress);
        const currentIndex = Math.floor(progress * (simplified.length - 1));
        
        if (currentIndex >= 0 && currentIndex < simplified.length) {
            const point = simplified[currentIndex];
            mapRef.current?.moveCamera({
                target: point,
                zoom: 17,
                bearing: 0,
                tilt: 0
            }, 500);
        }

        if (progress >= 1) {
          stopSimulation();
        }
    }, 500);
  };

  const stopSimulation = () => {
    if (cameraTimer.current) {
        clearInterval(cameraTimer.current);
        cameraTimer.current = null;
    }
    setIsSimulating(false);
    setSimulationProgress(0);
  };

  // 清理定时器
  useEffect(() => {
      return () => stopSimulation();
  }, []);

  // 3. 规划路线
  const planRoute = async (start: LatLng, end: LatLng) => {
    setIsPlanning(true);
    setRouteInfo(null);
    setRouteSteps([]);
    try {
      const originStr = `${start.longitude},${start.latitude}`;
      const destStr = `${end.longitude},${end.latitude}`;
      
      const res = await api.route.walking(originStr, destStr, {
        show_fields: 'polyline,cost',
      });
      
      if (res.route.paths.length > 0) {
        const pathData = res.route.paths[0];
        let allPoints: LatLng[] = [];
        
        for (const step of pathData.steps) {
            if (step.polyline) {
                const points = ExpoGaodeMapModule.parsePolyline(step.polyline);
                allPoints.push(...points);
            }
        }
        // 抽稀路径点，减少渲染压力
        // 容差值 5 米，意味着偏离直线小于 5 米的点会被移除
        allPoints = ExpoGaodeMapModule.simplifyPolyline(allPoints, 5);
        setRoutePath(allPoints);
        setTraveledIndex(0);
        setRouteSteps(pathData.steps);
        setRouteInfo({
            distance: formatDistance(parseInt(pathData.distance)),
            duration: formatDuration(parseInt(pathData.cost?.duration??'0'))
        });
      }
    } catch (error) {
      console.log('Route planning failed:', error);
      // 不弹窗打扰用户，可能是移动中频繁触发
    } finally {
      setIsPlanning(false);
    }
  };

  const formatDistance = (meters: number) => {
      return meters > 1000 ? `${(meters/1000).toFixed(1)}km` : `${meters}m`;
  };

  const formatDuration = (seconds: number) => {
      const min = Math.ceil(seconds / 60);
      return min >= 60 ? `${(min/60).toFixed(1)}小时` : `${min}分钟`;
  };

  // 4. 地图移动交互
  const onCameraIdle = (e: NativeSyntheticEvent<CameraEvent>) => {
      if (!hasInitialized.current) return;
      
      // 修改：如果正在导航中，不触发重新规划
      if (isNavigating) return;
      
      const target = e.nativeEvent.cameraPosition.target;
      if (target) {
          setDestination(target);
          // 只有当有定位时才规划
          if (currentLocation) {
              // 简单防抖或直接规划，这里直接规划，因为 idle 已经是停下来了
              planRoute(currentLocation, target);
          }
      }
  };

  const onCameraMove = () => {
      // 移动中，清除旧路线，只显示选点状态
  };

  // 5. 搜索功能
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (text.length > 0) {
      setIsSearching(true);
      searchTimer.current = setTimeout(async () => {
        try {
          const result = await getInputTips({ keyword: text, city: '全国' });
          setSuggestions(result.tips || []);
        } catch (error) {
          console.error(error);
        }
      }, 500);
    } else {
      setIsSearching(false);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item: InputTip) => {
      if (!item.location) return;
      
      const pos = { latitude: item.location.latitude, longitude: item.location.longitude };
      
      // 移动地图到该点
      mapRef.current?.moveCamera({
          target: pos,
          zoom: 16
      }, 0);
      
      setIsSearching(false);
      setSearchText(item.name);
      setSuggestions([]);
      Keyboard.dismiss();
      
      // onCameraIdle 会被触发并执行规划
  };

  return (
    <View style={styles.container}>
      {/* 顶部搜索栏 */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索地点规划路线"
              placeholderTextColor="#BBB"
              value={searchText}
              onChangeText={handleSearchTextChange}
              onFocus={() => {
                if (searchText.length > 0) setIsSearching(true);
              }}
              clearButtonMode="while-editing"
              autoCorrect={false}
            />
            {searchText.length > 0 && Platform.OS !== 'ios' && (
              <TouchableOpacity onPress={() => {
                setSearchText('');
                setSuggestions([]);
              }}>
                <Ionicons name="close-circle" size={18} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>
          {(isSearching || searchText.length > 0) && (
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setIsSearching(false);
                setSearchText('');
                setSuggestions([]);
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 搜索建议列表 */}
      {isSearching && suggestions.length > 0 && (
          <View style={styles.suggestionOverlay}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, i) => item.id || String(i)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectSuggestion(item)}>
                  <Ionicons name="location-outline" size={20} color="#666" style={{marginRight: 10}}/>
                  <View style={{flex: 1}}>
                      <Text style={styles.suggestionName}>{item.name}</Text>
                      <Text style={styles.suggestionAddr}>{item.adName}{item.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          </View>
      )}

      {/* 地图主体 */}
      <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={styles.map}
            myLocationEnabled={true}
            followUserLocation={false} 
            onLocation={(e) => setCurrentLocation(e.nativeEvent)}
            onCameraIdle={onCameraIdle}
            onCameraMove={onCameraMove}
            initialCameraPosition={initialPosition as CameraPosition}
          >
            {/* 1. 非模拟状态：渲染普通 Polyline */}
            {!isSimulating && routePath.length > 0 && (
              <>
                <Polyline
                    points={routePath.slice(traveledIndex)}
                    strokeColor="#CCCCCC"
                    strokeWidth={8}
                    zIndex={2}
                />
                {traveledIndex > 0 && (
                    <Polyline
                        points={routePath.slice(0, traveledIndex + 1)}
                        strokeColor="#4CAF50"
                        strokeWidth={8}
                        zIndex={2}
                    />
                )}
              </>
            )}

            {/* 2. 模拟状态：渲染动画 Polyline */}
            {isSimulating && simulatedPath.length > 0 && (
              <>
                {/* 灰底：全长 */}
                <Polyline
                    points={simulatedPath}
                    strokeColor="#CCCCCC"
                    strokeWidth={8}
                    zIndex={1}
                />
                <Polyline
                    points={simulatedPath.slice(0, Math.max(2, Math.ceil(simulationProgress * simulatedPath.length)))}
                    strokeColor="#4CAF50"
                    strokeWidth={8}
                    zIndex={2}
                />
              
              </>
            )}

            {/* 导航时的终点 Marker - 仅在非模拟状态或模拟结束后显示 */}
            {isNavigating && !isSimulating && destination && (
              <Marker
                position={destination}
                zIndex={10}
              >
                <Image 
                  source={require('./assets/end.png')} 
                  style={styles.pinIcon}
                  resizeMode="contain"
                />
              </Marker>
            )}
          </MapView>

          {/* 屏幕中心固定 Pin - 仅在非导航状态显示 */}
          {!isNavigating && (
            <View style={styles.centerMarker} pointerEvents="none">
                <Image 
                  source={require('./assets/end.png')} 
                  style={styles.pinIcon}
                  resizeMode="contain"
                />
                {/* <View style={styles.pinShadow} /> */}
            </View>
          )}
          
          {/* 底部信息面板 */}
          <View style={styles.bottomPanel}>
              <View style={styles.routeInfo}>
                  <Text style={styles.infoTitle}>
                      {isPlanning ? '正在规划路线...' : (routeInfo ? `步行导航` : '移动地图选择终点可选择目的地/或输入框搜索')}
                  </Text>
                  {routeInfo && (
                      <View style={styles.infoDetail}>
                          <Text style={styles.infoNum}>{routeInfo.distance}</Text>
                          <Text style={styles.infoLabel}> · </Text>
                          <Text style={styles.infoNum}>{routeInfo.duration}</Text>
                      </View>
                  )}
              </View>

              {/* 按钮组 开始导航后，会隐藏中心点 显示目的地的 Marker 停止导航后，会显示中心点 隐藏目的地的 Marker，方便重新选择终点 */}
              {routeSteps.length > 0 && (
                <View style={styles.btnGroup}>
                  <TouchableOpacity 
                      style={[styles.roundBtn, isNavigating ? styles.stopBtn : styles.navBtn]}
                      onPress={() => {
                        if (isSimulating) {
                            stopSimulation();
                            // 如果是模拟中停止，同时也退出导航状态
                            setIsNavigating(false);
                            // 恢复视角
                            // if (destination) {
                            //     mapRef.current?.moveCamera({ target: destination, zoom: 16 }, 500);
                            // }
                            return;
                        }

                        if (isNavigating && destination) {
                            // 停止导航时，将地图中心移回选定的目的地，保持视觉一致
                            mapRef.current?.moveCamera({
                                target: destination,
                                zoom: 16
                            }, 500);
                        }
                        setIsNavigating(!isNavigating);
                      }}
                  >
                      <Text style={styles.btnText}>{isNavigating ? '停止' : '导航'}</Text>
                  </TouchableOpacity>

                  {/* 模拟导航按钮 - 仅在未开始导航时显示 */}
                  {!isNavigating && (
                    <TouchableOpacity 
                        style={[styles.roundBtn, { backgroundColor: '#FF9800' }]}
                        onPress={startSimulation}
                    >
                        <Text style={styles.btnText}>模拟</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                      style={[styles.roundBtn, styles.detailBtn]}
                      onPress={() => setShowDetailModal(true)}
                  >
                      <Text style={styles.btnText}>详情</Text>
                  </TouchableOpacity>
                </View>
              )}
          </View>
      </View>

      {/* 路线详情弹窗 */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>路线详情</Text>
                    <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={routeSteps}
                    keyExtractor={(_, i) => String(i)}
                    renderItem={({ item, index }) => (
                        <View style={styles.stepItem}>
                            <View style={styles.stepIndex}>
                                <Text style={styles.stepIndexText}>{index + 1}</Text>
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepInstruction}>{item.instruction} 
                                  <Text style={styles.stepDuration}> 预估耗时{formatDuration(parseInt(item?.cost?.duration || '0'))}</Text>
                                </Text>
                                <Text style={styles.stepDistance}>{formatDistance(parseInt(item.step_distance || '0'))}</Text>
                            </View>
                        </View>
                    )}
                    contentContainerStyle={styles.stepList}
                />
            </View>
        </View>
      </Modal>
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
  searchHeader: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingBottom: 12,
    zIndex: 10,
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
    elevation: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  
  },
  searchBar: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    paddingVertical: 0,
    height: '100%',
    fontWeight: '400',
  },
  cancelButton: {
    marginLeft: 15,
  },
  cancelText: {
    fontSize: 16,
    color: Platform.OS === 'ios' ? '#007AFF' : '#333',
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
  },
  suggestionOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 80,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    bottom: 0,
    zIndex: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  suggestionName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  suggestionAddr: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  centerMarker: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -16, // 图标宽度的一半
    marginTop: -32, // 图标高度
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinIcon: {
    width: 42,
    height: 42,
  },
  pinShadow: {
    width: 10,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 5,
    marginTop: -2,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeInfo: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoDetail: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'baseline',
  },
  infoNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  locationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  // New Button Group Styles
  btnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    marginLeft: 10,
  },
  navBtn: {
    backgroundColor: '#4CAF50',
  },
  stopBtn: {
    backgroundColor: '#FF3B30',
  },
  detailBtn: {
    backgroundColor: '#007AFF',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  detailBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepList: {
    padding: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepIndexText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
    lineHeight: 22,
  },
  stepDuration: {
    fontSize: 12,
    color: '#999',
  },
  stepDistance: {
    fontSize: 12,
    color: '#999',
  },
});
