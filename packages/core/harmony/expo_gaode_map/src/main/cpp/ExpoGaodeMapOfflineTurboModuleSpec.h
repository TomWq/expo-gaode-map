#pragma once

#include <ReactCommon/TurboModule.h>
#include "RNOH/ArkTSTurboModule.h"

namespace rnoh {

class JSI_EXPORT NativeExpoGaodeMapOfflineTurboModuleSpecJSI : public ArkTSTurboModule {
 public:
  NativeExpoGaodeMapOfflineTurboModuleSpecJSI(
      const ArkTSTurboModule::Context ctx,
      const std::string name);
};

} // namespace rnoh
