import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapView,
  Marker,
  Polyline,
  type LatLng,
  type MapViewRef,
} from 'expo-gaode-map';
import {
  DrivingStrategy,
  GaodeAPIError,
  GaodeWebAPI,
  type POIInfo,
  type Path,
} from 'expo-gaode-map-web-api';

import {
  EXAMPLE_DEEPSEEK_API_KEY,
  EXAMPLE_WEB_API_KEY,
} from './exampleConfig';
import {
  clearAIRouteSheetSnapshot,
  formatAIRouteCost,
  formatAIRouteDistance,
  formatAIRouteRating,
  setAIRouteSheetSnapshot,
  subscribeAIRouteSheetCommand,
  type AIRouteCandidate,
  type AIRouteIntent,
  type AINamedCoordinate,
  type AIPlannedRoute,
  type AIIntentSource,
} from './aiRouteSheetState';

type IntentSource = AIIntentSource;
type SearchPhase = 'idle' | 'planning' | 'searching' | 'ranking' | 'done' | 'empty' | 'error';

type RouteIntent = AIRouteIntent;

type NamedCoordinate = AINamedCoordinate;

type PlannedRoute = AIPlannedRoute;

type RouteCandidate = AIRouteCandidate & { poi: POIInfo };

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type AIIntentResult = {
  originText?: string;
  destinationText?: string;
  primaryKeywords?: string[];
  secondaryKeywords?: string[];
  routePreference?: string;
  searchRadius?: number;
  reason?: string;
  tags?: string[];
};

type AIRankingResult = {
  summary?: string;
  picks?: Array<{
    id?: string;
    score?: number;
    reason?: string;
  }>;
};

const DEFAULT_CENTER: LatLng = { latitude: 39.989643, longitude: 116.481028 };
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MAX_CANDIDATES = 18;
const DEFAULT_CITY = '北京';

const QUERY_PRESETS = [
  '从望京SOHO去首都机场，沿途找不太绕路的充电站，最好旁边有咖啡',
  '从中关村去北京南站，路上找方便停车又适合开会的咖啡',
  '从国贸去奥森，沿途找适合休息散步的地方',
];

const ANALYSIS_PARTICLES = [
  { id: 'p1', fromX: 7, toX: 72, fromY: 18, toY: 28, size: 5, delay: 0, duration: 1900, color: '#7dd3fc' },
  { id: 'p2', fromX: 16, toX: 76, fromY: 62, toY: 18, size: 4, delay: 260, duration: 2300, color: '#c4b5fd' },
  { id: 'p3', fromX: 68, toX: 12, fromY: 14, toY: 58, size: 6, delay: 420, duration: 2100, color: '#f0abfc' },
  { id: 'p4', fromX: 76, toX: 18, fromY: 52, toY: 22, size: 4, delay: 680, duration: 2400, color: '#bfdbfe' },
  { id: 'p5', fromX: 28, toX: 78, fromY: 10, toY: 64, size: 3, delay: 880, duration: 2000, color: '#a7f3d0' },
  { id: 'p6', fromX: 80, toX: 36, fromY: 30, toY: 62, size: 5, delay: 1040, duration: 2200, color: '#fde68a' },
  { id: 'p7', fromX: 14, toX: 66, fromY: 34, toY: 8, size: 3, delay: 1260, duration: 1850, color: '#e0f2fe' },
  { id: 'p8', fromX: 46, toX: 82, fromY: 68, toY: 34, size: 4, delay: 1480, duration: 2150, color: '#ddd6fe' },
] as const;

const KEYWORD_RULES: Array<{
  test: RegExp;
  primary: string[];
  secondary?: string[];
  tags: string[];
}> = [
  {
    test: /充电|充电桩|补能/,
    primary: ['充电站', '充电桩'],
    secondary: ['咖啡', '便利店', '停车场'],
    tags: ['补能', '少绕路'],
  },
  {
    test: /咖啡|拿铁|美式|开会|商务|聊天/,
    primary: ['咖啡', '咖啡厅'],
    secondary: ['停车场', '商务楼'],
    tags: ['咖啡', '会面'],
  },
  {
    test: /停车|停车场|车位/,
    primary: ['停车场'],
    secondary: ['咖啡', '餐厅'],
    tags: ['停车'],
  },
  {
    test: /厕所|卫生间|洗手间/,
    primary: ['公共厕所', '厕所'],
    secondary: ['服务区', '便利店'],
    tags: ['休息'],
  },
  {
    test: /服务区|休息区|加油/,
    primary: ['服务区', '加油站'],
    secondary: ['充电站', '餐厅'],
    tags: ['途中休息'],
  },
  {
    test: /公园|散步|休息|夜景|拍照|景点/,
    primary: ['公园', '景点', '广场'],
    secondary: ['咖啡', '停车场'],
    tags: ['休闲'],
  },
  {
    test: /餐厅|吃饭|美食|火锅|午饭|晚饭/,
    primary: ['餐厅', '美食'],
    secondary: ['停车场', '商场'],
    tags: ['餐饮'],
  },
];

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );
}

function clampRadius(radius?: number) {
  if (!radius || !Number.isFinite(radius)) {
    return 1600;
  }
  return Math.max(500, Math.min(5000, Math.round(radius)));
}

function parseRadius(query: string) {
  const kmMatch = query.match(/(\d+(?:\.\d+)?)\s*(公里|千米|km)/i);
  if (kmMatch) {
    return clampRadius(Number(kmMatch[1]) * 1000);
  }

  const meterMatch = query.match(/(\d+)\s*(米|m)/i);
  if (meterMatch) {
    return clampRadius(Number(meterMatch[1]));
  }

  if (/不太绕|少绕|顺路|沿途|路上/.test(query)) {
    return 1200;
  }

  return 1600;
}

function parseOriginDestination(query: string) {
  const normalized = query.replace(/\s+/g, '');
  const match = normalized.match(/从(.+?)(?:去|到|前往|开车到)(.+?)(?:，|,|。|；|;|$)/);

  if (match?.[1] && match?.[2]) {
    return {
      originText: match[1],
      destinationText: match[2],
    };
  }

  return {
    originText: '望京SOHO',
    destinationText: '首都机场',
  };
}

