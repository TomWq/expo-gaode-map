
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
  /**
   * 初始化搜索模块（可选）
   *
   * 如果 API Key 已通过以下方式设置，则无需调用此方法：
   * 1. app.json 的 plugins 中配置了 iosKey（推荐）
   * 2. 调用了 ExpoGaodeMap.initSDK()
   * 3. 在 AppDelegate 中手动设置
   *
   * 此方法会在首次调用搜索功能时自动执行，手动调用可以提前检测配置问题。
   */
  initSearch(): void;
  /**
   * 搜索 POI（兴趣点）
   * 根据关键词和可选参数返回匹配的 POI 列表。
   *
   * @param options 搜索参数，包含关键词、城市、类型等
   * @returns 匹配的 POI 列表
   */
  searchPOI(options: POISearchOptions): Promise<SearchResult>;
  /**
   * 搜索周边 POI
   * 根据位置和半径返回周边的 POI 列表。
   *
   * @param options 搜索参数，包含位置、半径、类型等
   * @returns 周边的 POI 列表
   */
  searchNearby(options: NearbySearchOptions): Promise<SearchResult>;
  /**
   * 搜索沿途 POI
   * 根据路线和半径返回沿途的 POI 列表。
   *
   * @param options 搜索参数，包含路线、半径、类型等
   * @returns 沿途的 POI 列表
   */
  searchAlong(options: AlongSearchOptions): Promise<SearchResult>;
  /**
   * 搜索多边形内的 POI
   * 根据多边形区域返回其内的 POI 列表。
   *
   * @param options 搜索参数，包含多边形区域、类型等
   * @returns 多边形内的 POI 列表
   */
  searchPolygon(options: PolygonSearchOptions): Promise<SearchResult>;
  /**
   * 获取输入提示
   * 根据用户输入返回可能的搜索建议。
   *
   * @param options 输入提示参数，包含关键词、城市等
   * @returns 输入提示结果
   */
  getInputTips(options: InputTipsOptions): Promise<InputTipsResult>;
  /**
   * 逆地理编码
   * 根据经纬度返回地址信息。
   *
   * @param options 逆地理编码参数，包含经纬度等
   * @returns 逆地理编码结果
   */
  reGeocode(options: ReGeocodeOptions): Promise<ReGeocodeResult>;
  /**
   * 获取 POI 详情
   * 根据 POI ID 返回详细信息。
   *
   * @param id POI 唯一标识符
   * @returns POI 详情
   */
  getPoiDetail(id: string): Promise<POI>;
}

/**
 * 高德地图搜索模块
 *
 * 提供 POI 搜索、周边搜索、沿途搜索、多边形搜索和输入提示功能
 */
const ExpoGaodeMapSearchModule = requireNativeModule<ExpoGaodeMapSearchModuleType>('ExpoGaodeMapSearch');

export default ExpoGaodeMapSearchModule;
