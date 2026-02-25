/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-12
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-12
 * @FilePath     : \decompile\weather_proxy\src\types\index.ts
 * @Description  : 基础类型定义 - 所有设备共用的核心类型
 */

// ============================================
// 基础类型（使用泛型 + 联合类型设计）
// ============================================

/**
 * 实时天气数据 - 基础类型（必填字段）
 */
export interface CurrentWeatherBase {
  temp: string;
  icon: string;
}

/**
 * 实时天气数据 - HTC 扩展字段
 */
export interface CurrentWeatherHtcExt {
  text: string;
  humidity: string;
  windDir: string;
  windScale: string;
  obsTime: string;
}

/**
 * 实时天气数据 - V880 扩展字段
 */
export interface CurrentWeatherV880Ext {
  updateTime: string;
  pressure: string;
  windSpeed: string;
  vis: string;
  feelsLike: string;
  dew: string;
  cloud: string;
  precip: string;
  uvIndex: string;
}

/**
 * 实时天气数据 - 完整类型（联合类型）
 */
export type CurrentWeather = CurrentWeatherBase &
  Partial<CurrentWeatherHtcExt> &
  Partial<CurrentWeatherV880Ext>;

/**
 * 预报天数据 - 基础类型（必填字段）
 */
export interface DailyForecastBase {
  fxDate: string;
  tempMin: string;
  tempMax: string;
  iconDay: string;
  iconNight: string;
}

/**
 * 预报天数据 - HTC 扩展字段
 */
export interface DailyForecastHtcExt {
  textDay: string;
  textNight: string;
}

/**
 * 预报天数据 - 通用扩展字段
 */
export interface DailyForecastCommonExt {
  windDirDay: string;
  windDirNight: string;
  windScaleDay: string;
  windScaleNight: string;
  windSpeedDay: string;
  windSpeedNight: string;
  humidity: string;
  precip: string;
  pressure: string;
  vis: string;
  cloud: string;
  uvIndex: string;
  sunrise: string;
  sunset: string;
  week: string;
}

/**
 * 预报天数据 - 完整类型（联合类型）
 */
export type DailyForecast = DailyForecastBase &
  Partial<DailyForecastHtcExt> &
  Partial<DailyForecastCommonExt>;

/**
 * 城市信息（通用格式）
 */
export interface CityInfo {
  id: string;
  name: string;
  country?: string;
  adm1?: string;
  lat?: string;
  lon?: string;
  sunrise?: string;
  sunset?: string;
  stationId?: string;
  longitude?: string;
  latitude?: string;
  postcode?: string;
}

/**
 * 小时预报数据（通用格式）
 */
export interface HourlyForecast {
  fxTime: string;
  temp: string;
  icon: string;
  text: string;
  wind360: string;
  windDir: string;
  windScale: string;
  windSpeed: string;
  humidity: string;
  precip: string;
  pressure: string;
  vis: string;
  cloud: string;
  dew: string;
}

/**
 * 天气指数数据（通用格式）
 */
export interface WeatherIndex {
  date: string;
  type: string;
  name: string;
  category: string;
  text: string;
  level?: string;
}

/**
 * 缓存数据
 */
export interface CachedWeatherData {
  id: string;
  cityId: string;
  dataType: string;
  appType: string;
  xmlData: string;
  createdAt: Date;
  expiresAt: Date;
  cacheDuration: number;
}

/**
 * 缓存策略
 */
export interface CachePolicy {
  dataType: string;
  appType: string;
  duration: number;
  description?: string;
}

/**
 * 通用天气数据格式
 * 用于和风天气API返回的数据结构
 * 各设备类型（ZTE、HTC Accu、HTC HuaFeng）都有自己的转换器将其转换为特定格式
 */
export interface WeatherData {
  code?: string;
  location?: CityInfo[];
  now: CurrentWeather;
  forecast?: {
    daily: DailyForecast[];
    updateTime: string;
  };
  daily?: DailyForecast[];
  hourly?: {
    hourly: HourlyForecast[];
    updateTime: string;
  };
  indices?: {
    daily: WeatherIndex[];
    updateTime: string;
  };
  city?: CityInfo;
  updateTime?: string;
}

// 导出设备专用类型
export * from './zte.js';
// HTC类型已从 htc.ts 拆分为 htc-accu.ts 和 htc-huafeng.ts
export * from './htc-accu.js';
export * from './htc-huafeng.js';
