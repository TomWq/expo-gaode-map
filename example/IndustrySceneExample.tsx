import { MapView, MapViewRef, Marker, Polygon, Polyline, type LatLng } from 'expo-gaode-map';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type School = {
  id: string;
  name: string;
  color: string;
  boundary: LatLng[];
};

type House = {
  id: string;
  title: string;
  price: string;
  position: LatLng;
  schoolId: string;
};

export default function IndustrySceneExample() {
  const mapRef = useRef<MapViewRef | null>(null);
  const schools = useMemo<School[]>(
    () => [
      {
        id: 's1',
        name: '配送区域 A',
        color: '#1976D2',
        boundary: [
          { latitude: 39.915, longitude: 116.40 },
          { latitude: 39.915, longitude: 116.41 },
          { latitude: 39.905, longitude: 116.41 },
          { latitude: 39.905, longitude: 116.40 },
        ],
      },
      {
        id: 's2',
        name: '配送区域 B',
        color: '#388E3C',
        boundary: [
          { latitude: 39.915, longitude: 116.41 },
          { latitude: 39.915, longitude: 116.42 },
          { latitude: 39.905, longitude: 116.42 },
          { latitude: 39.905, longitude: 116.41 },
        ],
      },
      {
        id: 's3',
        name: '配送区域 C',
        color: '#F57C00',
        boundary: [
          { latitude: 39.905, longitude: 116.40 },
          { latitude: 39.905, longitude: 116.41 },
          { latitude: 39.895, longitude: 116.41 },
          { latitude: 39.895, longitude: 116.40 },
        ],
      },
    ],
    [],
  );

  const houses = useMemo<House[]>(
    () => [
      {
        id: 'h1',
        title: '仓库站点',
        price: '今日待派 120 单',
        position: { latitude: 39.911, longitude: 116.405 },
        schoolId: 's1',
      },
      {
        id: 'h2',
        title: '配送点 A',
        price: '预计 30 单',
        position: { latitude: 39.909, longitude: 116.413 },
        schoolId: 's2',
      },
      {
        id: 'h3',
        title: '配送点 B',
        price: '预计 45 单',
        position: { latitude: 39.901, longitude: 116.402 },
        schoolId: 's3',
      },
      {
        id: 'h4',
        title: '配送点 C',
        price: '预计 25 单',
        position: { latitude: 39.907, longitude: 116.408 },
        schoolId: 's1',
      },
    ],
    [],
  );

  const [activeSchoolId, setActiveSchoolId] = useState<string | null>('s1');
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const activeSchool = useMemo(
    () => schools.find(s => s.id === activeSchoolId) ?? null,
    [schools, activeSchoolId],
  );

  const deliveryTrack = useMemo<LatLng[]>(
    () => [
      { latitude: 39.911, longitude: 116.405 },
      { latitude: 39.909, longitude: 116.413 },
      { latitude: 39.907, longitude: 116.408 },
      { latitude: 39.901, longitude: 116.402 },
    ],
    [],
  );

  const visibleHouses = useMemo(() => {
    if (!activeSchoolId) return houses;
    return houses.filter(h => h.schoolId === activeSchoolId);
  }, [houses, activeSchoolId]);

  const housePolylinePoints = useMemo<LatLng[]>(() => {
    return visibleHouses.map(h => h.position);
  }, [visibleHouses]);

  const handleSelectHouse = (house: House) => {
    setActiveSchoolId(house.schoolId);
    setSelectedHouseId(house.id);
    if (mapRef.current) {
      mapRef.current.moveCamera(
        {
          target: house.position,
          zoom: 15,
        },
        500,
      );
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={ref => {
          mapRef.current = ref;
        }}
        style={styles.map}
        initialCameraPosition={{
          target: { latitude: 39.907, longitude: 116.41 },
          zoom: 13,
        }}
      >
        {schools.map(school => {
          const isActive = school.id === activeSchoolId;
          return (
            <Polygon
              key={school.id}
              points={school.boundary}
              fillColor={isActive ? school.color + '55' : '#00000022'}
              strokeColor={school.color}
              strokeWidth={isActive ? 4 : 2}
              zIndex={isActive ? 20 : 10}
            />
          );
        })}

        {houses.map(house => {
          const isInActiveSchool = !activeSchoolId || house.schoolId === activeSchoolId;
          const isSelected = selectedHouseId === house.id;
          const school = schools.find(s => s.id === house.schoolId);
          const markerColor = isSelected
            ? 'yellow'
            : isInActiveSchool && school
              ? 'blue'
              : 'red';
          return (
            <Marker
              key={house.id}
              position={house.position}
              title={house.title}
              pinColor={markerColor}
              zIndex={isSelected ? 40 : 30}
              onMarkerPress={() => handleSelectHouse(house)}
            />
          );
        })}

        <Polyline
          points={deliveryTrack}
          strokeColor="#2f95dc"
          strokeWidth={4}
          zIndex={15}
        />

        <Marker
          position={deliveryTrack[0]}
          smoothMovePath={deliveryTrack}
          smoothMoveDuration={30}
          pinColor="yellow"
          zIndex={50}
        />

        {housePolylinePoints.length > 1 && (
          <Polyline
            points={housePolylinePoints}
            strokeColor={activeSchool?.color ?? '#455A64'}
            strokeWidth={3}
            zIndex={5}
          />
        )}
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.title}>行业场景综合示例</Text>
        <Text style={styles.subtitle}>物流多点配送排线：配送区域 + 站点列表 + 路线</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, !activeSchoolId && styles.chipActive]}
            onPress={() => setActiveSchoolId(null)}
          >
            <Text style={[styles.chipText, !activeSchoolId && styles.chipTextActive]}>全部学区</Text>
          </Pressable>
          {schools.map(school => {
            const isActive = school.id === activeSchoolId;
            return (
              <Pressable
                key={school.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setActiveSchoolId(school.id)}
              >
                <View style={[styles.colorDot, { backgroundColor: school.color }]} />
                <Text style={[styles.chipText, isActive && styles.chipTextActive]} numberOfLines={1}>
                  {school.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeSchool && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>{activeSchool.name}</Text>
            <Text style={styles.infoDesc}>展示当前配送区域内的仓库与配送点，以及示例路线。</Text>
          </View>
        )}

        <ScrollView style={styles.houseList} contentContainerStyle={styles.houseListContent}>
          {visibleHouses.map(house => {
            const isSelected = selectedHouseId === house.id;
            const school = schools.find(s => s.id === house.schoolId);
            return (
              <Pressable
                key={house.id}
                style={[styles.houseItem, isSelected && styles.houseItemActive]}
                onPress={() => handleSelectHouse(house)}
              >
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: school?.color ?? '#455A64', marginRight: 8 },
                  ]}
                />
                <View style={styles.houseTextContainer}>
                  <Text style={styles.houseTitle} numberOfLines={1}>
                    {house.title}
                  </Text>
                  <Text style={styles.housePrice} numberOfLines={1}>
                    {house.price} · {school?.name ?? ''}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: '#ddd',
    fontSize: 12,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: {
    backgroundColor: '#2f95dc',
  },
  chipText: {
    color: '#eee',
    fontSize: 12,
    maxWidth: 140,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  infoBox: {
    marginTop: 4,
    paddingVertical: 6,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoDesc: {
    color: '#ccc',
    fontSize: 12,
  },
  houseList: {
    marginTop: 8,
    maxHeight: 140,
  },
  houseListContent: {
    gap: 6,
  },
  houseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  houseItemActive: {
    backgroundColor: 'rgba(47,149,220,0.4)',
  },
  houseTextContainer: {
    flex: 1,
  },
  houseTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  housePrice: {
    color: '#ddd',
    fontSize: 12,
    marginTop: 2,
  },
});
