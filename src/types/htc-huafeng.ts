/**
 * HTC 华风天气（国行）基础类型定义
 * 只定义基础接口、泛型、基类，供服务层继承/使用
 * 与 AccuWeather 国际版完全解耦
 */

// ============================================
// 基础请求/响应类型（基类）
// ============================================

/**
 * 华风天气请求基类
 */
export interface HTCHuaFengRequestBase {
  /** 数据类型 */
  dataType: string;
  /** 认证码 */
  code: string;
}

/**
 * 华风天气响应基类
 */
export interface HTCHuaFengResponseBase {
  /** 城市名称 */
  cityName: string;
}

// ============================================
// 联合类型 + 字面量类型
// ============================================

/**
 * 华风天气代码（0-36）
 */
export type HTCHuaFengWeatherCode =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36;

/**
 * 华风星期代码（1-7，周一=1）
 */
export type HTCHuaFengWeekCode = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ============================================
// 基础接口（基类）
// ============================================

/**
 * 华风天气基础数据接口
 */
export interface HTCHuaFengWeatherBase {
  /** 天气代码 */
  weatherCode: HTCHuaFengWeatherCode;
  /** 温度 */
  temperature: string;
  /** 风向 */
  windDir: string;
  /** 风力等级 */
  windPower: string;
}

/**
 * 华风预报数据基础接口
 */
export interface HTCHuaFengForecastBase {
  /** 日期 */
  fxDate: string;
  /** 最高温度 */
  tempMax: string;
  /** 最低温度 */
  tempMin: string;
  /** 天气代码 */
  weatherCode: HTCHuaFengWeatherCode;
  /** 星期代码 */
  weekCode: HTCHuaFengWeekCode;
}

// ============================================
// 泛型基类
// ============================================

/**
 * 华风天气数据泛型基类
 * 供服务层继承并指定具体类型
 */
export interface HTCHuaFengWeatherDataBase<
  TWeather extends HTCHuaFengWeatherBase = HTCHuaFengWeatherBase,
  TForecast extends HTCHuaFengForecastBase = HTCHuaFengForecastBase,
> {
  /** 城市名称 */
  cityName: string;
  /** 实时天气 */
  now: TWeather;
  /** 预报数据 */
  forecast: TForecast[];
}
