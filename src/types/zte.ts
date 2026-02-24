/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-12
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-12
 * @FilePath     : \decompile\weather_proxy\src\types\zte.ts
 * @Description  : ZTE V880 专用类型定义
 */

// ============================================
// ZTE 数据类型枚举
// ============================================

export enum DataType {
  // WeatherWidget 类型
  CURRENT_WEATHER_V3 = 'ztev3widgetskall',
  FORECAST_WEATHER_V3 = 'ztev3widgetcfall',

  // WeatherTV Widget 类型
  WIDGET_SK = 'ztewidgetsk',
  WIDGET_CF = 'ztewidgetcf',

  // WeatherTV 主类型
  MAIN_DATA = 'zte',

  // 城市列表
  CITY_LIST = 'allcity',
}

export enum AppType {
  WEATHER_WIDGET = 'weatherwidget',
  WEATHER_TV = 'weathertv',
  UNKNOWN = 'unknown',
}

// ============================================
// ZTE 数据类型
// ============================================

// 从 index.ts 导入的基础类型
import type {
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  WeatherIndex,
  CityInfo,
} from './index.js';

/**
 * ZTE V880 天气数据格式
 * 用于 WeatherWidget 和 WeatherTV 应用
 */
export interface ZteWeatherData {
  now: CurrentWeather;
  forecast: {
    daily: DailyForecast[];
    updateTime: string;
  };
  hourly?: {
    hourly: HourlyForecast[];
    updateTime: string;
  };
  indices?: {
    daily: WeatherIndex[];
    updateTime: string;
  };
  city: CityInfo;
  advertisement?: {
    cfFlag?: string;
    skFlag?: string;
    zuFlag?: string;
  };
  updateTime?: string;
}

/**
 * 兼容类型（用于过渡期）
 * @deprecated 建议使用 ZteWeatherData
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
  city: CityInfo;
  advertisement?: {
    cfFlag?: string;
    skFlag?: string;
    zuFlag?: string;
  };
  updateTime?: string;
}
