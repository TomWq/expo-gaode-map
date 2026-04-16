#pragma once

#include <ReactCommon/TurboModule.h>
#include "RNOH/ArkTSTurboModule.h"

namespace rnoh {

class JSI_EXPORT NativeExpoGaodeMapTurboModuleSpecJSI : public ArkTSTurboModule {
 public:
  NativeExpoGaodeMapTurboModuleSpecJSI(
      const ArkTSTurboModule::Context ctx,
      const std::string name);
};

} // namespace rnoh

