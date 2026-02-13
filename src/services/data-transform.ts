// 天气代码映射 - 增强版，确保与WeatherWidget完全匹配
import { utcToLocalTime } from '../utils/time-utils.js';
import { DataType, AppType, WeatherData } from '../types/index.js';

// 风向转换映射：中文风向 -> 数字代码
// 基于 DecodeData.smali 逆向代码：
// - decode_SKwindDir(I) L403-502: 实况风向映射
// - decode_windDir(I) L2470-2569: 预报风向映射
const windDirMap: Record<string, string> = {
  无: '0',
  无风向: '0',
  东北风: '1',
  东风: '2',
  东南风: '3',
  南风: '4',
  西南风: '5',
  西风: '6',
  西北风: '7',
  北风: '8',
  旋风: '9',
};

const weatherCodeMap: Record<string, string> = {
  '100': '0', // 晴
  '101': '1', // 多云
  '102': '2', // 少云
  '103': '3', // 晴间多云
  '104': '4', // 阴
  '150': '5', // 晴
  '151': '6', // 多云
  '152': '7', // 阴
  '300': '8', // 雨
  '301': '9', // 雨
  '302': '10', // 雨
  '303': '11', // 雨
  '304': '12', // 雨
  '305': '13', // 雨
  '306': '14', // 雨
  '307': '15', // 雨
  '308': '16', // 雨
  '309': '17', // 雨
  '310': '18', // 雨
  '311': '19', // 雨
  '312': '20', // 雨
  '313': '21', // 雨
  '314': '22', // 雨
  '315': '23', // 雨
  '316': '24', // 雨
  '317': '25', // 雨
  '318': '26', // 雨
  '400': '27', // 雪
  '401': '28', // 雪
  '402': '29', // 雪
  '403': '30', // 雪
  '404': '31', // 雪
  '405': '32', // 雪
  '406': '33', // 雪
  '407': '34', // 雪
  '500': '35', // 雾
  '501': '36', // 雾
  '502': '37', // 雾
  '503': '38', // 雾
  '504': '39', // 雾
  '507': '40', // 雾
  '508': '41', // 雾
  '600': '42', // 风
  '601': '43', // 风
  '602': '44', // 风
  '700': '45', // 霾
  '701': '46', // 霾
  '702': '47', // 霾
  '703': '48', // 霾
  '704': '49', // 霾
  '705': '50', // 霾
  '706': '51', // 霾
  '707': '52', // 霾
  '708': '53', // 霾
  '800': '54', // 沙尘
  '801': '55', // 沙尘
  '802': '56', // 沙尘
  '803': '57', // 沙尘
  '804': '58', // 沙尘
};

class DataTransform {
  toWidgetXml(
    weatherData: WeatherData,
    dataType: string,
    appType: AppType = AppType.UNKNOWN
  ): string {
    // 根据应用类型和数据类型选择对应的生成方法
    if (appType === AppType.WEATHER_TV) {
      return this.generateWeatherTVXml(weatherData, dataType);
    } else if (appType === AppType.WEATHER_WIDGET) {
      return this.generateWeatherWidgetXml(weatherData, dataType);
    }

    // 默认使用旧的逻辑（向后兼容）
    if (
      dataType === DataType.CURRENT_WEATHER_V3 ||
      dataType === DataType.WIDGET_SK
    ) {
      return this.generateCurrentWeatherXml(weatherData, appType);
    } else if (
      dataType === DataType.WIDGET_CF ||
      dataType === DataType.FORECAST_WEATHER_V3
    ) {
      return this.generateForecastXml(weatherData, appType);
    } else if (dataType === DataType.MAIN_DATA) {
      return this.generateZteXml(weatherData, appType);
    }
    return '<error>Invalid dataType</error>';
  }

  // WeatherTV XML 生成
  private generateWeatherTVXml(
    weatherData: WeatherData,
    dataType: string
  ): string {
    switch (dataType) {
      case DataType.MAIN_DATA:
        return this.generateWeatherTVMainXml(weatherData);
      case DataType.WIDGET_SK:
        return this.generateWeatherTVWidgetSKXml(weatherData);
      case DataType.WIDGET_CF:
        return this.generateWeatherTVWidgetCFXml(weatherData);
      case DataType.CITY_LIST:
        return this.generateCityListXml(weatherData);
      default:
        return '<error>Invalid WeatherTV dataType</error>';
    }
  }

