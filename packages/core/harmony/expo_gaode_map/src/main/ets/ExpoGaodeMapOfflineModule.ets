import type { UITurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { UITurboModule } from '@rnoh/react-native-openharmony/ts';
import type { common } from '@kit.AbilityKit';
import ArrayList from '@ohos.util.ArrayList';
import {
  MapsInitializer,
  OfflineMapCity,
  OfflineMapManager,
  OfflineMapProvince,
  OfflineMapStatus
} from '@amap/amap_lbs_map3d';
import {
  AMapPrivacyAgreeStatus,
  AMapPrivacyInfoStatus,
  AMapPrivacyShowStatus
} from '@amap/amap_lbs_common';
import Logger from './Logger';
import { ExpoGaodeMapModule } from './ExpoGaodeMapModule';

interface OfflineMapInfoRecord {
  cityCode: string;
  cityName: string;
  size: number;
  status: string;
  progress: number;
  version: string;
  hasUpdate?: boolean;
  provinceName?: string;
  provinceCode?: string;
  downloadedSize?: number;
}

interface OfflineMapStorageInfoRecord {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  offlineMapSize: number;
}

interface OfflineMapDownloadEventPayload {
  cityCode: string;
  cityName: string;
  progress: number;
  downloadedSize: number;
  totalSize: number;
  status: string;
  statusMessage?: string;
}

interface OfflineMapCompleteEventPayload {
  cityCode: string;
  cityName: string;
  success: boolean;
}

interface OfflineMapPausedEventPayload {
  cityCode: string;
  cityName: string;
}

interface OfflineMapCancelledEventPayload {
  cityCode: string;
  cityName: string;
}

interface OfflineMapErrorEventPayload {
  cityCode: string;
  cityName: string;
  error: string;
  errorCode?: number;
}

interface OfflineMapDownloadConfigRecord {
  cityCode?: string;
  allowCellular?: boolean;
}

interface OfflineMapDownloadListenerLike {
  onDownload: (status: number, completeCode: number, name: string) => void;
  onCheckUpdate: (hasNew: boolean, name: string) => void;
  onRemove: (success: boolean, name: string, describe: string) => void;
}

interface OfflineLoadedListenerLike {
  onVerifyComplete: () => void;
}

interface OfflineMapManagerCompat {
  registOnMapDownloadListener?: (listener: OfflineMapDownloadListenerLike) => void;
  unRegistMapDownloadListener?: () => void;
}

interface CheckUpdatePending {
  cityCode: string;
  resolve: (hasNew: boolean) => void;
  reject: (error: Error) => void;
}

const DEFAULT_AVAILABLE_SPACE_BYTES: number = 20 * 1024 * 1024 * 1024;
const OFFLINE_LOAD_TIMEOUT_MS: number = 1200;
const OFFLINE_PROGRESS_POLL_INTERVAL_MS: number = 1000;

function arrayListToArray<T>(list: ArrayList<T> | undefined): T[] {
  const result: T[] = [];
  if (!list) {
    return result;
  }

  try {
    list.forEach((item: T) => {
      result.push(item);
    });
  } catch (error) {
    Logger.warn(`[ExpoGaodeMapOffline] ArrayList.forEach failed: ${JSON.stringify(error)}`);
  }

  return result;
}

function normalizeOfflineStatus(state: number): string {
  switch (state) {
    case OfflineMapStatus.SUCCESS:
      return 'downloaded';
    case OfflineMapStatus.LOADING:
    case OfflineMapStatus.WAITING:
      return 'downloading';
    case OfflineMapStatus.UNZIP:
      return 'unzipping';
    case OfflineMapStatus.PAUSE:
    case OfflineMapStatus.STOP:
      return 'paused';
    case OfflineMapStatus.ERROR:
    case OfflineMapStatus.EXCEPTION_AMAP:
    case OfflineMapStatus.EXCEPTION_SDCARD:
    case OfflineMapStatus.START_DOWNLOAD_FAILD:
      return 'failed';
    case OfflineMapStatus.CHECKUPDATES:
      return 'not_downloaded';
    case OfflineMapStatus.NEW_VERSION:
      return 'downloaded';
    case OfflineMapStatus.EXCEPTION_NETWORK_LOADING:
      return 'downloading';
    default:
      return 'not_downloaded';
  }
}

function readPreferredCityCode(city: OfflineMapCity): string {
  const code = city.getCode();
  if (code && code.trim().length > 0) {
    return code;
  }

  const adcode = city.getAdcode();
  if (adcode && adcode.trim().length > 0) {
    return adcode;
  }

  return city.getCity();
}

function matchesCityIdentifier(city: OfflineMapCity, cityIdentifier: string): boolean {
  if (!cityIdentifier || cityIdentifier.trim().length === 0) {
    return false;
  }

  return city.getCode() === cityIdentifier ||
    city.getAdcode() === cityIdentifier ||
    city.getCity() === cityIdentifier;
}

function cityToRecord(
  city: OfflineMapCity,
  downloadedCities: Set<string>,
  downloadingCities: Set<string>,
  pausedCities: Set<string>
): OfflineMapInfoRecord {
  const cityCode = readPreferredCityCode(city);
  const progress = Number(city.getcompleteCode());
  const size = Number(city.getSize());

  let status = normalizeOfflineStatus(city.getState());
  if (downloadedCities.has(cityCode)) {
    status = 'downloaded';
  } else if (pausedCities.has(cityCode)) {
    status = 'paused';
  } else if (downloadingCities.has(cityCode)) {
    status = 'downloading';
  }

  return {
    cityCode,
    cityName: city.getCity(),
    size,
    status,
    progress,
    version: city.getVersion(),
    hasUpdate: city.getState() === OfflineMapStatus.NEW_VERSION,
    downloadedSize: Math.floor(size * Math.max(0, Math.min(progress, 100)) / 100),
  };
}

function provinceToRecord(province: OfflineMapProvince): OfflineMapInfoRecord {
  const progress = Number(province.getcompleteCode());
  const size = Number(province.getSize());
  return {
    cityCode: province.getProvinceCode(),
    cityName: province.getProvinceName(),
    size,
    status: normalizeOfflineStatus(province.getState()),
    progress,
    version: province.getVersion(),
    hasUpdate: province.getState() === OfflineMapStatus.NEW_VERSION,
    provinceCode: province.getProvinceCode(),
    provinceName: province.getProvinceName(),
    downloadedSize: Math.floor(size * Math.max(0, Math.min(progress, 100)) / 100),
  };
}

function createDownloadedCityCodeSet(manager: OfflineMapManager): Set<string> {
  const downloadedCities = arrayListToArray<OfflineMapCity>(manager.getDownloadOfflineMapCityList());
  const downloadedCityCodes = new Set<string>();
  for (let index = 0; index < downloadedCities.length; index += 1) {
    downloadedCityCodes.add(readPreferredCityCode(downloadedCities[index]));
  }
  return downloadedCityCodes;
}

function toPrivacyShowStatus(hasShow: boolean): AMapPrivacyShowStatus {
  return hasShow ? AMapPrivacyShowStatus.DidShow : AMapPrivacyShowStatus.NotShow;
}

function toPrivacyInfoStatus(hasContainsPrivacy: boolean): AMapPrivacyInfoStatus {
  return hasContainsPrivacy ? AMapPrivacyInfoStatus.DidContain : AMapPrivacyInfoStatus.NotContain;
}

function toPrivacyAgreeStatus(hasAgree: boolean): AMapPrivacyAgreeStatus {
  return hasAgree ? AMapPrivacyAgreeStatus.DidAgree : AMapPrivacyAgreeStatus.NotAgree;
}

export class ExpoGaodeMapOfflineModule extends UITurboModule {
  private offlineMapManager?: OfflineMapManager;
  private readonly downloadingCities: Set<string> = new Set<string>();
  private readonly pausedCities: Set<string> = new Set<string>();
  private readonly cityNameToCode: Map<string, string> = new Map<string, string>();
  private readonly pendingCheckUpdateByName: Map<string, CheckUpdatePending> = new Map<string, CheckUpdatePending>();
  private progressPollTimer: number = -1;
  private offlineLoaded: boolean = false;
  private offlineLoadWaiters: Array<() => void> = [];
  private storagePath: string = '';
  private readonly downloadListener: OfflineMapDownloadListenerLike = {
    onDownload: (status: number, completeCode: number, name: string): void => {
      this.handleDownloadStatus(status, completeCode, name);
    },
    onCheckUpdate: (hasNew: boolean, name: string): void => {
      this.handleCheckUpdateResult(hasNew, name);
    },
    onRemove: (success: boolean, name: string, describe: string): void => {
      this.handleRemoveResult(success, name, describe);
    }
  };
  private readonly offlineLoadedListener: OfflineLoadedListenerLike = {
    onVerifyComplete: (): void => {
      Logger.info('[ExpoGaodeMapOffline] offline city list verified');
      this.offlineLoaded = true;
      const waiters = this.offlineLoadWaiters.slice();
      this.offlineLoadWaiters = [];
      for (let index = 0; index < waiters.length; index += 1) {
        waiters[index]();
      }
    }
  };

  constructor(ctx: UITurboModuleContext) {
    super(ctx);
  }

  override __onDestroy__(): void {
    if (this.progressPollTimer >= 0) {
      clearInterval(this.progressPollTimer);
      this.progressPollTimer = -1;
    }
    if (this.offlineMapManager) {
      const managerCompat = this.offlineMapManager as OfflineMapManagerCompat;
      if (managerCompat.unRegistMapDownloadListener) {
        try {
          managerCompat.unRegistMapDownloadListener();
          Logger.info('[ExpoGaodeMapOffline] unRegistMapDownloadListener success');
        } catch (error) {
          Logger.warn(`[ExpoGaodeMapOffline] unRegistMapDownloadListener failed: ${JSON.stringify(error)}`);
        }
      }
      this.offlineMapManager.destroy();
      this.offlineMapManager = undefined;
    }
    this.downloadingCities.clear();
    this.pausedCities.clear();
    this.cityNameToCode.clear();
    this.pendingCheckUpdateByName.clear();
    this.offlineLoaded = false;
    this.offlineLoadWaiters = [];
  }

  addListener(_eventName: string): void {}

  removeListeners(_count: number): void {}

  private ensureProgressPolling(): void {
    if (this.progressPollTimer >= 0) {
      return;
    }
    this.progressPollTimer = setInterval(() => {
      this.pollDownloadProgress();
    }, OFFLINE_PROGRESS_POLL_INTERVAL_MS);
    Logger.info('[ExpoGaodeMapOffline] progress polling started');
  }

  private stopProgressPollingIfIdle(): void {
    if (this.downloadingCities.size > 0) {
      return;
    }
    if (this.progressPollTimer >= 0) {
      clearInterval(this.progressPollTimer);
      this.progressPollTimer = -1;
      Logger.info('[ExpoGaodeMapOffline] progress polling stopped');
    }
  }

  private pollDownloadProgress(): void {
    const manager = this.offlineMapManager;
    if (!manager) {
      this.stopProgressPollingIfIdle();
      return;
    }

    if (this.downloadingCities.size === 0) {
      this.stopProgressPollingIfIdle();
      return;
    }

    const sdkDownloadingCities = arrayListToArray<OfflineMapCity>(manager.getDownloadingCityList());
    for (let index = 0; index < sdkDownloadingCities.length; index += 1) {
      const sdkCity = sdkDownloadingCities[index];
      const sdkCityName = sdkCity.getCity();
      const mappedCityCode = this.cityNameToCode.get(sdkCityName) || this.cityNameToCode.get(sdkCityName.trim());
      const trackedCityCode = mappedCityCode || readPreferredCityCode(sdkCity);
      this.downloadingCities.add(trackedCityCode);
      this.handleDownloadStatus(
        sdkCity.getState(),
        Number(sdkCity.getcompleteCode()),
        sdkCityName
      );
    }

    const downloadingList = Array.from(this.downloadingCities);
    for (let index = 0; index < downloadingList.length; index += 1) {
      const cityCode = downloadingList[index];
      const city = this.getCityByIdentifier(cityCode);
      if (!city) {
        continue;
      }
      this.handleDownloadStatus(
        city.getState(),
        Number(city.getcompleteCode()),
        city.getCity()
      );
    }
  }

  private getContext(): common.UIAbilityContext {
    const uiAbilityContext = this.ctx.uiAbilityContext;
    if (!uiAbilityContext) {
      throw new Error('uiAbilityContext is missing');
    }
    return uiAbilityContext;
  }

  private ensureMapsInitializer(context: common.UIAbilityContext): void {
    try {
      MapsInitializer.initialize(context);
    } catch (error) {
      Logger.error(`[ExpoGaodeMapOffline] MapsInitializer.initialize failed: ${JSON.stringify(error)}`);
      throw new Error('MapsInitializer.initialize failed');
    }

    const sdkConfig = ExpoGaodeMapModule.getSDKConfig();
    const apiKey = sdkConfig?.harmonyKey || sdkConfig?.androidKey || sdkConfig?.webKey || sdkConfig?.iosKey;
    if (apiKey && apiKey.trim().length > 0) {
      try {
        MapsInitializer.setApiKey(apiKey);
      } catch (error) {
        Logger.error(`[ExpoGaodeMapOffline] MapsInitializer.setApiKey failed: ${JSON.stringify(error)}`);
      }
    }

    const privacyStatus = ExpoGaodeMapModule.getPrivacyStatusSnapshot();
    try {
      MapsInitializer.updatePrivacyShow(
        toPrivacyShowStatus(privacyStatus.hasShow),
        toPrivacyInfoStatus(privacyStatus.hasContainsPrivacy),
        context
      );
      MapsInitializer.updatePrivacyAgree(
        toPrivacyAgreeStatus(privacyStatus.hasAgree),
        context
      );
    } catch (error) {
      Logger.error(`[ExpoGaodeMapOffline] MapsInitializer privacy update failed: ${JSON.stringify(error)}`);
    }
  }

  private getOfflineMapManager(): OfflineMapManager {
    const context = this.getContext();
    this.ensureMapsInitializer(context);

    if (!this.offlineMapManager) {
      if (!this.storagePath) {
        this.storagePath = `${context.cacheDir}/amap/data`;
      }
      const manager = new OfflineMapManager(context, this.downloadListener);
      const managerCompat = manager as OfflineMapManagerCompat;
      if (managerCompat.registOnMapDownloadListener) {
        try {
          managerCompat.registOnMapDownloadListener(this.downloadListener);
          Logger.info('[ExpoGaodeMapOffline] registOnMapDownloadListener success');
        } catch (error) {
          Logger.warn(`[ExpoGaodeMapOffline] registOnMapDownloadListener failed: ${JSON.stringify(error)}`);
        }
      } else {
        Logger.info('[ExpoGaodeMapOffline] registOnMapDownloadListener not available, rely on constructor listener');
      }
      manager.setOnOfflineLoadedListener(this.offlineLoadedListener);
      this.offlineMapManager = manager;
    }
    return this.offlineMapManager;
  }

  private findCityByIdentifier(cityIdentifier: string): OfflineMapCity | undefined {
    const manager = this.getOfflineMapManager();
    const directCity = manager.getItemByCityCode(cityIdentifier);
    if (directCity) {
      return directCity;
    }

    const cities = arrayListToArray<OfflineMapCity>(manager.getOfflineMapCityList());
    for (let index = 0; index < cities.length; index += 1) {
      if (matchesCityIdentifier(cities[index], cityIdentifier)) {
        return cities[index];
      }
    }

    return undefined;
  }

  private downloadOfflineCityByCode(cityCode: string): void {
    const city = this.findCityByIdentifier(cityCode);
    const resolvedCityCode = city ? city.getCode() : cityCode;
    const publicCityCode = city ? readPreferredCityCode(city) : cityCode;
    const cityName = city ? city.getCity() : cityCode;
    if (cityName.trim().length > 0) {
      this.cityNameToCode.set(cityName, publicCityCode);
      this.cityNameToCode.set(cityName.trim(), publicCityCode);
    }

    try {
      if (city && cityName.trim().length > 0) {
        this.getOfflineMapManager().downloadByCityName(cityName);
        Logger.info(`[ExpoGaodeMapOffline] start download by name: request=${cityCode} resolved=${resolvedCityCode} public=${publicCityCode} cityName=${cityName}`);
      } else {
        this.getOfflineMapManager().downloadByCityCode(resolvedCityCode);
        Logger.info(`[ExpoGaodeMapOffline] start download by code: request=${cityCode} resolved=${resolvedCityCode} public=${publicCityCode}`);
      }
      this.emitOfflineEvent('onDownloadProgress', {
        cityCode: publicCityCode,
        cityName,
        progress: 0,
        downloadedSize: 0,
        totalSize: city ? Number(city.getSize()) : 0,
        status: 'downloading',
      });
    } catch (error) {
      Logger.error(`[ExpoGaodeMapOffline] downloadByCityCode failed: cityCode=${cityCode} resolved=${resolvedCityCode} error=${JSON.stringify(error)}`);
      throw new Error(`downloadByCityCode failed: ${cityCode}`);
    }
  }

  private updateOfflineCityByCode(cityCode: string): void {
    const city = this.findCityByIdentifier(cityCode);
    const resolvedCityCode = city ? city.getCode() : cityCode;
    const cityName = city ? city.getCity() : '';
    try {
      if (cityName.trim().length > 0) {
        this.getOfflineMapManager().updateOfflineCityByName(cityName);
        Logger.info(`[ExpoGaodeMapOffline] update city by name: request=${cityCode} resolved=${resolvedCityCode} cityName=${cityName}`);
      } else {
        this.getOfflineMapManager().updateOfflineCityByCode(resolvedCityCode);
        Logger.info(`[ExpoGaodeMapOffline] update city by code: request=${cityCode} resolved=${resolvedCityCode}`);
      }
    } catch (error) {
      Logger.error(`[ExpoGaodeMapOffline] updateOfflineCityByCode failed: cityCode=${cityCode} resolved=${resolvedCityCode} error=${JSON.stringify(error)}`);
      throw new Error(`updateOfflineCityByCode failed: ${cityCode}`);
    }
  }

  private waitUntilOfflineLoaded(): Promise<void> {
    if (this.offlineLoaded) {
      return Promise.resolve();
    }

    this.getOfflineMapManager();

    return new Promise<void>((resolve) => {
      let resolved = false;
      const finish = (): void => {
        if (resolved) {
          return;
        }
        resolved = true;
        resolve();
      };

      this.offlineLoadWaiters.push(finish);
      setTimeout(() => {
        finish();
      }, OFFLINE_LOAD_TIMEOUT_MS);
    });
  }

  private emitOfflineEvent(
    eventName: string,
    payload:
      | OfflineMapDownloadEventPayload
      | OfflineMapCompleteEventPayload
      | OfflineMapPausedEventPayload
      | OfflineMapCancelledEventPayload
      | OfflineMapErrorEventPayload
  ): void {
    try {
      this.ctx.rnInstance.emitDeviceEvent(eventName, payload);
    } catch (error) {
      Logger.error(`[ExpoGaodeMapOffline] emit ${eventName} failed: ${JSON.stringify(error)}`);
    }
  }

  private getCityByName(name: string): OfflineMapCity | undefined {
    const manager = this.offlineMapManager;
    if (!manager) {
      return undefined;
    }

    const directCity = manager.getItemByCityName(name);
    if (directCity) {
      return directCity;
    }

    const cities = arrayListToArray<OfflineMapCity>(manager.getOfflineMapCityList());
    for (let index = 0; index < cities.length; index += 1) {
      if (cities[index].getCity() === name) {
        return cities[index];
      }
    }
    return undefined;
  }

  private getCityByIdentifier(cityIdentifier: string): OfflineMapCity | undefined {
    const manager = this.offlineMapManager;
    if (!manager) {
      return undefined;
    }

    const directCity = manager.getItemByCityCode(cityIdentifier);
    if (directCity) {
      return directCity;
    }

    const cities = arrayListToArray<OfflineMapCity>(manager.getOfflineMapCityList());
    for (let index = 0; index < cities.length; index += 1) {
      if (matchesCityIdentifier(cities[index], cityIdentifier)) {
        return cities[index];
      }
    }

    return undefined;
  }

  private getDownloadingCityByIdentifier(cityIdentifier: string): OfflineMapCity | undefined {
    const manager = this.offlineMapManager;
    if (!manager) {
      return undefined;
    }

    const downloadingList = arrayListToArray<OfflineMapCity>(manager.getDownloadingCityList());
    for (let index = 0; index < downloadingList.length; index += 1) {
      if (matchesCityIdentifier(downloadingList[index], cityIdentifier)) {
        return downloadingList[index];
      }
    }

    return undefined;
  }

  private handleCheckUpdateResult(hasNew: boolean, name: string): void {
    const pending = this.pendingCheckUpdateByName.get(name);
    if (!pending) {
      return;
    }
    this.pendingCheckUpdateByName.delete(name);
    pending.resolve(hasNew);
  }

  private handleRemoveResult(success: boolean, name: string, describe: string): void {
    Logger.info(`[ExpoGaodeMapOffline] remove result: success=${success} name=${name} describe=${describe}`);
  }

  private handleDownloadStatus(status: number, completeCode: number, name: string): void {
    const city = this.getCityByName(name) || this.getCityByIdentifier(name);
    const mappedCityCode = this.cityNameToCode.get(name) || this.cityNameToCode.get(name.trim());
    const fallbackCityCode = mappedCityCode || name;
    const fallbackCityName = name && name.trim().length > 0 ? name : fallbackCityCode;
    const fallbackCity = this.getCityByIdentifier(fallbackCityCode);

    const cityCode = city ? readPreferredCityCode(city) : fallbackCityCode;
    const cityName = city ? city.getCity() : fallbackCityName;
    const totalSize = city ? Number(city.getSize()) : fallbackCity ? Number(fallbackCity.getSize()) : 0;
    if (!city) {
      Logger.warn(`[ExpoGaodeMapOffline] download callback city not found, fallback: name=${name} cityCode=${cityCode}`);
    }
    const progress = Math.max(0, Math.min(Number(completeCode), 100));
    const downloadedSize = Math.floor(totalSize * progress / 100);

    Logger.info(`[ExpoGaodeMapOffline] onDownload status=${status} progress=${progress} cityName=${cityName} cityCode=${cityCode}`);

    if (status === OfflineMapStatus.SUCCESS) {
      const wasDownloading = this.downloadingCities.has(cityCode);
      this.downloadingCities.delete(cityCode);
      this.pausedCities.delete(cityCode);
      this.cityNameToCode.delete(cityName);
      this.cityNameToCode.delete(cityName.trim());
      this.stopProgressPollingIfIdle();
      if (!wasDownloading) {
        Logger.info(`[ExpoGaodeMapOffline] ignore duplicate success callback: cityCode=${cityCode}`);
        return;
      }
      this.emitOfflineEvent('onDownloadComplete', {
        cityCode,
        cityName,
        success: true,
      });
      return;
    }

    if (status === OfflineMapStatus.LOADING || status === OfflineMapStatus.WAITING) {
      this.downloadingCities.add(cityCode);
      this.pausedCities.delete(cityCode);
      this.ensureProgressPolling();
      this.emitOfflineEvent('onDownloadProgress', {
        cityCode,
        cityName,
        progress,
        downloadedSize,
        totalSize,
        status: 'downloading',
      });
      return;
    }

    if (status === OfflineMapStatus.UNZIP) {
      this.downloadingCities.add(cityCode);
      this.pausedCities.delete(cityCode);
      this.ensureProgressPolling();
      this.emitOfflineEvent('onUnzipProgress', {
        cityCode,
        cityName,
        progress,
        downloadedSize,
        totalSize,
        status: 'unzipping',
      });
      return;
    }

    if (status === OfflineMapStatus.PAUSE || status === OfflineMapStatus.STOP) {
      this.downloadingCities.delete(cityCode);
      this.pausedCities.add(cityCode);
      this.stopProgressPollingIfIdle();
      this.emitOfflineEvent('onDownloadPaused', {
        cityCode,
        cityName,
      });
      return;
    }

    if (status === OfflineMapStatus.CHECKUPDATES || status === OfflineMapStatus.NEW_VERSION) {
      this.ensureProgressPolling();
      return;
    }

    this.downloadingCities.delete(cityCode);
    this.pausedCities.delete(cityCode);
    this.cityNameToCode.delete(cityName);
    this.cityNameToCode.delete(cityName.trim());
    this.stopProgressPollingIfIdle();
    const errorPayload: OfflineMapErrorEventPayload = {
      cityCode,
      cityName,
      error: '下载失败',
      errorCode: status,
    };

    if (status === OfflineMapStatus.ERROR) {
      errorPayload.error = '解压失败，数据可能已损坏';
    } else if (status === OfflineMapStatus.EXCEPTION_NETWORK_LOADING) {
      errorPayload.error = '网络异常';
    } else if (status === OfflineMapStatus.EXCEPTION_AMAP) {
      errorPayload.error = '认证异常，请检查 Harmony Key';
    } else if (status === OfflineMapStatus.EXCEPTION_SDCARD) {
      errorPayload.error = '离线地图存储读写异常';
    } else if (status === OfflineMapStatus.START_DOWNLOAD_FAILD) {
      errorPayload.error = '开始下载失败';
    }

    this.emitOfflineEvent('onDownloadError', errorPayload);
  }

  async getAvailableCities(): Promise<OfflineMapInfoRecord[]> {
    await this.waitUntilOfflineLoaded();
    const manager = this.getOfflineMapManager();
    const downloadedCityCodes = createDownloadedCityCodeSet(manager);
    const cities = arrayListToArray<OfflineMapCity>(manager.getOfflineMapCityList());
    const result: OfflineMapInfoRecord[] = [];
    for (let index = 0; index < cities.length; index += 1) {
      result.push(cityToRecord(cities[index], downloadedCityCodes, this.downloadingCities, this.pausedCities));
    }
    return result;
  }

  async getAvailableProvinces(): Promise<OfflineMapInfoRecord[]> {
    await this.waitUntilOfflineLoaded();
    const provinces = arrayListToArray<OfflineMapProvince>(this.getOfflineMapManager().getOfflineMapProvinceList());
    const result: OfflineMapInfoRecord[] = [];
    for (let index = 0; index < provinces.length; index += 1) {
      result.push(provinceToRecord(provinces[index]));
    }
    return result;
  }

  async getCitiesByProvince(provinceCode: string): Promise<OfflineMapInfoRecord[]> {
    await this.waitUntilOfflineLoaded();
    const manager = this.getOfflineMapManager();
    const downloadedCityCodes = createDownloadedCityCodeSet(manager);
    const provinces = arrayListToArray<OfflineMapProvince>(manager.getOfflineMapProvinceList());
    for (let index = 0; index < provinces.length; index += 1) {
      const province = provinces[index];
      if (province.getProvinceCode() === provinceCode) {
        const cities = province.getCityList();
        const result: OfflineMapInfoRecord[] = [];
        for (let cityIndex = 0; cityIndex < cities.length; cityIndex += 1) {
          const record = cityToRecord(cities[cityIndex], downloadedCityCodes, this.downloadingCities, this.pausedCities);
          record.provinceCode = province.getProvinceCode();
          record.provinceName = province.getProvinceName();
          result.push(record);
        }
        return result;
      }
    }
    return [];
  }

  async getDownloadedMaps(): Promise<OfflineMapInfoRecord[]> {
    await this.waitUntilOfflineLoaded();
    const manager = this.getOfflineMapManager();
    const downloadedCityCodes = createDownloadedCityCodeSet(manager);
    const cities = arrayListToArray<OfflineMapCity>(manager.getDownloadOfflineMapCityList());
    const result: OfflineMapInfoRecord[] = [];
    for (let index = 0; index < cities.length; index += 1) {
      result.push(cityToRecord(cities[index], downloadedCityCodes, this.downloadingCities, this.pausedCities));
    }
    return result;
  }

  async startDownload(config: OfflineMapDownloadConfigRecord): Promise<void> {
    const requestedCityCode = config.cityCode;
    if (!requestedCityCode || requestedCityCode.trim().length === 0) {
      throw new Error('cityCode is required');
    }
    const city = this.findCityByIdentifier(requestedCityCode);
    const publicCityCode = city ? readPreferredCityCode(city) : requestedCityCode;
    if (this.downloadingCities.has(publicCityCode)) {
      Logger.info(`[ExpoGaodeMapOffline] skip duplicate startDownload: cityCode=${publicCityCode}`);
      return;
    }

    const queuedCity = this.getDownloadingCityByIdentifier(requestedCityCode);
    if (queuedCity) {
      const queuedCityCode = readPreferredCityCode(queuedCity);
      const queuedCityName = queuedCity.getCity();
      const trackedCityCode = city ? publicCityCode : queuedCityCode;
      if (queuedCityName.trim().length > 0) {
        this.cityNameToCode.set(queuedCityName, trackedCityCode);
        this.cityNameToCode.set(queuedCityName.trim(), trackedCityCode);
      }
      this.downloadingCities.add(trackedCityCode);
      this.pausedCities.delete(trackedCityCode);
      this.ensureProgressPolling();
      this.emitOfflineEvent('onDownloadProgress', {
        cityCode: trackedCityCode,
        cityName: queuedCityName,
        progress: Math.max(0, Math.min(Number(queuedCity.getcompleteCode()), 100)),
        downloadedSize: Math.floor(Number(queuedCity.getSize()) * Math.max(0, Math.min(Number(queuedCity.getcompleteCode()), 100)) / 100),
        totalSize: Number(queuedCity.getSize()),
        status: 'downloading',
      });
      Logger.info(`[ExpoGaodeMapOffline] skip startDownload, city already in sdk queue: cityCode=${trackedCityCode}`);
      return;
    }

    if (city) {
      const state = city.getState();
      const cityName = city.getCity();
      if (cityName.trim().length > 0) {
        this.cityNameToCode.set(cityName, publicCityCode);
        this.cityNameToCode.set(cityName.trim(), publicCityCode);
      }
      const totalSize = Number(city.getSize());
      const progress = Math.max(0, Math.min(Number(city.getcompleteCode()), 100));
      const downloadedSize = Math.floor(totalSize * progress / 100);

      if (state === OfflineMapStatus.SUCCESS) {
        this.emitOfflineEvent('onDownloadComplete', {
          cityCode: publicCityCode,
          cityName,
          success: true,
        });
        Logger.info(`[ExpoGaodeMapOffline] skip startDownload, already downloaded: cityCode=${publicCityCode}`);
        return;
      }

      if (
        state === OfflineMapStatus.LOADING ||
        state === OfflineMapStatus.WAITING ||
        state === OfflineMapStatus.UNZIP
      ) {
        this.downloadingCities.add(publicCityCode);
        this.pausedCities.delete(publicCityCode);
        this.ensureProgressPolling();
        this.emitOfflineEvent('onDownloadProgress', {
          cityCode: publicCityCode,
          cityName,
          progress,
          downloadedSize,
          totalSize,
          status: state === OfflineMapStatus.UNZIP ? 'unzipping' : 'downloading',
        });
        Logger.info(`[ExpoGaodeMapOffline] skip startDownload, city already active: cityCode=${publicCityCode} state=${state} progress=${progress}`);
        return;
      }
    }

    this.downloadingCities.add(publicCityCode);
    this.pausedCities.delete(publicCityCode);
    this.ensureProgressPolling();
    this.downloadOfflineCityByCode(requestedCityCode);
  }

  async pauseDownload(cityCode: string): Promise<void> {
    const city = this.getCityByIdentifier(cityCode);
    if (!city) {
      throw new Error(`city not found: ${cityCode}`);
    }

    const publicCityCode = readPreferredCityCode(city);
    this.pausedCities.add(publicCityCode);
    this.downloadingCities.delete(publicCityCode);
    this.getOfflineMapManager().pauseByName(city.getCity());
    this.emitOfflineEvent('onDownloadPaused', {
      cityCode: publicCityCode,
      cityName: city.getCity(),
    });
  }

  async resumeDownload(cityCode: string): Promise<void> {
    const city = this.findCityByIdentifier(cityCode);
    const publicCityCode = city ? readPreferredCityCode(city) : cityCode;
    this.downloadingCities.add(publicCityCode);
    this.pausedCities.delete(publicCityCode);
    this.ensureProgressPolling();
    this.downloadOfflineCityByCode(cityCode);
  }

  async cancelDownload(cityCode: string): Promise<void> {
    const city = this.getCityByIdentifier(cityCode);
    const publicCityCode = city ? readPreferredCityCode(city) : cityCode;
    this.downloadingCities.delete(publicCityCode);
    this.pausedCities.delete(publicCityCode);
    this.stopProgressPollingIfIdle();
    this.getOfflineMapManager().stop();
    if (city) {
      this.emitOfflineEvent('onDownloadCancelled', {
        cityCode: publicCityCode,
        cityName: city.getCity(),
      });
    }
  }

  async deleteMap(cityCode: string): Promise<void> {
    const city = this.getCityByIdentifier(cityCode);
    if (!city) {
      throw new Error(`city not found: ${cityCode}`);
    }
    this.getOfflineMapManager().remove(city.getCity());
    const publicCityCode = readPreferredCityCode(city);
    this.downloadingCities.delete(publicCityCode);
    this.pausedCities.delete(publicCityCode);
    this.stopProgressPollingIfIdle();
  }

  async updateMap(cityCode: string): Promise<void> {
    const city = this.findCityByIdentifier(cityCode);
    const publicCityCode = city ? readPreferredCityCode(city) : cityCode;
    this.downloadingCities.add(publicCityCode);
    this.pausedCities.delete(publicCityCode);
    this.ensureProgressPolling();
    this.updateOfflineCityByCode(cityCode);
  }

  async checkUpdate(cityCode: string): Promise<boolean> {
    const city = this.getCityByIdentifier(cityCode);
    if (!city) {
      return false;
    }

    const cityName = city.getCity();
    const publicCityCode = readPreferredCityCode(city);
    return new Promise<boolean>((resolve, reject) => {
      this.pendingCheckUpdateByName.set(cityName, {
        cityCode: publicCityCode,
        resolve,
        reject,
      });
      try {
        this.updateOfflineCityByCode(publicCityCode);
      } catch (error) {
        this.pendingCheckUpdateByName.delete(cityName);
        reject(error instanceof Error ? error : new Error('checkUpdate failed'));
      }
    });
  }

  async isMapDownloaded(cityCode: string): Promise<boolean> {
    const manager = this.getOfflineMapManager();
    const city = this.getCityByIdentifier(cityCode);
    if (!city) {
      return false;
    }
    return createDownloadedCityCodeSet(manager).has(readPreferredCityCode(city));
  }

  async getMapStatus(cityCode: string): Promise<OfflineMapInfoRecord> {
    const manager = this.getOfflineMapManager();
    const city = this.getCityByIdentifier(cityCode);
    if (!city) {
      throw new Error(`city not found: ${cityCode}`);
    }
    const downloadedCityCodes = createDownloadedCityCodeSet(manager);
    return cityToRecord(city, downloadedCityCodes, this.downloadingCities, this.pausedCities);
  }

  async getTotalProgress(): Promise<number> {
    const cities = arrayListToArray<OfflineMapCity>(this.getOfflineMapManager().getDownloadingCityList());
    if (cities.length === 0) {
      return 0;
    }

    let totalProgress = 0;
    for (let index = 0; index < cities.length; index += 1) {
      totalProgress += Number(cities[index].getcompleteCode());
    }
    return totalProgress / cities.length;
  }

  async getDownloadingCities(): Promise<string[]> {
    return Array.from(this.downloadingCities);
  }

  async getStorageSize(): Promise<number> {
    const downloaded = arrayListToArray<OfflineMapCity>(this.getOfflineMapManager().getDownloadOfflineMapCityList());
    let totalSize = 0;
    for (let index = 0; index < downloaded.length; index += 1) {
      totalSize += Number(downloaded[index].getSize());
    }
    return totalSize;
  }

  async getStorageInfo(): Promise<OfflineMapStorageInfoRecord> {
    const offlineMapSize = await this.getStorageSize();
    return {
      totalSpace: offlineMapSize + DEFAULT_AVAILABLE_SPACE_BYTES,
      usedSpace: offlineMapSize,
      availableSpace: DEFAULT_AVAILABLE_SPACE_BYTES,
      offlineMapSize,
    };
  }

  async clearAllMaps(): Promise<void> {
    const downloaded = arrayListToArray<OfflineMapCity>(this.getOfflineMapManager().getDownloadOfflineMapCityList());
    for (let index = 0; index < downloaded.length; index += 1) {
      this.getOfflineMapManager().remove(downloaded[index].getCity());
    }
    this.downloadingCities.clear();
    this.pausedCities.clear();
    this.cityNameToCode.clear();
    this.stopProgressPollingIfIdle();
  }

  setStoragePath(path: string): void {
    this.storagePath = path;
  }

  async getStoragePath(): Promise<string> {
    if (this.storagePath.length > 0) {
      return this.storagePath;
    }
    const context = this.getContext();
    this.storagePath = `${context.cacheDir}/amap/data`;
    return this.storagePath;
  }

  async batchDownload(cityCodes: string[], _allowCellular?: boolean): Promise<void> {
    for (let index = 0; index < cityCodes.length; index += 1) {
      const cityCode = cityCodes[index];
      const city = this.findCityByIdentifier(cityCode);
      const publicCityCode = city ? readPreferredCityCode(city) : cityCode;
      this.downloadingCities.add(publicCityCode);
      this.pausedCities.delete(publicCityCode);
      this.ensureProgressPolling();
      this.downloadOfflineCityByCode(cityCode);
    }
  }

  async batchDelete(cityCodes: string[]): Promise<void> {
    for (let index = 0; index < cityCodes.length; index += 1) {
      const cityCode = cityCodes[index];
      const city = this.getCityByIdentifier(cityCode);
      if (city) {
        this.getOfflineMapManager().remove(city.getCity());
      }
      const publicCityCode = city ? readPreferredCityCode(city) : cityCode;
      this.downloadingCities.delete(publicCityCode);
      this.pausedCities.delete(publicCityCode);
    }
    this.stopProgressPollingIfIdle();
  }

  async batchUpdate(cityCodes: string[]): Promise<void> {
    for (let index = 0; index < cityCodes.length; index += 1) {
      const cityCode = cityCodes[index];
      const city = this.findCityByIdentifier(cityCode);
      const publicCityCode = city ? readPreferredCityCode(city) : cityCode;
      this.downloadingCities.add(publicCityCode);
      this.ensureProgressPolling();
      this.updateOfflineCityByCode(cityCode);
    }
  }

  async pauseAllDownloads(): Promise<void> {
    const downloadingList = Array.from(this.downloadingCities);
    this.getOfflineMapManager().pause();
    for (let index = 0; index < downloadingList.length; index += 1) {
      const cityCode = downloadingList[index];
      this.pausedCities.add(cityCode);
      const city = this.getCityByIdentifier(cityCode);
      if (city) {
        this.emitOfflineEvent('onDownloadPaused', {
          cityCode: readPreferredCityCode(city),
          cityName: city.getCity(),
        });
      }
    }
    this.downloadingCities.clear();
    this.stopProgressPollingIfIdle();
  }

  async resumeAllDownloads(): Promise<void> {
    const pausedList = Array.from(this.pausedCities);
    for (let index = 0; index < pausedList.length; index += 1) {
      const cityCode = pausedList[index];
      this.downloadingCities.add(cityCode);
      this.pausedCities.delete(cityCode);
      this.ensureProgressPolling();
      this.downloadOfflineCityByCode(cityCode);
    }
  }
}

export default ExpoGaodeMapOfflineModule;
