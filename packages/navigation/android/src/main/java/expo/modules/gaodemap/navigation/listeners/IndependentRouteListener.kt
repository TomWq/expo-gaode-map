package expo.modules.gaodemap.navigation.listeners

import android.util.Log
import com.amap.api.navi.AMapNaviIndependentRouteListener
import com.amap.api.navi.model.AMapCalcRouteResult
import com.amap.api.navi.model.AMapNaviPathGroup
import expo.modules.gaodemap.navigation.ExpoGaodeMapNavigationModule
import expo.modules.gaodemap.navigation.utils.Converters
import expo.modules.kotlin.Promise

/**
 * 独立路径规划监听器
 *
 * - 对应 AMapNavi.independentCalculateRoute 的结果回调
 * - 将 AMapNaviPathGroup 转换为 JS 可消费的数据结构
 */
class IndependentRouteListener(
  private val module: ExpoGaodeMapNavigationModule,
  private val promise: Promise
) : AMapNaviIndependentRouteListener {
  companion object {
    private const val TAG = "IndependentRouteListener"
  }

  override fun onIndependentCalculateSuccess(group: AMapNaviPathGroup?) {
    try {
      if (group == null) {
        promise.reject("INDEPENDENT_CALCULATE_ERROR", "Path group is null", null)
        module.sendEvent("onCalculateRouteFailure", mapOf("errorCode" to -1, "error" to "Path group is null"))
        return
      }

      // 将路径组存储在模块内，返回一个可供后续操作（选路/启动导航/清理）的 token
      val token = module.storeIndependentGroup(group)
      logGroupSummary(group, token)

      val result = convertGroupToResult(group).toMutableMap().apply {
        put("token", token)
      }
      promise.resolve(result)
      module.sendEvent("onCalculateRouteSuccess", result)
    } catch (e: Exception) {
      promise.reject("INDEPENDENT_CALCULATE_ERROR", e.message, e)
      module.sendEvent("onCalculateRouteFailure", mapOf("errorCode" to -1, "error" to (e.message ?: "unknown")))
    }
  }

  override fun onIndependentCalculateFail(routeResult: AMapCalcRouteResult?) {
    val errorCode = routeResult?.errorCode ?: -1
    Log.e(TAG, "independentCalculateRoute failed: errorCode=$errorCode result=$routeResult")
    val errorMsg = "Independent route calculation failed with code: $errorCode"
    promise.reject("INDEPENDENT_CALCULATE_ERROR", errorMsg, null)
    module.sendEvent("onCalculateRouteFailure", mapOf("errorCode" to errorCode))
  }

  private fun logGroupSummary(group: AMapNaviPathGroup, token: Int) {
    val count = try { group.pathCount } catch (_: Exception) { -1 }
    val mainIndex = try { group.mainPathIndex } catch (_: Exception) { -1 }
    Log.d(TAG, "independentCalculateRoute success: token=$token pathCount=$count mainPathIndex=$mainIndex")

    for (index in 0 until maxOf(count, 0)) {
      try {
        val path = group.getPath(index)
        Log.d(
          TAG,
          "path[$index]: routeId=${12 + index} length=${path.allLength} time=${path.allTime} toll=${path.tollCost} trafficLights=${path.trafficLightCount} coordCount=${path.coordList?.size ?: 0}"
        )
      } catch (error: Exception) {
        Log.e(TAG, "failed to inspect path[$index]", error)
      }
    }
  }

  /**
   * 将 AMapNaviPathGroup 转换为轻量结构：
   * {
   *   independent: true,
   *   count: number,
   *   mainPathIndex: number,
   *   routeIds: number[],   // 12/13/14 ...
   *   routes: RouteResult[] // 复用 Converters.convertNaviPath
   * }
   */
  private fun convertGroupToResult(group: AMapNaviPathGroup): Map<String, Any?> {
    val count = try { group.pathCount } catch (_: Exception) { 0 }
    val mainIndex = try { group.mainPathIndex } catch (_: Exception) { 0 }

    val routes = ArrayList<Map<String, Any?>>(count)
    val routeIds = ArrayList<Int>(count)

    for (i in 0 until count) {
      try {
        val path = group.getPath(i)
        val routeId = 12 + i
        val converted = Converters.convertNaviPath(path, routeId)
        routes.add(converted)
        // 文档说明：第一条为12，第二条为13，第三条为14
        routeIds.add(routeId)
      } catch (_: Exception) {
        // 忽略单条路线转换失败，保持稳健性
      }
    }

    return mapOf(
      "independent" to true,
      "count" to count,
      "mainPathIndex" to mainIndex,
      "routeIds" to routeIds,
      "routes" to routes
    )
  }
}
