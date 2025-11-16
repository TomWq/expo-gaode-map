import { useContext, useEffect, useRef } from 'react';
import type { PolygonProps } from '../../types';
import { MapContext } from '../../ExpoGaodeMapView';


/**
 * 高德地图多边形覆盖物组件
 * 
 * @param props - 多边形配置属性
 * @param props.points - 多边形顶点坐标数组，至少需要3个点
 * @param props.fillColor - 多边形填充颜色，十六进制格式，默认0x440000FF
 * @param props.strokeColor - 多边形边框颜色，默认-16776961
 * @param props.strokeWidth - 多边形边框宽度，默认10
 * @param props.zIndex - 多边形层级，默认0
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
  const polygonIdRef = useRef<string>(`polygon_${Date.now()}_${Math.random()}`);

  useEffect(() => {
    const polygonId = polygonIdRef.current;

    // 添加多边形
    if (nativeRef?.current && points && points.length >= 3) {
      try {
        console.log('🟦 Polygon 组件调用 addPolygon:', polygonId, {
          points,
          fillColor: fillColor ?? 0x440000FF,
          strokeColor: strokeColor ?? -16776961,
          strokeWidth: strokeWidth ?? 10,
          zIndex: zIndex ?? 0,
        });
        
        nativeRef.current.addPolygon(polygonId, {
          points,
          fillColor: fillColor ?? 0x440000FF,
          strokeColor: strokeColor ?? -16776961,
          strokeWidth: strokeWidth ?? 10,
          zIndex: zIndex ?? 0,
        });
        
        console.log('✅ Polygon addPolygon 调用完成');
      } catch (error) {
        console.error('❌ 添加多边形失败:', error);
      }
    } else {
      console.warn('⚠️ Polygon 组件条件不满足:', {
        hasNativeRef: !!nativeRef?.current,
        hasPoints: !!points,
        pointsLength: points?.length,
      });
    }

    // 清理函数
    return () => {
      if (nativeRef?.current) {
        try {
          nativeRef.current.removePolygon(polygonId);
        } catch (error) {
          console.error('移除多边形失败:', error);
        }
      }
    };
  }, []);

  // 更新多边形属性
  useEffect(() => {
    const polygonId = polygonIdRef.current;

    if (nativeRef?.current) {
      try {
        nativeRef.current.updatePolygon(polygonId, {
          points,
          fillColor,
          strokeColor,
          strokeWidth,
          zIndex,
        });
      } catch (error) {
        console.error('更新多边形失败:', error);
      }
    }
  }, [points, fillColor, strokeColor, strokeWidth, zIndex]);

  return null;
}
