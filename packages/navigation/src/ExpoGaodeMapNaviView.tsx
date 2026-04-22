import * as React from 'react';
import type {
  Coordinates,
  ExpoGaodeMapNaviViewProps,
  NaviArriveEvent,
  NaviEndEvent,
  NaviInfoUpdateEvent,
  NaviLaneInfoEvent,
  NaviStartEvent,
  NaviTrafficStatusesEvent,
  NaviVisualStateEvent,
  PlayVoiceEvent,
  ReCalculateEvent,
} from './types';
import {
  Image,
  PermissionsAndroid,
  Platform,
  StatusBar,
  type NativeSyntheticEvent,
} from 'react-native';
import { createLazyNativeViewManager } from './map/utils/lazyNativeViewManager';

function normalizeNaviImageSource(source?: ExpoGaodeMapNaviViewProps['carImage']): string | undefined {
  if (source == null) {
    return undefined;
  }
  if (typeof source === 'string') {
    return source;
  }
  return Image.resolveAssetSource(source)?.uri;
}

async function ensureAndroidNavigationNotificationPermission(enabled: boolean): Promise<void> {
  if (!enabled || Platform.OS !== 'android' || Platform.Version < 33) {
    return;
  }

  try {
    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    const granted = await PermissionsAndroid.check(permission);
    if (!granted) {
      await PermissionsAndroid.request(permission);
    }
  } catch (error) {
    console.warn(
      '[expo-gaode-map-navigation] Failed to request POST_NOTIFICATIONS permission automatically.',
      error
    );
  }
}

/**
 * ExpoGaodeMapNaviView Ref 类型
 */
export interface ExpoGaodeMapNaviViewRef {
  /**
   * 开始导航
   */
  startNavigation: (start: Coordinates | null, end: Coordinates, type: number) => Promise<void>;
  /**
   * 在当前嵌入式导航视图中，使用独立路径组启动导航
   *
   * - 依赖当前 ExpoGaodeMapNaviView 实例
   * - 适合“路线选择页 -> 进入嵌入式导航页”这类页面内流程
   * - 若不依赖嵌入式导航视图，可改用模块级 startNaviWithIndependentPath(...)
   */
  startNavigationWithIndependentPath: (
    token: number,
    options?: {
      routeId?: number;
      routeIndex?: number;
      naviType?: number;
    }
  ) => Promise<void>;
  
  /**
   * 停止导航
   */
  stopNavigation: () => Promise<void>;
}

interface NativeExpoGaodeMapNaviViewRef {
  startNavigation: (
    startLatitude: number,
    startLongitude: number,
    endLatitude: number,
    endLongitude: number
  ) => Promise<void>;
  startNavigationWithIndependentPath: (
    token: number,
    routeId?: number,
    routeIndex?: number,
    naviType?: number
  ) => Promise<void>;
  stopNavigation: () => Promise<void>;
}

interface NativeExpoGaodeMapNaviViewProps
  extends ExpoGaodeMapNaviViewProps {
  ref?: React.Ref<NativeExpoGaodeMapNaviViewRef>;
  onNavigationInfoUpdate?: (event: NativeSyntheticEvent<NaviInfoUpdateEvent>) => void;
  onNavigationStarted?: (event: NativeSyntheticEvent<NaviStartEvent>) => void;
  onNavigationEnded?: (event: NativeSyntheticEvent<NaviEndEvent>) => void;
  onArriveDestination?: (event: NativeSyntheticEvent<NaviArriveEvent>) => void;
  onRouteRecalculate?: (event: NativeSyntheticEvent<ReCalculateEvent>) => void;
  onNavigationText?: (event: NativeSyntheticEvent<PlayVoiceEvent>) => void;
  onNavigationVisualStateUpdate?: (event: NativeSyntheticEvent<NaviVisualStateEvent>) => void;
  onLaneInfoUpdate?: (event: NativeSyntheticEvent<NaviLaneInfoEvent>) => void;
  // Unified traffic-segment event used by the library traffic bar and any
  // consumer that wants to render a fully custom traffic beam.
  onTrafficStatusesUpdate?: (event: NativeSyntheticEvent<NaviTrafficStatusesEvent>) => void;
}

const getNativeView = createLazyNativeViewManager<
  NativeExpoGaodeMapNaviViewProps
>('ExpoGaodeMapNaviView');

