import { NativeModules, NativeEventEmitter ,Platform} from 'react-native';

const { RNAMapGeolocation } = NativeModules;

const eventEmitter = new NativeEventEmitter(RNAMapGeolocation);

export default class AMapGeolocation {
  /**
   * 配置高德地图 Key
   * @param apiKey 获取key: https://lbs.amap.com/api/ios-location-sdk/guide/create-project/get-key
   * @type {import('./').setApiKey}
   */
  static setApiKey(apiKey) {
    return NativeModules.RNAMapGeolocation.setApiKey(apiKey);
  }
  /**
   * 开始定位
   * @type {import('./').start}
   */
  static start() {
    return NativeModules.RNAMapGeolocation.start();
  }
  /**
   * 停止更新位置信息
   * @type {import('./').stop}
   */
  static stop() {
    return NativeModules.RNAMapGeolocation.stop();
  }
  /**
   * 是否已经开始持续定位了
   * @type {import('./').isStarted}
   */
  static isStarted() {
    return NativeModules.RNAMapGeolocation.isStarted();
  }
  /**
   * 开始获取设备朝向，如果设备支持方向识别，则会通过代理回调方法-wx
   * @platform ios
   * @type {import('./').startUpdatingHeading}
   */
  static startUpdatingHeading() {
    if (Platform.OS === "ios") {
      return NativeModules.RNAMapGeolocation.startUpdatingHeading();
    }
  }
  /**
   * 停止获取设备朝向-wx
   * @platform ios
   * @type {import('./').setLocationTimeout}
   */
  static stopUpdatingHeading() {
    if (Platform.OS === "ios") {
      return NativeModules.RNAMapGeolocation.stopUpdatingHeading();
    }
  }
  /**
   * 定位超时时间，最低 2s
   * @param {number} number 默认设置为2s
   * @platform ios
   * @type {import('./').setLocationTimeout}
   */
  static setLocationTimeout(number = 2) {
    if (Platform.OS === "ios") {
      return NativeModules.RNAMapGeolocation.setLocationTimeout(number);
    }
  }
  /**
   * 逆地理请求超时时间，最低2s
   * @param {number} number 默认设置为2s
   * @platform ios
   * @type {import('./').setReGeocodeTimeout}
   */
  static setReGeocodeTimeout(number = 2) {
    if (Platform.OS === "ios") {
      return NativeModules.RNAMapGeolocation.setReGeocodeTimeout(number);
    }
  }
  /**
   * 坐标转换，支持将iOS自带定位 GPS/Google/MapBar/Baidu/MapABC 多种坐标系的坐标转换成高德坐标
   *
   * - -1 -> `AMapCoordinateTypeAMap`     ///<AMap
   * - 0 -> `AMapCoordinateTypeBaidu`     ///<Baidu
   * - 1 -> `AMapCoordinateTypeMapBar`    ///<MapBar
   * - 2 -> `AMapCoordinateTypeMapABC`    ///<MapABC
   * - 3 -> `AMapCoordinateTypeSoSoMap`   ///<SoSoMap
   * - 4 -> `AMapCoordinateTypeAliYun`    ///<AliYun
   * - 5 -> `AMapCoordinateTypeGoogle`    ///<Google
   * - 6 -> `AMapCoordinateTypeGPS`       ///<GPS
   * @param {Object} coordinate 待转换的经纬度
   * @param {Number} type 坐标系类型，对应的序号
   * 如：39.989612,116.480972
   * @type {import('./').coordinateConvert}
   */
  static coordinateConvert(coordinate, type) {
    return NativeModules.RNAMapGeolocation.coordinateConvert(coordinate, type);
  }
  /**
   * 用于指定所需的精度级别。
   * 单位米，默认为 kCLLocationAccuracyBest。定位服务会尽可能去获取满足desiredAccuracy的定位结果，但不保证一定会得到满足期望的结果。
   * 注意：设置为 kCLLocationAccuracyBest 或 kCLLocationAccuracyBestForNavigation 时，
   * 单次定位会在达到 locationTimeout 设定的时间后，将时间内获取到的最高精度的定位结果返回。
   * 高德提供了 kCLLocationAccuracyBest 参数，设置该参数可以获取到精度在10m 左右的定位结果，但是相应的需要付出比较长的时间（10s左右），
   * 越高的精度需要持续定位时间越长。
   * 推荐：kCLLocationAccuracyHundredMeters，一次还不错的定位，偏差在百米左右，超时时间设置在2s-3s左右即可。
   * @param {number} accuracy `0~5`
   * - 0 => kCLLocationAccuracyBestForNavigation
   * - 1 => kCLLocationAccuracyBest
   * - 2 => kCLLocationAccuracyNearestTenMeters
   * - 3 => kCLLocationAccuracyHundredMeters
   * - 4 => kCLLocationAccuracyKilometer
   * - 5 => kCLLocationAccuracyThreeKilometers
   * @platform ios
   * @type {import('./').setDesiredAccuracy}
   */
  static setDesiredAccuracy(accuracy) {
    if (Platform.OS === "ios") {
      return NativeModules.RNAMapGeolocation.setDesiredAccuracy(accuracy);
    }
  }
  /**
   * 设置定位模式。默认值：Hight_Accuracy 高精度模式
   * android 默认定位模式，目前支持三种定位模式
   * - 1 => `Hight_Accuracy` 高精度定位模式：在这种定位模式下，将同时使用高德网络定位和卫星定位,优先返回精度高的定位
   * - 2 => `Battery_Saving` 低功耗定位模式：在这种模式下，将只使用高德网络定位
   * - 3 => `Device_Sensors` 仅设备定位模式：在这种模式下，将只使用卫星定位。
   * @param {number} mode `1~3`
   * @platform android
   * @type {import('./').setLocationMode}
   */
  static setLocationMode(mode = 1) {
    if (Platform.OS === "android") {
      let str = 'Hight_Accuracy';
      switch (mode) {
        case 1: str = 'Hight_Accuracy'; break;
        case 2: str = 'Battery_Saving'; break;
        case 3: str = 'Device_Sensors'; break;
        default: break;
      }
      return NativeModules.RNAMapGeolocation.setLocationMode(str);
    }
  }
  /**
   * 获取当前定位
   * @type {import('./').getCurrentLocation}
   */
  static getCurrentLocation() {
    return NativeModules.RNAMapGeolocation.getCurrentLocation();
  }
  /**
   * 设置是否单次定位
   * @default false
   * @platform android
   * @type {import('./').setOnceLocation}
   */
  static setOnceLocation(isOnceLocation) {
    if (Platform.OS === "android") {
      return NativeModules.RNAMapGeolocation.setOnceLocation(isOnceLocation);
    }
  }
  /**
   * 定位是否返回逆地理信息，为了与 android 保持一致，默认 值为 true。
   * @platform ios 默认值：false, 返回地址信息，需要手动设置
   * @platform android 默认值：true, 返回地址信息
   * @type {import('./').setLocatingWithReGeocode}
   */
  static setLocatingWithReGeocode(isReGeocode = true) {
    if (Platform.OS === "ios") {
      return NativeModules.RNAMapGeolocation.setLocatingWithReGeocode(isReGeocode);
    }
    if (Platform.OS === "android") {
      return NativeModules.RNAMapGeolocation.setNeedAddress(isReGeocode);
    }
  }
  /**
   * 设定定位的最小更新距离。单位米，默认，表示只要检测到设备位置发生变化就会更新位置信息。
   * @param {number} time
   * @platform ios
   * @type {import('./').setDistanceFilter}
   */
  static setDistanceFilter(time) {
    if (Platform.OS === "ios") {
      return NativeModules.RNAMapGeolocation.setDistanceFilter(time);
    }
  }
  /**
   * 指定定位是否会被系统自动暂停。默认为 false
   * @platform ios
   * @type {import('./').setPausesLocationUpdatesAutomatically}
   */
  static setPausesLocationUpdatesAutomatically(value = false) {
    if (Platform.OS === "ios") {
      return NativeModules.RNAMapGeolocation.setPausesLocationUpdatesAutomatically(value);
    }
  }
  /**
   * 是否允许后台定位。默认为NO。只在iOS 9.0及之后起作用。
   * 设置为YES的时候必须保证 Background Modes 中的 Location updates 处于选中状态，否则会抛出异常。
   * @type {import('./').setAllowsBackgroundLocationUpdates}
   * @platform ios
   */
  static setAllowsBackgroundLocationUpdates(value = false) {
    if (Platform.OS === "ios") {
      return NativeModules.RNAMapGeolocation.setAllowsBackgroundLocationUpdates(value);
    }
  }
  /**
   * 设置发起定位请求的时间间隔，单位：毫秒，默认值：2000毫秒
   * @platform android
   * @type {import('./').setInterval}
   */
  static setInterval(interval) {
    if (Platform.OS === "android") {
      return NativeModules.RNAMapGeolocation.setInterval(interval);
    }
  }

