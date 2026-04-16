#ifndef EXPO_GAODE_MAP_PACKAGE_H
#define EXPO_GAODE_MAP_PACKAGE_H

#include "ComponentDescriptors.h"
#include "ExpoGaodeMapEventEmitRequestHandler.h"
#include "ExpoGaodeMapJSIBinder.h"
#include "ExpoGaodeMapTurboModuleSpec.h"

#include "RNOH/Package.h"

namespace rnoh {

class ExpoGaodeMapPackage : public Package {
public:
  explicit ExpoGaodeMapPackage(Package::Context ctx) : Package(ctx) {}

  std::unique_ptr<TurboModuleFactoryDelegate> createTurboModuleFactoryDelegate()
      override {
    class ExpoGaodeMapTurboModuleFactoryDelegate : public TurboModuleFactoryDelegate {
     public:
      SharedTurboModule createTurboModule(
          Context ctx,
          const std::string& name) const override {
        if (name == "ExpoGaodeMap") {
          return std::make_shared<NativeExpoGaodeMapTurboModuleSpecJSI>(ctx, name);
        }
        return nullptr;
      }
    };

    return std::make_unique<ExpoGaodeMapTurboModuleFactoryDelegate>();
  }

  std::vector<facebook::react::ComponentDescriptorProvider> createComponentDescriptorProviders() override {
    return {
      facebook::react::concreteComponentDescriptorProvider<facebook::react::ExpoGaodeMapViewComponentDescriptor>(),
    };
  }

  ComponentJSIBinderByString createComponentJSIBinderByName() override {
    return {
      {"ExpoGaodeMapView", std::make_shared<ExpoGaodeMapViewJSIBinder>()},
    };
  }

  EventEmitRequestHandlers createEventEmitRequestHandlers() override {
    return {
      {std::make_shared<ExpoGaodeMapViewEventEmitRequestHandler>()},
    };
  }
};

} // namespace rnoh

#endif // EXPO_GAODE_MAP_PACKAGE_H
