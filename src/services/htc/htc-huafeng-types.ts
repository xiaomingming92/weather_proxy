/**
 * HTC 华风天气（国行）服务层 - 类型定义
 * 继承/扩展 src/types/htc-huafeng.ts 中的基础类型
 * 与 htc-accu-types.ts 完全解耦
 */

import type {
  HTCHuaFengRequestBase,
  HTCHuaFengResponseBase,
  HTCHuaFengWeatherCode,
  HTCHuaFengWeekCode,
  HTCHuaFengWeatherBase,
  HTCHuaFengForecastBase,
} from '@/types/htc-huafeng.js';

// ============================================
// 入参定义（Query Parameters）- 继承基类
// ============================================

/**
 * 华风天气数据请求入参
 * GET /getweatheru.asmx/getData?dataType=htc&code=ED926B&sname={城市代码}
 * 继承 HTCHuaFengRequestBase 并添加业务特有字段
 */
export interface HTCHuaFengWeatherRequest extends HTCHuaFengRequestBase {
  /** 城市代码，如：01011712（南京） */
  sname: string;
}

// ============================================
// 出参定义（XML Response）- 继承基类
// ============================================

/**
 * 华风天气XML响应根结构
 */
export interface HTCHuaFengWeatherResponse {
  /** 城市气象数据 */
  cityMeteor: HTCHuaFengCityMeteor;
}

/**
 * 城市气象数据
 * 继承 HTCHuaFengResponseBase
 */
export interface HTCHuaFengCityMeteor extends HTCHuaFengResponseBase {
  /** 站点信息 */
  stationInfo?: HTCHuaFengStationInfo;
  /** 预报数据（CF = City Forecast） */
  cf: HTCHuaFengCF;
  /** 实况数据（SK = Shi Kuang/实况） */
  sk: HTCHuaFengSK;
}

/**
 * 站点信息
 */
export interface HTCHuaFengStationInfo {
  /** 站点ID */
  stationId: string;
  /** 经度 */
  longitude: string;
  /** 纬度 */
  latitude: string;
}

/**
 * 预报数据容器
 */
export interface HTCHuaFengCF {
  /** 报告时间 */
  reportTime: string;
  /** 预报时段列表 */
  periods: HTCHuaFengPeriod[];
}

/**
 * 预报时段
 * 继承 HTCHuaFengForecastBase 并适配XML格式
 */
export interface HTCHuaFengPeriod extends HTCHuaFengForecastBase {
  /** 开始时间 */
  timeStart: string;
  /** 结束时间 */
  timeEnd: string;
  /** 星期（1-7，周一=1） */
  week: string;
}

/**
 * 实况数据容器
 */
export interface HTCHuaFengSK {
  /** 实况信息 */
  info: HTCHuaFengInfo;
}

/**
 * 实况信息
 * 继承 HTCHuaFengWeatherBase 并适配XML格式
 */
export interface HTCHuaFengInfo extends HTCHuaFengWeatherBase {
  /** 风速 */
  windSpeed: string;
  /** 湿度 */
  humidity: string;
}

// ============================================
// 错误响应
// ============================================

/**
 * 华风天气错误响应格式
 */
export interface HTCHuaFengErrorResponse {
  error: string;
}

// ============================================
// 天气代码映射
// ============================================

/**
 * 华风天气代码 → AccuWeather代码映射表
 * 从ChinaWeatherData.java提取的TABLE_CONDITION_CHINA2ACCU数组
 */
