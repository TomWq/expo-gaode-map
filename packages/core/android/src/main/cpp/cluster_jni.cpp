#if __has_include(<jni.h>)
#include <jni.h>
#define GAODE_HAVE_JNI 1
#else
#define GAODE_HAVE_JNI 0
typedef void JNIEnv;
typedef void* jclass;
typedef void* jdoubleArray;
typedef void* jintArray;
typedef void* jstring;
typedef double jdouble;
typedef int jint;
typedef int jsize;
typedef unsigned char jboolean;
#ifndef JNI_TRUE
#define JNI_TRUE 1
#endif
#ifndef JNI_FALSE
#define JNI_FALSE 0
#endif
#define JNIEXPORT
#define JNICALL
#endif

#include <vector>
#include <string>

#include "../../../../shared/cpp/ClusterEngine.hpp"
#include "../../../../shared/cpp/GeometryEngine.hpp"
#include "../../../../shared/cpp/ColorParser.hpp"

extern "C" JNIEXPORT jintArray JNICALL
Java_expo_modules_gaodemap_utils_ClusterNative_clusterPoints(
    JNIEnv* env,
    jclass,
    jdoubleArray latitudes,
    jdoubleArray longitudes,
    jdouble radiusMeters
) {
#if GAODE_HAVE_JNI
    if (!latitudes || !longitudes) {
        jintArray empty = env->NewIntArray(1);
        jint zero = 0;
        env->SetIntArrayRegion(empty, 0, 1, &zero);
        return empty;
    }

    const jsize countLat = env->GetArrayLength(latitudes);
    const jsize countLon = env->GetArrayLength(longitudes);
    if (countLat == 0 || countLat != countLon) {
        jintArray empty = env->NewIntArray(1);
        jint zero = 0;
        env->SetIntArrayRegion(empty, 0, 1, &zero);
        return empty;
    }

    jdouble* latValues = env->GetDoubleArrayElements(latitudes, nullptr);
    jdouble* lonValues = env->GetDoubleArrayElements(longitudes, nullptr);

    std::vector<gaodemap::ClusterPoint> points;
    points.reserve(static_cast<size_t>(countLat));

    for (jsize i = 0; i < countLat; ++i) {
        gaodemap::ClusterPoint point;
        point.lat = latValues[i];
        point.lon = lonValues[i];
        point.index = static_cast<int>(i);
        points.push_back(point);
    }

    env->ReleaseDoubleArrayElements(latitudes, latValues, JNI_ABORT);
    env->ReleaseDoubleArrayElements(longitudes, lonValues, JNI_ABORT);

    const auto clusters = gaodemap::clusterPoints(points, static_cast<double>(radiusMeters));

    size_t totalSize = 1;
    for (const auto& cluster : clusters) {
        totalSize += 2 + cluster.indices.size();
    }

    std::vector<jint> result;
    result.reserve(totalSize);
    result.push_back(static_cast<jint>(clusters.size()));

    for (const auto& cluster : clusters) {
        result.push_back(static_cast<jint>(cluster.centerIndex));
        result.push_back(static_cast<jint>(cluster.indices.size()));
        for (int idx : cluster.indices) {
            result.push_back(static_cast<jint>(idx));
        }
    }

    jintArray array = env->NewIntArray(static_cast<jsize>(result.size()));
    env->SetIntArrayRegion(array, 0, static_cast<jsize>(result.size()), result.data());
    return array;
#else
    (void)env;
    (void)latitudes;
    (void)longitudes;
    (void)radiusMeters;
    return nullptr;
#endif
}

