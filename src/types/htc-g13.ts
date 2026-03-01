/**
 * HTC G13 新天气 App - 类型定义
 * 直接使用和风天气 JSON 数据，不经过 XML 转换
 */

// ============================================
// 请求类型
// ============================================

/**
 * 天气数据请求参数
 */
export interface HtcG13WeatherRequest {
  /** 城市名称 */
  city: string;
}

/**
 * 城市搜索请求参数
 */
export interface HtcG13CitySearchRequest {
  /** 搜索关键词 */
  keyword: string;
}

// ============================================
// 响应类型
// ============================================

/**
 * 城市信息
 */
export interface HtcG13City {
  /** 城市名称 */
  name: string;
  /** 城市ID */
  id: string;
  /** 纬度 */
  latitude: string;
  /** 经度 */
  longitude: string;
  /** 所属省份 */
  adm1?: string;
}

/**
 * 实时天气数据
 */
export interface HtcG13NowWeather {
  /** 温度 */
  temp: string;
  /** 体感温度 */
  feelsLike: string;
  /** 天气图标代码 */
  icon: string;
  /** 天气描述 */
  text: string;
  /** 风向 */
  windDir: string;
  /** 风力等级 */
  windScale: string;
  /** 风速 (km/h) */
  windSpeed: string;
  /** 湿度 (%) */
  humidity: string;
  /** 气压 (hPa) */
  pressure: string;
  /** 能见度 (km) */
  vis: string;
  /** 云量 (%) */
  cloud: string;
}

/**
 * 每日预报数据
 */
export interface HtcG13DailyForecast {
  /** 预报日期 */
  fxDate: string;
  /** 星期 */
  week: string;
  /** 最高温度 */
  tempMax: string;
  /** 最低温度 */
  tempMin: string;
  /** 白天图标代码 */
  iconDay: string;
  /** 白天天气描述 */
  textDay: string;
  /** 夜间图标代码 */
  iconNight: string;
  /** 夜间天气描述 */
  textNight: string;
  /** 白天风向 */
  windDirDay: string;
  /** 白天风力 */
  windScaleDay: string;
  /** 夜间风向 */
  windDirNight: string;
  /** 夜间风力 */
  windScaleNight: string;
  /** 湿度 */
  humidity: string;
  /** 日出时间 */
  sunrise: string;
  /** 日落时间 */
  sunset: string;
}

/**
 * 每小时预报数据
 */
export interface HtcG13HourlyForecast {
  /** 预报时间 */
  fxTime: string;
  /** 温度 */
  temp: string;
  /** 图标代码 */
  icon: string;
  /** 天气描述 */
  text: string;
  /** 风向 */
  windDir: string;
  /** 风力等级 */
  windScale: string;
}

/**
 * 完整天气数据响应
 */
export interface HtcG13WeatherResponse {
  /** 状态码 */
  code: string;
  /** 数据更新时间 */
  updateTime: string;
  /** 城市信息 */
  city: HtcG13City;
  /** 实时天气 */
  now: HtcG13NowWeather;
  /** 7天预报 */
  forecast: HtcG13DailyForecast[];
  /** 24小时预报 */
  hourly: HtcG13HourlyForecast[];
}

/**
 * 城市搜索响应
 */
export interface HtcG13CitySearchResponse {
  /** 状态码 */
  code: string;
  /** 城市列表 */
  cities: HtcG13City[];
}

/**
 * 错误响应
 */
export interface HtcG13ErrorResponse {
  /** 状态码 */
  code: string;
  /** 错误信息 */
  message: string;
}

/**
 * 健康检查响应
 */
export interface HtcG13HealthResponse {
  /** 状态 */
  status: string;
  /** 服务名 */
  service: string;
  /** 时间戳 */
  timestamp: string;
}
