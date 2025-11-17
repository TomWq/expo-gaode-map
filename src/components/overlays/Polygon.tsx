import { useContext, useEffect, useRef } from 'react';
import type { PolygonProps } from '../../types';
import { MapContext, PolygonEventContext } from '../../ExpoGaodeMapView';


/**
 * 高德地图多边形覆盖物组件
 * 
 * @param props - 多边形配置属性
 * @param props.points - 多边形顶点坐标数组，至少需要3个点
 * @param props.fillColor - 多边形填充颜色，十六进制格式，默认0x440000FF
 * @param props.strokeColor - 多边形边框颜色，默认-16776961
 * @param props.strokeWidth - 多边形边框宽度，默认10
 * @param props.zIndex - 多边形层级，默认0
 * @param props.onPress - 多边形点击事件
 * 
 * @remarks
 * 组件内部会自动生成唯一ID用于标识多边形，并在组件挂载时添加到地图，
 * 更新时同步修改多边形属性，卸载时自动移除多边形。
 * 
 * 注意：points数组长度必须大于等于3才能有效绘制多边形。
 */
export default function Polygon(props: PolygonProps) {
  const { points, fillColor, strokeColor, strokeWidth, zIndex } = props;
  const nativeRef = useContext(MapContext);
  const eventManager = useContext(PolygonEventContext);
  const polygonIdRef = useRef<string | null>(null);
  const propsRef = useRef(props);
  
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  useEffect(() => {
    const checkAndAdd = () => {
      if (!nativeRef?.current) {
        setTimeout(checkAndAdd, 50);
        return;
      }
      
      const polygonId = `polygon_${Date.now()}_${Math.random()}`;
      polygonIdRef.current = polygonId;
      
      if (eventManager && props.onPress) {
        eventManager.register(polygonId, {
          onPress: props.onPress,
        });
      }
      
      const { points, fillColor, strokeColor, strokeWidth, zIndex } = propsRef.current;
      
      if (points && points.length >= 3) {
        nativeRef.current.addPolygon(polygonId, {
          points,
          fillColor: fillColor ?? '#880000FF',
          strokeColor: strokeColor ?? '#FFFF0000',
          strokeWidth: strokeWidth ?? 10,
          zIndex: zIndex ?? 0,
        });
      }
    };
    
    checkAndAdd();
    
    return () => {
      if (polygonIdRef.current) {
        if (eventManager) {
          eventManager.unregister(polygonIdRef.current);
        }
        if (nativeRef?.current) {
          nativeRef.current.removePolygon(polygonIdRef.current);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (polygonIdRef.current && nativeRef?.current) {
      nativeRef.current.updatePolygon(polygonIdRef.current, {
        points,
        fillColor,
        strokeColor,
        strokeWidth,
        zIndex,
      });
    }
  }, [points, fillColor, strokeColor, strokeWidth, zIndex]);

  return null;
}
