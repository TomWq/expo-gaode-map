// This file is generated from internal/v3-source. Run `yarn sync:v3-shared` after editing the source files.
export type ProviderSource = 'native' | 'web';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SearchPOI {
  id?: string;
  name: string;
  address?: string;
  location?: Coordinates | null;
  typeCode?: string;
  typeName?: string;
  distanceMeters?: number;
  cityCode?: string;
  cityName?: string;
  districtCode?: string;
  districtName?: string;
  provinceName?: string;
  source: ProviderSource;
}

export interface SearchSuggestion {
  id?: string;
  name: string;
  address?: string;
  location?: Coordinates | null;
  districtName?: string;
  cityName?: string;
  typeCode?: string;
  source: ProviderSource;
}

export interface SearchPage<TItem> {
  items: TItem[];
  total: number | null;
  page: number | null;
  pageSize: number | null;
  raw: unknown;
}

export interface ReverseGeocodeResult {
  formattedAddress: string;
  location: Coordinates;
  pois: SearchPOI[];
  raw: unknown;
}

export interface RoutePoint extends Coordinates {}

export interface RoutePlan {
  distanceMeters: number;
  durationSeconds: number;
  path: RoutePoint[];
  source: ProviderSource;
  raw: unknown;
}