export const HUAFENG_TO_ACCUWEATHER_MAP: Record<HTCHuaFengWeatherCode, number> =
  {
    // 官方映射表来自 ChinaWeatherData.java
    // 基于 AccuWeather 2011 年官方天气码 (1-54)
    // 华风码: 白天Accu -> 含义
    0: 1, // 晴 -> Sunny
    1: 6, // 多云 -> Mostly Cloudy
    2: 8, // 阴 -> Dreary (Overcast)
    3: 18, // 中雨 -> Rain
    4: 15, // 雷阵雨 -> T-Storms
    5: 51, // 小雨 -> Light Rain
    6: 29, // 雨夹雪 -> Rain and Snow
    7: 14, // 阵雨 -> Partly Sunny w/ Showers
    8: 13, // 阴有阵雨 -> Mostly Cloudy w/ Showers
    9: 18, // 大雨 -> Rain
    10: 15, // 雷暴 -> T-Storms
    11: 22, // 中雪 -> Snow
    12: 22, // 大雪 -> Snow
    13: 23, // 阴有雪 -> Mostly Cloudy w/ Snow
    14: 21, // 阵雪 -> Partly Sunny w/ Flurries
    15: 19, // 小雪 -> Flurries
    16: 22, // 暴雪 -> Snow
    17: 22, // 强降雪 -> Snow
    18: 11, // 雾 -> Fog
    19: 26, // 冻雨 -> Freezing Rain
    20: 52, // 小雪 -> Light Snow
    21: 13, // 阴阵雨 -> Mostly Cloudy w/ Showers
    22: 15, // 雷阵雨 -> T-Storms
    23: 15, // 强雷阵雨 -> T-Storms
    24: 15, // 雷雨 -> T-Storms
    25: 15, // 暴雷 -> T-Storms
    26: 19, // 小阵雪 -> Flurries
    27: 22, // 中阵雪 -> Snow
    28: 22, // 大阵雪 -> Snow
    29: 53, // 风雪 -> Blowing Snow
    30: 52, // 小雪 -> Light Snow
    31: 52, // 中雪 -> Light Snow
    32: 32, // 大风 -> Windy
    33: 54, // 冰粒 -> Ice
    34: 19, // 零星小雪 -> Flurries
    35: 11, // 浓雾 -> Fog
    36: 11, // 扩展 -> Fog
  };

/**
 * 华风天气夜间代码 → AccuWeather代码映射表
 * 从ChinaWeatherData.java提取的TABLE_NIGHT_CONDITION_CHINA2ACCU数组
 */
export const HUAFENG_NIGHT_TO_ACCUWEATHER_MAP: Record<
  HTCHuaFengWeatherCode,
  number
> = {
  // 官方夜间映射表来自 ChinaWeatherData.java
  // 基于 AccuWeather 2011 年官方天气码 (1-54)
  // 只有 0 和 1 与白天不同
  0: 33, // 晴(夜间) -> Clear (Night)
  1: 38, // 多云(夜间) -> Mostly Cloudy (Night)
  2: 8, // 阴 -> Dreary (Overcast)
  3: 18, // 中雨 -> Rain
  4: 15, // 雷阵雨 -> T-Storms
  5: 51, // 小雨 -> Light Rain
  6: 29, // 雨夹雪 -> Rain and Snow
  7: 14, // 阵雨 -> Partly Sunny w/ Showers
  8: 13, // 阴有阵雨 -> Mostly Cloudy w/ Showers
  9: 18, // 大雨 -> Rain
  10: 15, // 雷暴 -> T-Storms
  11: 22, // 中雪 -> Snow
  12: 22, // 大雪 -> Snow
  13: 23, // 阴有雪 -> Mostly Cloudy w/ Snow
  14: 21, // 阵雪 -> Partly Sunny w/ Flurries
  15: 19, // 小雪 -> Flurries
  16: 22, // 暴雪 -> Snow
  17: 22, // 强降雪 -> Snow
  18: 11, // 雾 -> Fog
  19: 26, // 冻雨 -> Freezing Rain
  20: 52, // 小雪 -> Light Snow
  21: 13, // 阴阵雨 -> Mostly Cloudy w/ Showers
  22: 15, // 雷阵雨 -> T-Storms
  23: 15, // 强雷阵雨 -> T-Storms
  24: 15, // 雷雨 -> T-Storms
  25: 15, // 暴雷 -> T-Storms
  26: 19, // 小阵雪 -> Flurries
  27: 22, // 中阵雪 -> Snow
  28: 22, // 大阵雪 -> Snow
  29: 53, // 风雪 -> Blowing Snow
  30: 52, // 小雪 -> Light Snow
  31: 52, // 中雪 -> Light Snow
  32: 32, // 大风 -> Windy
  33: 54, // 冰粒 -> Ice
  34: 19, // 零星小雪 -> Flurries
  35: 11, // 浓雾 -> Fog
  36: 11, // 扩展 -> Fog
};

