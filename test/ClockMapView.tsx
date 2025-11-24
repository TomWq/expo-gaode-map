/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-03-11 09:29:07
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-11-24 09:45:58
 * @FilePath     : /jintan-app/widget/ClockMapView.tsx
 * @Description  :
 *
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved.
 */
import { Text, View } from "@/components/Themed";
import useMap from "@/hook/useMap";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { useStyles, createStyleSheet } from "react-native-unistyles";
// import {
//   MapType,
//   MapView,
//   Circle,
//   Marker,
// } from "@/lib/amap3d";
import { Marker, Circle, MapView, MapType } from 'expo-gaode-map'
import { haversineDistance, isNotEmpty } from "@/utils/Fun";
import { DebouncePressable } from "@/components/Debounce.Button";
import { Image, InteractionManager, ActivityIndicator, StyleSheet } from "react-native";
import ImageAsset from "@/assets";
import usePermissions from "@/hook/usePermissions";
import { FontAwesome } from "@expo/vector-icons";
import useCameraStore, { Photo } from "@/store/useCameraStore";
import CommonConstants from "@/hook/constants/CommonConstants";
import useTeamsStore from "@/store/useTeamsStore";
import Animated, { FadeIn } from "react-native-reanimated";
import Button from "@/components/Button";

const iconUri = Image.resolveAssetSource(ImageAsset.positio_icon).uri;

