import * as React from 'react';
import type { CircleProps } from '../../types';
import { MapContext } from '../../ExpoGaodeMapView';

/**
 * Circle 组件 - 高德地图圆形覆盖物
 * 
 * 该组件用于在高德地图上绘制圆形覆盖物，支持动态更新圆形属性。
 * 
 * @param {CircleProps} props - 圆形属性配置
 * @param {LatLng} props.center - 圆形中心点坐标
 * @param {number} props.radius - 圆形半径（米）
 * @param {string} props.fillColor - 填充颜色（十六进制或RGBA）
 * @param {string} props.strokeColor - 边框颜色（十六进制或RGBA）
 * @param {number} props.strokeWidth - 边框宽度（像素）
 * 
 * @returns {null} 该组件不渲染任何UI元素
 * 
 * @remarks
 * 1. 组件挂载时自动添加圆形到地图
 * 2. 组件卸载时自动移除圆形
 * 3. 当中心点、半径、颜色等属性变化时自动更新圆形
 * 4. 使用 React Context 获取地图实例引用
 */
export default function Circle(props: CircleProps) {
  const mapRef = React.useContext(MapContext);
  const circleIdRef = React.useRef<string | null>(null);
  
  console.log('Circle 组件渲染，props:', JSON.stringify(props));
  
  React.useEffect(() => {
    console.log('Circle useEffect - 添加圆形到地图');
    
    if (!mapRef?.current) {
      console.warn('MapRef 不可用');
      return;
    }
    
    // 添加圆形
    const circleId = `circle_${Date.now()}_${Math.random()}`;
    circleIdRef.current = circleId;
    
    mapRef.current.addCircle(circleId, props);
    console.log('✅ 圆形已添加:', circleId);
    
    // 清理函数 - 移除圆形
    return () => {
      console.log('Circle useEffect cleanup - 移除圆形');
      if (circleIdRef.current && mapRef?.current) {
        mapRef.current.removeCircle(circleIdRef.current);
        console.log('✅ 圆形已移除:', circleIdRef.current);
      }
    };
  }, []);


  /**
   * 当Circle组件的props发生变化时，更新地图上的圆形覆盖物
   * 如果圆形ID和地图引用都存在，则调用地图实例的updateCircle方法更新圆形
   * 更新成功后会打印日志确认
   */
  React.useEffect(() => {
    console.log('Circle props 变化，更新圆形');
    if (circleIdRef.current && mapRef?.current) {
      mapRef.current.updateCircle(circleIdRef.current, props);
      console.log('✅ 圆形已更新:', circleIdRef.current);
    }
  }, [props.center, props.radius, props.fillColor, props.strokeColor, props.strokeWidth]);
  
  // 不渲染任何 UI
  return null;
}
