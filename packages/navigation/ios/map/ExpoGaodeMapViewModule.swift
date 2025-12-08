import ExpoModulesCore
import AMapNaviKit

/**
 * 高德地图视图 Module
 */
public class NaviMapViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("NaviMapView")
        
        View(NaviMapView.self) {
            Events("onMapPress", "onMapLongPress", "onLoad", "onLocation", "onCameraMove", "onCameraIdle")
            
            Prop("mapType") { (view: NaviMapView, type: Int) in
                view.mapType = type
            }
            
            Prop("initialCameraPosition") { (view: NaviMapView, position: [String: Any]?) in
                view.initialCameraPosition = position
            }
            
            Prop("maxZoom") { (view: NaviMapView, zoom: Double) in
                view.setMaxZoom(zoom)
            }
            
            Prop("minZoom") { (view: NaviMapView, zoom: Double) in
                view.setMinZoom(zoom)
            }
            
            Prop("zoomControlsEnabled") { (view: NaviMapView, show: Bool) in
                view.showsZoomControls = show
            }
            
            Prop("compassEnabled") { (view: NaviMapView, show: Bool) in
                view.showsCompass = show
            }
            
            Prop("scaleControlsEnabled") { (view: NaviMapView, show: Bool) in
                view.showsScale = show
            }
            
            Prop("zoomGesturesEnabled") { (view: NaviMapView, enabled: Bool) in
                view.isZoomEnabled = enabled
            }
            
            Prop("scrollGesturesEnabled") { (view: NaviMapView, enabled: Bool) in
                view.isScrollEnabled = enabled
            }
            
            Prop("rotateGesturesEnabled") { (view: NaviMapView, enabled: Bool) in
                view.isRotateEnabled = enabled
            }
            
            Prop("tiltGesturesEnabled") { (view: NaviMapView, enabled: Bool) in
                view.isTiltEnabled = enabled
            }
            
            Prop("myLocationEnabled") { (view: NaviMapView, show: Bool) in
                view.setShowsUserLocation(show)
            }
            
            Prop("followUserLocation") { (view: NaviMapView, follow: Bool) in
                view.setFollowUserLocation(follow)
            }
            
            Prop("userLocationRepresentation") { (view: NaviMapView, config: [String: Any]) in
                view.setUserLocationRepresentation(config)
            }
            
            Prop("trafficEnabled") { (view: NaviMapView, show: Bool) in
                view.setShowsTraffic(show)
            }
            
            Prop("buildingsEnabled") { (view: NaviMapView, show: Bool) in
                view.setShowsBuildings(show)
            }
            
            Prop("indoorViewEnabled") { (view: NaviMapView, show: Bool) in
                view.setShowsIndoorMap(show)
            }
            
            OnViewDidUpdateProps { (view: NaviMapView) in
                view.applyProps()
            }
            
            AsyncFunction("moveCamera") { (view: NaviMapView, position: [String: Any], duration: Int) in
                view.moveCamera(position: position, duration: duration)
            }
            
            AsyncFunction("getLatLng") { (view: NaviMapView, point: [String: Double]) -> [String: Double] in
                return view.getLatLng(point: point)
            }
            
            AsyncFunction("setCenter") { (view: NaviMapView, center: [String: Double], animated: Bool) in
                view.setCenter(center: center, animated: animated)
            }
            
            AsyncFunction("setZoom") { (view: NaviMapView, zoom: Double, animated: Bool) in
                view.setZoom(zoom: zoom, animated: animated)
            }
            
            AsyncFunction("getCameraPosition") { (view: NaviMapView) -> [String: Any] in
                return view.getCameraPosition()
            }
          
        }
    }
}