  // WeatherWidget XML 生成 - 使用原来的 <weather> 格式保持兼容
  private generateWeatherWidgetXml(
    weatherData: WeatherData,
    dataType: string
  ): string {
    // WeatherWidget 使用原来的格式，不改为 <CityMeteor> 格式
    switch (dataType) {
      case DataType.CURRENT_WEATHER_V3:
        return this.generateCurrentWeatherXml(
          weatherData,
          AppType.WEATHER_WIDGET
        );
      case DataType.FORECAST_WEATHER_V3:
        return this.generateForecastXml(weatherData, AppType.WEATHER_WIDGET);
      default:
        return '<error>Invalid WeatherWidget dataType</error>';
    }
  }

  // WeatherTV 主天气数据 XML（dataType=zte）
  private generateWeatherTVMainXml(weatherData: WeatherData): string {
    console.log('Generating WeatherTV main XML with data:', weatherData);

    // 确保所有字段都有默认值
    const nowData = {
      temp: weatherData.now?.temp || '0',
      icon: weatherData.now?.icon || '100',
      humidity: weatherData.now?.humidity || '0',
      pressure: weatherData.now?.pressure || '0',
      windDir: weatherData.now?.windDir || '0',
      windSpeed: weatherData.now?.windSpeed || '0',
      windScale: weatherData.now?.windScale || '0',
      updateTime: weatherData.now?.updateTime || new Date().toISOString(),
    };
    const forecast = weatherData.forecast || {
      daily: [],
      updateTime: new Date().toISOString(),
    };
    const daily = forecast.daily || [];
    const hourly = weatherData.hourly || {
      hourly: [],
      updateTime: new Date().toISOString(),
    };
    const hourlyData = hourly.hourly || [];
    const indices = weatherData.indices || {
      daily: [],
      updateTime: new Date().toISOString(),
    };
    const indicesData = indices.daily || [];
    const city = this.extractCityInfo(weatherData);
    const updateTime = this.formatUpdateTime(
      nowData.updateTime || weatherData.updateTime
    );

    const temp = nowData.temp || '0';
    const weatherCode = this.getWeatherCode(nowData.icon);
    const cityName = city.name || 'Unknown';

    let xml = `${this.generateXmlHeader()}
<CityMeteor CityName="${cityName}">`;

    // 1. StationInfo 节点
    xml += `
  <StationInfo 
    Stationid="${city.stationId || city.id || '0'}" 
    Longitude="${city.longitude || '0'}" 
    Latitude="${city.latitude || '0'}" 
    Postcode="${city.postcode || ''}" 
    Sunrise="${city.sunrise || ''}" 
    Sunset="${city.sunset || ''}" />`;

    // 2. SK 节点（实况）- Info 作为子节点
    // 所有7个属性都必须存在：Weather, Temperature, WindDir, WindPower, WindSpeed, Humidity, Pressure
    // WindDir 需要转换：中文风向 -> 数字代码
    xml += `
  <SK ReportTime="${updateTime}">
    <Info 
      Weather="${weatherCode}" 
      Temperature="${temp}"
      WindDir="${this.convertWindDir(nowData.windDir)}"
      WindPower="${nowData.windScale}"
      WindSpeed="${nowData.windSpeed}"
      Humidity="${nowData.humidity}"
      Pressure="${nowData.pressure}"
    />
  </SK>`;

    // 3. CF 节点（预报）
    xml += `
  <CF ReportTime="${updateTime}">`;

    for (let i = 0; i < daily.length && i < 7; i++) {
      const day = daily[i];
      const dayWeatherCode = this.getWeatherCode(day.iconDay);
      const week = this.getWeekNumber(day.fxDate);

      xml += `
    <Period 
      Timestart="${day.fxDate} 00:00:00" 
      Timeend="${day.fxDate} 23:59:59" 
      Weather="${dayWeatherCode}" 
      Tmin="${day.tempMin}" 
      Tmax="${day.tempMax}" 
      WindDir="${this.convertWindDir(day.windDirDay)}" 
      WindPower="${day.windScaleDay || '0'}" 
      Week="${week}" />`;
    }

    xml += `
  </CF>`;

    // 4. ZU 节点（指数）- WeatherTV 期望直接包含 Type 子节点，不需要 Period 包装
    // 始终生成 ZU 节点，即使没有指数数据也使用默认值
    xml += `
  <ZU ReportTime="${updateTime}">`;

    if (indicesData.length > 0) {
      // 使用实际的指数数据
      for (const index of indicesData) {
        const typeName = this.getZuTypeCode(index.type);
        const typeVal = this.getZuTypeLevel(index.category);
        xml += `
    <Type Name="${typeName}" Val="${typeVal}">${index.text || index.name}</Type>`;
      }
    } else {
      // 使用默认指数数据，确保 ZU 节点不为空
      xml += `
    <Type Name="GM" Val="1">各项气象条件适宜，发生感冒机率较低。</Type>
    <Type Name="CY" Val="3">建议穿薄型T恤衫。</Type>
    <Type Name="XC" Val="4">不宜洗车。</Type>
    <Type Name="ZWX" Val="2">紫外线强度较弱。</Type>
    <Type Name="YD" Val="3">较不宜运动。</Type>`;
    }

    xml += `
  </ZU>`;

    // 5. CF3h 节点（3小时预报）- 使用 Period 标签
    if (hourlyData.length > 0) {
      xml += `
  <CF3h ReportTime="${updateTime}">`;

      for (let i = 0; i < hourlyData.length && i < 24; i += 3) {
        const hour = hourlyData[i];
        const hourWeatherCode = this.getWeatherCode(hour.icon);
        const fxTime = hour.fxTime.replace('T', ' ').replace('Z', '');

        xml += `
    <Period 
      Timestart="${fxTime}" 
      Timeend="${fxTime}" 
      Weather="${hourWeatherCode}" 
      WindDir="${this.convertWindDir(hour.windDir)}" 
      WindPower="${hour.windScale || '0'}" />`;
      }

      xml += `
  </CF3h>`;
    }

    // 6. AdvFile 节点（广告）
    const adv = weatherData.advertisement || {
      cfFlag: '1',
      skFlag: '1',
      zuFlag: '1',
    };
    xml += `
  <AdvFile>
    <Adv Type="CF" Flag="${adv.cfFlag || '1'}" />
    <Adv Type="SK" Flag="${adv.skFlag || '1'}" />
    <Adv Type="ZU" Flag="${adv.zuFlag || '1'}" />
  </AdvFile>`;

    xml += `
</CityMeteor>`;

    console.log(`Generated WeatherTV XML length: ${xml.length}`);
    return xml;
  }

