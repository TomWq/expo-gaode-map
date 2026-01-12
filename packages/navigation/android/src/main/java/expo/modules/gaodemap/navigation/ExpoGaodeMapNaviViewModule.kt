package expo.modules.gaodemap.navigation

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * 高德导航视图 Module
 */
class ExpoGaodeMapNaviViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGaodeMapNaviView")

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
        "onGpsSignalWeak"
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
      
      Prop<Boolean>("carOverlayVisible") { view, visible ->
        view.applyCarOverlayVisible(visible)
      }
      
      Prop<Boolean>("showTrafficLights") { view, visible ->
        view.applyTrafficLightsVisible(visible)
      }

      Prop<Boolean>("showCompassEnabled") {view, enabled ->
          view.applyShowCompassEnabled(enabled)
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

      Prop<Boolean>("showCamera") { view, enabled ->
          view.applyShowCamera(enabled)
      }

      Prop<Boolean>("showUIElements") { view, visible ->
        view.applyShowUIElements(visible)
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
      
      AsyncFunction("stopNavigation") { view: ExpoGaodeMapNaviView, promise: expo.modules.kotlin.Promise ->
        view.stopNavigation(promise)
      }
    }
  }
}
