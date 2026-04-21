//
//  ExpoGaodeMapNaviViewModule.swift
//  expo-gaode-map-navigation
//
//  
//

import ExpoModulesCore
import UIKit

public class ExpoGaodeMapNaviViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoGaodeMapNaviView")
    
    // 定义视图
    View(ExpoGaodeMapNaviView.self) {
      // 事件定义
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
      
      // 属性定义
      Prop("naviType") { (view: ExpoGaodeMapNaviView, value: Int) in
        view.naviType = value
      }
      
      Prop("enableVoice") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.enableVoice = value
      }
      
      Prop("showCamera") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showCamera = value
      }

      Prop("carImage") { (view: ExpoGaodeMapNaviView, value: String?) in
        view.carImageSource = value
      }

      Prop("carImageSize") { (view: ExpoGaodeMapNaviView, value: [String: Double]?) in
        let width = CGFloat(value?["width"] ?? 0)
        let height = CGFloat(value?["height"] ?? 0)
        if width > 0, height > 0 {
          view.carImageSize = CGSize(width: width, height: height)
        } else {
          view.carImageSize = nil
        }
      }

      Prop("carCompassImage") { (view: ExpoGaodeMapNaviView, value: String?) in
        view.carCompassImageSource = value
      }

      Prop("startPointImage") { (view: ExpoGaodeMapNaviView, value: String?) in
        view.startPointImageSource = value
      }

      Prop("wayPointImage") { (view: ExpoGaodeMapNaviView, value: String?) in
        view.wayPointImageSource = value
      }

      Prop("customWaypointMarkers") { (view: ExpoGaodeMapNaviView, value: [[String: Any]]?) in
        view.customWaypointMarkerPayloads = value
      }

      Prop("endPointImage") { (view: ExpoGaodeMapNaviView, value: String?) in
        view.endPointImageSource = value
      }

      Prop("cameraImage") { (view: ExpoGaodeMapNaviView, value: String?) in
        view.cameraImageSource = value
      }
      
      Prop("autoLockCar") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.autoLockCar = value
      }
      
      Prop("autoChangeZoom") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.autoChangeZoom = value
      }
      
      Prop("trafficLayerEnabled") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.trafficLayerEnabled = value
      }
      
      Prop("realCrossDisplay") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.realCrossDisplay = value
      }
      
      Prop("naviMode") { (view: ExpoGaodeMapNaviView, value: Int) in
        view.naviMode = value
      }
      
      Prop("showMode") { (view: ExpoGaodeMapNaviView, value: Int) in
        view.showMode = value
      }
      
      Prop("isNightMode") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.isNightMode = value
      }
      
      // iOS 特有属性
      Prop("showRoute") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showRoute = value
      }
      
      Prop("naviArrowVisible") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showTurnArrow = value
      }
      
      Prop("showTrafficBar") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showTrafficBar = value
      }

      Prop("trafficBarFrame") { (view: ExpoGaodeMapNaviView, value: [String: Double]?) in
        let x = CGFloat(value?["x"] ?? 0)
        let y = CGFloat(value?["y"] ?? 0)
        let width = CGFloat(value?["width"] ?? 0)
        let height = CGFloat(value?["height"] ?? 0)
        view.trafficBarFrame = CGRect(x: x, y: y, width: width, height: height)
      }

      Prop("trafficBarColors") { (view: ExpoGaodeMapNaviView, value: [String: Any]?) in
        view.trafficBarColors = value
      }
      
      Prop("showBrowseRouteButton") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showBrowseRouteButton = value
      }
      
      Prop("showMoreButton") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showMoreButton = value
      }
      
      Prop("showTrafficButton") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showTrafficButton = value
      }

      Prop("showBackupRoute") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showBackupRoute = value
      }

      Prop("showEagleMap") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showEagleMap = value
      }
      
      Prop("showUIElements") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.applyShowUIElements(value)
      }
      
      Prop("showGreyAfterPass") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showGreyAfterPass = value
      }
      
      Prop("showVectorline") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showVectorline = value
      }
      
      Prop("showTrafficLights") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showTrafficLights = value
      }

      Prop("showCompassEnabled") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showCompassEnabled = value
      }

      Prop("showDriveCongestion") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showDriveCongestion = value
      }

      Prop("showTrafficLightView") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showTrafficLightView = value
      }

      Prop("hideNativeTopInfoLayout") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.hideNativeTopInfoLayout = value
      }

      Prop("hideNativeLaneInfoLayout") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.hideNativeLaneInfoLayout = value
      }

      // Android-only prop, keep a no-op mapping on iOS for cross-platform prop compatibility.
      Prop("androidBackgroundNavigationNotificationEnabled") { (_: ExpoGaodeMapNaviView, _: Bool) in
      }

      Prop("iosLiveActivityEnabled") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.iosLiveActivityEnabled = value
      }
      
      Prop("mapViewModeType") { (view: ExpoGaodeMapNaviView, value: Int) in
        view.mapViewModeType = value
      }
      
      Prop("lineWidth") { (view: ExpoGaodeMapNaviView, value: Double) in
        view.lineWidth = CGFloat(value)
      }

      Prop("driveViewEdgePadding") { (view: ExpoGaodeMapNaviView, value: [String: Double]?) in
        let top = CGFloat(value?["top"] ?? 0)
        let left = CGFloat(value?["left"] ?? 0)
        let bottom = CGFloat(value?["bottom"] ?? 0)
        let right = CGFloat(value?["right"] ?? 0)
        view.driveViewEdgePadding = UIEdgeInsets(top: top, left: left, bottom: bottom, right: right)
      }

      Prop("screenAnchor") { (view: ExpoGaodeMapNaviView, value: [String: Double]?) in
        let x = CGFloat(value?["x"] ?? 0)
        let y = CGFloat(value?["y"] ?? 0)
        view.screenAnchor = CGPoint(x: x, y: y)
      }
      
      // 方法定义
      AsyncFunction("startNavigation") { (view: ExpoGaodeMapNaviView, startLat: Double, startLng: Double, endLat: Double, endLng: Double, promise: Promise) in
        view.startNavigation(startLat: startLat, startLng: startLng, endLat: endLat, endLng: endLng, promise: promise)
      }

      AsyncFunction("startNavigationWithIndependentPath") { (view: ExpoGaodeMapNaviView, token: Int, routeId: Int?, routeIndex: Int?, naviType: Int?, promise: Promise) in
        view.startNavigationWithIndependentPath(token: token, routeId: routeId, routeIndex: routeIndex, naviType: naviType, promise: promise)
      }
      
      AsyncFunction("stopNavigation") { (view: ExpoGaodeMapNaviView, promise: Promise) in
        view.stopNavigation(promise: promise)
      }
      
      AsyncFunction("playCustomTTS") { (view: ExpoGaodeMapNaviView, text: String, forcePlay: Bool, promise: Promise) in
        view.playCustomTTS(text: text, forcePlay: forcePlay, promise: promise)
      }
    }
  }
}