extern "C" JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeGetNearestPointOnPath(
    JNIEnv* env,
    jclass,
    jdoubleArray latitudes,
    jdoubleArray longitudes,
    jdouble targetLat,
    jdouble targetLon
) {
#if GAODE_HAVE_JNI
    if (!latitudes || !longitudes) {
        return nullptr;
    }

    const jsize countLat = env->GetArrayLength(latitudes);
    const jsize countLon = env->GetArrayLength(longitudes);
    if (countLat < 2 || countLat != countLon) {
        return nullptr;
    }

    jdouble* latValues = env->GetDoubleArrayElements(latitudes, nullptr);
    jdouble* lonValues = env->GetDoubleArrayElements(longitudes, nullptr);

    std::vector<gaodemap::GeoPoint> points;
    points.reserve(static_cast<size_t>(countLat));

    for (jsize i = 0; i < countLat; ++i) {
        points.push_back({latValues[i], lonValues[i]});
    }

    env->ReleaseDoubleArrayElements(latitudes, latValues, JNI_ABORT);
    env->ReleaseDoubleArrayElements(longitudes, lonValues, JNI_ABORT);

    gaodemap::GeoPoint target = {static_cast<double>(targetLat), static_cast<double>(targetLon)};
    gaodemap::NearestPointResult result = gaodemap::getNearestPointOnPath(points, target);

    jdoubleArray resultArray = env->NewDoubleArray(4);
    if (resultArray == nullptr) return nullptr;
    
    jdouble buffer[4] = {result.latitude, result.longitude, static_cast<jdouble>(result.index), result.distanceMeters};
    env->SetDoubleArrayRegion(resultArray, 0, 4, buffer);
    return resultArray;
#else
    (void)env;
    (void)latitudes;
    (void)longitudes;
    (void)targetLat;
    (void)targetLon;
    return nullptr;
#endif
}

extern "C" JNIEXPORT jboolean JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeIsPointInCircle(
    JNIEnv* env,
    jclass,
    jdouble pointLat,
    jdouble pointLon,
    jdouble centerLat,
    jdouble centerLon,
    jdouble radiusMeters
) {
#if GAODE_HAVE_JNI
    (void)env;
    return gaodemap::isPointInCircle(
        static_cast<double>(pointLat),
        static_cast<double>(pointLon),
        static_cast<double>(centerLat),
        static_cast<double>(centerLon),
        static_cast<double>(radiusMeters)
    ) ? JNI_TRUE : JNI_FALSE;
#else
    (void)env;
    (void)pointLat;
    (void)pointLon;
    (void)centerLat;
    (void)centerLon;
    (void)radiusMeters;
    return JNI_FALSE;
#endif
}

extern "C" JNIEXPORT jboolean JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeIsPointInPolygon(
    JNIEnv* env,
    jclass,
    jdouble pointLat,
    jdouble pointLon,
    jdoubleArray latitudes,
    jdoubleArray longitudes
) {
#if GAODE_HAVE_JNI
    if (!latitudes || !longitudes) {
        return JNI_FALSE;
    }

    const jsize countLat = env->GetArrayLength(latitudes);
    const jsize countLon = env->GetArrayLength(longitudes);
    if (countLat < 3 || countLat != countLon) {
        return JNI_FALSE;
    }

    jdouble* latValues = env->GetDoubleArrayElements(latitudes, nullptr);
    jdouble* lonValues = env->GetDoubleArrayElements(longitudes, nullptr);

    std::vector<gaodemap::GeoPoint> polygon;
    polygon.reserve(static_cast<size_t>(countLat));

    for (jsize i = 0; i < countLat; ++i) {
        polygon.push_back({latValues[i], lonValues[i]});
    }

    env->ReleaseDoubleArrayElements(latitudes, latValues, JNI_ABORT);
    env->ReleaseDoubleArrayElements(longitudes, lonValues, JNI_ABORT);

    return gaodemap::isPointInPolygon(
        static_cast<double>(pointLat),
        static_cast<double>(pointLon),
        polygon
    ) ? JNI_TRUE : JNI_FALSE;
#else
    (void)env;
    (void)pointLat;
    (void)pointLon;
    (void)latitudes;
    (void)longitudes;
    return JNI_FALSE;
#endif
}

extern "C" JNIEXPORT jdouble JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeCalculatePolygonArea(
    JNIEnv* env,
    jclass,
    jdoubleArray latitudes,
    jdoubleArray longitudes
) {
#if GAODE_HAVE_JNI
    if (!latitudes || !longitudes) {
        return 0.0;
    }

    const jsize countLat = env->GetArrayLength(latitudes);
    const jsize countLon = env->GetArrayLength(longitudes);
    if (countLat < 3 || countLat != countLon) {
        return 0.0;
    }

    jdouble* latValues = env->GetDoubleArrayElements(latitudes, nullptr);
    jdouble* lonValues = env->GetDoubleArrayElements(longitudes, nullptr);

    std::vector<gaodemap::GeoPoint> polygon;
    polygon.reserve(static_cast<size_t>(countLat));

    for (jsize i = 0; i < countLat; ++i) {
        polygon.push_back({latValues[i], lonValues[i]});
    }

    env->ReleaseDoubleArrayElements(latitudes, latValues, JNI_ABORT);
    env->ReleaseDoubleArrayElements(longitudes, lonValues, JNI_ABORT);

    return static_cast<jdouble>(gaodemap::calculatePolygonArea(polygon));
#else
    (void)env;
    (void)latitudes;
    (void)longitudes;
    return 0.0;
#endif
}

