package expo.modules.gaodemap.navigation.listeners

import com.amap.api.navi.AMapNaviListener
import com.amap.api.navi.model.*
import expo.modules.kotlin.Promise
import expo.modules.gaodemap.navigation.ExpoGaodeMapNavigationModule
import expo.modules.gaodemap.navigation.utils.Converters

/**
 * 路径规划监听器
 */
class RouteCalculateListener(
  private val module: ExpoGaodeMapNavigationModule
) : AMapNaviListener {
  
  var currentPromise: Promise? = null
  // scene: "drive" | "truck" | "walk" | "ride"
  var scene: String? = null
  // whether caller expects multiple routes
  var multiple: Boolean = false

  override fun onInitNaviSuccess() {
    // 初始化成功
  }

  override fun onInitNaviFailure() {
    currentPromise?.reject("INIT_ERROR", "Failed to initialize navigation", null)
    currentPromise = null
  }

  @Deprecated("Deprecated in Java")
  override fun onCalculateRouteSuccess(routeIds: IntArray?) {
    android.util.Log.d("RouteCalculateListener", "Deprecated onCalculateRouteSuccess 被调用，忽略")
    // 这个方法已被废弃，不处理，避免与新的 onCalculateRouteSuccess 重复调用
  }
  
  override fun onCalculateRouteSuccess(routeResult: AMapCalcRouteResult?) {
    android.util.Log.d("RouteCalculateListener", "onCalculateRouteSuccess 被调用")
    android.util.Log.d("RouteCalculateListener", "场景: $scene, 多路线: $multiple")
    android.util.Log.d("RouteCalculateListener", "routeResult: $routeResult")
    
    try {
      val navi = com.amap.api.navi.AMapNavi.getInstance(module.appContext.reactContext)
      val isWalkOrRide = scene == "walk" || scene == "ride" || scene == "ebike"
      
      android.util.Log.d("RouteCalculateListener", "naviPaths 数量: ${navi.naviPaths?.size}")
      val result = if (isWalkOrRide) {
        if (multiple) {
          Converters.convertDriveRouteResult(navi.naviPaths)
        } else {
          val path = navi.naviPath
          if (path != null) Converters.convertNaviPath(path) else mapOf<String, Any?>()
        }
      } else {
        Converters.convertDriveRouteResult(navi.naviPaths)
      }
      
      android.util.Log.d("RouteCalculateListener", "转换结果: $result")
      currentPromise?.resolve(result)
      currentPromise = null
      
      module.sendEvent("onCalculateRouteSuccess", result)
    } catch (e: Exception) {
      android.util.Log.e("RouteCalculateListener", "处理路径规划结果时出错", e)
      currentPromise?.reject("CALCULATE_ERROR", e.message, e)
      currentPromise = null
    }
  }

  @Deprecated("Deprecated in Java")
  override fun onCalculateRouteFailure(errorCode: Int) {
    val errorMsg = "Route calculation failed with code: $errorCode"
    currentPromise?.reject("CALCULATE_ERROR", errorMsg, null)
    currentPromise = null
    
    module.sendEvent("onCalculateRouteFailure", mapOf("errorCode" to errorCode))
  }
  
  override fun onCalculateRouteFailure(routeResult: AMapCalcRouteResult?) {
    val errorCode = routeResult?.errorCode ?: -1
    val errorMsg = "Route calculation failed with code: $errorCode"
    
    android.util.Log.e("RouteCalculateListener", "onCalculateRouteFailure 被调用")
    android.util.Log.e("RouteCalculateListener", "错误码: $errorCode")
    android.util.Log.e("RouteCalculateListener", "错误信息: ${routeResult?.errorDescription}")
    
    currentPromise?.reject("CALCULATE_ERROR", errorMsg, null)
    currentPromise = null
    
    module.sendEvent("onCalculateRouteFailure", mapOf("errorCode" to errorCode))
  }

  // 以下是必须实现但暂不使用的接口方法
  override fun onNaviInfoUpdate(info: NaviInfo?) {}
  override fun onStartNavi(type: Int) {}
  override fun onEndEmulatorNavi() {}
  override fun onArriveDestination() {}
  override fun onReCalculateRouteForYaw() {}
  override fun onReCalculateRouteForTrafficJam() {}
  override fun onGetNavigationText(type: Int, text: String?) {}
  @Deprecated("Deprecated in Java")
  override fun onGetNavigationText(text: String?) {}
  override fun onTrafficStatusUpdate() {}
  override fun onGpsOpenStatus(enabled: Boolean) {}
  override fun onLocationChange(location: AMapNaviLocation?) {}
  override fun updateCameraInfo(cameras: Array<out AMapNaviCameraInfo>?) {}
  override fun updateIntervalCameraInfo(camera: AMapNaviCameraInfo?, camera2: AMapNaviCameraInfo?, type: Int) {}
  override fun onServiceAreaUpdate(infos: Array<out AMapServiceAreaInfo>?) {}
  override fun showCross(bitmap: AMapNaviCross?) {}
  override fun hideCross() {}
  override fun showModeCross(crossInfo: AMapModelCross?) {}
  override fun hideModeCross() {}
  @Deprecated("Deprecated in Java")
  override fun showLaneInfo(laneInfos: Array<out AMapLaneInfo>?, laneBackgroundInfo: ByteArray?, laneRecommendedInfo: ByteArray?) {}
    override fun showLaneInfo(p0: AMapLaneInfo?) {

    }

    override fun hideLaneInfo() {}
  @Deprecated("Deprecated in Java")
  override fun notifyParallelRoad(parallelRoadType: Int) {}
  override fun onArrivedWayPoint(wayPointIndex: Int) {}
  override fun onNaviRouteNotify(notifyData: AMapNaviRouteNotifyData?) {}
  override fun onGpsSignalWeak(isWeak: Boolean) {}
  @Deprecated("Deprecated in Java")
  override fun OnUpdateTrafficFacility(trafficFacilityInfo: AMapNaviTrafficFacilityInfo?) {}
  @Deprecated("Deprecated in Java")
  override fun OnUpdateTrafficFacility(aMapNaviTrafficFacilityInfos: Array<out AMapNaviTrafficFacilityInfo>?) {}
  @Deprecated("Deprecated in Java")
  override fun updateAimlessModeStatistics(aimlessModeStatistics: AimLessModeStat?) {}
  @Deprecated("Deprecated in Java")
  override fun updateAimlessModeCongestionInfo(aimlessModeStatistics: AimLessModeCongestionInfo?) {}
  override fun onPlayRing(ring: Int) {}
}