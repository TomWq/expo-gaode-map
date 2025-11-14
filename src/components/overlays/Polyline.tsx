/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-11-13 15:01:30
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-11-15 01:08:27
 * @FilePath     : /expo-gaode-map/src/components/overlays/Polyline.tsx
 * @Description  : 地图折线组件 - 使用命令式 API
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */

import * as React from 'react';
import { MapContext } from '../../ExpoGaodeMapView';
import type { PolylineProps } from '../../types';

/**
 * 地图折线组件
 * 
 * @example
 * ```tsx
 * <MapView>
 *   <Polyline
 *     points={[
 *       { latitude: 39.9, longitude: 116.4 },
 *       { latitude: 39.91, longitude: 116.41 },
 *     ]}
 *     color="#FF0000"
 *     width={5}
 *   />
 * </MapView>
 * ```
 */
export default function Polyline(props: PolylineProps) {
  const mapRef = React.useContext(MapContext);
  const polylineIdRef = React.useRef<string | null>(null);

  // 添加折线
  React.useEffect(() => {
    const polylineId = `polyline_${Date.now()}_${Math.random()}`;
    polylineIdRef.current = polylineId;
    
    // 只传递必要的属性
    const polylineProps = {
      points: props.points,
      width: props.width,
      color: props.color,
      ...(props.texture && { texture: props.texture }),
    };
    
    mapRef?.current?.addPolyline?.(polylineId, polylineProps);

    return () => {
      mapRef?.current?.removePolyline?.(polylineId);
    };
  }, []);

  return null;
}
