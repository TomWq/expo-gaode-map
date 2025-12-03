import { requireNativeModule } from 'expo-modules-core';

/**
 * 高德地图搜索模块
 * 
 * 提供 POI 搜索、周边搜索、沿途搜索、多边形搜索和输入提示功能
 */
const ExpoGaodeMapSearchModule = requireNativeModule('ExpoGaodeMapSearch');

export default ExpoGaodeMapSearchModule;