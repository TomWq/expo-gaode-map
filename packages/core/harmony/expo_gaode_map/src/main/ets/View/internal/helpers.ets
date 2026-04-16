import { MyLocationStyle } from '@amap/amap_lbs_map3d';

export function parseColor(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith('#')) {
    const raw = normalized.slice(1);
    if (raw.length === 6) {
      const parsed = Number.parseInt(`ff${raw}`, 16);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    if (raw.length === 8) {
      const parsed = Number.parseInt(raw, 16);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  switch (normalized) {
    case 'transparent':
      return 0x00000000;
    case 'black':
      return 0xff000000;
    case 'white':
      return 0xffffffff;
    case 'red':
      return 0xffff0000;
    case 'green':
      return 0xff00ff00;
    case 'blue':
      return 0xff0000ff;
    case 'yellow':
      return 0xffffff00;
    case 'gray':
    case 'grey':
      return 0xff808080;
    default:
      return undefined;
  }
}

export function resolveMyLocationType(
  locationType: string | undefined,
  followUserLocation: boolean
): number {
  switch (locationType) {
    case 'SHOW':
      return MyLocationStyle.LOCATION_TYPE_SHOW;
    case 'LOCATE':
      return MyLocationStyle.LOCATION_TYPE_LOCATE;
    case 'FOLLOW':
      return MyLocationStyle.LOCATION_TYPE_FOLLOW;
    case 'MAP_ROTATE':
      return MyLocationStyle.LOCATION_TYPE_MAP_ROTATE;
    case 'LOCATION_ROTATE':
      return MyLocationStyle.LOCATION_TYPE_LOCATION_ROTATE;
    case 'LOCATION_ROTATE_NO_CENTER':
      return MyLocationStyle.LOCATION_TYPE_LOCATION_ROTATE_NO_CENTER;
    case 'FOLLOW_NO_CENTER':
      return MyLocationStyle.LOCATION_TYPE_FOLLOW_NO_CENTER;
    case 'MAP_ROTATE_NO_CENTER':
      return MyLocationStyle.LOCATION_TYPE_MAP_ROTATE_NO_CENTER;
    default:
      return followUserLocation
        ? MyLocationStyle.LOCATION_TYPE_LOCATION_ROTATE
        : MyLocationStyle.LOCATION_TYPE_SHOW;
  }
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return apiKey;
  }
  return `${apiKey.slice(0, 4)}***${apiKey.slice(-4)}`;
}