  // WeatherTV Widget 实况 XML（dataType=ztewidgetsk）
  private generateWeatherTVWidgetSKXml(weatherData: WeatherData): string {
    const nowData = weatherData.now || {
      temp: '0',
      icon: '100',
      updateTime: new Date().toISOString(),
    };
    const city = this.extractCityInfo(weatherData);
    const updateTime = this.formatUpdateTime(nowData.updateTime);
    const weatherCode = this.getWeatherCode(nowData.icon);

    return `${this.generateXmlHeader()}
<CityMeteor CityName="${city.name || 'Unknown'}">
  <SK ReportTime="${updateTime}">
    <Info Weather="${weatherCode}" Temperature="${nowData.temp || '0'}" />
  </SK>
</CityMeteor>`;
  }

  // WeatherTV Widget 预报 XML（dataType=ztewidgetcf）
  private generateWeatherTVWidgetCFXml(weatherData: WeatherData): string {
    const forecast = weatherData.forecast || {
      daily: [],
      updateTime: new Date().toISOString(),
    };
    const daily = forecast.daily || [];
    const city = this.extractCityInfo(weatherData);
    const updateTime = this.formatUpdateTime(forecast.updateTime);

    let xml = `${this.generateXmlHeader()}
<CityMeteor CityName="${city.name || 'Unknown'}">
  <CF ReportTime="${updateTime}">`;

    for (const day of daily.slice(0, 7)) {
      const weatherCode = this.getWeatherCode(day.iconDay);
      xml += `
    <Period 
      Timestart="${day.fxDate} 00:00:00" 
      Timeend="${day.fxDate} 23:59:59" 
      Tmax="${day.tempMax}" 
      Tmin="${day.tempMin}" 
      Weather="${weatherCode}" />`;
    }

    xml += `
  </CF>
</CityMeteor>`;

    return xml;
  }

