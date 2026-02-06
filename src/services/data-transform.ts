// 天气代码映射 - 增强版，确保与WeatherWidget完全匹配
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
  toWidgetXml(weatherData: any, dataType: string): string {
    if (dataType === 'ztev3widgetskall' || dataType === 'ztewidgetsk') {
      return this.generateCurrentWeatherXml(weatherData);
    } else if (dataType === 'ztewidgetcf') {
      return this.generateForecastXml(weatherData);
    }
    return '<error>Invalid dataType</error>';
  }

  private generateCurrentWeatherXml(weatherData: any): string {
    console.log('Generating current weather XML with data:', weatherData);

    const nowData = weatherData.now?.now || {};
    const city = weatherData.city || {};
    const updateTime =
      nowData.updateTime || weatherData.updateTime || new Date().toISOString();

    const temp = nowData.temp || '0';
    const weatherCode = weatherCodeMap[nowData.icon] || '0';
    const cityName = city.name || 'Unknown';

    console.log('Generated XML data:', {
      cityName,
      temp,
      weatherCode,
      updateTime,
    });

    return `<?xml version="1.0" encoding="utf-8"?>
<weather>
  <city>${cityName}</city>
  <temp>${temp}</temp>
  <weather>${weatherCode}</weather>
  <reporttime>${updateTime}</reporttime>
</weather>`;
  }

  private generateForecastXml(weatherData: any): string {
    const forecast = weatherData.forecast || {};
    const daily = forecast.daily || [];
    const city = weatherData.city || {};
    const updateTime = forecast.updateTime || new Date().toISOString();
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

    forecastXml += `
</weather>`;

    return forecastXml;
  }

  // 获取星期几
  private getWeekday(dateStr: string): string {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()] || '';
  }
}

export default new DataTransform();
