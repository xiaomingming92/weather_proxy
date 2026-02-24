/**
 * HTC天气服务路由
 * 完全独立的HTC天气API端点
 */

import express from 'express';
import {
  validateForecastRequest,
  validateLatLonSearchRequest,
  validateCityFindRequest,
  validateWeatherDataRequest,
  parseLocCode,
} from '@/services/htc/validator.js';
import { HtcDataTransform } from '@/services/htc/data-transform.js';
import weatherApi from '@/services/weather-api.js';
import { htcCache } from '@/services/cache/index.js';
import { WeatherData, HtcWeatherData } from '@/types/index.js';

const router = express.Router();
const htcDataTransform = new HtcDataTransform();

/**
 * 将 WeatherData 转换为 HtcWeatherData
 * 适配器函数：处理类型差异
 */
function toHtcWeatherData(weatherData: WeatherData): HtcWeatherData {
  return {
    code: '200', // 默认成功码
    location: weatherData.city ? [weatherData.city] : undefined,
    now: weatherData.now,
    daily: weatherData.forecast?.daily || [],
  };
}

/**
 * 天气预报端点
 * GET /widget/htc/forecast-data_v3.asp?ac=TR2cra9U&loccode=ASI|CN|BJ|Beijing
 */
router.get('/htc/forecast-data_v3.asp', async (req, res) => {
  try {
    console.log('[HTC] Forecast request:', req.query);

    // 参数校验
    const validation = validateForecastRequest(req.query);
    if (!validation.valid) {
      console.log('[HTC] Validation failed:', validation.error);
      res.set('Content-Type', 'text/xml');
      res
        .status(400)
        .send(
          htcDataTransform.generateErrorXml(
            validation.error || 'Invalid request'
          )
        );
      return;
    }

    const { loccode } = req.query as { loccode: string };
    const cityName = parseLocCode(loccode);

    console.log('[HTC] Parsed city name:', cityName);

    // 获取城市信息（用于缓存）
    const cityInfo = await weatherApi.getWeather(cityName);
    if (!cityInfo.city) {
      console.log('[HTC] City not found:', cityName);
      res.set('Content-Type', 'text/xml');
      res.status(404).send(htcDataTransform.generateErrorXml('City not found'));
      return;
    }
    const cityId = cityInfo.city.id;

    // 检查HTC缓存
    const cachedData = await htcCache.getWeatherData(
      cityId,
      'forecast-data_v3'
    );
    if (cachedData) {
      console.log('[HTC] Returning cached data for', cityId);
      res.set('Content-Type', 'text/xml');
      res.send(cachedData.xmlData);
      return;
    }

    // 调用和风天气API
    const weatherData = await weatherApi.getWeather(cityName);
    console.log('[HTC] Weather data received:', weatherData.city?.name);

    // 转换为 HTC 格式并生成 XML
    const htcData = toHtcWeatherData(weatherData);
    const xml = htcDataTransform.generateForecastXml(htcData, cityName);
    console.log('[HTC] Generated XML length:', xml.length);

    // 缓存数据
    const cacheDuration = await htcCache.getCacheDuration('forecast-data_v3');
    await htcCache.createOrUpdateWeatherData(
      cityId,
      'forecast-data_v3',
      xml,
      cacheDuration
    );
    console.log('[HTC] Data cached for', cityId);

    res.set('Content-Type', 'text/xml');
    res.send(xml);
  } catch (error) {
    console.error('[HTC] Forecast error:', error);
    res.set('Content-Type', 'text/xml');
    res
      .status(500)
      .send(htcDataTransform.generateErrorXml('Internal server error'));
  }
});

/**
 * 经纬度搜索端点
 * GET /widget/htc/lat-lon-search.asp?ac=TR2cra9U&lat=39.9&lon=116.4
 */
