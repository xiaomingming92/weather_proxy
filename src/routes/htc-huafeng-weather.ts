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

// 强制刷新追踪器：记录每个城市的点击时间
const refreshTracker: Map<string, number[]> = new Map();
const REFRESH_WINDOW_MS = 10000; // 10秒窗口
const REFRESH_MIN_THRESHOLD = 3; // 最少3次点击触发强制刷新
const REFRESH_MAX_THRESHOLD = 5; // 最多5次点击，超过则视为攻击，继续使用缓存

/**
 * 检查是否需要强制刷新
 * @param cityCode 城市代码
 * @returns 是否需要强制刷新
 */
function shouldForceRefresh(cityCode: string): boolean {
  const now = Date.now();
  const clicks = refreshTracker.get(cityCode) || [];

  // 清理过期的点击记录
  const validClicks = clicks.filter(time => now - time < REFRESH_WINDOW_MS);

  // 添加当前点击
  validClicks.push(now);
  refreshTracker.set(cityCode, validClicks);

  // 超过最大阈值，视为攻击，继续使用缓存
  if (validClicks.length > REFRESH_MAX_THRESHOLD) {
    console.log(
      `[HTC-HuaFeng] Too many requests for ${cityCode} (${validClicks.length} clicks), using cache`
    );
    return false;
  }

  // 检查是否在有效范围内（3-5次）
  if (
    validClicks.length >= REFRESH_MIN_THRESHOLD &&
    validClicks.length <= REFRESH_MAX_THRESHOLD
  ) {
    console.log(
      `[HTC-HuaFeng] Force refresh triggered for ${cityCode} (${validClicks.length} clicks in ${REFRESH_WINDOW_MS}ms)`
    );
    // 清空记录，防止连续触发
    refreshTracker.delete(cityCode);
    return true;
  }

  return false;
}

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

    // 检查是否需要强制刷新（10秒内点击3次）
    const forceRefresh = shouldForceRefresh(sname);

    // 检查缓存
    const cached = await htcHuaFengCache.getWeatherData(sname);
    if (cached && !forceRefresh) {
      console.log('[HTC-HuaFeng] Cache hit for city:', sname);
      res.set('Content-Type', 'text/xml; charset=utf-8');
      res.set('X-Cache', 'HIT');
      res.send(cached.xmlData);
      return;
    }

    if (forceRefresh) {
      console.log('[HTC-HuaFeng] Force refresh for city:', sname);
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

    // 获取缓存时长并存入缓存
    const cacheDuration = await htcHuaFengCache.getCacheDuration('default');
    await htcHuaFengCache.createOrUpdateWeatherData(sname, xml, cacheDuration);

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
