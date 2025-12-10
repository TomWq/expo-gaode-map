package expo.modules.gaodemap.navigation.managers

import android.content.Context
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.model.AMapNaviPathGroup

/**
 * 独立路径组管理器
 *
 * - 负责存储/选择/启动/清理独立路径组，避免 ExpoGaodeMapNavigationModule 过于臃肿
 * - 提供线程安全的 token 管理
 */
class IndependentRouteManager {
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
  @Synchronized
  fun start(context: Context, token: Int, naviType: Int, routeId: Int?, routeIndex: Int?): Boolean {
    try {
      val group = get(token)
      val navi = AMapNavi.getInstance(context)
      
      // 选择路线
      if (routeId != null) {
        group.selectRouteWithIndex(routeId)
      } else if (routeIndex != null) {
        group.selectRouteWithIndex(12 + routeIndex)
      }
      
      // 启动导航
      val result = navi.startNaviWithPath(naviType, group)
      if (!result) {
        android.util.Log.e("IndependentRouteManager", "startNaviWithPath failed: naviType=$naviType")
      }
      return result
    } catch (e: Exception) {
      android.util.Log.e("IndependentRouteManager", "Start navigation failed", e)
      return false
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