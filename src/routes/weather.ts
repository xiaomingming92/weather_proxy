/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-05 13:41:04
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-09 15:00:00
 * @FilePath     : \decompile\weather_proxy\src\routes\weather.ts
 * @Description  :
 */
import express from 'express';
import weatherApi from '../services/weather-api.js';
import dataTransform from '../services/data-transform.js';
import cache from '../services/cache.js';
import prismaCache from '../services/prisma-cache.js';
import { AppType } from '../types/index.js';

const router = express.Router();

router.get('/', async (req, res): Promise<void> => {
  try {
    console.log('Request received:', req.query);
    const { sname, cityId, location, dataType, code } = req.query;

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
      actualCityId = cityInfo.city.id;
    } else if (cityId) {
      locationParam = cityId as string;
      actualCityId = cityId as string;
    } else if (location) {
      locationParam = location as string;
      // 通过经纬度获取城市ID
      const cityInfo = await weatherApi.getWeather(locationParam);
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
      dataType as string
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
        cacheDuration
      );
      console.log('Updated Prisma cache for', actualCityId, dataType);

      res.set('Content-Type', 'application/xml');
      res.send(cachedData);
      return;
    }

    // 调用和风天气API
    console.log('Calling weather API for', locationParam);
    const weatherData = await weatherApi.getWeather(locationParam);
    console.log('Weather API response received');

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
    const cacheDuration = await prismaCache.getCacheDuration(
      dataType as string
    );
    await prismaCache.createOrUpdateWeatherData(
      actualCityId,
      dataType as string,
      xmlData,
      cacheDuration
    );
    console.log('Data cached in Prisma for', actualCityId, dataType);

    res.set('Content-Type', 'application/xml');
    res.send(xmlData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('<error>Failed to get weather data</error>');
  }
});

export default router;
