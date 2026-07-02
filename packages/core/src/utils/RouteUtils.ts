/**
 * 路线与区域展示相关的工具函数。
 *
 * 本文件主要负责路径坐标的边界计算、推荐缩放级别估算、
 * 高德 polyline / 多环边界字符串解析，以及将地图相机移动到合适的展示范围。
 * 这些逻辑用于在 JS 层统一处理路线回放、区域遮罩和路径自适应视野等场景。
 */
import ExpoGaodeMapModule from '../ExpoGaodeMapModule';
import type { LatLng, LatLngBounds, LatLngPoint } from '../types/common.types';
import type {
  FitToCoordinatesOptions,
  FitToCoordinatesTarget,
  MultiRingPolyline,
  RouteBounds,
} from '../types/route-playback.types';
import { normalizeLatLngList } from './GeoUtils';

const MIN_ZOOM = 3; // 最小缩放级别
const MAX_ZOOM = 20; // 最大缩放级别
const DEFAULT_SINGLE_POINT_ZOOM = 16; // 默认单点缩放级别
const DEFAULT_PADDING_FACTOR = 1.2; // 默认缓冲因子
const DEFAULT_VIEWPORT_WIDTH_PX = 390; // 默认视口宽度（像素）
const DEFAULT_VIEWPORT_HEIGHT_PX = 844; // 默认视口高度（像素）
const DEFAULT_PADDING_PX = 48; // 默认缓冲值（像素）

/**
 * 将缩放缓冲因子换算成地图四周需要预留的像素 padding。
 *
 * paddingFactor 表示“视野比实际路径范围放大多少倍”：
 * - 1 表示不额外留白；
 * - 1.2 表示路径只占视口中间约 83%，四周留出约 8.3% 的空白。
 *
 * @param paddingFactor 缓冲因子，必须大于 1 才会产生 padding。
 * @param viewportWidthPx 视口宽度，单位像素。
 * @param viewportHeightPx 视口高度，单位像素。
 * @returns 以较短边计算得到的单边 padding，单位像素。
 */
function paddingFactorToPaddingPx(
  paddingFactor: number,
  viewportWidthPx: number,
  viewportHeightPx: number
): number {
  if (!Number.isFinite(paddingFactor) || paddingFactor <= 1) {
    return 0;
  }
  const paddingRatio = (1 - 1 / paddingFactor) / 2;
  return Math.max(0, Math.min(viewportWidthPx, viewportHeightPx) * paddingRatio);
}

/**
 * 优先调用原生模块计算适配一组坐标的推荐缩放级别。
 *
 * 原生侧通常能结合地图 SDK 的投影与缩放规则给出更接近真实显示效果的 zoom。
 * 如果原生模块不可用或计算失败，返回 null，由上层使用纯 TS 估算逻辑兜底。
 *
 * @param points 路径点列表，每个点包含经纬度。
 * @param options 选项对象，包含缓冲因子、视口宽度、视口高度、最小缩放级别、最大缩放级别。
 * @defaultOptions 默认选项值。
 * @returns 推荐缩放级别，可能为 null。
 */
function calculateFitZoom(
  points: LatLng[],
  options: Pick<
    FitToCoordinatesOptions,
    'paddingFactor' | 'paddingPx' | 'viewportWidthPx' | 'viewportHeightPx' | 'minZoom' | 'maxZoom'
  >
): number | null {
  if (points.length === 0) {
    return null;
  }

  const viewportWidthPx = options.viewportWidthPx ?? DEFAULT_VIEWPORT_WIDTH_PX;
  const viewportHeightPx = options.viewportHeightPx ?? DEFAULT_VIEWPORT_HEIGHT_PX;
  const paddingFromFactor = paddingFactorToPaddingPx(
    options.paddingFactor ?? DEFAULT_PADDING_FACTOR,
    viewportWidthPx,
    viewportHeightPx
  );
  const paddingPx = options.paddingPx ?? (paddingFromFactor > 0 ? paddingFromFactor : DEFAULT_PADDING_PX);

  try {
    return ExpoGaodeMapModule.calculateFitZoom(points, {
      viewportWidthPx,
      viewportHeightPx,
      paddingPx,
      minZoom: options.minZoom,
      maxZoom: options.maxZoom,
    });
  } catch {
    return null;
  }
}

