package expo.modules.gaodemap.navigation.services

import android.Manifest
import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.net.Uri
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.IconCompat
import expo.modules.gaodemap.navigation.R
import kotlin.math.ceil
import kotlin.math.roundToInt
import androidx.core.graphics.createBitmap
import androidx.core.graphics.toColorInt

internal data class NavigationNotificationSnapshot(
  val currentRoadName: String? = null,
  val nextRoadName: String? = null,
  val pathRetainDistance: Int? = null,
  val routeTotalDistance: Int? = null,
  val pathRetainTime: Int? = null,
  val curStepRetainDistance: Int? = null,
  val iconType: Int? = null,
  val turnIconImageUri: String? = null
)

class NavigationForegroundService : Service() {
  companion object {
    private const val TAG = "NavigationForegroundService"
    private const val NOTIFICATION_ID = 1002
    private const val CHANNEL_ID = "navigation_service_channel"
    private const val CHANNEL_NAME = "导航进行中"
    private const val PERMISSION_POST_PROMOTED_NOTIFICATIONS = "android.permission.POST_PROMOTED_NOTIFICATIONS"

    private const val ACTION_START_OR_UPDATE = "expo.modules.gaodemap.navigation.action.START_OR_UPDATE"

    private const val EXTRA_CURRENT_ROAD = "extra_current_road"
    private const val EXTRA_NEXT_ROAD = "extra_next_road"
    private const val EXTRA_PATH_RETAIN_DISTANCE = "extra_path_retain_distance"
    private const val EXTRA_ROUTE_TOTAL_DISTANCE = "extra_route_total_distance"
    private const val EXTRA_PATH_RETAIN_TIME = "extra_path_retain_time"
    private const val EXTRA_STEP_RETAIN_DISTANCE = "extra_step_retain_distance"
    private const val EXTRA_ICON_TYPE = "extra_icon_type"
    private const val EXTRA_TURN_ICON_IMAGE_URI = "extra_turn_icon_image_uri"
    @Volatile
    private var cachedRouteTotalDistanceMeters: Int? = null

    internal fun startOrUpdate(context: Context, snapshot: NavigationNotificationSnapshot?) {
      val appContext = context.applicationContext
      snapshot?.routeTotalDistance
        ?.takeIf { it > 0 }
        ?.let { cachedRouteTotalDistanceMeters = it }
      Log.d(
        TAG,
        "startOrUpdate called: stepDistance=${snapshot?.curStepRetainDistance}, " +
          "remainDistance=${snapshot?.pathRetainDistance}, routeTotal=${snapshot?.routeTotalDistance}, " +
          "remainTime=${snapshot?.pathRetainTime}, " +
          "nextRoad=${snapshot?.nextRoadName}, turnIconUri=${snapshot?.turnIconImageUri}"
      )
      val intent = Intent(appContext, NavigationForegroundService::class.java).apply {
        action = ACTION_START_OR_UPDATE
        snapshot?.let { payload ->
          putExtra(EXTRA_CURRENT_ROAD, payload.currentRoadName)
          putExtra(EXTRA_NEXT_ROAD, payload.nextRoadName)
          payload.pathRetainDistance?.let { putExtra(EXTRA_PATH_RETAIN_DISTANCE, it) }
          payload.routeTotalDistance?.let { putExtra(EXTRA_ROUTE_TOTAL_DISTANCE, it) }
          payload.pathRetainTime?.let { putExtra(EXTRA_PATH_RETAIN_TIME, it) }
          payload.curStepRetainDistance?.let { putExtra(EXTRA_STEP_RETAIN_DISTANCE, it) }
          payload.iconType?.let { putExtra(EXTRA_ICON_TYPE, it) }
          payload.turnIconImageUri?.let { putExtra(EXTRA_TURN_ICON_IMAGE_URI, it) }
        }
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        appContext.startForegroundService(intent)
      } else {
        appContext.startService(intent)
      }
    }

    internal fun stop(context: Context) {
      val appContext = context.applicationContext
      Log.d(TAG, "stop called")
      appContext.stopService(Intent(appContext, NavigationForegroundService::class.java))
    }

    @RequiresApi(Build.VERSION_CODES.TIRAMISU)
    private fun hasNotificationPermission(context: Context): Boolean {
      return ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)== PackageManager.PERMISSION_GRANTED
    }
  }

  private var latestSnapshot = NavigationNotificationSnapshot()
  private var isForeground = false
  private var routeTotalDistanceMeters: Int? = null
  private val trackerIconCache = mutableMapOf<Int, IconCompat>()
  private var customCarTrackerIcon: IconCompat? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    routeTotalDistanceMeters = cachedRouteTotalDistanceMeters
    Log.d(TAG, "onCreate")
    createNotificationChannel()
  }

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    Log.d(TAG, "onStartCommand action=${intent?.action}, startId=$startId, flags=$flags")
    if (intent?.action != ACTION_START_OR_UPDATE) {
      Log.d(TAG, "Ignoring action=${intent?.action}")
      return START_NOT_STICKY
    }

    // --- 新增防护：检查运行时权限 ---
    // 如果没有通知权限，我们不能启动前台服务（否则会崩溃），只能作为后台服务运行（但后台服务无法显示持续通知）
    // 这里的策略是：如果没有权限，只更新数据，不显示通知
    val hasPermission = hasNotificationPermission(this)

    latestSnapshot = latestSnapshot.mergeFrom(intent)
    Log.d(
      TAG,
      "merged snapshot: stepDistance=${latestSnapshot.curStepRetainDistance}, " +
        "remainDistance=${latestSnapshot.pathRetainDistance}, routeTotal=${latestSnapshot.routeTotalDistance}, " +
        "remainTime=${latestSnapshot.pathRetainTime}, " +
        "currentRoad=${latestSnapshot.currentRoadName}, nextRoad=${latestSnapshot.nextRoadName}, " +
        "turnIconUri=${latestSnapshot.turnIconImageUri}"
    )
    // 简单方案：如果有权限，正常构建；如果没有，构建一个最简通知（或者抛出日志）
    val notification = if (hasPermission) {
      buildNotification(latestSnapshot) // 原有逻辑
    } else {
      // 构建一个最基础的通知，避免崩溃
      // 注意：如果完全没有权限，连这个通知也发不出去，startForeground 会崩溃。
      // 所以，如果没有权限，我们不应该调用 startForeground。
      // 但是，如果不调用 startForeground，服务会在 5 秒后被系统杀死。

      // 最佳实践：如果没有权限，不要启动前台服务，只做数据处理。
      // 但为了代码演示，我们假设用户至少在 Android 12 及以下不需要运行时权限。
      // 在 Android 13+ 且无权限时，我们只能放弃前台服务。

      // 这里为了防止崩溃，我们直接返回，不启动前台服务。
      // 请在调用 startOrUpdate 的地方处理权限逻辑。
      Log.e(TAG, "No POST_NOTIFICATIONS permission, cannot start foreground service.")
      return START_STICKY // 服务会很快被杀死
    }


    // --- 保持原有逻辑 ---
    if (!isForeground) {
      try {
        startForeground(NOTIFICATION_ID, notification)
        isForeground = true
        Log.d(TAG, "startForeground success, notificationId=$NOTIFICATION_ID")
      } catch (e: Exception) {
        // 如果因为权限问题导致 startForeground 失败（例如 Android 13+ 未授权）
        Log.e(TAG, "Failed to start foreground service: ${e.message}", e)
        // 可能需要回退到后台逻辑，或者提示用户去设置页面
      }
    } else {
      getNotificationManager().notify(NOTIFICATION_ID, notification)
      Log.d(TAG, "notify update pushed, notificationId=$NOTIFICATION_ID")
    }

    return START_STICKY
  }

  override fun onDestroy() {
    Log.d(TAG, "onDestroy isForeground=$isForeground")
    if (isForeground) {
      stopForeground(STOP_FOREGROUND_REMOVE)
      isForeground = false
    }
    super.onDestroy()
  }

  private fun buildNotification(snapshot: NavigationNotificationSnapshot): Notification {
    val appName = resolveAppName()
    val maneuverText = resolveManeuverText(snapshot.iconType)
    val instructionText = buildInstructionText(snapshot, maneuverText)
    val roadText = buildRoadText(snapshot, fallback = "导航进行中")
    val routeSummary = buildRouteSummaryText(snapshot)
    val shortCriticalText = buildShortCriticalText(snapshot, maneuverText)
    val pendingIntent = createLaunchPendingIntent()
    val extras = Bundle().apply {
      // Keep detailed navigation payload in extras for OEM/system smart-surface readers.
      putString("expo_gaode_nav_instruction", instructionText)
      putString("expo_gaode_nav_summary", routeSummary)
      putInt("expo_gaode_nav_remain_distance", snapshot.pathRetainDistance ?: -1)
      putInt("expo_gaode_nav_remain_time", snapshot.pathRetainTime ?: -1)
      putInt("expo_gaode_nav_step_distance", snapshot.curStepRetainDistance ?: -1)
      putInt("expo_gaode_nav_icon_type", snapshot.iconType ?: -1)
      putString("expo_gaode_nav_short_critical_text", shortCriticalText)
    }
    val requestPromotedOngoing = shouldRequestPromotedOngoing()
    val canPostPromoted = canPostPromotedNotificationsCompat()
    val style = buildProgressStyle(snapshot)
    Log.d(
      TAG,
      "buildNotification promotedRequested=$requestPromotedOngoing, canPostPromoted=$canPostPromoted, sdkInt=${Build.VERSION.SDK_INT}"
    )

    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(instructionText)
      .setContentText(roadText)
      .setSubText(appName)
      .setStyle(style)
      .setSmallIcon(resolveNotificationSmallIconResId())
      .setLargeIcon(resolveManeuverLargeIconBitmap(snapshot))
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setCategory(NotificationCompat.CATEGORY_NAVIGATION)
      .setOnlyAlertOnce(true)
      .setOngoing(true)
      .setSilent(true)
      .addExtras(extras)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setRequestPromotedOngoing(requestPromotedOngoing)
      .setShortCriticalText(shortCriticalText)

    if (pendingIntent != null) {
      builder.setContentIntent(pendingIntent)
    }
    val notification = builder.build()
    logPromotionDiagnostics(
      notification = notification,
      requested = requestPromotedOngoing,
      canPostPromoted = canPostPromoted
    )
    return notification
  }

  private fun buildProgressStyle(snapshot: NavigationNotificationSnapshot): NotificationCompat.Style {
    val style = NotificationCompat.ProgressStyle()
      .setStyledByProgress(true)
      .setProgressSegments(
        listOf(
          NotificationCompat.ProgressStyle.Segment(33).setColor("#4B63FF".toColorInt()),
          NotificationCompat.ProgressStyle.Segment(33).setColor("#4B63FF".toColorInt()),
          NotificationCompat.ProgressStyle.Segment(34).setColor("#4B63FF".toColorInt())
        )
      )
      .setProgressPoints(
        listOf(
          NotificationCompat.ProgressStyle.Point(33).setColor("#BAC7FF".toColorInt()),
          NotificationCompat.ProgressStyle.Point(66).setColor("#BAC7FF".toColorInt()),
          NotificationCompat.ProgressStyle.Point(100).setColor("#BAC7FF".toColorInt())
        )
      )

    (resolveTurnTrackerIcon(snapshot) ?: resolveDefaultTrackerIcon())
      ?.let { style.setProgressTrackerIcon(it) }

    val remainDistance = snapshot.pathRetainDistance
    if (remainDistance == null || remainDistance <= 0) {
      style.setProgressIndeterminate(true)
      Log.d(TAG, "progress style indeterminate: remainDistance=$remainDistance")
      return style
    }

    val previousTotal = routeTotalDistanceMeters ?: 0
    val cachedTotal = cachedRouteTotalDistanceMeters ?: 0
    val snapshotTotal = snapshot.routeTotalDistance?.coerceAtLeast(0) ?: 0
    val updatedTotal = maxOf(previousTotal, cachedTotal, snapshotTotal, remainDistance)
    routeTotalDistanceMeters = updatedTotal
    if (updatedTotal > 0) {
      cachedRouteTotalDistanceMeters = updatedTotal
    }
    val progress = (updatedTotal - remainDistance).coerceAtLeast(0)
    val progressPercent = ((progress.toFloat() / updatedTotal.toFloat()) * 100f)
      .coerceIn(0f, 100f)
      .roundToInt()
    style
      .setProgressIndeterminate(false)
      .setProgress(progressPercent)

    Log.d(
      TAG,
      "progress style determinate: progress=$progress, max=$updatedTotal, remainDistance=$remainDistance, " +
        "progressPercent=$progressPercent"
    )
    return style
  }

  private fun resolveAppName(): String {
    return try {
      packageManager.getApplicationLabel(applicationInfo).toString()
          .takeIf { it.isNotBlank() }
        ?: "导航"
    } catch (_: Throwable) {
      "导航"
    }
  }

  private fun resolveNotificationSmallIconResId(): Int {
    return R.drawable.ic_nav_notification_small
  }

  private fun resolveManeuverLargeIconBitmap(snapshot: NavigationNotificationSnapshot): Bitmap? {
    val fromUri = resolveTurnIconBitmapFromUri(snapshot.turnIconImageUri)
    if (fromUri != null) {
      return fromUri
    }

    val iconType = snapshot.iconType ?: return null
    return runCatching { createTurnTrackerBitmap(iconType) }
      .onFailure { Log.w(TAG, "Failed to build maneuver large icon bitmap", it) }
      .getOrNull()
  }

  private fun resolveTurnIconBitmapFromUri(uriString: String?): Bitmap? {
    val uri = uriString?.takeIf { it.isNotBlank() } ?: return null
    return try {
      contentResolver.openInputStream(Uri.parse(uri))?.use { input ->
        BitmapFactory.decodeStream(input)
      }
    } catch (error: Throwable) {
      Log.w(TAG, "Failed to decode turn icon bitmap from uri=$uri", error)
      null
    }
  }

  @SuppressLint("UseKtx")
  private fun resolveTurnTrackerIcon(snapshot: NavigationNotificationSnapshot): IconCompat? {
    resolveCustomCarTrackerIcon()?.let { return it }

    resolveTurnTrackerIconFromIconType(snapshot.iconType)?.let {
      return it
    }

    val uri = snapshot.turnIconImageUri?.takeIf { it.isNotBlank() } ?: return null
    return try {
      Log.d(TAG, "Using turn tracker icon from uri=$uri")
      IconCompat.createWithContentUri(uri)
    } catch (error: Throwable) {
      Log.w(TAG, "Failed to resolve turn tracker icon from uri=$uri", error)
      null
    }
  }

  private fun resolveCustomCarTrackerIcon(): IconCompat? {
    customCarTrackerIcon?.let { return it }
    return try {
      val bitmap = BitmapFactory.decodeResource(resources, R.drawable.nav_tracker_car)
      if (bitmap == null) {
        Log.w(TAG, "Failed to decode nav_tracker_car bitmap")
        return null
      }
      val rotated = rotateBitmap(bitmap, 90f)
      IconCompat.createWithBitmap(rotated).also {
        customCarTrackerIcon = it
        Log.d(TAG, "Using custom car tracker icon from drawable nav_tracker_car (rotated 90deg)")
      }
    } catch (error: Throwable) {
      Log.w(TAG, "Failed to load custom car tracker icon, fallback to default logic", error)
      null
    }
  }

  private fun rotateBitmap(source: Bitmap, angleDegrees: Float): Bitmap {
    val matrix = Matrix().apply { postRotate(angleDegrees) }
    return Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true)
  }

  private fun resolveTurnTrackerIconFromIconType(iconType: Int?): IconCompat? {
    val safeIconType = iconType ?: return null
    trackerIconCache[safeIconType]?.let { return it }

    return try {
      val icon = IconCompat.createWithBitmap(createTurnTrackerBitmap(safeIconType))
      trackerIconCache[safeIconType] = icon
      Log.d(TAG, "Using generated turn tracker icon from iconType=$safeIconType")
      icon
    } catch (error: Throwable) {
      Log.w(TAG, "Failed to generate tracker icon for iconType=$safeIconType", error)
      null
    }
  }

  private fun createTurnTrackerBitmap(iconType: Int): Bitmap {
    val sizePx = 72
    val bitmap = createBitmap(sizePx, sizePx)
    val canvas = Canvas(bitmap)

    val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = "#4556A8".toColorInt()
      style = Paint.Style.FILL
    }
    val radius = sizePx * 0.24f
    canvas.drawRoundRect(0f, 0f, sizePx.toFloat(), sizePx.toFloat(), radius, radius, bgPaint)

    val arrow = resolveArrowGlyph(iconType)
    val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.WHITE
      textAlign = Paint.Align.CENTER
      textSize = sizePx * 0.52f
      typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }
    val y = sizePx / 2f - (textPaint.descent() + textPaint.ascent()) / 2f
    canvas.drawText(arrow, sizePx / 2f, y, textPaint)
    return bitmap
  }

  private fun resolveArrowGlyph(iconType: Int): String {
    return when (iconType) {
      2 -> "←"
      3 -> "→"
      4 -> "↖"
      5 -> "↗"
      6 -> "↙"
      7 -> "↘"
      8 -> "↶"
      9 -> "↑"
      15, 31 -> "⇦"
      16, 32 -> "⇨"
      else -> "↑"
    }
  }

  private fun resolveDefaultTrackerIcon(): IconCompat? {
    return try {
      IconCompat.createWithResource(this, android.R.drawable.ic_menu_directions)
    } catch (error: Throwable) {
      Log.w(TAG, "Failed to resolve default tracker icon", error)
      null
    }
  }

  private fun resolveManeuverText(iconType: Int?): String {
    return when (iconType ?: -1) {
      2 -> "左转"
      3 -> "右转"
      4 -> "向左前方行驶"
      5 -> "向右前方行驶"
      6 -> "向左后方行驶"
      7 -> "向右后方行驶"
      8 -> "调头"
      9 -> "直行"
      11 -> "进入环岛"
      12 -> "驶出环岛"
      14 -> "左转弯待转"
      15, 31 -> "靠左行驶"
      16, 32 -> "靠右行驶"
      17 -> "进入隧道"
      29 -> "进入匝道"
      30 -> "驶出匝道"
      else -> ""
    }
  }

  private fun buildShortCriticalText(snapshot: NavigationNotificationSnapshot, maneuverText: String): String {
    val stepDistance = snapshot.curStepRetainDistance?.let { formatDistance(it) }
    if (!stepDistance.isNullOrBlank() && maneuverText.isNotBlank()) {
      return "$stepDistance $maneuverText"
    }
    if (!stepDistance.isNullOrBlank()) {
      return "${stepDistance}后继续"
    }
    if (maneuverText.isNotBlank()) {
      return maneuverText
    }
    val remainDistance = snapshot.pathRetainDistance
    return if (remainDistance != null) {
      formatDistance(remainDistance)
    } else {
      "导航中"
    }
  }

  private fun shouldRequestPromotedOngoing(): Boolean {
    // 1. 必须是 Android 13+
    if (Build.VERSION.SDK_INT < 33) {
      Log.d(TAG, "promoted disabled: sdkInt=${Build.VERSION.SDK_INT} < 33")
      return false
    }
    // 2. 检查运行时权限（关键修改）
    if (!hasNotificationPermission(this)) {
      Log.w(TAG, "Missing POST_NOTIFICATIONS runtime permission. Falling back to normal notification.")
      return false
    }
    if (Build.VERSION.SDK_INT >= 36 && !hasManifestPermission(PERMISSION_POST_PROMOTED_NOTIFICATIONS)) {
      Log.w(TAG, "Missing POST_PROMOTED_NOTIFICATIONS in manifest. Cannot request promoted ongoing.")
      return false
    }
    return true
  }

  private fun hasManifestPermission(permission: String): Boolean {
    return try {
      packageManager.checkPermission(permission, packageName) == PackageManager.PERMISSION_GRANTED
    } catch (_: Throwable) {
      false
    }
  }

  private fun canPostPromotedNotificationsCompat(): Boolean? {
    if (Build.VERSION.SDK_INT < 36) {
      return null
    }
    return try {
      canPostPromotedNotificationsApi36(getNotificationManager())
    } catch (error: Throwable) {
      Log.w(TAG, "canPostPromotedNotifications check failed", error)
      null
    }
  }

  @RequiresApi(36)
  private fun canPostPromotedNotificationsApi36(manager: NotificationManager): Boolean {
    return manager.canPostPromotedNotifications()
  }

  private fun logPromotionDiagnostics(
    notification: Notification,
    requested: Boolean,
    canPostPromoted: Boolean?
  ) {
    val hasPromotableCharacteristics = if (Build.VERSION.SDK_INT >= 36) {
      hasPromotableCharacteristicsApi36(notification)
    } else {
      null
    }
    val promotedFlagEnabled = if (Build.VERSION.SDK_INT >= 36) {
      isPromotedFlagEnabledApi36(notification)
    } else {
      null
    }

    Log.d(
      TAG,
      "promotion diagnostics: requested=$requested, canPostPromoted=$canPostPromoted, promotable=$hasPromotableCharacteristics, promotedFlag=$promotedFlagEnabled"
    )
  }

  @RequiresApi(36)
  private fun hasPromotableCharacteristicsApi36(notification: Notification): Boolean {
    return notification.hasPromotableCharacteristics()
  }

  @RequiresApi(36)
  private fun isPromotedFlagEnabledApi36(notification: Notification): Boolean {
    return (notification.flags and Notification.FLAG_PROMOTED_ONGOING) != 0
  }

  private fun createLaunchPendingIntent(): PendingIntent? {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName) ?: return null
    launchIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    val flags =
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    return PendingIntent.getActivity(this, 0, launchIntent, flags)
  }

  private fun buildInstructionText(snapshot: NavigationNotificationSnapshot, maneuverText: String): String {
    val stepDistanceText = snapshot.curStepRetainDistance?.let { formatDistance(it) }
    if (!stepDistanceText.isNullOrBlank() && maneuverText.isNotBlank()) {
      return "${stepDistanceText}后$maneuverText"
    }
    if (!stepDistanceText.isNullOrBlank()) {
      return "${stepDistanceText}后执行下一步"
    }
    if (maneuverText.isNotBlank()) {
      return maneuverText
    }
    return "导航进行中"
  }

  private fun buildRoadText(snapshot: NavigationNotificationSnapshot, fallback: String): String {
    val nextRoad = snapshot.nextRoadName?.trim().orEmpty()
    if (nextRoad.isNotBlank()) {
      return nextRoad
    }
    val currentRoad = snapshot.currentRoadName?.trim().orEmpty()
    if (currentRoad.isNotBlank()) {
      return currentRoad
    }
    return fallback
  }

  private fun buildRouteSummaryText(snapshot: NavigationNotificationSnapshot): String {
    val retainDistanceText = snapshot.pathRetainDistance?.let { formatDistance(it) } ?: "--"
    val retainTimeText = snapshot.pathRetainTime?.let { formatDuration(it) } ?: "--"
    val road = snapshot.currentRoadName?.trim().orEmpty().ifBlank { "前方道路" }
    return "剩余${retainDistanceText} · 约${retainTimeText} · $road"
  }

  @SuppressLint("DefaultLocale")
  private fun formatDistance(distanceMeters: Int): String {
    return if (distanceMeters < 1000) {
      "${distanceMeters.coerceAtLeast(0)}米"
    } else {
      String.format("%.1f公里", distanceMeters / 1000.0)
    }
  }

  private fun formatDuration(durationSeconds: Int): String {
    val safeSeconds = durationSeconds.coerceAtLeast(0)
    if (safeSeconds < 3600) {
      return "${ceil(safeSeconds / 60.0).toInt()}分钟"
    }

    val hours = safeSeconds / 3600
    val minutes = ceil((safeSeconds % 3600) / 60.0).toInt().coerceAtMost(59)
    return "${hours}小时${minutes}分钟"
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val channel = NotificationChannel(
      CHANNEL_ID,
      CHANNEL_NAME,
      NotificationManager.IMPORTANCE_DEFAULT
    ).apply {
      description = "导航进行中通知"
      setShowBadge(false)
    }
    getNotificationManager().createNotificationChannel(channel)
    Log.d(TAG, "notification channel ensured: id=$CHANNEL_ID, importance=${channel.importance}")
  }

  private fun getNotificationManager(): NotificationManager {
    return getSystemService(NOTIFICATION_SERVICE) as NotificationManager
  }

  private fun NavigationNotificationSnapshot.mergeFrom(intent: Intent): NavigationNotificationSnapshot {
    return copy(
      currentRoadName = intent.getStringExtra(EXTRA_CURRENT_ROAD) ?: currentRoadName,
      nextRoadName = intent.getStringExtra(EXTRA_NEXT_ROAD) ?: nextRoadName,
      pathRetainDistance = if (intent.hasExtra(EXTRA_PATH_RETAIN_DISTANCE)) {
        intent.getIntExtra(EXTRA_PATH_RETAIN_DISTANCE, pathRetainDistance ?: 0)
      } else {
        pathRetainDistance
      },
      pathRetainTime = if (intent.hasExtra(EXTRA_PATH_RETAIN_TIME)) {
        intent.getIntExtra(EXTRA_PATH_RETAIN_TIME, pathRetainTime ?: 0)
      } else {
        pathRetainTime
      },
      curStepRetainDistance = if (intent.hasExtra(EXTRA_STEP_RETAIN_DISTANCE)) {
        intent.getIntExtra(EXTRA_STEP_RETAIN_DISTANCE, curStepRetainDistance ?: 0)
      } else {
        curStepRetainDistance
      },
      iconType = if (intent.hasExtra(EXTRA_ICON_TYPE)) {
        intent.getIntExtra(EXTRA_ICON_TYPE, iconType ?: 0)
      } else {
        iconType
      },
      turnIconImageUri = intent.getStringExtra(EXTRA_TURN_ICON_IMAGE_URI) ?: turnIconImageUri
    )
  }
}