/**
 * 华风星期代码 → AccuWeather星期名称映射
 * 从ChinaWeatherData.java提取的TABLE_WEEK_CHINA2ACCU数组
 * 注意：包含0表示无效/未定义
 */
export const HUAFENG_WEEK_MAP: Record<number, string> = {
  0: 'nop',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

/**
 * 华风天气代码 → 中文描述映射
 * 基于 AccuWeather 2011 年官方天气码和 ChinaWeatherData.java 映射表
 */
export const HUAFENG_CONDITION_TEXT: Record<HTCHuaFengWeatherCode, string> = {
  0: '晴',
  1: '多云',
  2: '阴',
  3: '中雨',
  4: '雷阵雨',
  5: '小雨',
  6: '雨夹雪',
  7: '阵雨',
  8: '阴有阵雨',
  9: '大雨',
  10: '雷暴',
  11: '中雪',
  12: '大雪',
  13: '阴有雪',
  14: '阵雪',
  15: '小雪',
  16: '暴雪',
  17: '强降雪',
  18: '雾',
  19: '冻雨',
  20: '小雪',
  21: '阴阵雨',
  22: '雷阵雨',
  23: '强雷阵雨',
  24: '雷雨',
  25: '暴雷',
  26: '小阵雪',
  27: '中阵雪',
  28: '大阵雪',
  29: '风雪',
  30: '小雪',
  31: '中雪',
  32: '大风',
  33: '冰粒',
  34: '零星小雪',
  35: '浓雾',
  36: '雾',
};

/**
 * 和风天气代码 → 华风天气代码映射
 * 用于将QWeather数据转换为华风格式
 */
export const QWEATHER_TO_HUAFENG_MAP: Record<string, HTCHuaFengWeatherCode> = {
  // 晴
  '100': 0, // 晴
  '150': 0, // 晴（夜间）
  // 多云
  '101': 1, // 多云
  '102': 1, // 少云
  '103': 1, // 晴间多云
  '151': 1, // 多云（夜间）
  '152': 1, // 少云（夜间）
  '153': 1, // 晴间多云（夜间）
  // 阴
  '104': 2, // 阴
  '154': 2, // 阴（夜间）
  // 雨
  '300': 8, // 阵雨
  '301': 8, // 强阵雨
  '302': 4, // 雷阵雨
  '303': 4, // 强雷阵雨
  '304': 4, // 雷阵雨伴有冰雹
  '305': 8, // 小雨
  '306': 9, // 中雨
  '307': 10, // 大雨
  '308': 11, // 极端降雨
  '309': 8, // 毛毛雨
  '310': 11, // 暴雨
  '311': 12, // 大暴雨
  '312': 13, // 特大暴雨
  '313': 14, // 冻雨
  '314': 9, // 小到中雨
  '315': 10, // 中到大雨
  '316': 11, // 大到暴雨
  '317': 12, // 暴雨到大暴雨
  '318': 13, // 大暴雨到特大暴雨
  // 雪
  '400': 6, // 小雪
  '401': 6, // 中雪
  '402': 6, // 大雪
  '403': 6, // 暴雪
  '404': 7, // 雨夹雪
  '405': 7, // 雨雪天气
  '406': 7, // 阵雨夹雪
  '407': 15, // 阵雪
  // 雾/霾 (基于 AccuWeather 2011 官方码)
  // 华风 18 -> Accu 11 (Fog)
  // 华风 35 -> Accu 11 (Fog)
  // 华风 36 -> Accu 11 (Fog)
  '500': 18, // 薄雾 -> 华风 18 (雾 -> Fog)
  '501': 18, // 雾 -> 华风 18 (雾 -> Fog)
  '502': 35, // 霾 -> 华风 35 (浓雾 -> Fog)
  '503': 35, // 浓雾 -> 华风 35 (浓雾 -> Fog)
  '504': 35, // 强浓雾 -> 华风 35 (浓雾 -> Fog)
  '507': 35, // 中度霾 -> 华风 35 (浓雾 -> Fog)
  '508': 35, // 重度霾 -> 华风 35 (浓雾 -> Fog)
  // 沙尘
  '800': 19, // 浮尘
  '801': 20, // 扬沙
  '802': 25, // 沙尘暴
  '803': 26, // 强沙尘暴
  '804': 27, // 龙卷风
};

// ============================================
// 工具函数
// ============================================

/**
 * 获取华风天气代码对应的AccuWeather代码
 * @param huafengCode 华风天气代码（0-36）
 * @param isNight 是否为夜间
 * @returns AccuWeather代码
 */
export function getAccuCodeFromHuaFeng(
  huafengCode: HTCHuaFengWeatherCode,
  isNight: boolean = false
): number {
  if (isNight) {
    return HUAFENG_NIGHT_TO_ACCUWEATHER_MAP[huafengCode] ?? 1;
  }
  return HUAFENG_TO_ACCUWEATHER_MAP[huafengCode] ?? 1;
}

/**
 * 获取和风天气代码对应的华风天气代码
 * @param qweatherCode 和风天气代码
 * @returns 华风天气代码（默认返回0-晴）
 */
export function getHuaFengCode(qweatherCode: string): HTCHuaFengWeatherCode {
  return QWEATHER_TO_HUAFENG_MAP[qweatherCode] ?? 0;
}

/**
 * 获取华风天气代码对应的中文描述
 * @param huafengCode 华风天气代码
 * @returns 中文描述
 */
export function getHuaFengConditionText(
  huafengCode: HTCHuaFengWeatherCode
): string {
  return HUAFENG_CONDITION_TEXT[huafengCode] ?? '未知';
}

/**
 * 获取华风星期代码对应的英文缩写
 * @param weekCode 星期代码（1-7）
 * @returns 英文缩写
 */
export function getWeekName(weekCode: HTCHuaFengWeekCode): string {
  return HUAFENG_WEEK_MAP[weekCode] ?? 'nop';
}

/**
 * 判断当前是否为夜间（用于选择正确的天气代码）
 * 夜间定义：18:00 - 06:00（使用Asia/Hong_Kong时区，与HTC ROM一致）
 */
export function isNightTime(): boolean {
  const now = new Date();
  // 使用香港时区（与HTC ROM中的Asia/Hong_Kong一致）
  const hkTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' })
  );
  const hour = hkTime.getHours();
  return hour <= 6 || hour >= 18;
}

