import CoreLocation

public enum AMapCoordinateType { case GPS, mapBar, baidu, mapABC }
public func AMapCoordinateConvert(_ point: CLLocationCoordinate2D, _ type: AMapCoordinateType) -> CLLocationCoordinate2D {
    point
}
