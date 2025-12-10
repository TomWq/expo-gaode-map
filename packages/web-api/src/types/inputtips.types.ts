/**
 * 高德地图 Web API - 输入提示类型定义
 * API 文档: https://lbs.amap.com/api/webservice/guide/api/inputtips
 */

/**
 * 输入提示请求参数
 */
export interface InputTipsParams {
  /** 查询关键词 */
  keywords: string;
  
  /** POI 分类，多个类型用"|"分隔，可选值：POI 分类名称、分类代码 */
  type?: string;
  
  /** 坐标，格式："X,Y"（经度,纬度），建议使用此参数，可在此位置附近优先返回搜索关键词信息 */
  location?: string;
  
  /** 搜索城市，可选值：citycode、adcode，不支持县级市。如：010/110000 */
  city?: string;
  
  /** 仅返回指定城市数据，可选值：true/false */
  citylimit?: boolean;
  
  /**
   * 返回的数据类型，多种数据类型用"|"分隔
   * - all: 返回所有数据类型
   * - poi: 返回POI数据类型
   * - bus: 返回公交站点数据类型
   * - busline: 返回公交线路数据类型
   */
  datatype?: 'all' | 'poi' | 'bus' | 'busline' | string;
}

/**
 * 输入提示项
 */
export interface InputTip {
  /** 
   * 数据ID
   * - 若数据为 POI 类型，则返回 POI ID
   * - 若数据为 bus 类型，则返回 bus id
   * - 若数据为 busline 类型，则返回 busline id
   */
  id: string;
  
  /** tip 名称 */
  name: string;
  
  /** 所属区域（省+市+区，直辖市为"市+区"） */
  district: string;
  
  /** 区域编码（六位区县编码） */
  adcode: string;
  
  /** tip 中心点坐标，当搜索数据为 busline 类型时，此字段不返回 */
  location?: string;
  
  /** 详细地址 */
  address?: string;
  
  /** 
   * 数据类型
   * - poi: POI点
   * - bus: 公交站
   * - busline: 公交线路
   */
  typecode?: string;
}

/**
 * 输入提示响应结果
 */
export interface InputTipsResponse {
  /** 返回状态，1：成功；0：失败 */
  status: string;
  
  /** 返回的状态信息，status 为0时返回错误原因，否则返回"OK" */
  info: string;
  
  /** 返回结果总数目 */
  count: string;
  
  /** 建议提示列表 */
  tips: InputTip[];
}