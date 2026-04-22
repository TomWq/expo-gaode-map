package expo.modules.gaodemap.navigation

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * 高德导航视图 Module
 */
class ExpoGaodeMapNaviViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGaodeMapNaviView")

    OnActivityEntersForeground {
      ExpoGaodeMapNaviView.resumeActiveViews()
    }

    OnActivityEntersBackground {
      ExpoGaodeMapNaviView.pauseActiveViews()
    }

    OnActivityDestroys {
      ExpoGaodeMapNaviView.destroyActiveViews()
    }

    View(ExpoGaodeMapNaviView::class) {
      Events(
        "onNavigationReady",
        "onNavigationStarted",
        "onNavigationFailed",
        "onNavigationEnded",
        "onLocationUpdate",
        "onNavigationText",
        "onArriveDestination",
        "onRouteCalculated",
        "onRouteRecalculate",
        "onWayPointArrived",
        "onGpsStatusChanged",
        "onNavigationInfoUpdate",
        "onGpsSignalWeak",
        "onNavigationVisualStateUpdate",
        "onLaneInfoUpdate",
        "onTrafficStatusesUpdate"
      )

      OnViewDestroys { view: ExpoGaodeMapNaviView ->
        view.onDestroy()
      }

      // Props
      Prop<Int>("naviType") { view, type ->
        view.applyNaviType(type)
      }
      
      Prop<Boolean>("enableVoice") { view, enabled ->
        view.applyEnableVoice(enabled)
      }

      Prop<String?>("carImage") { view, uri ->
        view.applyCarImage(uri)
      }

      Prop<Map<String, Double>?>("carImageSize") { view, value ->
        val width = value?.get("width")
        val height = value?.get("height")
        view.applyCarImageSize(width, height)
      }

      Prop<String?>("fourCornersImage") { view, uri ->
        view.applyFourCornersImage(uri)
      }

      Prop<String?>("startPointImage") { view, uri ->
        view.applyStartPointImage(uri)
      }

      Prop<String?>("wayPointImage") { view, uri ->
        view.applyWayPointImage(uri)
      }

      Prop<List<Map<String, Any?>>?>("customWaypointMarkers") { view, markers ->
        view.applyCustomWaypointMarkers(markers)
      }

      Prop<String?>("endPointImage") { view, uri ->
        view.applyEndPointImage(uri)
      }
      
      Prop<Boolean>("autoLockCar") { view, enabled ->
        view.applyAutoLockCar(enabled)
      }
      
      Prop<Boolean>("autoChangeZoom") { view, enabled ->
        view.applyAutoChangeZoom(enabled)
      }
      
      Prop<Boolean>("trafficLayerEnabled") { view, enabled ->
        view.applyTrafficLayerEnabled(enabled)
      }
      
      Prop<Boolean>("realCrossDisplay") { view, enabled ->
        view.applyRealCrossDisplay(enabled)
      }
      
      Prop<Int>("naviMode") { view, mode ->
        view.applyNaviMode(mode)
      }
      
      Prop<Int>("showMode") { view, mode ->
        view.applyShowMode(mode)
      }
      
      Prop<Boolean>("isNightMode") { view, enabled ->
        view.applyNightMode(enabled)
      }

      Prop<Int>("mapViewModeType") { view, mode ->
        view.applyMapViewModeType(mode)
      }
      
      Prop<Boolean>("carOverlayVisible") { view, visible ->
        view.applyCarOverlayVisible(visible)
      }
      
      Prop<Boolean>("showTrafficLights") { view, visible ->
        view.applyTrafficLightsVisible(visible)
      }

      Prop<Boolean>("showCompassEnabled") {view, enabled ->
          view.applyShowCompassEnabled(enabled)
      }

      Prop<Boolean>("naviStatusBarEnabled") { view, enabled ->
        view.applyNaviStatusBarEnabled(enabled)
      }
      
      Prop<Map<String, Boolean>?>("routeMarkerVisible") { view, config ->
        config?.let {
          val showStartEndVia = it["showStartEndVia"] as? Boolean ?: true
          val showFootFerry = it["showFootFerry"] as? Boolean ?: true
          val showForbidden = it["showForbidden"] as? Boolean ?: true
          val showRouteStartIcon = it["showRouteStartIcon"] as? Boolean ?: true
          val showRouteEndIcon = it["showRouteEndIcon"] as? Boolean ?: true
          view.applyRouteMarkerVisible(showStartEndVia, showFootFerry, showForbidden, showRouteStartIcon, showRouteEndIcon)
        }
      }
      
      // 路线转向箭头可见性控制
      Prop<Boolean>("naviArrowVisible") { view, visible ->
        view.applyNaviArrowVisible(visible)
      }

      Prop<Boolean>("laneInfoVisible") { view, visible ->
        view.applyLaneInfoVisible(visible)
      }

      Prop<Boolean>("modeCrossDisplay") { view, visible ->
        view.applyModeCrossDisplay(visible)
      }

      Prop<Boolean>("eyrieCrossDisplay") { view, visible ->
        view.applyEyrieCrossDisplay(visible)
      }

      Prop<Boolean>("secondActionVisible") { view, visible ->
        view.applySecondActionVisible(visible)
      }

      Prop<Boolean>("backupOverlayVisible") { view, visible ->
        view.applyBackupOverlayVisible(visible)
      }
      
      // 是否显示拥堵气泡
      Prop<Boolean>("showDriveCongestion") { view, show ->
        view.applyShowDriveCongestion(show)
      }
      
      // 是否显示红绿灯倒计时气泡
      Prop<Boolean>("showTrafficLightView") { view, show ->
        view.applyShowTrafficLightView(show)
      }

     //设置是否为骑步行视图
        Prop<Boolean>("isNaviTravelView") { view, isRideStepView ->
            view.applyIsNaviTravelView(isRideStepView)
        }

      Prop<Double?>("androidStatusBarPaddingTop") { view, topDp ->
        view.applyAndroidStatusBarPaddingTop(topDp)
      }

      Prop<Int>("lockZoom") { view, level ->
        view.applyLockZoom(level)
      }

      Prop<Int>("lockTilt") { view, tilt ->
        view.applyLockTilt(tilt)
      }

      Prop<Boolean>("eagleMapVisible") { view, visible ->
        view.applyEagleMapVisible(visible)
      }

      Prop<Map<String, Double>?>("pointToCenter") { view, value ->
        val x = value?.get("x") ?: 0.0
        val y = value?.get("y") ?: 0.0
        view.applyPointToCenter(x, y)
      }

      Prop<Boolean>("hideNativeTopInfoLayout") { view, hidden ->
        view.applyHideNativeTopInfoLayout(hidden)
      }

      Prop<Boolean>("showCamera") { view, enabled ->
          view.applyShowCamera(enabled)
      }

      Prop<Boolean>("showUIElements") { view, visible ->
        view.applyShowUIElements(visible)
      }

      Prop<Boolean>("androidBackgroundNavigationNotificationEnabled") { view, enabled ->
        view.applyAndroidBackgroundNavigationNotificationEnabled(enabled)
      }

      // iOS-only prop, keep a no-op mapping on Android for cross-platform prop compatibility.
      Prop<Boolean>("iosLiveActivityEnabled") { _: ExpoGaodeMapNaviView, _: Boolean ->
      }

      Prop<Boolean>("showTrafficBar") { view, enabled ->
        view.applyAndroidTrafficBarEnabled(enabled)
      }

      Prop<Boolean>("showTrafficButton"){ view, enabled ->
          view.applyShowTrafficButton(enabled)
      }

      Prop<Boolean>("showBrowseRouteButton") { view, enabled ->
          view.applyShowBrowseRouteButton(enabled)
      }

        Prop<Boolean>("showVectorline"){ view, enabled ->
            view.applyShowVectorline(enabled)
        }

        Prop<Boolean>("showGreyAfterPass") { view, enabled ->
            view.applyShowGreyAfterPass(enabled)
        }

      // 方法
      AsyncFunction("startNavigation") { view: ExpoGaodeMapNaviView, startLat: Double, startLng: Double, endLat: Double, endLng: Double, promise: expo.modules.kotlin.Promise ->
        view.startNavigation(startLat, startLng, endLat, endLng, promise)
      }

      AsyncFunction("startNavigationWithIndependentPath") { view: ExpoGaodeMapNaviView, token: Int, routeId: Int?, routeIndex: Int?, naviType: Int?, promise: expo.modules.kotlin.Promise ->
        view.startNavigationWithIndependentPath(token, routeId, routeIndex, naviType, promise)
      }
      
      AsyncFunction("stopNavigation") { view: ExpoGaodeMapNaviView, promise: expo.modules.kotlin.Promise ->
        view.stopNavigation(promise)
      }

      AsyncFunction("playCustomTTS") { view: ExpoGaodeMapNaviView, text: String, forcePlay: Boolean, promise: expo.modules.kotlin.Promise ->
        val success = view.playCustomTTS(text, forcePlay)
        if (success) {
          promise.resolve(
            mapOf(
              "success" to true
            )
          )
        } else {
          promise.reject("PLAY_TTS_FAILED", "当前场景暂不支持或正在播报其他导航语音", null)
        }
      }
    }
  }
}
