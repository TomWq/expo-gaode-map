import type {
  UITurboModule,
  UITurboModuleContext,
} from '@rnoh/react-native-openharmony/ts';
import {
  RNOHPackage,
} from '@rnoh/react-native-openharmony';

import { ExpoGaodeMapModule } from './ExpoGaodeMapModule';
import { ExpoGaodeMapOfflineModule } from './ExpoGaodeMapOfflineModule';

const EXPO_GAODE_MAP_TURBO_MODULE_NAME = 'ExpoGaodeMap';
const EXPO_GAODE_MAP_OFFLINE_TURBO_MODULE_NAME = 'ExpoGaodeMapOffline';

export class ExpoGaodeMapPackage extends RNOHPackage {
  override getUITurboModuleFactoryByNameMap(): Map<
    string,
    (ctx: UITurboModuleContext) => UITurboModule | null
  > {
    const map = new Map<string, (ctx: UITurboModuleContext) => UITurboModule | null>();
    map.set(EXPO_GAODE_MAP_TURBO_MODULE_NAME, (ctx: UITurboModuleContext) => {
      try {
        return new ExpoGaodeMapModule(ctx);
      } catch {
        console.error('[ExpoGaodeMapPackage] getUITurboModuleFactory create failed');
        return null;
      }
    });
    map.set(EXPO_GAODE_MAP_OFFLINE_TURBO_MODULE_NAME, (ctx: UITurboModuleContext) => {
      try {
        return new ExpoGaodeMapOfflineModule(ctx);
      } catch {
        console.error('[ExpoGaodeMapPackage] getUITurboModuleFactory create offline failed');
        return null;
      }
    });
    return map;
  }

  override async createEagerUITurboModuleByNameMap(
    ctx: UITurboModuleContext
  ): Promise<Map<string, UITurboModule>> {
    console.info('[ExpoGaodeMapPackage] createEagerUITurboModuleByNameMap ExpoGaodeMap');
    try {
      const modules = new Map<string, UITurboModule>();
      modules.set(EXPO_GAODE_MAP_TURBO_MODULE_NAME, new ExpoGaodeMapModule(ctx));
      modules.set(EXPO_GAODE_MAP_OFFLINE_TURBO_MODULE_NAME, new ExpoGaodeMapOfflineModule(ctx));
      return modules;
    } catch {
      console.error('[ExpoGaodeMapPackage] createEagerUITurboModuleByNameMap failed');
      return new Map<string, UITurboModule>();
    }
  }

  override getDebugName(): string {
    return 'ExpoGaodeMapPackage';
  }
}

export default ExpoGaodeMapPackage;
