/**
 * HTC AccuWeather 国际版天气服务路由
 * 完全独立的HTC AccuWeather API端点
 */

import express from 'express';
import {
  validateForecastRequest,
  validateLatLonSearchRequest,
  validateCityFindRequest,
  validateWeatherDataRequest,
  parseLocCode,
} from '@/services/htc/validator.js';
import { HTCAccuDataTransform } from '@/services/htc/htc-accu-data-transform.js';
import weatherApi from '@/services/weather-api.js';
import { htcAccuCache } from '@/services/cache/index.js';
import { HTCAccuWeatherData } from '@/services/htc/htc-accu-types.js';
import { WeatherData } from '@/types/index.js';

const router: express.Router = express.Router();
const htcAccuDataTransform = new HTCAccuDataTransform();

/**
 * 将 WeatherData 转换为 HTCAccuWeatherData
 * 适配器函数：处理类型差异
 */
function toHTCAccuWeatherData(weatherData: WeatherData): HTCAccuWeatherData {
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
    console.log('[HTC-Accu] Forecast request:', req.query);

    // 参数校验
    const validation = validateForecastRequest(req.query);
    if (!validation.valid) {
      console.log('[HTC-Accu] Validation failed:', validation.error);
      res.set('Content-Type', 'text/xml');
      res
        .status(400)
        .send(
          htcAccuDataTransform.generateErrorXml(
            validation.error || 'Invalid request'
          )
        );
      return;
    }

    const { loccode } = req.query as { loccode: string };
    const cityName = parseLocCode(loccode);

    console.log('[HTC-Accu] Parsed city name:', cityName);

    // 获取城市信息（用于缓存）
    const cityInfo = await weatherApi.getWeather(cityName);
    if (!cityInfo.city) {
      console.log('[HTC-Accu] City not found:', cityName);
      res.set('Content-Type', 'text/xml');
      res
        .status(404)
        .send(htcAccuDataTransform.generateErrorXml('City not found'));
      return;
    }
    const cityId = cityInfo.city.id;

    // 检查HTC缓存
    const cachedData = await htcAccuCache.getWeatherData(
      cityId,
      'forecast-data_v3'
    );
    if (cachedData) {
      console.log('[HTC-Accu] Returning cached data for', cityId);
      res.set('Content-Type', 'text/xml');
      res.send(cachedData.xmlData);
      return;
    }

    // 调用和风天气API
    const weatherData = await weatherApi.getWeather(cityName);
    console.log('[HTC-Accu] Weather data received:', weatherData.city?.name);

    // 转换为 HTC 格式并生成 XML
    const htcData = toHTCAccuWeatherData(weatherData);
    const xml = htcAccuDataTransform.generateForecastXml(htcData, cityName);
    console.log('[HTC-Accu] Generated XML length:', xml.length);

    // 缓存数据
    const cacheDuration =
      await htcAccuCache.getCacheDuration('forecast-data_v3');
    await htcAccuCache.createOrUpdateWeatherData(
      cityId,
      'forecast-data_v3',
      xml,
      cacheDuration
    );
    console.log('[HTC-Accu] Data cached for', cityId);

    res.set('Content-Type', 'text/xml');
    res.send(xml);
  } catch (error) {
    console.error('[HTC-Accu] Forecast error:', error);
    res.set('Content-Type', 'text/xml');
    res
      .status(500)
      .send(htcAccuDataTransform.generateErrorXml('Internal server error'));
  }
});

/**
 * 经纬度搜索端点
 * GET /widget/htc/lat-lon-search.asp?ac=TR2cra9U&lat=39.9&lon=116.4
 */
