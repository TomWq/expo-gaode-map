/**
 * 高德地图 Web API - POI 搜索类型定义
 * 
 * API 文档：https://lbs.amap.com/api/webservice/guide/api/search
 */

/**
 * POI 搜索参数
 */
export interface POISearchParams {
  /**
   * 查询关键字
   * 只支持一个关键字，文本总长度不可超过80字符
   * keywords 或 types 二选一必填
   */
  keywords?: string;
  
  /**
   * 指定地点类型
   * 可以传入多个 poi typecode，相互之间用"|"分隔
   * keywords 或 types 二选一必填
   */
  types?: string;
  
  /**
   * 搜索区划
   * 增加指定区域内数据召回权重
   * 可输入 citycode、adcode、cityname（仅支持城市级别和中文，如"北京市"）
   */
  region?: string;
  
  /**
   * 指定城市数据召回限制
   * true: 仅召回 region 对应区域内数据
   */
  city_limit?: boolean;
  
  /**
   * 返回结果控制
   * 用来筛选 response 结果中可选字段
   * 多个字段间采用","进行分割
   * 可选值：children, business, indoor, navi, photos
   */
  show_fields?: string;
  
  /**
   * 当前分页展示的数据条数
   * 取值范围：1-25
   */
  page_size?: number;
  
  /**
   * 请求第几分页
   */
  page_num?: number;
}

/**
 * 周边搜索参数
 */
export interface POIAroundParams {
  /**
   * 中心点坐标，格式：经度,纬度
   * 圆形区域检索中心点，不支持多个点
   * 经度和纬度用","分割，经度在前，纬度在后，经纬度小数点后不得超过6位
   */
  location: string;
  
  /**
   * 查询关键字
   * 只支持一个关键字，文本总长度不可超过80字符
   */
  keywords?: string;
  
  /**
   * 指定地点类型
   * 可以传入多个 poi typecode，相互之间用"|"分隔
   * 当 keywords 和 types 均为空时，默认指定 types 为 050000（餐饮服务）、070000（生活服务）、120000（商务住宅）
   */
  types?: string;
  
  /**
   * 搜索半径
   * 取值范围：0-50000，大于50000时按默认值，单位：米
   * @default 5000
   */
  radius?: number;
  
  /**
   * 排序规则
   * distance: 按距离排序
   * weight: 综合排序
   * @default 'distance'
   */
  sortrule?: 'distance' | 'weight';
  
  /**
   * 搜索区划
   * 增加指定区域内数据召回权重，如需严格限制召回数据在区域内，请搭配使用 city_limit 参数
   * 可输入行政区划名或对应 citycode 或 adcode
   */
  region?: string;
  
  /**
   * 指定城市数据召回限制
   * true: 仅召回 region 对应区域内数据
   * @default false
   */
  city_limit?: boolean;
  
  /**
   * 返回结果控制
   * 用来筛选 response 结果中可选字段
   * 多个字段间采用","进行分割
   * 可选值：children, business, indoor, navi, photos
   */
  show_fields?: string;
  
  /**
   * 当前分页展示的数据条数
   * 取值范围：1-25
   * @default 10
   */
  page_size?: number;
  
  /**
   * 请求第几分页
   * @default 1
   */
  page_num?: number;
}

/**
 * 多边形搜索参数
 */
export interface POIPolygonParams {
  /**
   * 多边形区域
   * 多个坐标对集合，坐标对用"|"分割
   * 多边形为矩形时，可传入左上右下两顶点坐标对
   * 其他情况下首尾坐标对需相同
   * 格式：经度1,纬度1|经度2,纬度2|...
   */
  polygon: string;
  
  /**
   * 查询关键字
   * 只支持一个关键字，文本总长度不可超过80字符
   */
  keywords?: string;
  
  /**
   * 指定地点类型
   * 可以传入多个 poi typecode，相互之间用"|"分隔
   * @default '120000（商务住宅）、150000（交通设施服务）'
   */
  types?: string;
  
  /**
   * 返回结果控制
   * 用来筛选 response 结果中可选字段
   * 多个字段间采用","进行分割
   * 可选值：children, business, indoor, navi, photos
   */
  show_fields?: string;
  
  /**
   * 当前分页展示的数据条数
   * 取值范围：1-25
   * @default 10
   */
  page_size?: number;
  
  /**
   * 请求第几分页
   * @default 1
   */
  page_num?: number;
}