/**
 * 估算路径的推荐缩放级别
 * @param {number} latitudeDelta - 纬度跨度（度）
 * @param {number} longitudeDelta - 经度跨度（度）
 * @param {FitToCoordinatesOptions} options - 选项对象，包含最小缩放级别、最大缩放级别
 * @defaultOptions 默认选项值
 * @returns {number} - 推荐缩放级别
 */
export function estimateZoomLevel(
  latitudeDelta: number,
  longitudeDelta: number,
  options: Pick<FitToCoordinatesOptions, 'minZoom' | 'maxZoom'> = {}
): number {
  // 使用经纬度跨度估算一个“足够看全路径”的缩放级别。
  // 这是高层 TS 兜底逻辑，不依赖具体原生 SDK 的 fitBounds 能力。
  const span = Math.max(latitudeDelta, longitudeDelta, 0.0001);
  const rawZoom = Math.log2(360 / span);
  const minZoom = options.minZoom ?? MIN_ZOOM;
  const maxZoom = options.maxZoom ?? MAX_ZOOM;
  return Math.max(minZoom, Math.min(maxZoom, Number(rawZoom.toFixed(2))));
}

/**
 * 根据路径点计算地图展示所需的中心点、外接矩形、经纬度跨度和推荐缩放级别。
 *
 * 该函数会先统一坐标格式，再根据所有点的最南/北/东/西位置生成边界。
 * recommendedZoom 优先使用原生计算结果，失败时退回到经纬度跨度估算。
 * 
 * @param points 路径点列表，每个点包含经纬度。
 * @param options 选项对象，包含缓冲因子、视口宽度、视口高度、最小缩放级别、最大缩放级别。
 * @defaultOptions 默认选项值。
 * @returns 推荐缩放级别，可能为 null。
 */
export function getRouteBounds(
  points: LatLngPoint[],
  options: Pick<
    FitToCoordinatesOptions,
    'paddingFactor' | 'paddingPx' | 'viewportWidthPx' | 'viewportHeightPx' | 'minZoom' | 'maxZoom'
  > = {}
): RouteBounds | null {
  // 统一将路径点转换为对象坐标，再计算中心点、边界和推荐缩放。
  const normalized = normalizeLatLngList(points) as LatLng[];
  if (normalized.length === 0) {
    return null;
  }

  const latitudes = normalized.map((point) => point.latitude);
  const longitudes = normalized.map((point) => point.longitude);

  const north = Math.max(...latitudes);
  const south = Math.min(...latitudes);
  const east = Math.max(...longitudes);
  const west = Math.min(...longitudes);
  const paddingFactor = options.paddingFactor ?? DEFAULT_PADDING_FACTOR;
  const latitudeDelta = Math.max((north - south) * paddingFactor, 0.0001);
  const longitudeDelta = Math.max((east - west) * paddingFactor, 0.0001);
  const nativeZoom = calculateFitZoom(normalized, options);
  const fallbackZoom = estimateZoomLevel(latitudeDelta, longitudeDelta, options);

  return {
    center: {
      latitude: (north + south) / 2,
      longitude: (east + west) / 2,
    },
    bounds: {
      north,
      south,
      east,
      west,
    },
    span: {
      latitudeDelta,
      longitudeDelta,
    },
    recommendedZoom: nativeZoom ?? fallbackZoom,
  };
}

/**
 * 解析单个高德 polyline 环。
 *
 * 高德返回的 polyline 字符串通常为 `longitude,latitude;longitude,latitude`。
 * 这里会忽略空片段和非法坐标，避免单个异常点导致整个边界解析失败。
 * 
 * @param polyline 高德 polyline 字符串。
 * @returns 解析后的 LatLng 点数组。
 */
function parsePolylineRing(polyline: string): LatLng[] {
  if (!polyline.trim()) {
    return [];
  }

  return polyline
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const [longitude, latitude] = segment.split(',').map((value) => Number(value.trim()));
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        return null;
      }

      return {
        latitude,
        longitude,
      };
    })
    .filter((point): point is LatLng => point !== null);
}

