let mockRuntime;

const mockNativeGetPoiDetail = jest.fn(async (id) => ({
  id,
  name: 'native-poi',
  address: 'native-address',
  location: { latitude: 39.9, longitude: 116.4 },
  typeCode: '050000',
  typeDes: '餐饮',
}));

jest.mock('../v3/runtime-factories', () => ({
  createNativeSearchCapabilityAdapter: jest.fn(),
  createNativeSearchRuntime: jest.fn(() => mockRuntime),
}));

jest.mock('../ExpoGaodeMapSearchModule', () => ({
  __esModule: true,
  default: {
    initSearch: jest.fn(),
    getPoiDetail: mockNativeGetPoiDetail,
  },
}));

describe('search legacy compatibility layer', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockRuntime = {
      search: {
        searchKeyword: jest.fn(async () => ({
          items: [
            {
              id: '1',
              name: 'coffee',
              address: 'beijing',
              location: { latitude: 39.9, longitude: 116.4 },
              typeCode: '050000',
              typeName: '餐饮',
              source: 'native',
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
          raw: {},
        })),
        searchNearby: jest.fn(async () => ({
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          raw: {},
        })),
        searchAlong: jest.fn(async () => ({
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          raw: {},
        })),
        searchPolygon: jest.fn(async () => ({
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          raw: {},
        })),
        getInputTips: jest.fn(async () => ({
          items: [
            {
              id: 'tip-1',
              name: 'coffee-tip',
              address: 'beijing',
              location: { latitude: 39.9, longitude: 116.4 },
              cityName: '北京',
              districtName: '朝阳',
              source: 'native',
            },
          ],
          total: 1,
          page: null,
          pageSize: null,
          raw: {},
        })),
        getPoiDetail: jest.fn(async () => null),
      },
      geocode: {
        reverseGeocode: jest.fn(async () => ({
          formattedAddress: '北京市朝阳区',
          location: { latitude: 39.9, longitude: 116.4 },
          pois: [],
          raw: {},
        })),
      },
    };
  });

  it('searchPOI 应通过 v3 runtime 转发并保持 legacy 结果形状', async () => {
    const { searchPOI } = require('../index');

    const result = await searchPOI({
      keyword: 'coffee',
      city: '北京',
      pageNum: 2,
      pageSize: 10,
    });

    expect(mockRuntime.search.searchKeyword).toHaveBeenCalledWith({
      keyword: 'coffee',
      city: '北京',
      types: undefined,
      page: 2,
      pageSize: 10,
      location: undefined,
    });
    expect(result.total).toBe(1);
    expect(result.pageNum).toBe(1);
    expect(result.pageCount).toBe(1);
    expect(result.pois[0].typeDes).toBe('餐饮');
  });

  it('getInputTips 应通过 v3 runtime 转发并映射 legacy 提示结构', async () => {
    const { getInputTips } = require('../index');

    const result = await getInputTips({
      keyword: 'coffee',
      city: '北京',
    });

    expect(mockRuntime.search.getInputTips).toHaveBeenCalledWith({
      keyword: 'coffee',
      city: '北京',
      types: undefined,
    });
    expect(result.tips).toHaveLength(1);
    expect(result.tips[0].name).toBe('coffee-tip');
  });

  it('getPoiDetail 在 runtime 返回空时应回退到原生模块', async () => {
    const { getPoiDetail } = require('../index');

    const result = await getPoiDetail('poi-1');

    expect(mockRuntime.search.getPoiDetail).toHaveBeenCalledWith('poi-1');
    expect(mockNativeGetPoiDetail).toHaveBeenCalledWith('poi-1');
    expect(result.name).toBe('native-poi');
  });

  it('default export 应保持 legacy 兼容对象', () => {
    const exports = require('../index');
    expect(exports.default).toBe(exports.LegacySearch);
    expect(typeof exports.default.searchPOI).toBe('function');
  });

  it('主入口与 legacy 子路径导出契约应保持一致', () => {
    const mainExports = require('../index');
    const legacyExports = require('../legacy');

    expect(mainExports.V3Search).toBeDefined();
    expect(typeof mainExports.V3Search.createNativeSearchRuntime).toBe('function');
    expect(legacyExports.default).toBe(mainExports.LegacySearch);
    expect(legacyExports.searchPOI).toBe(mainExports.searchPOI);
    expect(legacyExports.getInputTips).toBe(mainExports.getInputTips);
  });
});
