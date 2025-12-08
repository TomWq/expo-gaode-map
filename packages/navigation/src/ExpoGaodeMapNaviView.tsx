/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-12-03 20:12:54
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-12-05 12:37:28
 * @FilePath     : /expo-gaode-map/packages/navigation/src/ExpoGaodeMapNaviView.tsx
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */
import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import type { Coordinates, NaviViewProps } from './types';

/**
 * NaviView Ref 类型
 */
export interface NaviViewRef {
  /**
   * 开始导航
   */
  startNavigation: (start: Coordinates | null, end: Coordinates, type: number) => Promise<void>;
  
  /**
   * 停止导航
   */
  stopNavigation: () => Promise<void>;
}


const NativeView: React.ComponentType<NaviViewProps & { ref?: React.Ref<any> }> = requireNativeViewManager('ExpoGaodeMapNaviView');

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
 * import { NaviView } from 'expo-gaode-map-navigation';
 *
 * function NavigationScreen() {
 *   return (
 *     <NaviView
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
export const NaviView = React.forwardRef<NaviViewRef, NaviViewProps>((props, ref) => {
  const nativeRef = React.useRef<any>(null);
  
  // 创建 API 引用
  const apiRef: NaviViewRef = React.useMemo(() => ({
    startNavigation: async (start: Coordinates | null, end: Coordinates, type: number) => {
      if (!nativeRef.current) throw new Error('NaviView not initialized');
      // 将对象解构为单独的参数传递给原生层
      const startLat = start?.latitude ?? 0;
      const startLng = start?.longitude ?? 0;
      const endLat = end.latitude;
      const endLng = end.longitude;
      return nativeRef.current.startNavigation(startLat, startLng, endLat, endLng);
    },
    stopNavigation: async () => {
      if (!nativeRef.current) throw new Error('NaviView not initialized');
      return nativeRef.current.stopNavigation();
    },
  }), []);
  
  // 暴露 API 给外部 ref
  React.useImperativeHandle(ref, () => apiRef, [apiRef]);
  
  return <NativeView ref={nativeRef} {...props} />;
});

NaviView.displayName = 'NaviView';

export default NaviView;