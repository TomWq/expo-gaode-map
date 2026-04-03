// This file is generated from internal/v3-source. Run `yarn sync:v3-shared` after editing the source files.
import type {
  DrivingRouteParams,
  GeocodeProvider,
  InputTipsParams,
  KeywordSearchParams,
  NearbySearchParams,
  PolygonSearchParams,
  ReverseGeocodeParams,
  RouteProvider,
  SearchProvider,
  TransitRouteParams,
} from './contracts';
import type {
  ReverseGeocodeResult,
  RoutePlan,
  SearchPOI,
  SearchPage,
  SearchSuggestion,
} from './domain';

export type RuntimeClientKind = 'search' | 'geocode' | 'route';
export type GaodeRuntimeErrorType =
  | 'provider'
  | 'runtime'
  | 'config'
  | 'validation'
  | 'network'
  | 'unknown';

export interface GaodeUnifiedError {
  code: string;
  type: GaodeRuntimeErrorType | string;
  message: string;
  retryable: boolean;
  cause?: unknown;
}

export interface ProviderErrorContext {
  client: RuntimeClientKind;
  method: string;
  providerKind: string;
  providerIndex: number;
}

export interface RuntimeClientOptions {
  continueOnError?: boolean;
  onProviderError?: (context: ProviderErrorContext, error: unknown) => void;
}

export class GaodeProviderError extends Error implements GaodeUnifiedError {
  readonly code: string;
  readonly type: GaodeRuntimeErrorType;
  readonly retryable: boolean;
  readonly cause?: unknown;
  readonly client: RuntimeClientKind;
  readonly method: string;
  readonly attemptedProviders: string[];
  readonly causes: unknown[];

  constructor(options: {
    client: RuntimeClientKind;
    method: string;
    attemptedProviders: string[];
    causes: unknown[];
    message?: string;
  }) {
    const hasProviders = options.attemptedProviders.length > 0;
    super(
      options.message ??
        `[v3:${options.client}] ${options.method} failed after trying ${options.attemptedProviders.join(', ')}`
    );
    this.name = 'GaodeProviderError';
    this.code = hasProviders ? 'PROVIDER_CALL_FAILED' : 'PROVIDER_NOT_REGISTERED';
    this.type = hasProviders ? 'provider' : 'config';
    this.retryable = hasProviders;
    this.cause = options.causes[0];
    this.client = options.client;
    this.method = options.method;
    this.attemptedProviders = options.attemptedProviders;
    this.causes = options.causes;
  }

  toJSON(): GaodeUnifiedError & {
    client: RuntimeClientKind;
    method: string;
    attemptedProviders: string[];
  } {
    return {
      code: this.code,
      type: this.type,
      message: this.message,
      retryable: this.retryable,
      cause: this.cause,
      client: this.client,
      method: this.method,
      attemptedProviders: this.attemptedProviders,
    };
  }
}

export interface SearchClient {
  searchKeyword(params: KeywordSearchParams): Promise<SearchPage<SearchPOI>>;
  searchNearby(params: NearbySearchParams): Promise<SearchPage<SearchPOI>>;
  searchAlong(params: import('./contracts').AlongSearchParams): Promise<SearchPage<SearchPOI>>;
  searchPolygon(params: PolygonSearchParams): Promise<SearchPage<SearchPOI>>;
  getInputTips(params: InputTipsParams): Promise<SearchPage<SearchSuggestion>>;
  getPoiDetail(id: string): Promise<SearchPOI | null>;
}

export interface GeocodeClient {
  reverseGeocode(params: ReverseGeocodeParams): Promise<ReverseGeocodeResult>;
}

export interface RouteClient {
  calculateDrivingRoute(params: DrivingRouteParams): Promise<RoutePlan>;
  calculateWalkingRoute(params: DrivingRouteParams): Promise<RoutePlan>;
  calculateBicyclingRoute(params: DrivingRouteParams): Promise<RoutePlan>;
  calculateElectricBikeRoute(params: DrivingRouteParams): Promise<RoutePlan>;
  calculateTransitRoutes(params: TransitRouteParams): Promise<RoutePlan[]>;
}

export interface GaodeRuntimeOptions extends RuntimeClientOptions {
  searchProviders?: SearchProvider[];
  geocodeProviders?: GeocodeProvider[];
  routeProviders?: RouteProvider[];
}

export interface GaodeRuntime {
  search: SearchClient;
  geocode: GeocodeClient;
  route: RouteClient;
  providers: {
    search: SearchProvider[];
    geocode: GeocodeProvider[];
    route: RouteProvider[];
  };
}

