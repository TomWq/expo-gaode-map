#import <Foundation/Foundation.h>
#import <CoreLocation/CoreLocation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ClusterNative : NSObject

+ (NSArray<NSNumber *> *)clusterPointsWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                       longitudes:(NSArray<NSNumber *> *)longitudes
                                      radiusMeters:(double)radiusMeters NS_SWIFT_NAME(clusterPoints(latitudes:longitudes:radiusMeters:));

+ (BOOL)isPointInCircleWithPointLat:(double)pointLat
                          pointLon:(double)pointLon
                         centerLat:(double)centerLat
                         centerLon:(double)centerLon
                       radiusMeters:(double)radiusMeters NS_SWIFT_NAME(isPointInCircle(pointLat:pointLon:centerLat:centerLon:radiusMeters:));

+ (BOOL)isPointInPolygonWithPointLat:(double)pointLat
                           pointLon:(double)pointLon
                          latitudes:(NSArray<NSNumber *> *)latitudes
                         longitudes:(NSArray<NSNumber *> *)longitudes NS_SWIFT_NAME(isPointInPolygon(pointLat:pointLon:latitudes:longitudes:));

+ (double)calculatePolygonAreaWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                  longitudes:(NSArray<NSNumber *> *)longitudes NS_SWIFT_NAME(calculatePolygonArea(latitudes:longitudes:));

+ (double)calculateRectangleAreaWithSouthWestLat:(double)swLat
                                     southWestLon:(double)swLon
                                    northEastLat:(double)neLat
                                    northEastLon:(double)neLon NS_SWIFT_NAME(calculateRectangleArea(swLat:swLon:neLat:neLon:));

+ (double)calculateDistanceWithLat1:(double)lat1
                               lon1:(double)lon1
                               lat2:(double)lat2
                               lon2:(double)lon2 NS_SWIFT_NAME(calculateDistance(lat1:lon1:lat2:lon2:));

+ (NSArray<NSNumber *> *)simplifyPolylineWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                           longitudes:(NSArray<NSNumber *> *)longitudes
                                      toleranceMeters:(double)toleranceMeters NS_SWIFT_NAME(simplifyPolyline(latitudes:longitudes:tolerance:));

+ (double)calculatePathLengthWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                longitudes:(NSArray<NSNumber *> *)longitudes NS_SWIFT_NAME(calculatePathLength(latitudes:longitudes:));

+ (NSDictionary * _Nullable)getPointAtDistanceWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                               longitudes:(NSArray<NSNumber *> *)longitudes
                                           distanceMeters:(double)distanceMeters NS_SWIFT_NAME(getPointAtDistance(latitudes:longitudes:distanceMeters:));

+ (NSDictionary * _Nullable)getNearestPointOnPathWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                                    longitudes:(NSArray<NSNumber *> *)longitudes
                                                     targetLat:(double)targetLat
                                                     targetLon:(double)targetLon NS_SWIFT_NAME(getNearestPointOnPath(latitudes:longitudes:targetLat:targetLon:));

+ (NSDictionary * _Nullable)calculateCentroidWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                               longitudes:(NSArray<NSNumber *> *)longitudes NS_SWIFT_NAME(calculateCentroid(latitudes:longitudes:));

+ (NSDictionary * _Nullable)calculatePathBoundsWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                                longitudes:(NSArray<NSNumber *> *)longitudes NS_SWIFT_NAME(calculatePathBounds(latitudes:longitudes:));

+ (NSString *)encodeGeoHashWithLat:(double)lat
                               lon:(double)lon
                         precision:(int)precision NS_SWIFT_NAME(encodeGeoHash(lat:lon:precision:));

+ (uint32_t)parseColorWithString:(NSString *)colorString NS_SWIFT_NAME(parseColor(colorString:));

+ (CLLocationCoordinate2D)coordinateForMapPointWithX:(double)x y:(double)y NS_SWIFT_NAME(coordinateForMapPoint(x:y:));

/**
 * 解析高德地图 API 返回的 Polyline 字符串
 * 格式: "lng,lat;lng,lat;..."
 * @param polylineStr 高德原始 polyline 字符串
 * @return 扁平化的坐标数组 [lat1, lon1, lat2, lon2, ...]
 */
+ (NSArray<NSNumber *> *)parsePolyline:(NSString *)polylineStr NS_SWIFT_NAME(parsePolyline(polylineStr:));

// --- 瓦片与坐标转换 ---
+ (NSDictionary *)latLngToTileWithLat:(double)lat lon:(double)lon zoom:(int)zoom NS_SWIFT_NAME(latLngToTile(lat:lon:zoom:));
+ (NSDictionary *)tileToLatLngWithX:(int)x y:(int)y zoom:(int)zoom NS_SWIFT_NAME(tileToLatLng(x:y:zoom:));
+ (NSDictionary *)latLngToPixelWithLat:(double)lat lon:(double)lon zoom:(int)zoom NS_SWIFT_NAME(latLngToPixel(lat:lon:zoom:));
+ (NSDictionary *)pixelToLatLngWithX:(double)x y:(double)y zoom:(int)zoom NS_SWIFT_NAME(pixelToLatLng(x:y:zoom:));

// --- 批量地理围栏与网格聚合 ---
+ (int)findPointInPolygonsWithPointLat:(double)pointLat
                              pointLon:(double)pointLon
                              polygons:(NSArray<NSArray<NSDictionary *> *> *)polygons NS_SWIFT_NAME(findPointInPolygons(pointLat:pointLon:polygons:));

/**
 * 生成网格聚合数据 (常用于展示网格聚合图或大规模点数据处理)
 * 将大量散点按照网格大小进行聚合，返回每个网格的中心点和强度
 */
+ (NSArray<NSDictionary *> *)generateHeatmapGridWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                                   longitudes:(NSArray<NSNumber *> *)longitudes
                                                      weights:(NSArray<NSNumber *> *)weights
                                              gridSizeMeters:(double)gridSizeMeters NS_SWIFT_NAME(generateHeatmapGrid(latitudes:longitudes:weights:gridSizeMeters:));

@end

NS_ASSUME_NONNULL_END
