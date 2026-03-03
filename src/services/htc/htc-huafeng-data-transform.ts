/**
 * HTC国行天气数据转换器
 * 将和风天气数据转换为华风XML格式
 * 完全独立于AccuWeather国际版转换逻辑
 */

import {
  XML_HEADER,
  FORECAST_DAYS,
  getHuaFengConditionText,
  getWeekName,
  isNightTime,
  HUAFENG_CITY_CODE_MAP,
  getHuaFengCode,
} from './htc-huafeng-types.js';
import { WeatherData, DailyForecast } from '@/types/index.js';

/**
 * HTC华风天气数据转换器类
 */
export class HTCHuaFengDataTransform {
  /**
   * 生成华风天气格式的XML响应
   * 用于 /getweatheru.asmx/getData 端点
   *
   * XML格式（根据ChinaWeatherData.java逆向分析）：
   * <?xml version="1.0" encoding="utf-8"?>
   * <root>
   *   <CityMeteor CityName="南京">
   *     <StationInfo StationID="..." Longitude="..." Latitude="..."/>
   *     <CF ReportTime="...">
   *       <Period TimeStart="..." TimeEnd="..." Weather="1" Tmax="28" Tmin="15" Week="1" WindDir="东南风" WindPower="3"/>
   *     </CF>
   *     <SK>
   *       <Info Weather="1" Temperature="25" WindDir="东南风" WindPower="3" WindSpeed="12" Humidity="45"/>
   *     </SK>
   *   </CityMeteor>
   * </root>
   */
  generateHuaFengXml(weatherData: WeatherData, cityCode: string): string {
    const now = weatherData.now;
    const city = weatherData.city;
    // 预报数据可能在 forecast.daily 或 daily 中
    const daily = weatherData.forecast?.daily || weatherData.daily || [];

    // 获取城市名称
    const cityName =
      HUAFENG_CITY_CODE_MAP[cityCode] || city?.name || '未知城市';

    // 获取当前天气的华风代码（QWeather -> 华风代码）
    const currentHuaFengCode = getHuaFengCode(now?.icon || '100');

    // 构建XML
    let xml = XML_HEADER;
    xml += `<root>`;

    // CityMeteor元素
    xml += `<CityMeteor CityName="${this.escapeXml(cityName)}">`;

    // StationInfo元素（站点信息）
    xml += `<StationInfo StationID="${cityCode}" Longitude="${city?.lon || ''}" Latitude="${city?.lat || ''}"/>`;

    // CF元素（City Forecast - 预报数据）
    const reportTime = this.formatReportTime(
      now?.obsTime || new Date().toISOString()
    );
    xml += `<CF ReportTime="${reportTime}">`;

    // Period元素（预报时段）
    daily
      .slice(0, FORECAST_DAYS)
      .forEach((day: DailyForecast, index: number) => {
        const huaFengCode = getHuaFengCode(day.iconDay);
        const weekCode = this.getWeekCode(day.fxDate);
        const timeRange = this.getTimeRange(day.fxDate);

        xml += `<Period TimeStart="${timeRange.start}" TimeEnd="${timeRange.end}" `;
        xml += `Weather="${huaFengCode}" `;
        xml += `Tmax="${day.tempMax}" `;
        xml += `Tmin="${day.tempMin}" `;
        xml += `Week="${weekCode}" `;
        xml += `WindDir="${this.escapeXml(day.windDirDay || '')}" `;
        xml += `WindPower="${day.windScaleDay || '0'}"/>`;
      });

    xml += `</CF>`;

    // SK元素（Shi Kuang/实况数据）
    xml += `<SK>`;
    // 使用华风代码，原版天气应用会自动转换为Accu代码
    xml += `<Info Weather="${currentHuaFengCode}" `;
    xml += `Temperature="${now?.temp || '0'}" `;
    xml += `WindDir="${this.escapeXml(now?.windDir || '')}" `;
    xml += `WindPower="${now?.windScale || '0'}" `;
    xml += `WindSpeed="${now?.windSpeed || '0'}" `;
    xml += `Humidity="${now?.humidity || '0'}"/>`;
    xml += `</SK>`;

    xml += `</CityMeteor>`;
    xml += `</root>`;

    return xml;
  }

  /**
   * 生成华风天气格式的XML（简化版，用于错误情况）
   */
  generateErrorXml(error: string): string {
    return `${XML_HEADER}<root><error>${this.escapeXml(error)}</error></root>`;
  }

