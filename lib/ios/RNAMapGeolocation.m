#import "RNAMapGeolocation.h"

@implementation RNAMapGeolocation {
    AMapLocationManager *_manager;
    CLLocationManager *_clManager;
    BOOL _isStarted;
    BOOL _locatingWithReGeocode;
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

RCT_EXPORT_METHOD(setApiKey:(NSString *)apiKey) {
    [AMapServices sharedServices].apiKey = apiKey;
    _manager = [[AMapLocationManager alloc] init];
    _manager.delegate = self;
    [AMapLocationManager updatePrivacyAgree:AMapPrivacyAgreeStatusDidAgree];
    [AMapLocationManager updatePrivacyShow:AMapPrivacyShowStatusDidShow privacyInfo:AMapPrivacyInfoStatusDidContain];
    [_manager setDesiredAccuracy: kCLLocationAccuracyHundredMeters];
    [_manager setPausesLocationUpdatesAutomatically: NO];
    [[AMapServices sharedServices] setEnableHTTPS:YES];
    _clManager = [CLLocationManager new];
    _locatingWithReGeocode = NO;
    _isStarted = NO;
}

// 定位超时时间，最低2s，默认设置为2s
RCT_EXPORT_METHOD(setLocationTimeout: (int)value) {
    _manager.locationTimeout = value;
}
// 逆地理请求超时时间，最低2s，默认设置为2s
RCT_EXPORT_METHOD(setReGeocodeTimeout: (int)value) {
    _manager.reGeocodeTimeout = value;
}

// 设定定位的最小更新距离。单位米，默认为 kCLDistanceFilterNone，表示只要检测到设备位置发生变化就会更新位置信息。
RCT_EXPORT_METHOD(setDistanceFilter : (int)value) {
  _manager.distanceFilter = value;
}
// 用于指定所需的精度级别。 定位服务将尽最大努力达到您想要的精度。 但是，不能保证。
// 为了优化电源性能，请确保为您的使用情况指定适当的精度（例如，当仅需要粗略位置时，使用较大的精度值）。
// 0 => kCLLocationAccuracyBestForNavigation
// 1 => kCLLocationAccuracyBest
// 2 => kCLLocationAccuracyNearestTenMeters
// 3 => kCLLocationAccuracyHundredMeters
// 4 => kCLLocationAccuracyKilometer
// 5 => kCLLocationAccuracyThreeKilometers
RCT_EXPORT_METHOD(setDesiredAccuracy: (NSInteger)accuracy) {
    switch (accuracy) {
        case 0:
            [_manager setDesiredAccuracy: kCLLocationAccuracyBestForNavigation];
            break;
        case 1:
            [_manager setDesiredAccuracy: kCLLocationAccuracyBest];
            break;
        case 2:
            [_manager setDesiredAccuracy: kCLLocationAccuracyNearestTenMeters];
            break;
        case 3:
            [_manager setDesiredAccuracy: kCLLocationAccuracyHundredMeters];
            break;
        case 4:
            [_manager setDesiredAccuracy: kCLLocationAccuracyKilometer];
            break;
        case 5:
            [_manager setDesiredAccuracy: kCLLocationAccuracyThreeKilometers];
            break;
        default:
            break;
    }
}

// 是否已经开始定位了
RCT_REMAP_METHOD(isStarted, resolver: (RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@(_isStarted));
}

// 开始定位
RCT_EXPORT_METHOD(start) {
    _isStarted = YES;
    [_manager startUpdatingLocation];
}

// 停止更新位置信息
RCT_EXPORT_METHOD(stop) {
    _isStarted = NO;
    [_manager stopUpdatingLocation];
}

// 开始获取设备朝向，如果设备支持方向识别，则会通过代理回调方法-wx
RCT_EXPORT_METHOD(startUpdatingHeading) {
    [_manager startUpdatingHeading];
}
// 停止获取设备朝向-wx
RCT_EXPORT_METHOD(stopUpdatingHeading) {
    [_manager stopUpdatingHeading];
}

// 定位是否返回逆地理信息，默认NO。
RCT_EXPORT_METHOD(setLocatingWithReGeocode: (BOOL)value) {
    _locatingWithReGeocode = value;
    [_manager setLocatingWithReGeocode: value];
}

// 逆地址语言类型，默认是AMapLocationRegionLanguageDefault
// AMapLocationReGeocodeLanguageDefault = 0,          ///<默认，根据地区选择语言
// AMapLocationReGeocodeLanguageChinse = 1,           ///<中文
// AMapLocationReGeocodeLanguageEnglish = 2,          ///<英文
RCT_EXPORT_METHOD(setGeoLanguage : (int)value) {
  _manager.reGeocodeLanguage = (AMapLocationReGeocodeLanguage)value;
}

// 指定定位是否会被系统自动暂停。默认为NO。
RCT_EXPORT_METHOD(setPausesLocationUpdatesAutomatically: (BOOL)value) {
  _manager.pausesLocationUpdatesAutomatically = value;
}
// 是否允许后台定位。默认为NO。只在iOS 9.0及之后起作用。
// 设置为YES的时候必须保证 Background Modes 中的 Location updates 处于选中状态，否则会抛出异常。
RCT_EXPORT_METHOD(setAllowsBackgroundLocationUpdates: (BOOL)value) {
  _manager.allowsBackgroundLocationUpdates = value;
}

/**
 * @brief 转换目标经纬度为高德坐标系，不在枚举范围内的经纬度将直接返回。
 * @param coordinate 待转换的经纬度
 * @param typeNum    坐标系类型，对应的序号
 * @return 高德坐标系经纬度
 * https://lbs.amap.com/api/ios-sdk/guide/computing-equipment/amap-calculate-tool
 */
RCT_EXPORT_METHOD(coordinateConvert:
                  (CLLocationCoordinate2D) coordinate
      typer:(NSInteger)typeNum
      resolver: (RCTPromiseResolveBlock)resolve
      rejecter:(RCTPromiseRejectBlock)reject)
{
    AMapCoordinateType typeObj;
    switch (typeNum) {
        case -1:
            typeObj = AMapCoordinateTypeAMap;
            break;
        case 0:
            typeObj = AMapCoordinateTypeBaidu;
            break;
        case 1:
            typeObj = AMapCoordinateTypeMapBar;
            break;
        case 2:
            typeObj = AMapCoordinateTypeMapABC;
            break;
        case 3:
            typeObj = AMapCoordinateTypeSoSoMap;
            break;
        case 4:
            typeObj = AMapCoordinateTypeAliYun;
            break;
        case 5:
            typeObj = AMapCoordinateTypeGoogle;
            break;
        case 6:
            typeObj = AMapCoordinateTypeGPS;
            break;
        default:
            typeObj = AMapCoordinateTypeGPS;
            break;
    }

    CLLocationCoordinate2D amapcoord = AMapCoordinateConvert(CLLocationCoordinate2DMake(coordinate.latitude, coordinate.longitude), typeObj);
    resolve(@{
        @"latitude": [NSNumber numberWithDouble:amapcoord.latitude],
        @"longitude": [NSNumber numberWithDouble:amapcoord.longitude]
    });
}

// 获取当前定位
// 默认只获取经纬度，通过 setLocatingWithReGeocode 设置，是否返回逆地理信息
RCT_EXPORT_METHOD(getCurrentLocation: (RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    CLAuthorizationStatus status = [CLLocationManager authorizationStatus];
    [_clManager requestWhenInUseAuthorization];
    NSLog(@"reGeocode:逆地理信息");
    // - kCLAuthorizationStatusAuthorizedWhenInUse 用户已授权仅在使用您的应用程序时使用其位置。
    // - kCLAuthorizationStatusAuthorizedAlways 用户已授权在任何时间使用其位置。
    // - kCLAuthorizationStatusNotDetermined 用户尚未对此应用做出选择
    if (status == kCLAuthorizationStatusAuthorizedAlways || status ==  kCLAuthorizationStatusAuthorizedWhenInUse || status ==  kCLAuthorizationStatusNotDetermined) {
        [_manager requestLocationWithReGeocode: _locatingWithReGeocode completionBlock:^(CLLocation *location, AMapLocationReGeocode *regeocode, NSError *error) {
            if (error) {
                reject([NSString stringWithFormat:@"%ld",(long)error.code], error.localizedDescription, error);
            } else {
                NSLog(@"location:定位信息:%@", location);
                NSLog(@"regeocode:逆地理信息:%@", regeocode);
                if (regeocode) {
                    NSLog(@"reGeocode:逆地理信息:%@", regeocode);
                }
                id json = [self json:location reGeocode:regeocode];
                [NSUserDefaults.standardUserDefaults setObject: json forKey: RNAMapGeolocation.storeKey];
                resolve(json);
            }
        }];
    } else {
         reject(@"-10086", @"location unauthorized", nil);
    }
}

+ (NSString *)storeKey {
    return @"RNAMapGeolocation";
}

- (id)json:(CLLocation *)location reGeocode:(AMapLocationReGeocode *)reGeocode {

    BOOL flag = AMapLocationDataAvailableForCoordinate(location.coordinate);
    // 逆地理信息
    if (reGeocode) {
        return @{
            @"accuracy" : @(location.horizontalAccuracy),
            @"latitude" : @(location.coordinate.latitude),
            @"longitude" : @(location.coordinate.longitude),
            @"altitude" : @(location.altitude),
            @"speed" : @(location.speed),
            @"heading" : @(location.course),
            @"timestamp" : @(location.timestamp.timeIntervalSince1970 * 1000),
            @"isAvailableCoordinate": @(flag),

            @"address" : reGeocode.formattedAddress ? reGeocode.formattedAddress : @"",
            @"country" : reGeocode.country ? reGeocode.country : @"",
            @"province" : reGeocode.province ? reGeocode.province : @"",
            @"city" : reGeocode.city ? reGeocode.city : @"",
            @"district" : reGeocode.district ? reGeocode.district : @"",
            @"cityCode" : reGeocode.citycode ? reGeocode.citycode : @"",
            @"adCode" : reGeocode.adcode ? reGeocode.adcode : @"",
            @"street" : reGeocode.street ? reGeocode.street : @"",
            @"streetNumber" : reGeocode.number ? reGeocode.number : @"",
            @"poiName" : reGeocode.POIName ? reGeocode.POIName : @"",
            @"aoiName" : reGeocode.AOIName ? reGeocode.AOIName : @"",
        };

    } else {
        // 定位信息
        return @{
             @"accuracy": @(location.horizontalAccuracy),
             @"latitude": @(location.coordinate.latitude),
             @"longitude": @(location.coordinate.longitude),
             @"isAvailableCoordinate": @(flag),
             @"altitude": @(location.altitude),
             @"speed": @(location.speed),
             @"heading": @(location.course),
             @"timestamp": @(location.timestamp.timeIntervalSince1970 * 1000),
        };
    }
}

/**
 *  @brief 当plist配置NSLocationAlwaysUsageDescription或者NSLocationAlwaysAndWhenInUseUsageDescription，
 *  并且[CLLocationManager authorizationStatus] == kCLAuthorizationStatusNotDetermined，会调用代理的此方法。
 *  此方法实现申请后台权限API即可：[locationManager requestAlwaysAuthorization](必须调用,不然无法正常获取定位权限)
 *  @param manager 地理围栏管理类。
 *  @param locationManager  需要申请后台定位权限的locationManager。
 *  @since 2.6.2
 */
- (void)amapLocationManager:(AMapLocationManager *)manager
      doRequireLocationAuth:(CLLocationManager *)locationManager {
  [locationManager requestAlwaysAuthorization];
}

- (NSArray<NSString *> *)supportedEvents {
  return @[ @"AMapGeolocation" ];
}

/**
 *  @brief 连续定位回调函数.注意：如果实现了本方法，则定位信息不会通过amapLocationManager:didUpdateLocation:方法回调。
 *  @param manager 定位 AMapLocationManager 类。
 *  @param location 定位结果。
 *  @param reGeocode 逆地理信息。
 */
- (void)amapLocationManager:(AMapLocationManager *)manager
    didUpdateLocation:(CLLocation *)location
    reGeocode:(AMapLocationReGeocode *)reGeocode
{
    id json = [self json:location reGeocode:reGeocode];
    [self sendEventWithName: @"AMapGeolocation" body:json];
}

/**
 *  @brief 当定位发生错误时，会调用代理的此方法。
 *  @param manager 定位 AMapLocationManager 类。
 *  @param error 返回的错误，参考 CLError 。
 */
- (void)amapLocationManager:(AMapLocationManager *)manager didFailWithError:(NSError *)error {
    [self sendEventWithName: @"AMapGeolocation"
    body: @{
        @"errorCode": @(error.code),
        @"errorInfo": error.localizedDescription,
    }];
}

@end