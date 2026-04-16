#include "ExpoGaodeMapTurboModuleSpec.h"

using namespace rnoh;

NativeExpoGaodeMapTurboModuleSpecJSI::NativeExpoGaodeMapTurboModuleSpecJSI(
    const ArkTSTurboModule::Context ctx,
    const std::string name)
    : ArkTSTurboModule(ctx, name) {
  methodMap_ = {
      ARK_METHOD_METADATA(setPrivacyShow, 2),
      ARK_METHOD_METADATA(setPrivacyAgree, 1),
      ARK_METHOD_METADATA(setPrivacyVersion, 1),
      ARK_METHOD_METADATA(resetPrivacyConsent, 0),
      ARK_METHOD_METADATA(getPrivacyStatus, 0),
      ARK_METHOD_METADATA(initSDK, 1),
      ARK_METHOD_METADATA(isNativeSDKConfigured, 0),
      ARK_METHOD_METADATA(setLoadWorldVectorMap, 1),
      ARK_METHOD_METADATA(getVersion, 0),
      ARK_METHOD_METADATA(start, 0),
      ARK_METHOD_METADATA(stop, 0),
      ARK_METHOD_METADATA(isStarted, 0),
      ARK_ASYNC_METHOD_METADATA(checkLocationPermission, 0),
      ARK_ASYNC_METHOD_METADATA(requestLocationPermission, 0),
      ARK_ASYNC_METHOD_METADATA(requestBackgroundLocationPermission, 0),
      ARK_METHOD_METADATA(openAppSettings, 0),
  };
}

