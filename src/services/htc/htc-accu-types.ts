/**
 * HTC AccuWeather 国际版天气服务 - 类型定义
 * 继承/扩展 src/types/htc-accu.ts 中的基础类型
 * 与 htc-huafeng-types.ts 完全解耦
 */

import type {
  HTCAccuRequestBase,
  HTCAccuResponseBase,
  AccuWeatherCode,
  TempUnit,
  AccuWeekCode,
  AccuCurrentWeatherBase,
  AccuForecastDayBase,
  AccuCityInfoBase,
} from '@/types/htc-accu.js';
import type { CurrentWeather, DailyForecast, CityInfo } from '@/types/index.js';

// ============================================
// 入参定义（Query Parameters）- 继承基类
// ============================================

/**
 * HTC AccuWeather 天气预报请求入参
 * GET /widget/htc/forecast-data_v3.asp
 * 继承 HTCAccuRequestBase 并添加业务特有字段
 */
export interface HTCAccuForecastRequest extends HTCAccuRequestBase {
  /** 城市代码，格式：ASI|CN|BJ|Beijing */
  loccode: string;
}

/**
 * HTC AccuWeather 经纬度搜索请求入参
 * GET /widget/htc/lat-lon-search.asp
 * 继承 HTCAccuRequestBase 并添加业务特有字段
 */
export interface HTCAccuLatLonSearchRequest extends HTCAccuRequestBase {
  /** 纬度 */
  lat: string;
  /** 经度 */
  lon: string;
}

/**
 * HTC AccuWeather 城市查找请求入参
 * GET /widget/htc2/city-find.asp
 */
export interface HTCAccuCityFindRequest {
  /** 搜索关键词（城市名） */
  q: string;
}

/**
 * HTC AccuWeather 天气数据请求入参
 * GET /widget/htc2/weather-data.asp
 */
export interface HTCAccuWeatherDataRequest {
  /** 城市代码 */
  city: string;
}

// ============================================
// 内部数据类型（用于数据转换）
// ============================================

/**
 * HTC AccuWeather 天气数据格式
 * 用于数据转换器内部使用
 */
export interface HTCAccuWeatherData {
  /** API 响应码 */
  code?: string;
  /** 城市信息（用于城市搜索） */
  location?: CityInfo[];
  /** 当前城市信息 */
  city?: CityInfo;
  /** 实时天气 */
  now: CurrentWeather;
  /** 预报数据（HTC 使用顶层 daily） */
  daily?: DailyForecast[];
}

// ============================================
// 出参定义（XML Response）- 继承基类
// ============================================

/**
 * HTC AccuWeather 天气预报响应
 * 根元素：<weather>
 * 继承 HTCAccuResponseBase
 */
export interface HTCAccuForecastResponse extends HTCAccuResponseBase {
  /** 当前天气 */
  current: HTCAccuCurrentWeather;
  /** 预报数据 */
  forecast: HTCAccuForecastDay[];
}

/**
 * HTC AccuWeather 当前天气数据
 * 继承 AccuCurrentWeatherBase 并添加业务特有字段
 */
export interface HTCAccuCurrentWeather extends AccuCurrentWeatherBase {
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
 * HTC AccuWeather 预报天数据
 * 继承 AccuForecastDayBase 并添加业务特有字段
 */
export interface HTCAccuForecastDay extends AccuForecastDayBase {
  /** 白天天气描述 */
  dayCondition: string;
  /** 夜间天气描述 */
  nightCondition: string;
}

/**
 * HTC AccuWeather 城市搜索响应
 * 根元素：<cities>
 */
export interface HTCAccuCitySearchResponse {
  cities: HTCAccuCityInfo[];
}

/**
 * HTC AccuWeather 城市信息
 * 继承 AccuCityInfoBase
 */
export interface HTCAccuCityInfo extends AccuCityInfoBase {}

/**
 * HTC AccuWeather 经纬度搜索响应
 * 根元素：<location>
 */
export interface HTCAccuLocationResponse {
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
 * HTC AccuWeather 错误响应格式
 */
export interface HTCAccuErrorResponse {
  error: string;
}

// ============================================
// 天气代码映射
// ============================================

/**
 * 和风天气代码 → AccuWeather代码映射
 * 基于HTC WeatherWidget的解析器逆向分析
 */
export const QWEATHER_TO_ACCUWEATHER_MAP: Record<string, AccuWeatherCode> = {
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
export function getAccuWeatherCode(qweatherCode: string): AccuWeatherCode {
  return QWEATHER_TO_ACCUWEATHER_MAP[qweatherCode] || '1';
}

// ============================================
// 常量定义
// ============================================

/** API认证密钥 */
export const HTC_ACCU_API_KEY = 'TR2cra9U';

/** 默认温度单位 */
export const HTC_ACCU_DEFAULT_TEMP_UNIT: TempUnit = 'C';

/** 预报天数 */
export const HTC_ACCU_FORECAST_DAYS = 5;

/** XML头部 */
export const HTC_ACCU_XML_HEADER = '<?xml version="1.0" encoding="utf-8"?>';
