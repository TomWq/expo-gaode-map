import * as React from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import App from './App';

const routes = [
  { key: 'first', title: 'First' },
  { key: 'second', title: 'Second' },
];

export default function TabViewExample() {
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);

  // 🔑 关键修复：使用自定义 renderScene，所有场景始终可见但通过 opacity 和 pointerEvents 控制
  const renderScene = ({ route }: { route: typeof routes[number] }) => {
    const isFocused = routes[index].key === route.key;
    
    return (
      <View
        style={[
          styles.scene,
         
        ]}
        // pointerEvents={isFocused ? 'auto' : 'none'}
      >
        {route.key === 'first' ? <App /> : <SecondRoute />}
      </View>
    );
  };

  return (
    <TabView
      style={{ flex: 1 }}
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      // 🔑 禁用懒加载，确保所有场景立即渲染
      // lazy={false}
      // 🔑 关键：禁用滑动切换，避免 TabView 的优化导致场景卸载
      swipeEnabled={false}
      renderTabBar={props => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: 'white' }}
          style={{ backgroundColor: '#2196F3' }}
        />
      )}
    />
  );
}

function SecondRoute() {
    return <View style={{ flex: 1, backgroundColor: '#673ab7' }} />;
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },
  hiddenScene: {
    opacity: 0,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});