
import { requireNativeModule } from 'expo-modules-core';

import {
  AlongSearchOptions,
  InputTipsOptions,
  InputTipsResult,
  NearbySearchOptions,
  POI,
  POISearchOptions,
  PolygonSearchOptions,
  ReGeocodeOptions,
  ReGeocodeResult,
  SearchResult,
} from './ExpoGaodeMapSearch.types';


/**
 * 在加载原生搜索模块前，强制校验基础地图组件是否已安装。
 * 支持两种“基础地图提供者”：expo-gaode-map 或 expo-gaode-map-navigation（导航内置地图）。
 * 这样可避免导航与核心包的 SDK 冲突时无法使用搜索模块的问题。
 */
function ensureBaseInstalled() {
  let installed = false;
  try {
    // 优先检测核心地图包
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('expo-gaode-map');
    installed = true;
  } catch (_) {
    // 再尝试导航包（内置地图能力）
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('expo-gaode-map-navigation');
      installed = true;
    } catch (_) {
      installed = false;
    }
  }

  if (!installed) {
    const msg =
      '[expo-gaode-map-search] 需要先安装基础地图组件，支持以下任一包：\n' +
      '  - expo-gaode-map（核心地图包），或\n' +
      '  - expo-gaode-map-navigation（导航包，内置地图能力）\n' +
      '请先安装并完成原生配置后再重试。';
    throw new Error(msg);
  }
}

ensureBaseInstalled();

declare class ExpoGaodeMapSearchModuleType {
  initSearch(): void;
  searchPOI(options: POISearchOptions): Promise<SearchResult>;
  searchNearby(options: NearbySearchOptions): Promise<SearchResult>;
  searchAlong(options: AlongSearchOptions): Promise<SearchResult>;
  searchPolygon(options: PolygonSearchOptions): Promise<SearchResult>;
  getInputTips(options: InputTipsOptions): Promise<InputTipsResult>;
  reGeocode(options: ReGeocodeOptions): Promise<ReGeocodeResult>;
  getPoiDetail(id: string): Promise<POI>;
}

/**
 * 高德地图搜索模块
 *
 * 提供 POI 搜索、周边搜索、沿途搜索、多边形搜索和输入提示功能
 */
const ExpoGaodeMapSearchModule = requireNativeModule<ExpoGaodeMapSearchModuleType>('ExpoGaodeMapSearch');

export default ExpoGaodeMapSearchModule;