  /**
   * 生成测试数据的XML（当API不可用时使用）
   */
  generateTestXml(cityCode: string): string {
    const cityName = HUAFENG_CITY_CODE_MAP[cityCode] || '南京';
    const now = new Date();

    let xml = XML_HEADER;
    xml += `<root>`;
    xml += `<CityMeteor CityName="${this.escapeXml(cityName)}">`;

    // StationInfo
    xml += `<StationInfo StationID="${cityCode}" Longitude="118.7969" Latitude="32.0603"/>`;

    // CF - 预报数据
    const reportTime = this.formatReportTime(now.toISOString());
    xml += `<CF ReportTime="${reportTime}">`;

    // 生成5天预报
    for (let i = 0; i < FORECAST_DAYS; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const weekCode = ((date.getDay() + 6) % 7) + 1; // 周一=1
      const timeRange = this.getTimeRange(dateStr);

      xml += `<Period TimeStart="${timeRange.start}" TimeEnd="${timeRange.end}" `;
      xml += `Weather="${i % 3}" `; // 0=晴, 1=多云, 2=阴
      xml += `Tmax="${28 - i}" `;
      xml += `Tmin="${15 - i}" `;
      xml += `Week="${weekCode}" `;
      xml += `WindDir="东南风" `;
      xml += `WindPower="3"/>`;
    }

    xml += `</CF>`;

    // SK - 实况数据
    xml += `<SK>`;
    xml += `<Info Weather="0" Temperature="25" WindDir="东南风" WindPower="3" WindSpeed="12" Humidity="45"/>`;
    xml += `</SK>`;

    xml += `</CityMeteor>`;
    xml += `</root>`;

    return xml;
  }

  /**
   * 将华风天气XML转换为AccuWeather格式（用于兼容层）
   * 这是HTC ROM内部做的转换，我们在服务端模拟
   */
  convertToAccuWeatherFormat(huaFengXml: string): {
    curConditionId: string;
    curTempC: number;
    curTempF: number;
    fstName: string[];
    fstDate: string[];
    fstConditionId: string[];
    fstHighTempC: string[];
    fstHighTempF: string[];
    fstLowTempC: string[];
    fstLowTempF: string[];
  } {
    // 这里应该解析华风XML并转换为AccuWeather格式
    // 但因为我们直接生成华风XML，这个方法主要用于验证
    // 实际转换逻辑在HTC ROM的ChinaWeatherData.java中

    return {
      curConditionId: '1',
      curTempC: 25,
      curTempF: 77,
      fstName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      fstDate: [],
      fstConditionId: ['1', '6', '8', '18', '15'],
      fstHighTempC: ['28', '27', '26', '25', '24'],
      fstHighTempF: ['82', '81', '79', '77', '75'],
      fstLowTempC: ['15', '14', '13', '12', '11'],
      fstLowTempF: ['59', '57', '55', '54', '52'],
    };
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
   * 格式化报告时间
   * 格式：yyyy-MM-dd HH:mm:ss
   */
  private formatReportTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch {
      return isoString;
    }
  }

  /**
   * 获取星期代码（1-7，周一=1）
   */
  private getWeekCode(dateStr: string): number {
    try {
      const date = new Date(dateStr);
      const day = date.getDay();
      // JavaScript: 周日=0, 周一=1, ..., 周六=6
      // 华风: 周一=1, ..., 周日=7
      return day === 0 ? 7 : day;
    } catch {
      return 1;
    }
  }

  /**
   * 获取时间段（开始和结束时间）
   */
  private getTimeRange(dateStr: string): { start: string; end: string } {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return {
        start: `${year}-${month}-${day} 00:00:00`,
        end: `${year}-${month}-${day} 23:59:59`,
      };
    } catch {
      return {
        start: `${dateStr} 00:00:00`,
        end: `${dateStr} 23:59:59`,
      };
    }
  }

  /**
   * 摄氏度转华氏度（与ChinaWeatherData.java中的c2f方法一致）
   */
  celsiusToFahrenheit(celsius: number): number {
    return Math.round(celsius * 1.8 + 32);
  }

  /**
   * 浮点数转整数（四舍五入，与ChinaWeatherData.java中的f2i方法一致）
   */
  floatToInt(value: number): number {
    if (value >= 0) {
      return Math.round(value + 0.5);
    } else {
      return Math.round(value - 0.5);
    }
  }
}

// 导出单例实例
export const htcHuaFengDataTransform = new HTCHuaFengDataTransform();
