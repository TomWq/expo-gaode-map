package expo.modules.gaodemap.navigation

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.ViewGroup
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.AMapNaviListener
import com.amap.api.navi.AMapNaviView
import com.amap.api.navi.AMapNaviViewListener
import com.amap.api.navi.AMapNaviViewOptions
import com.amap.api.navi.enums.MapStyle
import com.amap.api.navi.enums.NaviType
import com.amap.api.navi.model.*
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.util.IdentityHashMap

@SuppressLint("ViewConstructor")
@Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
class ExpoGaodeMapNaviView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
    
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
    
    // Props - 使用 internal 避免自动生成 setter
    internal var showCamera: Boolean = true
    internal var naviType: Int = NaviType.GPS
    internal var enableVoice: Boolean = true


    internal var androidStatusBarPaddingTopDp: Double? = null

    internal var showUIElements: Boolean = true
    internal var androidTrafficBarEnabled: Boolean = true
    internal var isRouteListButtonShow: Boolean = true
    internal var isTrafficLayerEnabled: Boolean = true
    internal var autoChangeZoom : Boolean = true
    internal var autoLockCar: Boolean = true
    internal var isTrafficLine: Boolean = true
    internal var isRealCrossDisplayShow : Boolean = true
    internal var isNaviArrowVisible : Boolean = true
    internal var isAfterRouteAutoGray: Boolean = false
    internal var isVectorLineShow: Boolean = true
    internal var isNaviTravelView : Boolean = false
    private val naviView: AMapNaviView = AMapNaviView(context)
    private var aMapNavi: AMapNavi? = null
    private var startCoordinate: NaviLatLng? = null
    private var endCoordinate: NaviLatLng? = null

    private var lastAppliedTopPaddingPx: Int? = null

    private var topInsetPx: Int = 0
    private var overlayHooked: Boolean = false
    private val overlayStates = IdentityHashMap<View, OverlayState>()

    private data class OverlayState(
        val translationY: Float,
        val paddingTop: Int
    )
    
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
            onNavigationStarted(mapOf(
                "type" to type,
                "isEmulator" to (type == 1)
            ))
        }

        override fun onTrafficStatusUpdate() {
            // 交通状态更新
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
            onNavigationEnded(emptyMap())
        }

        override fun onArriveDestination() {
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
        }

        override fun onCalculateRouteFailure(errorCode: Int) {
            onRouteCalculated(mapOf(
                "success" to false,
                "errorCode" to errorCode
            ))
        }

        override fun onCalculateRouteFailure(result: AMapCalcRouteResult?) {
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
                onNavigationInfoUpdate(mapOf(
                    "currentRoadName" to (it.currentRoadName ?: ""),
                    "nextRoadName" to (it.nextRoadName ?: ""),
                    "pathRetainDistance" to it.pathRetainDistance,
                    "pathRetainTime" to it.pathRetainTime,
                    "curStepRetainDistance" to it.curStepRetainDistance,
                    "curStepRetainTime" to it.curStepRetainTime
                ))
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
        }

        override fun hideCross() {
            // 隐藏路口放大图
        }

        override fun showModeCross(modelCross: AMapModelCross?) {
            // 显示路口3D模型
        }

        override fun hideModeCross() {
            // 隐藏路口3D模型
        }

        override fun showLaneInfo(laneInfo: AMapLaneInfo?) {
            // 显示车道信息
        }

        override fun showLaneInfo(laneInfos: Array<out AMapLaneInfo>?, laneBackgroundInfo: ByteArray?, laneRecommendedInfo: ByteArray?) {
            // 显示车道信息（重载方法）
        }

        override fun hideLaneInfo() {
            // 隐藏车道信息
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
            // 初始化导航视图
            naviView.onCreate(Bundle())
            naviView.layoutParams = android.widget.FrameLayout.LayoutParams(
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT
            )
            addView(naviView)

            clipChildren = false
            clipToPadding = false
            naviView.clipChildren = false
            naviView.clipToPadding = false
            
            ensureOverlayInsetHook()
            
            // 使用单例获取导航实例
            aMapNavi = AMapNavi.getInstance(context.applicationContext)
            aMapNavi?.addAMapNaviListener(naviListener)
            
            // 使用内置语音播报功能（v5.6.0+）
            aMapNavi?.setUseInnerVoice(true, true) // 启用内置语音，并回调文字
           //设置是否为骑步行视图
            aMapNavi?.isNaviTravelView = isNaviTravelView
            // 设置导航视图选项 - 根据 AMapNaviViewOptions API
            val options = AMapNaviViewOptions()
            
            // === 基础界面控制 ===
            // 注意：isLayoutVisible 控制整个导航UI布局的显示
            // 设置为 true 将显示导航信息面板（包括距离、时间等）
            options.isLayoutVisible = showUIElements
            options.isSettingMenuEnabled = true // 显示设置菜单按钮
            options.isCompassEnabled = true // 显示指南针
            options.isTrafficBarEnabled = androidTrafficBarEnabled // 显示路况条
            options.isRouteListButtonShow = isRouteListButtonShow // 显示路线全览按钮

            Log.d("ExpoGaodeMapNaviView", "导航UI配置: isLayoutVisible=true, 所有UI元素已启用")
            
            // === 地图图层 ===
            options.isTrafficLayerEnabled = isTrafficLayerEnabled // 显示交通路况图层
            options.isTrafficLine = isTrafficLine // 显示交通路况线
            
            // === 路口放大图和车道信息 ===
            options.isRealCrossDisplayShow = isRealCrossDisplayShow // 显示实景路口放大图
            options.setModeCrossDisplayShow(true) // 显示路口3D模型（使用方法而非属性）
            options.isLaneInfoShow = true // 显示车道信息
            options.isEyrieCrossDisplay = true // 显示鹰眼路口图
            
            // === 摄像头和电子眼 ===
            options.isCameraBubbleShow = showCamera // 显示摄像头气泡（已废弃但仍可用）
            options.isShowCameraDistance = true // 显示与摄像头的距离
            options.isWidgetOverSpeedPulseEffective = true // 超速脉冲效果
            
            // === 路线和导航箭头 ===
            options.isAutoDrawRoute = true // 自动绘制路线
            options.isNaviArrowVisible = isNaviArrowVisible // 显示导航箭头
            options.isSecondActionVisible = true // 显示辅助操作（如下个路口提示）
            options.isDrawBackUpOverlay = true // 绘制备用路线覆盖物
            if(isVectorLineShow)
            options.isLeaderLineEnabled
            
            // === 地图锁车和视角控制 ===
            options.isAutoLockCar = autoLockCar // 自动锁车
            options.lockMapDelayed = 5000L // 5秒后自动锁车（毫秒）
            options.isAutoDisplayOverview = false // 不自动显示全览
            options.isAutoChangeZoom = autoChangeZoom // 根据导航自动调整缩放级别
            options.zoom = 18 // 锁车时的缩放级别 (14-18)
            options.tilt = 35 // 锁车时的倾斜角度 (0-60)
            
            // === 已走路线处理 ===
            options.isAfterRouteAutoGray = isAfterRouteAutoGray // 走过的路线自动变灰
            
            // === 传感器和定位 ===
            options.isSensorEnable = true // 使用设备传感器
            
            // === 夜间模式（已废弃但保留兼容） ===
            // 建议使用 setMapStyle 方法设置地图样式
            options.isAutoNaviViewNightMode = false // 不自动切换夜间模式
            
            // === 鹰眼地图 ===
            options.isEagleMapVisible = false // 不显示鹰眼地图（小地图）
            
            naviView.viewOptions = options

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
                override fun onNaviViewLoaded() {}
                override fun onMapTypeChanged(mapType: Int) {}
            })
            
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Error initializing navi view", e)
        }
    }

    private fun getStatusBarHeightPx(): Int {
        return try {
            val resourceId = context.resources.getIdentifier("status_bar_height", "dimen", "android")
            if (resourceId > 0) context.resources.getDimensionPixelSize(resourceId) else 0
        } catch (_: Exception) {
            0
        }
    }

    private fun dpToPx(dp: Double): Int {
        val density = context.resources.displayMetrics.density
        return (dp * density + 0.5).toInt()
    }

    private fun updateTopInsetPadding() {
        val shouldApplyPadding =  androidStatusBarPaddingTopDp != null
        val paddingTopPx = if (shouldApplyPadding) {
            androidStatusBarPaddingTopDp?.let { dpToPx(it) } ?: getStatusBarHeightPx()
        } else {
           //默认返回状态栏高度
            getStatusBarHeightPx()
        }

        if (lastAppliedTopPaddingPx == paddingTopPx) {
            return
        }

        lastAppliedTopPaddingPx = paddingTopPx

        topInsetPx = paddingTopPx

        naviView.setPadding(0, 0, 0, 0)

        applyTopInsetToOverlays(paddingTopPx)
    }

    private fun ensureOverlayInsetHook() {
        if (overlayHooked) {
            return
        }

        overlayHooked = true
        naviView.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
            applyTopInsetToOverlays(topInsetPx)
        }
    }

    private fun applyTopInsetToOverlays(paddingTopPx: Int) {
        if (paddingTopPx <= 0) {
            if (overlayStates.isNotEmpty()) {
                val iterator = overlayStates.entries.iterator()
                while (iterator.hasNext()) {
                    val entry = iterator.next()
                    val view = entry.key
                    val state = entry.value
                    view.translationY = state.translationY
                    view.setPadding(view.paddingLeft, state.paddingTop, view.paddingRight, view.paddingBottom)
                    iterator.remove()
                }
            }
            return
        }

        val rawTargets = findTopOverlayTargets(naviView)
        val targets = filterTopLevelTargets(naviView, rawTargets)
        if (targets.isEmpty()) {
            val applied = applyTopPaddingToNaviUiLayer(paddingTopPx)
            if (!applied) {
                naviView.post { applyTopPaddingToNaviUiLayer(paddingTopPx) }
            }
            return
        }

        val targetSet = targets.toHashSet()

        val iterator = overlayStates.entries.iterator()
        while (iterator.hasNext()) {
            val entry = iterator.next()
            val view = entry.key
            if (!targetSet.contains(view)) {
                val state = entry.value
                view.translationY = state.translationY
                view.setPadding(view.paddingLeft, state.paddingTop, view.paddingRight, view.paddingBottom)
                iterator.remove()
            }
        }

        for (target in targets) {
            if (!overlayStates.containsKey(target)) {
                overlayStates[target] = OverlayState(
                    translationY = target.translationY,
                    paddingTop = target.paddingTop
                )
            }
            ensureNoClipChain(target)
            target.translationY = paddingTopPx.toFloat()
        }
    }

    private fun ensureNoClipChain(view: View) {
        var currentParent = view.parent
        while (currentParent is ViewGroup) {
            currentParent.clipChildren = false
            currentParent.clipToPadding = false
            if (currentParent === naviView) {
                break
            }
            currentParent = currentParent.parent
        }
    }

    private fun filterTopLevelTargets(root: ViewGroup, targets: List<View>): List<View> {
        if (targets.size <= 1) {
            return targets
        }

        val set = targets.toHashSet()
        val result = ArrayList<View>(targets.size)
        for (view in targets) {
            var parent = view.parent
            var hasAncestorInTargets = false
            while (parent is View) {
                if (parent === root) {
                    break
                }
                if (set.contains(parent)) {
                    hasAncestorInTargets = true
                    break
                }
                parent = parent.parent
            }
            if (!hasAncestorInTargets) {
                result.add(view)
            }
        }

        return result
    }

    private fun findTopOverlayTargets(root: ViewGroup): List<View> {
        val result = ArrayList<View>()
        val parentHeight = root.height
        val parentWidth = root.width
        if (parentHeight <= 0 || parentWidth <= 0) {
            return result
        }

        val queue = ArrayDeque<View>()
        for (i in 0 until root.childCount) {
            queue.add(root.getChildAt(i))
        }

        while (queue.isNotEmpty()) {
            val view = queue.removeFirst()
            val group = view as? ViewGroup
            if (group != null) {
                for (i in 0 until group.childCount) {
                    queue.add(group.getChildAt(i))
                }
            }

            if (!view.isShown) {
                continue
            }

            val name = view.javaClass.name
            if (name.contains("MapView", ignoreCase = true) ||
                name.contains("Texture", ignoreCase = true) ||
                name.contains("Surface", ignoreCase = true) ||
                name.contains("GLSurface", ignoreCase = true)
            ) {
                continue
            }

            if (view.height <= 0 || view.width <= 0) {
                continue
            }

            if (view.top > 1) {
                continue
            }

            if (view.height >= (parentHeight * 0.6f).toInt()) {
                continue
            }

            val wideEnough = view.width >= (parentWidth * 0.5f).toInt()
            val likelyUi = wideEnough && (view.isClickable || (view as? ViewGroup)?.childCount ?: 0 > 0)
            if (!likelyUi) {
                continue
            }

            result.add(view)
        }

        return result
    }

    private fun applyTopPaddingToNaviUiLayer(paddingTopPx: Int): Boolean {
        val uiRoot = findNaviUiRoot(naviView) ?: return false

        uiRoot.setPadding(uiRoot.paddingLeft, paddingTopPx, uiRoot.paddingRight, uiRoot.paddingBottom)
        uiRoot.clipToPadding = false
        return true
    }

    private fun findNaviUiRoot(root: ViewGroup): ViewGroup? {
        var best: ViewGroup? = null
        var bestScore = Int.MIN_VALUE

        val queue = ArrayDeque<View>()
        for (i in 0 until root.childCount) {
            queue.add(root.getChildAt(i))
        }

        while (queue.isNotEmpty()) {
            val view = queue.removeFirst()
            val group = view as? ViewGroup
            if (group != null) {
                val score = scoreAsUiRootCandidate(group)
                if (score > bestScore) {
                    bestScore = score
                    best = group
                }
                for (i in 0 until group.childCount) {
                    queue.add(group.getChildAt(i))
                }
            }
        }

        return if (bestScore > 0) best else null
    }

    private fun scoreAsUiRootCandidate(group: ViewGroup): Int {
        val name = group.javaClass.name
        if (name.contains("MapView", ignoreCase = true) ||
            name.contains("Texture", ignoreCase = true) ||
            name.contains("Surface", ignoreCase = true) ||
            name.contains("GLSurface", ignoreCase = true)
        ) {
            return Int.MIN_VALUE
        }

        var score = 0

        val lp = group.layoutParams
        if (lp != null) {
            if (lp.width == ViewGroup.LayoutParams.MATCH_PARENT && lp.height == ViewGroup.LayoutParams.MATCH_PARENT) {
                score += 4
            } else if (lp.width == ViewGroup.LayoutParams.MATCH_PARENT) {
                score += 2
            }
        }

        if (group.childCount >= 3) {
            score += 2
        } else if (group.childCount >= 1) {
            score += 1
        }

        if (name.contains("RelativeLayout", ignoreCase = true) || name.contains("FrameLayout", ignoreCase = true)) {
            score += 1
        }

        return score
    }



    fun applyAndroidStatusBarPaddingTop(topDp: Double?) {
        androidStatusBarPaddingTopDp = topDp
        updateTopInsetPadding()
    }

    fun applyShowUIElements(visible: Boolean) {
        showUIElements = visible
        val options = naviView.viewOptions
        options.isLayoutVisible = visible
        naviView.viewOptions = options
    }

    fun applyAndroidTrafficBarEnabled(enabled: Boolean) {
        androidTrafficBarEnabled = enabled
        val options = naviView.viewOptions
        options.isTrafficBarEnabled = enabled
        naviView.viewOptions = options
    }

    fun applyShowTrafficButton(enabled: Boolean) {
        isTrafficLayerEnabled = enabled
        val options = naviView.viewOptions
        options.isTrafficLayerEnabled = enabled
        naviView.viewOptions = options
    }

    fun applyShowBrowseRouteButton(enabled: Boolean) {
        isRouteListButtonShow = enabled
        val options = naviView.viewOptions
        options.isRouteListButtonShow = enabled
        naviView.viewOptions = options
    }

    fun applyShowGreyAfterPass(enabled: Boolean){
        isAfterRouteAutoGray = enabled
        val options = naviView.viewOptions
        options.isAfterRouteAutoGray = enabled
        naviView.viewOptions = options
    }

    fun applyShowVectorline(enabled: Boolean){
        isVectorLineShow = enabled
        val options = naviView.viewOptions
        if(enabled)
        options.isLeaderLineEnabled
        naviView.viewOptions = options
    }

    fun startNavigation(startLat: Double, startLng: Double, endLat: Double, endLng: Double, promise: expo.modules.kotlin.Promise) {
        Log.d("ExpoGaodeMapNaviView", "startNavigation: $startLat, $startLng, $endLat, $endLng, naviType: $naviType")
        try {
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

    fun stopNavigation(promise: expo.modules.kotlin.Promise) {
        try {
            aMapNavi?.stopNavi()
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
        // 摄像头显示设置
        val options = naviView.viewOptions
        options.isCameraBubbleShow = show
        naviView.viewOptions = options
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
        val options = naviView.viewOptions
        options.isAutoLockCar = enabled
        naviView.viewOptions = options
    }
    
    fun applyAutoChangeZoom(enabled: Boolean) {
        autoChangeZoom = enabled
        val options = naviView.viewOptions
        options.isAutoChangeZoom = enabled
        naviView.viewOptions = options
    }
    
    fun applyTrafficLayerEnabled(enabled: Boolean) {
        isTrafficLine = enabled
        val options = naviView.viewOptions
        options.isTrafficLine = enabled
        naviView.viewOptions = options
    }
    
    fun applyRealCrossDisplay(enabled: Boolean) {
        isRealCrossDisplayShow = enabled
        val options = naviView.viewOptions
        options.isRealCrossDisplayShow = enabled
        naviView.viewOptions = options
    }
    
    fun applyNaviMode(mode: Int) {
        // 0: 车头朝上 1: 正北朝上
        naviView.naviMode = mode
    }
    
    fun applyShowMode(mode: Int) {
        // 1-锁车态 2-全览态 3-普通态
        naviView.setShowMode(mode)
    }
    
    fun applyNightMode(enabled: Boolean) {
        // 夜间模式设置 - isNightMode 属性可能不存在
        try {
            val options = naviView.viewOptions
            if(enabled){
                options.setMapStyle(MapStyle.NIGHT, null)
            }else{
                options.setMapStyle(MapStyle.DAY, null)
            }
            // options.isNightMode = enabled // 该属性可能不存在
            // 可以通过其他方式设置夜间模式
            naviView.viewOptions = options
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Failed to set night mode", e)
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
        try {
            naviView.setRouteMarkerVisible(showStartEndVia, showFootFerry, showForbidden, showRouteStartIcon, showRouteEndIcon)
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
            val options = naviView.viewOptions
            options.isNaviArrowVisible = visible
            naviView.viewOptions = options
            Log.d("ExpoGaodeMapNaviView", "Navi arrow visibility set to: $visible")
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Failed to set navi arrow visibility", e)
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        try {
            naviView.onResume()
            Log.d("ExpoGaodeMapNaviView", "NaviView resumed")
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Error resuming navi view", e)
        }
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        try {
            naviView.onPause()
            naviView.onDestroy()
            
            // 停止语音播报
            aMapNavi?.stopSpeak()
            
            // 移除监听器但保留 AMapNavi 实例（因为是单例）
            aMapNavi?.removeAMapNaviListener(naviListener)
            
            Log.d("ExpoGaodeMapNaviView", "NaviView paused and destroyed")
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Error destroying navi view", e)
        }
    }
    
    // 生命周期方法（供外部调用）
    fun onResume() {
        try {
            naviView.onResume()
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Error resuming navi view", e)
        }
    }
    
    fun onPause() {
        try {
            naviView.onPause()
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Error pausing navi view", e)
        }
    }
    
    fun onDestroy() {
        try {
            naviView.onDestroy()
            aMapNavi?.removeAMapNaviListener(naviListener)
            // AMapNavi 是单例，不需要手动 destroy
        } catch (e: Exception) {
            Log.e("ExpoGaodeMapNaviView", "Error destroying navi view", e)
        }
    }
}
