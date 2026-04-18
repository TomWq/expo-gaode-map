import ExpoGaodeMapNavigationModule from './ExpoGaodeMapNavigationModule';
import { ExpoGaodeMapModule } from './map';

// 重新导出地图模块的所有内容
export * from './map';
import {
  RouteType,
  DriveStrategy,
  WalkStrategy,
  RideStrategy,
  TruckSize,
  TravelStrategy,
  type TransitRouteOptions,
} from './types';
import type {
  NaviPoint,
  RouteOptions,
  DriveRouteOptions,
  WalkRouteOptions,
  RideRouteOptions,
  EBikeRouteOptions,
  TransitRouteOptions as TransitRouteOptionsType,
  TruckRouteOptions,
  OfficialNaviPageOptions,
  RouteResult,
  DriveRouteResult,
  IndependentRouteResult,
  IndependentDriveRouteOptions,
  IndependentTruckRouteOptions,
  IndependentWalkRouteOptions,
  IndependentRideRouteOptions,
  SelectIndependentRouteOptions,
  StartNaviWithIndependentPathOptions,
  ClearIndependentRouteOptions,
  MotorcycleRouteOptions,
  IndependentMotorcycleRouteOptions,
  BuildAnchorWaypointsOptions,
  FollowWebPlannedRouteOptions,
  FollowWebPlannedRouteResult,
  FollowWebPlannedRouteCandidate,
  WebPlannedRoute,
  NaviInfoUpdateEvent,
  NaviVisualStateEvent,
  ExpoGaodeMapNaviViewProps,
  } from './types';

function parsePolyline(polyline?: string): NaviPoint[] {
  if (!polyline?.trim()) {
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
    .filter((point): point is NaviPoint => point !== null);
}

function dedupeAdjacentPoints(points: NaviPoint[]): NaviPoint[] {
  return points.filter((point, index) => {
    if (index === 0) {
      return true;
    }

    const previous = points[index - 1];
    return (
      previous.latitude !== point.latitude ||
      previous.longitude !== point.longitude
    );
  });
}

function haversineDistance(pointA: NaviPoint, pointB: NaviPoint): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const latitudeDelta = toRadians(pointB.latitude - pointA.latitude);
  const longitudeDelta = toRadians(pointB.longitude - pointA.longitude);
  const latitudeA = toRadians(pointA.latitude);
  const latitudeB = toRadians(pointB.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(a));
}

function distanceBetweenCoordinatesSafe(pointA: NaviPoint, pointB: NaviPoint): number {
  try {
    return ExpoGaodeMapModule.distanceBetweenCoordinates(pointA, pointB);
  } catch {
    return haversineDistance(pointA, pointB);
  }
}

function calculatePathLengthSafe(points: NaviPoint[]): number {
  try {
    return ExpoGaodeMapModule.calculatePathLength(points);
  } catch {
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      total += distanceBetweenCoordinatesSafe(points[index - 1], points[index]);
    }
    return total;
  }
}

function simplifyPolylineSafe(points: NaviPoint[], tolerance: number): NaviPoint[] {
  if (points.length <= 2) {
    return points;
  }

  try {
    const simplified = ExpoGaodeMapModule.simplifyPolyline(points, tolerance);
    return simplified.length >= 2 ? simplified : points;
  } catch {
    return points;
  }
}

