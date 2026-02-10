// 类型定义文件

// 数据类型枚举
export enum DataType {
  // 当前天气类型
  CURRENT_WEATHER_V3 = 'ztev3widgetskall',
  CURRENT_WEATHER = 'ztewidgetsk',
  // 天气预报类型
  FORECAST_WEATHER = 'ztewidgetcf',
  FORECAST_WEATHER_V3 = 'ztev3widgetcfall',
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
    now?: {
      temp: string;
      icon: string;
      updateTime: string;
    };
  };
  forecast?: {
    daily?: Array<{
      fxDate: string;
      tempMin: string;
      tempMax: string;
      iconDay: string;
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
