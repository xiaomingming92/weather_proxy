/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-09 17:08:58
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-12
 * @FilePath     : \decompile\weather_proxy\src\types\index.ts
 * @Description  : 类型定义文件
 */

// 数据类型枚举
export enum DataType {
  // WeatherWidget 类型
  CURRENT_WEATHER_V3 = 'ztev3widgetskall', // Widget 实况（完整版）
  FORECAST_WEATHER_V3 = 'ztev3widgetcfall', // Widget 预报（完整版）

  // WeatherTV Widget 类型
  WIDGET_SK = 'ztewidgetsk', // Widget 实况（简化版）
  WIDGET_CF = 'ztewidgetcf', // Widget 预报（简化版）

  // WeatherTV 主类型
  MAIN_DATA = 'zte', // 主天气数据（完整）

  // 城市列表
  CITY_LIST = 'allcity', // 城市列表
}

// 应用类型枚举
export enum AppType {
  WEATHER_WIDGET = 'weatherwidget',
  WEATHER_TV = 'weathertv',
  UNKNOWN = 'unknown',
}

// 天气数据接口
export interface WeatherData {
  now?: {
    temp: string;
    icon: string;
    updateTime: string;
    humidity?: string;
    pressure?: string;
    windSpeed?: string;
    windDir?: string;
    vis?: string;
    feelsLike?: string;
    dew?: string;
    cloud?: string;
    precip?: string;
    uvIndex?: string;
    windScale?: string; // 新增：风力等级
  };

  forecast?: {
    daily?: Array<{
      fxDate: string;
      tempMin: string;
      tempMax: string;
      iconDay: string;
      iconNight?: string;
      textDay?: string;
      textNight?: string;
      wind360Day?: string;
      wind360Night?: string;
      windDirDay?: string;
      windDirNight?: string;
      windScaleDay?: string;
      windScaleNight?: string;
      windSpeedDay?: string;
      windSpeedNight?: string;
      humidity?: string;
      precip?: string;
      pressure?: string;
      vis?: string;
      cloud?: string;
      uvIndex?: string;
      sunrise?: string;
      sunset?: string;
      week?: string; // 新增：星期（1-7）
    }>;
    updateTime: string;
  };

  hourly?: {
    hourly?: Array<{
      fxTime: string;
      temp: string;
      icon: string;
      text: string;
      wind360: string;
      windDir: string;
      windScale: string;
      windSpeed: string;
      humidity: string;
      precip: string;
      pressure: string;
      vis: string;
      cloud: string;
      dew: string;
    }>;
    updateTime: string;
  };

  indices?: {
    daily?: Array<{
      date: string;
      type: string;
      name: string;
      category: string;
      text: string;
      level?: string; // 新增：指数等级
    }>;
    updateTime: string;
  };

  city?: {
    id: string;
    name: string;
    sunrise?: string;
    sunset?: string;
    // 新增：站点信息
    stationId?: string;
    longitude?: string;
    latitude?: string;
    postcode?: string;
  };

  // 新增：广告信息
  advertisement?: {
    cfFlag?: string;
    skFlag?: string;
    zuFlag?: string;
  };

  updateTime?: string;
}

// 缓存数据接口
export interface CachedWeatherData {
  id: string;
  cityId: string;
  dataType: string;
  appType: string;
  xmlData: string;
  createdAt: Date;
  expiresAt: Date;
  cacheDuration: number;
}

// 缓存策略接口
export interface CachePolicy {
  dataType: string;
  appType: string;
  duration: number;
  description?: string;
}
