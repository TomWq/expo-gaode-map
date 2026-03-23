describe('ExpoGaodeMapOfflineModule', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('应该通过代理绑定原生模块方法和属性', async () => {
    const nativeModule = {
      storagePath: '/tmp/offline',
      getStoragePath: jest.fn(function (this: { storagePath: string }) {
        return Promise.resolve(this.storagePath);
      }),
      setStoragePath: jest.fn(function (this: { storagePath: string }, path: string) {
        this.storagePath = path;
      }),
    };

    let offlineModule: any;

    jest.isolateModules(() => {
      jest.doMock('expo', () => ({
        NativeModule: class NativeModule {},
        requireNativeModule: jest.fn(() => nativeModule),
      }));

      offlineModule = require('../ExpoGaodeMapOfflineModule').default;
    });

    await expect(offlineModule.getStoragePath()).resolves.toBe('/tmp/offline');
    offlineModule.setStoragePath('/data/user/offline');
    await expect(offlineModule.getStoragePath()).resolves.toBe('/data/user/offline');
    expect(offlineModule.storagePath).toBe('/data/user/offline');
    expect(nativeModule.getStoragePath).toHaveBeenCalledTimes(2);
    expect(nativeModule.setStoragePath).toHaveBeenCalledWith('/data/user/offline');
  });
});
