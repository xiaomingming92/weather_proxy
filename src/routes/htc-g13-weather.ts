/**
 * HTC G13 新天气 App API 路由
 * 提供 JSON 格式的天气数据，不经过 XML 转换
 * 端点：/api/v1/htc-g13
 */

import express from 'express';
import weatherApi from '@/services/weather-api.js';
import htcG13Cache from '@/services/cache/htc-g13-cache.js';
import {
  type HtcG13WeatherResponse,
  type HtcG13CitySearchResponse,
  type HtcG13ErrorResponse,
  type HtcG13HealthResponse,
  type HtcG13City,
  type HtcG13NowWeather,
  type HtcG13DailyForecast,
  type HtcG13HourlyForecast,
} from '@/types/htc-g13.js';
import { WeatherData, DailyForecast, HourlyForecast } from '@/types/index.js';

const router: express.Router = express.Router();

// ============================================
// 工具函数
// ============================================

/**
 * 获取星期名称
 */
function getWeekName(dateStr: string): string {
  const date = new Date(dateStr);
  const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekNames[date.getDay()];
}

/**
 * 转换实时天气数据
 */
function transformNowWeather(now: WeatherData['now']): HtcG13NowWeather {
  return {
    temp: now.temp || '0',
    feelsLike: (now as any).feelsLike || now.temp || '0',
    icon: now.icon || '100',
    text: (now as any).text || '',
    windDir: (now as any).windDir || '',
    windScale: (now as any).windScale || '0',
    windSpeed: (now as any).windSpeed || '0',
    humidity: (now as any).humidity || '0',
    pressure: (now as any).pressure || '0',
    vis: (now as any).vis || '0',
    cloud: (now as any).cloud || '0',
  };
}

/**
 * 转换每日预报数据
 */
function transformDailyForecast(daily: DailyForecast[]): HtcG13DailyForecast[] {
  return daily.map(day => ({
    fxDate: day.fxDate,
    week: getWeekName(day.fxDate),
    tempMax: day.tempMax,
    tempMin: day.tempMin,
    iconDay: day.iconDay,
    textDay: (day as any).textDay || '',
    iconNight: day.iconNight,
    textNight: (day as any).textNight || '',
    windDirDay: (day as any).windDirDay || '',
    windScaleDay: (day as any).windScaleDay || '0',
    windDirNight: (day as any).windDirNight || '',
    windScaleNight: (day as any).windScaleNight || '0',
    humidity: (day as any).humidity || '0',
    sunrise: (day as any).sunrise || '',
    sunset: (day as any).sunset || '',
  }));
}

/**
 * 转换每小时预报数据
 */
function transformHourlyForecast(
  hourly: HourlyForecast[]
): HtcG13HourlyForecast[] {
  return hourly.map(hour => ({
    fxTime: hour.fxTime,
    temp: hour.temp,
    icon: hour.icon,
    text: hour.text,
    windDir: hour.windDir,
    windScale: hour.windScale,
  }));
}

/**
 * 构建天气数据响应
 */
function buildWeatherResponse(weatherData: WeatherData): HtcG13WeatherResponse {
  const city: HtcG13City = {
    name: weatherData.city?.name || '',
    id: weatherData.city?.id || '',
    latitude: weatherData.city?.lat || '',
    longitude: weatherData.city?.lon || '',
    adm1: weatherData.city?.adm1 || '',
  };

  const daily = weatherData.forecast?.daily || weatherData.daily || [];
  const hourly = weatherData.hourly?.hourly || [];

  return {
    code: '200',
    updateTime: new Date().toISOString(),
    city,
    now: transformNowWeather(weatherData.now),
    forecast: transformDailyForecast(daily),
    hourly: transformHourlyForecast(hourly),
  };
}

// ============================================
// 路由定义
// ============================================

/**
 * 获取天气数据（支持城市名或GPS坐标）
 * GET /api/v1/htc-g13/weather?city={cityName}
 * GET /api/v1/htc-g13/weather?lat={latitude}&lon={longitude}
 */
