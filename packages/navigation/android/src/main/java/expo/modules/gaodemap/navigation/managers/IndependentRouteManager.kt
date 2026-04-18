package expo.modules.gaodemap.navigation.managers

import android.content.Context
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.enums.NaviType
import com.amap.api.navi.model.AMapNaviPathGroup

/**
 * 独立路径组管理器
 *
 * - 负责存储/选择/启动/清理独立路径组，避免 ExpoGaodeMapNavigationModule 过于臃肿
 * - 提供线程安全的 token 管理
 */
class IndependentRouteManager {
  data class StartResult(
    val success: Boolean,
    val message: String,
    val requestedNaviType: Int,
    val sdkNaviType: Int,
    val resolvedRouteId: Int?,
    val pathCount: Int,
    val mainPathIndex: Int
  )

  companion object {
    val shared: IndependentRouteManager by lazy { IndependentRouteManager() }
  }

  private val groups = mutableMapOf<Int, AMapNaviPathGroup>()
  private var nextToken = 1

  @Synchronized
  fun store(group: AMapNaviPathGroup): Int {
    val token = nextToken++
    groups[token] = group
    return token
  }

  @Synchronized
  fun get(token: Int): AMapNaviPathGroup {
    return groups[token] ?: throw Exception("invalid token")
  }

  /**
   * 选主路线：
   * - routeId: SDK 约定 12/13/14...
   * - routeIndex: 0/1/2（内部转换为 12+index）
   */
  @Synchronized
  fun select(token: Int, routeId: Int?, routeIndex: Int?): Boolean {
    val group = get(token)
    return when {
      routeId != null -> group.selectRouteWithIndex(routeId)
      routeIndex != null -> group.selectRouteWithIndex(12 + routeIndex)
      else -> true // 未提供则保持当前主路线
    }
  }

  /**
   * 启动导航（可在启动前进行选路）
   * - naviType: 0=GPS, 1=EMULATOR
   */
  private fun resolveRouteId(group: AMapNaviPathGroup, routeId: Int?, routeIndex: Int?): Int? {
    return when {
      routeId != null -> routeId
      routeIndex == null -> null
      routeIndex < 0 || routeIndex >= group.pathCount -> Int.MIN_VALUE
      else -> 12 + routeIndex
    }
  }

  private fun resolveSdkNaviType(requestedNaviType: Int): Int {
    return when (requestedNaviType) {
      1, NaviType.EMULATOR -> NaviType.EMULATOR
      else -> NaviType.GPS
    }
  }

  @Synchronized
  fun start(context: Context, token: Int, naviType: Int, routeId: Int?, routeIndex: Int?): StartResult {
    try {
      val group = get(token)
      val navi = AMapNavi.getInstance(context)

      val resolvedRouteId = resolveRouteId(group, routeId, routeIndex)
      val sdkNaviType = resolveSdkNaviType(naviType)

      if (resolvedRouteId == Int.MIN_VALUE) {
        return StartResult(
          success = false,
          message = "独立路径导航启动失败：routeIndex 超出范围，当前仅有 ${group.pathCount} 条路线",
          requestedNaviType = naviType,
          sdkNaviType = sdkNaviType,
          resolvedRouteId = null,
          pathCount = group.pathCount,
          mainPathIndex = group.mainPathIndex
        )
      }

      if (resolvedRouteId != null) {
        val selected = group.selectRouteWithIndex(resolvedRouteId)
        if (!selected) {
          return StartResult(
            success = false,
            message = "独立路径导航启动失败：路线选择失败 routeId=$resolvedRouteId",
            requestedNaviType = naviType,
            sdkNaviType = sdkNaviType,
            resolvedRouteId = resolvedRouteId,
            pathCount = group.pathCount,
            mainPathIndex = group.mainPathIndex
          )
        }
      }

      val result = navi.startNaviWithPath(sdkNaviType, group)
      if (!result) {
        android.util.Log.e(
          "IndependentRouteManager",
          "startNaviWithPath failed: token=$token requestedNaviType=$naviType sdkNaviType=$sdkNaviType routeId=$resolvedRouteId pathCount=${group.pathCount} mainPathIndex=${group.mainPathIndex}"
        )
        return StartResult(
          success = false,
          message = "独立路径导航启动失败：高德 SDK 未接受该路径组（requestedNaviType=$naviType, sdkNaviType=$sdkNaviType）",
          requestedNaviType = naviType,
          sdkNaviType = sdkNaviType,
          resolvedRouteId = resolvedRouteId,
          pathCount = group.pathCount,
          mainPathIndex = group.mainPathIndex
        )
      }

      return StartResult(
        success = true,
        message = "独立路径导航启动成功",
        requestedNaviType = naviType,
        sdkNaviType = sdkNaviType,
        resolvedRouteId = resolvedRouteId,
        pathCount = group.pathCount,
        mainPathIndex = group.mainPathIndex
      )
    } catch (e: Exception) {
      android.util.Log.e("IndependentRouteManager", "Start navigation failed", e)
      return StartResult(
        success = false,
        message = "独立路径导航启动失败：${e.message ?: "unknown"}",
        requestedNaviType = naviType,
        sdkNaviType = resolveSdkNaviType(naviType),
        resolvedRouteId = routeId,
        pathCount = 0,
        mainPathIndex = 0
      )
    }
  }

  @Synchronized
  fun clear(token: Int): Boolean {
    return groups.remove(token) != null
  }

  @Synchronized
  fun clearAll() {
    groups.clear()
    nextToken = 1
  }
}