router.get('/htc/lat-lon-search.asp', async (req, res) => {
  try {
    console.log('[HTC] LatLon search request:', req.query);

    // 参数校验
    const validation = validateLatLonSearchRequest(req.query);
    if (!validation.valid) {
      console.log('[HTC] Validation failed:', validation.error);
      res.set('Content-Type', 'text/xml');
      res
        .status(400)
        .send(
          htcDataTransform.generateErrorXml(
            validation.error || 'Invalid request'
          )
        );
      return;
    }

    const { lat, lon } = req.query as { lat: string; lon: string };

    console.log('[HTC] Searching location:', lat, lon);

    // 调用和风天气API（通过经纬度）
    const locationData = await weatherApi.getWeather(`${lat},${lon}`);
    console.log('[HTC] Location data received:', locationData.city?.name);

    // 转换为 HTC 格式并生成 XML
    const htcLocationData = toHtcWeatherData(locationData);
    const xml = htcDataTransform.generateLocationXml(htcLocationData, '0');
    console.log('[HTC] Generated XML length:', xml.length);

    res.set('Content-Type', 'text/xml');
    res.send(xml);
  } catch (error) {
    console.error('[HTC] LatLon search error:', error);
    res.set('Content-Type', 'text/xml');
    res
      .status(500)
      .send(htcDataTransform.generateErrorXml('Internal server error'));
  }
});

/**
 * 城市查找端点
 * GET /widget/htc2/city-find.asp?q=Beijing
 */
router.get('/htc2/city-find.asp', async (req, res) => {
  try {
    console.log('[HTC] City find request:', req.query);

    // 参数校验
    const validation = validateCityFindRequest(req.query);
    if (!validation.valid) {
      console.log('[HTC] Validation failed:', validation.error);
      res.set('Content-Type', 'text/xml');
      res
        .status(400)
        .send(
          htcDataTransform.generateErrorXml(
            validation.error || 'Invalid request'
          )
        );
      return;
    }

    const { q } = req.query as { q: string };

    console.log('[HTC] Searching city:', q);

    // 调用和风天气API（城市搜索）
    const searchData = await weatherApi.getWeather(q);
    console.log('[HTC] Search data received');

    // 转换为 HTC 格式并生成 XML
    const htcSearchData = toHtcWeatherData(searchData);
    const xml = htcDataTransform.generateCitySearchXml(htcSearchData);
    console.log('[HTC] Generated XML length:', xml.length);

    res.set('Content-Type', 'text/xml');
    res.send(xml);
  } catch (error) {
    console.error('[HTC] City find error:', error);
    res.set('Content-Type', 'text/xml');
    res
      .status(500)
      .send(htcDataTransform.generateErrorXml('Internal server error'));
  }
});

/**
 * 天气数据端点
 * GET /widget/htc2/weather-data.asp?city=Beijing
 */
router.get('/htc2/weather-data.asp', async (req, res) => {
  try {
    console.log('[HTC] Weather data request:', req.query);

    // 参数校验
    const validation = validateWeatherDataRequest(req.query);
    if (!validation.valid) {
      console.log('[HTC] Validation failed:', validation.error);
      res.set('Content-Type', 'text/xml');
      res
        .status(400)
        .send(
          htcDataTransform.generateErrorXml(
            validation.error || 'Invalid request'
          )
        );
      return;
    }

    const { city } = req.query as { city: string };

    console.log('[HTC] Getting weather for city:', city);

    // 调用和风天气API
    const weatherData = await weatherApi.getWeather(city);
    console.log('[HTC] Weather data received:', weatherData.city?.name);

    // 转换为 HTC 格式并生成 XML
    const htcWeatherData = toHtcWeatherData(weatherData);
    const xml = htcDataTransform.generateWeatherDataXml(htcWeatherData, city);
    console.log('[HTC] Generated XML length:', xml.length);

    res.set('Content-Type', 'text/xml');
    res.send(xml);
  } catch (error) {
    console.error('[HTC] Weather data error:', error);
    res.set('Content-Type', 'text/xml');
    res
      .status(500)
      .send(htcDataTransform.generateErrorXml('Internal server error'));
  }
});

export default router;
