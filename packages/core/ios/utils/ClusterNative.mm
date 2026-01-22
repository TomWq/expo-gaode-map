#import "ClusterNative.h"

#if __has_include(<MAMapKit/MAMapKit.h>)
#import <MAMapKit/MAMapKit.h>
#define HAS_MAMAPKIT 1
#else
#define HAS_MAMAPKIT 0
#endif

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

+ (NSDictionary * _Nullable)calculatePathBoundsWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                                longitudes:(NSArray<NSNumber *> *)longitudes {
    if (latitudes.count != longitudes.count || latitudes.count == 0) {
        return nil;
    }
    
    std::vector<gaodemap::GeoPoint> points;
    points.reserve(latitudes.count);
    for (NSUInteger i = 0; i < latitudes.count; i++) {
        points.push_back({[latitudes[i] doubleValue], [longitudes[i] doubleValue]});
    }
    
    gaodemap::PathBounds bounds = gaodemap::calculatePathBounds(points);
    
    return @{
        @"north": @(bounds.north),
        @"south": @(bounds.south),
        @"east": @(bounds.east),
        @"west": @(bounds.west),
        @"center": @{
            @"latitude": @(bounds.centerLat),
            @"longitude": @(bounds.centerLon)
        }
    };
}

+ (NSString *)encodeGeoHashWithLat:(double)lat
                               lon:(double)lon
                         precision:(int)precision {
    std::string geoHash = gaodemap::encodeGeoHash(lat, lon, precision);
    return [NSString stringWithUTF8String:geoHash.c_str()];
}

+ (uint32_t)parseColorWithString:(NSString *)colorString {
    if (!colorString) return 0;
    std::string colorStr = [colorString UTF8String];
    return gaodemap::parseColor(colorStr);
}

+ (CLLocationCoordinate2D)coordinateForMapPointWithX:(double)x y:(double)y {
#if HAS_MAMAPKIT
    MAMapPoint point;
    point.x = x;
    point.y = y;
    return MACoordinateForMapPoint(point);
#else
    return CLLocationCoordinate2DMake(0, 0);
#endif
}

+ (NSArray<NSNumber *> *)parsePolyline:(NSString *)polylineStr {
    if (!polylineStr || polylineStr.length == 0) {
        return @[];
    }

    std::string cppPolylineStr([polylineStr UTF8String]);
    const auto points = gaodemap::parsePolyline(cppPolylineStr);

    NSMutableArray<NSNumber *> *result = [NSMutableArray arrayWithCapacity:points.size() * 2];
    for (const auto &p : points) {
        [result addObject:@(p.lat)];
        [result addObject:@(p.lon)];
    }

    return result;
}

// --- 瓦片与坐标转换 ---

+ (NSDictionary *)latLngToTileWithLat:(double)lat lon:(double)lon zoom:(int)zoom {
    gaodemap::TileResult result = gaodemap::latLngToTile(lat, lon, zoom);
    return @{
        @"x": @(result.x),
        @"y": @(result.y),
        @"z": @(result.z)
    };
}

+ (NSDictionary *)tileToLatLngWithX:(int)x y:(int)y zoom:(int)zoom {
    gaodemap::GeoPoint result = gaodemap::tileToLatLng(x, y, zoom);
    return @{
        @"latitude": @(result.lat),
        @"longitude": @(result.lon)
    };
}

+ (NSDictionary *)latLngToPixelWithLat:(double)lat lon:(double)lon zoom:(int)zoom {
    gaodemap::PixelResult result = gaodemap::latLngToPixel(lat, lon, zoom);
    return @{
        @"x": @(result.x),
        @"y": @(result.y)
    };
}

+ (NSDictionary *)pixelToLatLngWithX:(double)x y:(double)y zoom:(int)zoom {
    gaodemap::GeoPoint result = gaodemap::pixelToLatLng(x, y, zoom);
    return @{
        @"latitude": @(result.lat),
        @"longitude": @(result.lon)
    };
}

// --- 批量地理围栏与热力图 ---

+ (int)findPointInPolygonsWithPointLat:(double)pointLat
                              pointLon:(double)pointLon
                              polygons:(NSArray<NSArray<NSDictionary *> *> *)polygons {
    if (polygons.count == 0) return -1;

    std::vector<std::vector<gaodemap::GeoPoint>> cppPolygons;
    cppPolygons.reserve(polygons.count);

    for (NSArray<NSDictionary *> *polygon in polygons) {
        std::vector<gaodemap::GeoPoint> cppPolygon;
        cppPolygon.reserve(polygon.count);
        for (NSDictionary *point in polygon) {
            cppPolygon.push_back({
                [point[@"latitude"] doubleValue],
                [point[@"longitude"] doubleValue]
            });
        }
        cppPolygons.push_back(std::move(cppPolygon));
    }

    return gaodemap::findPointInPolygons(pointLat, pointLon, cppPolygons);
}

+ (NSArray<NSDictionary *> *)generateHeatmapGridWithLatitudes:(NSArray<NSNumber *> *)latitudes
                                                   longitudes:(NSArray<NSNumber *> *)longitudes
                                                      weights:(NSArray<NSNumber *> *)weights
                                              gridSizeMeters:(double)gridSizeMeters {
    if (latitudes.count == 0 || latitudes.count != longitudes.count || latitudes.count != weights.count) {
        return @[];
    }

    std::vector<gaodemap::HeatmapPoint> points;
    points.reserve(latitudes.count);
    for (NSUInteger i = 0; i < latitudes.count; i++) {
        points.push_back({
            [latitudes[i] doubleValue],
            [longitudes[i] doubleValue],
            [weights[i] doubleValue]
        });
    }

    auto cells = gaodemap::generateHeatmapGrid(points, gridSizeMeters);
    
    NSMutableArray *result = [NSMutableArray arrayWithCapacity:cells.size()];
    for (const auto &c : cells) {
        [result addObject:@{
            @"latitude": @(c.lat),
            @"longitude": @(c.lon),
            @"intensity": @(c.intensity)
        }];
    }
    return result;
}

@end
