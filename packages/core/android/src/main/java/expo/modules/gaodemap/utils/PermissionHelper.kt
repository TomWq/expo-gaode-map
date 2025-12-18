package expo.modules.gaodemap.utils

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * Android 14+ 权限适配助手
 * 
 * 主要变化：
 * 1. Android 14 (API 34) 引入了更精细的位置权限
 * 2. 需要同时请求前台和后台位置权限
 * 3. 权限请求流程更加严格
 */
object PermissionHelper {
    
    /**
     * 位置权限类型
     */
    enum class LocationPermissionType {
        FOREGROUND,      // 仅前台位置
        BACKGROUND,      // 后台位置
        FOREGROUND_AND_BACKGROUND  // 前台+后台
    }
    
    /**
     * 权限状态
     */
    data class PermissionStatus(
        val granted: Boolean,
        val shouldShowRationale: Boolean,
        val isPermanentlyDenied: Boolean,
        val fineLocation: Boolean = false,
        val coarseLocation: Boolean = false,
        val backgroundLocation: Boolean = false
    )
    
    /**
     * 检查是否为 Android 14+
     */
    fun isAndroid14Plus(): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE // API 34
    }
    
    /**
     * 检查是否为 Android 10+（引入后台位置权限）
     */
    fun isAndroid10Plus(): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q // API 29
    }
    
    /**
     * 获取需要请求的前台位置权限列表
     */
    fun getForegroundLocationPermissions(): Array<String> {
        return arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
    }
    
    /**
     * 获取后台位置权限
     */
    fun getBackgroundLocationPermission(): String? {
        return if (isAndroid10Plus()) {
            Manifest.permission.ACCESS_BACKGROUND_LOCATION
        } else {
            null
        }
    }
    
    /**
     * 检查前台位置权限状态
     */
    fun checkForegroundLocationPermission(context: Context): PermissionStatus {
        val fineGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        val coarseGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        val granted = fineGranted && coarseGranted
        
        val activity = context as? Activity
        val shouldShowRationale = if (activity != null && !granted) {
            ActivityCompat.shouldShowRequestPermissionRationale(
                activity,
                Manifest.permission.ACCESS_FINE_LOCATION
            )
        } else {
            false
        }
        
        return PermissionStatus(
            granted = granted,
            shouldShowRationale = shouldShowRationale,
            isPermanentlyDenied = !granted && !shouldShowRationale && activity != null,
            fineLocation = fineGranted,
            coarseLocation = coarseGranted
        )
    }
    
    /**
     * 检查后台位置权限状态
     */
    fun checkBackgroundLocationPermission(context: Context): PermissionStatus {
        val permission = getBackgroundLocationPermission()
        if (permission == null) {
            // Android 10 以下不支持后台位置权限
            return PermissionStatus(
                granted = true,
                shouldShowRationale = false,
                isPermanentlyDenied = false,
                backgroundLocation = true
            )
        }
        
        val granted = ContextCompat.checkSelfPermission(
            context,
            permission
        ) == PackageManager.PERMISSION_GRANTED
        
        val activity = context as? Activity
        val shouldShowRationale = if (activity != null && !granted) {
            ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
        } else {
            false
        }
        
        return PermissionStatus(
            granted = granted,
            shouldShowRationale = shouldShowRationale,
            isPermanentlyDenied = !granted && !shouldShowRationale && activity != null,
            backgroundLocation = granted
        )
    }
    
    /**
     * 检查完整位置权限状态（前台+后台）
     */
    fun checkFullLocationPermission(context: Context): PermissionStatus {
        val foreground = checkForegroundLocationPermission(context)
        val background = checkBackgroundLocationPermission(context)
        
        return PermissionStatus(
            granted = foreground.granted && background.granted,
            shouldShowRationale = foreground.shouldShowRationale || background.shouldShowRationale,
            isPermanentlyDenied = foreground.isPermanentlyDenied || background.isPermanentlyDenied,
            fineLocation = foreground.fineLocation,
            coarseLocation = foreground.coarseLocation,
            backgroundLocation = background.backgroundLocation
        )
    }
    
    /**
     * 请求前台位置权限
     * Android 14+ 推荐的请求流程
     */
    fun requestForegroundLocationPermission(activity: Activity, requestCode: Int) {
        val permissions = getForegroundLocationPermissions()
        ActivityCompat.requestPermissions(activity, permissions, requestCode)
    }
    
    /**
     * 请求后台位置权限
     * 注意：必须在前台权限已授予后才能请求
     */
    fun requestBackgroundLocationPermission(activity: Activity, requestCode: Int): Boolean {
        val permission = getBackgroundLocationPermission()
        if (permission == null) {
            return false
        }
        
        // 检查前台权限是否已授予
        val foregroundStatus = checkForegroundLocationPermission(activity)
        if (!foregroundStatus.granted) {
            return false
        }
        
        ActivityCompat.requestPermissions(activity, arrayOf(permission), requestCode)
        return true
    }
    
    /**
     * 打开应用设置页面
     * 用于引导用户手动授予权限
     */
    fun openAppSettings(context: Context) {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", context.packageName, null)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }
    
    /**
     * 获取权限请求的推荐提示文案（Android 14+ 优化）
     */
    fun getPermissionRationale(
        type: LocationPermissionType,
        isAndroid14: Boolean = isAndroid14Plus()
    ): String {
        return when (type) {
            LocationPermissionType.FOREGROUND -> {
                if (isAndroid14) {
                    "为了在地图上显示您的位置，应用需要访问您的位置信息。\n\n" +
                    "您可以选择：\n" +
                    "• 仅在使用应用时允许\n" +
                    "• 每次询问\n\n" +
                    "我们不会在后台收集您的位置数据。"
                } else {
                    "为了在地图上显示您的位置，应用需要访问您的位置信息。"
                }
            }
            LocationPermissionType.BACKGROUND -> {
                if (isAndroid14) {
                    "为了在后台更新您的位置（如导航、轨迹记录），应用需要始终访问位置权限。\n\n" +
                    "您可以随时在设置中更改此权限。"
                } else {
                    "为了在后台更新您的位置，应用需要始终访问位置权限。"
                }
            }
            LocationPermissionType.FOREGROUND_AND_BACKGROUND -> {
                if (isAndroid14) {
                    "应用需要位置权限来提供以下功能：\n" +
                    "• 在地图上显示您的位置（前台）\n" +
                    "• 后台导航和轨迹记录（后台）\n\n" +
                    "我们会先请求前台权限，然后再请求后台权限。"
                } else {
                    "应用需要位置权限来显示地图位置和后台导航功能。"
                }
            }
        }
    }
}