#import "ClusterNative.h"
#import <MAMapKit/MAMapKit.h>

#include <vector>
#include <string>

#include "../../shared/cpp/ClusterEngine.hpp"
#include "../../shared/cpp/GeometryEngine.hpp"
#include "../../shared/cpp/ColorParser.hpp"

@implementation ClusterNative

+ (NSArray<NSNumber *> *)clusterPointsWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                       longitudes:(NSArray<NSNumber *> *)longitudes
                                      radiusMeters:(double)radiusMeters {
    if (latitudes.count == 0 || latitudes.count != longitudes.count) {
        return @[@0];
    }

    std::vector<gaodemap::ClusterPoint> points;
    points.reserve(latitudes.count);

    for (NSUInteger i = 0; i < latitudes.count; i++) {
        gaodemap::ClusterPoint point;
        point.lat = latitudes[i].doubleValue;
        point.lon = longitudes[i].doubleValue;
        point.index = (int)i;
        points.push_back(point);
    }

    const auto clusters = gaodemap::clusterPoints(points, radiusMeters);

    NSMutableArray<NSNumber *> *result = [NSMutableArray array];
    [result addObject:@(clusters.size())];

    for (const auto &cluster : clusters) {
        [result addObject:@(cluster.centerIndex)];
        [result addObject:@(cluster.indices.size())];
        for (int idx : cluster.indices) {
            [result addObject:@(idx)];
        }
    }

    return result;
}

+ (BOOL)isPointInCircleWithPointLat:(double)pointLat
                          pointLon:(double)pointLon
                         centerLat:(double)centerLat
                         centerLon:(double)centerLon
                       radiusMeters:(double)radiusMeters {
    return gaodemap::isPointInCircle(pointLat, pointLon, centerLat, centerLon, radiusMeters);
}

+ (BOOL)isPointInPolygonWithPointLat:(double)pointLat
                           pointLon:(double)pointLon
                          latitudes:(NSArray<NSNumber *> *)latitudes
                         longitudes:(NSArray<NSNumber *> *)longitudes {
    if (latitudes.count < 3 || latitudes.count != longitudes.count) {
        return NO;
    }

    std::vector<gaodemap::GeoPoint> polygon;
    polygon.reserve(latitudes.count);

    for (NSUInteger i = 0; i < latitudes.count; i++) {
        polygon.push_back({latitudes[i].doubleValue, longitudes[i].doubleValue});
    }

    return gaodemap::isPointInPolygon(pointLat, pointLon, polygon);
}

+ (double)calculatePolygonAreaWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                  longitudes:(NSArray<NSNumber *> *)longitudes {
    if (latitudes.count < 3 || latitudes.count != longitudes.count) {
        return 0.0;
    }

    std::vector<gaodemap::GeoPoint> polygon;
    polygon.reserve(latitudes.count);

    for (NSUInteger i = 0; i < latitudes.count; i++) {
        polygon.push_back({latitudes[i].doubleValue, longitudes[i].doubleValue});
    }

    return gaodemap::calculatePolygonArea(polygon);
}

+ (double)calculateRectangleAreaWithSouthWestLat:(double)swLat
                                     southWestLon:(double)swLon
                                    northEastLat:(double)neLat
                                    northEastLon:(double)neLon {
    return gaodemap::calculateRectangleArea(swLat, swLon, neLat, neLon);
}

+ (double)calculateDistanceWithLat1:(double)lat1
                               lon1:(double)lon1
                               lat2:(double)lat2
                               lon2:(double)lon2 {
    return gaodemap::calculateDistance(lat1, lon1, lat2, lon2);
}

+ (NSArray<NSNumber *> *)simplifyPolylineWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                           longitudes:(NSArray<NSNumber *> *)longitudes
                                      toleranceMeters:(double)toleranceMeters {
    if (latitudes.count == 0 || latitudes.count != longitudes.count) {
        return @[];
    }

    std::vector<gaodemap::GeoPoint> points;
    points.reserve(latitudes.count);

    for (NSUInteger i = 0; i < latitudes.count; i++) {
        points.push_back({latitudes[i].doubleValue, longitudes[i].doubleValue});
    }

    const auto simplified = gaodemap::simplifyPolyline(points, toleranceMeters);

    NSMutableArray<NSNumber *> *result = [NSMutableArray arrayWithCapacity:simplified.size() * 2];
    for (const auto &p : simplified) {
        [result addObject:@(p.lat)];
        [result addObject:@(p.lon)];
    }

    return result;
}

