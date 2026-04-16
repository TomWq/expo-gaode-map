import type { UITurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { UITurboModule } from '@rnoh/react-native-openharmony/ts';
import { abilityAccessCtrl, bundleManager } from '@kit.AbilityKit';
import type { common, PermissionRequestResult, Permissions } from '@kit.AbilityKit';

interface PrivacyStatus {
  hasShow: boolean;
  hasContainsPrivacy: boolean;
  hasAgree: boolean;
  isReady: boolean;
  privacyVersion: string | null;
  agreedPrivacyVersion: string | null;
  restoredFromStorage: boolean;
}

interface SDKConfig {
  androidKey?: string;
  iosKey?: string;
  harmonyKey?: string;
  webKey?: string;
}

interface HarmonyPermissionStatus {
  granted: boolean;
  status: string;
  canAskAgain: boolean;
  isPermanentlyDenied: boolean;
  backgroundLocation: boolean;
  fineLocation: boolean;
  coarseLocation: boolean;
  shouldShowRationale: boolean;
  message?: string;
}

const LOCATION_PERMISSION_APPROXIMATE: Permissions = 'ohos.permission.APPROXIMATELY_LOCATION';
const LOCATION_PERMISSION_PRECISE: Permissions = 'ohos.permission.LOCATION';
const LOCATION_PERMISSION_BACKGROUND: Permissions = 'ohos.permission.LOCATION_IN_BACKGROUND';
const LOCATION_FOREGROUND_PERMISSIONS: Array<Permissions> = [
  LOCATION_PERMISSION_APPROXIMATE,
  LOCATION_PERMISSION_PRECISE,
];
const LOCATION_BACKGROUND_PERMISSIONS: Array<Permissions> = [
  LOCATION_PERMISSION_BACKGROUND,
];

const defaultPrivacyStatus: PrivacyStatus = {
  hasShow: true,
  hasContainsPrivacy: true,
  hasAgree: true,
  isReady: true,
  privacyVersion: null,
  agreedPrivacyVersion: null,
  restoredFromStorage: true,
};

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return apiKey;
  }
  return `${apiKey.slice(0, 4)}***${apiKey.slice(-4)}`;
}

export class ExpoGaodeMapModule extends UITurboModule {
  private static privacyStatus: PrivacyStatus = { ...defaultPrivacyStatus };
  private static sdkConfig: SDKConfig | null = null;
  private static accessTokenId: number = -1;
  private static loadWorldVectorMapEnabled: boolean = false;

  constructor(ctx: UITurboModuleContext) {
    super(ctx);
    console.info('[ExpoGaodeMapModule] constructed');
  }

  setPrivacyShow(hasShow: boolean, hasContainsPrivacy: boolean): void {
    ExpoGaodeMapModule.privacyStatus.hasShow = !!hasShow;
    ExpoGaodeMapModule.privacyStatus.hasContainsPrivacy = !!hasContainsPrivacy;
    ExpoGaodeMapModule.updatePrivacyReadyFlag();
    console.info(`[ExpoGaodeMapModule] setPrivacyShow show=${ExpoGaodeMapModule.privacyStatus.hasShow} contain=${ExpoGaodeMapModule.privacyStatus.hasContainsPrivacy}`);
  }

  setPrivacyAgree(hasAgree: boolean): void {
    ExpoGaodeMapModule.privacyStatus.hasAgree = !!hasAgree;
    if (hasAgree && ExpoGaodeMapModule.privacyStatus.privacyVersion) {
      ExpoGaodeMapModule.privacyStatus.agreedPrivacyVersion = ExpoGaodeMapModule.privacyStatus.privacyVersion;
    } else if (!hasAgree) {
      ExpoGaodeMapModule.privacyStatus.agreedPrivacyVersion = null;
    }
    ExpoGaodeMapModule.updatePrivacyReadyFlag();
    console.info(`[ExpoGaodeMapModule] setPrivacyAgree agree=${ExpoGaodeMapModule.privacyStatus.hasAgree}`);
  }

