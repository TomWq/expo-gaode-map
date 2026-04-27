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
    private const val PREFS_NAME = "expo_gaodemap_privacy"
    private const val KEY_PRIVACY_SHOWN = "privacy_shown"
    private const val KEY_PRIVACY_CONTAINS = "privacy_contains"
    private const val KEY_PRIVACY_AGREED = "privacy_agreed"
    private const val KEY_PRIVACY_VERSION = "privacy_version"
    private const val KEY_AGREED_PRIVACY_VERSION = "agreed_privacy_version"

    private var privacyAgreed = false
    private var privacyShown = false
    private var privacyContains = false
    private var privacyVersion: String? = null
    private var agreedPrivacyVersion: String? = null
    private var restoredFromStorage = false

    private fun resolveContext(context: Context): Context {
        return context.applicationContext ?: context
    }

    private fun prefs(context: Context) =
        resolveContext(context).getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun restorePersistedState(context: Context) {
        val appContext = resolveContext(context)
        val preferences = prefs(appContext)

        privacyShown = preferences.getBoolean(KEY_PRIVACY_SHOWN, false)
        privacyContains = preferences.getBoolean(KEY_PRIVACY_CONTAINS, false)
        privacyAgreed = preferences.getBoolean(KEY_PRIVACY_AGREED, false)
        privacyVersion = preferences.getString(KEY_PRIVACY_VERSION, null)
        agreedPrivacyVersion = preferences.getString(KEY_AGREED_PRIVACY_VERSION, null)
        restoredFromStorage = true

        if (!privacyVersion.isNullOrEmpty() &&
            !agreedPrivacyVersion.isNullOrEmpty() &&
            privacyVersion != agreedPrivacyVersion
        ) {
            clearConsentPersistedState(appContext, keepCurrentVersion = true)
        }

        applyPrivacyState(appContext)
    }

    fun setPrivacyVersion(context: Context, version: String) {
        val sanitizedVersion = version.trim().takeIf { it.isNotEmpty() }
        privacyVersion = sanitizedVersion

        val appContext = resolveContext(context)
        if (!privacyVersion.isNullOrEmpty() &&
            !agreedPrivacyVersion.isNullOrEmpty() &&
            privacyVersion != agreedPrivacyVersion
        ) {
            clearConsentPersistedState(appContext, keepCurrentVersion = true)
        } else {
            persistState(appContext)
        }

        applyPrivacyState(appContext)
    }

    fun setPrivacyConfig(
        context: Context,
        hasShow: Boolean,
        hasContainsPrivacy: Boolean,
        hasAgree: Boolean,
        version: String?,
        shouldUpdateVersion: Boolean
    ) {
        val appContext = resolveContext(context)

        if (shouldUpdateVersion) {
            privacyVersion = version?.trim()?.takeIf { it.isNotEmpty() }
        }
        privacyShown = hasShow
        privacyContains = hasContainsPrivacy
        privacyAgreed = hasAgree
        agreedPrivacyVersion = if (hasAgree) privacyVersion else null

        persistState(appContext)
        applyPrivacyState(appContext)
    }

    fun resetPrivacyConsent(context: Context) {
        val appContext = resolveContext(context)
        clearConsentPersistedState(appContext, keepCurrentVersion = false)
        applyPrivacyState(appContext)
    }

    fun applyPrivacyState(context: Context) {
        val appContext = resolveContext(context)
        try {
            MapsInitializer.updatePrivacyShow(appContext, privacyShown, privacyContains)
            AMapLocationClient.updatePrivacyShow(appContext, privacyShown, privacyContains)
            MapsInitializer.updatePrivacyAgree(appContext, privacyAgreed)
            AMapLocationClient.updatePrivacyAgree(appContext, privacyAgreed)
            applyNavigationPrivacyState(appContext)
        } catch (e: Exception) {
            android.util.Log.w("ExpoGaodeMap", "同步隐私状态失败: ${e.message}")
        }
    }

    fun isPrivacyReady(): Boolean {
        return privacyShown && privacyContains && privacyAgreed
    }

    fun getPrivacyStatus(): Map<String, Any?> {
        return mapOf(
            "hasShow" to privacyShown,
            "hasContainsPrivacy" to privacyContains,
            "hasAgree" to privacyAgreed,
            "isReady" to isPrivacyReady(),
            "privacyVersion" to privacyVersion,
            "agreedPrivacyVersion" to agreedPrivacyVersion,
            "restoredFromStorage" to restoredFromStorage,
        )
    }

    /**
     * 初始化高德地图和定位 SDK
     *
     * @param context 应用上下文
     * @param androidKey Android 平台的 API Key
     * @throws Exception 初始化失败时抛出异常
     */
    fun initSDK(context: Context, androidKey: String) {
        val appContext = resolveContext(context)
        restorePersistedState(appContext)
        // 检查隐私协议状态
        if (!isPrivacyReady()) {
            throw expo.modules.kotlin.exception.CodedException(
                "PRIVACY_NOT_AGREED",
                "隐私协议未完成确认，请先调用 setPrivacyConfig",
                null
            )
        }
        
        try {
            applyPrivacyState(appContext)
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

    private fun persistState(context: Context) {
        prefs(context).edit()
            .putBoolean(KEY_PRIVACY_SHOWN, privacyShown)
            .putBoolean(KEY_PRIVACY_CONTAINS, privacyContains)
            .putBoolean(KEY_PRIVACY_AGREED, privacyAgreed)
            .putString(KEY_PRIVACY_VERSION, privacyVersion)
            .putString(KEY_AGREED_PRIVACY_VERSION, agreedPrivacyVersion)
            .apply()
    }

    private fun clearConsentPersistedState(context: Context, keepCurrentVersion: Boolean) {
        privacyShown = false
        privacyContains = false
        privacyAgreed = false
        agreedPrivacyVersion = null

        val editor = prefs(context).edit()
            .putBoolean(KEY_PRIVACY_SHOWN, false)
            .putBoolean(KEY_PRIVACY_CONTAINS, false)
            .putBoolean(KEY_PRIVACY_AGREED, false)
            .remove(KEY_AGREED_PRIVACY_VERSION)

        if (keepCurrentVersion) {
            editor.putString(KEY_PRIVACY_VERSION, privacyVersion)
        } else {
            privacyVersion = null
            editor.remove(KEY_PRIVACY_VERSION)
        }

        editor.apply()
    }

    /**
     * 导航 SDK 隐私同步（NaviSetting）
     *
     * 说明：
     * - 导航 SDK 需要在 AMapNavi.getInstance(...) 前调用 updatePrivacyShow/updatePrivacyAgree。
     * - 使用反射兼容不同版本导航 SDK（某些版本可能不存在 NaviSetting 或方法签名变化）。
     */
    private fun applyNavigationPrivacyState(context: Context) {
        try {
            val naviSettingClass = Class.forName("com.amap.api.navi.NaviSetting")
            val updatePrivacyShow = naviSettingClass.getDeclaredMethod(
                "updatePrivacyShow",
                Context::class.java,
                Boolean::class.javaPrimitiveType,
                Boolean::class.javaPrimitiveType
            )
            val updatePrivacyAgree = naviSettingClass.getDeclaredMethod(
                "updatePrivacyAgree",
                Context::class.java,
                Boolean::class.javaPrimitiveType
            )

            // NaviSetting.updatePrivacyShow(context, isContains, isShow)
            updatePrivacyShow.invoke(null, context, privacyContains, privacyShown)
            updatePrivacyAgree.invoke(null, context, privacyAgreed)
        } catch (e: ClassNotFoundException) {
            android.util.Log.w("ExpoGaodeMap", "未检测到 NaviSetting，跳过导航隐私同步: ${e.message}")
        } catch (e: NoSuchMethodException) {
            android.util.Log.w("ExpoGaodeMap", "NaviSetting 隐私方法签名不匹配，跳过导航隐私同步: ${e.message}")
        } catch (e: Exception) {
            android.util.Log.w("ExpoGaodeMap", "同步导航 SDK 隐私状态失败: ${e.message}")
        }
    }
}