async function callProviders<TProvider extends { kind: string }, TResult>(
  providers: TProvider[],
  client: RuntimeClientKind,
  method: string,
  runner: (provider: TProvider) => Promise<TResult>,
  options: RuntimeClientOptions = {}
): Promise<TResult> {
  const attemptedProviders: string[] = [];
  const causes: unknown[] = [];

  for (let index = 0; index < providers.length; index += 1) {
    const provider = providers[index];
    attemptedProviders.push(provider.kind);

    try {
      return await runner(provider);
    } catch (error) {
      causes.push(error);
      options.onProviderError?.(
        {
          client,
          method,
          providerKind: provider.kind,
          providerIndex: index,
        },
        error
      );

      if (!options.continueOnError) {
        break;
      }
    }
  }

  throw new GaodeProviderError({
    client,
    method,
    attemptedProviders,
    causes,
    message:
      attemptedProviders.length === 0
        ? `[v3:${client}] ${method} has no registered providers`
        : undefined,
  });
}

function getSupportedProviders<TProvider extends { kind: string }>(
  providers: TProvider[],
  predicate: (provider: TProvider) => boolean
): TProvider[] {
  return providers.filter(predicate);
}

export function createSearchClient(
  providers: SearchProvider[],
  options: RuntimeClientOptions = {}
): SearchClient {
  return {
    searchKeyword(params) {
      return callProviders(providers, 'search', 'searchKeyword', (provider) => provider.searchKeyword(params), options);
    },
    searchNearby(params) {
      return callProviders(providers, 'search', 'searchNearby', (provider) => provider.searchNearby(params), options);
    },
    searchAlong(params) {
      const supportedProviders = getSupportedProviders(providers, (provider) => typeof provider.searchAlong === 'function');
      return callProviders(
        supportedProviders,
        'search',
        'searchAlong',
        (provider) => provider.searchAlong!(params),
        options
      );
    },
    searchPolygon(params) {
      const supportedProviders = getSupportedProviders(providers, (provider) => typeof provider.searchPolygon === 'function');
      return callProviders(
        supportedProviders,
        'search',
        'searchPolygon',
        (provider) => provider.searchPolygon!(params),
        options
      );
    },
    getInputTips(params) {
      return callProviders(providers, 'search', 'getInputTips', (provider) => provider.getInputTips(params), options);
    },
    getPoiDetail(id) {
      const supportedProviders = getSupportedProviders(providers, (provider) => typeof provider.getPoiDetail === 'function');
      return callProviders(
        supportedProviders,
        'search',
        'getPoiDetail',
        (provider) => provider.getPoiDetail!(id),
        options
      );
    },
  };
}

export function createGeocodeClient(
  providers: GeocodeProvider[],
  options: RuntimeClientOptions = {}
): GeocodeClient {
  return {
    reverseGeocode(params) {
      return callProviders(
        providers,
        'geocode',
        'reverseGeocode',
        (provider) => provider.reverseGeocode(params),
        options
      );
    },
  };
}

export function createRouteClient(
  providers: RouteProvider[],
  options: RuntimeClientOptions = {}
): RouteClient {
  return {
    calculateDrivingRoute(params) {
      return callProviders(
        providers,
        'route',
        'calculateDrivingRoute',
        (provider) => provider.calculateDrivingRoute(params),
        options
      );
    },
    calculateWalkingRoute(params) {
      const supportedProviders = getSupportedProviders(providers, (provider) => typeof provider.calculateWalkingRoute === 'function');
      return callProviders(
        supportedProviders,
        'route',
        'calculateWalkingRoute',
        (provider) => provider.calculateWalkingRoute!(params),
        options
      );
    },
    calculateBicyclingRoute(params) {
      const supportedProviders = getSupportedProviders(providers, (provider) => typeof provider.calculateBicyclingRoute === 'function');
      return callProviders(
        supportedProviders,
        'route',
        'calculateBicyclingRoute',
        (provider) => provider.calculateBicyclingRoute!(params),
        options
      );
    },
    calculateElectricBikeRoute(params) {
      const supportedProviders = getSupportedProviders(providers, (provider) => typeof provider.calculateElectricBikeRoute === 'function');
      return callProviders(
        supportedProviders,
        'route',
        'calculateElectricBikeRoute',
        (provider) => provider.calculateElectricBikeRoute!(params),
        options
      );
    },
    calculateTransitRoutes(params) {
      const supportedProviders = getSupportedProviders(providers, (provider) => typeof provider.calculateTransitRoutes === 'function');
      return callProviders(
        supportedProviders,
        'route',
        'calculateTransitRoutes',
        (provider) => provider.calculateTransitRoutes!(params),
        options
      );
    },
  };
}

export function createGaodeRuntime(options: GaodeRuntimeOptions = {}): GaodeRuntime {
  const searchProviders = options.searchProviders ?? [];
  const geocodeProviders = options.geocodeProviders ?? [];
  const routeProviders = options.routeProviders ?? [];

  return {
    search: createSearchClient(searchProviders, options),
    geocode: createGeocodeClient(geocodeProviders, options),
    route: createRouteClient(routeProviders, options),
    providers: {
      search: searchProviders,
      geocode: geocodeProviders,
      route: routeProviders,
    },
  };
}
