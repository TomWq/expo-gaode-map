/**
 * ModuleLoader 工具测试
 * 测试模块加载器的核心功能
 */

import {
  OptionalModules,
  requireModule,
  getInstalledModules,
  printModuleInfo,
  createLazyLoader,
} from '../ModuleLoader';

describe('ModuleLoader', () => {
  // 保存原始的 console 方法
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('OptionalModules 常量', () => {
    it('应该定义所有可选模块', () => {
      expect(OptionalModules.SEARCH).toBe('expo-gaode-map-search');
      expect(OptionalModules.NAVIGATION).toBe('expo-gaode-map-navigation');
      expect(OptionalModules.ROUTE).toBe('expo-gaode-map-route');
      expect(OptionalModules.GEOCODER).toBe('expo-gaode-map-geocoder');
    });

    it('常量对象应该存在', () => {
      // TypeScript 的 as const 在运行时不会真正阻止赋值
      // 这里只验证对象存在且有正确的属性
      expect(Object.keys(OptionalModules).length).toBeGreaterThan(0);
    });
  });

  describe('requireModule', () => {
    it('应该打印警告信息', () => {
      requireModule('test-module', '测试功能');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-module')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('测试功能')
      );
    });

    it('应该包含安装指令', () => {
      requireModule('expo-gaode-map-search', '搜索');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('npm install expo-gaode-map-search')
      );
    });
  });

  describe('getInstalledModules', () => {
    it('应该返回空数组', () => {
      const modules = getInstalledModules();
      expect(modules).toEqual([]);
    });

    it('应该打印警告信息', () => {
      getInstalledModules();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('printModuleInfo', () => {
    it('应该打印模块信息', () => {
      printModuleInfo();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('核心模块')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('可选模块')
      );
    });

    it('应该打印所有可选模块名称', () => {
      printModuleInfo();
      
      // 检查是否调用了 console.log
      expect(consoleLogSpy).toHaveBeenCalled();
      
      // 获取所有调用的参数
      const allCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const allOutput = allCalls.join('\n');
      
      // 验证输出包含模块名称
      expect(allOutput).toContain('SEARCH');
      expect(allOutput).toContain('NAVIGATION');
    });
  });

  describe('createLazyLoader', () => {
    it('应该创建延迟加载器', () => {
      const mockModule = { test: 'value' };
      const loader = createLazyLoader(() => mockModule);
      
      expect(typeof loader).toBe('function');
    });

    it('应该缓存加载的模块', () => {
      let callCount = 0;
      const mockModule = { test: 'value' };
      const loader = createLazyLoader(() => {
        callCount++;
        return mockModule;
      });
      
      const result1 = loader();
      const result2 = loader();
      const result3 = loader();
      
      expect(callCount).toBe(1); // 只调用一次
      expect(result1).toBe(mockModule);
      expect(result2).toBe(mockModule);
      expect(result3).toBe(mockModule);
    });

    it('加载失败时应该返回 null', () => {
      const loader = createLazyLoader(() => {
        throw new Error('Module not found');
      });
      
      const result = loader();
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('加载失败后应该缓存 null 结果', () => {
      let callCount = 0;
      const loader = createLazyLoader(() => {
        callCount++;
        throw new Error('Module not found');
      });
      
      const result1 = loader();
      const result2 = loader();
      
      expect(callCount).toBe(1); // 只尝试一次
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('应该支持不同类型的模块', () => {
      const stringLoader = createLazyLoader(() => 'string module');
      const numberLoader = createLazyLoader(() => 42);
      const objectLoader = createLazyLoader(() => ({ key: 'value' }));
      
      expect(stringLoader()).toBe('string module');
      expect(numberLoader()).toBe(42);
      expect(objectLoader()).toEqual({ key: 'value' });
    });
  });

  describe('并发场景', () => {
    it('多次调用 createLazyLoader 应该创建独立的加载器', () => {
      const loader1 = createLazyLoader(() => ({ id: 1 }));
      const loader2 = createLazyLoader(() => ({ id: 2 }));
      
      const result1 = loader1();
      const result2 = loader2();
      
      expect(result1).toEqual({ id: 1 });
      expect(result2).toEqual({ id: 2 });
      expect(result1).not.toBe(result2);
    });
  });

  describe('错误处理', () => {
    it('应该捕获并记录加载错误', () => {
      const errorMessage = 'Custom error message';
      const loader = createLazyLoader(() => {
        throw new Error(errorMessage);
      });
      
      expect(() => loader()).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('模块加载失败'),
        expect.any(Error)
      );
    });
  });
});