const ClockMapView = () => {

  const { styles, theme } = useStyles(styleSheet);
  const { isLocationPermissions } = usePermissions();
  const { photo, setPhoto } = useCameraStore();
  const { clockType } = useTeamsStore();
  const [isInitializing, setIsInitializing] = useState(true);

  const {
    mapViewRef,
    data,
    takePhoto,
    ClockIn,
    moveToCurrentLocation,
    clockInCoord,
    chooseClockRule,
    clockRuleIndex,
    clockRule,
    chooseShift,
    shifts,
    shiftIndex,
    clockRange,
    setIsWithinRange,
    isWithinRange,
    mapState,
    setMapState,
    getClockInRule,
    isSupportOutWork,
    initialPosition

  } = useMap();

  // 同步计算文本尺寸的函数
  const calculateTextSize = (text: string, fontSize = 12) => {
    if (!text) return { width: 100, height: 40 };
    
    // 计算中文字符和其他字符
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    
    // 中文字符宽度约为 fontSize，英文约为 fontSize * 0.6
    // 加上左右 padding (5 * 2) + 边框 (1 * 2) = 12
    const estimatedWidth = Math.ceil(
      chineseChars * fontSize + otherChars * fontSize * 0.6 + 22
    );
    
    // 高度 = 行高 + 上下 padding (5 * 2) + 边框 (1 * 2) = fontSize * 1.5 + 12
    const estimatedHeight = Math.ceil(fontSize * 1.5 + 12);
    
    return {
      width: Math.max(estimatedWidth, 60), // 最小宽度 60
      height: Math.max(estimatedHeight, 30) // 最小高度 30
    };
  };

  let timers = useRef<NodeJS.Timeout | number>(0);

  // 所有的 useMemo 和其他 Hooks 必须在组件顶层调用
  const mapView = useMemo(() => {
    // ✅ 必须等待 initialPosition 准备好才渲染 MapView
    if (!initialPosition) {
      return null;
    }
    
    return (
        <Animated.View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            ref={mapViewRef}
            onLoad={(nativeEvent) => {
              setMapState(false);
            }}
            indoorViewEnabled={true}
            zoomGesturesEnabled={true}
            // buildingsEnabled={true}
            userLocationRepresentation={{
              showsAccuracyRing: false,
              image: iconUri,
              imageWidth: 40,
              imageHeight: 40,
            }}
            trafficEnabled={true}
            zoomControlsEnabled={false}
            scaleControlsEnabled={false}
            tiltGesturesEnabled={false}
            compassEnabled={false}
            // followUserLocation={false}
            // onCameraIdle={({ nativeEvent }) => {}}
            onLocation={({ nativeEvent }) => {
              const { latitude, longitude } = nativeEvent;
              if (!latitude || !longitude) return;
              let index = clockInCoord.some((item) => {
                const distance = haversineDistance(
                  {
                    latitude: item.lat || 0,
                    longitude: item.lon || 0,
                  },
                  {
                    latitude: latitude || 0,
                    longitude: longitude || 0,
                  }
                );
                if (distance <= clockRange) {
                  return true;
                } else {
                  return false;
                }
              });
              setIsWithinRange(index);
            }}
            // distanceFilter={1}
            // myLocationIcon={true}
            myLocationEnabled={true}
            initialCameraPosition={initialPosition || { 
              target: { latitude: 39.9, longitude: 116.4 }, 
              zoom: 15 
            }}>

            {clockInCoord &&
              clockInCoord?.length > 0 &&
              clockInCoord.map((item, index) => {
                if (!item?.lat || !item?.lon) return null;

                // ✅ 使用基于坐标的稳定 key，而不是 index
                const stableKey = `${item.lat.toFixed(6)}-${item.lon.toFixed(6)}`;
                
                // ✅ 同步计算 Marker 尺寸（无延迟）
                const positionName = clockRule[clockRuleIndex]?.positionName || '';
                const markerSize = calculateTextSize(positionName, 12);

                return (
                  <React.Fragment key={stableKey}>
                    <Circle
                      center={{
                        latitude: item?.lat || 39.908692,
                        longitude: item?.lon || 116.397477,
                      }}
                      radius={clockRange}
                      zIndex={1000}
                      strokeWidth={2}
                      strokeColor={theme.colors.primary}
                      fillColor="rgba(43, 133, 255, 0.3)"
                    />
                    <Marker
                      position={{
                        latitude: item?.lat || 39.908692,
                        longitude: item?.lon || 116.397477,
                      }}
                      customViewWidth={markerSize.width}
                      customViewHeight={markerSize.height}
                    >
                      <View style={styles.markerContainer}>
                        <Text style={styles.markerText}>
                          {positionName}
                        </Text>
                      </View>
                    </Marker>
                  </React.Fragment>
                );
              })}

          </MapView>
          <DebouncePressable
            style={styles.orientationView}
            onPress={() => {
              moveToCurrentLocation();
            }}
          >
            <Image source={ImageAsset.orientation} style={styles.orientation} />
          </DebouncePressable>
        </Animated.View>
      );
  }, [
    data.location?.address,
    mapViewRef,
    mapState,
    clockInCoord,
    clockRange,
    isLocationPermissions,
    initialPosition,
    clockRuleIndex
  ]);



  //底部打卡按钮
  const clockButton = useMemo(() => {
    // 添加初始加载状态检查
    if (!data.location?.address || mapState || clockInCoord.length === 0) {
      return (
        <Animated.View style={styles.buttonView} exiting={FadeIn.duration(300)}>
          <View style={styles.buttonDisabled}>
            <Text style={styles.buttonDisabledText}>
              正在获取位置信息...
            </Text>
          </View>
        </Animated.View>
      );
    }

    if (clockType === 1000) {
      return (
        <Animated.View style={styles.buttonView} exiting={FadeIn.duration(300)}>
          <View style={styles.buttonDisabled}>
            <Text style={styles.buttonDisabledText}>
              不在考勤规则内,无法打卡
            </Text>
          </View>
        </Animated.View>
      );
    } else {
      return (
        <Animated.View style={styles.buttonView} exiting={FadeIn.duration(300)}>
          <Button
            label={
              !isWithinRange
                ? isSupportOutWork ? clockType === 1001 ? '上班打卡(外勤)' : '下班打卡(外勤)' : "当前位置不在考勤范围无法打卡"
                : clockType === 1001
                  ? CommonConstants.clock_in
                  : CommonConstants.clock_out
            }
            onPress={ClockIn}
            style={[styles.button]}
            labelStyle={[styles.buttonLabel]}
          />
        </Animated.View>
      );
    }
  }, [data.location?.address, mapState, clockType, isWithinRange, clockInCoord, photo, isSupportOutWork]);


  // 使用 useEffect 替代 useFocusEffect 来避免潜在的 Hook 顺序问题
  useEffect(() => {
    // 设置初始化状态
    setIsInitializing(true);
    //@ts-ignore
    // setPhoto(undefined);

    // 使用 InteractionManager 确保页面转场动画完成后再执行耗时操作
    InteractionManager.runAfterInteractions(() => {
      // 延迟获取考勤规则，让页面先渲染出来
      timers.current = setTimeout(() => {
        try {
          getClockInRule().catch(err => {
            console.error('获取考勤规则失败:', err);
          }).finally(() => {
            setIsInitializing(false);
          });
        } catch (error) {
          console.error('获取考勤规则出错:', error);
          setIsInitializing(false);
        }
      }, 1000);
    });

    // 添加安全机制：无论如何，2秒后强制结束加载状态
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timers.current);
      setPhoto({} as Photo)
    };
  }, []);




  return (
    <Animated.View style={styles.container} exiting={FadeIn.duration(300)}>
      {/* ✅ 加载状态：等待 initialPosition */}
      {!initialPosition ? (
        <View style={[StyleSheet.absoluteFill, styles.mapLoad]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>正在初始化地图...</Text>
        </View>
      ) : (
        <>
          {mapView}
        </>
      )}
      <View style={styles.mapView}>
        <View style={styles.topView}>
          <DebouncePressable
            style={[styles.topLeftItem]}
            onPress={() => {
              chooseClockRule();
            }}
          >
            <Text style={styles.topLeftText} numberOfLines={1}>
              {clockRule[clockRuleIndex]?.ruleName ?? "请选择"}
            </Text>
            <FontAwesome
              name="angle-down"
              size={18}
              color={theme.colors.text_placeholder}
            />
          </DebouncePressable>
          <DebouncePressable
            style={[styles.topLeftItem]}
            onPress={() => {
              chooseShift();
            }}
          >
            <Text style={styles.topLeftText}>
              {shifts[shiftIndex] ?? "请选择"}
            </Text>
            <FontAwesome
              name="angle-down"
              size={18}
              color={theme.colors.text_placeholder}
            />
          </DebouncePressable>
        </View>
        <View>
          <View style={styles.cameraView}>
            <DebouncePressable onPress={takePhoto}  //disabled={!isWithinRange}
            >
              <Image
                source={
                  photo && isNotEmpty(photo?.content)
                    ? { uri: photo.content }
                    : ImageAsset.camera
                }
                style={styles.cameraIcon}
              />
              <Text style={styles.cameraText}>
                {CommonConstants.take_photo_upload}
              </Text>
            </DebouncePressable>
          </View>
          <View style={styles.locationView}>
            <Image source={ImageAsset.coordinate} style={styles.locationIcon} />
            <Text style={styles.address}>{data.location?.address}</Text>
          </View>
        </View>
      </View>
      {initialPosition && clockButton}
    </Animated.View>
  )
};

