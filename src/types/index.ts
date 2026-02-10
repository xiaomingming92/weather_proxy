// 类型定义文件

// 数据类型枚举
export enum DataType {
  // 当前天气类型
  CURRENT_WEATHER_V3 = 'ztev3widgetskall',
  CURRENT_WEATHER = 'ztewidgetsk',
  // 天气预报类型
  FORECAST_WEATHER = 'ztewidgetcf',
  FORECAST_WEATHER_V3 = 'ztev3widgetcfall',
  // WeatherTV 应用类型
  ZTE = 'zte',
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
    }>;
    updateTime: string;
  };
  city?: {
    id: string;
    name: string;
  };
  updateTime?: string;
}

// 缓存数据接口
export interface CachedWeatherData {
  id: string;
  cityId: string;
  dataType: string;
  xmlData: string;
  createdAt: Date;
  expiresAt: Date;
}
