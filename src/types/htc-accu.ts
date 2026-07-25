/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-12
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-12
 * @FilePath     : \decompile\weather_proxy\src\types\htc-accu.ts
 * @Description  : HTC AccuWeather（国际版）基础类型定义
 *                 只定义基础接口、泛型、基类，供服务层继承/使用
 *                 与华风天气国行版完全解耦
 */

// ============================================
// 基础请求/响应类型（基类）
// ============================================

/**
 * AccuWeather 请求基类
 */
export interface HTCAccuRequestBase {
  /** API认证密钥 */
  ac: string;
}

/**
 * AccuWeather 响应基类
 */
export interface HTCAccuResponseBase {
  /** 城市名称 */
  city: string;
}

// ============================================
// 联合类型 + 字面量类型
// ============================================

/**
 * AccuWeather 天气代码（字符串形式）
 */
export type AccuWeatherCode = string;

/**
 * 温度单位
 */
export type TempUnit = 'C' | 'F';

/**
 * 星期代码（1-7，周日=1）
 */
export type AccuWeekCode = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ============================================
// 基础接口（基类）
// ============================================

/**
 * AccuWeather 当前天气基础接口
 */
export interface AccuCurrentWeatherBase {
  /** 温度 */
  temp: string;
  /** 温度单位 */
  tempUnit: TempUnit;
  /** 天气状况代码 */
  conditionId: AccuWeatherCode;
  /** 天气状况描述 */
  condition: string;
}

/**
 * AccuWeather 预报天基础接口
 */
export interface AccuForecastDayBase {
  /** 日期 */
  date: string;
  /** 星期代码 */
  week: AccuWeekCode;
  /** 最高温 */
  high: string;
  /** 最低温 */
  low: string;
  /** 白天天气状况代码 */
  dayConditionId: AccuWeatherCode;
  /** 夜间天气状况代码 */
  nightConditionId: AccuWeatherCode;
}

/**
 * AccuWeather 城市信息基础接口
 */
export interface AccuCityInfoBase {
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

// ============================================
// 泛型基类
// ============================================

/**
 * AccuWeather 天气数据泛型基类
 * 供服务层继承并指定具体类型
 */
export interface AccuWeatherDataBase<
  TCurrent extends AccuCurrentWeatherBase = AccuCurrentWeatherBase,
  TForecast extends AccuForecastDayBase = AccuForecastDayBase,
> {
  /** 城市名称 */
  city: string;
  /** 当前天气 */
  current: TCurrent;
  /** 预报数据 */
  forecast: TForecast[];
}