function getDistanceToPathSafe(path: NaviPoint[], target: NaviPoint): number {
  if (path.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  try {
    const nearest = ExpoGaodeMapModule.getNearestPointOnPath(path, target);
    if (nearest) {
      return nearest.distanceMeters;
    }
  } catch {
    // ignore and fallback to point-to-point scan
  }

  return path.reduce((minimum, point) => {
    const distance = distanceBetweenCoordinatesSafe(point, target);
    return distance < minimum ? distance : minimum;
  }, Number.POSITIVE_INFINITY);
}

function samplePolyline(points: NaviPoint[], targetSamples = 36): NaviPoint[] {
  if (points.length <= targetSamples) {
    return points;
  }

  const step = Math.max(1, Math.floor(points.length / targetSamples));
  const samples = points.filter((_, index) => index % step === 0);
  const lastPoint = points[points.length - 1];
  const lastSample = samples[samples.length - 1];
  if (
    !lastSample ||
    lastSample.latitude !== lastPoint.latitude ||
    lastSample.longitude !== lastPoint.longitude
  ) {
    samples.push(lastPoint);
  }
  return samples;
}

function selectEvenlySpacedPoints(points: NaviPoint[], count: number): NaviPoint[] {
  if (count <= 0 || points.length <= count) {
    return points;
  }

  return Array.from({ length: count }, (_, index) => {
    const rawIndex = Math.round(((index + 1) * (points.length + 1)) / (count + 1)) - 1;
    const boundedIndex = Math.min(points.length - 1, Math.max(0, rawIndex));
    return points[boundedIndex];
  });
}

function normalizeWebRoutePolyline(webRoute: WebPlannedRoute): NaviPoint[] {
  const directPolyline = dedupeAdjacentPoints(webRoute.polyline ?? []);
  if (directPolyline.length > 1) {
    return directPolyline;
  }

  const stepPolyline = dedupeAdjacentPoints(
    (webRoute.steps ?? []).flatMap((step) => step.polyline ?? [])
  );
  return stepPolyline;
}

export function buildAnchorWaypointsFromWebRoute(
  options: BuildAnchorWaypointsOptions
): NaviPoint[] {
  const {
    webRoute,
    maxViaPoints = 8,
    simplifyTolerance = 80,
    minSpacingMeters = 800,
  } = options;

  const polyline = normalizeWebRoutePolyline(webRoute);
  if (polyline.length <= 2) {
    return [];
  }

  const simplified = dedupeAdjacentPoints(
    simplifyPolylineSafe(polyline, simplifyTolerance)
  );
  const candidatePoints = simplified.length > 2 ? simplified : polyline;
  const interiorPoints = candidatePoints.slice(1, -1);

  const spacedPoints: NaviPoint[] = [];
  let previousPoint = polyline[0];

  for (const point of interiorPoints) {
    if (distanceBetweenCoordinatesSafe(previousPoint, point) < minSpacingMeters) {
      continue;
    }
    spacedPoints.push(point);
    previousPoint = point;
  }

  const waypoints = spacedPoints.length > 0
    ? spacedPoints
    : candidatePoints.length > 2
      ? [candidatePoints[Math.floor(candidatePoints.length / 2)]]
      : [];

  return dedupeAdjacentPoints(selectEvenlySpacedPoints(waypoints, maxViaPoints));
}

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
      polyline: segments.flatMap((segment: { polyline: NaviPoint[] }) => segment.polyline),
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

function shouldUseAvoidPreviewFallback(options: DriveRouteOptions): boolean {
  return Boolean(options.avoidRoad?.trim() || options.avoidPolygons?.length);
}

type RouteLike = RouteResult & {
  routeId?: number;
  steps?: Array<{ polyline?: NaviPoint[] }>;
};

function extractRoutePolyline(route: RouteLike): NaviPoint[] {
  if (Array.isArray(route.polyline) && route.polyline.length > 0) {
    return route.polyline;
  }

  const segments = Array.isArray(route.segments) ? route.segments : [];
  if (segments.length > 0) {
    return dedupeAdjacentPoints(
      segments.flatMap((segment) => segment.polyline ?? [])
    );
  }

  const steps = Array.isArray(route.steps) ? route.steps : [];
  if (steps.length > 0) {
    return dedupeAdjacentPoints(
      steps.flatMap((step) => step.polyline ?? [])
    );
  }

  return [];
}

function resolveIndependentRouteId(
  result: IndependentRouteResult,
  route: RouteLike,
  routeIndex: number
): number | undefined {
  if (typeof route.id === 'number') {
    return route.id;
  }
  if (typeof route.routeId === 'number') {
    return route.routeId;
  }
  return result.routeIds?.[routeIndex];
}

function scoreIndependentRouteAgainstWebPolyline(
  result: IndependentRouteResult,
  route: RouteLike,
  routeIndex: number,
  webPolyline: NaviPoint[],
  anchorWaypoints: NaviPoint[],
  thresholdMeters: number
): FollowWebPlannedRouteCandidate | null {
  const nativePolyline = extractRoutePolyline(route);
  if (nativePolyline.length === 0 || webPolyline.length === 0) {
    return null;
  }

  const sampledNativePoints = samplePolyline(nativePolyline);
  const pointDistances = sampledNativePoints.map((point) =>
    getDistanceToPathSafe(webPolyline, point)
  );
  const averageDeviationMeters =
    pointDistances.reduce((total, distance) => total + distance, 0) / pointDistances.length;
  const maxDeviationMeters = Math.max(...pointDistances);

  const missedAnchorCount = anchorWaypoints.reduce((count, point) => (
    getDistanceToPathSafe(nativePolyline, point) > thresholdMeters ? count + 1 : count
  ), 0);

  return {
    routeId: resolveIndependentRouteId(result, route, routeIndex),
    routeIndex,
    averageDeviationMeters,
    maxDeviationMeters,
    missedAnchorCount,
    score:
      averageDeviationMeters +
      maxDeviationMeters * 0.35 +
      missedAnchorCount * thresholdMeters * 0.5,
  };
}

function evaluateIndependentResultAgainstWebRoute(
  independentResult: IndependentRouteResult,
  webPolyline: NaviPoint[],
  anchorWaypoints: NaviPoint[],
  maxDeviationMeters: number
) {
  const candidateMatches = independentResult.routes
    .map((route, routeIndex) =>
      scoreIndependentRouteAgainstWebPolyline(
        independentResult,
        route as RouteLike,
        routeIndex,
        webPolyline,
        anchorWaypoints,
        maxDeviationMeters
      )
    )
    .filter((candidate): candidate is FollowWebPlannedRouteCandidate => candidate !== null)
    .sort((routeA, routeB) => routeA.score - routeB.score);

  const bestMatch = candidateMatches[0];
  const selectedRoute = bestMatch
    ? independentResult.routes[bestMatch.routeIndex] as RouteLike
    : undefined;
  const nativePolyline = selectedRoute ? extractRoutePolyline(selectedRoute) : [];

  let mode: FollowWebPlannedRouteResult['mode'] = 'preview_only';
  let reason = '未找到足够接近 Web 规划线的原生路线';

  if (bestMatch) {
    if (
      bestMatch.averageDeviationMeters <= maxDeviationMeters / 2 &&
      bestMatch.maxDeviationMeters <= maxDeviationMeters &&
      bestMatch.missedAnchorCount === 0
    ) {
      mode = 'matched';
      reason = '原生路线与 Web 规划线高度接近，可直接按近似结果导航';
    } else if (
      bestMatch.averageDeviationMeters <= maxDeviationMeters &&
      bestMatch.maxDeviationMeters <= maxDeviationMeters * 2
    ) {
      mode = 'approximate';
      reason = '原生路线与 Web 规划线接近，但仍存在可见偏差';
    }
  }

  return {
    candidateMatches,
    bestMatch,
    selectedRoute,
    nativePolyline,
    mode,
    reason,
  };
}

export async function followWebPlannedRoute(
  options: FollowWebPlannedRouteOptions
): Promise<FollowWebPlannedRouteResult> {
  const {
    from,
    to,
    webRoute,
    strategy,
    carNumber,
    restriction,
    maxDeviationMeters = 120,
    startNavigation = false,
    naviType = 0,
  } = options;

  const webPolyline = normalizeWebRoutePolyline(webRoute);
  if (webPolyline.length < 2) {
    throw new Error('webRoute.polyline 至少需要 2 个点');
  }

  const anchorWaypoints = buildAnchorWaypointsFromWebRoute(options);
  const anchoredIndependentResult = await independentDriveRoute({
    from,
    to,
    strategy,
    carNumber,
    restriction,
    waypoints: anchorWaypoints,
  });

  let independentResult = anchoredIndependentResult;
  let evaluation = evaluateIndependentResultAgainstWebRoute(
    anchoredIndependentResult,
    webPolyline,
    anchorWaypoints,
    maxDeviationMeters
  );
  let navigationUsesAnchorWaypoints = anchorWaypoints.length > 0;

  if (evaluation.bestMatch && evaluation.mode !== 'preview_only' && anchorWaypoints.length > 0) {
    try {
      const directIndependentResult = await independentDriveRoute({
        from,
        to,
        strategy,
        carNumber,
        restriction,
      });

      const directEvaluation = evaluateIndependentResultAgainstWebRoute(
        directIndependentResult,
        webPolyline,
        [],
        maxDeviationMeters
      );
      const anchoredBest = evaluation.bestMatch;
      const directBest = directEvaluation.bestMatch;

      const canSwitchToDirectNavigation =
        Boolean(directBest) &&
        directEvaluation.mode !== 'preview_only' &&
        directBest!.averageDeviationMeters <= Math.max(
          anchoredBest.averageDeviationMeters + 45,
          anchoredBest.averageDeviationMeters * 1.45
        ) &&
        directBest!.maxDeviationMeters <= Math.max(
          anchoredBest.maxDeviationMeters + 90,
          anchoredBest.maxDeviationMeters * 1.45
        );

      if (canSwitchToDirectNavigation) {
        ExpoGaodeMapNavigationModule.clearIndependentRoute({
          token: anchoredIndependentResult.token,
        }).catch(() => {});
        independentResult = directIndependentResult;
        evaluation = directEvaluation;
        navigationUsesAnchorWaypoints = false;
        evaluation.reason =
          directEvaluation.mode === 'matched'
            ? '已切换为无途经点导航结果，且与 Web 规划线高度接近'
            : '已切换为无途经点导航结果，但与 Web 规划线仍存在轻微偏差';
      } else {
        ExpoGaodeMapNavigationModule.clearIndependentRoute({
          token: directIndependentResult.token,
        }).catch(() => {});
        evaluation.reason = `${evaluation.reason}；最终导航仍需依赖锚点途经点逼近 Web 线路`;
      }
    } catch {
      evaluation.reason = `${evaluation.reason}；无途经点重算失败，最终导航仍需依赖锚点途经点`;
    }
  }

  let navigationStarted = false;
  if (startNavigation && evaluation.bestMatch && evaluation.mode !== 'preview_only') {
    navigationStarted = await startNaviWithIndependentPath({
      token: independentResult.token,
      naviType,
      routeId: evaluation.bestMatch.routeId,
      routeIndex:
        evaluation.bestMatch.routeId == null ? evaluation.bestMatch.routeIndex : undefined,
    });
  }

  return {
    mode: evaluation.mode,
    token: independentResult.token,
    anchorWaypoints,
    webDistance: calculatePathLengthSafe(webPolyline),
    nativeDistance:
      evaluation.nativePolyline.length > 1
        ? calculatePathLengthSafe(evaluation.nativePolyline)
        : undefined,
    selectedRouteId: evaluation.bestMatch?.routeId,
    selectedRouteIndex: evaluation.bestMatch?.routeIndex,
    averageDeviationMeters: evaluation.bestMatch?.averageDeviationMeters,
    maxDeviationMeters: evaluation.bestMatch?.maxDeviationMeters,
    navigationStarted,
    navigationUsesAnchorWaypoints,
    independentResult,
    candidateMatches: evaluation.candidateMatches,
    reason: evaluation.reason,
  };
}

async function calculateDriveRouteWithAvoidPreview(
  options: DriveRouteOptions
): Promise<DriveRouteResult> {
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

function hasStrategyOption(
  options: RouteOptions
): options is WalkRouteOptions | RideRouteOptions {
  return 'strategy' in options;
}

function isMotorcycleRouteOptions(
  options: RouteOptions | MotorcycleRouteOptions
): options is MotorcycleRouteOptions {
  return 'motorcycleCC' in options;
}

// 导出官方导航界面组件
export { 
  ExpoGaodeMapNaviView, 
  type ExpoGaodeMapNaviViewRef,
  // 兼容旧版本名称
  ExpoGaodeMapNaviView as NaviView,
  type ExpoGaodeMapNaviViewRef as NaviViewRef 
} from './ExpoGaodeMapNaviView';

/**
 * 初始化导航模块（可选）
 */
export const initNavigation = () => ExpoGaodeMapNavigationModule.initNavigation();

/**
 * 销毁所有路径计算器实例
 * 用于页面切换时释放资源，避免"Another route calculation is in progress"错误
 */
export const destroyAllCalculators = () => ExpoGaodeMapNavigationModule.destroyAllCalculators();

/**
 * 路径规划（通用方法）
 */
export async function calculateRoute(
  options: RouteOptions
): Promise<RouteResult | DriveRouteResult> {
  if ('type' in options && options.type === RouteType.TRANSIT) {
    return calculateTransitRoute(options as TransitRouteOptions);
  }

  // 1. 货车
  if ('size' in options) {
    return calculateTruckRoute(options as TruckRouteOptions);
  }
  
  // 2. 步行、骑行、电动车
  if ('multiple' in options || 'travelStrategy' in options) {
    if ('usePoi' in options) return calculateEBikeRoute(options as EBikeRouteOptions);
    
    // 策略判断：0 或 1 通常为骑行策略，其余默认步行
    const strategy = hasStrategyOption(options) ? options.strategy : undefined;
    if (strategy === 0 || strategy === 1) {
      return calculateRideRoute(options as RideRouteOptions);
    }
    return calculateWalkRoute(options as WalkRouteOptions);
  }

  // 3. 摩托车 (通过 carType 或 motorcycleCC 判断)
  if (isMotorcycleRouteOptions(options)) {
    return calculateMotorcycleRoute(options as MotorcycleRouteOptions);
  }

  // 4. 默认驾车
  return calculateDriveRoute(options as DriveRouteOptions);
}

/**
 * 驾车路径规划
 */
export async function calculateDriveRoute(
  options: DriveRouteOptions
): Promise<DriveRouteResult> {
  if (shouldUseAvoidPreviewFallback(options)) {
    try {
      return await calculateDriveRouteWithAvoidPreview(options);
    } catch {
      // 若未安装 Web API 包，则保持现有原生逻辑不变。
      // 这样不会破坏当前依赖 Android 反射重载的项目。
    }
  }

  return ExpoGaodeMapNavigationModule.calculateDriveRoute(options);
}

/**
 * 步行路径规划
 */
export const calculateWalkRoute = (options: WalkRouteOptions) => 
  ExpoGaodeMapNavigationModule.calculateWalkRoute(options);

/**
 * 骑行路径规划
 */
export const calculateRideRoute = (options: RideRouteOptions) => 
  ExpoGaodeMapNavigationModule.calculateRideRoute(options);

/**
 * 骑行电动车路径规划
 */
export const calculateEBikeRoute = (options: EBikeRouteOptions) => 
  ExpoGaodeMapNavigationModule.calculateEBikeRoute(options);

/**
 * 货车路径规划
 */
export const calculateTruckRoute = (options: TruckRouteOptions) => 
  ExpoGaodeMapNavigationModule.calculateTruckRoute(options);

/**
 * 摩托车路径规划（车类型为 11，支持传入排量）
 */
export const calculateMotorcycleRoute = (options: MotorcycleRouteOptions) => 
  ExpoGaodeMapNavigationModule.calculateMotorcycleRoute(options);

/**
 * 公交换乘路径规划（运行时 fallback 到 Web API）
 */
export async function calculateTransitRoute(options: TransitRouteOptions): Promise<DriveRouteResult> {
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

/**
* 独立路径规划（不会影响当前导航；适合路线预览/行前选路）
*/
export const independentDriveRoute = (options: IndependentDriveRouteOptions) => 
  ExpoGaodeMapNavigationModule.independentDriveRoute(options);

export const independentTruckRoute = (options: IndependentTruckRouteOptions) => 
  ExpoGaodeMapNavigationModule.independentTruckRoute(options);

export const independentWalkRoute = (options: IndependentWalkRouteOptions) => 
  ExpoGaodeMapNavigationModule.independentWalkRoute(options);

export const independentRideRoute = (options: IndependentRideRouteOptions) => 
  ExpoGaodeMapNavigationModule.independentRideRoute(options);

/**
 * 独立摩托车路径规划（不干扰当前导航）
 */
export const independentMotorcycleRoute = (options: IndependentMotorcycleRouteOptions) => 
  ExpoGaodeMapNavigationModule.independentMotorcycleRoute(options);

/**
 * 独立路径组：选主路线
 */
export const selectIndependentRoute = (options: SelectIndependentRouteOptions) => 
  ExpoGaodeMapNavigationModule.selectIndependentRoute(options);

/**
 * 独立路径组：使用指定路线启动导航
 */
export const startNaviWithIndependentPath = (options: StartNaviWithIndependentPathOptions) => 
  ExpoGaodeMapNavigationModule.startNaviWithIndependentPath(options);

/**
 * 打开高德官方导航页（Android 原生 AmapNaviPage）
 */
export const openOfficialNaviPage = (options: OfficialNaviPageOptions) =>
  ExpoGaodeMapNavigationModule.openOfficialNaviPage(options);

/**
 * 独立路径组：清理
 */
export const clearIndependentRoute = (options: ClearIndependentRouteOptions) => 
  ExpoGaodeMapNavigationModule.clearIndependentRoute(options);

// 导出导航相关类型与枚举（Coordinates 从 map 模块导出）
export type {
  NaviPoint,
  RouteOptions,
  DriveRouteOptions,
  WalkRouteOptions,
  RideRouteOptions,
  EBikeRouteOptions,
  TransitRouteOptionsType as TransitRouteOptions,
  TruckRouteOptions,
  RouteResult,
  DriveRouteResult,
  IndependentRouteResult,
  IndependentDriveRouteOptions,
  IndependentTruckRouteOptions,
  IndependentWalkRouteOptions,
  IndependentRideRouteOptions,
  SelectIndependentRouteOptions,
  StartNaviWithIndependentPathOptions,
  OfficialNaviPageOptions,
  ClearIndependentRouteOptions,
  MotorcycleRouteOptions,
  IndependentMotorcycleRouteOptions,
  BuildAnchorWaypointsOptions,
  FollowWebPlannedRouteOptions,
  FollowWebPlannedRouteResult,
  FollowWebPlannedRouteCandidate,
  WebPlannedRoute,
  NaviInfoUpdateEvent,
  NaviVisualStateEvent,
  ExpoGaodeMapNaviViewProps,
};

export {
  RouteType,
  DriveStrategy,
  WalkStrategy,
  RideStrategy,
  TruckSize,
  TravelStrategy,
};

// 精简后的默认导出
export default {
  // 初始化
  initNavigation,
  destroyAllCalculators,

  // 路径规划
  calculateRoute,
  calculateDriveRoute,
  calculateWalkRoute,
  calculateRideRoute,
  calculateEBikeRoute,
  calculateTransitRoute,
  calculateTruckRoute,
  calculateMotorcycleRoute,
  buildAnchorWaypointsFromWebRoute,
  followWebPlannedRoute,

  // 独立路径规划
  independentDriveRoute,
  independentTruckRoute,
  independentWalkRoute,
  independentRideRoute,
  independentMotorcycleRoute,

  // 独立路径组操作
  selectIndependentRoute,
  startNaviWithIndependentPath,
  openOfficialNaviPage,
  clearIndependentRoute,
};

export {
  ExpoGaodeMapNavigationModule,
}

export { EmbeddedNaviHud, EmbeddedNaviLaneView, EmbeddedNaviView } from "./ui";
export type { EmbeddedNaviLaneViewProps, EmbeddedNaviViewProps } from "./ui";
