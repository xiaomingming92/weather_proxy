// HTC天气数据转换器 - 完全独立于V880
// 将和风天气数据转换为AccuWeather格式

import {
  XML_HEADER,
  FORECAST_DAYS,
  DEFAULT_TEMP_UNIT,
  getAccuWeatherCode,
} from './types.js';
import { HtcWeatherData } from '@/types/index.js';

/**
 * HTC数据转换器类
 * 完全独立，不依赖V880的转换逻辑
 */
export class HtcDataTransform {
  /**
   * 生成天气预报XML（AccuWeather格式）
   * 用于 /widget/htc/forecast-data_v3.asp 端点
   */
  generateForecastXml(weatherData: HtcWeatherData, cityName: string): string {
    const now = weatherData.now;
    const daily = weatherData.daily || [];

    // 构建XML
    let xml = XML_HEADER;
    xml += `<weather>`;

    // 城市名称
    xml += `<loc>${this.escapeXml(cityName)}</loc>`;

    // 当前天气 <cc>
    xml += `<cc>`;
    xml += `<tmp>${now?.temp || '0'}</tmp>`;
    xml += `<t>${DEFAULT_TEMP_UNIT}</t>`;
    xml += `<cond>${this.escapeXml(now?.text || 'Unknown')}</cond>`;
    xml += `<icon>${getAccuWeatherCode(now?.icon || '100')}</icon>`;
    xml += `<hmid>${now?.humidity || '0'}</hmid>`;
    xml += `<wind>`;
    xml += `<dir>${this.escapeXml(now?.windDir || '0')}</dir>`;
    xml += `<spd>${now?.windScale || '0'}</spd>`;
    xml += `</wind>`;
    xml += `<updt>${this.formatDateTime(now?.obsTime || new Date().toISOString())}</updt>`;
    xml += `</cc>`;

    // 预报数据 <dayf>
    xml += `<dayf>`;
    daily.slice(0, FORECAST_DAYS).forEach((day, index) => {
      xml += `<day d="${index}">`;
      xml += `<hi>${day.tempMax}</hi>`;
      xml += `<low>${day.tempMin}</low>`;
      xml += `<week>${day.week || this.getWeekNumber(day.fxDate)}</week>`;

      // 白天
      xml += `<part p="d">`;
      xml += `<icon>${getAccuWeatherCode(day.iconDay)}</icon>`;
      xml += `<cond>${this.escapeXml(day.textDay || '')}</cond>`;
      xml += `</part>`;

      // 夜间
      xml += `<part p="n">`;
      xml += `<icon>${getAccuWeatherCode(day.iconNight)}</icon>`;
      xml += `<cond>${this.escapeXml(day.textNight || '')}</cond>`;
      xml += `</part>`;

      xml += `</day>`;
    });
    xml += `</dayf>`;

    xml += `</weather>`;

    return xml;
  }

  /**
   * 生成城市搜索XML
   * 用于 /widget/htc2/city-find.asp 端点
   */
  generateCitySearchXml(weatherData: HtcWeatherData): string {
    const locations = weatherData.location || [];

    let xml = XML_HEADER;
    xml += `<cities>`;

    locations.forEach(loc => {
      xml += `<city>`;
      xml += `<id>${this.escapeXml(loc.id)}</id>`;
      xml += `<name>${this.escapeXml(loc.name)}</name>`;
      xml += `<country>${this.escapeXml(loc.country || '')}</country>`;
      xml += `<state>${this.escapeXml(loc.adm1 || '')}</state>`;
      xml += `<lat>${loc.lat || ''}</lat>`;
      xml += `<lon>${loc.lon || ''}</lon>`;
      xml += `</city>`;
    });

    xml += `</cities>`;

    return xml;
  }

  /**
   * 生成经纬度搜索XML
   * 用于 /widget/htc/lat-lon-search.asp 端点
   */
  generateLocationXml(
    weatherData: HtcWeatherData,
    distance: string = '0'
  ): string {
    const locations = weatherData.location || [];

    if (locations.length === 0) {
      return `${XML_HEADER}<location><error>City not found</error></location>`;
    }

    const loc = locations[0];

    let xml = XML_HEADER;
    xml += `<location>`;
    xml += `<city>`;
    xml += `<id>${this.escapeXml(loc.id)}</id>`;
    xml += `<name>${this.escapeXml(loc.name)}</name>`;
    xml += `<country>${this.escapeXml(loc.country || '')}</country>`;
    xml += `<lat>${loc.lat || ''}</lat>`;
    xml += `<lon>${loc.lon || ''}</lon>`;
    xml += `<dist>${distance}</dist>`;
    xml += `</city>`;
    xml += `</location>`;

    return xml;
  }

  /**
   * 生成天气数据XML（简化版）
   * 用于 /widget/htc2/weather-data.asp 端点
   */
  generateWeatherDataXml(
    weatherData: HtcWeatherData,
    cityName: string
  ): string {
    const now = weatherData.now;
    const daily = weatherData.daily || [];

    let xml = XML_HEADER;
    xml += `<weatherdata>`;
    xml += `<city>${this.escapeXml(cityName)}</city>`;

    // 当前天气
    xml += `<current>`;
    xml += `<temp>${now?.temp || '0'}</temp>`;
    xml += `<condition>${getAccuWeatherCode(now?.icon || '100')}</condition>`;
    xml += `<humidity>${now?.humidity || '0'}</humidity>`;
    xml += `<wind>${this.escapeXml(now?.windDir || '')}</wind>`;
    xml += `</current>`;

    // 预报
    xml += `<forecast>`;
    daily.slice(0, FORECAST_DAYS).forEach(day => {
      xml += `<day>`;
      xml += `<date>${day.fxDate}</date>`;
      xml += `<high>${day.tempMax}</high>`;
      xml += `<low>${day.tempMin}</low>`;
      xml += `<daycond>${getAccuWeatherCode(day.iconDay)}</daycond>`;
      xml += `<nightcond>${getAccuWeatherCode(day.iconNight)}</nightcond>`;
      xml += `</day>`;
    });
    xml += `</forecast>`;

    xml += `</weatherdata>`;

    return xml;
  }

  /**
   * 生成错误响应XML
   */
  generateErrorXml(error: string): string {
    return `${XML_HEADER}<error>${this.escapeXml(error)}</error>`;
  }

  // ============================================
  // 辅助方法
  // ============================================

  /**
   * XML转义
   */
  private escapeXml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 格式化日期时间
   * ISO格式 -> 可读格式
   */
  private formatDateTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date
        .toISOString()
        .replace('T', ' ')
        .replace(/\.\d{3}Z$/, '');
    } catch {
      return isoString;
    }
  }

  /**
   * 获取星期数字（1-7，周日=1）
   */
  private getWeekNumber(dateStr: string): number {
    try {
      const date = new Date(dateStr);
      const day = date.getDay();
      return day === 0 ? 1 : day + 1;
    } catch {
      return 1;
    }
  }
}

// 导出单例实例
export const htcDataTransform = new HtcDataTransform();
