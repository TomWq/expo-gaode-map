#ifndef EXPO_GAODE_MAP_PACKAGE_H
#define EXPO_GAODE_MAP_PACKAGE_H

#include "ComponentDescriptors.h"
#include "ExpoGaodeMapEventEmitRequestHandler.h"
#include "ExpoGaodeMapJSIBinder.h"
#include "ExpoGaodeMapOfflineTurboModuleSpec.h"
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
        if (name == "ExpoGaodeMapOffline") {
          return std::make_shared<NativeExpoGaodeMapOfflineTurboModuleSpecJSI>(ctx, name);
        }
        return nullptr;
      }
    };

    return std::make_unique<ExpoGaodeMapTurboModuleFactoryDelegate>();
  }

  std::vector<facebook::react::ComponentDescriptorProvider> createComponentDescriptorProviders() override {
    return {
      facebook::react::concreteComponentDescriptorProvider<facebook::react::ExpoGaodeMapViewComponentDescriptor>(),
      facebook::react::concreteComponentDescriptorProvider<facebook::react::MarkerViewComponentDescriptor>(),
      facebook::react::concreteComponentDescriptorProvider<facebook::react::PolylineViewComponentDescriptor>(),
      facebook::react::concreteComponentDescriptorProvider<facebook::react::PolygonViewComponentDescriptor>(),
      facebook::react::concreteComponentDescriptorProvider<facebook::react::CircleViewComponentDescriptor>(),
      facebook::react::concreteComponentDescriptorProvider<facebook::react::HeatMapViewComponentDescriptor>(),
      facebook::react::concreteComponentDescriptorProvider<facebook::react::MultiPointViewComponentDescriptor>(),
    };
  }

  ComponentJSIBinderByString createComponentJSIBinderByName() override {
    return {
      {"ExpoGaodeMapView", std::make_shared<ExpoGaodeMapViewJSIBinder>()},
      {"MarkerView", std::make_shared<MarkerViewJSIBinder>()},
      {"PolylineView", std::make_shared<PolylineViewJSIBinder>()},
      {"PolygonView", std::make_shared<PolygonViewJSIBinder>()},
      {"CircleView", std::make_shared<CircleViewJSIBinder>()},
      {"HeatMapView", std::make_shared<HeatMapViewJSIBinder>()},
      {"MultiPointView", std::make_shared<MultiPointViewJSIBinder>()},
    };
  }

  EventEmitRequestHandlers createEventEmitRequestHandlers() override {
    return {
      {std::make_shared<ExpoGaodeMapViewEventEmitRequestHandler>()},
      {std::make_shared<MarkerViewEventEmitRequestHandler>()},
      {std::make_shared<PolylineViewEventEmitRequestHandler>()},
    };
  }
};

} // namespace rnoh

#endif // EXPO_GAODE_MAP_PACKAGE_H