  setPrivacyVersion(version: string): void {
    ExpoGaodeMapModule.privacyStatus.privacyVersion = version || null;
  }

  resetPrivacyConsent(): void {
    ExpoGaodeMapModule.privacyStatus = { ...defaultPrivacyStatus };
    ExpoGaodeMapModule.sdkConfig = null;
  }

  getPrivacyStatus(): PrivacyStatus {
    return { ...ExpoGaodeMapModule.privacyStatus };
  }

  static getPrivacyStatusSnapshot(): PrivacyStatus {
    return { ...ExpoGaodeMapModule.privacyStatus };
  }

  initSDK(config: SDKConfig): void {
    ExpoGaodeMapModule.sdkConfig = { ...(config || {}) };
    const key = ExpoGaodeMapModule.getMapApiKey();
    console.info(`[ExpoGaodeMapModule] initSDK key=${key ? maskApiKey(key) : 'EMPTY'}`);
  }

  static getSDKConfig(): SDKConfig | null {
    const cfg = ExpoGaodeMapModule.sdkConfig;
    return cfg ? { ...cfg } : null;
  }

  static getMapApiKey(): string | undefined {
    const cfg = ExpoGaodeMapModule.sdkConfig;
    return cfg?.harmonyKey || cfg?.androidKey || cfg?.webKey || cfg?.iosKey;
  }

  private static updatePrivacyReadyFlag(): void {
    ExpoGaodeMapModule.privacyStatus.isReady =
      ExpoGaodeMapModule.privacyStatus.hasAgree &&
      ExpoGaodeMapModule.privacyStatus.hasShow &&
      ExpoGaodeMapModule.privacyStatus.hasContainsPrivacy;
  }

  isNativeSDKConfigured(): boolean {
    const cfg = ExpoGaodeMapModule.sdkConfig;
    return !!(cfg?.harmonyKey || cfg?.androidKey || cfg?.iosKey || cfg?.webKey);
  }

  setLoadWorldVectorMap(enabled: boolean): void {
    ExpoGaodeMapModule.loadWorldVectorMapEnabled = !!enabled;
  }

  static isLoadWorldVectorMapEnabled(): boolean {
    return ExpoGaodeMapModule.loadWorldVectorMapEnabled;
  }

  getVersion(): string {
    return 'harmony-0.1.0';
  }

  start(): void {}

  stop(): void {}

  isStarted(): boolean {
    return false;
  }

  private getUIAbilityContext(): common.UIAbilityContext | null {
    const uiAbilityContext = this.ctx.uiAbilityContext;
    if (!uiAbilityContext) {
      console.error('[ExpoGaodeMapModule] uiAbilityContext is missing, cannot request permission.');
      return null;
    }
    return uiAbilityContext;
  }

  private async getAccessTokenId(): Promise<number> {
    if (ExpoGaodeMapModule.accessTokenId > 0) {
      return ExpoGaodeMapModule.accessTokenId;
    }

    try {
      const bundleInfo = await bundleManager.getBundleInfoForSelf(
        bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_APPLICATION
      );
      const tokenId = bundleInfo.appInfo.accessTokenId;
      if (typeof tokenId === 'number' && tokenId > 0) {
        ExpoGaodeMapModule.accessTokenId = tokenId;
        return tokenId;
      }
    } catch (error) {
      console.error(`[ExpoGaodeMapModule] getAccessTokenId failed: ${JSON.stringify(error)}`);
    }

    return -1;
  }

  private async isPermissionGranted(permission: Permissions): Promise<boolean> {
    const tokenId = await this.getAccessTokenId();
    if (tokenId <= 0) {
      return false;
    }

    const atManager = abilityAccessCtrl.createAtManager();
    try {
      const grantStatus = await atManager.checkAccessToken(tokenId, permission);
      return grantStatus === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED;
    } catch (error) {
      console.error(`[ExpoGaodeMapModule] checkAccessToken failed: ${JSON.stringify(error)}`);
      return false;
    }
  }