function buildKeywordPlan(query: string) {
  if (/充电|充电桩|补能/.test(query)) {
    return {
      primaryKeywords: ['充电站', '充电桩'],
      secondaryKeywords: uniqueStrings([
        /咖啡|开会|商务/.test(query) ? '咖啡' : undefined,
        '便利店',
        '停车场',
      ]),
    };
  }

  if (/咖啡|拿铁|美式|开会|商务|聊天/.test(query)) {
    return {
      primaryKeywords: ['咖啡', '咖啡厅'],
      secondaryKeywords: uniqueStrings([
        /停车|车位/.test(query) ? '停车场' : undefined,
        '商务楼',
      ]),
    };
  }

  if (/停车|停车场|车位/.test(query)) {
    return {
      primaryKeywords: ['停车场'],
      secondaryKeywords: uniqueStrings([
        /咖啡|开会|商务/.test(query) ? '咖啡' : undefined,
        /餐厅|吃饭|美食/.test(query) ? '餐厅' : undefined,
      ]),
    };
  }

  const matchedRules = KEYWORD_RULES.filter((rule) => rule.test.test(query));
  return {
    primaryKeywords: uniqueStrings(
      matchedRules.length
        ? matchedRules.flatMap((rule) => rule.primary)
        : ['充电站', '咖啡']
    ),
    secondaryKeywords: uniqueStrings(matchedRules.flatMap((rule) => rule.secondary || [])),
  };
}

function buildLocalIntent(query: string): RouteIntent {
  const route = parseOriginDestination(query);
  const matchedRules = KEYWORD_RULES.filter((rule) => rule.test.test(query));
  const keywordPlan = buildKeywordPlan(query);
  const tags = uniqueStrings([
    ...matchedRules.flatMap((rule) => rule.tags),
    /不太绕|少绕|顺路|沿途|路上/.test(query) ? '沿途' : undefined,
    /安静|人少|不吵/.test(query) ? '安静' : undefined,
    /商务|开会|聊天/.test(query) ? '商务' : undefined,
  ]).slice(0, 4);

  return {
    ...route,
    primaryKeywords: keywordPlan.primaryKeywords.slice(0, 3),
    secondaryKeywords: keywordPlan.secondaryKeywords.slice(0, 3),
    routePreference: /不走高速/.test(query)
      ? '不走高速'
      : /少收费|便宜/.test(query)
        ? '少收费'
        : '少绕路，兼顾时间',
    searchRadius: parseRadius(query),
    reason: `从 ${route.originText} 到 ${route.destinationText}，沿路线寻找 ${keywordPlan.primaryKeywords.slice(0, 2).join('、')}`,
    tags,
    source: '本地',
  };
}

function normalizeAIIntent(ai: AIIntentResult, query: string): RouteIntent {
  const localIntent = buildLocalIntent(query);
  const aiPrimaryKeywords = uniqueStrings(ai.primaryKeywords || []);
  const aiSecondaryKeywords = uniqueStrings(ai.secondaryKeywords || []);

  return {
    originText: ai.originText?.trim() || localIntent.originText,
    destinationText: ai.destinationText?.trim() || localIntent.destinationText,
    primaryKeywords: (
      aiPrimaryKeywords.length ? aiPrimaryKeywords : localIntent.primaryKeywords
    ).slice(0, 3),
    secondaryKeywords: uniqueStrings([
      ...aiSecondaryKeywords,
      ...localIntent.secondaryKeywords,
    ]).slice(0, 3),
    routePreference: ai.routePreference?.trim() || localIntent.routePreference,
    searchRadius: clampRadius(ai.searchRadius || localIntent.searchRadius),
    reason: ai.reason?.trim() || localIntent.reason,
    tags: uniqueStrings([...(ai.tags || []), ...localIntent.tags]).slice(0, 4),
    source: 'AI',
  };
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith('{')) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  return trimmed;
}

async function callDeepSeekJSON<T>(
  systemPrompt: string,
  userPayload: unknown,
  signal: AbortSignal
): Promise<T> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${EXAMPLE_DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content:
            typeof userPayload === 'string'
              ? userPayload
              : JSON.stringify(userPayload),
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as DeepSeekResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || `AI 请求失败：HTTP ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI 没有返回 JSON 内容');
  }

  return JSON.parse(extractJsonObject(content)) as T;
}

async function getRouteIntent(query: string): Promise<RouteIntent> {
  if (!EXAMPLE_DEEPSEEK_API_KEY) {
    return buildLocalIntent(query);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const result = await callDeepSeekJSON<AIIntentResult>(
      [
        '你是地图行程意图解析器，只返回 JSON。',
        '字段：originText、destinationText、primaryKeywords、secondaryKeywords、routePreference、searchRadius、tags、reason。',
        'primaryKeywords 必须是高德可搜索的短关键词，例如“充电站”“咖啡”“停车场”。',
        'secondaryKeywords 是配套需求，例如“咖啡”“便利店”“停车场”。',
        '不要返回不存在的地点，不要编坐标。',
      ].join('\n'),
      query,
      controller.signal
    );
    return normalizeAIIntent(result, query);
  } catch (error) {
    console.warn('AI 行程解析失败，已切换本地解析:', error);
    return {
      ...buildLocalIntent(query),
      reason: 'AI 解析未完成，已使用本地规则继续规划',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatCoordinate(coord: LatLng) {
  return `${coord.longitude},${coord.latitude}`;
}

function formatRadius(radius: number) {
  if (radius >= 1000) {
    return `${Number((radius / 1000).toFixed(1))} km`;
  }
  return `${radius} m`;
}

function formatDistance(distance: number) {
  if (!Number.isFinite(distance) || distance <= 0) {
    return '未知';
  }
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distance)} m`;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '时间未知';
  }
  const minutes = Math.round(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }
  return `${minutes} min`;
}

function formatCost(cost?: string) {
  const value = Number(cost);
  if (!Number.isFinite(value) || value <= 0) {
    return cost ? `人均 ${cost}` : undefined;
  }
  return `人均 ${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}`;
}

function formatRating(rating?: string) {
  const value = Number(rating);
  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return `${value.toFixed(1)} 分`;
}

function parsePoiCoordinate(location: string): LatLng | null {
  const [longitude, latitude] = location.split(',').map(Number);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return { latitude, longitude };
}

function parsePolyline(polyline?: string): LatLng[] {
  if (!polyline) {
    return [];
  }

  return polyline
    .split(';')
    .map((pair) => {
      const [longitude, latitude] = pair.split(',').map(Number);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }
      return { latitude, longitude };
    })
    .filter((point): point is LatLng => Boolean(point));
}

function extractPathPoints(path: Path, origin: LatLng, destination: LatLng) {
  const points = path.steps.flatMap((step) => parsePolyline(step.polyline));
  const deduped = dedupeAdjacentPoints(points);
  return deduped.length > 1 ? deduped : [origin, destination];
}