router.get('/weather', async (req, res) => {
  const startTime = Date.now();
  try {
    console.log('[HTC-G13] Weather request:', req.query);

    const { city, lat, lon } = req.query as {
      city?: string;
      lat?: string;
      lon?: string;
    };

    let cityName: string;
    let locationId: string;

    // 优先使用GPS坐标
    if (lat && lon) {
      console.log('[HTC-G13] GPS location:', lat, lon);
      try {
        // 调用和风天气逆地理编码API获取城市信息
        const locationData = await weatherApi.getCityByLocation(lat, lon);
        if (
          !locationData ||
          !locationData.location ||
          locationData.location.length === 0
        ) {
          const errorResponse: HtcG13ErrorResponse = {
            code: '404',
            message: 'Location not found',
          };
          res.status(404).json(errorResponse);
          return;
        }
        cityName = locationData.location[0].name;
        locationId = locationData.location[0].id;
        console.log('[HTC-G13] GPS resolved to city:', cityName);
      } catch (error) {
        console.error('[HTC-G13] GPS location error:', error);
        const errorResponse: HtcG13ErrorResponse = {
          code: '503',
          message: 'Location service temporarily unavailable',
        };
        res.status(503).json(errorResponse);
        return;
      }
    } else if (city) {
      cityName = city;
      locationId = city;
    } else {
      console.log('[HTC-G13] Missing location parameters');
      const errorResponse: HtcG13ErrorResponse = {
        code: '400',
        message: 'Missing required parameters: city or lat/lon',
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 检查缓存
    const cachedCity = await htcG13Cache.getCityByName(cityName);
    if (cachedCity) {
      const cached = await htcG13Cache.getWeatherData(cachedCity.cityId);
      if (cached) {
        console.log('[HTC-G13] Cache hit for city:', cityName);
        res.set('X-Cache', 'HIT');
        res.set('X-Response-Time', `${Date.now() - startTime}ms`);
        res.json(JSON.parse(cached.jsonData));
        return;
      }
    }

    // 调用和风天气API获取数据
    let weatherData: WeatherData;
    try {
      weatherData = await weatherApi.getWeather(cityName);
      console.log('[HTC-G13] Weather data received:', weatherData.city?.name);
    } catch (error) {
      console.error('[HTC-G13] Weather API error:', error);
      const errorResponse: HtcG13ErrorResponse = {
        code: '503',
        message: 'Weather service temporarily unavailable',
      };
      res.status(503).json(errorResponse);
      return;
    }

    // 构建响应
    const response = buildWeatherResponse(weatherData);

    // 缓存城市信息
    if (weatherData.city) {
      await htcG13Cache.createCity(cityName, weatherData.city.id, {
        latitude: weatherData.city.lat,
        longitude: weatherData.city.lon,
        adm1: weatherData.city.adm1,
      });
    }

    // 缓存天气数据
    const cacheDuration = await htcG13Cache.getCacheDuration();
    await htcG13Cache.createOrUpdateWeatherData(
      weatherData.city?.id || cityName,
      JSON.stringify(response),
      cacheDuration
    );

    res.set('X-Cache', 'MISS');
    res.set('X-Response-Time', `${Date.now() - startTime}ms`);
    res.json(response);
  } catch (error) {
    console.error('[HTC-G13] Error:', error);
    const errorResponse: HtcG13ErrorResponse = {
      code: '500',
      message: error instanceof Error ? error.message : 'Internal server error',
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * 城市搜索
 * GET /api/v1/htc-g13/cities?keyword={keyword}
 */
router.get('/cities', async (req, res) => {
  try {
    console.log('[HTC-G13] City search request:', req.query);

    const { keyword } = req.query as { keyword?: string };

    // 验证必要参数
    if (!keyword) {
      console.log('[HTC-G13] Missing keyword parameter');
      const errorResponse: HtcG13ErrorResponse = {
        code: '400',
        message: 'Missing required parameter: keyword',
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 调用和风天气API搜索城市
    // 注意：这里复用 weatherApi 中的 getCityId 方法
    // 由于 weatherApi 没有直接暴露搜索方法，我们暂时返回空列表
    // 后续可以扩展 weatherApi 添加城市搜索功能

    // 从缓存中搜索
    const cachedCity = await htcG13Cache.getCityByName(keyword);
    const cities: HtcG13City[] = [];

    if (cachedCity) {
      cities.push({
        name: cachedCity.name,
        id: cachedCity.cityId,
        latitude: cachedCity.latitude || '',
        longitude: cachedCity.longitude || '',
        adm1: cachedCity.adm1 || '',
      });
    }

    const response: HtcG13CitySearchResponse = {
      code: '200',
      cities,
    };

    res.json(response);
  } catch (error) {
    console.error('[HTC-G13] Error:', error);
    const errorResponse: HtcG13ErrorResponse = {
      code: '500',
      message: error instanceof Error ? error.message : 'Internal server error',
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * 健康检查
 * GET /api/v1/htc-g13/health
 */
router.get('/health', async (_req, res) => {
  const response: HtcG13HealthResponse = {
    status: 'ok',
    service: 'htc-g13-weather',
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

export default router;