extern "C" JNIEXPORT jdouble JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeCalculateRectangleArea(
    JNIEnv* env,
    jclass,
    jdouble swLat,
    jdouble swLon,
    jdouble neLat,
    jdouble neLon
) {
#if GAODE_HAVE_JNI
    (void)env;
    return static_cast<jdouble>(gaodemap::calculateRectangleArea(
        static_cast<double>(swLat),
        static_cast<double>(swLon),
        static_cast<double>(neLat),
        static_cast<double>(neLon)
    ));
#else
    (void)env;
    (void)swLat;
    (void)swLon;
    (void)neLat;
    (void)neLon;
    return 0.0;
#endif
}

extern "C" JNIEXPORT jdouble JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeCalculateDistance(
    JNIEnv* env,
    jclass,
    jdouble lat1,
    jdouble lon1,
    jdouble lat2,
    jdouble lon2
) {
#if GAODE_HAVE_JNI
    (void)env;
    return static_cast<jdouble>(gaodemap::calculateDistance(
        static_cast<double>(lat1),
        static_cast<double>(lon1),
        static_cast<double>(lat2),
        static_cast<double>(lon2)
    ));
#else
    (void)env;
    (void)lat1;
    (void)lon1;
    (void)lat2;
    (void)lon2;
    return 0.0;
#endif
}

extern "C" JNIEXPORT jint JNICALL
Java_expo_modules_gaodemap_utils_ColorParser_nativeParseColor(
    JNIEnv* env,
    jclass,
    jstring colorString
) {
#if GAODE_HAVE_JNI
    if (!colorString) {
        return 0; // Black or 0
    }
    const char* nativeString = env->GetStringUTFChars(colorString, nullptr);
    if (!nativeString) {
        return 0;
    }
    std::string str(nativeString);
    env->ReleaseStringUTFChars(colorString, nativeString);

    return static_cast<jint>(gaodemap::parseColor(str));
#else
    (void)env;
    (void)colorString;
    return 0;
#endif
}

extern "C" JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeSimplifyPolyline(
    JNIEnv* env,
    jclass,
    jdoubleArray latitudes,
    jdoubleArray longitudes,
    jdouble toleranceMeters
) {
#if GAODE_HAVE_JNI
    if (!latitudes || !longitudes) {
        return env->NewDoubleArray(0);
    }

    const jsize countLat = env->GetArrayLength(latitudes);
    const jsize countLon = env->GetArrayLength(longitudes);
    if (countLat != countLon) {
        return env->NewDoubleArray(0);
    }

    jdouble* latValues = env->GetDoubleArrayElements(latitudes, nullptr);
    jdouble* lonValues = env->GetDoubleArrayElements(longitudes, nullptr);

    std::vector<gaodemap::GeoPoint> points;
    points.reserve(static_cast<size_t>(countLat));

    for (jsize i = 0; i < countLat; ++i) {
        points.push_back({latValues[i], lonValues[i]});
    }

    env->ReleaseDoubleArrayElements(latitudes, latValues, JNI_ABORT);
    env->ReleaseDoubleArrayElements(longitudes, lonValues, JNI_ABORT);

    const auto simplified = gaodemap::simplifyPolyline(points, static_cast<double>(toleranceMeters));

    jdoubleArray result = env->NewDoubleArray(static_cast<jsize>(simplified.size() * 2));
    if (result == nullptr) {
        return nullptr;
    }

    std::vector<jdouble> resultBuffer;
    resultBuffer.reserve(simplified.size() * 2);
    for (const auto& p : simplified) {
        resultBuffer.push_back(p.lat);
        resultBuffer.push_back(p.lon);
    }

    env->SetDoubleArrayRegion(result, 0, static_cast<jsize>(resultBuffer.size()), resultBuffer.data());
    return result;
#else
    (void)env;
    (void)latitudes;
    (void)longitudes;
    (void)toleranceMeters;
    return nullptr;
#endif
}

