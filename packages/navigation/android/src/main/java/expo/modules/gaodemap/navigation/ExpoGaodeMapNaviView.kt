package expo.modules.gaodemap.navigation

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.ViewGroup
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.AMapNaviListener
import com.amap.api.navi.AMapNaviView
import com.amap.api.navi.AMapNaviViewListener
import com.amap.api.navi.AMapNaviViewOptions
import com.amap.api.maps.model.BitmapDescriptorFactory
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.Marker
import com.amap.api.maps.model.MarkerOptions
import com.amap.api.navi.enums.MapStyle
import com.amap.api.navi.enums.NaviType
import com.amap.api.navi.model.*
import expo.modules.gaodemap.map.modules.SDKInitializer
import expo.modules.gaodemap.navigation.managers.IndependentRouteManager
import expo.modules.gaodemap.navigation.services.NavigationForegroundService
import expo.modules.gaodemap.navigation.services.NavigationNotificationSnapshot
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.Collections
import java.util.WeakHashMap
import java.net.URL
import kotlin.math.roundToInt

private data class NaviCustomWaypointMarkerModel(
    val latitude: Double,
    val longitude: Double,
    val title: String,
    val arrived: Boolean = false
)

@SuppressLint("ViewConstructor")
@Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
class ExpoGaodeMapNaviView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
    companion object {
        private val activeViews =
            Collections.newSetFromMap(WeakHashMap<ExpoGaodeMapNaviView, Boolean>())

        private fun snapshotActiveViews(): List<ExpoGaodeMapNaviView> =
            synchronized(activeViews) { activeViews.toList() }

        fun resumeActiveViews() {
            snapshotActiveViews().forEach { it.onHostActivityForeground() }
        }

        fun pauseActiveViews() {
            snapshotActiveViews().forEach { it.onHostActivityBackground() }
        }

        fun destroyActiveViews() {
            snapshotActiveViews().forEach { it.onDestroy() }
        }
    }

    private val independentRouteManager = IndependentRouteManager.shared
    
    // 事件派发器
    private val onNavigationReady by EventDispatcher()
    private val onNavigationStarted by EventDispatcher()
    private val onNavigationFailed by EventDispatcher()
    private val onNavigationEnded by EventDispatcher()
    private val onLocationUpdate by EventDispatcher()
    private val onNavigationText by EventDispatcher()
    private val onArriveDestination by EventDispatcher()
    private val onRouteCalculated by EventDispatcher()
    private val onRouteRecalculate by EventDispatcher()
    private val onWayPointArrived by EventDispatcher()
    private val onGpsStatusChanged by EventDispatcher()
    private val onNavigationInfoUpdate by EventDispatcher()
    private val onGpsSignalWeak by EventDispatcher()
    private val onNavigationVisualStateUpdate by EventDispatcher()
    private val onLaneInfoUpdate by EventDispatcher()
    private val onTrafficStatusesUpdate by EventDispatcher()
    
    // Props - 使用 internal 避免自动生成 setter
    internal var showCamera: Boolean = true
    internal var naviType: Int = NaviType.GPS
    internal var enableVoice: Boolean = true


    internal var androidStatusBarPaddingTopDp: Double? = null

    internal var showUIElements: Boolean = true
    internal var androidTrafficBarEnabled: Boolean = true
    internal var isRouteListButtonShow: Boolean = true
    internal var isTrafficButtonVisible: Boolean = true
    internal var autoChangeZoom : Boolean = true
    internal var autoLockCar: Boolean = true
    internal var isTrafficLineEnabled: Boolean = true
    internal var isRealCrossDisplayShow : Boolean = true
    internal var isNaviArrowVisible : Boolean = true
    internal var isLaneInfoVisible: Boolean = true
    internal var isModeCrossDisplayVisible: Boolean = true
    internal var isEyrieCrossDisplayVisible: Boolean = true
    internal var isSecondActionVisible: Boolean = true
    internal var isBackupOverlayVisible: Boolean = true
    internal var isAfterRouteAutoGray: Boolean = true
    internal var isVectorLineShow: Boolean = true
    internal var isNaviTravelView : Boolean = false
    internal var isCompassEnabled: Boolean = true
    internal var isNaviStatusBarEnabled: Boolean = false
    internal var lockZoomLevel: Int = 18
    internal var lockTilt: Int = 35
    internal var isEagleMapVisible: Boolean = false
    internal var pointToCenterX: Double = 0.0
    internal var pointToCenterY: Double = 0.0
    internal var hideNativeTopInfoLayout: Boolean = false
    internal var androidBackgroundNavigationNotificationEnabled: Boolean = false
    internal var naviModeValue: Int = AMapNaviView.CAR_UP_MODE
    internal var mapViewModeTypeValue: Int = 0
    internal var carImageUri: String? = null
    internal var carImageWidthDp: Double? = null
    internal var carImageHeightDp: Double? = null
    internal var fourCornersImageUri: String? = null
    internal var startPointImageUri: String? = null
    internal var wayPointImageUri: String? = null
    internal var endPointImageUri: String? = null
    private var customWaypointMarkers: List<NaviCustomWaypointMarkerModel> = emptyList()
    private val renderedCustomWaypointMarkers = mutableListOf<Marker>()
    private var activeIndependentRouteId: Int? = null
    private val naviView: AMapNaviView by lazy(LazyThreadSafetyMode.NONE) {
        AMapNaviView(context)
    }
    private var aMapNavi: AMapNavi? = null
    private var startCoordinate: NaviLatLng? = null
    private var endCoordinate: NaviLatLng? = null

    private var lastAppliedTopPaddingPx: Int? = null
    private var isDestroyed = false
    private var isCrossVisible = false
    private var isModeCrossVisible = false
    private var isLaneInfoCurrentlyVisible = false
    private var currentRouteTotalLength: Int? = null
    private var sourceCarBitmap: Bitmap? = null
    private var customCarBitmap: Bitmap? = null
    private var customFourCornersBitmap: Bitmap? = null
    private var customStartPointBitmap: Bitmap? = null
    private var customWayPointBitmap: Bitmap? = null
    private var customEndPointBitmap: Bitmap? = null
    private var routeMarkerShowStartEndVia: Boolean = true
    private var routeMarkerShowFootFerry: Boolean = true
    private var routeMarkerShowForbidden: Boolean = true
    private var routeMarkerShowRouteStartIcon: Boolean = true
    private var routeMarkerShowRouteEndIcon: Boolean = true
    private var cachedTurnIconImageUri: String? = null
    private var cachedTurnIconContentHash: String? = null
    private var hasLoggedMissingTurnIconBitmapApi = false
    private var hasLoggedMissingNaviStatusBarApi = false
    private var hasLoggedMissingNaviModeApi = false
    private var isHostActivityInBackground: Boolean = false
    private var isNavigationRunning: Boolean = false
    private var latestNavigationNotificationSnapshot: NavigationNotificationSnapshot? = null

    private fun registerActiveView() {
        synchronized(activeViews) {
            activeViews.add(this)
        }
    }

    private fun unregisterActiveView() {
        synchronized(activeViews) {
            activeViews.remove(this)
        }
    }

    private fun buildNavigationNotificationSnapshot(naviInfo: NaviInfo?): NavigationNotificationSnapshot {
        if (naviInfo == null) {
            return latestNavigationNotificationSnapshot ?: NavigationNotificationSnapshot(
                pathRetainDistance = currentRouteTotalLength,
                routeTotalDistance = currentRouteTotalLength,
                turnIconImageUri = cachedTurnIconImageUri
            )
        }

        return NavigationNotificationSnapshot(
            currentRoadName = naviInfo.currentRoadName,
            nextRoadName = naviInfo.nextRoadName,
            pathRetainDistance = naviInfo.pathRetainDistance,
            routeTotalDistance = currentRouteTotalLength,
            pathRetainTime = naviInfo.pathRetainTime,
            curStepRetainDistance = naviInfo.curStepRetainDistance,
            iconType = naviInfo.iconType,
            turnIconImageUri = cachedTurnIconImageUri
        )
    }

    private fun shouldRunBackgroundNavigationNotification(): Boolean {
        return androidBackgroundNavigationNotificationEnabled &&
            isNavigationRunning &&
            isHostActivityInBackground
    }

    private fun syncNavigationForegroundService(reason: String) {
        val shouldRun = shouldRunBackgroundNavigationNotification()
        Log.d(
            "ExpoGaodeMapNaviView",
            "syncNavigationForegroundService reason=$reason, shouldRun=$shouldRun, " +
              "propEnabled=$androidBackgroundNavigationNotificationEnabled, " +
              "isNavigationRunning=$isNavigationRunning, isHostActivityInBackground=$isHostActivityInBackground"
        )
        if (shouldRunBackgroundNavigationNotification()) {
            val snapshot = latestNavigationNotificationSnapshot ?: buildNavigationNotificationSnapshot(null)
            Log.d(
                "ExpoGaodeMapNaviView",
                "startOrUpdate notification snapshot: stepDistance=${snapshot.curStepRetainDistance}, " +
                  "remainDistance=${snapshot.pathRetainDistance}, routeTotal=${snapshot.routeTotalDistance}, " +
                  "remainTime=${snapshot.pathRetainTime}, " +
                  "nextRoad=${snapshot.nextRoadName}, turnIconUri=${snapshot.turnIconImageUri}"
            )
            NavigationForegroundService.startOrUpdate(context, snapshot)
            Log.d("ExpoGaodeMapNaviView", "Navigation foreground notification enabled: $reason")
        } else {
            NavigationForegroundService.stop(context)
            Log.d("ExpoGaodeMapNaviView", "Navigation foreground notification disabled: $reason")
        }
    }

    private fun updateNavigationNotification(naviInfo: NaviInfo) {
        latestNavigationNotificationSnapshot = buildNavigationNotificationSnapshot(naviInfo)
        Log.d(
            "ExpoGaodeMapNaviView",
            "updateNavigationNotification: stepDistance=${naviInfo.curStepRetainDistance}, " +
              "remainDistance=${naviInfo.pathRetainDistance}, routeTotal=${latestNavigationNotificationSnapshot?.routeTotalDistance}, " +
              "remainTime=${naviInfo.pathRetainTime}, " +
              "currentRoad=${naviInfo.currentRoadName}, nextRoad=${naviInfo.nextRoadName}, " +
              "turnIconUri=${latestNavigationNotificationSnapshot?.turnIconImageUri}"
        )
        if (shouldRunBackgroundNavigationNotification()) {
            NavigationForegroundService.startOrUpdate(context, latestNavigationNotificationSnapshot)
        }
    }

    fun onHostActivityForeground() {
        Log.d("ExpoGaodeMapNaviView", "onHostActivityForeground")
        isHostActivityInBackground = false
        onResume()
        syncNavigationForegroundService("host_foreground")
    }

    fun onHostActivityBackground() {
        Log.d("ExpoGaodeMapNaviView", "onHostActivityBackground")
        isHostActivityInBackground = true
        onPause()
        syncNavigationForegroundService("host_background")
    }

    private fun applyNaviStatusBarEnabledCompat(
        options: AMapNaviViewOptions,
        enabled: Boolean
    ) {
        try {
            val method = options.javaClass.getMethod(
                "setNaviStatusBarEnabled",
                java.lang.Boolean.TYPE
            )
            method.invoke(options, enabled)
        } catch (_: NoSuchMethodException) {
            if (!hasLoggedMissingNaviStatusBarApi) {
                hasLoggedMissingNaviStatusBarApi = true
                Log.w(
                    "ExpoGaodeMapNaviView",
                    "AMapNaviViewOptions#setNaviStatusBarEnabled is unavailable in the current AMap SDK; skip applying naviStatusBarEnabled"
                )
            }
        } catch (error: Throwable) {
            Log.w(
                "ExpoGaodeMapNaviView",
                "Failed to apply naviStatusBarEnabled compatibly",
                error
            )
        }
    }

    private fun applyNaviModeCompat(
        options: AMapNaviViewOptions,
        mode: Int
    ) {
        try {
            val method = options.javaClass.getMethod(
                "setNaviMode",
                Integer.TYPE
            )
            method.invoke(options, mode)
        } catch (_: NoSuchMethodException) {
            if (!hasLoggedMissingNaviModeApi) {
                hasLoggedMissingNaviModeApi = true
                Log.w(
                    "ExpoGaodeMapNaviView",
                    "AMapNaviViewOptions#setNaviMode is unavailable in the current AMap SDK; skip applying naviMode on options"
                )
            }
        } catch (error: Throwable) {
            Log.w(
                "ExpoGaodeMapNaviView",
                "Failed to apply naviMode compatibly",
                error
            )
        }
    }

    private fun applyAutoNaviViewNightModeCompat(
        options: AMapNaviViewOptions,
        enabled: Boolean
    ) {
        try {
            val method = options.javaClass.getMethod(
                "setAutoNaviViewNightMode",
                java.lang.Boolean.TYPE
            )
            method.invoke(options, enabled)
        } catch (_: NoSuchMethodException) {
            Log.w(
                "ExpoGaodeMapNaviView",
                "AMapNaviViewOptions#setAutoNaviViewNightMode is unavailable in the current AMap SDK; skip applying auto night mode"
            )
        } catch (error: Throwable) {
            Log.w(
                "ExpoGaodeMapNaviView",
                "Failed to apply auto navi night mode compatibly",
                error
            )
        }
    }

    private fun applyNaviNightCompat(
        options: AMapNaviViewOptions,
        enabled: Boolean
    ) {
        try {
            val method = options.javaClass.getMethod(
                "setNaviNight",
                java.lang.Boolean.TYPE
            )
            method.invoke(options, enabled)
            return
        } catch (_: NoSuchMethodException) {
            Log.w(
                "ExpoGaodeMapNaviView",
                "AMapNaviViewOptions#setNaviNight is unavailable in the current AMap SDK; fallback to setMapStyle"
            )
        } catch (error: Throwable) {
            Log.w(
                "ExpoGaodeMapNaviView",
                "Failed to apply navi night compatibly, fallback to setMapStyle",
                error
            )
        }

        if (enabled) {
            options.setMapStyle(MapStyle.NIGHT, null)
        } else {
            options.setMapStyle(MapStyle.DAY, null)
        }
    }

    private fun applyMapViewModeTypeCompat(
        options: AMapNaviViewOptions,
        mode: Int
    ) {
        when (mode) {
            0 -> {
                applyAutoNaviViewNightModeCompat(options, false)
                applyNaviNightCompat(options, false)
            }
            1 -> {
                applyAutoNaviViewNightModeCompat(options, false)
                applyNaviNightCompat(options, true)
            }
            2 -> {
                applyAutoNaviViewNightModeCompat(options, true)
            }
            3 -> {
                // Android custom map style requires style path API that is not exposed yet.
                applyAutoNaviViewNightModeCompat(options, false)
                applyNaviNightCompat(options, false)
                Log.w(
                    "ExpoGaodeMapNaviView",
                    "mapViewModeType=3 (custom) requires custom map style path support on Android; fallback to day mode"
                )
            }
            else -> {
                applyAutoNaviViewNightModeCompat(options, false)
                applyNaviNightCompat(options, false)
                Log.w(
                    "ExpoGaodeMapNaviView",
                    "Unknown mapViewModeType=$mode; fallback to day mode"
                )
            }
        }
    }

    private fun createInitialViewOptions(): AMapNaviViewOptions {
        return AMapNaviViewOptions().also { options ->
            applyAllViewOptions(options)
        }
    }

    private fun applyAllViewOptions(options: AMapNaviViewOptions) {
        options.isLayoutVisible = showUIElements
        options.isSettingMenuEnabled = true
        options.isCompassEnabled = isCompassEnabled
        options.isTrafficBarEnabled = androidTrafficBarEnabled
        options.isRouteListButtonShow = isRouteListButtonShow
        applyNaviStatusBarEnabledCompat(options, isNaviStatusBarEnabled)

        options.isTrafficLayerEnabled = isTrafficButtonVisible
        options.isTrafficLine = isTrafficLineEnabled

        options.isRealCrossDisplayShow = isRealCrossDisplayShow
        options.setModeCrossDisplayShow(isModeCrossDisplayVisible)
        options.isLaneInfoShow = isLaneInfoVisible
        options.isEyrieCrossDisplay = isEyrieCrossDisplayVisible

        options.isCameraBubbleShow = showCamera
        options.isShowCameraDistance = true
        options.isWidgetOverSpeedPulseEffective = true

        options.isAutoDrawRoute = true
        options.isNaviArrowVisible = isNaviArrowVisible
        options.isSecondActionVisible = isSecondActionVisible
        options.isDrawBackUpOverlay = isBackupOverlayVisible
        applyLeaderLineSetting(options, isVectorLineShow)

        options.isAutoLockCar = autoLockCar
        options.lockMapDelayed = 5000L
        options.isAutoDisplayOverview = false
        options.isAutoChangeZoom = autoChangeZoom
        options.zoom = lockZoomLevel.coerceIn(14, 18)
        options.tilt = lockTilt.coerceIn(0, 60)
        applyNaviModeCompat(options, naviModeValue)
        if (pointToCenterX > 0.0 && pointToCenterY > 0.0) {
            options.setPointToCenter(pointToCenterX, pointToCenterY)
        }

        options.isAfterRouteAutoGray = isAfterRouteAutoGray
        options.isSensorEnable = true
        applyMapViewModeTypeCompat(options, mapViewModeTypeValue)
        options.isEagleMapVisible = isEagleMapVisible
        applyCustomAnnotationBitmaps(options)
    }

    private fun applyBitmapOptionCompat(
        options: AMapNaviViewOptions,
        methodName: String,
        bitmap: Bitmap?
    ) {
        try {
            val method = options.javaClass.getMethod(methodName, Bitmap::class.java)
            method.invoke(options, bitmap)
        } catch (_: NoSuchMethodException) {
            Log.w(
                "ExpoGaodeMapNaviView",
                "AMapNaviViewOptions#$methodName is unavailable in the current AMap SDK; skip applying custom bitmap"
            )
        } catch (error: Throwable) {
            Log.w(
                "ExpoGaodeMapNaviView",
                "Failed to apply $methodName compatibly",
                error
            )
        }
    }

    private fun applyCustomAnnotationBitmaps(options: AMapNaviViewOptions) {
        applyBitmapOptionCompat(options, "setCarBitmap", customCarBitmap)
        applyBitmapOptionCompat(options, "setFourCornersBitmap", customFourCornersBitmap)
        applyBitmapOptionCompat(options, "setStartPointBitmap", customStartPointBitmap)
        applyBitmapOptionCompat(options, "setWayPointBitmap", customWayPointBitmap)
        applyBitmapOptionCompat(options, "setEndPointBitmap", customEndPointBitmap)
    }

    private fun refreshViewOptionsFromState(reason: String) {
        if (isDestroyed) {
            return
        }
        naviView.viewOptions = createInitialViewOptions()
        refreshNaviUILayout(reason)
    }

    private fun loadBitmapFromSource(imagePath: String): Bitmap? {
        return try {
            when {
                imagePath.startsWith("http://") || imagePath.startsWith("https://") -> {
                    URL(imagePath).openStream().use { BitmapFactory.decodeStream(it) }
                }
                imagePath.startsWith("file://") -> {
                    BitmapFactory.decodeFile(imagePath.substring(7))
                }
                else -> {
                    val fileName = imagePath.substringBeforeLast('.')
                    val resId = context.resources.getIdentifier(
                        fileName,
                        "drawable",
                        context.packageName
                    )
                    if (resId != 0) {
                        BitmapFactory.decodeResource(context.resources, resId)
                    } else {
                        BitmapFactory.decodeFile(imagePath)
                    }
                }
            }
        } catch (_: Throwable) {
            null
        }
    }

    private fun resizeCarBitmapIfNeeded(source: Bitmap?): Bitmap? {
        val rawBitmap = source ?: return null
        val widthDp = carImageWidthDp?.takeIf { it > 0.0 }
        val heightDp = carImageHeightDp?.takeIf { it > 0.0 }
        if (widthDp == null || heightDp == null) {
            return rawBitmap
        }

        val density = context.resources.displayMetrics.density
        val widthPx = (widthDp * density).roundToInt().coerceAtLeast(1)
        val heightPx = (heightDp * density).roundToInt().coerceAtLeast(1)

        if (rawBitmap.width == widthPx && rawBitmap.height == heightPx) {
            return rawBitmap
        }

        return Bitmap.createScaledBitmap(rawBitmap, widthPx, heightPx, true)
    }

    private fun updateCustomAnnotationBitmap(
        uri: String?,
        getCurrentUri: () -> String?,
        setCurrentUri: (String?) -> Unit,
        setBitmap: (Bitmap?) -> Unit,
        reason: String
    ) {
        val normalizedUri = uri?.takeIf { it.isNotBlank() }
        setCurrentUri(normalizedUri)

        if (normalizedUri == null) {
            setBitmap(null)
            refreshViewOptionsFromState("clear-$reason")
            return
        }

        Thread {
            val bitmap = loadBitmapFromSource(normalizedUri)
            Handler(Looper.getMainLooper()).post {
                if (isDestroyed || getCurrentUri() != normalizedUri) {
                    return@post
                }
                setBitmap(bitmap)
                refreshViewOptionsFromState("apply-$reason")
            }
        }.start()
    }

    private fun applyRouteMarkerVisibleFromState() {
        naviView.setRouteMarkerVisible(
            routeMarkerShowStartEndVia,
            routeMarkerShowFootFerry,
            routeMarkerShowForbidden,
            routeMarkerShowRouteStartIcon,
            routeMarkerShowRouteEndIcon
        )
    }

    private fun commitViewOptions(mutator: (AMapNaviViewOptions) -> Unit) {
        val options = naviView.viewOptions ?: AMapNaviViewOptions()
        mutator(options)
        naviView.viewOptions = options
        refreshNaviUILayout("commitViewOptions")
    }

    private fun logCurrentNaviPathState(reason: String) {
        val naviPath = aMapNavi?.naviPath
        val waypointCount = naviPath?.wayPoint?.size ?: 0
        val waypointIndexCount = naviPath?.wayPointIndex?.size ?: 0
        Log.d(
            "ExpoGaodeMapNaviView",
            "pathState[$reason]: routeType=${naviPath?.routeType} length=${naviPath?.allLength} time=${naviPath?.allTime} labels=${naviPath?.labels} labelId=${naviPath?.labelId} waypointCount=$waypointCount waypointIndexCount=$waypointIndexCount start=${naviPath?.startPoint} end=${naviPath?.endPoint}"
        )
    }

    private fun stabilizeIndependentRouteRendering(reason: String) {
        val routeId = activeIndependentRouteId ?: return
        val delays = longArrayOf(0L, 180L, 420L)
        delays.forEach { delayMillis ->
            naviView.postDelayed({
                if (isDestroyed) {
                    return@postDelayed
                }
                try {
                    val selected = aMapNavi?.selectRouteId(routeId)
                    Log.d(
                        "ExpoGaodeMapNaviView",
                        "stabilizeIndependentRouteRendering[$reason/$delayMillis]: routeId=$routeId selected=$selected"
                    )
                    applyRouteMarkerVisibleFromState()
                    logCurrentNaviPathState("stabilize-$reason-$delayMillis")
                } catch (error: Exception) {
                    Log.e(
                        "ExpoGaodeMapNaviView",
                        "Failed to stabilize independent route rendering: reason=$reason delay=$delayMillis routeId=$routeId",
                        error
                    )
                }
            }, delayMillis)
        }
    }

    private fun refreshNaviUILayout(reason: String) {
        if (isDestroyed) {
            return
        }

        naviView.post {
            if (isDestroyed) {
                return@post
            }

            updateTopInsetPadding()
            updateNativeTopInfoLayoutVisibility()

            val needsAggressiveRefresh =
                hideNativeTopInfoLayout ||
                !showUIElements ||
                androidStatusBarPaddingTopDp != null

            if (needsAggressiveRefresh) {
                naviView.requestLayout()
                naviView.forceLayout()
                naviView.invalidate()
                naviView.postInvalidateOnAnimation()
                requestLayout()
                invalidate()
                postInvalidateOnAnimation()
            }

            Log.d("ExpoGaodeMapNaviView", "refreshNaviUILayout: $reason")
        }
    }

    private fun shouldHideNativeTopInfoView(view: View): Boolean {
        val className = view.javaClass.name
        return className.contains("BaseNaviInfoLayout") ||
            className.contains("NaviInfoLayout_")
    }

    private fun updateNativeTopInfoLayoutVisibility() {
        if (isDestroyed) {
            return
        }

        if (!hideNativeTopInfoLayout) {
            return
        }

        val queue = ArrayDeque<View>()
        val targetVisibility = View.GONE
        queue.add(naviView)

        while (queue.isNotEmpty()) {
            val current = queue.removeFirst()
            if (current is ViewGroup) {
                for (index in 0 until current.childCount) {
                    queue.add(current.getChildAt(index))
                }
            }

            if (!shouldHideNativeTopInfoView(current)) {
                continue
            }

            if (current.visibility != targetVisibility) {
                current.visibility = targetVisibility
                current.requestLayout()
                current.invalidate()
            }
        }
    }

    private fun suppressNativeTopInfoLayoutFlash() {
        if (!hideNativeTopInfoLayout || isDestroyed) {
            return
        }

        val delays = longArrayOf(0L, 16L, 48L, 96L, 180L)
        delays.forEach { delayMs ->
            naviView.postDelayed({
                if (!isDestroyed) {
                    updateNativeTopInfoLayoutVisibility()
                }
            }, delayMs)
        }
    }

    private fun emitVisualStateUpdate() {
        onNavigationVisualStateUpdate(
            mapOf(
                "isCrossVisible" to isCrossVisible,
                "isModeCrossVisible" to isModeCrossVisible,
                "isLaneInfoVisible" to isLaneInfoCurrentlyVisible
            )
        )
    }

    private fun extractLaneValues(raw: Any?): List<Int> {
        return when (raw) {
            is IntArray -> raw.map { it.toInt() }
            is ByteArray -> raw.map { it.toInt() and 0xFF }
            is ShortArray -> raw.map { it.toInt() }
            is Array<*> -> raw.mapNotNull { (it as? Number)?.toInt() }
            else -> emptyList()
        }
    }

    private fun getLaneArrayValue(laneInfo: AMapLaneInfo, fieldName: String): List<Int> {
        val reflectedValue = runCatching {
            laneInfo.javaClass.getField(fieldName).get(laneInfo)
        }.getOrElse {
            runCatching {
                val getterName = "get" + fieldName.replaceFirstChar { char ->
                    if (char.isLowerCase()) {
                        char.titlecase()
                    } else {
                        char.toString()
                    }
                }
                laneInfo.javaClass.getMethod(getterName).invoke(laneInfo)
            }.getOrNull()
        }

        return extractLaneValues(reflectedValue)
    }

    private fun resolveLaneCount(laneInfo: AMapLaneInfo): Int {
        val reflectedCount = runCatching {
            laneInfo.javaClass.getField("laneCount").get(laneInfo) as? Number
        }.getOrElse {
            runCatching {
                laneInfo.javaClass.getMethod("getLaneCount").invoke(laneInfo) as? Number
            }.getOrNull()
        }

        return reflectedCount?.toInt()?.coerceAtLeast(0) ?: 0
    }

    private fun serializeLaneInfo(laneInfo: AMapLaneInfo?): Map<String, Any>? {
        if (laneInfo == null) {
            return null
        }

        val backgroundLane = getLaneArrayValue(laneInfo, "backgroundLane")
        val frontLane = getLaneArrayValue(laneInfo, "frontLane")
        val declaredCount = resolveLaneCount(laneInfo)
        val sentinelIndex = backgroundLane.indexOf(255).takeIf { it >= 0 }

        val resolvedCount = listOfNotNull(
            sentinelIndex,
            declaredCount.takeIf { it > 0 },
            backgroundLane.size.takeIf { it > 0 },
            frontLane.size.takeIf { it > 0 }
        ).minOrNull() ?: 0

        if (resolvedCount <= 0) {
            return null
        }

        val normalizedBackground = (0 until resolvedCount).map { index ->
            backgroundLane.getOrNull(index) ?: 255
        }
        val normalizedFront = (0 until resolvedCount).map { index ->
            frontLane.getOrNull(index) ?: 255
        }

        return mapOf(
            "laneCount" to resolvedCount,
            "backgroundLane" to normalizedBackground,
            "frontLane" to normalizedFront
        )
    }

    private fun resolveNextTurnIconType(currentSegmentIndex: Int): Int? {
        if (currentSegmentIndex < 0) {
            return null
        }

        val steps = aMapNavi?.naviPath?.steps ?: return null
        val nextSegmentIndex = currentSegmentIndex + 1
        if (nextSegmentIndex !in steps.indices) {
            return null
        }

        return try {
            steps[nextSegmentIndex].iconType
        } catch (_: Throwable) {
            null
        }
    }

    /**
     * Android 导航 SDK 仅透出当前转向图 bitmap，且不同版本方法可见性不完全一致，
     * 这里走反射兼容，避免因为 SDK 小版本差异导致编译直接中断。
     */
    private fun extractTurnIconBitmap(naviInfo: NaviInfo): Bitmap? {
        return try {
            val method = naviInfo.javaClass.getMethod("getIconBitmap")
            method.invoke(naviInfo) as? Bitmap
        } catch (_: NoSuchMethodException) {
            if (!hasLoggedMissingTurnIconBitmapApi) {
                hasLoggedMissingTurnIconBitmapApi = true
                Log.w(
                    "ExpoGaodeMapNaviView",
                    "NaviInfo#getIconBitmap is unavailable in the current AMap SDK; turnIconImage will be omitted on Android"
                )
            }
            null
        } catch (error: Throwable) {
            Log.w("ExpoGaodeMapNaviView", "Failed to extract turn icon bitmap", error)
            null
        }
    }

    private fun bitmapToPngBytes(bitmap: Bitmap): ByteArray? {
        return try {
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
            outputStream.toByteArray()
        } catch (error: Throwable) {
            Log.w("ExpoGaodeMapNaviView", "Failed to serialize turn icon bitmap", error)
            null
        }
    }

    private fun sha1Hex(bytes: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-1").digest(bytes)
        return digest.joinToString("") { "%02x".format(it) }
    }

    private fun cacheTurnIconBitmap(bytes: ByteArray, prefix: String, contentHash: String): String? {
        return try {
            val directory = File(context.cacheDir, "expo_gaode_map_navigation_icons")
            if (!directory.exists()) {
                directory.mkdirs()
            }
            val file = File(directory, "${prefix}_${contentHash}.png")
            if (!file.exists()) {
                FileOutputStream(file).use { stream ->
                    stream.write(bytes)
                }
            }
            Uri.fromFile(file).toString()
        } catch (error: Throwable) {
            Log.w("ExpoGaodeMapNaviView", "Failed to cache turn icon bitmap", error)
            null
        }
    }

    private fun deleteCachedIconFile(uriString: String?) {
        if (uriString.isNullOrBlank()) {
            return
        }
        runCatching {
            val path = Uri.parse(uriString).path ?: return
            File(path).delete()
        }
    }

    private fun updateCachedTurnIconImage(naviInfo: NaviInfo): String? {
        val bitmap = extractTurnIconBitmap(naviInfo)
        if (bitmap == null) {
            deleteCachedIconFile(cachedTurnIconImageUri)
            cachedTurnIconImageUri = null
            cachedTurnIconContentHash = null
            return null
        }

        val bytes = bitmapToPngBytes(bitmap) ?: return cachedTurnIconImageUri
        val contentHash = sha1Hex(bytes)
        if (contentHash == cachedTurnIconContentHash && !cachedTurnIconImageUri.isNullOrBlank()) {
            return cachedTurnIconImageUri
        }

        val nextUri = cacheTurnIconBitmap(bytes, "turn_icon", contentHash) ?: return cachedTurnIconImageUri
        val previousUri = cachedTurnIconImageUri
        cachedTurnIconImageUri = nextUri
        cachedTurnIconContentHash = contentHash
        if (previousUri != nextUri) {
            deleteCachedIconFile(previousUri)
        }
        return nextUri
    }

    private fun emitTrafficStatusesUpdate(retainDistance: Int? = null) {
        val trafficStatuses = try {
            aMapNavi?.getTrafficStatuses(0, 0)
        } catch (_: Throwable) {
            null
        } ?: emptyList()

        val totalLength = try {
            aMapNavi?.naviPath?.allLength
        } catch (_: Throwable) {
            null
        } ?: currentRouteTotalLength

        currentRouteTotalLength = totalLength ?: currentRouteTotalLength

        val payload = mutableMapOf<String, Any>(
            "items" to trafficStatuses.map { status ->
                mapOf(
                    "status" to status.status,
                    "length" to status.length
                )
            }
        )

        if ((totalLength ?: 0) > 0) {
            payload["totalLength"] = totalLength as Int
        }

        if (retainDistance != null) {
            payload["retainDistance"] = retainDistance
        }

        onTrafficStatusesUpdate(payload)
    }
    
    // 导航监听器
    @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
    private val naviListener = object : AMapNaviListener {
        override fun onInitNaviFailure() {
            onNavigationFailed(mapOf(
                "error" to "初始化导航失败"
            ))
        }

        override fun onInitNaviSuccess() {
            Log.d("ExpoGaodeMapNaviView", "AMapNavi 初始化成功")
            onNavigationReady(emptyMap())
        }

        override fun onStartNavi(type: Int) {
            Log.d("ExpoGaodeMapNaviView", "导航开始: type=$type")
            isNavigationRunning = true
            syncNavigationForegroundService("on_start_navi")
            logCurrentNaviPathState("onStartNavi")
            stabilizeIndependentRouteRendering("onStartNavi")
            onNavigationStarted(mapOf(
                "type" to type,
                "isEmulator" to (type == 1)
            ))
        }

        override fun onTrafficStatusUpdate() {
            emitTrafficStatusesUpdate()
        }

        override fun onLocationChange(location: AMapNaviLocation?) {
            location?.let {
                onLocationUpdate(mapOf(
                    "latitude" to it.coord.latitude,
                    "longitude" to it.coord.longitude,
                    "speed" to it.speed,
                    "bearing" to it.bearing
                ))
            }
        }

        override fun onGetNavigationText(type: Int, text: String?) {
            text?.let {
                onNavigationText(mapOf(
                    "type" to type,
                    "text" to it
                ))
                Log.d("ExpoGaodeMapNaviView", "导航语音: $it")
            }
        }

        override fun onGetNavigationText(text: String?) {
            text?.let {
                onNavigationText(mapOf(
                    "text" to it
                ))
                Log.d("ExpoGaodeMapNaviView", "导航语音: $it")
            }
        }

        override fun onEndEmulatorNavi() {
            isNavigationRunning = false
            syncNavigationForegroundService("on_end_emulator_navi")
            resetCustomWaypointMarkerArrivalState()
            activeIndependentRouteId = null
            onNavigationEnded(emptyMap())
        }

        override fun onArriveDestination() {
            isNavigationRunning = false
            syncNavigationForegroundService("on_arrive_destination")
            resetCustomWaypointMarkerArrivalState()
            activeIndependentRouteId = null
            onArriveDestination(emptyMap())
        }

        override fun onCalculateRouteSuccess(ids: IntArray?) {
            Log.d("ExpoGaodeMapNaviView", "onCalculateRouteSuccess: naviType=$naviType")
            onRouteCalculated(mapOf(
                "success" to true,
                "naviType" to naviType
            ))
            // 根据导航类型启动
            if (naviType == 1) {
                // 模拟导航
                aMapNavi?.startNavi(NaviType.EMULATOR)
            } else {
                // GPS 导航
                aMapNavi?.startNavi(NaviType.GPS)
            }
            Handler(Looper.getMainLooper()).post {
                try {
                    applyRouteMarkerVisibleFromState()
                    refreshCustomWaypointMarkers("calculate-route-success")
                } catch (e: Exception) {
                    Log.e("ExpoGaodeMapNaviView", "Failed to reapply route marker visibility after route success", e)
                }
            }
        }

        override fun onCalculateRouteSuccess(result: AMapCalcRouteResult?) {
            Log.d("ExpoGaodeMapNaviView", "onCalculateRouteSuccess: naviType=$naviType, result=$result")
            onRouteCalculated(mapOf(
                "success" to true,
                "naviType" to naviType
            ))
            // 根据导航类型启动
            if (naviType == 1) {
                // 模拟导航
                aMapNavi?.startNavi(NaviType.EMULATOR)
            } else {
                // GPS 导航
                aMapNavi?.startNavi(NaviType.GPS)
            }
            Handler(Looper.getMainLooper()).post {
                try {
                    applyRouteMarkerVisibleFromState()
                    refreshCustomWaypointMarkers("calculate-route-success-result")
                } catch (e: Exception) {
                    Log.e("ExpoGaodeMapNaviView", "Failed to reapply route marker visibility after route success", e)
                }
            }
        }

        override fun onCalculateRouteFailure(errorCode: Int) {
            isNavigationRunning = false
            syncNavigationForegroundService("calculate_route_failure_code")
            onRouteCalculated(mapOf(
                "success" to false,
                "errorCode" to errorCode
            ))
        }

        override fun onCalculateRouteFailure(result: AMapCalcRouteResult?) {
            isNavigationRunning = false
            syncNavigationForegroundService("calculate_route_failure_result")
            onRouteCalculated(mapOf(
                "success" to false,
                "errorInfo" to (result?.errorDescription ?: "Unknown error")
            ))
        }

        override fun onReCalculateRouteForYaw() {
            onRouteRecalculate(mapOf(
                "reason" to "yaw"
            ))
        }

        override fun onReCalculateRouteForTrafficJam() {
            onRouteRecalculate(mapOf(
                "reason" to "traffic"
            ))
        }

        override fun onArrivedWayPoint(wayPointIndex: Int) {
            markCustomWaypointArrived(wayPointIndex)
            onWayPointArrived(mapOf(
                "index" to wayPointIndex
            ))
        }

        override fun onGpsOpenStatus(enabled: Boolean) {
            onGpsStatusChanged(mapOf(
                "enabled" to enabled
            ))
        }

        override fun onNaviInfoUpdate(naviInfo: NaviInfo?) {
            naviInfo?.let {
                val allLength = try {
                    aMapNavi?.naviPath?.allLength
                } catch (_: Throwable) {
                    null
                }
                val safeRetainDistance = it.pathRetainDistance.coerceAtLeast(0)
                currentRouteTotalLength = maxOf(
                    currentRouteTotalLength ?: 0,
                    allLength ?: 0,
                    safeRetainDistance
                ).takeIf { total -> total > 0 } ?: currentRouteTotalLength
                val nextIconType = resolveNextTurnIconType(it.curStep)
                val turnIconImage = updateCachedTurnIconImage(it)
                val payload = mutableMapOf<String, Any>(
                    "naviMode" to it.naviType,
                    "currentRoadName" to (it.currentRoadName ?: ""),
                    "nextRoadName" to (it.nextRoadName ?: ""),
                    "pathRetainDistance" to it.pathRetainDistance,
                    "pathRetainTime" to it.pathRetainTime,
                    "curStepRetainDistance" to it.curStepRetainDistance,
                    "curStepRetainTime" to it.curStepRetainTime,
                    "currentSpeed" to it.currentSpeed,
                    "iconType" to it.iconType,
                    "iconDirection" to it.iconType,
                    "currentSegmentIndex" to it.curStep,
                    "currentLinkIndex" to it.curLink,
                    "currentPointIndex" to it.curPoint,
                    "routeRemainTrafficLightCount" to it.routeRemainLightCount,
                    "driveDistance" to 0,
                    "driveTime" to 0
                )
                if (nextIconType != null) {
                    payload["nextIconType"] = nextIconType
                }
                if (!turnIconImage.isNullOrBlank()) {
                    payload["turnIconImage"] = turnIconImage
                }
                onNavigationInfoUpdate(payload)
                updateNavigationNotification(it)
                emitTrafficStatusesUpdate(it.pathRetainDistance)
                refreshNaviUILayout("onNaviInfoUpdate")
            }
        }

        override fun updateCameraInfo(cameraInfos: Array<out AMapNaviCameraInfo>?) {
            // 摄像头信息更新
        }

        override fun updateIntervalCameraInfo(camera1: AMapNaviCameraInfo?, camera2: AMapNaviCameraInfo?, type: Int) {
            // 区间测速摄像头信息更新
        }

        override fun onServiceAreaUpdate(serviceAreaInfos: Array<out AMapServiceAreaInfo>?) {
            // 服务区信息更新
        }

        override fun showCross(crossImg: AMapNaviCross?) {
            // 显示路口放大图
            isCrossVisible = true
            emitVisualStateUpdate()
            suppressNativeTopInfoLayoutFlash()
            refreshNaviUILayout("showCross")
        }

        override fun hideCross() {
            // 隐藏路口放大图
            isCrossVisible = false
            emitVisualStateUpdate()
            suppressNativeTopInfoLayoutFlash()
            refreshNaviUILayout("hideCross")
        }

        override fun showModeCross(modelCross: AMapModelCross?) {
            // 显示路口3D模型
            isModeCrossVisible = true
            emitVisualStateUpdate()
            suppressNativeTopInfoLayoutFlash()
            refreshNaviUILayout("showModeCross")
        }

        override fun hideModeCross() {
            // 隐藏路口3D模型
            isModeCrossVisible = false
            emitVisualStateUpdate()
            suppressNativeTopInfoLayoutFlash()
            refreshNaviUILayout("hideModeCross")
        }

        override fun showLaneInfo(laneInfo: AMapLaneInfo?) {
            // 显示车道信息
            isLaneInfoCurrentlyVisible = true
            emitVisualStateUpdate()
            serializeLaneInfo(laneInfo)?.let { onLaneInfoUpdate(it) }
            refreshNaviUILayout("showLaneInfo")
        }

        override fun showLaneInfo(laneInfos: Array<out AMapLaneInfo>?, laneBackgroundInfo: ByteArray?, laneRecommendedInfo: ByteArray?) {
            // 显示车道信息（重载方法）
            isLaneInfoCurrentlyVisible = true
            emitVisualStateUpdate()
            serializeLaneInfo(laneInfos?.firstOrNull())?.let { onLaneInfoUpdate(it) }
            refreshNaviUILayout("showLaneInfoArray")
        }

        override fun hideLaneInfo() {
            // 隐藏车道信息
            isLaneInfoCurrentlyVisible = false
            emitVisualStateUpdate()
            refreshNaviUILayout("hideLaneInfo")
        }

        override fun notifyParallelRoad(parallelRoadType: Int) {
            // 平行路提示
        }

        override fun OnUpdateTrafficFacility(trafficFacilityInfo: AMapNaviTrafficFacilityInfo?) {
            // 交通设施信息更新
        }

        override fun OnUpdateTrafficFacility(trafficFacilityInfos: Array<out AMapNaviTrafficFacilityInfo>?) {
            // 交通设施信息批量更新
        }

        override fun updateAimlessModeStatistics(aimlessModeStatistics: AimLessModeStat?) {
            // 巡航模式统计信息更新
        }

        override fun updateAimlessModeCongestionInfo(aimlessModeStatistics: AimLessModeCongestionInfo?) {
            // 巡航模式拥堵信息更新
        }

        override fun onPlayRing(ringType: Int) {
            // 播放提示音
        }

        override fun onNaviRouteNotify(naviRouteNotifyData: AMapNaviRouteNotifyData?) {
            // 路线通知
        }

        override fun onGpsSignalWeak(isWeak: Boolean) {
            onGpsSignalWeak(mapOf(
                "isWeak" to isWeak
            ))
        }
    }

    init {
        try {
            val appCtx = context.applicationContext ?: context
            SDKInitializer.restorePersistedState(appCtx)
            if (!SDKInitializer.isPrivacyReady()) {
                throw IllegalStateException(
                    "隐私协议未完成确认，请先调用 setPrivacyConfig（或 setPrivacyShow/setPrivacyAgree）"
                )
            }

            // 初始化导航视图
            naviView.onCreate(Bundle())
            naviView.viewOptions = createInitialViewOptions()
            naviView.layoutParams = android.widget.FrameLayout.LayoutParams(
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT
            )
            addView(naviView)

            clipChildren = false
            clipToPadding = false
            naviView.clipChildren = false
            naviView.clipToPadding = false
            
            // 使用单例获取导航实例
            aMapNavi = AMapNavi.getInstance(appCtx)
            aMapNavi?.addAMapNaviListener(naviListener)
            
            // 使用内置语音播报功能（v5.6.0+）
            aMapNavi?.setUseInnerVoice(true, true) // 启用内置语音，并回调文字
           //设置是否为骑步行视图
            aMapNavi?.isNaviTravelView = isNaviTravelView
            Log.d("ExpoGaodeMapNaviView", "导航UI配置初始化完成")
            registerActiveView()

            naviView.post { updateTopInsetPadding() }
            
            // 设置导航视图监听器
            naviView.setAMapNaviViewListener(object : AMapNaviViewListener {
                override fun onNaviViewShowMode(showMode: Int) {
                    Log.d("ExpoGaodeMapNaviView", "显示模式变化: $showMode")
                }
                
                override fun onNaviMapMode(naviMode: Int) {
                    Log.d("ExpoGaodeMapNaviView", "车头朝向变化: $naviMode")
                }
                
                // 实现必须的抽象方法
                override fun onNaviSetting() {}
                override fun onNaviCancel() {}
                override fun onNaviBackClick(): Boolean = false
                override fun onNaviTurnClick() {}
                override fun onNextRoadClick() {}
                override fun onScanViewButtonClick() {}
                override fun onLockMap(isLock: Boolean) {}
                override fun onNaviViewLoaded() {
                    updateNativeTopInfoLayoutVisibility()
                    refreshNaviUILayout("onNaviViewLoaded")
                }
                override fun onMapTypeChanged(mapType: Int) {}
            })
            
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Error initializing navi view", e)
        }
    }

    private fun dpToPx(dp: Double): Int {
        val density = context.resources.displayMetrics.density
        return (dp * density + 0.5).toInt()
    }

    private fun updateTopInsetPadding() {
        val paddingTopPx = androidStatusBarPaddingTopDp?.let { dpToPx(it) } ?: 0

        if (lastAppliedTopPaddingPx == paddingTopPx) {
            return
        }

        lastAppliedTopPaddingPx = paddingTopPx
        if (paddingTopPx > 0) {
            naviView.setPadding(0, paddingTopPx, 0, 0)
        } else {
            naviView.setPadding(0, 0, 0, 0)
        }
        naviView.requestLayout()
    }

    private fun applyLeaderLineSetting(options: AMapNaviViewOptions, enabled: Boolean) {
        val color = if (enabled) {
            Color.argb(160, 48, 122, 246)
        } else {
            -1
        }
        options.setLeaderLineEnabled(color)
    }



    fun applyAndroidStatusBarPaddingTop(topDp: Double?) {
        androidStatusBarPaddingTopDp = topDp
        updateTopInsetPadding()
    }

    fun applyShowUIElements(visible: Boolean) {
        showUIElements = visible
        commitViewOptions { options ->
            options.isLayoutVisible = visible
        }
    }

    fun applyAndroidTrafficBarEnabled(enabled: Boolean) {
        androidTrafficBarEnabled = enabled
        commitViewOptions { options ->
            options.isTrafficBarEnabled = enabled
        }
    }

    fun applyShowTrafficButton(enabled: Boolean) {
        isTrafficButtonVisible = enabled
        commitViewOptions { options ->
            options.isTrafficLayerEnabled = enabled
        }
    }

    fun applyShowBrowseRouteButton(enabled: Boolean) {
        isRouteListButtonShow = enabled
        commitViewOptions { options ->
            options.isRouteListButtonShow = enabled
        }
    }

    fun applyShowGreyAfterPass(enabled: Boolean){
        isAfterRouteAutoGray = enabled
        commitViewOptions { options ->
            options.isAfterRouteAutoGray = enabled
        }
    }

    fun applyShowVectorline(enabled: Boolean){
        isVectorLineShow = enabled
        commitViewOptions { options ->
            applyLeaderLineSetting(options, enabled)
        }
    }

    fun startNavigation(startLat: Double, startLng: Double, endLat: Double, endLng: Double, promise: expo.modules.kotlin.Promise) {
        Log.d("ExpoGaodeMapNaviView", "startNavigation: $startLat, $startLng, $endLat, $endLng, naviType: $naviType")
        try {
            resetCustomWaypointMarkerArrivalState()
            startCoordinate = NaviLatLng(startLat, startLng)
            endCoordinate = NaviLatLng(endLat, endLng)
            
            val startList = ArrayList<NaviLatLng>()
            val endList = ArrayList<NaviLatLng>()
            startList.add(startCoordinate!!)
            endList.add(endCoordinate!!)
            
            // 根据导航类型设置模拟导航
            when (naviType) {
                1 -> aMapNavi?.setEmulatorNaviSpeed(80) // 模拟导航，设置速度为80km/h
                else -> { /* GPS导航不需要设置 */ }
            }
            
            // 计算驾车路线
            val success = aMapNavi?.calculateDriveRoute(
                startList,
                endList,
                null, // 途经点
                com.amap.api.navi.enums.PathPlanningStrategy.DRIVING_DEFAULT // 驾车策略：常规路线
            ) ?: false
            
            if (success) {
                promise.resolve(mapOf(
                    "success" to true,
                    "message" to "路线规划中...",
                    "naviType" to naviType
                ))
            } else {
                promise.reject("CALCULATE_FAILED", "启动路线规划失败", null)
            }
        } catch (e: Exception) {
            promise.reject("START_NAVIGATION_ERROR", e.message, e)
        }
    }

    fun startNavigationWithIndependentPath(
        token: Int,
        routeId: Int?,
        routeIndex: Int?,
        requestedNaviType: Int?,
        promise: expo.modules.kotlin.Promise
    ) {
        try {
            resetCustomWaypointMarkerArrivalState()
            val finalNaviType = requestedNaviType ?: naviType
            val result = independentRouteManager.start(context, token, finalNaviType, routeId, routeIndex)
            if (result.success) {
                activeIndependentRouteId = result.resolvedRouteId
                promise.resolve(
                    mapOf(
                        "success" to true,
                        "message" to result.message,
                        "token" to token,
                        "naviType" to finalNaviType,
                        "sdkNaviType" to result.sdkNaviType,
                        "routeId" to result.resolvedRouteId,
                        "pathCount" to result.pathCount,
                        "mainPathIndex" to result.mainPathIndex
                    )
                )
            } else {
                activeIndependentRouteId = null
                promise.reject("START_INDEPENDENT_NAVI_FAILED", result.message, null)
            }
        } catch (e: Exception) {
            activeIndependentRouteId = null
            promise.reject("START_INDEPENDENT_NAVI_ERROR", e.message, e)
        }
    }

    fun stopNavigation(promise: expo.modules.kotlin.Promise) {
        try {
            aMapNavi?.stopNavi()
            isNavigationRunning = false
            syncNavigationForegroundService("stop_navigation")
            resetCustomWaypointMarkerArrivalState()
            promise.resolve(mapOf(
                "success" to true,
                "message" to "导航已停止"
            ))
        } catch (e: Exception) {
            promise.reject("STOP_NAVIGATION_ERROR", e.message, e)
        }
    }

    // Prop setters - 使用不同的方法名避免与 var 属性的自动 setter 冲突
    fun applyShowCamera(show: Boolean) {
        showCamera = show
        commitViewOptions { options ->
            options.isCameraBubbleShow = show
        }
    }

    fun applyAndroidBackgroundNavigationNotificationEnabled(enabled: Boolean) {
        androidBackgroundNavigationNotificationEnabled = enabled
        Log.d("ExpoGaodeMapNaviView", "applyAndroidBackgroundNavigationNotificationEnabled=$enabled")
        syncNavigationForegroundService("prop_update")
    }

    fun applyNaviType(type: Int) {
        naviType = type
        // 导航类型会在 startNavigation 时使用
    }

    fun applyEnableVoice(enabled: Boolean) {
        enableVoice = enabled
        // 使用内置语音功能
        aMapNavi?.setUseInnerVoice(enabled, true)
        
        if (enabled) {
            aMapNavi?.startSpeak() // 开始内置语音播报
            Log.d("ExpoGaodeMapNaviView", "内置语音播报已启用")
        } else {
            aMapNavi?.stopSpeak() // 停止内置语音播报
            Log.d("ExpoGaodeMapNaviView", "内置语音播报已禁用")
        }
    }
    
    // 播放自定义语音
    fun playCustomTTS(text: String, forcePlay: Boolean = false): Boolean {
        return try {
            aMapNavi?.playTTS(text, forcePlay) ?: false
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "播放自定义语音失败", e)
            false
        }
    }
    
    fun applyAutoLockCar(enabled: Boolean) {
        autoLockCar = enabled
        commitViewOptions { options ->
            options.isAutoLockCar = enabled
        }
    }
    
    fun applyAutoChangeZoom(enabled: Boolean) {
        autoChangeZoom = enabled
        commitViewOptions { options ->
            options.isAutoChangeZoom = enabled
        }
    }
    
    fun applyTrafficLayerEnabled(enabled: Boolean) {
        isTrafficLineEnabled = enabled
        commitViewOptions { options ->
            options.isTrafficLine = enabled
        }
    }
    
    fun applyRealCrossDisplay(enabled: Boolean) {
        isRealCrossDisplayShow = enabled
        commitViewOptions { options ->
            options.isRealCrossDisplayShow = enabled
        }
    }

    fun applyLaneInfoVisible(enabled: Boolean) {
        isLaneInfoVisible = enabled
        commitViewOptions { options ->
            options.isLaneInfoShow = enabled
        }
    }

    fun applyModeCrossDisplay(enabled: Boolean) {
        isModeCrossDisplayVisible = enabled
        commitViewOptions { options ->
            options.setModeCrossDisplayShow(enabled)
        }
    }

    fun applyEyrieCrossDisplay(enabled: Boolean) {
        isEyrieCrossDisplayVisible = enabled
        commitViewOptions { options ->
            options.isEyrieCrossDisplay = enabled
        }
    }

    fun applySecondActionVisible(enabled: Boolean) {
        isSecondActionVisible = enabled
        commitViewOptions { options ->
            options.isSecondActionVisible = enabled
        }
    }

    fun applyBackupOverlayVisible(enabled: Boolean) {
        isBackupOverlayVisible = enabled
        commitViewOptions { options ->
            options.isDrawBackUpOverlay = enabled
        }
    }

    fun applyShowCompassEnabled(enabled: Boolean){
        isCompassEnabled = enabled
        commitViewOptions { options ->
            options.isCompassEnabled = enabled
        }
    }

    fun applyNaviStatusBarEnabled(enabled: Boolean) {
        isNaviStatusBarEnabled = enabled
        commitViewOptions { options ->
            applyNaviStatusBarEnabledCompat(options, enabled)
        }
    }

    fun applyLockZoom(level: Int) {
        lockZoomLevel = level.coerceIn(14, 18)
        commitViewOptions { options ->
            options.zoom = lockZoomLevel
        }
    }

    fun applyLockTilt(tilt: Int) {
        lockTilt = tilt.coerceIn(0, 60)
        commitViewOptions { options ->
            options.tilt = lockTilt
        }
    }

    fun applyEagleMapVisible(enabled: Boolean) {
        isEagleMapVisible = enabled
        commitViewOptions { options ->
            options.isEagleMapVisible = enabled
        }
    }

    fun applyPointToCenter(x: Double, y: Double) {
        pointToCenterX = x
        pointToCenterY = y
        commitViewOptions { options ->
            if (x > 0.0 && y > 0.0) {
                options.setPointToCenter(x, y)
            }
        }
    }

    fun applyHideNativeTopInfoLayout(hidden: Boolean) {
        hideNativeTopInfoLayout = hidden
        updateNativeTopInfoLayoutVisibility()
        refreshNaviUILayout("applyHideNativeTopInfoLayout")
    }


    fun applyNaviMode(mode: Int) {
        naviModeValue = mode
        commitViewOptions { options ->
            applyNaviModeCompat(options, mode)
        }
        // 兼容旧版接口，保持与 options 一致
        naviView.naviMode = mode
    }
    
    fun applyShowMode(mode: Int) {
        // 1-锁车态 2-全览态 3-普通态
        naviView.setShowMode(mode)
    }
    
    fun applyNightMode(enabled: Boolean) {
        mapViewModeTypeValue = if (enabled) 1 else 0
        try {
            commitViewOptions { options ->
                applyMapViewModeTypeCompat(options, mapViewModeTypeValue)
            }
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Failed to set night mode", e)
        }
    }

    fun applyMapViewModeType(mode: Int) {
        mapViewModeTypeValue = mode
        try {
            commitViewOptions { options ->
                applyMapViewModeTypeCompat(options, mode)
            }
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Failed to apply mapViewModeType=$mode", e)
        }
    }
    
    /**
     * 设置是否显示自车和罗盘
     * @param visible true-显示 false-隐藏
     * @since 6.2.0
     */
    fun applyCarOverlayVisible(visible: Boolean) {
        try {
            naviView.setCarOverlayVisible(visible)
            Log.d("ExpoGaodeMapNaviView", "CarOverlay visibility set to: $visible")
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Failed to set car overlay visibility", e)
        }
    }

    fun applyCarImage(uri: String?) {
        updateCustomAnnotationBitmap(
            uri = uri,
            getCurrentUri = { carImageUri },
            setCurrentUri = { carImageUri = it },
            setBitmap = {
                sourceCarBitmap = it
                customCarBitmap = resizeCarBitmapIfNeeded(it)
            },
            reason = "carBitmap"
        )
    }

    fun applyCarImageSize(widthDp: Double?, heightDp: Double?) {
        carImageWidthDp = widthDp
        carImageHeightDp = heightDp
        customCarBitmap = resizeCarBitmapIfNeeded(sourceCarBitmap)
        refreshViewOptionsFromState("apply-carBitmap-size")
    }

    fun applyFourCornersImage(uri: String?) {
        updateCustomAnnotationBitmap(
            uri = uri,
            getCurrentUri = { fourCornersImageUri },
            setCurrentUri = { fourCornersImageUri = it },
            setBitmap = { customFourCornersBitmap = it },
            reason = "fourCornersBitmap"
        )
    }

    fun applyStartPointImage(uri: String?) {
        updateCustomAnnotationBitmap(
            uri = uri,
            getCurrentUri = { startPointImageUri },
            setCurrentUri = { startPointImageUri = it },
            setBitmap = { customStartPointBitmap = it },
            reason = "startPointBitmap"
        )
    }

    fun applyWayPointImage(uri: String?) {
        updateCustomAnnotationBitmap(
            uri = uri,
            getCurrentUri = { wayPointImageUri },
            setCurrentUri = { wayPointImageUri = it },
            setBitmap = { customWayPointBitmap = it },
            reason = "wayPointBitmap"
        )
    }

    fun applyEndPointImage(uri: String?) {
        updateCustomAnnotationBitmap(
            uri = uri,
            getCurrentUri = { endPointImageUri },
            setCurrentUri = { endPointImageUri = it },
            setBitmap = { customEndPointBitmap = it },
            reason = "endPointBitmap"
        )
    }

    fun applyCustomWaypointMarkers(markers: List<Map<String, Any?>>?) {
        customWaypointMarkers = markers?.mapNotNull { item ->
            val latitude = (item["latitude"] as? Number)?.toDouble() ?: return@mapNotNull null
            val longitude = (item["longitude"] as? Number)?.toDouble() ?: return@mapNotNull null
            val rawTitle = (item["title"] as? String)?.trim()
            NaviCustomWaypointMarkerModel(
                latitude = latitude,
                longitude = longitude,
                title = rawTitle?.takeIf { it.isNotEmpty() } ?: "途经"
            )
        } ?: emptyList()
        refreshCustomWaypointMarkers("apply-custom-waypoint-markers")
    }

    private fun clearRenderedCustomWaypointMarkers() {
        renderedCustomWaypointMarkers.forEach { marker ->
            try {
                marker.remove()
            } catch (_: Throwable) {
            }
        }
        renderedCustomWaypointMarkers.clear()
    }

    private fun refreshCustomWaypointMarkers(reason: String) {
        Handler(Looper.getMainLooper()).post {
            clearRenderedCustomWaypointMarkers()
            if (isDestroyed || customWaypointMarkers.isEmpty()) {
                return@post
            }

            val map = try {
                naviView.map
            } catch (error: Throwable) {
                Log.w("ExpoGaodeMapNaviView", "Failed to access AMap for custom waypoint markers: $reason", error)
                null
            } ?: return@post

            customWaypointMarkers.forEach { marker ->
                if (marker.arrived) {
                    return@forEach
                }

                val bitmap = createCustomWaypointBubbleBitmap(marker.title)
                val options = MarkerOptions()
                    .position(LatLng(marker.latitude, marker.longitude))
                    .anchor(0.5f, 1f)
                    .zIndex(130f)
                    .icon(BitmapDescriptorFactory.fromBitmap(bitmap))
                val renderedMarker = map.addMarker(options)
                if (renderedMarker != null) {
                    renderedCustomWaypointMarkers.add(renderedMarker)
                }
            }
        }
    }

    private fun resetCustomWaypointMarkerArrivalState() {
        customWaypointMarkers = customWaypointMarkers.map { marker ->
            marker.copy(arrived = false)
        }
        refreshCustomWaypointMarkers("reset-custom-waypoint-arrival-state")
    }

    private fun markCustomWaypointArrived(rawIndex: Int) {
        if (customWaypointMarkers.isEmpty()) {
            return
        }

        val resolvedIndex = when {
            rawIndex in customWaypointMarkers.indices -> rawIndex
            (rawIndex - 1) in customWaypointMarkers.indices -> rawIndex - 1
            else -> null
        } ?: return

        customWaypointMarkers = customWaypointMarkers.mapIndexed { index, marker ->
            if (index == resolvedIndex) marker.copy(arrived = true) else marker
        }
        refreshCustomWaypointMarkers("arrived-waypoint-$rawIndex")
    }

    private fun createCustomWaypointBubbleBitmap(title: String): Bitmap {
        val density = context.resources.displayMetrics.density
        val fontSize = 16f * density
        val horizontalPadding = 14f * density
        val bodyHeight = 34f * density
        val strokeWidth = 2.5f * density

        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = fontSize
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textAlign = Paint.Align.CENTER
        }
        val bodyWidth = maxOf(
            62f * density,
            textPaint.measureText(title) + horizontalPadding * 2
        )
        val width = bodyWidth.roundToInt()
        val height = (bodyHeight + 2f * density).roundToInt()
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#2F67FF")
            style = Paint.Style.FILL
        }
        val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            style = Paint.Style.STROKE
            this.strokeWidth = strokeWidth
        }
        val shadowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#2D15357F")
            style = Paint.Style.FILL
            setShadowLayer(6f * density, 0f, 3f * density, Color.parseColor("#2D15357F"))
        }

        val bodyRect = RectF(
            strokeWidth,
            strokeWidth,
            width - strokeWidth,
            bodyHeight
        )
        val cornerRadius = 17f * density
        canvas.drawRoundRect(bodyRect, cornerRadius, cornerRadius, shadowPaint)
        canvas.drawRoundRect(bodyRect, cornerRadius, cornerRadius, fillPaint)
        canvas.drawRoundRect(bodyRect, cornerRadius, cornerRadius, strokePaint)

        val textY = bodyRect.centerY() - (textPaint.descent() + textPaint.ascent()) / 2f
        canvas.drawText(title, bodyRect.centerX(), textY, textPaint)
        return bitmap
    }


    /**
     * 设置是否显示交通信号灯
     * @param visible true-显示 false-隐藏
     * @since 6.2.0
     */
    fun applyTrafficLightsVisible(visible: Boolean) {
        try {
            naviView.setTrafficLightsVisible(visible)
            Log.d("ExpoGaodeMapNaviView", "Traffic lights visibility set to: $visible")
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Failed to set traffic lights visibility", e)
        }
    }
    
    /**
     * 设置路线标记点的可见性
     * @param showStartEndVia 是否显示起终途点
     * @param showFootFerry 是否显示步行轮渡扎点
     * @param showForbidden 是否显示禁行限行封路icon
     * @param showRouteStartIcon 是否显示路线起点icon
     * @param showRouteEndIcon 是否显示路线终点icon
     * @since 9.0.0
     */
    fun applyRouteMarkerVisible(
        showStartEndVia: Boolean,
        showFootFerry: Boolean,
        showForbidden: Boolean,
        showRouteStartIcon: Boolean,
        showRouteEndIcon: Boolean
    ) {
        routeMarkerShowStartEndVia = showStartEndVia
        routeMarkerShowFootFerry = showFootFerry
        routeMarkerShowForbidden = showForbidden
        routeMarkerShowRouteStartIcon = showRouteStartIcon
        routeMarkerShowRouteEndIcon = showRouteEndIcon
        try {
            applyRouteMarkerVisibleFromState()
            Log.d("ExpoGaodeMapNaviView", "Route marker visibility set - startEnd:$showStartEndVia, ferry:$showFootFerry, forbidden:$showForbidden, routeStart:$showRouteStartIcon, routeEnd:$showRouteEndIcon")
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Failed to set route marker visibility", e)
        }
    }
    
    /**
     * 设置是否显示拥堵气泡
     * @param show true-显示 false-不显示
     * @since 10.0.5
     */
    fun applyShowDriveCongestion(show: Boolean) {
        try {
            naviView.setShowDriveCongestion(show)
            Log.d("ExpoGaodeMapNaviView", "Drive congestion bubble visibility set to: $show")
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Failed to set drive congestion visibility", e)
        }
    }
    
    /**
     * 设置是否显示红绿灯倒计时气泡
     * @param show true-显示 false-不显示
     * @since 10.0.5
     */
    fun applyShowTrafficLightView(show: Boolean) {
        try {
            naviView.setShowTrafficLightView(show)
            Log.d("ExpoGaodeMapNaviView", "Traffic light view visibility set to: $show")
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Failed to set traffic light view visibility", e)
        }
    }

    fun applyIsNaviTravelView(enabled: Boolean){
        isNaviTravelView = enabled
        aMapNavi?.isNaviTravelView = enabled
    }

    /**
     * 设置路线转向箭头的可见性
     * @param visible true-显示 false-隐藏
     * @since 6.3.0
     */
    fun applyNaviArrowVisible(visible: Boolean) {
        try {
            isNaviArrowVisible = visible
            commitViewOptions { options ->
                options.isNaviArrowVisible = visible
            }
            Log.d("ExpoGaodeMapNaviView", "Navi arrow visibility set to: $visible")
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Failed to set navi arrow visibility", e)
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        registerActiveView()
        try {
            onResume()
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Error resuming navi view", e)
        }
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        try {
            onPause()
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Error pausing navi view", e)
        }
    }
    
    // 生命周期方法（供外部调用）
    fun onResume() {
        if (isDestroyed) {
            return
        }
        try {
            naviView.onResume()
            refreshNaviUILayout("onResume")
            Log.d("ExpoGaodeMapNaviView", "NaviView resumed")
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Error resuming navi view", e)
        }
    }
    
    fun onPause() {
        if (isDestroyed) {
            return
        }
        try {
            naviView.onPause()
            Log.d("ExpoGaodeMapNaviView", "NaviView paused")
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Error pausing navi view", e)
        }
    }
    
    fun onDestroy() {
        if (isDestroyed) {
            return
        }
        isDestroyed = true
        isNavigationRunning = false
        isHostActivityInBackground = false
        latestNavigationNotificationSnapshot = null
        NavigationForegroundService.stop(context)
        unregisterActiveView()
        clearRenderedCustomWaypointMarkers()
        try {
            naviView.onPause()
            naviView.onDestroy()
            aMapNavi?.stopSpeak()
            aMapNavi?.removeAMapNaviListener(naviListener)
            deleteCachedIconFile(cachedTurnIconImageUri)
            cachedTurnIconImageUri = null
            cachedTurnIconContentHash = null
            // AMapNavi 是单例，不需要手动 destroy
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Error destroying navi view", e)
        }
    }
}
