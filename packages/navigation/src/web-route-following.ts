import ExpoGaodeMapNavigationModule from './ExpoGaodeMapNavigationModule';
import { buildAnchorWaypointsFromWebRoute, calculatePathLengthSafe, dedupeAdjacentPoints, getDistanceToPathSafe, normalizeWebRoutePolyline, samplePolyline } from './route-geometry';
import type {
  FollowWebPlannedRouteCandidate,
  FollowWebPlannedRouteOptions,
  FollowWebPlannedRouteResult,
  IndependentRouteResult,
  NaviPoint,
  RouteResult,
} from './types';

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
  // 评分思路很简单：看原生独立路线与 Web 折线有多接近，
  // 再把平均偏差、最大偏差、漏掉的锚点一起折成一个排序分数。
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
  // 先给每条原生候选路线打分，再把最接近的一条拿出来判断是 matched / approximate / preview_only。
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

async function runIndependentDriveRoute(options: {
  from: FollowWebPlannedRouteOptions['from'];
  to: FollowWebPlannedRouteOptions['to'];
  strategy?: FollowWebPlannedRouteOptions['strategy'];
  carNumber?: FollowWebPlannedRouteOptions['carNumber'];
  restriction?: FollowWebPlannedRouteOptions['restriction'];
  waypoints?: NaviPoint[];
}): Promise<IndependentRouteResult> {
  return ExpoGaodeMapNavigationModule.independentDriveRoute(options);
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

  // 第一步：从 Web 线路提取少量锚点，让原生独立算路先尽量往这条线靠。
  const anchorWaypoints = buildAnchorWaypointsFromWebRoute(options);
  const anchoredIndependentResult = await runIndependentDriveRoute({
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

  // 如果锚点路线已经足够接近，再尝试去掉锚点重算一次。
  // 这样可以避免“为了贴线而被锚点拖偏”的情况。
  if (evaluation.bestMatch && evaluation.mode !== 'preview_only' && anchorWaypoints.length > 0) {
    try {
      const directIndependentResult = await runIndependentDriveRoute({
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
        // 直连结果更自然，就切到直连结果，并清掉刚才的锚点算路缓存。
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
        // 直连结果不如锚点方案，就保留锚点方案作为最终导航依据。
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
    // 只有当评估结果足够接近时才真正启动导航，避免把偏差过大的结果直接交给导航 SDK。
    navigationStarted = await ExpoGaodeMapNavigationModule.startNaviWithIndependentPath({
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
