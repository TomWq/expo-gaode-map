import * as React from 'react';
import type { ComponentType } from 'react';
import { Platform, findNodeHandle, requireNativeComponent } from 'react-native';

const isHarmonyPlatform = (): boolean =>
  ['harmony', 'ohos'].includes((Platform.OS as string).toLowerCase());

type ExpoGlobalShape = {
  __expo_app_identifier__?: string;
  getViewConfig?: (moduleName: string, viewName?: string) => unknown;
  modules?: Record<string, unknown>;
};

type ExpoNativeModuleShape = {
  ViewPrototypes?: Record<string, Record<string, unknown>>;
};

function getExpoAdapterViewName(moduleName: string): string | null {
  const expoGlobal = (globalThis as { expo?: ExpoGlobalShape }).expo;
  if (!expoGlobal || typeof expoGlobal.getViewConfig !== 'function') {
    return null;
  }

  const viewConfig = expoGlobal.getViewConfig(moduleName);
  if (!viewConfig) {
    return null;
  }

  const appIdentifier = expoGlobal.__expo_app_identifier__ ?? '';
  const suffix = appIdentifier ? `_${appIdentifier}` : '';
  return `ViewManagerAdapter_${moduleName}${suffix}`;
}

function resolveExpoModule(moduleName: string): ExpoNativeModuleShape | null {
  const expoGlobal = (globalThis as { expo?: ExpoGlobalShape }).expo;
  const modules = expoGlobal?.modules;
  if (!modules || typeof modules !== 'object') {
    return null;
  }

  const directModule = modules[moduleName] as ExpoNativeModuleShape | undefined;
  if (directModule && typeof directModule === 'object') {
    return directModule;
  }

  const nativeModulesProxy = modules.NativeModulesProxy as Record<string, unknown> | undefined;
  if (!nativeModulesProxy || typeof nativeModulesProxy !== 'object') {
    return null;
  }

  const proxyModule = nativeModulesProxy[moduleName] as ExpoNativeModuleShape | undefined;
  if (!proxyModule || typeof proxyModule !== 'object') {
    return null;
  }
  return proxyModule;
}

function createWrappedNativeComponent<Props extends object>(
  NativeComponentImpl: ComponentType<Props>,
  moduleName: string
): ComponentType<Props> {
  class WrappedNativeComponent extends React.PureComponent<Props> {
    static displayName = moduleName;

    private nativeRef = React.createRef<unknown>();
    nativeTag: number | null = null;

    componentDidMount(): void {
      this.nativeTag = findNodeHandle(
        this.nativeRef.current as Parameters<typeof findNodeHandle>[0]
      );
    }

    render(): React.ReactNode {
      const NativeComponent = NativeComponentImpl as React.ComponentType<
        Props & { ref?: React.Ref<unknown> }
      >;
      return React.createElement(NativeComponent, {
        ...(this.props as Props),
        ref: this.nativeRef,
      });
    }
  }

  const nativeModule = resolveExpoModule(moduleName);
  const nativeViewPrototype = nativeModule?.ViewPrototypes?.[moduleName];
  if (nativeViewPrototype && typeof nativeViewPrototype === 'object') {
    Object.assign(WrappedNativeComponent.prototype, nativeViewPrototype);
  }

  return WrappedNativeComponent as ComponentType<Props>;
}

export function createLazyNativeViewManager<Props extends object = Record<string, unknown>>(
  name: string
): () => ComponentType<Props> {
  let cached: ComponentType<Props> | null = null;

  return () => {
    if (!cached) {
      if (isHarmonyPlatform()) {
        cached = requireNativeComponent<Props>(name) as ComponentType<Props>;
        return cached;
      }

      const targetViewName = getExpoAdapterViewName(name) ?? name;
      const NativeComponent = requireNativeComponent<Props>(targetViewName) as ComponentType<Props>;
      cached = createWrappedNativeComponent<Props>(NativeComponent, name);

      if (!cached && !isHarmonyPlatform()) {
        throw new Error(`Native view manager '${name}' is unavailable`);
      }
    }
    return cached!;
  };
}
