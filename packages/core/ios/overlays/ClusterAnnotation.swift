import Foundation
import CoreLocation
import MAMapKit

class ClusterAnnotation: NSObject, MAAnnotation {
    @objc dynamic var coordinate: CLLocationCoordinate2D
    var count: Int
    var pois: [[String: Any]]
    
    // MAAnnotation required properties
    var title: String?
    var subtitle: String?
    
    init(coordinate: CLLocationCoordinate2D, count: Int, pois: [[String: Any]]) {
        self.coordinate = coordinate
        self.count = count
        self.pois = pois
        self.title = "\(count)个点"
        super.init()
    }
    
    override func isEqual(_ object: Any?) -> Bool {
        guard let other = object as? ClusterAnnotation else { return false }
        return self.coordinate.latitude == other.coordinate.latitude &&
               self.coordinate.longitude == other.coordinate.longitude &&
               self.count == other.count
    }
    
    override var hash: Int {
        return "\(coordinate.latitude),\(coordinate.longitude),\(count)".hashValue
    }
}
