import { createWebGeocodeProvider } from './web-geocode-provider';
import { createWebRouteProvider } from './web-route-provider';
import { createWebSearchProvider } from './web-search-provider';
import { createCapabilityRuntime } from './runtime-assembly';
import type { GaodeRuntime, RuntimeClientOptions } from './runtime';
import type { RuntimeCapabilityAdapter } from './runtime-assembly';
import type { WebGeocodeProviderFactoryOptions } from './web-geocode-provider';
import type { WebRouteProviderFactoryOptions } from './web-route-provider';
import type { WebProviderFactoryOptions } from './web-search-provider';

export interface WebRuntimeFactoryOptions extends RuntimeClientOptions {
  search?: WebProviderFactoryOptions;
  geocode?: WebGeocodeProviderFactoryOptions;
  route?: WebRouteProviderFactoryOptions;
}

export interface WebDataRuntimeFactoryOptions extends RuntimeClientOptions {
  search?: WebProviderFactoryOptions;
  geocode?: WebGeocodeProviderFactoryOptions;
}

export interface WebCapabilityAdapterOptions {
  source?: string;
  priority?: number;
  enabled?: boolean;
  search?: WebProviderFactoryOptions;
  geocode?: WebGeocodeProviderFactoryOptions;
  route?: WebRouteProviderFactoryOptions;
}

export interface WebDataCapabilityAdapterOptions {
  source?: string;
  priority?: number;
  enabled?: boolean;
  search?: WebProviderFactoryOptions;
  geocode?: WebGeocodeProviderFactoryOptions;
}

export function createWebCapabilityAdapter(
  options: WebCapabilityAdapterOptions = {}
): RuntimeCapabilityAdapter {
  return {
    source: options.source ?? 'web-api',
    priority: options.priority,
    enabled: options.enabled,
    searchProviders: [createWebSearchProvider(options.search)],
    geocodeProviders: [createWebGeocodeProvider(options.geocode)],
    routeProviders: [createWebRouteProvider(options.route)],
  };
}

export function createWebDataCapabilityAdapter(
  options: WebDataCapabilityAdapterOptions = {}
): RuntimeCapabilityAdapter {
  return {
    source: options.source ?? 'web-data',
    priority: options.priority,
    enabled: options.enabled,
    searchProviders: [createWebSearchProvider(options.search)],
    geocodeProviders: [createWebGeocodeProvider(options.geocode)],
    routeProviders: [],
  };
}

export function createWebRuntime(
  options: WebRuntimeFactoryOptions = {}
): GaodeRuntime {
  return createCapabilityRuntime({
    ...options,
    adapters: [createWebCapabilityAdapter(options)],
  });
}

export function createWebDataRuntime(
  options: WebDataRuntimeFactoryOptions = {}
): GaodeRuntime {
  return createCapabilityRuntime({
    ...options,
    adapters: [createWebDataCapabilityAdapter(options)],
  });
}
