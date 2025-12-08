/**
 * 高德地图 Web API - 地理编码类型定义
 */

/**
 * 逆地理编码请求参数
 */
export interface RegeocodeParams {
  /** 经纬度坐标，格式：经度,纬度 */
  location: string;
  /**
   * 返回附近POI类型
   * 以下内容需要 extensions=all 时才生效
   * 支持传入POI TYPECODE及名称；支持传入多个POI类型，多值间用"|"分隔
   * 可以参考POI分类码表
   */
  poitype?: string;
  /**
   * 搜索半径，默认1000米
   * radius取值范围在0-3000，单位：米
   */
  radius?: number;
  /**
   * 返回结果控制
   * base: 返回基本地址信息
   * all: 返回地址信息及附近POI、道路、道路交叉口信息
   * @default 'base'
   */
  extensions?: 'base' | 'all';
  /**
   * 道路等级
   * 以下内容需要 extensions=all 时才生效
   * 可选值：0，1
   * 当roadlevel=0时，显示所有道路
   * 当roadlevel=1时，过滤非主干道路，仅输出主干道路数据
   */
  roadlevel?: 0 | 1;
  /**
   * 批量查询控制
   * batch=true时进行批量查询操作
   */
  batch?: boolean;
  /**
   * 是否优化POI返回顺序
   * 以下内容需要 extensions=all 时才生效
   * 0：不对召回的排序策略进行干扰
   * 1：综合大数据分析将居家相关的POI内容优先返回
   * 2：综合大数据分析将公司相关的POI内容优先返回
   */
  homeorcorp?: 0 | 1 | 2;
  /**
   * 数字签名
   * 可选，用于数字签名验证
   */
  sig?: string;
  /**
   * 返回数据格式类型
   * 可选值：JSON，XML
   * @default 'JSON'
   */
  output?: 'JSON' | 'XML' | 'json' | 'xml';
  /**
   * 回调函数
   * 此参数只在output参数设置为JSON时有效
   */
  callback?: string;
}

/**
 * 地址组成元素
 */
export interface AddressComponent {
  /** 坐标点所在国家名称，例如：中国 */
  country: string;
  /** 坐标点所在省名称，例如：北京市 */
  province: string;
  /**
   * 坐标点所在城市名称，例如：北京市
   * 注意：当城市是省直辖县时返回为空，以及城市为北京、上海、天津、重庆四个直辖市时，该字段返回为空
   */
  city: string | string[];
  /** 城市编码，例如：010 */
  citycode: string;
  /** 坐标点所在区，例如：海淀区 */
  district: string;
  /** 行政区编码，例如：110108 */
  adcode: string;
  /** 坐标点所在乡镇/街道（此街道为社区街道，不是道路信息），例如：燕园街道 */
  township: string;
  /** 乡镇街道编码，例如：110101001000 */
  towncode: string;
  /** 街道，例如：中关村北二条 */
  street: string;
  /** 门牌号，例如：3号 */
  number: string;
  /** 所属海域信息，例如：渤海 */
  seaArea?: string;
  /** 社区信息 */
  neighborhood: {
    /** 社区名称，例如：北京大学 */
    name: string;
    /** POI类型，例如：科教文化服务;学校;高等院校 */
    type: string;
  };
  /** 楼信息 */
  building: {
    /** 建筑名称，例如：万达广场 */
    name: string;
    /** 类型，例如：科教文化服务;学校;高等院校 */
    type: string;
  };
  /** 门牌信息 */
  streetNumber: {
    /** 街道名称，例如：中关村北二条 */
    street: string;
    /** 门牌号，例如：3号 */
    number: string;
    /** 坐标点：经度，纬度 */
    location: string;
    /** 方向：坐标点所处街道方位 */
    direction: string;
    /** 门牌地址到请求坐标的距离，单位：米 */
    distance: string;
  };
  /** 经纬度所属商圈列表 */
  businessAreas: Array<{
    /** 商圈中心点经纬度 */
    location: string;
    /** 商圈名称，例如：颐和园 */
    name: string;
    /** 商圈所在区域的adcode，例如：朝阳区/海淀区 */
    id: string;
  }>;
}

/**
 * 道路信息
 */
export interface Road {
  /** 道路id */
  id: string;
  /** 道路名称，例如：北四环西路辅路 */
  name: string;
  /** 道路到请求坐标的距离，单位：米 */
  distance: string;
  /** 方位，输入点相对于道路的方位，例如：南 */
  direction: string;
  /** 坐标点：经度，纬度 */
  location: string;
}

/**
 * 道路交叉口
 */
