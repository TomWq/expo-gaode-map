// This file is generated from internal/v3-source. Run `yarn sync:v3-shared` after editing the source files.
import type {
  Coordinates,
  ReverseGeocodeResult,
  RoutePlan,
  SearchPOI,
  SearchPage,
  SearchSuggestion,
} from './domain';

export interface KeywordSearchParams {
  keyword: string;
  city?: string;
  types?: string;
  page?: number;
  pageSize?: number;
  location?: Coordinates;
  cityLimit?: boolean;
}

export interface NearbySearchParams {
  keyword: string;
  center: Coordinates;
  radius?: number;
  types?: string;
  page?: number;
  pageSize?: number;
}

export interface AlongSearchParams {
  keyword: string;
  polyline: Coordinates[];
  range?: number;
  page?: number;
  pageSize?: number;
}

export interface PolygonSearchParams {
  keyword: string;
  polygon: Coordinates[];
  types?: string;
  page?: number;
  pageSize?: number;
}

export interface InputTipsParams {
  keyword: string;
  city?: string;
  types?: string;
  location?: Coordinates;
  cityLimit?: boolean;
  datatype?: string;
}

export interface ReverseGeocodeParams {
  location: Coordinates;
  radius?: number;
  extensions?: 'base' | 'all';
}

export interface DrivingRouteParams {
  origin: Coordinates;
  destination: Coordinates;
  waypoints?: Coordinates[];
  strategy?: string | number;
}

export interface TransitRouteParams extends DrivingRouteParams {
  city1: string;
  city2: string;
  alternativeRoute?: 1 | 2 | 3;
}

export interface SearchProvider {
  kind: string;
  searchKeyword(params: KeywordSearchParams): Promise<SearchPage<SearchPOI>>;
  searchNearby(params: NearbySearchParams): Promise<SearchPage<SearchPOI>>;
  searchAlong?(params: AlongSearchParams): Promise<SearchPage<SearchPOI>>;
  searchPolygon?(params: PolygonSearchParams): Promise<SearchPage<SearchPOI>>;
  getInputTips(params: InputTipsParams): Promise<SearchPage<SearchSuggestion>>;
  getPoiDetail?(id: string): Promise<SearchPOI | null>;
}

export interface GeocodeProvider {
  kind: string;
  reverseGeocode(params: ReverseGeocodeParams): Promise<ReverseGeocodeResult>;
}

export interface RouteProvider {
  kind: string;
  calculateDrivingRoute(params: DrivingRouteParams): Promise<RoutePlan>;
  calculateWalkingRoute?(params: DrivingRouteParams): Promise<RoutePlan>;
  calculateBicyclingRoute?(params: DrivingRouteParams): Promise<RoutePlan>;
  calculateElectricBikeRoute?(params: DrivingRouteParams): Promise<RoutePlan>;
  calculateTransitRoutes?(params: TransitRouteParams): Promise<RoutePlan[]>;
}
