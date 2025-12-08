package expo.modules.gaodemap.map.modules

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
    
    /** 隐私协议是否已同意 */
    private var privacyAgreed = false
    
    /**
     * 更新隐私合规状态
     * 必须在用户同意隐私协议后调用
     *
     * @param context 应用上下文
     * @param hasAgreed 用户是否已同意隐私协议
     */
    fun updatePrivacyCompliance(context: Context, hasAgreed: Boolean) {
        privacyAgreed = hasAgreed
        
        // 先更新隐私信息显示状态
        MapsInitializer.updatePrivacyShow(context, true, true)
        AMapLocationClient.updatePrivacyShow(context, true, true)
        
        // 根据用户选择更新同意状态
        if (hasAgreed) {
            MapsInitializer.updatePrivacyAgree(context, true)
            AMapLocationClient.updatePrivacyAgree(context, true)
            android.util.Log.d("ExpoGaodeMap", "✅ 用户已同意隐私协议，可以使用 SDK")
        } else {
            MapsInitializer.updatePrivacyAgree(context, false)
            AMapLocationClient.updatePrivacyAgree(context, false)
            android.util.Log.w("ExpoGaodeMap", "⚠️ 用户未同意隐私协议，SDK 功能将受限")
        }
    }
    
    /**
     * 检查隐私协议是否已同意
     *
     * @return 是否已同意隐私协议
     */
    fun isPrivacyAgreed(): Boolean = privacyAgreed

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
            
            android.util.Log.d("ExpoGaodeMap", "✅ SDK 初始化成功")
            
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
