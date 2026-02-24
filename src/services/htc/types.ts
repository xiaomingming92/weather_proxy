/**
 * HTC天气服务 - 独立类型定义
 * 与V880完全解耦，避免互相影响
 */

// ============================================
// 入参定义（Query Parameters）
// ============================================

/**
 * 天气预报请求入参
 * GET /widget/htc/forecast-data_v3.asp
 */
export interface HtcForecastRequest {
  /** API认证密钥，固定值：TR2cra9U */
  ac: string;
  /** 城市代码，格式：ASI|CN|BJ|Beijing */
  loccode: string;
}

/**
 * 经纬度搜索请求入参
 * GET /widget/htc/lat-lon-search.asp
 */
export interface HtcLatLonSearchRequest {
  /** API认证密钥，固定值：TR2cra9U */
  ac: string;
  /** 纬度 */
  lat: string;
  /** 经度 */
  lon: string;
}

/**
 * 城市查找请求入参
 * GET /widget/htc2/city-find.asp
 */
export interface HtcCityFindRequest {
  /** 搜索关键词（城市名） */
  q: string;
}

/**
 * 天气数据请求入参
 * GET /widget/htc2/weather-data.asp
 */
export interface HtcWeatherDataRequest {
  /** 城市代码 */
  city: string;
}

// ============================================
// 出参定义（XML Response）
// ============================================

/**
 * 天气预报响应（AccuWeather格式）
 * 根元素：<weather>
 */
export interface HtcForecastResponse {
  /** 城市名称 */
  city: string;
  /** 当前天气 */
  current: HtcCurrentWeather;
  /** 预报数据 */
  forecast: HtcForecastDay[];
}

/**
 * 当前天气数据
 */
export interface HtcCurrentWeather {
  /** 温度 */
  temp: string;
  /** 温度单位：C/F */
  tempUnit: 'C' | 'F';
  /** 天气状况描述 */
  condition: string;
  /** 天气状况ID */
  conditionId: string;
  /** 湿度 */
  humidity: string;
  /** 风向 */
  windDir: string;
  /** 风速 */
  windSpeed: string;
  /** 更新时间 */
  updateTime: string;
}

/**
 * 预报天数据
 */
export interface HtcForecastDay {
  /** 日期 */
  date: string;
  /** 星期：1-7（周日=1） */
  week: string;
  /** 最高温 */
  high: string;
  /** 最低温 */
  low: string;
  /** 白天天气状况ID */
  dayConditionId: string;
  /** 夜间天气状况ID */
  nightConditionId: string;
  /** 白天天气描述 */
  dayCondition: string;
  /** 夜间天气描述 */
  nightCondition: string;
}

/**
 * 城市搜索响应
 * 根元素：<cities>
 */
export interface HtcCitySearchResponse {
  cities: HtcCityInfo[];
}

/**
 * 城市信息
 */
export interface HtcCityInfo {
  /** 城市ID */
  id: string;
  /** 城市名称 */
  name: string;
  /** 国家 */
  country: string;
  /** 省份/州 */
  state: string;
  /** 纬度 */
  latitude: string;
  /** 经度 */
  longitude: string;
}

/**
 * 经纬度搜索响应
 * 根元素：<location>
 */
export interface HtcLocationResponse {
  /** 城市ID */
  cityId: string;
  /** 城市名称 */
  cityName: string;
  /** 距离（米） */
  distance: string;
}

// ============================================
// 错误响应
// ============================================

/**
 * 错误响应格式
 * <?xml version="1.0" encoding="utf-8"?>
 * <error>错误信息</error>
 */
export interface HtcErrorResponse {
  error: string;
}

// ============================================
// 天气代码映射
// ============================================

/**
 * 和风天气代码 → AccuWeather代码映射
 * 基于HTC WeatherWidget的解析器逆向分析
 */
export const QWEATHER_TO_ACCUWEATHER_MAP: Record<string, string> = {
  // 晴
  '100': '1', // 晴
  '150': '33', // 晴（夜间）
  // 多云
  '101': '4', // 多云
  '102': '3', // 少云
  '103': '2', // 晴间多云
  '151': '34', // 多云（夜间）
  '152': '29', // 少云（夜间）
  '153': '31', // 晴间多云（夜间）
  // 阴
  '104': '6', // 阴
  '154': '30', // 阴（夜间）
  // 雨
  '300': '12', // 阵雨
  '301': '13', // 强阵雨
  '302': '14', // 雷阵雨
  '303': '15', // 强雷阵雨
  '304': '16', // 雷阵雨伴有冰雹
  '305': '7', // 小雨
  '306': '8', // 中雨
  '307': '9', // 大雨
  '308': '10', // 极端降雨
  '309': '11', // 毛毛雨
  '310': '17', // 暴雨
  '311': '18', // 大暴雨
  '312': '19', // 特大暴雨
  '313': '20', // 冻雨
  '314': '21', // 小到中雨
  '315': '22', // 中到大雨
  '316': '23', // 大到暴雨
  '317': '24', // 暴雨到大暴雨
  '318': '25', // 大暴雨到特大暴雨
  // 雪
  '400': '26', // 小雪
  '401': '27', // 中雪
  '402': '28', // 大雪
  '403': '29', // 暴雪
  '404': '30', // 雨夹雪
  '405': '31', // 雨雪天气
  '406': '32', // 阵雨夹雪
  '407': '33', // 阵雪
  // 雾/霾
  '500': '5', // 薄雾
  '501': '5', // 雾
  '502': '5', // 霾
  '503': '5', // 浓雾
  '504': '5', // 强浓雾
  '507': '5', // 中度霾
  '508': '5', // 重度霾
  // 风
  '600': '2', // 轻风
  '601': '2', // 微风
  '602': '2', // 和风
  // 沙尘
  '800': '35', // 浮尘
  '801': '35', // 扬沙
  '802': '35', // 沙尘暴
  '803': '35', // 强沙尘暴
  '804': '35', // 龙卷风
};

/**
 * 获取AccuWeather代码
 * @param qweatherCode 和风天气代码
 * @returns AccuWeather代码（默认返回1-晴）
 */
export function getAccuWeatherCode(qweatherCode: string): string {
  return QWEATHER_TO_ACCUWEATHER_MAP[qweatherCode] || '1';
}

// ============================================
// 常量定义
// ============================================

/** API认证密钥 */
export const HTC_API_KEY = 'TR2cra9U';

/** 默认温度单位 */
export const DEFAULT_TEMP_UNIT = 'C';

/** 预报天数 */
export const FORECAST_DAYS = 5;

/** XML头部 */
export const XML_HEADER = '<?xml version="1.0" encoding="utf-8"?>';
