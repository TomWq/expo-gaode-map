describe('OfflineMapManager', () => {
  const createMockOfflineModule = () => ({
    getAvailableCities: jest.fn(async () => [{ cityCode: '010', cityName: '北京' }]),
    getAvailableProvinces: jest.fn(async () => [{ cityCode: '110000', cityName: '北京市' }]),
    getCitiesByProvince: jest.fn(async () => [{ cityCode: '010', cityName: '北京' }]),
    getDownloadedMaps: jest.fn(async () => [{ cityCode: '010', cityName: '北京' }]),
    startDownload: jest.fn(async () => undefined),
    pauseDownload: jest.fn(async () => undefined),
    resumeDownload: jest.fn(async () => undefined),
    cancelDownload: jest.fn(async () => undefined),
    deleteMap: jest.fn(async () => undefined),
    updateMap: jest.fn(async () => undefined),
    checkUpdate: jest.fn(async () => true),
    isMapDownloaded: jest.fn(async () => true),
    getMapStatus: jest.fn(async () => ({
      cityCode: '010',
      cityName: '北京',
      size: 1,
      status: 'downloaded',
      progress: 100,
      version: '1.0.0',
    })),
    getTotalProgress: jest.fn(async () => 88),
    getDownloadingCities: jest.fn(async () => ['010']),
    getStorageSize: jest.fn(async () => 1024),
    getStorageInfo: jest.fn(async () => ({
      totalSpace: 1000,
      usedSpace: 100,
      availableSpace: 900,
      offlineMapSize: 50,
    })),
    clearAllMaps: jest.fn(async () => undefined),
    setStoragePath: jest.fn(),
    getStoragePath: jest.fn(async () => '/tmp/offline'),
    batchDownload: jest.fn(async () => undefined),
    batchDelete: jest.fn(async () => undefined),
    batchUpdate: jest.fn(async () => undefined),
    pauseAllDownloads: jest.fn(async () => undefined),
    resumeAllDownloads: jest.fn(async () => undefined),
    addListener: jest.fn((_event, listener) => ({ remove: jest.fn(), listener })),
    removeAllListeners: jest.fn(),
  });

  const loadManager = () => {
    jest.resetModules();
    const mockOfflineModule = createMockOfflineModule();
    let OfflineMapManager: typeof import('../OfflineMapManager').default;

    jest.isolateModules(() => {
      jest.doMock('../../ExpoGaodeMapOfflineModule', () => ({
        __esModule: true,
        default: mockOfflineModule,
      }));

      OfflineMapManager = require('../OfflineMapManager').default;
    });

    return { OfflineMapManager: OfflineMapManager!, mockOfflineModule };
  };

  it('应该转发地图列表和状态相关方法', async () => {
    const { OfflineMapManager, mockOfflineModule } = loadManager();

    await expect(OfflineMapManager.getAvailableCities()).resolves.toEqual([
      { cityCode: '010', cityName: '北京' },
    ]);
    await OfflineMapManager.getAvailableProvinces();
    await OfflineMapManager.getCitiesByProvince('110000');
    await OfflineMapManager.getDownloadedMaps();
    await OfflineMapManager.checkUpdate('010');
    await OfflineMapManager.isMapDownloaded('010');
    await OfflineMapManager.getMapStatus('010');
    await OfflineMapManager.getTotalProgress();
    await OfflineMapManager.getDownloadingCities();
    await OfflineMapManager.getStorageSize();
    await OfflineMapManager.getStorageInfo();
    await OfflineMapManager.getStoragePath();

    expect(mockOfflineModule.getCitiesByProvince).toHaveBeenCalledWith('110000');
    expect(mockOfflineModule.checkUpdate).toHaveBeenCalledWith('010');
    expect(mockOfflineModule.getStoragePath).toHaveBeenCalled();
  });

  it('应该转发下载和批量操作方法', async () => {
    const { OfflineMapManager, mockOfflineModule } = loadManager();

    await OfflineMapManager.startDownload({ cityCode: '010', allowCellular: true });
    await OfflineMapManager.pauseDownload('010');
    await OfflineMapManager.resumeDownload('010');
    await OfflineMapManager.cancelDownload('010');
    await OfflineMapManager.deleteMap('010');
    await OfflineMapManager.updateMap('010');
    await OfflineMapManager.clearAllMaps();
    OfflineMapManager.setStoragePath('/tmp/offline');
    await OfflineMapManager.batchDownload(['010'], true);
    await OfflineMapManager.batchDelete(['010']);
    await OfflineMapManager.batchUpdate(['010']);
    await OfflineMapManager.pauseAllDownloads();
    await OfflineMapManager.resumeAllDownloads();

    expect(mockOfflineModule.startDownload).toHaveBeenCalledWith({
      cityCode: '010',
      allowCellular: true,
    });
    expect(mockOfflineModule.setStoragePath).toHaveBeenCalledWith('/tmp/offline');
    expect(mockOfflineModule.batchDownload).toHaveBeenCalledWith(['010'], true);
  });

  it('应该转发事件监听与移除逻辑', () => {
    const { OfflineMapManager, mockOfflineModule } = loadManager();

    const progressSub = OfflineMapManager.addDownloadProgressListener(jest.fn());
    const completeSub = OfflineMapManager.addDownloadCompleteListener(jest.fn());
    const errorSub = OfflineMapManager.addDownloadErrorListener(jest.fn());
    const pausedSub = OfflineMapManager.addDownloadPausedListener(jest.fn());
    const cancelledSub = OfflineMapManager.addDownloadCancelledListener(jest.fn());

    expect(progressSub.remove).toBeDefined();
    expect(completeSub.remove).toBeDefined();
    expect(errorSub.remove).toBeDefined();
    expect(pausedSub.remove).toBeDefined();
    expect(cancelledSub.remove).toBeDefined();
    expect(mockOfflineModule.addListener).toHaveBeenCalledTimes(5);

    OfflineMapManager.removeAllListeners();

    expect(mockOfflineModule.removeAllListeners).toHaveBeenCalledWith('onDownloadProgress');
    expect(mockOfflineModule.removeAllListeners).toHaveBeenCalledWith('onDownloadComplete');
    expect(mockOfflineModule.removeAllListeners).toHaveBeenCalledWith('onDownloadError');
    expect(mockOfflineModule.removeAllListeners).toHaveBeenCalledWith('onDownloadPaused');
    expect(mockOfflineModule.removeAllListeners).toHaveBeenCalledWith('onDownloadCancelled');
  });
});
