import * as React from 'react';
import { MapContext } from '../../ExpoGaodeMapView';
import type { MarkerProps } from '../../types';

/**
 * Marker 组件 - 用于在地图上显示标记点
 * 
 * @param props - 标记点属性配置
 * @param props.position - 标记点坐标 [经度, 纬度]
 * @param props.title - 标记点标题
 * @param props.draggable - 标记点是否可拖动
 * 
 * @remarks
 * 组件内部会自动处理标记点的添加、更新和移除
 * 当组件卸载时会自动移除对应的地图标记
 * 
 * @note
 * 组件本身不渲染任何DOM元素，仅作为地图标记的逻辑容器
 */
export default function Marker(props: MarkerProps) {
  const mapRef = React.useContext(MapContext);
  const markerIdRef = React.useRef<string>(`marker_${Date.now()}_${Math.random()}`);

  console.log('Marker 组件渲染，props:', props);

  // 添加标记
  React.useEffect(() => {
    const markerId = markerIdRef.current;
    
    console.log('Marker useEffect - 添加标记到地图');
    mapRef?.current?.addMarker?.(markerId, props).then(() => {
      console.log('✅ 标记已添加:', markerId);
    }).catch((error: any) => {
      console.error('❌ 添加标记失败:', error);
    });

    return () => {
      console.log('Marker useEffect cleanup - 移除标记');
      mapRef?.current?.removeMarker?.(markerId).catch((error: any) => {
        console.error('❌ 移除标记失败:', error);
      });
    };
  }, []);

  // 监听 Props 变化，更新标记
  React.useEffect(() => {
    const markerId = markerIdRef.current;
    
    console.log('Marker props 变化，更新标记:', props);
    mapRef?.current?.updateMarker?.(markerId, props).catch((error: any) => {
      console.error('❌ 更新标记失败:', error);
    });
  }, [props.position, props.title, props.draggable]);

  return null;
}