/**
 * POI 详情
 */
export interface POIInfo {
  /** POI 全局唯一ID */
  id: string;
  
  /** POI 名称 */
  name: string;
  
  /** POI 类型 */
  type: string;
  
  /** POI 类型编码 */
  typecode: string;
  
  /** 地址 */
  address: string;
  
  /** 坐标，格式：经度,纬度 */
  location: string;
  
  /**
   * 离中心点距离，单位：米
   * 仅在周边搜索时返回
   */
  distance?: string;
  
  /**
   * 父级POI ID
   * 当前POI如果有父级（如建筑物内的商铺），则返回父级POI ID
   */
  parent?: string;
  
  /** POI 所在省份名称 */
  pname?: string;
  
  /** POI 所在城市名称 */
  cityname?: string;
  
  /** POI 所在区县名称 */
  adname?: string;
  
  /** 省份编码 */
  pcode?: string;
  
  /** 区域编码 */
  adcode?: string;
  
  /** 城市编码 */
  citycode?: string;
  
  /**
   * 子POI信息
   * 需要在 show_fields 中指定 "children" 才会返回
   */
  children?: Array<{
    id: string;
    name: string;
    location: string;
    address: string;
    subtype: string;
    typecode: string;
    sname: string;
  }>;
  
  /**
   * 商业信息
   * 需要在 show_fields 中指定 "business" 才会返回
   */
  business?: {
    /** POI 所属商圈 */
    business_area?: string;
    /** 今日营业时间 */
    opentime_today?: string;
    /** 营业时间描述 */
    opentime_week?: string;
    /** 联系电话 */
    tel?: string;
    /** 特色内容 */
    tag?: string;
    /** 评分（餐饮、酒店、景点、影院类POI） */
    rating?: string;
    /** 人均消费（餐饮、酒店、景点、影院类POI） */
    cost?: string;
    /** 停车场类型（地下、地面、路边） */
    parking_type?: string;
    /** POI 的别名 */
    alias?: string;
    /** POI 标识 */
    keytag?: string;
    /** 用于再次确认信息类型 */
    rectag?: string;
  };
  
  /**
   * 室内相关信息
   * 需要在 show_fields 中指定 "indoor" 才会返回
   */
  indoor?: {
    /** 是否有室内地图标志，1为有，0为没有 */
    indoor_map?: string;
    /** 如果当前POI为建筑物类POI，则cpid为自身POI ID；如果为商铺类POI，则cpid为其所在建筑物的POI ID */
    cpid?: string;
    /** 楼层索引 */
    floor?: string;
    /** 所在楼层 */
    truefloor?: string;
  };
  
  /**
   * 导航位置相关信息
   * 需要在 show_fields 中指定 "navi" 才会返回
   */
  navi?: {
    /** POI 对应的导航引导点坐标 */
    navi_poiid?: string;
    /** POI 的入口经纬度坐标 */
    entr_location?: string;
    /** POI 的出口经纬度坐标 */
    exit_location?: string;
    /** POI 的地理格 id */
    gridcode?: string;
  };
  
  /**
   * 照片信息
   * 需要在 show_fields 中指定 "photos" 才会返回
   */
  photos?: Array<{
    /** POI 的图片介绍 */
    title: string;
    /** POI 图片的下载链接 */
    url: string;
  }>;
}

/**
 * POI 搜索响应
 */
export interface POISearchResponse {
  /** 返回状态 */
  status: string;
  
  /** 返回的状态信息 */
  info: string;
  
  /** 状态码 */
  infocode: string;
  
  /** 搜索结果总数 */
  count: string;
  
  /** POI 列表 */
  pois: POIInfo[];
  
  /** 
   * 搜索建议
   * 当查询无结果时返回
   */
  suggestion?: {
    keywords: string[];
    cities: Array<{
      name: string;
      num: string;
      citycode: string;
      adcode: string;
    }>;
  };
}

/**
 * POI ID 查询参数（详情查询）
 */
export interface POIDetailParams {
  /**
   * POI 唯一标识
   * 最多可以传入10个 id，多个 id 之间用"|"分隔
   */
  id: string;
  
  /**
   * 返回结果控制
   * 用来筛选 response 结果中可选字段
   * 多个字段间采用","进行分割
   * 可选值：children, business, indoor, navi, photos
   */
  show_fields?: string;
}