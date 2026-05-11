import { DriveStrategy } from './types';
import type { DriveRouteOptions, DriveRouteResult, RouteResult, TransitRouteOptions } from './types';
import { parsePolyline } from './route-geometry';

async function loadWebApiFallback(feature: '公交路径规划' | '规避路线预览') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const webApi = require('expo-gaode-map-web-api');
    if (typeof webApi?.GaodeWebAPI !== 'function') {
      throw new Error('expo-gaode-map-web-api 未导出 GaodeWebAPI');
    }
    return webApi;
  } catch {
    throw new Error(
      `${feature}依赖 expo-gaode-map-web-api。请安装该包，并在 ExpoGaodeMapModule.initSDK 中提供 webKey。`
    );
  }
}

function normalizeAvoidPolygons(polygons?: DriveRouteOptions['avoidPolygons']): string | undefined {
  if (!polygons?.length) {
    return undefined;
  }

  const normalized = polygons
    .map((polygon) =>
      polygon
        .map((point) => `${point.longitude},${point.latitude}`)
        .join(';')
    )
    .filter(Boolean)
    .join('|');

  return normalized || undefined;
}

function normalizeDrivingStrategy(
  strategy?: DriveStrategy
): number | undefined {
  // 导航 SDK 与 Web API 的策略枚举不完全一致。
  // 这里做“尽量等价”的映射，主要用于带规避参数时的路线预览。
  switch (strategy) {
    case DriveStrategy.FASTEST:
      return 38;
    case DriveStrategy.FEE_FIRST:
      return 1;
    case DriveStrategy.SHORTEST:
      return 2;
    case DriveStrategy.NO_EXPRESSWAYS:
      return 37;
    case DriveStrategy.AVOID_CONGESTION:
      return 33;
    case DriveStrategy.NO_HIGHWAY:
      return 35;
    case DriveStrategy.NO_HIGHWAY_AVOID_CONGESTION:
      return 40;
    case DriveStrategy.AVOID_COST_CONGESTION:
    case DriveStrategy.AVOID_CONGESTION_COST:
      return 41;
    case DriveStrategy.NO_HIGHWAY_AVOID_COST_CONGESTION:
      return 43;
    default:
      return undefined;
  }
}

function normalizeDrivingRouteResult(
  options: DriveRouteOptions,
  result: any
): DriveRouteResult {
  // 把 Web API 的原始字段翻译成导航包已经对外稳定的 RouteResult 结构。
  // 这样上层代码不需要知道 Web API 的字段名，也不用为 fallback 单独写分支。
  const paths = result?.route?.paths ?? [];
  const routes = paths.map((path: any, index: number) => {
    const segments = (path?.steps ?? []).map((step: any) => ({
      instruction: step?.instruction ?? '',
      orientation: step?.orientation,
      road: step?.road_name,
      distance: Number(step?.step_distance ?? 0),
      duration: Number(step?.cost?.duration ?? 0),
      polyline: parsePolyline(step?.polyline),
      assistantAction: step?.assistant_action,
      tollDistance: step?.cost?.toll_distance ? Number(step.cost.toll_distance) : undefined,
      tollCost: step?.cost?.tolls ? Number(step.cost.tolls) : undefined,
    }));

    const restrictionCode = path?.restriction != null ? Number(path.restriction) : undefined;

    return {
      id: index,
      start: options.from,
      end: options.to,
      distance: Number(path?.distance ?? 0),
      duration: Number(path?.cost?.duration ?? path?.duration ?? 0),
      segments,
      polyline: segments.flatMap((segment: { polyline: any[] }) => segment.polyline),
      tollDistance: path?.cost?.toll_distance ? Number(path.cost.toll_distance) : undefined,
      tollCost: path?.cost?.tolls ? Number(path.cost.tolls) : undefined,
      trafficLightCount: path?.cost?.traffic_lights ? Number(path.cost.traffic_lights) : undefined,
      restrictionCode,
      restrictionInfo:
        restrictionCode === 0
          ? '限行已规避或未限行'
          : restrictionCode === 1
            ? '限行无法规避'
            : undefined,
      strategy: options.strategy,
    };
  });

  return {
    count: Number(result?.count ?? routes.length),
    mainPathIndex: 0,
    routeIds: routes.map((route: RouteResult) => route.id),
    routes,
    taxiCost: result?.route?.taxi_cost ? Number(result.route.taxi_cost) : undefined,
  };
}

