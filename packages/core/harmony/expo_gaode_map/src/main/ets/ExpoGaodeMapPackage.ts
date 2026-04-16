import type {
  UITurboModule,
  UITurboModuleContext,
} from '@rnoh/react-native-openharmony/ts';
import { RNPackage } from '@rnoh/react-native-openharmony/ts';

import { ExpoGaodeMapModule } from './ExpoGaodeMapModule';

const EXPO_GAODE_MAP_TURBO_MODULE_NAME = 'ExpoGaodeMap';

export class ExpoGaodeMapPackage extends RNPackage {
  override getUITurboModuleFactoryByNameMap(): Map<
    string,
    (ctx: UITurboModuleContext) => UITurboModule | null
  > {
    const map = new Map<string, (ctx: UITurboModuleContext) => UITurboModule | null>();
    map.set(EXPO_GAODE_MAP_TURBO_MODULE_NAME, (ctx: UITurboModuleContext) => {
      try {
        return new ExpoGaodeMapModule(ctx);
      } catch (e) {
        console.error(`[ExpoGaodeMapPackage] getUITurboModuleFactory create failed: ${JSON.stringify(e)}`);
        return null;
      }
    });
    return map;
  }

  override createTurboModulesFactory(ctx: UITurboModuleContext): any {
    return {
      createTurboModule: (name: string) => {
        if (name === EXPO_GAODE_MAP_TURBO_MODULE_NAME) {
          console.info('[ExpoGaodeMapPackage] createTurboModule ExpoGaodeMap');
          try {
            return new ExpoGaodeMapModule(ctx);
          } catch (e) {
            console.error(`[ExpoGaodeMapPackage] createTurboModule failed: ${JSON.stringify(e)}`);
            return null;
          }
        }
        return null;
      },
      hasTurboModule: (name: string) => name === EXPO_GAODE_MAP_TURBO_MODULE_NAME,
      prepareEagerTurboModules: () => Promise.resolve(),
    };
  }

  override async createEagerUITurboModuleByNameMap(
    ctx: UITurboModuleContext
  ): Promise<Map<string, UITurboModule>> {
    console.info('[ExpoGaodeMapPackage] createEagerUITurboModuleByNameMap ExpoGaodeMap');
    try {
      const module = new ExpoGaodeMapModule(ctx);
      return new Map<string, UITurboModule>().set(EXPO_GAODE_MAP_TURBO_MODULE_NAME, module);
    } catch (e) {
      console.error(`[ExpoGaodeMapPackage] createEagerUITurboModuleByNameMap failed: ${JSON.stringify(e)}`);
      return new Map<string, UITurboModule>();
    }
  }

  override getDebugName(): string {
    return 'ExpoGaodeMapPackage';
  }
}

export default ExpoGaodeMapPackage;
