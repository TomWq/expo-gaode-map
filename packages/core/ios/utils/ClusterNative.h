#import <Foundation/Foundation.h>
#import <CoreLocation/CoreLocation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ClusterNative : NSObject

+ (NSArray<NSNumber *> *)clusterPointsWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                       longitudes:(NSArray<NSNumber *> *)longitudes
                                      radiusMeters:(double)radiusMeters;

+ (BOOL)isPointInCircleWithPointLat:(double)pointLat
                          pointLon:(double)pointLon
                         centerLat:(double)centerLat
                         centerLon:(double)centerLon
                       radiusMeters:(double)radiusMeters;

+ (BOOL)isPointInPolygonWithPointLat:(double)pointLat
                           pointLon:(double)pointLon
                          latitudes:(NSArray<NSNumber *> *)latitudes
                         longitudes:(NSArray<NSNumber *> *)longitudes;

+ (double)calculatePolygonAreaWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                  longitudes:(NSArray<NSNumber *> *)longitudes;

+ (double)calculateRectangleAreaWithSouthWestLat:(double)swLat
                                     southWestLon:(double)swLon
                                    northEastLat:(double)neLat
                                    northEastLon:(double)neLon;

+ (double)calculateDistanceWithLat1:(double)lat1
                               lon1:(double)lon1
                               lat2:(double)lat2
                               lon2:(double)lon2;

+ (NSArray<NSNumber *> *)simplifyPolylineWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                           longitudes:(NSArray<NSNumber *> *)longitudes
                                      toleranceMeters:(double)toleranceMeters;

+ (double)calculatePathLengthWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                longitudes:(NSArray<NSNumber *> *)longitudes;

+ (NSDictionary * _Nullable)getPointAtDistanceWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                               longitudes:(NSArray<NSNumber *> *)longitudes
                                           distanceMeters:(double)distanceMeters;

+ (NSDictionary * _Nullable)getNearestPointOnPathWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                                    longitudes:(NSArray<NSNumber *> *)longitudes
                                                     targetLat:(double)targetLat
                                                     targetLon:(double)targetLon;

+ (NSDictionary * _Nullable)calculateCentroidWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                               longitudes:(NSArray<NSNumber *> *)longitudes;

+ (NSString *)encodeGeoHashWithLat:(double)lat
                               lon:(double)lon
                         precision:(int)precision;

+ (uint32_t)parseColorWithString:(NSString *)colorString;

+ (CLLocationCoordinate2D)coordinateForMapPointWithX:(double)x y:(double)y NS_SWIFT_NAME(coordinateForMapPoint(x:y:));

@end

NS_ASSUME_NONNULL_END
