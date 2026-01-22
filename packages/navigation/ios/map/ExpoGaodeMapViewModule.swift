import ExpoModulesCore
import AMapNaviKit

/**
 * 高德地图视图 Module
 */
public class ExpoGaodeMapViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoGaodeMapView")
        
        View(ExpoGaodeMapView.self) {
            Events("onMapPress", "onMapLongPress", "onLoad", "onLocation", "onCameraMove", "onCameraIdle")
            
            Prop("mapType") { (view: ExpoGaodeMapView, type: Int) in
                view.mapType = type
            }
            
            Prop("initialCameraPosition") { (view: ExpoGaodeMapView, position: [String: Any]?) in
                view.initialCameraPosition = position
            }
            
            Prop("maxZoom") { (view: ExpoGaodeMapView, zoom: Double) in
                view.setMaxZoom(zoom)
            }
            
            Prop("minZoom") { (view: ExpoGaodeMapView, zoom: Double) in
                view.setMinZoom(zoom)
            }
            
            Prop("zoomControlsEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.showsZoomControls = show
            }
            
            Prop("compassEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.showsCompass = show
            }
            
            Prop("scaleControlsEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.showsScale = show
            }
            
            Prop("zoomGesturesEnabled") { (view: ExpoGaodeMapView, enabled: Bool) in
                view.isZoomEnabled = enabled
            }
            
            Prop("scrollGesturesEnabled") { (view: ExpoGaodeMapView, enabled: Bool) in
                view.isScrollEnabled = enabled
            }
            
            Prop("rotateGesturesEnabled") { (view: ExpoGaodeMapView, enabled: Bool) in
                view.isRotateEnabled = enabled
            }
            
            Prop("tiltGesturesEnabled") { (view: ExpoGaodeMapView, enabled: Bool) in
                view.isTiltEnabled = enabled
            }
            
            Prop("myLocationEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.setShowsUserLocation(show)
            }
            
            Prop("followUserLocation") { (view: ExpoGaodeMapView, follow: Bool) in
                view.setFollowUserLocation(follow)
            }
            
            Prop("userLocationRepresentation") { (view: ExpoGaodeMapView, config: [String: Any]) in
                view.setUserLocationRepresentation(config)
            }
            
            Prop("trafficEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.setShowsTraffic(show)
            }
            
            Prop("buildingsEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.setShowsBuildings(show)
            }
            
            Prop("indoorViewEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.setShowsIndoorMap(show)
            }
            
            Prop("customMapStyle") { (view: ExpoGaodeMapView, styleData: [String: Any]?) in
                if let styleData = styleData {
                    view.setCustomMapStyle(styleData)
                }
            }
            
            Prop("worldMapSwitchEnabled") { (view: ExpoGaodeMapView, enabled: Bool) in
                view.enableWorldMapSwitch = enabled
            }
            
            OnViewDidUpdateProps { (view: ExpoGaodeMapView) in
                view.applyProps()
            }
            
            AsyncFunction("moveCamera") { (view: ExpoGaodeMapView, position: [String: Any], duration: Int) in
                view.moveCamera(position: position, duration: duration)
            }
            
            AsyncFunction("getLatLng") { (view: ExpoGaodeMapView, point: [String: Double]) -> [String: Double] in
                return view.getLatLng(point: point)
            }
            
            AsyncFunction("setCenter") { (view: ExpoGaodeMapView, center: [String: Double], animated: Bool) in
                view.setCenter(center: center, animated: animated)
            }
            
            AsyncFunction("setZoom") { (view: ExpoGaodeMapView, zoom: Double, animated: Bool) in
                view.setZoom(zoom: zoom, animated: animated)
            }
            
            AsyncFunction("getCameraPosition") { (view: ExpoGaodeMapView) -> [String: Any] in
                return view.getCameraPosition()
            }
            
            AsyncFunction("takeSnapshot") { (view: ExpoGaodeMapView, promise: Promise) in
                DispatchQueue.main.async {
                    view.takeSnapshot { path, error in
                        if let path = path {
                            promise.resolve(path)
                        } else {
                            promise.reject("SNAPSHOT_FAILED", error?.localizedDescription ?? "Failed to take snapshot")
                        }
                    }
                }
            }
          
        }
    }
}