router.get('/htc/lat-lon-search.asp', async (req, res) => {
  try {
    console.log('[HTC-Accu] LatLon search request:', req.query);

    // 参数校验
    const validation = validateLatLonSearchRequest(req.query);
    if (!validation.valid) {
      console.log('[HTC-Accu] Validation failed:', validation.error);
      res.set('Content-Type', 'text/xml');
      res
        .status(400)
        .send(
          htcAccuDataTransform.generateErrorXml(
            validation.error || 'Invalid request'
          )
        );
      return;
    }

    const { lat, lon } = req.query as { lat: string; lon: string };

    console.log('[HTC-Accu] Searching location:', lat, lon);

    // 调用和风天气API（通过经纬度）
    // 注意：和风天气API使用 经度,纬度 格式
    const locationData = await weatherApi.getWeather(`${lon},${lat}`);
    console.log('[HTC-Accu] Location data received:', locationData.city?.name);

    // 转换为 HTC 格式并生成 XML
    const htcLocationData = toHTCAccuWeatherData(locationData);
    const xml = htcAccuDataTransform.generateLocationXml(htcLocationData, '0');
    console.log('[HTC-Accu] Generated XML length:', xml.length);

    res.set('Content-Type', 'text/xml');
    res.send(xml);
  } catch (error) {
    console.error('[HTC-Accu] LatLon search error:', error);
    res.set('Content-Type', 'text/xml');
    res
      .status(500)
      .send(htcAccuDataTransform.generateErrorXml('Internal server error'));
  }
});

/**
 * 城市查找端点
 * GET /widget/htc2/city-find.asp?q=Beijing
 */
router.get('/htc2/city-find.asp', async (req, res) => {
  try {
    console.log('[HTC-Accu] City find request:', req.query);

    // 参数校验
    const validation = validateCityFindRequest(req.query);
    if (!validation.valid) {
      console.log('[HTC-Accu] Validation failed:', validation.error);
      res.set('Content-Type', 'text/xml');
      res
        .status(400)
        .send(
          htcAccuDataTransform.generateErrorXml(
            validation.error || 'Invalid request'
          )
        );
      return;
    }

    const { q } = req.query as { q: string };

    console.log('[HTC-Accu] Searching city:', q);

    // 调用和风天气API（城市搜索）
    const searchData = await weatherApi.getWeather(q);
    console.log('[HTC-Accu] Search data received');

    // 转换为 HTC 格式并生成 XML
    const htcSearchData = toHTCAccuWeatherData(searchData);
    const xml = htcAccuDataTransform.generateCitySearchXml(htcSearchData);
    console.log('[HTC-Accu] Generated XML length:', xml.length);

    res.set('Content-Type', 'text/xml');
    res.send(xml);
  } catch (error) {
    console.error('[HTC-Accu] City find error:', error);
    res.set('Content-Type', 'text/xml');
    res
      .status(500)
      .send(htcAccuDataTransform.generateErrorXml('Internal server error'));
  }
});

/**
 * 天气数据端点
 * GET /widget/htc2/weather-data.asp?city=Beijing
 */
router.get('/htc2/weather-data.asp', async (req, res) => {
  try {
    console.log('[HTC-Accu] Weather data request:', req.query);

    // 参数校验
    const validation = validateWeatherDataRequest(req.query);
    if (!validation.valid) {
      console.log('[HTC-Accu] Validation failed:', validation.error);
      res.set('Content-Type', 'text/xml');
      res
        .status(400)
        .send(
          htcAccuDataTransform.generateErrorXml(
            validation.error || 'Invalid request'
          )
        );
      return;
    }

    const { city } = req.query as { city: string };

    console.log('[HTC-Accu] Getting weather for city:', city);

    // 调用和风天气API
    const weatherData = await weatherApi.getWeather(city);
    console.log('[HTC-Accu] Weather data received:', weatherData.city?.name);

    // 转换为 HTC 格式并生成 XML
    const htcWeatherData = toHTCAccuWeatherData(weatherData);
    const xml = htcAccuDataTransform.generateWeatherDataXml(
      htcWeatherData,
      city
    );
    console.log('[HTC-Accu] Generated XML length:', xml.length);

    res.set('Content-Type', 'text/xml');
    res.send(xml);
  } catch (error) {
    console.error('[HTC-Accu] Weather data error:', error);
    res.set('Content-Type', 'text/xml');
    res
      .status(500)
      .send(htcAccuDataTransform.generateErrorXml('Internal server error'));
  }
});

export default router;
