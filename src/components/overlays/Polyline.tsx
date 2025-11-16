import * as React from 'react';
import { MapContext } from '../../ExpoGaodeMapView';
import type { PolylineProps } from '../../types';


/**
 * Polyline 组件用于在高德地图上绘制折线
 * 
 * @param props - 折线的配置属性
 * @param props.points - 折线的坐标点数组
 * @param props.width - 折线的宽度（像素）
 * @param props.color - 折线的颜色（十六进制或RGBA）
 * @param [props.texture] - 可选，折线的纹理样式
 * 
 * @remarks
 * 组件内部使用 React 的 useEffect 钩子来管理折线的生命周期：
 * 1. 组件挂载时创建折线并添加到地图
 * 2. 组件卸载时自动从地图移除折线
 * 3. 使用 ref 保存折线ID以便清理
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