extern "C" JNIEXPORT jdouble JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeCalculatePathLength(
    JNIEnv* env,
    jclass,
    jdoubleArray latitudes,
    jdoubleArray longitudes
) {
#if GAODE_HAVE_JNI
    if (!latitudes || !longitudes) {
        return 0.0;
    }

    const jsize countLat = env->GetArrayLength(latitudes);
    const jsize countLon = env->GetArrayLength(longitudes);
    if (countLat < 2 || countLat != countLon) {
        return 0.0;
    }

    jdouble* latValues = env->GetDoubleArrayElements(latitudes, nullptr);
    jdouble* lonValues = env->GetDoubleArrayElements(longitudes, nullptr);

    std::vector<gaodemap::GeoPoint> points;
    points.reserve(static_cast<size_t>(countLat));

    for (jsize i = 0; i < countLat; ++i) {
        points.push_back({latValues[i], lonValues[i]});
    }

    env->ReleaseDoubleArrayElements(latitudes, latValues, JNI_ABORT);
    env->ReleaseDoubleArrayElements(longitudes, lonValues, JNI_ABORT);

    return static_cast<jdouble>(gaodemap::calculatePathLength(points));
#else
    (void)env;
    (void)latitudes;
    (void)longitudes;
    return 0.0;
#endif
}

extern "C" JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeGetPointAtDistance(
    JNIEnv* env,
    jclass,
    jdoubleArray latitudes,
    jdoubleArray longitudes,
    jdouble distanceMeters
) {
#if GAODE_HAVE_JNI
    if (!latitudes || !longitudes) {
        return nullptr;
    }

    const jsize countLat = env->GetArrayLength(latitudes);
    const jsize countLon = env->GetArrayLength(longitudes);
    if (countLat < 2 || countLat != countLon) {
        return nullptr;
    }

    jdouble* latValues = env->GetDoubleArrayElements(latitudes, nullptr);
    jdouble* lonValues = env->GetDoubleArrayElements(longitudes, nullptr);

    std::vector<gaodemap::GeoPoint> points;
    points.reserve(static_cast<size_t>(countLat));

    for (jsize i = 0; i < countLat; ++i) {
        points.push_back({latValues[i], lonValues[i]});
    }

    env->ReleaseDoubleArrayElements(latitudes, latValues, JNI_ABORT);
    env->ReleaseDoubleArrayElements(longitudes, lonValues, JNI_ABORT);

    double outLat, outLon, outAngle;
    bool success = gaodemap::getPointAtDistance(points, static_cast<double>(distanceMeters), &outLat, &outLon, &outAngle);

    if (success) {
        jdoubleArray result = env->NewDoubleArray(3);
        if (result == nullptr) return nullptr;
        
        jdouble buffer[3] = {outLat, outLon, outAngle};
        env->SetDoubleArrayRegion(result, 0, 3, buffer);
        return result;
    } else {
        return nullptr;
    }
#else
    (void)env;
    (void)latitudes;
    (void)longitudes;
    (void)distanceMeters;
    return nullptr;
#endif
}

extern "C" JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeCalculatePathBounds(
    JNIEnv* env,
    jclass,
    jdoubleArray latitudes,
    jdoubleArray longitudes
) {
#if GAODE_HAVE_JNI
    if (!latitudes || !longitudes) {
        return nullptr;
    }

    const jsize countLat = env->GetArrayLength(latitudes);
    const jsize countLon = env->GetArrayLength(longitudes);
    if (countLat == 0 || countLat != countLon) {
        return nullptr;
    }

    jdouble* latValues = env->GetDoubleArrayElements(latitudes, nullptr);
    jdouble* lonValues = env->GetDoubleArrayElements(longitudes, nullptr);

    std::vector<gaodemap::GeoPoint> points;
    points.reserve(static_cast<size_t>(countLat));

    for (jsize i = 0; i < countLat; ++i) {
        points.push_back({latValues[i], lonValues[i]});
    }

    env->ReleaseDoubleArrayElements(latitudes, latValues, JNI_ABORT);
    env->ReleaseDoubleArrayElements(longitudes, lonValues, JNI_ABORT);

    gaodemap::PathBounds bounds = gaodemap::calculatePathBounds(points);

    jdoubleArray resultArray = env->NewDoubleArray(6);
    if (resultArray == nullptr) return nullptr;
    
    jdouble buffer[6] = {
        bounds.north, 
        bounds.south, 
        bounds.east, 
        bounds.west, 
        bounds.centerLat, 
        bounds.centerLon
    };
    env->SetDoubleArrayRegion(resultArray, 0, 6, buffer);
    return resultArray;
#else
    (void)env;
    (void)latitudes;
    (void)longitudes;
    return nullptr;
#endif
}

