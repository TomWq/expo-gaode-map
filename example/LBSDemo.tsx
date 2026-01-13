import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, Keyboard, Dimensions } from 'react-native';
import { 
  MapView, 
  Marker, 
  Polyline, 
  ExpoGaodeMapModule, 
  type MapViewRef,
  type CameraPosition 
} from 'expo-gaode-map';
import { GaodeWebAPI, DrivingStrategy } from 'expo-gaode-map-web-api';



export default function LBSDemo() {
  const mapRef = useRef<MapViewRef>(null);
  
  // 状态管理
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number, address?: string} | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<any | null>(null);
  const [routePath, setRoutePath] = useState<any[]>([]); // 路径规划结果（坐标点串）
  const [routeInfo, setRouteInfo] = useState<{distance: number, duration: number} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
   const [api, setApi] = useState<GaodeWebAPI | null>(null);
  useEffect(() => {
         ExpoGaodeMapModule.initSDK({
          webKey: "9f59c9453ccc5e9798983d4922afbd09",
        })
         const newApi = new GaodeWebAPI();
         setApi(newApi);
  }, []);

  // 场景 1: 定位 + 逆地理编码 (Core + Web API)
  const handleLocateMe = async () => {
    try {
      // 1. Core: 获取原生定位
      const loc = await ExpoGaodeMapModule.getCurrentLocation();
      
      // 2. Web API: 逆地理编码获取详细地址
      const regeo = await api?.geocode.regeocode({
        latitude: loc.latitude,
        longitude: loc.longitude
      });

      const address = regeo?.regeocode.formatted_address;
      
      const newLoc = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        address
      };
      
      setCurrentLocation(newLoc);

      // 3. Core: 移动地图视角
      mapRef.current?.moveCamera({
        target: { latitude: loc.latitude, longitude: loc.longitude },
        zoom: 16
      });

      Alert.alert('当前位置', address);
      
    } catch (error) {
      console.error(error);
      Alert.alert('定位失败', '请检查权限或网络');
    }
  };

  // 场景 2: 关键字搜索 (Web API)
  const handleSearch = async () => {
    if (!searchText) return;
    Keyboard.dismiss();
    setIsSearching(true);
    
    try {
      // Web API: POI 搜索
      // 优先搜索当前位置周边，如果没有当前位置则默认搜索
      const options: any = { city: '北京' }; // 默认城市
      if (currentLocation) {
         // 周边搜索更符合用户直觉
         const result = await api?.poi.searchAround(
             { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
             { keywords: searchText }
         );
         setSearchResults(result?.pois || []);
      } else {
         const result = await api?.poi.search(searchText, options);
         setSearchResults(result?.pois || []);
      }
    } catch (error) {
      Alert.alert('搜索失败', String(error));
    } finally {
      setIsSearching(false);
    }
  };

  // 场景 3: 选中地点并展示 (Core Marker)
  const handleSelectPoi = (poi: any) => {
    const [lng, lat] = poi.location.split(',').map(Number);
    const target = { latitude: lat, longitude: lng, name: poi.name, address: poi.address };
    
    setSelectedPoi(target);
    setSearchResults([]); // 清空搜索列表
    setSearchText(poi.name);

    // 移动地图
    mapRef.current?.moveCamera({
      target: { latitude: lat, longitude: lng },
      zoom: 16
    });
  };

  // 场景 4: 路径规划 (Web API + Core Polyline)
  const handlePlanRoute = async () => {
    if (!currentLocation || !selectedPoi) {
      Alert.alert('提示', '需要先定位并选择一个目的地');
      return;
    }

    try {
      // Web API: 驾车规划
      // 格式: "经度,纬度"
      const startStr = `${currentLocation.longitude},${currentLocation.latitude}`;
      const endStr = `${selectedPoi.longitude},${selectedPoi.latitude}`;

      const result = await api?.route.driving(startStr, endStr, {
        strategy: DrivingStrategy.AVOID_JAM, // 躲避拥堵
        show_fields: 'cost,polyline', // 必须请求 cost 和 polyline 字段
      });

      if (result && result.route.paths.length > 0) {
        const path = result.route.paths[0];
        
        // 解析步骤中的所有坐标点
        const points: any[] = [];
        path.steps.forEach(step => {
          const polyline = step.polyline; // "lng,lat;lng,lat..."
          if (polyline) {
            const coords = polyline.split(';').map(pair => {
              const [lng, lat] = pair.split(',').map(Number);
              return { latitude: lat, longitude: lng };
            });
            points.push(...coords);
          }
        });

        setRoutePath(points);
        
        // V5 API 推荐从 cost 对象中获取 duration，同时也兼容旧字段
        const durationStr = path.cost?.duration || path.duration || '0';
        const distanceStr = path.distance || '0';
        
        setRouteInfo({
          distance: Number(distanceStr),
          duration: Number(durationStr)
        });

        // 缩放地图以显示全貌
        // 注意：这里简单移动到中间，实际可以使用 bounds 缩放（如果 Core 支持 setRegion 或 fitBounds）
        // 暂时移动到起点
        mapRef.current?.moveCamera({
            target: { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
            zoom: 12
        });
      }
    } catch (error) {
      Alert.alert('规划失败', String(error));
    }
  };

  return (
    <View style={styles.container}>
      {/* 顶部搜索栏 */}
      <View style={styles.searchBar}>
        <TextInput 
          style={styles.input}
          placeholder="搜索地点 (例如: 咖啡)"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={{color: 'white'}}>搜索</Text>
        </TouchableOpacity>
      </View>

      {/* 搜索结果列表 (浮层) */}
      {searchResults.length > 0 && (
        <View style={styles.resultList}>
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectPoi(item)}>
                <Text style={styles.resultTitle}>{item.name}</Text>
                <Text style={styles.resultSub}>{item.address}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSearchResults([])}>
            <Text>关闭列表</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 地图区域 */}
      <MapView 
        ref={mapRef}
        style={styles.map}
        zoomGesturesEnabled={true}
        scrollGesturesEnabled={true}
        initialCameraPosition={{
            target: { latitude: 39.9042, longitude: 116.4074 }, // 北京默认
            zoom: 10
        }}
      >
        {/* 1. 当前位置标记 (自定义蓝色圆点) */}
        {currentLocation && (
          <Marker
            position={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
            title="我的位置"
            snippet={currentLocation.address}
            pinColor="blue"
          />
        )}

        {/* 2. 目的地标记 */}
        {selectedPoi && (
          <Marker
            position={{ latitude: selectedPoi.latitude, longitude: selectedPoi.longitude }}
            title={selectedPoi.name}
            snippet={selectedPoi.address}
            pinColor="red"
          />
        )}

        {/* 3. 规划路线 */}
        {routePath.length > 0 && (
          <Polyline
            points={routePath}
            strokeColor="#0091FF"
            strokeWidth={6}
          />
        )}
      </MapView>

      {/* 底部操作栏 */}
      <View style={styles.bottomPanel}>
        <View style={styles.infoRow}>
          {routeInfo ? (
            <Text style={styles.infoText}>
              🚗 距离: {(routeInfo.distance / 1000).toFixed(1)}km  
              ⏱️ 耗时: {Math.ceil(routeInfo.duration / 60)}分钟
            </Text>
          ) : (
            <Text style={styles.infoText}>
              {currentLocation ? '已定位' : '未定位'} 
              {selectedPoi ? ` -> ${selectedPoi.name}` : ''}
            </Text>
          )}
        </View>
        
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#4CAF50'}]} onPress={handleLocateMe}>
            <Text style={styles.btnText}>1. 定位我</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: selectedPoi ? '#2196F3' : '#ccc'}]} 
            onPress={handlePlanRoute}
            disabled={!selectedPoi}
          >
            <Text style={styles.btnText}>2. 规划路线</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#FF9800'}]} 
            onPress={() => {
                setRoutePath([]);
                setRouteInfo(null);
                setSelectedPoi(null);
                setSearchText('');
            }}
          >
            <Text style={styles.btnText}>重置</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  map: {
    flex: 1,
  },
  searchBar: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    height: 40,
  },
  searchBtn: {
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 4,
  },
  resultList: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    maxHeight: 300,
    backgroundColor: 'white',
    zIndex: 20,
    borderRadius: 8,
    elevation: 5,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  resultSub: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  closeBtn: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 30,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    elevation: 6,
  },
  infoRow: {
    marginBottom: 10,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