// ============================================
// 常量定义
// ============================================

/** 华风天气API基础URL */
export const HUAFENG_BASE_URL =
  'http://htc-mobile.mywtv.cn/getweatheru.asmx/getData';

/** 华风天气认证码 */
export const HUAFENG_AUTH_CODE = 'ED926B';

/** 华风天气数据类型 */
export const HUAFENG_DATA_TYPE = 'htc';

/** XML头部 */
export const XML_HEADER = '<?xml version="1.0" encoding="utf-8"?>';

/** 预报天数 */
export const FORECAST_DAYS = 5;

import huafengCityCodes from './huafeng-city-codes-from-source.json' with { type: 'json' };

/**
 * 从JSON文件加载城市代码映射
 * 将分层结构扁平化为单一映射表（代码 -> 城市名）
 * 格式：{ "城市名": "代码" } -> { "代码": "城市名" }
 */
function loadCityCodeMap(): Record<string, string> {
  const map: Record<string, string> = {};

  for (const [province, cities] of Object.entries(huafengCityCodes)) {
    // 跳过元数据字段
    if (province.startsWith('_')) continue;

    if (typeof cities === 'object' && cities !== null) {
      // 处理嵌套的省份对象，反转键值对（代码 -> 城市名）
      for (const [cityName, cityCode] of Object.entries(cities)) {
        if (typeof cityCode === 'string') {
          map[cityCode] = cityName;
        }
      }
    } else if (typeof cities === 'string') {
      // 处理直辖市等直接映射的情况，反转键值对
      map[cities] = province;
    }
  }

  return map;
}

/** 城市代码映射（华风代码 -> 城市名称） */
export const HUAFENG_CITY_CODE_MAP: Record<string, string> = loadCityCodeMap();
