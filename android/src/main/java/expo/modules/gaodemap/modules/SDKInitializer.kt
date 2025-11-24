package expo.modules.gaodemap.modules

import android.content.Context
import android.util.Log
import com.amap.api.location.AMapLocationClient
import com.amap.api.maps.MapsInitializer

/**
 * SDK 初始化管理器
 * 
 * 负责:
 * - 初始化高德地图 SDK
 * - 初始化高德定位 SDK
 * - 设置隐私合规
 * - 获取 SDK 版本信息
 */
object SDKInitializer {
    private const val TAG = "SDKInitializer"

    /**
     * 初始化高德地图和定位 SDK
     * 
     * @param context 应用上下文
     * @param androidKey Android 平台的 API Key
     * @throws Exception 初始化失败时抛出异常
     */
    fun initSDK(context: Context, androidKey: String) {
        try {
            // 更新地图隐私合规
            MapsInitializer.updatePrivacyShow(context, true, true)
            MapsInitializer.updatePrivacyAgree(context, true)
            MapsInitializer.setApiKey(androidKey)
            
            // 更新定位隐私合规
            AMapLocationClient.updatePrivacyShow(context, true, true)
            AMapLocationClient.updatePrivacyAgree(context, true)
            AMapLocationClient.setApiKey(androidKey)
            
        } catch (e: Exception) {
            throw Exception("SDK 初始化失败: ${e.message}")
        }
    }

    /**
     * 获取 SDK 版本号
     * 
     * @return SDK 版本字符串
     */
    fun getVersion(): String {
        return MapsInitializer.getVersion()
    }
}