export function shouldUseAvoidPreviewFallback(options: DriveRouteOptions): boolean {
  // 只有出现“规避道路 / 规避区域”时才需要走 Web API 预览。
  // 普通驾车算路仍然优先走原生能力。
  return Boolean(options.avoidRoad?.trim() || options.avoidPolygons?.length);
}

export async function calculateDriveRouteWithAvoidPreview(
  options: DriveRouteOptions
): Promise<DriveRouteResult> {
  // Web API 只负责“预览规避后的路线”，不是替代原生导航 SDK。
  // 失败时让调用方回退到原生实现，避免把可用路径规划直接变成报错。
  const { GaodeWebAPI } = await loadWebApiFallback('规避路线预览');
  const api = new GaodeWebAPI();
  const result = await api.route.driving(
    `${options.from.longitude},${options.from.latitude}`,
    `${options.to.longitude},${options.to.latitude}`,
    {
      strategy: normalizeDrivingStrategy(options.strategy),
      waypoints: options.waypoints?.map(
        (point) => `${point.longitude},${point.latitude}`
      ),
      avoidpolygons: normalizeAvoidPolygons(options.avoidPolygons),
      avoidroad: options.avoidRoad?.trim() || undefined,
      plate: options.carNumber,
      show_fields: 'cost,navi,polyline',
    }
  );

  return normalizeDrivingRouteResult(options, result);
}

function normalizeTransitRouteResult(
  options: TransitRouteOptions,
  result: any
): DriveRouteResult {
  // 导航包内部仍保持独立实现；
  // 这里只是在“公交无法由导航 SDK 直算”时，把 Web API 结果映射成现有 RouteResult 形状。
  const routes = (result?.route?.transits ?? []).map((transit: any, index: number) => {
    const polyline = (transit?.segments ?? []).flatMap((segment: any) => [
      ...(segment.walking?.steps?.flatMap((step: any) => parsePolyline(step.polyline)) ?? []),
      ...(segment.bus?.buslines?.flatMap((line: any) => parsePolyline(line.polyline)) ?? []),
      ...(segment.railway?.buslines?.flatMap((line: any) => parsePolyline(line.polyline)) ?? []),
    ]);

    return {
      id: index,
      start: options.from,
      end: options.to,
      distance: Number(transit?.distance ?? 0),
      duration: Number(transit?.cost?.duration ?? 0),
      segments: [],
      polyline,
      tollDistance: 0,
      tollCost: Number(transit?.cost?.transit_fee ?? 0),
      strategy: options.strategy,
    };
  });

  return {
    count: routes.length,
    mainPathIndex: 0,
    routes,
  };
}

export async function calculateTransitRouteWithWebApi(
  options: TransitRouteOptions
): Promise<DriveRouteResult> {
  // 公交换乘在当前 SDK 能力下统一回退到 Web API，再映射成同一份路线结构。
  // 运行时按需加载，避免把 navigation 包和 web-api 包在构建期强绑定。
  const { GaodeWebAPI, TransitStrategy } = await loadWebApiFallback('公交路径规划');
  const api = new GaodeWebAPI();
  const result = await api.route.transit(
    `${options.from.longitude},${options.from.latitude}`,
    `${options.to.longitude},${options.to.latitude}`,
    options.city1,
    options.city2,
    {
      strategy: options.strategy ?? TransitStrategy.RECOMMENDED,
      AlternativeRoute: options.alternativeRoute,
      show_fields: 'cost,polyline',
    }
  );

  return normalizeTransitRouteResult(options, result);
}
