
import * as React from 'react';
import { MapContext, PolylineEventContext } from '../../ExpoGaodeMapView';
import type { PolylineProps } from '../../types';


/**
 * Polyline 组件用于在高德地图上绘制折线
 * 
 * @param props - 折线的配置属性
 * @param props.points - 折线的坐标点数组
 * @param props.width - 折线的宽度（像素）
 * @param props.color - 折线的颜色（十六进制或RGBA）
 * @param props.onPress - 折线点击事件回调函数
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
  const eventManager = React.useContext(PolylineEventContext);
  const polylineIdRef = React.useRef<string | null>(null);
  const propsRef = React.useRef(props);
  
  React.useEffect(() => {
    propsRef.current = props;
  }, [props]);
  
  React.useEffect(() => {
    const checkAndAdd = () => {
      if (!mapRef?.current) {
        setTimeout(checkAndAdd, 50);
        return;
      }
      
      const polylineId = `polyline_${Date.now()}_${Math.random()}`;
      polylineIdRef.current = polylineId;
      
      if (eventManager && props.onPress) {
        eventManager.register(polylineId, {
          onPress: props.onPress,
        });
      }
      
      const polylineProps = {
        points: propsRef.current.points,
        width: propsRef.current.width,
        color: propsRef.current.color,
        ...(propsRef.current.texture && { texture: propsRef.current.texture }),
        ...(propsRef.current.dotted !== undefined && { dotted: propsRef.current.dotted }),
        ...(propsRef.current.geodesic !== undefined && { geodesic: propsRef.current.geodesic }),
        ...(propsRef.current.zIndex !== undefined && { zIndex: propsRef.current.zIndex }),
      };
      
      mapRef.current.addPolyline(polylineId, polylineProps);
    };
    
    checkAndAdd();
    
    return () => {
      if (polylineIdRef.current) {
        if (eventManager) {
          eventManager.unregister(polylineIdRef.current);
        }
        if (mapRef?.current) {
          mapRef.current.removePolyline(polylineIdRef.current);
        }
      }
    };
  }, []);

  return null;
}