  /**
   * 设置是否允许调用 WIFI 刷新。
   * 默认值为true，当设置为false时会停止主动调用WIFI刷新，将会极大程度影响定位精度，但可以有效的降低定位耗电
   * @default true
   * @platform android
   * @type {import('./').setWifiScan}
   */
  static setWifiScan(isWifiPassiveScan) {
    if (Platform.OS === "android") {
      return NativeModules.RNAMapGeolocation.setWifiScan(isWifiPassiveScan);
    }
  }

  /**
   * 设置是否使用设备传感器。是否开启设备传感器，当设置为true时，网络定位可以返回海拔、角度和速度。
   * @default false
   * @platform android
   * @type {import('./').setSensorEnable}
   */
  static setSensorEnable(interval) {
    if (Platform.OS === "android") {
      return NativeModules.RNAMapGeolocation.setSensorEnable(interval);
    }
  }

  /**
   * 设置逆地理信息的语言，目前之中中文和英文。
   * @param {DEFAULT | EN | ZH} language
   * @default DEFAULT
   * @type {import('./').setGeoLanguage}
   */
  static setGeoLanguage(language = 'DEFAULT') {
    if (Platform.OS === "android") {
      return NativeModules.RNAMapGeolocation.setGeoLanguage(language);
    }
    if (Platform.OS === "ios") {
      let value = 0;
      switch (language) {
        case 'DEFAULT': value = 0; break;
        case 'ZH': value = 1; break;
        case 'EN': value = 2; break;
        default: break;
      }
      return NativeModules.RNAMapGeolocation.setGeoLanguage(value);
    }
  }

