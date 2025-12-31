/**
 * 模块检测器 - 用于检测可选模块是否已安装
 */

/**
 * 可选模块名称常量
 */
export const OptionalModules = {
  SEARCH: 'expo-gaode-map-search',
  NAVIGATION: 'expo-gaode-map-navigation',
  ROUTE: 'expo-gaode-map-route',
  GEOCODER: 'expo-gaode-map-geocoder',
} as const;

/**
 * 延迟加载可选模块
 * 使用示例:
 * 
 * @example
 * ```typescript
 * import { OptionalModules, lazyLoad } from 'expo-gaode-map';
 * 
 * let SearchModule = null;
 * 
 * function loadSearch() {
 *   if (SearchModule == null) {
 *     try {
 *       SearchModule = require('expo-gaode-map-search');
 *     } catch (error) {
 *       console.warn('搜索模块未安装');
 *       return null;
 *     }
 *   }
 *   return SearchModule;
 * }
 * 
 * // 使用
 * const search = loadSearch();
 * if (search) {
 *   const results = await search.searchPOI({ keyword: '餐厅' });
 * }
 * ```
 */

/**
 * 检查必需模块,如果未安装则抛出错误
 * @param moduleName 模块名称
 * @param featureName 功能名称(用于错误提示)
 */
export function requireModule(moduleName: string, featureName: string): void {
  console.warn(
    `[expo-gaode-map] 使用 ${featureName} 需要安装 ${moduleName}。\n` +
    `请运行: npm install ${moduleName}\n` +
    `然后使用 try-catch 包裹 require('${moduleName}') 来加载`
  );
}

/**
 * 获取已安装的可选模块列表
 * 注意: 此函数无法在运行时准确检测,仅作为文档说明
 */
export function getInstalledModules(): string[] {
  console.warn(
    '[expo-gaode-map] getInstalledModules() 无法在运行时检测。\n' +
    '请在编译时检查 package.json 中安装的模块'
  );
  return [];
}

/**
 * 打印已安装模块信息(用于调试)
 */
export function printModuleInfo(): void {
  console.log('[expo-gaode-map] 核心模块: 已加载');
  console.log('[expo-gaode-map] 可选模块检测:');
  console.log('  - 使用 try-catch 包裹 require() 来检测可选模块');
  console.log('  - 可用的可选模块:');
  Object.entries(OptionalModules).forEach(([key, value]) => {
    console.log(`    - ${key}: ${value}`);
  });
}

/**
 * 创建延迟加载器
 * 
 * @example
 * ```typescript
 * import { createLazyLoader } from 'expo-gaode-map';
 * 
 * const loadSearch = createLazyLoader(() => require('expo-gaode-map-search'));
 * 
 * // 使用时
 * const SearchModule = loadSearch();
 * if (SearchModule) {
 *   const results = await SearchModule.searchPOI({ keyword: '餐厅' });
 * }
 * ```
 */
export function createLazyLoader<T>(loader: () => T): () => T | null {
  let cached: T | null = null;
  let attempted = false;

  return () => {
    if (!attempted) {
      attempted = true;
      try {
        cached = loader();
      } catch (error) {
        console.warn('[expo-gaode-map] 模块加载失败:');
        cached = null;
      }
    }
    return cached;
  };
}