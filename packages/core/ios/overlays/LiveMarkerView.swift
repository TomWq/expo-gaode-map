import ExpoModulesCore
import MAMapKit
import UIKit

/**
 * Real React Native marker overlay.
 *
 * This view stays in the native hierarchy above MAMapView. It is positioned
 * from the map projection and never rendered into a bitmap annotation.
 */
class LiveMarkerView: ExpoView {
    let onPress = EventDispatcher()

    private weak var mapView: MAMapView?
    private var coordinate: CLLocationCoordinate2D?
    private var anchor = CGPoint(x: 0.5, y: 1)
    private var markerOffset = CGPoint.zero
    private var markerVisible = true
    private var contentSize: CGSize?
    var tracksCamera = true

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        isUserInteractionEnabled = true
        isOpaque = false
        backgroundColor = .clear

        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        addGestureRecognizer(tap)
    }

    func setMap(_ mapView: MAMapView) {
        self.mapView = mapView
        updateScreenPosition()
    }

    func clearMap() {
        mapView = nil
    }

    func setPosition(_ position: [String: Any]?) {
        coordinate = LatLngParser.parseLatLng(position)
        updateScreenPosition()
    }

    func setAnchor(_ anchor: [String: Any]?) {
        let x = (anchor?["x"] as? NSNumber)?.doubleValue ?? 0.5
        let y = (anchor?["y"] as? NSNumber)?.doubleValue ?? 1.0
        self.anchor = CGPoint(
            x: min(max(x, 0), 1),
            y: min(max(y, 0), 1)
        )
        updateScreenPosition()
    }

    func setOffset(_ offset: [String: Any]?) {
        let x = (offset?["x"] as? NSNumber)?.doubleValue ?? 0
        let y = (offset?["y"] as? NSNumber)?.doubleValue ?? 0
        markerOffset = CGPoint(x: x, y: y)
        updateScreenPosition()
    }

    func setContentWidth(_ width: Int) {
        let nextWidth = CGFloat(max(width, 0))
        contentSize = CGSize(width: nextWidth, height: contentSize?.height ?? bounds.height)
        if nextWidth > 0 {
            bounds.size.width = nextWidth
        }
        setNeedsLayout()
        updateScreenPosition()
    }

    func setContentHeight(_ height: Int) {
        let nextHeight = CGFloat(max(height, 0))
        contentSize = CGSize(width: contentSize?.width ?? bounds.width, height: nextHeight)
        if nextHeight > 0 {
            bounds.size.height = nextHeight
        }
        setNeedsLayout()
        updateScreenPosition()
    }

    func setVisible(_ visible: Bool) {
        markerVisible = visible
        updateScreenPosition()
    }

    func setTracksCamera(_ enabled: Bool) {
        tracksCamera = enabled
    }

    func setZIndex(_ zIndex: Double) {
        layer.zPosition = CGFloat(zIndex)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        updateScreenPosition()
    }

    func updateScreenPosition() {
        guard markerVisible, let mapView, let coordinate else {
            isHidden = true
            return
        }

        let screenPoint = mapView.convert(coordinate, toPointTo: mapView)
        let width = bounds.width
        let height = bounds.height
        center = CGPoint(
            x: screenPoint.x - width * (anchor.x - 0.5) + markerOffset.x,
            y: screenPoint.y - height * (anchor.y - 0.5) + markerOffset.y
        )
        isHidden = false
    }

    @objc
    private func handleTap() {
        guard let coordinate else {
            return
        }

        onPress([
            "latitude": coordinate.latitude,
            "longitude": coordinate.longitude
        ])
    }
}
