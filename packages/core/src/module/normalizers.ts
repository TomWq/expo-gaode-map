import type {
  Coordinates,
  CoordinateType,
  GeoLanguage,
  HeadingUpdate,
  LatLngPoint,
  ReGeocode,
} from '../types';
import type { PermissionStatus } from '../types/common.types';
import { ErrorHandler } from '../utils/ErrorHandler';
import { CoordinateType as CoordinateTypeValue } from '../types';

export function normalizeCoordinateType(type: CoordinateType): number | null {
  switch (type) {
    case CoordinateTypeValue.AMap:
      return null;
    case CoordinateTypeValue.MapBar:
      return 1;
    case CoordinateTypeValue.Baidu:
      return 2;
    case CoordinateTypeValue.MapABC:
    case CoordinateTypeValue.SoSoMap:
      return 3;
    case CoordinateTypeValue.Google:
    case CoordinateTypeValue.GPS:
      return 0;
    default:
      throw ErrorHandler.invalidParameter(
        'type',
        'CoordinateType.AMap | MapBar | Baidu | MapABC | SoSoMap | Google | GPS',
        type
      );
  }
}

export function normalizeGeoLanguage(language: GeoLanguage | string): GeoLanguage {
  const normalized = String(language).trim().toUpperCase();

  switch (normalized) {
    case 'DEFAULT':
      return 'DEFAULT';
    case 'EN':
    case 'EN-US':
    case 'EN_US':
    case 'EN-GB':
    case 'EN_GB':
      return 'EN';
    case 'ZH':
    case 'ZH-CN':
    case 'ZH_CN':
    case 'ZH-HANS':
    case 'ZH_HANS':
      return 'ZH';
    default:
      throw ErrorHandler.invalidParameter(
        'language',
        "'DEFAULT' | 'EN' | 'ZH' | 常见别名（如 'en', 'zh-CN'）",
        language
      );
  }
}

export function normalizeLocationResult<T extends Coordinates | ReGeocode>(location: T): T {
  const rawLocation = location as T & { bearing?: number; heading?: number };
  const heading = rawLocation.heading ?? rawLocation.bearing ?? 0;

  return {
    ...rawLocation,
    heading,
  };
}

export function normalizeHeadingEvent(payload: HeadingUpdate | Record<string, unknown>): HeadingUpdate {
  const raw = payload as Record<string, unknown>;
  const fallbackHeading = Number(raw.heading ?? raw.trueHeading ?? raw.magneticHeading ?? 0);
  const fallbackAccuracy = Number(raw.accuracy ?? raw.headingAccuracy ?? 0);

  return {
    magneticHeading: Number(raw.magneticHeading ?? fallbackHeading),
    trueHeading: Number(raw.trueHeading ?? fallbackHeading),
    headingAccuracy: fallbackAccuracy,
    x: Number(raw.x ?? 0),
    y: Number(raw.y ?? 0),
    z: Number(raw.z ?? 0),
    timestamp: Number(raw.timestamp ?? Date.now()),
  };
}

export function normalizePermissionStatus(permission: PermissionStatus | Record<string, unknown>): PermissionStatus {
  const raw = permission as Partial<PermissionStatus> & Record<string, unknown>;
  const rawStatus = String(raw.status ?? '');

  let status: 'granted' | 'denied' | 'undetermined';
  switch (rawStatus) {
    case 'granted':
    case 'authorizedAlways':
    case 'authorizedWhenInUse':
      status = 'granted';
      break;
    case 'denied':
    case 'restricted':
      status = 'denied';
      break;
    case 'notDetermined':
    case 'undetermined':
    case 'unknown':
    case '':
    default:
      status = 'undetermined';
      break;
  }

  const granted = Boolean(raw.granted ?? (status === 'granted'));
  const shouldShowRationale =
    typeof raw.shouldShowRationale === 'boolean' ? raw.shouldShowRationale : undefined;
  const explicitPermanent =
    typeof raw.isPermanentlyDenied === 'boolean' ? raw.isPermanentlyDenied : undefined;

  const canAskAgain =
    typeof raw.canAskAgain === 'boolean'
      ? raw.canAskAgain
      : granted
        ? true
        : typeof shouldShowRationale === 'boolean'
          ? shouldShowRationale
          : explicitPermanent === true
            ? false
            : status === 'undetermined';

  const isPermanentlyDenied =
    explicitPermanent ??
    (!granted && status === 'denied' && canAskAgain === false);

  return {
    ...raw,
    expires: raw.expires ?? 'never',
    granted,
    status: status as unknown as PermissionStatus['status'],
    canAskAgain,
    isPermanentlyDenied,
  };
}

export type { LatLngPoint };
