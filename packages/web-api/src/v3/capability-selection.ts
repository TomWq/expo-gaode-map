// This file is generated from internal/v3-source. Run `yarn sync:v3-shared` after editing the source files.
export interface CapabilityRequirements {
  search?: boolean;
  geocode?: boolean;
  route?: boolean;
}

export interface CapabilitySelectionOptions {
  requirements?: CapabilityRequirements;
  prefer?: 'native-first' | 'web-first';
  forceNativeSearch?: boolean;
  forceWebApi?: boolean;
}

export interface CapabilityModuleSelection {
  nativeSearch: boolean;
  webApi: boolean;
}

function hasExplicitRequirements(requirements?: CapabilityRequirements): boolean {
  if (!requirements) {
    return false;
  }

  return (
    requirements.search === true ||
    requirements.geocode === true ||
    requirements.route === true
  );
}

export function resolveCapabilityModuleSelection(
  options: CapabilitySelectionOptions = {}
): CapabilityModuleSelection {
  const requirements = options.requirements;
  const prefer = options.prefer ?? 'native-first';

  // 默认保持“全能力探测”行为，兼容此前运行时逻辑。
  if (!hasExplicitRequirements(requirements)) {
    return {
      nativeSearch: options.forceNativeSearch ?? true,
      webApi: options.forceWebApi ?? true,
    };
  }

  const needsSearch = requirements?.search === true;
  const needsGeocode = requirements?.geocode === true;
  const needsRoute = requirements?.route === true;

  let nativeSearch = needsSearch || needsGeocode;
  let webApi = needsRoute;

  if (needsSearch || needsGeocode) {
    if (prefer === 'web-first') {
      webApi = true;
    } else {
      nativeSearch = true;
    }
  }

  return {
    nativeSearch: options.forceNativeSearch ?? nativeSearch,
    webApi: options.forceWebApi ?? webApi,
  };
}
