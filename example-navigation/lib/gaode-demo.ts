import {
  ExpoGaodeMapModule,
  calculateDriveRoute,
  DriveStrategy,
  RouteType,
  type NaviPoint,
  type RouteResult,
} from "expo-gaode-map-navigation";
import { GaodeWebAPI } from "expo-gaode-map-web-api";
import { Platform } from "react-native";

import {
  EXAMPLE_ANDROID_KEY,
  EXAMPLE_IOS_KEY,
  EXAMPLE_WEB_API_KEY,
} from "@/exampleConfig";

export type DemoPoint = NaviPoint;

export interface DemoScenario {
  from: DemoPoint;
  to: DemoPoint;
  waypoints: DemoPoint[];
  avoidPolygons: DemoPoint[][];
  baselineRoute?: DemoPoint[];
  avoidAreaLabel?: string;
  avoidAreaSource?: "searched" | "fallback";
  avoidAreaLabels?: string[];
  avoidAreaSources?: Array<"searched" | "fallback">;
}

const PRIVACY_VERSION = "2026-04-18";

function roundCoord(value: number): number {
  return Number(value.toFixed(6));
}

function midpoint(a: number, b: number): number {
  return (a + b) / 2;
}

export async function ensureDemoSdkReady(): Promise<DemoPoint> {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
    privacyVersion: PRIVACY_VERSION,
  });

  ExpoGaodeMapModule.initSDK({
    ...(EXAMPLE_ANDROID_KEY ? { androidKey: EXAMPLE_ANDROID_KEY } : {}),
    ...(EXAMPLE_IOS_KEY ? { iosKey: EXAMPLE_IOS_KEY } : {}),
    ...(EXAMPLE_WEB_API_KEY ? { webKey: EXAMPLE_WEB_API_KEY } : {}),
  });

  const permission = await ExpoGaodeMapModule.requestLocationPermission();
  if (!permission.granted) {
    throw new Error("定位权限未授予");
  }

  if (Platform.OS === "ios") {
    void ExpoGaodeMapModule.requestBackgroundLocationPermission().catch(() => {});
    ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates(true);
  }

  return getCurrentDemoPoint();
}