extern "C" JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeCalculateCentroid(
    JNIEnv* env,
    jclass,
    jdoubleArray latitudes,
    jdoubleArray longitudes
) {
#if GAODE_HAVE_JNI
    if (!latitudes || !longitudes) {
        return nullptr;
    }

    const jsize countLat = env->GetArrayLength(latitudes);
    const jsize countLon = env->GetArrayLength(longitudes);
    if (countLat < 3 || countLat != countLon) {
        return nullptr;
    }

    jdouble* latValues = env->GetDoubleArrayElements(latitudes, nullptr);
    jdouble* lonValues = env->GetDoubleArrayElements(longitudes, nullptr);

    std::vector<gaodemap::GeoPoint> polygon;
    polygon.reserve(static_cast<size_t>(countLat));

    for (jsize i = 0; i < countLat; ++i) {
        polygon.push_back({latValues[i], lonValues[i]});
    }

    env->ReleaseDoubleArrayElements(latitudes, latValues, JNI_ABORT);
    env->ReleaseDoubleArrayElements(longitudes, lonValues, JNI_ABORT);

    gaodemap::GeoPoint centroid = gaodemap::calculateCentroid(polygon);

    jdoubleArray result = env->NewDoubleArray(2);
    if (result == nullptr) return nullptr;
    
    jdouble buffer[2] = {centroid.lat, centroid.lon};
    env->SetDoubleArrayRegion(result, 0, 2, buffer);
    return result;
#else
    (void)env;
    (void)latitudes;
    (void)longitudes;
    return nullptr;
#endif
}

extern "C" JNIEXPORT jstring JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeEncodeGeoHash(
    JNIEnv* env,
    jclass,
    jdouble lat,
    jdouble lon,
    jint precision
) {
#if GAODE_HAVE_JNI
    std::string hash = gaodemap::encodeGeoHash(
        static_cast<double>(lat),
        static_cast<double>(lon),
        static_cast<int>(precision)
    );
    return env->NewStringUTF(hash.c_str());
#else
    (void)env;
    (void)lat;
    (void)lon;
    (void)precision;
    return nullptr;
#endif
}

extern "C" JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_gaodemap_utils_GeometryUtils_nativeParsePolyline(
    JNIEnv* env,
    jclass,
    jstring polylineStr
) {
#if GAODE_HAVE_JNI
    if (!polylineStr) {
        return nullptr;
    }

    const char* nativeString = env->GetStringUTFChars(polylineStr, nullptr);
    if (!nativeString) return nullptr;

    std::string cppPolylineStr(nativeString);
    env->ReleaseStringUTFChars(polylineStr, nativeString);

    std::vector<gaodemap::GeoPoint> points = gaodemap::parsePolyline(cppPolylineStr);
    
    if (points.empty()) {
        return env->NewDoubleArray(0);
    }

    jdoubleArray result = env->NewDoubleArray(static_cast<jsize>(points.size() * 2));
    if (result == nullptr) return nullptr;

    std::vector<double> flatBuffer;
    flatBuffer.reserve(points.size() * 2);
    for (const auto& p : points) {
        flatBuffer.push_back(p.lat);
        flatBuffer.push_back(p.lon);
    }

    env->SetDoubleArrayRegion(result, 0, static_cast<jsize>(flatBuffer.size()), flatBuffer.data());
    return result;
#else
    (void)env;
    (void)polylineStr;
    return nullptr;
#endif
}