/**
 * 解析高德多环 polyline，并计算整体坐标边界。
 *
 * 常用于 AOI、行政区或多边形边界等场景。高德以 `|` 分隔多个环，
 * 每个环内部再以 `;` 分隔坐标点。
 * 
 * @param polyline 高德 polyline 字符串。
 * @returns 解析后的 LatLng 点数组数组。
 */
export function parseMultiRingPolyline(polyline: string): MultiRingPolyline {
  // 高德 AOI / 多边形边界常见格式为 ring1|ring2，
  // 这里按“外环/内环”统一拆成二维坐标数组。
  const rings = polyline
    .split('|')
    .map((ring) => parsePolylineRing(ring))
    .filter((ring) => ring.length > 0);

  const flattened = rings.flat();
  const bounds = flattened.length
    ? {
        southwest: {
          latitude: Math.min(...flattened.map((point) => point.latitude)),
          longitude: Math.min(...flattened.map((point) => point.longitude)),
        },
        northeast: {
          latitude: Math.max(...flattened.map((point) => point.latitude)),
          longitude: Math.max(...flattened.map((point) => point.longitude)),
        },
      }
    : null;

  return {
    rings,
    bounds,
  };
}

/**
 * 将地图相机移动到能够完整展示指定坐标集合的位置。
 *
 * 单点场景直接定位到该点；多点场景会先计算路径边界，再移动到边界中心并应用推荐缩放。
 * 默认会沿用当前相机的 bearing 和 tilt，除非调用方显式关闭 preserveBearing / preserveTilt。
 * 
 * @param map 高德地图实例。
 * @param points 路径点列表，每个点包含经纬度。
 * @param options 选项对象，包含移动时间、缓冲因子、视口宽度、视口高度、最小缩放级别、最大缩放级别。
 * @defaultOptions 默认选项值。
 */
export async function fitCameraToCoordinates(
  map: FitToCoordinatesTarget,
  points: LatLngPoint[],
  options: FitToCoordinatesOptions = {}
): Promise<void> {
  // 高层相机适配：
  // 1. 单点时直接移动到该点；
  // 2. 多点时计算中心点与推荐缩放；
  // 3. 尽量保留当前朝向和俯仰，避免突兀跳变。
  const normalized = normalizeLatLngList(points) as LatLng[];
  if (normalized.length === 0) {
    return;
  }

  const currentCamera: Awaited<ReturnType<FitToCoordinatesTarget['getCameraPosition']>> =
    await map.getCameraPosition().catch(() => ({}));

  if (normalized.length === 1) {
    const single = normalized[0];
    if (!single) {
      return;
    }
    await map.moveCamera(
      {
        target: single,
        zoom: options.singlePointZoom ?? currentCamera.zoom ?? DEFAULT_SINGLE_POINT_ZOOM,
        bearing: options.preserveBearing === false ? options.bearing : currentCamera.bearing ?? options.bearing,
        tilt: options.preserveTilt === false ? options.tilt : currentCamera.tilt ?? options.tilt,
      },
      options.duration ?? 0
    );
    return;
  }

  const routeBounds = getRouteBounds(normalized, options);
  if (!routeBounds) {
    return;
  }

  await map.moveCamera(
    {
      target: routeBounds.center,
      zoom: routeBounds.recommendedZoom,
      bearing: options.preserveBearing === false ? options.bearing : currentCamera.bearing ?? options.bearing,
      tilt: options.preserveTilt === false ? options.tilt : currentCamera.tilt ?? options.tilt,
    },
    options.duration ?? 0
  );
}

/**
 * 将路径点转换为高德地图通用的西南/东北矩形边界。
 * 
 * @param points 路径点列表，每个点包含经纬度。
 * @returns 高德地图通用的西南/东北矩形边界。
 */
export function buildLatLngBounds(points: LatLngPoint[]): LatLngBounds | null {
  const routeBounds = getRouteBounds(points);
  if (!routeBounds) {
    return null;
  }

  return {
    southwest: {
      latitude: routeBounds.bounds.south,
      longitude: routeBounds.bounds.west,
    },
    northeast: {
      latitude: routeBounds.bounds.north,
      longitude: routeBounds.bounds.east,
    },
  };
}