export async function getCurrentDemoPoint(): Promise<DemoPoint> {
  const location = await ExpoGaodeMapModule.getCurrentLocation();
  return {
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export function buildDemoScenario(from: DemoPoint): DemoScenario {
  const to: DemoPoint = {
    latitude: roundCoord(from.latitude + 0.018),
    longitude: roundCoord(from.longitude + 0.028),
  };

  const via: DemoPoint = {
    latitude: roundCoord(from.latitude + 0.011),
    longitude: roundCoord(from.longitude + 0.013),
  };

  const centerLatitude = midpoint(from.latitude, to.latitude) + 0.002;
  const centerLongitude = midpoint(from.longitude, to.longitude) - 0.003;
  const latRadius = 0.0032;
  const lngRadius = 0.0046;

  const avoidPolygon: DemoPoint[] = [
    {
      latitude: roundCoord(centerLatitude - latRadius),
      longitude: roundCoord(centerLongitude - lngRadius),
    },
    {
      latitude: roundCoord(centerLatitude - latRadius),
      longitude: roundCoord(centerLongitude + lngRadius),
    },
    {
      latitude: roundCoord(centerLatitude + latRadius),
      longitude: roundCoord(centerLongitude + lngRadius),
    },
    {
      latitude: roundCoord(centerLatitude + latRadius),
      longitude: roundCoord(centerLongitude - lngRadius),
    },
  ];

  return {
    from,
    to,
    waypoints: [via],
    avoidPolygons: [avoidPolygon],
  };
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function parseLocationString(location?: string | null): DemoPoint | null {
  if (!location?.trim()) {
    return null;
  }

  const [longitudeText, latitudeText] = location.split(",").map((item) => item.trim());
  const longitude = Number(longitudeText);
  const latitude = Number(latitudeText);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return {
    latitude: roundCoord(latitude),
    longitude: roundCoord(longitude),
  };
}

function buildPolygonAroundCenter(center: DemoPoint, seedText?: string): DemoPoint[] {
  const normalizedSeed = seedText?.trim() || "示例避让区";
  const seedHash = hashSeed(normalizedSeed);
  const latitudeRadius = 0.001 + ((seedHash >> 2) % 5) * 0.00018;
  const longitudeRadius = 0.0014 + ((seedHash >> 5) % 5) * 0.00022;

  return [
    {
      latitude: roundCoord(center.latitude - latitudeRadius),
      longitude: roundCoord(center.longitude - longitudeRadius),
    },
    {
      latitude: roundCoord(center.latitude - latitudeRadius),
      longitude: roundCoord(center.longitude + longitudeRadius),
    },
    {
      latitude: roundCoord(center.latitude + latitudeRadius),
      longitude: roundCoord(center.longitude + longitudeRadius),
    },
    {
      latitude: roundCoord(center.latitude + latitudeRadius),
      longitude: roundCoord(center.longitude - longitudeRadius),
    },
  ];
}

function buildPolygonAroundRoute(points: DemoPoint[], seedText?: string): DemoPoint[] | null {
  if (points.length < 6) {
    return null;
  }

  const normalizedSeed = seedText?.trim() || "示例避让区";
  const seedHash = hashSeed(normalizedSeed);
  const centerRatio = 0.28 + (seedHash % 38) / 100;
  const centerIndex = Math.max(
    2,
    Math.min(points.length - 3, Math.floor(points.length * centerRatio))
  );
  const sliceRadius = 2 + ((seedHash >> 3) % 2);
  const slice = points.slice(centerIndex - sliceRadius, centerIndex + sliceRadius + 1);
  if (slice.length < 3) {
    return null;
  }

  const latitudes = slice.map((point) => point.latitude);
  const longitudes = slice.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const paddingScale = 1.7 + ((seedHash >> 6) % 4) * 0.28;
  const latitudePadding = Math.max(0.00065, (maxLatitude - minLatitude) * paddingScale);
  const longitudePadding = Math.max(0.0009, (maxLongitude - minLongitude) * (paddingScale + 0.15));

  return [
    {
      latitude: roundCoord(minLatitude - latitudePadding),
      longitude: roundCoord(minLongitude - longitudePadding),
    },
    {
      latitude: roundCoord(minLatitude - latitudePadding),
      longitude: roundCoord(maxLongitude + longitudePadding),
    },
    {
      latitude: roundCoord(maxLatitude + latitudePadding),
      longitude: roundCoord(maxLongitude + longitudePadding),
    },
    {
      latitude: roundCoord(maxLatitude + latitudePadding),
      longitude: roundCoord(minLongitude - longitudePadding),
    },
  ];
}

export async function buildAvoidanceDemoScenario(
  from: DemoPoint,
  seedTexts?: string[]
): Promise<DemoScenario> {
  const baseScenario = buildDemoScenario(from);
  const normalizedSeeds = (seedTexts ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
  const effectiveSeeds = normalizedSeeds.length > 0 ? normalizedSeeds.slice(0, 3) : ["示例避让区"];
  const avoidAreaLabel = effectiveSeeds.join(" / ");

  try {
    const baselineResult = await calculateDriveRoute({
      type: RouteType.DRIVE,
      from: baseScenario.from,
      to: baseScenario.to,
      waypoints: baseScenario.waypoints,
      strategy: DriveStrategy.AVOID_CONGESTION,
    });

    const baselineRoute = getRoutePreviewPoints(
      baselineResult.routes[baselineResult.mainPathIndex] ?? baselineResult.routes[0]
    );
    const api =
      EXAMPLE_WEB_API_KEY && effectiveSeeds.some((seed) => seed !== "示例避让区")
        ? new GaodeWebAPI({ key: EXAMPLE_WEB_API_KEY })
        : null;

    const resolvedAreas = await Promise.all(
      effectiveSeeds.map(async (seed, index) => {
        let polygon: DemoPoint[] | null = null;
        let source: DemoScenario["avoidAreaSource"] = "fallback";

        if (api && seed !== "示例避让区") {
          try {
            const locationBias = {
              location: `${from.longitude},${from.latitude}`,
            };
            const tipsResult = await api.inputTips.getPOITips(seed, locationBias);
            const searchedPoint =
              tipsResult.tips
                .map((tip) => parseLocationString(tip.location))
                .find((point): point is DemoPoint => point !== null) ??
              parseLocationString((await api.geocode.geocode(seed)).geocodes[0]?.location);

            if (searchedPoint) {
              polygon = buildPolygonAroundCenter(searchedPoint, `${seed}-${index}`);
              source = "searched";
            }
          } catch {
            polygon = null;
          }
        }

        if (!polygon) {
          polygon = buildPolygonAroundRoute(
            baselineRoute,
            `${seed}-${index}-${Math.round(from.latitude * 1000)}`
          );
          source = "fallback";
        }

        return polygon
          ? {
              label: seed,
              source,
              polygon,
            }
          : null;
      })
    );

    const validAreas = resolvedAreas.filter(
      (
        area
      ): area is {
        label: string;
        source: "searched" | "fallback";
        polygon: DemoPoint[];
      } => area !== null
    );

    if (validAreas.length === 0) {
      return {
        ...baseScenario,
        avoidAreaLabel,
        avoidAreaSource: "fallback",
        avoidAreaLabels: effectiveSeeds,
        avoidAreaSources: effectiveSeeds.map(() => "fallback"),
      };
    }

    return {
      ...baseScenario,
      avoidPolygons: validAreas.map((area) => area.polygon),
      baselineRoute,
      avoidAreaLabel,
      avoidAreaSource: validAreas.every((area) => area.source === "searched")
        ? "searched"
        : "fallback",
      avoidAreaLabels: validAreas.map((area) => area.label),
      avoidAreaSources: validAreas.map((area) => area.source),
    };
  } catch {
    return {
      ...baseScenario,
      avoidAreaLabel,
      avoidAreaSource: "fallback",
      avoidAreaLabels: effectiveSeeds,
      avoidAreaSources: effectiveSeeds.map(() => "fallback"),
    };
  }
}

export function formatPoint(point?: DemoPoint | null): string {
  if (!point) {
    return "未获取";
  }

  return `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
}

export function formatDistance(distance?: number): string {
  if (!distance || distance <= 0) {
    return "0 米";
  }

  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} 公里`;
  }

  return `${Math.round(distance)} 米`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) {
    return "0 分钟";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.max(1, Math.round((seconds % 3600) / 60));
  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟`;
  }

  return `${minutes} 分钟`;
}

export function getRoutePreviewPoints(
  route?: Pick<RouteResult, "polyline" | "segments"> | null
): DemoPoint[] {
  if (!route) {
    return [];
  }

  if (route.polyline?.length) {
    return route.polyline.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));
  }

  return (
    route.segments?.flatMap((segment) =>
      (segment.polyline ?? []).map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      }))
    ) ?? []
  );
}

export function getDemoKeyStatusLines(): string[] {
  return [
    `Android Key: ${EXAMPLE_ANDROID_KEY ? "已配置" : "未配置"}`,
    `iOS Key: ${EXAMPLE_IOS_KEY ? "已配置" : "未配置"}`,
    `Web Key: ${EXAMPLE_WEB_API_KEY ? "已配置" : "未配置"}`,
  ];
}
