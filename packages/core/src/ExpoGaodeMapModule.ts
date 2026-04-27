import type { NativeExpoGaodeMapModule } from './types/native-module.types';
import { getBoundNativeValue, getNativeModule } from './module/nativeModule';
import { assertPrivacyReady, privacyMethods } from './module/privacy';
import { sdkMethods, getSDKConfig, getWebKey } from './module/sdk';
import { locationMethods } from './module/location';
import { geometryMethods } from './module/geometry';

export { getSDKConfig, getWebKey };

const privacySensitiveMethodNames = new Set<string>([
  'start',
  'stop',
  'isStarted',
  'getCurrentLocation',
  'coordinateConvert',
  'setLocatingWithReGeocode',
  'setLocationMode',
  'setInterval',
  'setOnceLocation',
  'setSensorEnable',
  'setWifiScan',
  'setGpsFirst',
  'setOnceLocationLatest',
  'setGeoLanguage',
  'setLocationCacheEnable',
  'setHttpTimeOut',
  'setDesiredAccuracy',
  'setLocationTimeout',
  'setReGeocodeTimeout',
  'setDistanceFilter',
  'setPausesLocationUpdatesAutomatically',
  'setAllowsBackgroundLocationUpdates',
  'setLocationProtocol',
  'startUpdatingHeading',
  'stopUpdatingHeading',
  'checkLocationPermission',
  'requestLocationPermission',
  'requestBackgroundLocationPermission',
  'addLocationListener',
]);

const helperMethods = Object.defineProperties(
  {},
  {
    ...Object.getOwnPropertyDescriptors(sdkMethods),
    ...Object.getOwnPropertyDescriptors(privacyMethods),
    ...Object.getOwnPropertyDescriptors(locationMethods),
    ...Object.getOwnPropertyDescriptors(geometryMethods),
  }
) as typeof sdkMethods &
  typeof privacyMethods &
  typeof locationMethods &
  typeof geometryMethods;

type HiddenNativeMethodName = 'setPrivacyShow' | 'setPrivacyAgree';

const hiddenNativeMethodNames = new Set<PropertyKey>([
  'setPrivacyShow',
  'setPrivacyAgree',
]);

export type ExpoGaodeMapModule =
  Omit<
    NativeExpoGaodeMapModule,
    keyof typeof helperMethods | HiddenNativeMethodName
  > &
    typeof helperMethods;

const ExpoGaodeMapModuleWithHelpers = new Proxy(helperMethods, {
  get(target, prop, receiver) {
    if (Reflect.has(target, prop)) {
      return Reflect.get(target, prop, receiver);
    }
    if (hiddenNativeMethodNames.has(prop)) {
      return undefined;
    }
    const nativeModule = getNativeModule(true);
    if (!nativeModule) {
      return undefined;
    }

    const value = Reflect.get(nativeModule as object, prop, nativeModule as object);
    if (
      typeof prop === 'string' &&
      privacySensitiveMethodNames.has(prop) &&
      typeof value === 'function'
    ) {
      return (...args: unknown[]) => {
        assertPrivacyReady('sdk');
        return (value as (...fnArgs: unknown[]) => unknown).apply(nativeModule, args);
      };
    }

    return getBoundNativeValue(nativeModule, prop);
  },
}) as ExpoGaodeMapModule;

export default ExpoGaodeMapModuleWithHelpers;
