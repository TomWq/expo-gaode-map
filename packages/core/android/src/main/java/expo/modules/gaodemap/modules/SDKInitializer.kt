package expo.modules.gaodemap.modules

import android.content.Context
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
    
    /** 隐私协议是否已同意（进程内缓存） */
    private var privacyAgreed = true


    
    fun restorePrivacyState(context: Context) {
        try {
            // 同步到 SDK
            MapsInitializer.updatePrivacyShow(context, true, true)
            AMapLocationClient.updatePrivacyShow(context, true, true)
            MapsInitializer.updatePrivacyAgree(context, privacyAgreed)
            AMapLocationClient.updatePrivacyAgree(context, privacyAgreed)
        } catch (e: Exception) {
            android.util.Log.w("ExpoGaodeMap", "恢复隐私状态失败: ${e.message}")
        }
    }

    /**
     * 初始化高德地图和定位 SDK
     *
     * @param context 应用上下文
     * @param androidKey Android 平台的 API Key
     * @throws Exception 初始化失败时抛出异常
     */
    fun initSDK(context: Context, androidKey: String) {
        // 检查隐私协议状态
        if (!privacyAgreed) {
            // 使用 Kotlin 模块的 CodedException，让 JS 能收到标准化异常
            throw expo.modules.kotlin.exception.CodedException("用户未同意隐私协议，无法初始化 SDK")
        }
        
        try {
            // 设置 API Key
            MapsInitializer.setApiKey(androidKey)
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