  /**
   * 连续定位监听事件
   * @type {import('./').addLocationListener}
   */
  static addLocationListener(listener) {
    return eventEmitter.addListener('AMapGeolocation', (info) => {
      let errorInfo = undefined;
      if (info && (info.errorCode || info.errorInfo)) {
        errorInfo = {
          code: info.errorCode,
          message: info.errorInfo
        };
      }
      listener && listener(info, errorInfo);
    });
  }
  /**
   * 要删除其注册侦听器的事件的名称
   */
  static removeAllListeners() {
    return eventEmitter.removeAllListeners('AMapGeolocation');
  }
  /**
   * 设置是否gps优先-wx
   * @default false
   * @platform android
   * @type {import('./').setGpsFirst}
   */
  static setGpsFirst(isSetGpsFirst) {
    if (Platform.OS === "android") {
      return NativeModules.RNAMapGeolocation.setGpsFirst(isSetGpsFirst);
    }
  }
  /**
   * 设置是否等待wifi刷新-wx
   * @default false
   * @platform android
   * @type {import('./').setOnceLocationLatest}
   */
  static setOnceLocationLatest(isOnceLocationLatest) {
    if (Platform.OS === "android") {
      return NativeModules.RNAMapGeolocation.setOnceLocationLatest(isOnceLocationLatest);
    }
  }
  /**
   * 设置是否使用缓存策略, 默认为true 使用缓存策略-wx
   * @default true
   * @platform android
   * @type {import('./').setLocationCacheEnable}
   */
  static setLocationCacheEnable(isLocationCacheEnable) {
    if (Platform.OS === "android") {
      return NativeModules.RNAMapGeolocation.setLocationCacheEnable(isLocationCacheEnable);
    }
  }
  /**
   * 设置网络请求超时时间。默认为30秒-wx
   * @default 30000
   * @platform android
   * @type {import('./').setHttpTimeOut}
   */
  static setHttpTimeOut(httpTimeOut) {
    if (Platform.OS === "android") {
      return NativeModules.RNAMapGeolocation.setHttpTimeOut(httpTimeOut);
    }
  }

  /**
   * 设置网络请求的协议。可选HTTP或者HTTPS。默认为HTTP
   * @param {HTTP |HTTPS} amapLocationProtocol
   * @default HTTP
   * @platform android
   * @type {import('./').setLocationProtocol}
   */
  static setLocationProtocol(amapLocationProtocol = 'HTTP') {
    if (Platform.OS === "android") {
      return NativeModules.RNAMapGeolocation.setLocationProtocol(amapLocationProtocol)
    }
  }
}