function dedupeAdjacentPoints(points: LatLng[]) {
  const result: LatLng[] = [];
  points.forEach((point) => {
    const previous = result[result.length - 1];
    if (
      !previous ||
      Math.abs(previous.latitude - point.latitude) > 0.000001 ||
      Math.abs(previous.longitude - point.longitude) > 0.000001
    ) {
      result.push(point);
    }
  });
  return result;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(a: LatLng, b: LatLng) {
  const earthRadius = 6371000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const value = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function projectToSegment(point: LatLng, start: LatLng, end: LatLng) {
  const refLat = toRadians((point.latitude + start.latitude + end.latitude) / 3);
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon = 111320 * Math.cos(refLat);
  const px = (point.longitude - start.longitude) * metersPerDegreeLon;
  const py = (point.latitude - start.latitude) * metersPerDegreeLat;
  const ex = (end.longitude - start.longitude) * metersPerDegreeLon;
  const ey = (end.latitude - start.latitude) * metersPerDegreeLat;
  const lengthSq = ex * ex + ey * ey;
  const t = lengthSq > 0 ? Math.max(0, Math.min(1, (px * ex + py * ey) / lengthSq)) : 0;
  const dx = px - ex * t;
  const dy = py - ey * t;

  return {
    distance: Math.sqrt(dx * dx + dy * dy),
    ratio: t,
  };
}

function getRoutePosition(point: LatLng, routePoints: LatLng[]) {
  if (routePoints.length < 2) {
    return {
      routeOffsetMeters: 0,
      alongMeters: 0,
    };
  }

  let bestOffset = Number.POSITIVE_INFINITY;
  let bestAlong = 0;
  let covered = 0;

  for (let index = 0; index < routePoints.length - 1; index += 1) {
    const start = routePoints[index];
    const end = routePoints[index + 1];
    const segmentLength = distanceMeters(start, end);
    const projected = projectToSegment(point, start, end);
    if (projected.distance < bestOffset) {
      bestOffset = projected.distance;
      bestAlong = covered + segmentLength * projected.ratio;
    }
    covered += segmentLength;
  }

  return {
    routeOffsetMeters: bestOffset,
    alongMeters: bestAlong,
  };
}

function interpolatePoint(start: LatLng, end: LatLng, ratio: number): LatLng {
  return {
    latitude: start.latitude + (end.latitude - start.latitude) * ratio,
    longitude: start.longitude + (end.longitude - start.longitude) * ratio,
  };
}

function sampleRoutePoints(points: LatLng[], count = 5) {
  if (points.length <= 2) {
    return points;
  }

  const segmentLengths: number[] = [];
  let total = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const length = distanceMeters(points[index], points[index + 1]);
    segmentLengths.push(length);
    total += length;
  }

  if (total <= 0) {
    return points.slice(0, count);
  }

  const targets = Array.from({ length: count }, (_, index) => total * ((index + 1) / (count + 1)));
  const samples: LatLng[] = [];
  let segmentStartDistance = 0;
  let targetIndex = 0;

  for (let index = 0; index < segmentLengths.length && targetIndex < targets.length; index += 1) {
    const segmentLength = segmentLengths[index];
    const segmentEndDistance = segmentStartDistance + segmentLength;

    while (targetIndex < targets.length && targets[targetIndex] <= segmentEndDistance) {
      const ratio = segmentLength > 0 ? (targets[targetIndex] - segmentStartDistance) / segmentLength : 0;
      samples.push(interpolatePoint(points[index], points[index + 1], ratio));
      targetIndex += 1;
    }

    segmentStartDistance = segmentEndDistance;
  }

  return samples.length ? samples : points.slice(1, -1).slice(0, count);
}

function scoreCandidate(candidate: Omit<RouteCandidate, 'score' | 'reason'>) {
  const rating = Number(candidate.rating);
  const routeScore = Math.max(0, 55 - candidate.routeOffsetMeters / 45);
  const alongScore = candidate.alongMeters > 1000 ? 12 : 4;
  const roleScore = candidate.role === 'primary' ? 24 : 8;
  const ratingScore = Number.isFinite(rating) ? rating * 4 : 0;
  const amenityScore = Math.min(candidate.nearbyAmenities.length * 8, 18);
  return Math.round(routeScore + alongScore + roleScore + ratingScore + amenityScore);
}

function buildLocalReason(candidate: RouteCandidate, intent: RouteIntent) {
  const parts = [
    `距主路线约 ${formatDistance(candidate.routeOffsetMeters)}`,
    `位于行程 ${formatDistance(candidate.alongMeters)} 处`,
  ];

  if (candidate.nearbyAmenities.length) {
    parts.push(`附近有 ${candidate.nearbyAmenities.slice(0, 2).join('、')}`);
  }

  const rating = formatRating(candidate.rating);
  if (rating) {
    parts.push(rating);
  }

  if (/少收费|不走高速|少绕/.test(intent.routePreference)) {
    parts.push(intent.routePreference);
  }

  return parts.join(' · ');
}

function dedupeCandidates(candidates: RouteCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = candidate.poi.id || `${candidate.name}-${candidate.coordinate.longitude}-${candidate.coordinate.latitude}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function enrichCandidates(
  rawCandidates: Array<Omit<RouteCandidate, 'nearbyAmenities' | 'score' | 'reason'>>,
  routePoints: LatLng[],
  intent: RouteIntent
) {
  const dedupedBase = dedupeCandidates(
    rawCandidates.map((candidate) => ({
      ...candidate,
      nearbyAmenities: [],
      score: 0,
      reason: '',
    }))
  );
  const amenities = dedupedBase.filter((candidate) => candidate.role === 'amenity');

  return dedupedBase
    .map((candidate) => {
      const nearbyAmenities = amenities
        .filter((amenity) => amenity.id !== candidate.id)
        .filter((amenity) => distanceMeters(candidate.coordinate, amenity.coordinate) <= 650)
        .sort((a, b) => distanceMeters(candidate.coordinate, a.coordinate) - distanceMeters(candidate.coordinate, b.coordinate))
        .slice(0, 3)
        .map((amenity) => amenity.name);
      const routePosition = getRoutePosition(candidate.coordinate, routePoints);
      const enriched: RouteCandidate = {
        ...candidate,
        ...routePosition,
        nearbyAmenities,
        score: 0,
        reason: '',
      };
      enriched.score = scoreCandidate(enriched);
      enriched.reason = buildLocalReason(enriched, intent);
      return enriched;
    })
    .sort((a, b) => b.score - a.score);
}

function getErrorMessage(error: unknown) {
  if (error instanceof GaodeAPIError) {
    return error.getUserMessage();
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '请求失败';
}

async function geocodePlace(api: GaodeWebAPI, text: string): Promise<NamedCoordinate> {
  const response = await api.geocode.geocode(text, DEFAULT_CITY);
  const place = response.geocodes?.[0];
  const coordinate = place ? parsePoiCoordinate(place.location) : null;

  if (!place || !coordinate) {
    throw new Error(`没有找到地点：${text}`);
  }

  return {
    text,
    address: place.formatted_address || text,
    coordinate,
  };
}

async function planRoute(api: GaodeWebAPI, intent: RouteIntent): Promise<PlannedRoute> {
  const [origin, destination] = await Promise.all([
    geocodePlace(api, intent.originText),
    geocodePlace(api, intent.destinationText),
  ]);

  const strategy = intent.routePreference.includes('不走高速')
    ? DrivingStrategy.NO_HIGHWAY
    : intent.routePreference.includes('少收费')
      ? DrivingStrategy.LESS_TOLL
      : DrivingStrategy.DEFAULT;

  const response = await api.route.driving(
    {
      longitude: origin.coordinate.longitude,
      latitude: origin.coordinate.latitude,
    },
    {
      longitude: destination.coordinate.longitude,
      latitude: destination.coordinate.latitude,
    },
    {
      strategy,
      show_fields: 'cost,navi,polyline,tmcs',
    }
  );

  const path = response.route?.paths?.[0];
  if (!path) {
    throw new Error('没有规划出可用路线');
  }

  const routePoints = extractPathPoints(path, origin.coordinate, destination.coordinate);
  const distanceValue = Number(path.distance);
  const durationValue = Number(path.cost?.duration || path.duration);

  return {
    origin,
    destination,
    points: routePoints,
    distanceMeters: Number.isFinite(distanceValue) ? distanceValue : 0,
    durationSeconds: Number.isFinite(durationValue) ? durationValue : 0,
    tolls: path.cost?.tolls || path.tolls,
    trafficLights: path.cost?.traffic_lights || path.traffic_lights,
    summary: `${formatDistance(distanceValue)} · ${formatDuration(durationValue)}`,
  };
}

async function collectCandidates(
  api: GaodeWebAPI,
  route: PlannedRoute,
  intent: RouteIntent,
  onProgress: (message: string) => void
) {
  const samplePoints = sampleRoutePoints(route.points, 5);
  const primaryKeywords = intent.primaryKeywords.slice(0, 3);
  const secondaryKeywords = intent.secondaryKeywords.slice(0, 2);
  const keywords = [
    ...primaryKeywords.map((keyword) => ({ keyword, role: 'primary' as const })),
    ...secondaryKeywords.map((keyword) => ({ keyword, role: 'amenity' as const })),
  ];
  const rawCandidates: Array<Omit<RouteCandidate, 'nearbyAmenities' | 'score' | 'reason'>> = [];

  for (const [sampleIndex, sample] of samplePoints.entries()) {
    for (const item of keywords) {
      onProgress(`沿途第 ${sampleIndex + 1} 段搜索 ${item.keyword}`);

      try {
        const response = await api.poi.searchAround(
          {
            longitude: sample.longitude,
            latitude: sample.latitude,
          },
          {
            keywords: item.keyword,
            radius: intent.searchRadius,
            sortrule: 'distance',
            page_size: 8,
            show_fields: 'business,navi,photos',
          }
        );

        response.pois.forEach((poi, index) => {
          const coordinate = parsePoiCoordinate(poi.location);
          if (!coordinate) {
            return;
          }

          const routePosition = getRoutePosition(coordinate, route.points);
          rawCandidates.push({
            id: poi.id || `${item.keyword}-${sampleIndex}-${index}`,
            coordinate,
            name: poi.name,
            address: poi.address || `${poi.pname || ''}${poi.cityname || ''}${poi.adname || ''}`,
            type: poi.type || 'POI',
            role: item.role,
            sourceKeyword: item.keyword,
            routeOffsetMeters: routePosition.routeOffsetMeters,
            alongMeters: routePosition.alongMeters,
            sampleDistance: poi.distance,
            rating: poi.business?.rating,
            cost: poi.business?.cost,
            tel: poi.business?.tel,
            poi,
          });
        });
      } catch (error) {
        console.warn(`沿途搜索失败：${item.keyword}`, error);
      }
    }
  }

  return enrichCandidates(rawCandidates, route.points, intent)
    .filter((candidate) => candidate.role === 'primary' || !primaryKeywords.length)
    .slice(0, MAX_CANDIDATES);
}

function buildLocalSummary(intent: RouteIntent, route: PlannedRoute, candidates: RouteCandidate[]) {
  const top = candidates[0];
  if (!top) {
    return `已规划 ${route.origin.text} 到 ${route.destination.text}，但沿途没有找到合适候选。`;
  }

  const mode = intent.source === 'AI' ? 'AI 解析' : '本地评分';
  return `${mode}：优先推荐 ${top.name}，它距离主路线约 ${formatDistance(top.routeOffsetMeters)}，${top.nearbyAmenities.length ? `附近还有 ${top.nearbyAmenities[0]}` : '综合顺路程度较高'}。`;
}

async function rankCandidatesWithAI(
  query: string,
  intent: RouteIntent,
  route: PlannedRoute,
  candidates: RouteCandidate[]
) {
  if (!EXAMPLE_DEEPSEEK_API_KEY || candidates.length === 0) {
    return {
      summary: buildLocalSummary(intent, route, candidates),
      candidates,
      source: '本地' as const,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const aiResult = await callDeepSeekJSON<AIRankingResult>(
      [
        '你是地图路线推荐助手，只返回 JSON。',
        '你只能从候选 candidates 的 id 中选择，不允许编造新地点、坐标、评分或营业信息。',
        '返回字段：summary 一句话；picks 数组，每项包含 id、score、reason。',
        'reason 必须引用候选数据里的事实，例如距离路线、评分、配套点、类型。',
      ].join('\n'),
      {
        query,
        intent,
        route: {
          origin: route.origin.text,
          destination: route.destination.text,
          distanceMeters: route.distanceMeters,
          durationSeconds: route.durationSeconds,
          tolls: route.tolls,
          trafficLights: route.trafficLights,
        },
        candidates: candidates.slice(0, 12).map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          type: candidate.type,
          address: candidate.address,
          sourceKeyword: candidate.sourceKeyword,
          routeOffsetMeters: Math.round(candidate.routeOffsetMeters),
          alongMeters: Math.round(candidate.alongMeters),
          rating: candidate.rating,
          cost: candidate.cost,
          nearbyAmenities: candidate.nearbyAmenities,
          localScore: candidate.score,
        })),
      },
      controller.signal
    );

    const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
    const rankedIds = (aiResult.picks || [])
      .map((pick) => pick.id)
      .filter((id): id is string => Boolean(id && byId.has(id)));
    const ranked = rankedIds.map((id) => {
      const candidate = byId.get(id)!;
      const pick = aiResult.picks?.find((item) => item.id === id);
      return {
        ...candidate,
        score: Math.max(candidate.score, Math.round(pick?.score || candidate.score)),
        aiReason: pick?.reason,
      };
    });
    const rest = candidates.filter((candidate) => !rankedIds.includes(candidate.id));

    return {
      summary: aiResult.summary || buildLocalSummary(intent, route, candidates),
      candidates: [...ranked, ...rest].slice(0, MAX_CANDIDATES),
      source: ranked.length ? 'AI' as const : '本地' as const,
    };
  } catch (error) {
    console.warn('AI 推荐排序失败，已使用本地评分:', error);
    return {
      summary: buildLocalSummary(intent, route, candidates),
      candidates,
      source: '本地' as const,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function ResultMetaChip({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'accent' }) {
  return (
    <View style={[styles.resultMetaChip, tone === 'accent' && styles.resultMetaChipAccent]}>
      <Text style={[styles.resultMetaChipText, tone === 'accent' && styles.resultMetaChipTextAccent]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

function getAnalysisSteps(phase: SearchPhase, status: string, intent: RouteIntent | null, candidates: RouteCandidate[]) {
  const steps = [
    {
      key: 'intent',
      title: '理解自然语言',
      detail: intent
        ? `${intent.originText} → ${intent.destinationText} · ${intent.primaryKeywords.slice(0, 2).join('、')}`
        : '提取起终点、偏好和沿途需求',
      active: phase === 'planning',
      done: Boolean(intent) || phase === 'searching' || phase === 'ranking' || phase === 'done',
    },
    {
      key: 'route',
      title: '规划路线骨架',
      detail: intent ? `${intent.routePreference} · 半径 ${formatRadius(intent.searchRadius)}` : '生成可搜索的路线走廊',
      active: phase === 'planning' && Boolean(intent),
      done: phase === 'searching' || phase === 'ranking' || phase === 'done',
    },
    {
      key: 'scan',
      title: '沿途扫描 POI',
      detail: phase === 'searching' ? status : candidates.length ? `已收集 ${candidates.length} 个候选` : '按路线采样点检索候选',
      active: phase === 'searching',
      done: phase === 'ranking' || phase === 'done',
    },
    {
      key: 'rank',
      title: EXAMPLE_DEEPSEEK_API_KEY ? 'AI 排序解释' : '本地评分解释',
      detail: phase === 'ranking'
        ? '融合绕路距离、评分、配套和偏好'
        : candidates.length
          ? `完成 ${candidates.length} 个候选排序`
          : '生成可解释推荐理由',
      active: phase === 'ranking',
      done: phase === 'done',
    },
  ];

  return steps;
}

function getAnalysisProgress(phase: SearchPhase) {
  if (phase === 'planning') return 0.28;
  if (phase === 'searching') return 0.58;
  if (phase === 'ranking') return 0.82;
  if (phase === 'done') return 1;
  return 0.12;
}

function AIParticleField({ active }: { active: boolean }) {
  const pulse = React.useRef(new Animated.Value(0)).current;
  const particleValues = React.useRef(
    ANALYSIS_PARTICLES.map(() => new Animated.Value(0))
  ).current;

  React.useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      particleValues.forEach((value) => value.stopAnimation());
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const particleLoops = particleValues.map((value, index) => {
      const particle = ANALYSIS_PARTICLES[index];
      value.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(particle.delay),
          Animated.timing(value, {
            toValue: 1,
            duration: particle.duration,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 1,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
    });

    pulseLoop.start();
    particleLoops.forEach((loop) => loop.start());

    return () => {
      pulseLoop.stop();
      particleLoops.forEach((loop) => loop.stop());
    };
  }, [active, particleValues, pulse]);

  const coreScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.32, 0.76],
  });

  return (
    <View style={styles.particleStage} pointerEvents="none">
      <Animated.View
        style={[
          styles.aiHalo,
          {
            opacity: haloOpacity,
            transform: [{ scale: coreScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.aiCore,
          {
            transform: [{ scale: coreScale }],
          },
        ]}
      >
        <Text style={styles.aiCoreText}>AI</Text>
      </Animated.View>

      {ANALYSIS_PARTICLES.map((particle, index) => {
        const progress = particleValues[index];
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [particle.fromX, particle.toX],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [particle.fromY, (particle.fromY + particle.toY) / 2 - 18, particle.toY],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.14, 0.76, 1],
          outputRange: [0, 1, 1, 0],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: [0.72, 1.25, 0.78],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particleDot,
              {
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                backgroundColor: particle.color,
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function AnalysisStepRow({
  title,
  detail,
  active,
  done,
  index,
}: {
  title: string;
  detail: string;
  active: boolean;
  done: boolean;
  index: number;
}) {
  return (
    <View style={styles.analysisStepRow}>
      <View style={[styles.stepNode, done && styles.stepNodeDone, active && styles.stepNodeActive]}>
        <Text style={[styles.stepNodeText, (done || active) && styles.stepNodeTextActive]}>
          {done ? '✓' : index + 1}
        </Text>
      </View>
      <View style={styles.stepCopy}>
        <Text style={[styles.stepTitle, active && styles.stepTitleActive]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.stepDetail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
    </View>
  );
}

function AIAnalysisPanel({
  phase,
  status,
  intent,
  candidates,
}: {
  phase: SearchPhase;
  status: string;
  intent: RouteIntent | null;
  candidates: RouteCandidate[];
}) {
  const steps = getAnalysisSteps(phase, status, intent, candidates);
  const progress = getAnalysisProgress(phase);
  const stageTitle = phase === 'planning'
    ? '正在理解你的行程'
    : phase === 'searching'
      ? '正在沿路线扫描'
      : phase === 'ranking'
        ? EXAMPLE_DEEPSEEK_API_KEY ? '正在生成 AI 推荐' : '正在计算推荐排序'
        : '正在准备结果';

  return (
    <View style={styles.analysisPanel}>
      <View style={styles.analysisHeader}>
        <AIParticleField active />
        <View style={styles.analysisHeaderCopy}>
          <Text style={styles.analysisEyebrow}>AI MAP REASONING</Text>
          <Text style={styles.analysisTitle}>{stageTitle}</Text>
          <Text style={styles.analysisStatus} numberOfLines={1}>
            {status}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      <View style={styles.analysisSteps}>
        {steps.map((step, index) => (
          <AnalysisStepRow
            key={step.key}
            title={step.title}
            detail={step.detail}
            active={step.active}
            done={step.done}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

const CandidateMarker = React.memo(function CandidateMarker({
  candidate,
  index,
  selected,
  onSelect,
}: {
  candidate: RouteCandidate;
  index: number;
  selected: boolean;
  onSelect: (candidate: RouteCandidate) => void;
}) {
  const handlePress = React.useCallback(() => {
    onSelect(candidate);
  }, [candidate, onSelect]);

  return (
    <Marker
      position={candidate.coordinate}
      title={`${index + 1}. ${candidate.name}`}
      snippet={`${formatDistance(candidate.routeOffsetMeters)} 离主路线 · ${candidate.address || candidate.type}`}
      pinColor={selected ? 'orange' : 'blue'}
      zIndex={selected ? 40 : 20}
      onMarkerPress={handlePress}
    />
  );
});

function SearchOverlay({
  query,
  setQuery,
  phase,
  status,
  intent,
  route,
  summary,
  recommendationSource,
  candidates,
  selectedCandidate,
  onSearch,
  onPreset,
  onClear,
  onSelectCandidate,
  onOpenSheet,
  onBack,
  topInset,
  bottomInset,
}: {
  query: string;
  setQuery: (query: string) => void;
  phase: SearchPhase;
  status: string;
  intent: RouteIntent | null;
  route: PlannedRoute | null;
  summary: string;
  recommendationSource: IntentSource;
  candidates: RouteCandidate[];
  selectedCandidate: RouteCandidate | null;
  onSearch: () => void;
  onPreset: (preset: string) => void;
  onClear: () => void;
  onSelectCandidate: (candidate: RouteCandidate) => void;
  onOpenSheet: () => void;
  onBack: () => void;
  topInset: number;
  bottomInset: number;
}) {
  const busy = phase === 'planning' || phase === 'searching' || phase === 'ranking';
  const modeText = EXAMPLE_DEEPSEEK_API_KEY ? 'AI 推荐' : '本地评分';
  const hasResult = Boolean(route || candidates.length || phase === 'empty' || phase === 'error');
  const showResultsPanel = hasResult && !busy;
  const topCandidates = candidates.slice(0, 1);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={[styles.searchPanel, hasResult && styles.searchPanelCompact, { top: topInset + 8 }]}>
        {!hasResult ? (
          <View style={styles.headerRow}>
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>{'<'}</Text>
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>AI 沿途推荐</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {modeText}
              </Text>
            </View>
            <View style={[styles.statusPill, phase === 'error' && styles.errorPill]}>
              <Text style={[styles.statusPillText, phase === 'error' && styles.errorPillText]} numberOfLines={1}>
                {phase === 'idle' ? modeText : status}
              </Text>
            </View>
          </View>
        ) : null}

        {hasResult ? (
          <View style={styles.compactStatusRow}>
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>{'<'}</Text>
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.compactTitle} numberOfLines={1}>
                {route ? `${route.origin.text} → ${route.destination.text}` : 'AI 沿途推荐'}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {route
                  ? `${route.summary}${route.tolls ? ` · 过路费 ${route.tolls}` : ''}`
                  : status}
              </Text>
            </View>
            <View style={[styles.statusPill, phase === 'error' && styles.errorPill]}>
              <Text style={[styles.statusPillText, phase === 'error' && styles.errorPillText]} numberOfLines={1}>
                {phase === 'done' ? `${candidates.length} 个候选` : status}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="从 A 去 B，沿途找..."
            placeholderTextColor="#667085"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={onSearch}
            editable={!busy}
            numberOfLines={1}
          />
          <Pressable
            onPress={onSearch}
            disabled={busy}
            style={({ pressed }) => [
              styles.searchButton,
              busy && styles.searchButtonDisabled,
              pressed && !busy && styles.pressed,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.searchButtonText}>GO</Text>
            )}
          </Pressable>
        </View>

        {!hasResult ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetList}
          >
            {QUERY_PRESETS.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => onPreset(preset)}
                style={({ pressed }) => [styles.presetChip, pressed && styles.pressed]}
              >
                <Text style={styles.presetText}>{preset}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {!hasResult && intent ? (
          <View style={styles.intentRow}>
            <Text style={styles.intentText} numberOfLines={2}>
              {intent.reason}
            </Text>
            {intent.tags.slice(0, 3).map((tag) => (
              <Text key={tag} style={styles.intentTag}>
                {tag}
              </Text>
            ))}
          </View>
        ) : null}

        {busy ? (
          <AIAnalysisPanel
            phase={phase}
            status={status}
            intent={intent}
            candidates={candidates}
          />
        ) : null}
      </View>

      {showResultsPanel ? (
        <View style={[styles.resultsPanel, { bottom: bottomInset + 10 }]}>
          <View style={styles.resultsHeader}>
            <View style={styles.resultsHeaderCopy}>
              <Text style={styles.resultsTitle}>
                {phase === 'empty' ? '没有候选点' : candidates.length ? '沿途精选' : '行程推荐'}
              </Text>
              <Text style={styles.resultsMeta} numberOfLines={1}>
                {intent ? `${intent.source}解析 / ${recommendationSource}推荐` : status}
              </Text>
            </View>
            <Pressable onPress={onClear} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>清空</Text>
            </Pressable>
          </View>

          {summary ? (
            <Text style={styles.summaryText} numberOfLines={2}>
              {summary}
            </Text>
          ) : null}

          {phase === 'empty' || phase === 'error' ? (
            <Text style={styles.emptyText}>{status}</Text>
          ) : null}

          {topCandidates.map((candidate, index) => {
            const selected = selectedCandidate?.id === candidate.id;
            const rating = formatAIRouteRating(candidate.rating);
            const cost = formatAIRouteCost(candidate.cost);

            return (
              <Pressable
                key={candidate.id}
                onPress={() => onSelectCandidate(candidate)}
                style={({ pressed }) => [
                  styles.compactResultRow,
                  selected && styles.compactResultRowSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.resultIndex, selected && styles.resultIndexSelected]}>
                  <Text style={[styles.resultIndexText, selected && styles.resultIndexTextSelected]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.resultBody}>
                  <View style={styles.resultTitleRow}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {candidate.name}
                    </Text>
                    <Text style={styles.resultScore}>{candidate.score}</Text>
                  </View>
                  <Text style={styles.resultReason} numberOfLines={1}>
                    {candidate.aiReason || candidate.reason}
                  </Text>
                  <View style={styles.resultMetaRow}>
                    <ResultMetaChip tone="accent">{candidate.sourceKeyword}</ResultMetaChip>
                    <ResultMetaChip>偏离 {formatAIRouteDistance(candidate.routeOffsetMeters)}</ResultMetaChip>
                    {rating ? <ResultMetaChip>{rating}</ResultMetaChip> : null}
                    {cost ? <ResultMetaChip>{cost}</ResultMetaChip> : null}
                  </View>
                </View>
              </Pressable>
            );
          })}

          {candidates.length ? (
            <Pressable
              onPress={onOpenSheet}
              style={({ pressed }) => [styles.sheetButton, pressed && styles.pressed]}
            >
              <Text style={styles.sheetButtonText}>查看全部 {candidates.length} 个候选</Text>
              <Text style={styles.sheetButtonMeta}>详情 / AI 理由 / 地图聚焦</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function AISmartSearchExample() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = React.useRef<MapViewRef>(null);
  const apiRef = React.useRef<GaodeWebAPI | null>(null);
  const [query, setQuery] = React.useState(QUERY_PRESETS[0]);
  const [phase, setPhase] = React.useState<SearchPhase>('idle');
  const [status, setStatus] = React.useState('输入行程需求');
  const [intent, setIntent] = React.useState<RouteIntent | null>(null);
  const [route, setRoute] = React.useState<PlannedRoute | null>(null);
  const [summary, setSummary] = React.useState('');
  const [recommendationSource, setRecommendationSource] = React.useState<IntentSource>('本地');
  const [candidates, setCandidates] = React.useState<RouteCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = React.useState<RouteCandidate | null>(null);
  const isAnalyzing = phase === 'planning' || phase === 'searching' || phase === 'ranking';

  const getApi = React.useCallback(() => {
    if (!apiRef.current) {
      apiRef.current = new GaodeWebAPI({
        key: EXAMPLE_WEB_API_KEY || undefined,
        timeout: 9000,
        maxRetries: 1,
        retryDelay: 500,
        enableCache: true,
        cacheCapacity: 120,
      });
    }
    return apiRef.current;
  }, []);

  const focusMap = React.useCallback(async (nextRoute: PlannedRoute, nextCandidates: RouteCandidate[]) => {
    const coordinates = [
      ...nextRoute.points.filter((_, index) => index % Math.max(1, Math.floor(nextRoute.points.length / 16)) === 0),
      ...nextCandidates.slice(0, 5).map((candidate) => candidate.coordinate),
    ];

    if (!coordinates.length) {
      return;
    }

    try {
      await mapRef.current?.fitToCoordinates(coordinates, {
        paddingPx: 120,
        maxZoom: 15,
        duration: 500,
      });
    } catch {
      await mapRef.current?.moveCamera(
        {
          target: nextRoute.points[0] || DEFAULT_CENTER,
          zoom: 12,
        },
        350
      );
    }
  }, []);

  React.useEffect(() => {
    setAIRouteSheetSnapshot({
      query,
      status,
      intent,
      route,
      summary,
      recommendationSource,
      candidates,
      selectedCandidateId: selectedCandidate?.id,
      updatedAt: Date.now(),
    });
  }, [candidates, intent, query, recommendationSource, route, selectedCandidate?.id, status, summary]);

  const runSearch = React.useCallback(async (queryOverride?: string) => {
    const trimmedQuery = (queryOverride ?? query).trim();

    if (!trimmedQuery) {
      setPhase('error');
      setStatus('先输入行程需求');
      return;
    }

    setPhase('planning');
    setStatus('解析行程');
    setIntent(null);
    setRoute(null);
    setSummary('');
    setRecommendationSource('本地');
    setCandidates([]);
    setSelectedCandidate(null);

    try {
      const nextIntent = await getRouteIntent(trimmedQuery);
      setIntent(nextIntent);
      setStatus('规划路线');

      const nextRoute = await planRoute(getApi(), nextIntent);
      setRoute(nextRoute);

      setPhase('searching');
      const localCandidates = await collectCandidates(getApi(), nextRoute, nextIntent, setStatus);

      if (!localCandidates.length) {
        setPhase('empty');
        setStatus(`沿途 ${formatRadius(nextIntent.searchRadius)} 内没有找到候选点`);
        setSummary(buildLocalSummary(nextIntent, nextRoute, []));
        await focusMap(nextRoute, []);
        return;
      }

      setPhase(EXAMPLE_DEEPSEEK_API_KEY ? 'ranking' : 'done');
      setStatus(EXAMPLE_DEEPSEEK_API_KEY ? 'AI 排序推荐' : '本地评分完成');
      const rankedResult = await rankCandidatesWithAI(trimmedQuery, nextIntent, nextRoute, localCandidates);

      setCandidates(rankedResult.candidates);
      setSelectedCandidate(rankedResult.candidates[0]);
      setSummary(rankedResult.summary);
      setRecommendationSource(rankedResult.source);
      setPhase('done');
      setStatus(`推荐 ${rankedResult.candidates.length} 个沿途候选`);
      await focusMap(nextRoute, rankedResult.candidates);
    } catch (error) {
      setPhase('error');
      setStatus(getErrorMessage(error));
      console.error('AI 沿途推荐失败:', error);
    }
  }, [focusMap, getApi, query]);

  const selectCandidate = React.useCallback(async (candidate: RouteCandidate) => {
    setSelectedCandidate(candidate);
    await mapRef.current?.moveCamera(
      {
        target: candidate.coordinate,
        zoom: 16,
      },
      350
    );
  }, []);

  React.useEffect(() => {
    return subscribeAIRouteSheetCommand((command) => {
      if (command.type === 'fitRoute') {
        if (route) {
          void focusMap(route, candidates);
        }
        return;
      }

      if (command.type === 'selectCandidate') {
        const candidate = candidates.find((item) => item.id === command.candidateId);
        if (candidate) {
          void selectCandidate(candidate);
        }
      }
    });
  }, [candidates, focusMap, route, selectCandidate]);

  const clearResults = React.useCallback(() => {
    setRoute(null);
    setCandidates([]);
    setSelectedCandidate(null);
    setIntent(null);
    setSummary('');
    setRecommendationSource('本地');
    setPhase('idle');
    setStatus('输入行程需求');
    clearAIRouteSheetSnapshot();
  }, []);

  const openRouteSheet = React.useCallback(() => {
    setAIRouteSheetSnapshot({
      query,
      status,
      intent,
      route,
      summary,
      recommendationSource,
      candidates,
      selectedCandidateId: selectedCandidate?.id,
      updatedAt: Date.now(),
    });
    void router.push({
      pathname: '/ai-route-sheet',
      params: {
        openToken: String(Date.now()),
      },
    });
  }, [candidates, intent, query, recommendationSource, route, router, selectedCandidate?.id, status, summary]);

  const usePreset = React.useCallback(
    (preset: string) => {
      setQuery(preset);
      void runSearch(preset);
    },
    [runSearch]
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialCameraPosition={{
          target: DEFAULT_CENTER,
          zoom: 12,
        }}
      >
        {route?.points.length ? (
          <>
            <Polyline
              points={route.points}
              strokeColor="rgba(255,255,255,0.92)"
              strokeWidth={9}
              zIndex={8}
              simplificationTolerance={5}
            />
            <Polyline
              points={route.points}
              strokeColor="#2563eb"
              strokeWidth={5}
              zIndex={9}
              simplificationTolerance={5}
            />
          </>
        ) : null}

        {route ? (
          <>
            <Marker
              position={route.origin.coordinate}
              title={`起点：${route.origin.text}`}
              snippet={route.origin.address}
              pinColor="green"
              zIndex={50}
            />
            <Marker
              position={route.destination.coordinate}
              title={`终点：${route.destination.text}`}
              snippet={route.destination.address}
              pinColor="red"
              zIndex={50}
            />
          </>
        ) : null}

        {candidates.map((candidate, index) => (
          <CandidateMarker
            key={candidate.id}
            candidate={candidate}
            index={index}
            selected={selectedCandidate?.id === candidate.id}
            onSelect={selectCandidate}
          />
        ))}
      </MapView>
      <SearchOverlay
        query={query}
        setQuery={setQuery}
        phase={phase}
        status={status}
        intent={intent}
        route={route}
        summary={summary}
        recommendationSource={recommendationSource}
        candidates={candidates}
        selectedCandidate={selectedCandidate}
        onSearch={() => {
          void runSearch();
        }}
        onPreset={usePreset}
        onClear={clearResults}
        onSelectCandidate={(candidate) => {
          void selectCandidate(candidate);
        }}
        onOpenSheet={openRouteSheet}
        onBack={() => router.back()}
        topInset={insets.top}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f4f7fb',
  },
  map: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    elevation: 2,
    pointerEvents: 'box-none',
  },
  searchPanel: {
    position: 'absolute',
    top: 14,
    left: 12,
    right: 12,
    gap: 10,
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.12)',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.14)',
  },
  searchPanelCompact: {
    gap: 8,
    padding: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  compactStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 21,
    lineHeight: 23,
    fontWeight: '800',
    marginTop: -2,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#111827',
  },
  compactTitle: {
    color: '#111827',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: '#5f6f85',
  },
  statusPill: {
    maxWidth: 136,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ecfdf3',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#b7e4c7',
  },
  statusPillText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: '#057a55',
  },
  errorPill: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  errorPillText: {
    color: '#be123c',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#111827',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d5deea',
    fontSize: 14,
    lineHeight: 18,
  },
  searchButton: {
    width: 56,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  searchButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  presetList: {
    gap: 8,
    paddingRight: 4,
  },
  presetChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eef2ff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#c7d2fe',
  },
  presetText: {
    color: '#3730a3',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  intentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  intentText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#475467',
  },
  intentTag: {
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
  },
  analysisPanel: {
    overflow: 'hidden',
    gap: 10,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#0f172a',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(191, 219, 254, 0.26)',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  particleStage: {
    width: 86,
    height: 72,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.86)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(147, 197, 253, 0.22)',
  },
  aiHalo: {
    position: 'absolute',
    left: 22,
    top: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(96, 165, 250, 0.30)',
  },
  aiCore: {
    position: 'absolute',
    left: 29,
    top: 21,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
  },
  aiCoreText: {
    color: '#2563eb',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
  },
  particleDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    boxShadow: '0 0 10px rgba(125, 211, 252, 0.75)',
  },
  analysisHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  analysisEyebrow: {
    color: '#93c5fd',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
  },
  analysisTitle: {
    marginTop: 2,
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  analysisStatus: {
    marginTop: 2,
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.22)',
  },
  progressFill: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#7dd3fc',
  },
  analysisSteps: {
    gap: 7,
  },
  analysisStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  stepNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.20)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(203, 213, 225, 0.25)',
  },
  stepNodeActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  stepNodeDone: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  stepNodeText: {
    color: '#94a3b8',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
  },
  stepNodeTextActive: {
    color: '#0f172a',
  },
  stepCopy: {
    flex: 1,
    minWidth: 0,
  },
  stepTitle: {
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  stepTitleActive: {
    color: '#ffffff',
  },
  stepDetail: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  resultsPanel: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 12,
    maxHeight: 260,
    borderRadius: 8,
    padding: 10,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.12)',
    boxShadow: '0 -8px 24px rgba(15, 23, 42, 0.13)',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  resultsHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  resultsTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: '#111827',
  },
  resultsMeta: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: '#667085',
  },
  clearButton: {
    height: 32,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  clearButtonText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  summaryText: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    color: '#334155',
    fontSize: 12,
    lineHeight: 17,
  },
  emptyText: {
    color: '#be123c',
    fontSize: 12,
    lineHeight: 17,
  },
  compactResultRow: {
    minHeight: 76,
    flexDirection: 'row',
    gap: 10,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4eaf2',
  },
  compactResultRowSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#f8fbff',
  },
  resultsList: {
    marginTop: 8,
  },
  resultsContent: {
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  resultRow: {
    minHeight: 92,
    flexDirection: 'row',
    gap: 10,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4eaf2',
  },
  resultRowSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#f8fbff',
  },
  resultIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
  },
  resultIndexSelected: {
    backgroundColor: '#2563eb',
  },
  resultIndexText: {
    color: '#0369a1',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  resultIndexTextSelected: {
    color: '#ffffff',
  },
  resultBody: {
    flex: 1,
    minWidth: 0,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultName: {
    flex: 1,
    minWidth: 0,
    color: '#111827',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  resultScore: {
    minWidth: 28,
    textAlign: 'right',
    color: '#047857',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
  resultAddress: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12,
    lineHeight: 16,
  },
  resultReason: {
    marginTop: 5,
    color: '#334155',
    fontSize: 12,
    lineHeight: 17,
  },
  resultMetaRow: {
    marginTop: 7,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  resultMetaChip: {
    maxWidth: 116,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
  },
  resultMetaChipAccent: {
    backgroundColor: '#dcfce7',
  },
  resultMetaChipText: {
    color: '#475569',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  resultMetaChipTextAccent: {
    color: '#166534',
  },
  sheetButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#0f172a',
  },
  sheetButtonText: {
    flexShrink: 0,
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  sheetButtonMeta: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.76,
  },
});
