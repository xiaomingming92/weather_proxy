/**
 * 华风天气API路由（国行HTC）
 * 适配中国版HTC Sense天气服务
 * 端点：/getweatheru.asmx/getData
 */

import express from 'express';
import weatherApi from '@/services/weather-api.js';
import { htcHuaFengDataTransform } from '@/services/htc/htc-huafeng-data-transform.js';
import {
  HUAFENG_AUTH_CODE,
  HUAFENG_DATA_TYPE,
  HUAFENG_CITY_CODE_MAP,
  type HTCHuaFengWeatherRequest,
} from '@/services/htc/htc-huafeng-types.js';
import { htcHuaFengCache } from '@/services/cache/index.js';

const router = express.Router();

/**
 * 华风天气数据端点
 * GET /getweatheru.asmx/getData?dataType=htc&code=ED926B&sname=01011712
 */
router.get('/getData', async (req, res) => {
  const startTime = Date.now();
  try {
    console.log('[HTC-HuaFeng] Weather request:', req.query);

    const { dataType, code, sname } =
      req.query as unknown as HTCHuaFengWeatherRequest;

    // 验证必要参数
    if (!dataType || !code || !sname) {
      console.log('[HTC-HuaFeng] Missing required parameters');
      res.status(400).send('Missing required parameters');
      return;
    }

    // 验证数据类型和认证码
    if (dataType !== HUAFENG_DATA_TYPE || code !== HUAFENG_AUTH_CODE) {
      console.log('[HTC-HuaFeng] Invalid dataType or code');
      res.status(403).send('Invalid authentication');
      return;
    }

    // 检查缓存
    const cached = await htcHuaFengCache.getWeatherData(sname);
    if (cached) {
      console.log('[HTC-HuaFeng] Cache hit for city:', sname);
      res.set('Content-Type', 'text/xml; charset=utf-8');
      res.set('X-Cache', 'HIT');
      res.send(cached.xmlData);
      return;
    }

    // 城市代码映射（华风代码 -> 城市名称）
    const cityName = HUAFENG_CITY_CODE_MAP[sname] || sname;
    console.log('[HTC-HuaFeng] City code:', sname, '->', cityName);

    // 调用和风天气API获取数据
    let weatherData;
    try {
      weatherData = await weatherApi.getWeather(cityName);
      console.log(
        '[HTC-HuaFeng] Weather data received:',
        weatherData.city?.name
      );
      console.log(
        '[HTC-HuaFeng] Forecast daily count:',
        weatherData.forecast?.daily?.length || 0
      );
      console.log('[HTC-HuaFeng] Daily count:', weatherData.daily?.length || 0);
    } catch (error) {
      console.error('[HTC-HuaFeng] Weather API error:', error);
      // 返回测试数据
      const testXml = htcHuaFengDataTransform.generateTestXml(sname);
      res.set('Content-Type', 'text/xml; charset=utf-8');
      res.set('X-Source', 'test');
      res.send(testXml);
      return;
    }

    // 生成华风天气格式的XML响应
    const xml = htcHuaFengDataTransform.generateHuaFengXml(weatherData, sname);
    console.log('[HTC-HuaFeng] Generated XML length:', xml.length);

    // 存入缓存
    await htcHuaFengCache.createOrUpdateWeatherData(sname, xml, 30);

    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.set('X-Cache', 'MISS');
    res.set('X-Response-Time', `${Date.now() - startTime}ms`);
    res.send(xml);
  } catch (error) {
    console.error('[HTC-HuaFeng] Error:', error);
    const errorXml = htcHuaFengDataTransform.generateErrorXml(
      error instanceof Error ? error.message : 'Internal server error'
    );
    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.status(500).send(errorXml);
  }
});

/**
 * 健康检查端点
 * GET /getweatheru.asmx/health
 */
router.get('/health', async (_req, res) => {
  res.json({
    status: 'ok',
    service: 'htc-huafeng-weather',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 城市代码查询端点
 * GET /getweatheru.asmx/cities
 */
router.get('/cities', async (_req, res) => {
  res.json({
    cities: Object.entries(HUAFENG_CITY_CODE_MAP).map(([code, name]) => ({
      code,
      name,
    })),
  });
});

export default router;
