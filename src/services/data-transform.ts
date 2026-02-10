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
    const city = weatherData.city || { name: 'Unknown' };
    const updateTime = utcToLocalTime(
      nowData.updateTime || weatherData.updateTime || new Date()
    ).toISOString();

    const temp = nowData.temp || '0';
    const weatherCode = weatherCodeMap[nowData.icon] || '0';
    const cityName = city.name || 'Unknown';

    console.log('Generated XML data:', {
      cityName,
      temp,
      weatherCode,
      updateTime,
    });

    // 基础XML结构
    let xml = `<?xml version="1.0" encoding="utf-8"?>
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

      // 添加额外的空白字符和注释，确保长度足够
      const extraPadding = ' '.repeat(1000);
      xml += `
  <!-- ${extraPadding} -->`;
    }

    xml += `
</weather>`;

    // 确保长度不低于1500
    if (xml.length < 1500) {
      const padding = ' '.repeat(1500 - xml.length);
      xml = xml.replace(
        '</weather>',
        `  <!-- ${padding} -->
</weather>`
      );
    }

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
    const city = weatherData.city || { name: 'Unknown' };
    const updateTime = utcToLocalTime(
      forecast.updateTime || new Date()
    ).toISOString();
    const cityName = city.name || 'Unknown';

    let forecastXml = `<?xml version="1.0" encoding="utf-8"?>
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
  <condition1>${weatherCodeMap[day1.iconDay] || '0'}</condition1>
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
  <condition2>${weatherCodeMap[day2.iconDay] || '0'}</condition2>
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
  <condition${i + 1}>${weatherCodeMap[day.iconDay] || '0'}</condition${i + 1}>
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

      // 添加额外的空白字符和注释，确保长度足够
      const extraPadding = ' '.repeat(1000);
      forecastXml += `
  <!-- ${extraPadding} -->`;
    }

    forecastXml += `
</weather>`;

    // 确保长度不低于1500
    if (forecastXml.length < 1500) {
      const padding = ' '.repeat(1500 - forecastXml.length);
      forecastXml = forecastXml.replace(
        '</weather>',
        `  <!-- ${padding} -->
</weather>`
      );
    }

    console.log(`Generated forecast XML length: ${forecastXml.length}`);
    return forecastXml;
  }

  // 获取星期几
  private getWeekday(dateStr: string): string {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()] || '';
  }

  private generateZteXml(weatherData: WeatherData, appType: AppType): string {
    console.log(`Generating ZTE XML for ${appType} with data:`, weatherData);

    // 修正数据访问路径
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
    const city = weatherData.city || { name: 'Unknown' };
    const updateTime = utcToLocalTime(
      nowData.updateTime || weatherData.updateTime || new Date()
    ).toISOString();

    const temp = nowData.temp || '0';
    const weatherCode = weatherCodeMap[nowData.icon] || '0';
    const cityName = city.name || 'Unknown';

    // 生成符合应用期望的XML结构
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<CityMeteor CityName="${cityName}">
  <SK ReportTime="${updateTime}"/>
  <Info Weather="${weatherCode}" Temperature="${temp}" Humidity="${nowData.humidity || '0'}" Pressure="${nowData.pressure || '0'}" WindSpeed="${nowData.windSpeed || '0'}" WindDir="${nowData.windDir || '0'}" Visibility="${nowData.vis || '0'}" FeelsLike="${nowData.feelsLike || '0'}" DewPoint="${nowData.dew || '0'}" Cloud="${nowData.cloud || '0'}" Precip="${nowData.precip || '0'}" UVIndex="${nowData.uvIndex || '0'}"/>
  <CF ReportTime="${updateTime}"/>
`;

    // 添加预报数据
    for (let i = 0; i < daily.length && i < 7; i++) {
      const day = daily[i];
      const dayWeatherCode = weatherCodeMap[day.iconDay] || '0';
      xml += `  <Period Timestart="${day.fxDate} 00:00:00" Timeend="${day.fxDate} 23:59:59" Tmax="${day.tempMax}" Tmin="${day.tempMin}" Weather="${dayWeatherCode}" IconDay="${day.iconDay}" IconNight="${day.iconNight || day.iconDay}" TextDay="${day.textDay || ''}" TextNight="${day.textNight || ''}" Wind360Day="${day.wind360Day || '0'}" Wind360Night="${day.wind360Night || '0'}" WindDirDay="${day.windDirDay || ''}" WindDirNight="${day.windDirNight || ''}" WindScaleDay="${day.windScaleDay || '0'}" WindScaleNight="${day.windScaleNight || '0'}" WindSpeedDay="${day.windSpeedDay || '0'}" WindSpeedNight="${day.windSpeedNight || '0'}" Humidity="${day.humidity || '0'}" Precip="${day.precip || '0'}" Pressure="${day.pressure || '0'}" Vis="${day.vis || '0'}" Cloud="${day.cloud || '0'}" UVIndex="${day.uvIndex || '0'}"/>
`;
    }

    // 如果预报数据不足7天，添加额外的预报条目
    if (daily.length < 7) {
      const today = new Date();
      for (let i = daily.length; i < 7; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i + 1);
        const dateStr = forecastDate.toISOString().split('T')[0];
        xml += `  <Period Timestart="${dateStr} 00:00:00" Timeend="${dateStr} 23:59:59" Tmax="${temp}" Tmin="${temp}" Weather="${weatherCode}" IconDay="${nowData.icon}" IconNight="${nowData.icon}" TextDay="" TextNight="" Wind360Day="0" Wind360Night="0" WindDirDay="" WindDirNight="" WindScaleDay="0" WindScaleNight="0" WindSpeedDay="0" WindSpeedNight="0" Humidity="${nowData.humidity || '0'}" Precip="0" Pressure="${nowData.pressure || '0'}" Vis="${nowData.vis || '0'}" Cloud="${nowData.cloud || '0'}" UVIndex="0"/>
`;
      }
    }

    xml += `</CityMeteor>`;

    console.log(`Generated ZTE XML length: ${xml.length}`);
    console.log(`Generated ZTE XML: ${xml}`);
    return xml;
  }
}

export default new DataTransform();