/**
 * 高德导航视图组件
 *
 * 使用高德官方的导航界面，提供完整的导航体验，包括：
 * - 路线规划和显示
 * - 实时导航信息（距离、时间、道路名称）
 * - 转向箭头和提示
 * - 路况信息
 * - 摄像头提示
 * - 语音播报
 *
 * @example
 * ```tsx
 * import { ExpoGaodeMapNaviView } from 'expo-gaode-map-navigation';
 *
 * function NavigationScreen() {
 *   return (
 *     <ExpoGaodeMapNaviView
 *       style={{ flex: 1 }}
 *       naviType={0} // GPS 导航
 *       showCamera={true}
 *       enableVoice={true}
 *       onNaviInfoUpdate={(e) => {
 *         console.log('剩余距离:', e.nativeEvent.pathRetainDistance);
 *       }}
 *       onArrive={() => {
 *         console.log('到达目的地！');
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export const ExpoGaodeMapNaviView = React.forwardRef<ExpoGaodeMapNaviViewRef, ExpoGaodeMapNaviViewProps>((props, ref) => {
  const nativeRef = React.useRef<NativeExpoGaodeMapNaviViewRef | null>(null);
  const hasRequestedAndroidNotificationPermissionRef = React.useRef(false);
  const NativeView = React.useMemo(() => getNativeView(), []);
  const {
    onNaviInfoUpdate,
    onNaviStart,
    onNaviEnd,
    onArrive,
    onReCalculate,
    onPlayVoice,
    onNaviVisualStateChange,
    onLaneInfoUpdate,
    onTrafficStatusesUpdate,
    isNightMode,
    mapViewModeType,
    carImage,
    fourCornersImage,
    carCompassImage,
    startPointImage,
    wayPointImage,
    endPointImage,
    cameraImage,
    androidStatusBarPaddingTop,
    ...restProps
  } = props;

  const resolvedAndroidStatusBarPaddingTop =
    Platform.OS === 'android' &&
    androidStatusBarPaddingTop == null &&
    props.showUIElements !== false &&
    props.hideNativeTopInfoLayout !== true
      ? (StatusBar.currentHeight ?? 0)
      : androidStatusBarPaddingTop;
  const resolvedCarImage = normalizeNaviImageSource(carImage);
  const resolvedFourCornersImage = normalizeNaviImageSource(fourCornersImage);
  const resolvedCarCompassImage = normalizeNaviImageSource(carCompassImage);
  const resolvedStartPointImage = normalizeNaviImageSource(startPointImage);
  const resolvedWayPointImage = normalizeNaviImageSource(wayPointImage);
  const resolvedEndPointImage = normalizeNaviImageSource(endPointImage);
  const resolvedCameraImage = normalizeNaviImageSource(cameraImage);
  const resolvedMapViewModeType = mapViewModeType ?? (isNightMode == null ? undefined : (isNightMode ? 1 : 0));
  const platformSpecificImageProps =
    Platform.OS === 'android'
      ? {
          fourCornersImage: resolvedFourCornersImage,
        }
      : {
          carCompassImage: resolvedCarCompassImage,
          cameraImage: resolvedCameraImage,
        };

  React.useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!props.androidBackgroundNavigationNotificationEnabled) {
      hasRequestedAndroidNotificationPermissionRef.current = false;
      return;
    }

    if (hasRequestedAndroidNotificationPermissionRef.current) {
      return;
    }

    hasRequestedAndroidNotificationPermissionRef.current = true;
    void ensureAndroidNavigationNotificationPermission(true);
  }, [props.androidBackgroundNavigationNotificationEnabled]);
  
  // 创建 API 引用
  const apiRef: ExpoGaodeMapNaviViewRef = React.useMemo(() => ({
    startNavigation: async (start: Coordinates | null, end: Coordinates, type: number) => {
      if (!nativeRef.current) throw new Error('ExpoGaodeMapNaviView not initialized');
      // 将对象解构为单独的参数传递给原生层
      const startLat = start?.latitude ?? 0;
      const startLng = start?.longitude ?? 0;
      const endLat = end.latitude;
      const endLng = end.longitude;
      return nativeRef.current.startNavigation(startLat, startLng, endLat, endLng);
    },
    startNavigationWithIndependentPath: async (token, options) => {
      if (!nativeRef.current) throw new Error('ExpoGaodeMapNaviView not initialized');
      return nativeRef.current.startNavigationWithIndependentPath(
        token,
        options?.routeId,
        options?.routeIndex,
        options?.naviType
      );
    },
    stopNavigation: async () => {
      if (!nativeRef.current) throw new Error('ExpoGaodeMapNaviView not initialized');
      return nativeRef.current.stopNavigation();
    },
  }), []);
  
  // 暴露 API 给外部 ref
  React.useImperativeHandle(ref, () => apiRef, [apiRef]);
  
  return (
    <NativeView
      ref={nativeRef}
      {...restProps}
      androidStatusBarPaddingTop={resolvedAndroidStatusBarPaddingTop}
      mapViewModeType={resolvedMapViewModeType}
      carImage={resolvedCarImage}
      startPointImage={resolvedStartPointImage}
      wayPointImage={resolvedWayPointImage}
      endPointImage={resolvedEndPointImage}
      {...platformSpecificImageProps}
      onNavigationInfoUpdate={onNaviInfoUpdate}
      onNavigationStarted={onNaviStart}
      onNavigationEnded={onNaviEnd}
      onArriveDestination={onArrive}
      onRouteRecalculate={onReCalculate}
      onNavigationText={onPlayVoice}
      onNavigationVisualStateUpdate={onNaviVisualStateChange}
      onLaneInfoUpdate={onLaneInfoUpdate}
      onTrafficStatusesUpdate={onTrafficStatusesUpdate}
    />
  );
});

ExpoGaodeMapNaviView.displayName = 'ExpoGaodeMapNaviView';

export default ExpoGaodeMapNaviView;