export interface Roadinter {
  /** 第一条道路id */
  first_id: string;
  /** 第一条道路名称，例如：北四环西路辅路 */
  first_name: string;
  /** 第二条道路id */
  second_id: string;
  /** 第二条道路名称，例如：中关村北大街 */
  second_name: string;
  /** 交叉路口到请求坐标的距离，单位：米 */
  distance: string;
  /** 方位，输入点相对于交叉路口的方位，例如：东南 */
  direction: string;
  /** 坐标点：经度，纬度 */
  location: string;
}

/**
 * POI 信息（兴趣点）
 */
export interface POI {
  /** POI的id */
  id: string;
  /** POI名称，例如：北京大学 */
  name: string;
  /** POI类型，例如：科教文化服务;学校;高等院校 */
  type: string;
  /** 电话 */
  tel: string;
  /** POI到请求坐标的距离，单位：米 */
  distance: string;
  /** 方位，输入点相对于POI的方位，例如：东北 */
  direction: string;
  /** POI地址信息 */
  address: string;
  /** 坐标点：经度，纬度 */
  location: string;
  /** 商圈名称，例如：中关村 */
  businessarea: string;
}

/**
 * AOI 信息（Area of Interest - 面状地物）
 * AOI 是一个具有明确边界的区域，通常是商圈、景区等
 */
export interface AOI {
  /** AOI的id */
  id: string;
  /** AOI名称，例如：北京大学 */
  name: string;
  /** 所属adcode，例如：110108 */
  adcode: string;
  /** AOI中心点坐标：经度，纬度 */
  location: string;
  /** 面积，单位：平方米 */
  area: string;
  /**
   * 距离，单位：米
   * 0 表示在AOI内，其他值表示距离AOI的距离
   */
  distance: string;
  /** AOI类型，例如：110101（科教文化类） */
  type: string;
}

/**
 * 逆地理编码结果
 */
export interface Regeocode {
  /** 结构化地址信息 */
  formatted_address: string;
  /** 地址组成元素 */
  addressComponent: AddressComponent;
  /** 道路信息列表 */
  roads?: Road[];
  /** 道路交叉口列表 */
  roadinters?: Roadinter[];
  /** POI信息列表 */
  pois?: POI[];
  /** AOI信息列表 */
  aois?: AOI[];
}

/**
 * 逆地理编码响应结果
 */
export interface RegeocodeResponse {
  /** 状态码：1-成功，0-失败 */
  status: string;
  /** 状态说明 */
  info: string;
  /** 状态码说明 */
  infocode: string;
  /** 逆地理编码结果 */
  regeocode: Regeocode;
}

/**
 * 地理编码请求参数
 */
export interface GeocodeParams {
  /**
   * 结构化地址信息
   * 规则：结构化地址，如：北京市朝阳区阜通东大街6号
   * 注意：地址信息越完整，解析精度越高
   */
  address: string;
  /**
   * 指定查询的城市
   * 可选值：城市中文、中文全拼、citycode、adcode
   * 例如：北京市/beijing/010/110000
   * 注意：当城市为北京、上海、天津、重庆时，可以不用传此参数
   */
  city?: string;
  /**
   * 批量查询控制
   * batch=true时进行批量查询操作
   * 注意：批量查询时，address可传入多个地址，用"|"分割，最多支持10个
   */
  batch?: boolean;
  /**
   * 数字签名
   * 若用户申请的key为签名校验型key，则需要传递此参数
   */
  sig?: string;
  /**
   * 返回数据格式类型
   * 可选值：JSON、XML
   * @default 'JSON'
   */
  output?: 'JSON' | 'XML';
  /**
   * 回调函数
   * callback值是用户定义的函数名称，此参数只在output参数设置为JSON时有效
   */
  callback?: string;
}

/**
 * 地理编码结果
 */
export interface Geocode {
  /** 结构化地址信息 */
  formatted_address: string;
  /** 所属国家 */
  country: string;
  /** 地址所在的省份名 */
  province: string;
  /** 地址所在的城市名 */
  city: string;
  /** 城市编码 */
  citycode: string;
  /** 地址所在的区 */
  district: string;
  /** 区域编码 */
  adcode: string;
  /** 乡镇 */
  township: string;
  /** 街道 */
  street: string;
  /** 门牌 */
  number: string;
  /** 坐标点，经度,纬度 */
  location: string;
  /** 匹配级别 */
  level: string;
}

/**
 * 地理编码响应结果
 */
export interface GeocodeResponse {
  /** 状态码：1-成功，0-失败 */
  status: string;
  /** 状态说明 */
  info: string;
  /** 状态码说明 */
  infocode: string;
  /** 地理编码结果个数 */
  count: string;
  /** 地理编码结果列表 */
  geocodes: Geocode[];
}