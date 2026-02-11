// 天气代码映射 - 增强版，确保与WeatherWidget完全匹配
import { utcToLocalTime } from '../utils/time-utils.js';
import { DataType, AppType, WeatherData } from '../types/index.js';

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
    if (
      dataType === DataType.CURRENT_WEATHER_V3 ||
      dataType === DataType.CURRENT_WEATHER
    ) {
      return this.generateCurrentWeatherXml(weatherData, appType);
    } else if (
      dataType === DataType.FORECAST_WEATHER ||
      dataType === DataType.FORECAST_WEATHER_V3
    ) {
      return this.generateForecastXml(weatherData, appType);
    } else if (dataType === DataType.ZTE) {
      return this.generateZteXml(weatherData, appType);
    }
    return '<error>Invalid dataType</error>';
  }

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
      humidity: '0',
      pressure: '0',
      windSpeed: '0',
      windDir: '0',
      vis: '0',
      feelsLike: '0',
      dew: '0',
      cloud: '0',
      precip: '0',
      uvIndex: '0',
    };
    const city = this.extractCityInfo(weatherData);
    const updateTime = this.formatUpdateTime(
      nowData.updateTime || weatherData.updateTime
    );

    const temp = nowData.temp || '0';
    const weatherCode = this.getWeatherCode(nowData.icon);
    const cityName = city.name || 'Unknown';

    console.log('Generated XML data:', {
      cityName,
      temp,
      weatherCode,
      updateTime,
    });

    // 基础XML结构
    let xml = `${this.generateXmlHeader()}
<weather>
  <city>${cityName}</city>
  <temp>${temp}</temp>
  <weather>${weatherCode}</weather>
  <reporttime>${updateTime}</reporttime>`;

    // 为WeatherTV应用添加额外数据，确保长度不低于1500
    if (appType === AppType.WEATHER_TV) {
      // 添加额外的天气数据字段
      xml += `
  <humidity>${nowData.humidity || '0'}</humidity>
  <pressure>${nowData.pressure || '0'}</pressure>
  <windSpeed>${nowData.windSpeed || '0'}</windSpeed>
  <windDir>${nowData.windDir || '0'}</windDir>
  <visibility>${nowData.vis || '0'}</visibility>
  <feelsLike>${nowData.feelsLike || '0'}</feelsLike>
  <dewPoint>${nowData.dew || '0'}</dewPoint>
  <cloud>${nowData.cloud || '0'}</cloud>
  <precip>${nowData.precip || '0'}</precip>
  <uvIndex>${nowData.uvIndex || '0'}</uvIndex>`;

      // 添加额外的有意义字段来增加长度
      if (nowData) {
        xml += `
  <AdditionalData>
    <Source>qweather</Source>
    <UpdateTime>${updateTime}</UpdateTime>
    <CityId>${city.id}</CityId>
    <OriginalWeatherCode>${nowData.icon || ''}</OriginalWeatherCode>
    <Humidity>${nowData.humidity || ''}</Humidity>
    <Pressure>${nowData.pressure || ''}</Pressure>
    <WindSpeed>${nowData.windSpeed || ''}</WindSpeed>
    <WindDir>${nowData.windDir || ''}</WindDir>
    <Visibility>${nowData.vis || ''}</Visibility>
    <FeelsLike>${nowData.feelsLike || ''}</FeelsLike>
    <DewPoint>${nowData.dew || ''}</DewPoint>
    <Cloud>${nowData.cloud || ''}</Cloud>
    <Precip>${nowData.precip || ''}</Precip>
    <UVIndex>${nowData.uvIndex || ''}</UVIndex>
  </AdditionalData>`;
      }
    }

    xml += `
</weather>`;

    // 确保长度不低于1500
    xml = this.addLengthPadding(xml, appType);

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

    // 生成两天的预报数据，与WeatherWidget期望的结构匹配
    if (daily.length > 0) {
      // 第一天预报
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
      // 第二天预报
      const day2 = daily[1];
      forecastXml += `
  <startTime2>${day2.fxDate} 00:00:00</startTime2>
  <endTime2>${day2.fxDate} 23:59:59</endTime2>
  <week2>${this.getWeekday(day2.fxDate)}</week2>
  <condition2>${this.getWeatherCode(day2.iconDay)}</condition2>
  <tempMin2>${day2.tempMin}</tempMin2>
  <tempMax2>${day2.tempMax}</tempMax2>`;
    }

    // 为WeatherTV应用添加额外数据，确保长度不低于1500
    if (appType === AppType.WEATHER_TV) {
      // 添加额外的预报数据字段
      for (let i = 0; i < daily.length && i < 7; i++) {
        const day = daily[i];
        forecastXml += `
  <startTime${i + 1}>${day.fxDate} 00:00:00</startTime${i + 1}>
  <endTime${i + 1}>${day.fxDate} 23:59:59</endTime${i + 1}>
  <week${i + 1}>${this.getWeekday(day.fxDate)}</week${i + 1}>
  <condition${i + 1}>${this.getWeatherCode(day.iconDay)}</condition${i + 1}>
  <tempMin${i + 1}>${day.tempMin}</tempMin${i + 1}>
  <tempMax${i + 1}>${day.tempMax}</tempMax${i + 1}>
  <iconDay${i + 1}>${day.iconDay}</iconDay${i + 1}>
  <iconNight${i + 1}>${day.iconNight}</iconNight${i + 1}>
  <textDay${i + 1}>${day.textDay}</textDay${i + 1}>
  <textNight${i + 1}>${day.textNight}</textNight${i + 1}>
  <wind360Day${i + 1}>${day.wind360Day}</wind360Day${i + 1}>
  <wind360Night${i + 1}>${day.wind360Night}</wind360Night${i + 1}>
  <windDirDay${i + 1}>${day.windDirDay}</windDirDay${i + 1}>
  <windDirNight${i + 1}>${day.windDirNight}</windDirNight${i + 1}>
  <windScaleDay${i + 1}>${day.windScaleDay}</windScaleDay${i + 1}>
  <windScaleNight${i + 1}>${day.windScaleNight}</windScaleNight${i + 1}>
  <windSpeedDay${i + 1}>${day.windSpeedDay}</windSpeedDay${i + 1}>
  <windSpeedNight${i + 1}>${day.windSpeedNight}</windSpeedNight${i + 1}>
  <humidity${i + 1}>${day.humidity}</humidity${i + 1}>
  <precip${i + 1}>${day.precip}</precip${i + 1}>
  <pressure${i + 1}>${day.pressure}</pressure${i + 1}>
  <vis${i + 1}>${day.vis}</vis${i + 1}>
  <cloud${i + 1}>${day.cloud}</cloud${i + 1}>
  <uvIndex${i + 1}>${day.uvIndex}</uvIndex${i + 1}>`;
      }

      // 添加额外的有意义字段来增加长度
      forecastXml += `
  <AdditionalData>
    <Source>qweather</Source>
    <UpdateTime>${updateTime}</UpdateTime>
    <CityId>${city.id}</CityId>
    <ForecastDays>${daily.length}</ForecastDays>
    <TotalForecastItems>${daily.length}</TotalForecastItems>
  </AdditionalData>`;
    }

    forecastXml += `
</weather>`;

    // 确保长度不低于1500
    forecastXml = this.addLengthPadding(forecastXml, appType);

    console.log(`Generated forecast XML length: ${forecastXml.length}`);
    return forecastXml;
  }

  // 获取星期几
  private getWeekday(dateStr: string): string {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()] || '';
  }

  // 提取城市信息，确保类型安全
  private extractCityInfo(weatherData: WeatherData): {
    id: string;
    name: string;
    sunrise?: string;
    sunset?: string;
  } {
    return weatherData.city || { id: '', name: 'Unknown' };
  }

  // 格式化更新时间
  private formatUpdateTime(time: string | Date | undefined): string {
    return utcToLocalTime(time || new Date()).toISOString();
  }

  // 获取天气代码
  private getWeatherCode(icon: string | undefined): string {
    return weatherCodeMap[icon || '100'] || '0';
  }

  // 生成XML头部
  private generateXmlHeader(): string {
    return `<?xml version="1.0" encoding="utf-8"?>`;
  }

  // 为WeatherTV应用添加长度填充
  private addLengthPadding(xml: string, appType: AppType): string {
    if (appType === AppType.WEATHER_TV && xml.length < 1500) {
      const padding = ' '.repeat(1500 - xml.length);
      return xml.replace(
        '</weather>',
        `  <!-- ${padding} -->
</weather>`
      );
    }
    return xml;
  }

  // 为ZTE格式添加长度填充
  private addZteLengthPadding(xml: string, appType: AppType): string {
    if (appType === AppType.WEATHER_TV && xml.length < 1500) {
      const padding = ' '.repeat(1500 - xml.length);
      return xml + `  <!-- ${padding} -->`;
    }
    return xml;
  }

  private generateZteXml(weatherData: WeatherData, appType: AppType): string {
    console.log(`Generating ZTE XML for ${appType} with data:`, weatherData);

    // 使用统一的工具方法获取数据
    const nowData = weatherData.now || {
      temp: '0',
      icon: '100',
      updateTime: new Date().toISOString(),
      humidity: '0',
      pressure: '0',
      windSpeed: '0',
      windDir: '0',
      vis: '0',
      feelsLike: '0',
      dew: '0',
      cloud: '0',
      precip: '0',
      uvIndex: '0',
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

    // 生成符合应用期望的XML结构
    let xml = `${this.generateXmlHeader()}\n<CityMeteor CityName="${cityName}">\n  <SK ReportTime="${updateTime}"/>\n  <Info Weather="${weatherCode}" Temperature="${temp}"`;

    // 只添加真实存在的API字段
    if (nowData) {
      if (nowData.humidity) xml += ` Humidity="${nowData.humidity}"`;
      if (nowData.pressure) xml += ` Pressure="${nowData.pressure}"`;
      if (nowData.windSpeed) xml += ` WindSpeed="${nowData.windSpeed}"`;
      if (nowData.windDir) xml += ` WindDir="${nowData.windDir}"`;
      if (nowData.vis) xml += ` Visibility="${nowData.vis}"`;
      if (nowData.feelsLike) xml += ` FeelsLike="${nowData.feelsLike}"`;
      if (nowData.dew) xml += ` DewPoint="${nowData.dew}"`;
      if (nowData.cloud) xml += ` Cloud="${nowData.cloud}"`;
      if (nowData.precip) xml += ` Precip="${nowData.precip}"`;
      if (nowData.uvIndex) xml += ` UVIndex="${nowData.uvIndex}"`;
    }

    // 添加日出日落数据
    if (city.sunrise) xml += ` Sunrise="${city.sunrise}"`;
    if (city.sunset) xml += ` Sunset="${city.sunset}"`;

    xml += `/>
  <CF ReportTime="${updateTime}"/>
`;

    // 添加预报数据
    for (let i = 0; i < daily.length && i < 7; i++) {
      const day = daily[i];
      const dayWeatherCode = this.getWeatherCode(day.iconDay);
      xml += `  <Period Timestart="${day.fxDate} 00:00:00" Timeend="${day.fxDate} 23:59:59" Tmax="${day.tempMax}" Tmin="${day.tempMin}" Weather="${dayWeatherCode}" IconDay="${day.iconDay}"`;

      // 只添加真实存在的预报字段
      if (day.iconNight) xml += ` IconNight="${day.iconNight}"`;
      if (day.textDay) xml += ` TextDay="${day.textDay}"`;
      if (day.textNight) xml += ` TextNight="${day.textNight}"`;
      if (day.wind360Day) xml += ` Wind360Day="${day.wind360Day}"`;
      if (day.wind360Night) xml += ` Wind360Night="${day.wind360Night}"`;
      if (day.windDirDay) xml += ` WindDirDay="${day.windDirDay}"`;
      if (day.windDirNight) xml += ` WindDirNight="${day.windDirNight}"`;
      if (day.windScaleDay) xml += ` WindScaleDay="${day.windScaleDay}"`;
      if (day.windScaleNight) xml += ` WindScaleNight="${day.windScaleNight}"`;
      if (day.windSpeedDay) xml += ` WindSpeedDay="${day.windSpeedDay}"`;
      if (day.windSpeedNight) xml += ` WindSpeedNight="${day.windSpeedNight}"`;
      if (day.humidity) xml += ` Humidity="${day.humidity}"`;
      if (day.precip) xml += ` Precip="${day.precip}"`;
      if (day.pressure) xml += ` Pressure="${day.pressure}"`;
      if (day.vis) xml += ` Vis="${day.vis}"`;
      if (day.cloud) xml += ` Cloud="${day.cloud}"`;
      if (day.uvIndex) xml += ` UVIndex="${day.uvIndex}"`;
      if (day.sunrise) xml += ` Sunrise="${day.sunrise}"`;
      if (day.sunset) xml += ` Sunset="${day.sunset}"`;

      xml += `/>`;
    }

    // 如果预报数据不足7天，添加基于真实数据的预报条目
    if (daily.length < 7 && nowData) {
      const today = new Date();
      for (let i = daily.length; i < 7; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i + 1);
        const dateStr = forecastDate.toISOString().split('T')[0];
        xml += `  <Period Timestart="${dateStr} 00:00:00" Timeend="${dateStr} 23:59:59" Tmax="${temp}" Tmin="${temp}" Weather="${weatherCode}" IconDay="${nowData.icon}" IconNight="${nowData.icon}"`;

        // 只添加真实存在的字段
        if (nowData.humidity) xml += ` Humidity="${nowData.humidity}"`;
        if (nowData.pressure) xml += ` Pressure="${nowData.pressure}"`;
        if (nowData.windSpeed)
          xml += ` WindSpeedDay="${nowData.windSpeed}" WindSpeedNight="${nowData.windSpeed}"`;
        if (nowData.windDir)
          xml += ` WindDirDay="${nowData.windDir}" WindDirNight="${nowData.windDir}"`;
        if (nowData.vis) xml += ` Vis="${nowData.vis}"`;
        if (nowData.cloud) xml += ` Cloud="${nowData.cloud}"`;
        if (nowData.uvIndex) xml += ` UVIndex="${nowData.uvIndex}"`;

        xml += `/>`;
      }
    }

    // 添加3小时预报数据
    if (hourlyData.length > 0) {
      xml += `  <CF3h ReportTime="${updateTime}"/>\n`;
      for (let i = 0; i < hourlyData.length && i < 24; i += 3) {
        const hour = hourlyData[i];
        const hourWeatherCode = this.getWeatherCode(hour.icon);
        const fxTime = hour.fxTime.replace('T', ' ').replace('Z', '');
        xml += `  <Cf3hPart_TimeScale TimeBegin="${fxTime}" TimeOver="${fxTime}" Temperature="${hour.temp}" Weather="${hourWeatherCode}" WindDir="${hour.windDir}" WindPower="${hour.windScale}" />
`;
      }
    }

    // 添加天气指数数据
    if (indicesData.length > 0) {
      xml += `  <ZU ReportTime="${updateTime}"/>
`;
      for (const index of indicesData) {
        xml += `  <ZuType typechineseStr="${index.name}" typeinfo="${index.text}" typename="${index.name}" typeval="${index.category}" typevalStr="${index.category}" />
`;
      }
    }

    // 为WeatherTV应用添加长度检查和填充
    if (appType === AppType.WEATHER_TV) {
      // 添加额外的有意义字段来增加长度
      xml += `  <AdditionalData>\n`;
      xml += `    <Source>qweather</Source>\n`;
      xml += `    <UpdateTime>${updateTime}</UpdateTime>\n`;
      xml += `    <CityId>${city.id}</CityId>\n`;
      xml += `    <OriginalWeatherCode>${nowData.icon || ''}</OriginalWeatherCode>\n`;
      xml += `    <ForecastDays>${daily.length}</ForecastDays>\n`;
      xml += `    <HourlyForecastCount>${hourlyData.length}</HourlyForecastCount>\n`;
      xml += `    <IndicesCount>${indicesData.length}</IndicesCount>\n`;
      xml += `  </AdditionalData>\n`;
    }

    xml += `</CityMeteor>`;

    // 确保长度不低于1500字符
    if (appType === AppType.WEATHER_TV) {
      // 使用临时包装来应用长度填充
      let tempXml = xml.replace('</CityMeteor>', '');
      tempXml = this.addZteLengthPadding(tempXml, appType);
      xml = tempXml + `</CityMeteor>`;
    }

    console.log(`Generated ZTE XML length: ${xml.length}`);
    console.log(`Generated ZTE XML: ${xml}`);
    return xml;
  }
}

export default new DataTransform();
