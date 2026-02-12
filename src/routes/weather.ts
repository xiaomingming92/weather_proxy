/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-05 13:41:04
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-12 13:43:32
 * @FilePath     : \decompile\weather_proxy\src\routes\weather.ts
 * @Description  :
 */
import express from 'express';
import weatherApi from '../services/weather-api.js';
import dataTransform from '../services/data-transform.js';
import cache from '../services/cache.js';
import prismaCache from '../services/prisma-cache.js';
import { AppType, WeatherData } from '../types/index.js';

const router = express.Router();

// 处理天气请求的共用函数
async function handleWeatherRequest(
  req: express.Request,
  res: express.Response,
  params: {
    sname?: string;
    cityId?: string;
    location?: string;
    dataType: string;
    code?: string;
  }
): Promise<void> {
  const { sname, cityId, location, dataType, code } = params;

  // 检查必要参数
  if (!dataType) {
    console.log('Missing dataType parameter');
    res.status(400).send('<error>Missing dataType parameter</error>');
    return;
  }

  // 识别应用类型
  let appType: AppType = AppType.UNKNOWN;
  if (code === '50532E') {
    appType = AppType.WEATHER_WIDGET;
  } else if (code === '1D765B') {
    appType = AppType.WEATHER_TV;
  }
  console.log('Identified app type:', appType);

  // 确定位置参数
  let locationParam: string;
  let actualCityId: string;

  if (sname) {
    locationParam = sname as string;
    // 通过城市名称获取城市ID
    const cityInfo = await weatherApi.getWeather(locationParam);
    if (!cityInfo.city) {
      console.log('City info not found for:', locationParam);
      res.status(404).send('<error>City not found</error>');
      return;
    }
    actualCityId = cityInfo.city.id;
  } else if (cityId) {
    locationParam = cityId as string;
    actualCityId = cityId as string;
  } else if (location) {
    locationParam = location as string;
    // 通过经纬度获取城市ID
    const cityInfo = await weatherApi.getWeather(locationParam);
    if (!cityInfo.city) {
      console.log('City info not found for:', locationParam);
      res.status(404).send('<error>City not found</error>');
      return;
    }
    actualCityId = cityInfo.city.id;
  } else {
    console.log('Missing location parameter (sname, cityId, or location)');
    res
      .status(400)
      .send(
        '<error>Missing location parameter (sname, cityId, or location)</error>'
      );
    return;
  }

  // 检查Prisma缓存
  const cachedWeatherData = await prismaCache.getWeatherData(
    actualCityId,
    dataType as string,
    appType
  );
  if (cachedWeatherData) {
    console.log('Returning Prisma cached data for', actualCityId, dataType);
    res.set('Content-Type', 'application/xml');
    res.send(cachedWeatherData.xmlData);
    return;
  }

  // 检查内存缓存
  const cacheKey = `${locationParam}_${dataType}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log('Returning memory cached data for', cacheKey);
    // 同时更新Prisma缓存
    const cacheDuration = await prismaCache.getCacheDuration(
      dataType as string
    );
    await prismaCache.createOrUpdateWeatherData(
      actualCityId,
      dataType as string,
      cachedData,
      cacheDuration,
      appType
    );
    console.log('Updated Prisma cache for', actualCityId, dataType, appType);

    res.set('Content-Type', 'application/xml');
    res.send(cachedData);
    return;
  }

  // 调用和风天气API（带重试机制，失败时返回默认值）
  console.log('Calling weather API for', locationParam);
  let weatherData: WeatherData;
  try {
    weatherData = await weatherApi.getWeather(locationParam);
    console.log('Weather API response received successfully');
  } catch (error) {
    console.error('Weather API failed after retries:', error);
    // 返回默认数据，避免客户端FC
    weatherData = {
      now: {
        temp: '0',
        icon: '100',
        humidity: '0',
        pressure: '0',
        windDir: '0',
        windSpeed: '0',
        windScale: '0',
        updateTime: new Date().toISOString(),
      },
      forecast: {
        daily: [],
        updateTime: new Date().toISOString(),
      },
      hourly: {
        hourly: [],
        updateTime: new Date().toISOString(),
      },
      indices: {
        daily: [],
        updateTime: new Date().toISOString(),
      },
      city: {
        id: actualCityId,
        name: locationParam,
      },
    };
    console.log('Using default weather data');
  }

  // 转换数据格式
  console.log('Transforming data for', dataType, 'and app type', appType);
  const xmlData = dataTransform.toWidgetXml(
    weatherData,
    dataType as string,
    appType
  );
  console.log('Data transformed successfully');
  console.log('Generated XML response:', xmlData);

  // 缓存数据到内存
  cache.set(cacheKey, xmlData);
  console.log('Data cached in memory for', cacheKey);

  // 缓存数据到Prisma
  const cacheDuration = await prismaCache.getCacheDuration(dataType as string);
  await prismaCache.createOrUpdateWeatherData(
    actualCityId,
    dataType as string,
    xmlData,
    cacheDuration,
    appType
  );
  console.log('Data cached in Prisma for', actualCityId, dataType, appType);

  res.set('Content-Type', 'application/xml');
  res.send(xmlData);
}

// GET 请求处理
router.get('/', async (req, res): Promise<void> => {
  try {
    console.log('GET Request received:', req.query);
    const { sname, cityId, location, dataType, code } = req.query;

    await handleWeatherRequest(req, res, {
      sname: sname as string,
      cityId: cityId as string,
      location: location as string,
      dataType: dataType as string,
      code: code as string,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('<error>Failed to get weather data</error>');
  }
});

// POST 请求处理（WeatherWidget 使用）
router.post('/', async (req, res): Promise<void> => {
  try {
    console.log('POST Request received:', req.body);
    const { sname, cityId, location, dataType, code } = req.body;

    await handleWeatherRequest(req, res, {
      sname: sname as string,
      cityId: cityId as string,
      location: location as string,
      dataType: dataType as string,
      code: code as string,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('<error>Failed to get weather data</error>');
  }
});

export default router;
