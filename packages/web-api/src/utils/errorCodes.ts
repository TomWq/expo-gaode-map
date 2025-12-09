
/**
 * 高德地图 Web API 错误码定义
 * 文档: https://lbs.amap.com/api/webservice/guide/tools/info
 */

/**
 * 错误码类型
 */
export type InfoCode = 
  // 成功
  | '10000'
  // Key相关错误 (100xx)
  | '10001' | '10002' | '10003' | '10004' | '10005' | '10006' | '10007' | '10008'
  | '10009' | '10010' | '10011' | '10012' | '10013' | '10014' | '10015' | '10016'
  | '10017' | '10019' | '10020' | '10021' | '10026' | '10029' | '10041' | '10044'
  | '10045'
  // 请求参数错误 (200xx)
  | '20000' | '20001' | '20002' | '20003' | '20011' | '20012'
  // 路径规划错误 (208xx)
  | '20800' | '20801' | '20802' | '20803'
  // 服务响应错误 (300xx, 320xx, 322xx)
  | '30001' | '30002' | '30003' | '32000' | '32001' | '32002' | '32003'
  | '32200' | '32201' | '32202' | '32203'
  // 配额相关错误 (400xx)
  | '40000' | '40001' | '40002' | '40003';

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  /** 错误码 */
  code: InfoCode;
  /** 官方错误信息 */
  message: string;
  /** 友好的中文描述 */
  description: string;
  /** 问题排查建议 */
  suggestion: string;
  /** 错误类型 */
  type: 'success' | 'key_error' | 'param_error' | 'route_error' | 'service_error' | 'quota_error';
}

/**
 * 高德地图 Web API 错误码映射表
 */
