/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-12
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-12
 * @FilePath     : \decompile\weather_proxy\src\types\htc.ts
 * @Description  : HTC G13 专用类型定义
 */

import { CurrentWeather, DailyForecast, CityInfo } from './index.js';

/**
 * HTC G13 天气数据格式
 * 兼容 AccuWeather API 格式
 */
export interface HtcWeatherData {
  // API 响应码
  code?: string;
  // 城市信息（用于城市搜索）
  location?: CityInfo[];
  // 实时天气
  now: CurrentWeather;
  // 预报数据（HTC 使用顶层 daily）
  daily: DailyForecast[];
}

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