  // 城市列表 XML（flag=allcity）
  private generateCityListXml(weatherData: WeatherData): string {
    // 这里需要实际的城市列表数据
    // 暂时返回空结构
    return `${this.generateXmlHeader()}
<CityList>
  <!-- 城市列表数据 -->
</CityList>`;
  }

  // WeatherWidget 当前天气 XML - 兼容原WeatherWidget解析器
  private generateWeatherWidgetCurrentXml(weatherData: WeatherData): string {
    console.log('Generating WeatherWidget current XML with data:', weatherData);

    const nowData = weatherData.now || {
      temp: '0',
      icon: '100',
      updateTime: new Date().toISOString(),
    };
    const city = this.extractCityInfo(weatherData);
    const updateTime = this.formatUpdateTime(
      nowData.updateTime || weatherData.updateTime
    );

    const temp = nowData.temp || '0';
    const weatherCode = this.getWeatherCode(nowData.icon);
    const cityName = city.name || 'Unknown';

    // WeatherWidget期望的格式: CityMeteor > SK > Info
    const xml = `${this.generateXmlHeader()}
<CityMeteor CityName="${cityName}">
  <SK ReportTime="${updateTime}">
    <Info Weather="${weatherCode}" Temperature="${temp}"/>
  </SK>
</CityMeteor>`;

    console.log(`Generated WeatherWidget current XML length: ${xml.length}`);
    return xml;
  }

  // WeatherWidget 预报 XML - 兼容原WeatherWidget解析器
  private generateWeatherWidgetForecastXml(weatherData: WeatherData): string {
    console.log(
      'Generating WeatherWidget forecast XML with data:',
      weatherData
    );

    const forecast = weatherData.forecast || {
      daily: [],
      updateTime: new Date().toISOString(),
    };
    const daily = forecast.daily || [];
    const city = this.extractCityInfo(weatherData);
    const updateTime = this.formatUpdateTime(
      forecast.updateTime || weatherData.updateTime
    );
    const cityName = city.name || 'Unknown';

    // WeatherWidget期望的格式: CityMeteor > CF > Period (只取2天)
    let xml = `${this.generateXmlHeader()}
<CityMeteor CityName="${cityName}">
  <CF ReportTime="${updateTime}">`;

    // WeatherWidget只解析前2个Period
    for (let i = 0; i < Math.min(daily.length, 2); i++) {
      const day = daily[i];
      const weatherCode = this.getWeatherCode(day.iconDay);
      const week = this.getWeekNumber(day.fxDate);

      xml += `
    <Period Timestart="${day.fxDate} 00:00:00" Timeend="${day.fxDate} 23:59:59" Week="${week}" Weather="${weatherCode}" Tmin="${day.tempMin}" Tmax="${day.tempMax}"/>`;
    }

    xml += `
  </CF>
</CityMeteor>`;

    console.log(`Generated WeatherWidget forecast XML length: ${xml.length}`);
    return xml;
  }

  // 原有的生成方法（向后兼容）
  private generateCurrentWeatherXml(
    weatherData: WeatherData,
    appType: AppType
  ): string {
    console.log(
      `Generating current weather XML for ${appType} with data:`,
      weatherData
    );

    const nowData = weatherData.now || {
      temp: '0',
      icon: '100',
      updateTime: new Date().toISOString(),
    };
    const city = this.extractCityInfo(weatherData);
    const updateTime = this.formatUpdateTime(
      nowData.updateTime || weatherData.updateTime
    );

    const temp = nowData.temp || '0';
    const weatherCode = this.getWeatherCode(nowData.icon);
    const cityName = city.name || 'Unknown';

    const xml = `${this.generateXmlHeader()}
<weather>
  <city>${cityName}</city>
  <temp>${temp}</temp>
  <weather>${weatherCode}</weather>
  <reporttime>${updateTime}</reporttime>
</weather>`;

    console.log(`Generated XML length: ${xml.length}`);
    return xml;
  }