+ (double)calculatePathLengthWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                longitudes:(NSArray<NSNumber *> *)longitudes {
    if (latitudes.count != longitudes.count || latitudes.count < 2) {
        return 0.0;
    }
    
    std::vector<gaodemap::GeoPoint> points;
    points.reserve(latitudes.count);
    for (NSUInteger i = 0; i < latitudes.count; i++) {
        points.push_back({[latitudes[i] doubleValue], [longitudes[i] doubleValue]});
    }
    
    return gaodemap::calculatePathLength(points);
}

+ (NSDictionary * _Nullable)getPointAtDistanceWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                               longitudes:(NSArray<NSNumber *> *)longitudes
                                           distanceMeters:(double)distanceMeters {
    if (latitudes.count != longitudes.count || latitudes.count < 2) {
        return nil;
    }
    
    std::vector<gaodemap::GeoPoint> points;
    points.reserve(latitudes.count);
    for (NSUInteger i = 0; i < latitudes.count; i++) {
        points.push_back({[latitudes[i] doubleValue], [longitudes[i] doubleValue]});
    }
    
    double outLat, outLon, outAngle;
    if (gaodemap::getPointAtDistance(points, distanceMeters, &outLat, &outLon, &outAngle)) {
        return @{
            @"latitude": @(outLat),
            @"longitude": @(outLon),
            @"angle": @(outAngle)
        };
    }
    
    return nil;
}

+ (NSDictionary * _Nullable)getNearestPointOnPathWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                                    longitudes:(NSArray<NSNumber *> *)longitudes
                                                     targetLat:(double)targetLat
                                                     targetLon:(double)targetLon {
    if (latitudes.count != longitudes.count || latitudes.count < 2) {
        return nil;
    }
    
    std::vector<gaodemap::GeoPoint> points;
    points.reserve(latitudes.count);
    for (NSUInteger i = 0; i < latitudes.count; i++) {
        points.push_back({[latitudes[i] doubleValue], [longitudes[i] doubleValue]});
    }
    
    gaodemap::GeoPoint target = {targetLat, targetLon};
    gaodemap::NearestPointResult result = gaodemap::getNearestPointOnPath(points, target);
    
    return @{
        @"latitude": @(result.latitude),
        @"longitude": @(result.longitude),
        @"index": @(result.index),
        @"distanceMeters": @(result.distanceMeters)
    };
}

+ (NSDictionary * _Nullable)calculateCentroidWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                               longitudes:(NSArray<NSNumber *> *)longitudes {
    if (latitudes.count != longitudes.count || latitudes.count < 3) {
        return nil;
    }
    
    std::vector<gaodemap::GeoPoint> polygon;
    polygon.reserve(latitudes.count);
    for (NSUInteger i = 0; i < latitudes.count; i++) {
        polygon.push_back({[latitudes[i] doubleValue], [longitudes[i] doubleValue]});
    }
    
    gaodemap::GeoPoint centroid = gaodemap::calculateCentroid(polygon);
    
    return @{
        @"latitude": @(centroid.lat),
        @"longitude": @(centroid.lon)
    };
}

+ (NSString *)encodeGeoHashWithLat:(double)lat
                               lon:(double)lon
                         precision:(int)precision {
    std::string hash = gaodemap::encodeGeoHash(lat, lon, precision);
    return [NSString stringWithUTF8String:hash.c_str()];
}

+ (uint32_t)parseColorWithString:(NSString *)colorString {
    if (!colorString) return 0;
    std::string str = [colorString UTF8String];
    return gaodemap::parseColor(str);
}

+ (CLLocationCoordinate2D)coordinateForMapPointWithX:(double)x y:(double)y {
    MAMapPoint point;
    point.x = x;
    point.y = y;
    return MACoordinateForMapPoint(point);
}

@end
