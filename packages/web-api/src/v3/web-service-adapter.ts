import type { ClientConfig } from '../utils/client';
import { GaodeWebAPIClient } from '../utils/client';
import { GeocodeService } from '../services/GeocodeService';
import { InputTipsService } from '../services/InputTipsService';
import { POIService } from '../services/POIService';
import { RouteService } from '../services/RouteService';

// 仅暴露 provider 实际会调用到的最小能力集合，避免 v3 provider 与 legacy class 强耦合。
export interface WebSearchApiAdapter {
  poi: Pick<POIService, 'search' | 'searchAround' | 'searchPolygon' | 'getDetail'>;
  inputTips: Pick<InputTipsService, 'getTips'>;
}

export interface WebGeocodeApiAdapter {
  geocode: Pick<GeocodeService, 'regeocode'>;
}

export interface WebRouteApiAdapter {
  route: Pick<RouteService, 'driving' | 'walking' | 'bicycling' | 'electricBike' | 'transit'>;
}

function createClient(config?: ClientConfig): GaodeWebAPIClient {
  return new GaodeWebAPIClient(config ?? {});
}

export function createWebSearchApiAdapter(config?: ClientConfig): WebSearchApiAdapter {
  // 每个 adapter 使用独立 client，保持 provider 的组合方式简单且可预测。
  const client = createClient(config);
  return {
    poi: new POIService(client),
    inputTips: new InputTipsService(client),
  };
}

export function createWebGeocodeApiAdapter(config?: ClientConfig): WebGeocodeApiAdapter {
  const client = createClient(config);
  return {
    geocode: new GeocodeService(client),
  };
}

export function createWebRouteApiAdapter(config?: ClientConfig): WebRouteApiAdapter {
  const client = createClient(config);
  return {
    route: new RouteService(client),
  };
}