  private generateForecastXml(
    weatherData: WeatherData,
    appType: AppType
  ): string {
    console.log(
      `Generating forecast weather XML for ${appType} with data:`,
      weatherData
    );

    const forecast = weatherData.forecast || {
      daily: [],
      updateTime: new Date().toISOString(),
    };
    const daily = forecast.daily || [];
    const city = this.extractCityInfo(weatherData);
    const updateTime = this.formatUpdateTime(
      forecast.updateTime || weatherData.updateTime
    );
    const cityName = city.name || 'Unknown';

    let forecastXml = `${this.generateXmlHeader()}
<weather>
  <city>${cityName}</city>
  <reporttime>${updateTime}</reporttime>`;

    // 生成两天的预报数据
    if (daily.length > 0) {
      const day1 = daily[0];
      forecastXml += `
  <startTime1>${day1.fxDate} 00:00:00</startTime1>
  <endTime1>${day1.fxDate} 23:59:59</endTime1>
  <week1>${this.getWeekday(day1.fxDate)}</week1>
  <condition1>${this.getWeatherCode(day1.iconDay)}</condition1>
  <tempMin1>${day1.tempMin}</tempMin1>
  <tempMax1>${day1.tempMax}</tempMax1>`;
    }

    if (daily.length > 1) {
      const day2 = daily[1];
      forecastXml += `
  <startTime2>${day2.fxDate} 00:00:00</startTime2>
  <endTime2>${day2.fxDate} 23:59:59</endTime2>
  <week2>${this.getWeekday(day2.fxDate)}</week2>
  <condition2>${this.getWeatherCode(day2.iconDay)}</condition2>
  <tempMin2>${day2.tempMin}</tempMin2>
  <tempMax2>${day2.tempMax}</tempMax2>`;
    }

    forecastXml += `
</weather>`;

    console.log(`Generated forecast XML length: ${forecastXml.length}`);
    return forecastXml;
  }

  // 原有的 ZTE XML 生成（向后兼容）
  private generateZteXml(weatherData: WeatherData, appType: AppType): string {
    // 使用新的 WeatherTV 主数据生成方法
    if (appType === AppType.WEATHER_TV) {
      return this.generateWeatherTVMainXml(weatherData);
    }

    // 其他应用类型使用简化版本
    return this.generateWeatherTVMainXml(weatherData);
  }

  // 辅助方法

  // 获取星期几（中文）
  private getWeekday(dateStr: string): string {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()] || '';
  }

  // 获取星期数字（1-7）
  private getWeekNumber(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDay();
    // 转换为 1-7（周日=1，周一=2，...，周六=7）
    return String(day === 0 ? 1 : day + 1);
  }

  // 提取城市信息
  private extractCityInfo(weatherData: WeatherData): {
    id: string;
    name: string;
    sunrise?: string;
    sunset?: string;
    stationId?: string;
    longitude?: string;
    latitude?: string;
    postcode?: string;
  } {
    return weatherData.city || { id: '', name: 'Unknown' };
  }

  // 格式化更新时间
  private formatUpdateTime(time: string | Date | undefined): string {
    return utcToLocalTime(time || new Date())
      .toISOString()
      .replace('T', ' ')
      .replace(/\.\d{3}Z/, '');
  }

  // 获取天气代码
  private getWeatherCode(icon: string | undefined): string {
    return weatherCodeMap[icon || '100'] || '0';
  }

  // 转换风向：中文风向 -> 数字代码
  // 和风天气 API 返回中文（如"东南风"），WeatherTV 期望数字代码（如"3"）
  private convertWindDir(windDir: string | undefined): string {
    if (!windDir) return '0';
    // 如果已经是数字，直接返回
    if (/^\d+$/.test(windDir)) return windDir;
    // 转换中文风向
    return windDirMap[windDir] || '0';
  }

  // 生成XML头部
  private generateXmlHeader(): string {
    return `<?xml version="1.0" encoding="utf-8"?>`;
  }

  // 获取指数类型代码
  private getZuTypeCode(typeName: string): string {
    const typeMap: Record<string, string> = {
      穿衣: 'CY',
      感冒: 'GM',
      洗车: 'XC',
      紫外线: 'ZWX',
      运动: 'YD',
    };
    return typeMap[typeName] || typeName;
  }

  // 获取指数等级
  private getZuTypeLevel(category: string): string {
    // 将中文等级转换为数字
    const levelMap: Record<string, string> = {
      舒适: '1',
      适宜: '1',
      较适宜: '2',
      较不宜: '3',
      不宜: '4',
    };
    return levelMap[category] || '1';
  }
}

export default new DataTransform();