export default React.memo(ClockMapView)

const styleSheet = createStyleSheet((theme, tr) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mapView: {
    flex: 1,
    width: "100%",
    height: "50%",
    backgroundColor: theme.colors.card,
  },
  mapLoad: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
    backgroundColor: theme.colors.background,
  },
  address: {
    fontSize: 14,
    color: theme.colors.timer,
  },
  orientationView: {
    position: "absolute",
    right: 5,
    bottom: 0,
    zIndex: 10,
    width: 50,
    height: 50,
  },
  orientation: {
    width: 50,
    height: 50,
  },
  locationView: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 5,
    paddingHorizontal: 12,
  },
  locationIcon: {
    width: 10,
    height: 12,
  },
  cameraIcon: {
    width: 90,
    height: 90,
    marginBottom: 5,
    borderRadius: 5,
  },
  cameraText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "600",
    alignSelf: "center",
  },
  cameraView: {
    justifyContent: "center",
    alignItems: "center",
  },
  buttonView: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.card,
  },
  button: {
    height: 44,
    width: "88%",
  },
  buttonLabel: {
    fontSize: 14,
    color: theme.colors.white,
  },
  buttonDisabled: {
    backgroundColor: "#EFEFEF",
    height: 44,
    width: "88%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 44,
    gap: 10,
    flexDirection: "row",
  },
  buttonDisabledText: {
    fontSize: 14,
    color: theme.colors.text_placeholder,
  },
  topView: {
    flexDirection: "row",
    padding: 5,
    gap: 5,
    marginBottom: 20,
  },
  topLeftItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 5,
    paddingVertical: 5,
    backgroundColor: theme.colors.primary_light,
    flex: 1,
    paddingHorizontal: 10,
  },
  topLeftText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: "600",
    marginRight: 30,
  },
  markerText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: "600",
    
  },
  markerContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 5,
    padding: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical:5,
  
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    gap: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: theme.colors.text_placeholder,
  },
}));
