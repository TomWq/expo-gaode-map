//
//  ExpoGaodeMapNaviViewModule.swift
//  expo-gaode-map-navigation
//
//  Created by 王强 on 2025/12/05.
//

import ExpoModulesCore

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
        "onGpsSignalWeak"
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
      
      Prop("showTurnArrow") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showTurnArrow = value
      }
      
      Prop("showTrafficBar") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showTrafficBar = value
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
      
      Prop("showUIElements") { (view: ExpoGaodeMapNaviView, value: Bool) in
        view.showUIElements = value
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
      
      Prop("mapViewModeType") { (view: ExpoGaodeMapNaviView, value: Int) in
        view.mapViewModeType = value
      }
      
      Prop("lineWidth") { (view: ExpoGaodeMapNaviView, value: Double) in
        view.lineWidth = CGFloat(value)
      }
      
      // 方法定义
      AsyncFunction("startNavigation") { (view: ExpoGaodeMapNaviView, startLat: Double, startLng: Double, endLat: Double, endLng: Double, promise: Promise) in
        view.startNavigation(startLat: startLat, startLng: startLng, endLat: endLat, endLng: endLng, promise: promise)
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
