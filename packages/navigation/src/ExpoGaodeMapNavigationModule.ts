
import { requireNativeModule } from 'expo-modules-core';

/**
 * 高德地图导航模块
 * 
 * 提供路径规划功能，包括驾车、步行、骑行、公交、货车等多种出行方式
 */
const ExpoGaodeMapNavigationModule = requireNativeModule('ExpoGaodeMapNavigation');

export default ExpoGaodeMapNavigationModule;