export const ERROR_CODE_MAP: Record<InfoCode, ErrorInfo> = {
  // 成功
  '10000': {
    code: '10000',
    message: 'OK',
    description: '请求正常',
    suggestion: '请求成功',
    type: 'success',
  },

  // Key相关错误
  '10001': {
    code: '10001',
    message: 'INVALID_USER_KEY',
    description: 'Key不正确或过期',
    suggestion: '请检查您的 API Key 是否正确，或前往控制台查看 Key 是否已过期',
    type: 'key_error',
  },
  '10002': {
    code: '10002',
    message: 'SERVICE_NOT_AVAILABLE',
    description: '没有权限使用相应的服务或请求接口路径拼写错误',
    suggestion: '1. 检查 Key 是否有权限使用该服务\n2. 检查请求接口路径是否正确',
    type: 'key_error',
  },
  '10003': {
    code: '10003',
    message: 'DAILY_QUERY_OVER_LIMIT',
    description: '访问已超出日访问量',
    suggestion: '日访问量已超限，系统已自动封停，第二天 0:00 会自动解封',
    type: 'key_error',
  },
  '10004': {
    code: '10004',
    message: 'ACCESS_TOO_FREQUENT',
    description: '单位时间内访问过于频繁',
    suggestion: '单位时间内（1分钟）访问量超限，请降低请求频率，下一分钟自动解封',
    type: 'key_error',
  },
  '10005': {
    code: '10005',
    message: 'INVALID_USER_IP',
    description: 'IP白名单出错，发送请求的服务器IP不在白名单内',
    suggestion: '请在控制台检查并设置正确的 IP 白名单',
    type: 'key_error',
  },
  '10006': {
    code: '10006',
    message: 'INVALID_USER_DOMAIN',
    description: '绑定域名无效',
    suggestion: '请在控制台重新设置绑定域名',
    type: 'key_error',
  },
  '10007': {
    code: '10007',
    message: 'INVALID_USER_SIGNATURE',
    description: '数字签名未通过验证',
    suggestion: '请检查数字签名生成算法是否正确',
    type: 'key_error',
  },
  '10008': {
    code: '10008',
    message: 'INVALID_USER_SCODE',
    description: 'MD5安全码未通过验证',
    suggestion: '请检查 Key 绑定的 SHA1 和 package 是否与 SDK 包一致',
    type: 'key_error',
  },
  '10009': {
    code: '10009',
    message: 'USERKEY_PLAT_NOMATCH',
    description: '请求Key与绑定平台不符',
    suggestion: '请使用对应平台的 Key（如：Web 服务 Key、JS API Key 等）',
    type: 'key_error',
  },
  '10010': {
    code: '10010',
    message: 'IP_QUERY_OVER_LIMIT',
    description: 'IP访问超限',
    suggestion: '单个 IP 访问次数超限已被封停，请提交工单联系客服',
    type: 'key_error',
  },
  '10011': {
    code: '10011',
    message: 'NOT_SUPPORT_HTTPS',
    description: '服务不支持HTTPS请求',
    suggestion: '该服务暂不支持 HTTPS，请使用 HTTP 或提交工单申请支持',
    type: 'key_error',
  },
  '10012': {
    code: '10012',
    message: 'INSUFFICIENT_PRIVILEGES',
    description: '权限不足，服务请求被拒绝',
    suggestion: '您的 Key 没有权限访问该服务，请在控制台开通相应服务',
    type: 'key_error',
  },
  '10013': {
    code: '10013',
    message: 'USER_KEY_RECYCLED',
    description: 'Key被删除',
    suggestion: 'Key 已被删除无法使用，请使用有效的 Key',
    type: 'key_error',
  },
  '10014': {
    code: '10014',
    message: 'QPS_HAS_EXCEEDED_THE_LIMIT',
    description: '云图服务QPS超限',
    suggestion: 'QPS 超出限制，请降低请求频率或在控制台提工单',
    type: 'key_error',
  },
  '10015': {
    code: '10015',
    message: 'GATEWAY_TIMEOUT',
    description: '受单机QPS限流限制',
    suggestion: '建议降低请求的 QPS 或提工单联系客服',
    type: 'key_error',
  },
  '10016': {
    code: '10016',
    message: 'SERVER_IS_BUSY',
    description: '服务器负载过高',
    suggestion: '服务器繁忙，请稍后重试',
    type: 'key_error',
  },
  '10017': {
    code: '10017',
    message: 'RESOURCE_UNAVAILABLE',
    description: '所请求的资源不可用',
    suggestion: '请求的资源暂时不可用，请稍后重试',
    type: 'key_error',
  },
  '10019': {
    code: '10019',
    message: 'CQPS_HAS_EXCEEDED_THE_LIMIT',
    description: '使用的某个服务总QPS超限',
    suggestion: 'QPS 超出限制，请降低请求频率',
    type: 'key_error',
  },
  '10020': {
    code: '10020',
    message: 'CKQPS_HAS_EXCEEDED_THE_LIMIT',
    description: '某个Key使用某个服务接口QPS超出限制',
    suggestion: 'QPS 超出限制，请降低该 Key 的请求频率',
    type: 'key_error',
  },
  '10021': {
    code: '10021',
    message: 'CUQPS_HAS_EXCEEDED_THE_LIMIT',
    description: '账号使用某个服务接口QPS超出限制',
    suggestion: 'QPS 超出限制，请降低账号的请求频率',
    type: 'key_error',
  },
  '10026': {
    code: '10026',
    message: 'INVALID_REQUEST',
    description: '账号处于被封禁状态',
    suggestion: '账号因违规被封禁，如有异议请登录控制台提交申诉工单',
    type: 'key_error',
  },
  '10029': {
    code: '10029',
    message: 'ABROAD_DAILY_QUERY_OVER_LIMIT',
    description: '某个Key的海外服务日调用量超出限制',
    suggestion: '海外服务日调用量已超限，请等待次日解封',
    type: 'key_error',
  },
  '10041': {
    code: '10041',
    message: 'NO_EFFECTIVE_INTERFACE',
    description: '请求的接口权限过期',
    suggestion: '接口权限已过期，请提交工单联系客服',
    type: 'key_error',
  },
  '10044': {
    code: '10044',
    message: 'USER_DAILY_QUERY_OVER_LIMIT',
    description: '账号维度日调用量超出限制',
    suggestion: '账号日调用量已超限，请等待次日解封',
    type: 'key_error',
  },
  '10045': {
    code: '10045',
    message: 'USER_ABROAD_DAILY_QUERY_OVER_LIMIT',
    description: '账号维度海外服务日调用量超出限制',
    suggestion: '账号海外服务日调用量已超限，请等待次日解封',
    type: 'key_error',
  },

  // 请求参数错误
  '20000': {
    code: '20000',
    message: 'INVALID_PARAMS',
    description: '请求参数非法',
    suggestion: '请检查请求参数的值是否符合规范要求',
    type: 'param_error',
  },
  '20001': {
    code: '20001',
    message: 'MISSING_REQUIRED_PARAMS',
    description: '缺少必填参数',
    suggestion: '请检查并补充接口要求的必填参数',
    type: 'param_error',
  },
  '20002': {
    code: '20002',
    message: 'ILLEGAL_REQUEST',
    description: '请求协议非法',
    suggestion: '请检查请求方法是否正确（GET/POST）',
    type: 'param_error',
  },
  '20003': {
    code: '20003',
    message: 'UNKNOWN_ERROR',
    description: '其他未知错误',
    suggestion: '发生未知错误，请提交工单联系客服',
    type: 'param_error',
  },
  '20011': {
    code: '20011',
    message: 'INSUFFICIENT_ABROAD_PRIVILEGES',
    description: '查询坐标在海外，但没有海外地图权限',
    suggestion: '请在控制台开通海外地图服务权限',
    type: 'param_error',
  },
  '20012': {
    code: '20012',
    message: 'ILLEGAL_CONTENT',
    description: '查询信息存在非法内容',
    suggestion: '请检查查询内容是否合法',
    type: 'param_error',
  },

  // 路径规划错误
  '20800': {
    code: '20800',
    message: 'OUT_OF_SERVICE',
    description: '规划点不在中国陆地范围内',
    suggestion: '起点、终点或途经点不在中国大陆范围内，请检查坐标',
    type: 'route_error',
  },
  '20801': {
    code: '20801',
    message: 'NO_ROADS_NEARBY',
    description: '规划点附近搜不到路',
    suggestion: '起点、终点或途经点附近没有道路，请调整坐标位置',
    type: 'route_error',
  },
  '20802': {
    code: '20802',
    message: 'ROUTE_FAIL',
    description: '路线计算失败',
    suggestion: '路线计算失败，通常是由于道路连通关系导致，请尝试调整起终点',
    type: 'route_error',
  },
  '20803': {
    code: '20803',
    message: 'OVER_DIRECTION_RANGE',
    description: '起点终点距离过长',
    suggestion: '起点和终点距离过长，请缩短距离或添加途经点',
    type: 'route_error',
  },

  // 服务响应错误
  '30001': {
    code: '30001',
    message: 'ENGINE_RESPONSE_DATA_ERROR',
    description: '服务响应失败',
    suggestion: '请检查传入参数是否正确，如无法解决请提交工单',
    type: 'service_error',
  },
  '30002': {
    code: '30002',
    message: 'ENGINE_RESPONSE_DATA_ERROR',
    description: '服务响应失败',
    suggestion: '请检查传入参数是否正确，如无法解决请提交工单',
    type: 'service_error',
  },
  '30003': {
    code: '30003',
    message: 'ENGINE_RESPONSE_DATA_ERROR',
    description: '服务响应失败',
    suggestion: '请检查传入参数是否正确，如无法解决请提交工单',
    type: 'service_error',
  },
  '32000': {
    code: '32000',
    message: 'ENGINE_RESPONSE_DATA_ERROR',
    description: '服务响应失败',
    suggestion: '请检查传入参数是否正确，如无法解决请提交工单',
    type: 'service_error',
  },
  '32001': {
    code: '32001',
    message: 'ENGINE_RESPONSE_DATA_ERROR',
    description: '服务响应失败',
    suggestion: '请检查传入参数是否正确，如无法解决请提交工单',
    type: 'service_error',
  },
  '32002': {
    code: '32002',
    message: 'ENGINE_RESPONSE_DATA_ERROR',
    description: '服务响应失败',
    suggestion: '请检查传入参数是否正确，如无法解决请提交工单',
    type: 'service_error',
  },
  '32003': {
    code: '32003',
    message: 'ENGINE_RESPONSE_DATA_ERROR',
    description: '服务响应失败',
    suggestion: '请检查传入参数是否正确，如无法解决请提交工单',
    type: 'service_error',
  },
  '32200': {
    code: '32200',
    message: 'ENGINE_RESPONSE_DATA_ERROR',
    description: '服务响应失败',
    suggestion: '请检查传入参数是否正确，如无法解决请提交工单',
    type: 'service_error',
  },
  '32201': {
    code: '32201',
    message: 'ENGINE_RESPONSE_DATA_ERROR',
    description: '服务响应失败',
    suggestion: '请检查传入参数是否正确，如无法解决请提交工单',
    type: 'service_error',
  },
  '32202': {
    code: '32202',
    message: 'ENGINE_RESPONSE_DATA_ERROR',
    description: '服务响应失败',
    suggestion: '请检查传入参数是否正确，如无法解决请提交工单',
    type: 'service_error',
  },
  '32203': {
    code: '32203',
    message: 'ENGINE_RESPONSE_DATA_ERROR',
    description: '服务响应失败',
    suggestion: '请检查传入参数是否正确，如无法解决请提交工单',
    type: 'service_error',
  },

  // 配额相关错误
  '40000': {
    code: '40000',
    message: 'QUOTA_PLAN_RUN_OUT',
    description: '余额耗尽',
    suggestion: '服务余额已耗尽，请前往控制台充值',
    type: 'quota_error',
  },
  '40001': {
    code: '40001',
    message: 'GEOFENCE_MAX_COUNT_REACHED',
    description: '围栏个数达到上限',
    suggestion: 'Key 可创建的地理围栏数量已达上限',
    type: 'quota_error',
  },
  '40002': {
    code: '40002',
    message: 'SERVICE_EXPIRED',
    description: '购买服务到期',
    suggestion: '服务已到期，请前往控制台续费',
    type: 'quota_error',
  },
  '40003': {
    code: '40003',
    message: 'ABROAD_QUOTA_PLAN_RUN_OUT',
    description: '海外服务余额耗尽',
    suggestion: '海外服务余额已耗尽，请前往控制台充值',
    type: 'quota_error',
  },
};

/**
 * 根据错误码获取错误信息
 */
export function getErrorInfo(infocode: string): ErrorInfo {
  const code = infocode as InfoCode;
  return ERROR_CODE_MAP[code] || {
    code: code,
    message: 'UNKNOWN_ERROR',
    description: '未知错误',
    suggestion: `未知错误码: ${infocode}，请联系技术支持`,
    type: 'service_error',
  };
}

/**
 * 判断是否为成功状态
 */
export function isSuccess(infocode: string): boolean {
  return infocode === '10000';
}