  private toPermissionRecord(status: HarmonyPermissionStatus): Record<string, unknown> {
    return {
      granted: status.granted,
      status: status.status,
      canAskAgain: status.canAskAgain,
      isPermanentlyDenied: status.isPermanentlyDenied,
      backgroundLocation: status.backgroundLocation,
      fineLocation: status.fineLocation,
      coarseLocation: status.coarseLocation,
      shouldShowRationale: status.shouldShowRationale,
      message: status.message,
    };
  }

  private async buildLocationPermissionStatus(message?: string): Promise<HarmonyPermissionStatus> {
    const coarseLocation = await this.isPermissionGranted(LOCATION_PERMISSION_APPROXIMATE);
    const fineLocation = await this.isPermissionGranted(LOCATION_PERMISSION_PRECISE);
    const backgroundLocation = await this.isPermissionGranted(LOCATION_PERMISSION_BACKGROUND);
    const granted = coarseLocation || fineLocation;

    return {
      granted,
      status: granted ? 'granted' : 'denied',
      canAskAgain: true,
      isPermanentlyDenied: false,
      backgroundLocation,
      fineLocation,
      coarseLocation,
      shouldShowRationale: !granted,
      message,
    };
  }

  private async requestPermissions(permissions: Array<Permissions>): Promise<PermissionRequestResult | null> {
    const context = this.getUIAbilityContext();
    if (!context) {
      return null;
    }

    const atManager = abilityAccessCtrl.createAtManager();
    try {
      return await atManager.requestPermissionsFromUser(context, permissions);
    } catch (error) {
      console.error(`[ExpoGaodeMapModule] requestPermissionsFromUser failed: ${JSON.stringify(error)}`);
      return null;
    }
  }

  private isRequestGranted(result: PermissionRequestResult | null): boolean {
    if (!result) {
      return false;
    }
    const authResults = result.authResults;
    if (!authResults || authResults.length === 0) {
      return false;
    }
    for (let i = 0; i < authResults.length; i += 1) {
      if (authResults[i] !== abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED) {
        return false;
      }
    }
    return true;
  }

  async checkLocationPermission(): Promise<Record<string, unknown>> {
    const status = await this.buildLocationPermissionStatus();
    return this.toPermissionRecord(status);
  }

  async requestLocationPermission(): Promise<Record<string, unknown>> {
    const currentStatus = await this.buildLocationPermissionStatus();
    if (currentStatus.granted) {
      return this.toPermissionRecord(currentStatus);
    }

    const requestResult = await this.requestPermissions(LOCATION_FOREGROUND_PERMISSIONS);
    if (!this.isRequestGranted(requestResult)) {
      const deniedStatus = await this.buildLocationPermissionStatus('用户未授予定位权限');
      return this.toPermissionRecord(deniedStatus);
    }

    const latestStatus = await this.buildLocationPermissionStatus();
    return this.toPermissionRecord(latestStatus);
  }

  async requestBackgroundLocationPermission(): Promise<Record<string, unknown>> {
    const currentStatus = await this.buildLocationPermissionStatus();
    if (!currentStatus.granted) {
      currentStatus.message = '必须先授予前台定位权限';
      return this.toPermissionRecord(currentStatus);
    }

    if (currentStatus.backgroundLocation) {
      return this.toPermissionRecord(currentStatus);
    }

    const requestResult = await this.requestPermissions(LOCATION_BACKGROUND_PERMISSIONS);
    if (!this.isRequestGranted(requestResult)) {
      const deniedStatus = await this.buildLocationPermissionStatus('后台定位权限未授予');
      return this.toPermissionRecord(deniedStatus);
    }

    const latestStatus = await this.buildLocationPermissionStatus();
    return this.toPermissionRecord(latestStatus);
  }

  openAppSettings(): void {
    console.warn('[ExpoGaodeMapModule] openAppSettings is not implemented on Harmony yet.');
  }
}

export default ExpoGaodeMapModule;
