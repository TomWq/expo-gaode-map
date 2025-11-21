import * as React from 'react';
import { Image } from 'react-native';
import { requireNativeViewManager } from 'expo-modules-core';
import { MapContext, MarkerEventContext } from '../../ExpoGaodeMapView';
import type { MarkerProps } from '../../types';

const NativeMarkerView = requireNativeViewManager('MarkerView');

export default function Marker(props: MarkerProps) {
  // 如果有 children，使用声明式 API
  if (props.children) {
    return <MarkerDeclarative {...props} />;
  }
  // 否则使用命令式 API
  return <MarkerImperative {...props} />;
}

function MarkerDeclarative(props: MarkerProps) {
  const eventManager = React.useContext(MarkerEventContext);
  const markerIdRef = React.useRef(`marker_${Date.now()}_${Math.random()}`);
  
  // 根据是否有 children 来决定使用哪个尺寸属性
  // 有 children：使用 customViewWidth/customViewHeight（默认 80x30）
  // 无 children：使用 iconWidth/iconHeight（用于自定义图标）
  const containerWidth = props.children
    ? (props.customViewWidth && props.customViewWidth > 0 ? props.customViewWidth : 80)
    : (props.iconWidth || 0);
  const containerHeight = props.children
    ? (props.customViewHeight && props.customViewHeight > 0 ? props.customViewHeight : 30)
    : (props.iconHeight || 0);
  
  React.useEffect(() => {
    if (eventManager) {
      eventManager.register(markerIdRef.current, {
        onPress: props.onPress,
        onDragStart: props.onDragStart,
        onDrag: props.onDrag,
        onDragEnd: props.onDragEnd,
      });
    }
    return () => {
      if (eventManager) {
        eventManager.unregister(markerIdRef.current);
      }
    };
  }, [eventManager, props.onPress, props.onDragStart, props.onDrag, props.onDragEnd]);
  
  return (
    <NativeMarkerView
      position={props.position}
      title={props.title}
      snippet={props.snippet}
      draggable={props.draggable}
      icon={props.icon}
      iconWidth={props.iconWidth || 0}  // 传递原始的 iconWidth（用于自定义图标）
      iconHeight={props.iconHeight || 0} // 传递原始的 iconHeight（用于自定义图标）
      customViewWidth={containerWidth}  // 新增：自定义视图宽度
      customViewHeight={containerHeight} // 新增：自定义视图高度
      pinColor={props.pinColor}
      animatesDrop={props.animatesDrop}
      centerOffset={props.centerOffset}
      opacity={props.opacity}
      flat={props.flat}
      zIndex={props.zIndex}
      anchor={props.anchor}
      style={{ width: containerWidth, height: containerHeight }}
    >
      {props.children}
    </NativeMarkerView>
  );
}

function MarkerImperative(props: MarkerProps) {
  const mapRef = React.useContext(MapContext);
  const eventManager = React.useContext(MarkerEventContext);
  const markerIdRef = React.useRef<string | null>(null);
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
      
      const markerId = `marker_${Date.now()}_${Math.random()}`;
      markerIdRef.current = markerId;
      
      if (eventManager) {
        eventManager.register(markerId, {
          onPress: props.onPress,
          onDragStart: props.onDragStart,
          onDrag: props.onDrag,
          onDragEnd: props.onDragEnd,
        });
      }
      
      const processedProps = { ...propsRef.current };
      if (processedProps.icon && typeof processedProps.icon === 'number') {
        const resolved = Image.resolveAssetSource(processedProps.icon);
        processedProps.icon = resolved;
      }
      
      mapRef.current.addMarker(markerId, processedProps);
    };
    
    checkAndAdd();
    
    return () => {
      if (markerIdRef.current) {
        if (eventManager) {
          eventManager.unregister(markerIdRef.current);
        }
        if (mapRef?.current) {
          mapRef.current.removeMarker(markerIdRef.current);
        }
      }
    };
  }, []);

  React.useEffect(() => {
    if (markerIdRef.current && eventManager) {
      eventManager.register(markerIdRef.current, {
        onPress: props.onPress,
        onDragStart: props.onDragStart,
        onDrag: props.onDrag,
        onDragEnd: props.onDragEnd,
      });
    }
  }, [eventManager, props.onPress, props.onDragStart, props.onDrag, props.onDragEnd]);

  React.useEffect(() => {
    if (markerIdRef.current && mapRef?.current) {
      const processedProps = { ...props };
      if (processedProps.icon && typeof processedProps.icon === 'number') {
        const resolved = Image.resolveAssetSource(processedProps.icon);
        processedProps.icon = resolved;
      }
      mapRef.current.updateMarker(markerIdRef.current, processedProps);
    }
  }, [
    mapRef,
    props.position?.latitude,
    props.position?.longitude,
    props.title,
    props.draggable,
    props.icon,
    props.iconWidth,
    props.iconHeight,
    props.customViewWidth,
    props.customViewHeight,
    props.pinColor
  ]);
  
  return null;
}

