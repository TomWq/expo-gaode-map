import React from 'react';

/**
 * MapUI 组件
 * 用于包裹不需要作为地图原生子组件（如 Marker）的普通 React 组件。
 * 被此组件包裹的内容将渲染在地图视图的上方（兄弟节点），而不是内部。
 * 这解决了在地图内部放置普通 View 导致的触摸事件冲突问题。
 * 
 * 示例:
 * <MapView>
 *   <Marker ... />
 *   <MapUI>
 *     <View style={{ position: 'absolute', ... }}>
 *       <Text>悬浮层</Text>
 *     </View>
 *   </MapUI>
 * </MapView>
 */
export const MapUI: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return <>{children}</>;
};

// 静态标志，用于识别
(MapUI as React.FC & { isMapUI: boolean }).isMapUI = true;
