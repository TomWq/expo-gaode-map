#include "ExpoGaodeMapOfflineTurboModuleSpec.h"

using namespace rnoh;

NativeExpoGaodeMapOfflineTurboModuleSpecJSI::NativeExpoGaodeMapOfflineTurboModuleSpecJSI(
    const ArkTSTurboModule::Context ctx,
    const std::string name)
    : ArkTSTurboModule(ctx, name) {
  methodMap_ = {
      ARK_ASYNC_METHOD_METADATA(getAvailableCities, 0),
      ARK_ASYNC_METHOD_METADATA(getAvailableProvinces, 0),
      ARK_ASYNC_METHOD_METADATA(getCitiesByProvince, 1),
      ARK_ASYNC_METHOD_METADATA(getDownloadedMaps, 0),
      ARK_ASYNC_METHOD_METADATA(startDownload, 1),
      ARK_ASYNC_METHOD_METADATA(pauseDownload, 1),
      ARK_ASYNC_METHOD_METADATA(resumeDownload, 1),
      ARK_ASYNC_METHOD_METADATA(cancelDownload, 1),
      ARK_ASYNC_METHOD_METADATA(deleteMap, 1),
      ARK_ASYNC_METHOD_METADATA(updateMap, 1),
      ARK_ASYNC_METHOD_METADATA(checkUpdate, 1),
      ARK_ASYNC_METHOD_METADATA(isMapDownloaded, 1),
      ARK_ASYNC_METHOD_METADATA(getMapStatus, 1),
      ARK_ASYNC_METHOD_METADATA(getTotalProgress, 0),
      ARK_ASYNC_METHOD_METADATA(getDownloadingCities, 0),
      ARK_ASYNC_METHOD_METADATA(getStorageSize, 0),
      ARK_ASYNC_METHOD_METADATA(getStorageInfo, 0),
      ARK_ASYNC_METHOD_METADATA(clearAllMaps, 0),
      ARK_METHOD_METADATA(setStoragePath, 1),
      ARK_ASYNC_METHOD_METADATA(getStoragePath, 0),
      ARK_ASYNC_METHOD_METADATA(batchDownload, 2),
      ARK_ASYNC_METHOD_METADATA(batchDelete, 1),
      ARK_ASYNC_METHOD_METADATA(batchUpdate, 1),
      ARK_ASYNC_METHOD_METADATA(pauseAllDownloads, 0),
      ARK_ASYNC_METHOD_METADATA(resumeAllDownloads, 0),
      ARK_METHOD_METADATA(addListener, 1),
      ARK_METHOD_METADATA(removeListeners, 1),
  };
}
