import * as React from 'react';

import { requireNativeViewManager } from 'expo-modules-core';
import { MarkerEventContext } from '../../ExpoGaodeMapView';
import type { MarkerProps } from '../../types';

const NativeMarkerView = requireNativeViewManager('MarkerView');

export default function Marker(props: MarkerProps) {
  return <MarkerDeclarative {...props} />;
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
      latitude={props.position.latitude}
      longitude={props.position.longitude}
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
    
    >
      {props.children}
    </NativeMarkerView>
  );
}


