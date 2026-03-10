/**
 * ZTE V880+ 专用路由
 * 独立于 HTC 系列，专为 ZTE V880+ WeatherTV 和 WeatherWidget 服务
 */

import express from 'express';
import weatherApi from '@/services/weather-api.js';
import dataTransform from '@/services/zte/data-transform.js';
import cache from '@/services/cache.js';
import { zteCache } from '@/services/cache/index.js';
import citySync from '@/services/zte/city-sync.js';
import { DataType, AppType } from '@/types/index.js';
import type { ZteWeatherData } from '@/types/zte.js';
import axios from 'axios';
import { config } from '@/config/index.js';
import iconv from 'iconv-lite';

const router = express.Router();

// ============================================
// 城市列表数据（静态缓存，避免频繁加载）
// ============================================
const cityListXml: string | null = null;
const cityListLoadedAt: Date | null = null;

/**
 * 生成城市列表（逗号分隔格式）
 * 优先从数据库缓存获取，如果没有则实时从 API 拉取并缓存
 */
async function generateCityList(): Promise<string> {
  console.log('Generating city list...');

  try {
    // 检查数据库是否有缓存
    const hasData = await citySync.hasCityData();

    if (hasData) {
      // 从数据库获取
      const cityList = await citySync.getCityListFromDB();
      const count = await citySync.getCityCount();
      console.log(`Retrieved ${count} cities from database`);
      return cityList;
    } else {
      // 数据库没有数据，实时从 API 拉取并缓存
      console.log('No city data in database, fetching from API...');
      const cities = await citySync.syncCityListFromAPI();
      console.log(`Synced ${cities} cities from API to database`);

      // 从数据库返回
      return await citySync.getCityListFromDB();
    }
  } catch (error) {
    console.error('Failed to get city list, using fallback:', error);
    // API 失败时使用备用列表
    const fallbackCities = getFallbackCityNames();
    return fallbackCities.join(',');
  }
}

/**
 * 获取备用城市名称列表
 */
function getFallbackCityNames(): string[] {
  return [
    '北京',
    '上海',
    '广州',
    '深圳',
    '海淀',
    '朝阳',
    '杭州',
    '扬州',
    '武汉',
    '重庆',
    '长沙',
    '厦门',
    '贵阳',
    '昆明',
    '成都',
    '济南',
    '西安',
    '郑州',
    '太原',
    '天津',
    '沈阳',
    '长春',
    '哈尔滨',
    '福州',
    '南宁',
    '海口',
    '南昌',
    '石家庄',
    '合肥',
    '兰州',
    '银川',
    '西宁',
    '呼和浩特',
    '乌鲁木齐',
  ];
}

/**
 * 备用城市列表（API 失败时使用）
 * 包含中国主要城市（直辖市、省会、计划单列市）
 */
function getFallbackCityList(): string {
  const fallbackCities = [
    { id: '101010100', name: '北京', lat: '116.46', lon: '39.92' },
    { id: '101020100', name: '上海', lat: '121.48', lon: '31.22' },
    { id: '101280601', name: '广州', lat: '113.23', lon: '23.16' },
    { id: '101280101', name: '深圳', lat: '114.07', lon: '22.62' },
    { id: '101010200', name: '海淀', lat: '116.29', lon: '39.99' },
    { id: '101010300', name: '朝阳', lat: '116.44', lon: '39.92' },
    { id: '101330101', name: '杭州', lat: '120.19', lon: '30.27' },
    { id: '101190101', name: '南京', lat: '118.78', lon: '32.07' },
    { id: '101180101', name: '武汉', lat: '114.31', lon: '30.52' },
    { id: '101040100', name: '重庆', lat: '106.55', lon: '29.56' },
    { id: '101270101', name: '长沙', lat: '113.00', lon: '28.21' },
    { id: '101230201', name: '厦门', lat: '118.09', lon: '24.48' },
    { id: '101250101', name: '贵阳', lat: '106.71', lon: '26.58' },
    { id: '101290101', name: '昆明', lat: '102.73', lon: '25.04' },
    { id: '101200101', name: '成都', lat: '104.07', lon: '30.67' },
    { id: '101120101', name: '济南', lat: '116.99', lon: '36.67' },
    { id: '101100101', name: '西安', lat: '108.95', lon: '34.27' },
    { id: '101090101', name: '郑州', lat: '113.65', lon: '34.76' },
    { id: '101080101', name: '太原', lat: '112.53', lon: '37.87' },
    { id: '101030100', name: '天津', lat: '117.20', lon: '39.13' },
    { id: '101050101', name: '沈阳', lat: '123.43', lon: '41.80' },
    { id: '101060101', name: '长春', lat: '125.35', lon: '43.88' },
    { id: '101070101', name: '哈尔滨', lat: '126.63', lon: '45.75' },
    { id: '101210101', name: '福州', lat: '119.30', lon: '26.08' },
    { id: '101220101', name: '南宁', lat: '108.37', lon: '22.82' },
    { id: '101300101', name: '海口', lat: '110.33', lon: '20.03' },
    { id: '101240101', name: '南昌', lat: '115.89', lon: '28.68' },
    { id: '101110101', name: '石家庄', lat: '114.48', lon: '38.03' },
    { id: '101340101', name: '合肥', lat: '117.27', lon: '31.86' },
    { id: '101140101', name: '兰州', lat: '103.83', lon: '36.07' },
    { id: '101150101', name: '银川', lat: '106.27', lon: '38.47' },
    { id: '101160101', name: '西宁', lat: '101.74', lon: '36.72' },
    { id: '101170101', name: '呼和浩特', lat: '111.67', lon: '40.82' },
    { id: '101130101', name: '乌鲁木齐', lat: '87.68', lon: '43.77' },
  ];

  let xml = '<?xml version="1.0" encoding="utf-8"?>\n<CityList>\n';

  for (const city of fallbackCities) {
    xml += `  <Station>
    <Stationid>${city.id}</Stationid>
    <Stationname>${city.name}</Stationname>
    <Postcode></Postcode>
    <Longitude>${city.lon}</Longitude>
    <Latitude>${city.lat}</Latitude>
    <Sunrise>06:00</Sunrise>
    <Sunset>18:00</Sunset>
  </Station>
`;
  }

  xml += '</CityList>';
  return xml;
}

// ============================================
// 处理天气数据请求的共用函数
// ============================================
async function handleWeatherDataRequest(
  req: express.Request,
  res: express.Response
): Promise<void> {
  // WeatherTV 使用 GBK 编码，需要解码
  let { dataType, sname, code } = req.body;

  // 尝试解码 GBK 编码的中文
  try {
    if (sname && sname.includes('??')) {
      // 获取原始 buffer 并解码为 GBK
      const rawBody = (req as any).rawBody;
      if (rawBody) {
        const decodedBody = iconv.decode(rawBody, 'gbk');
        const params = new URLSearchParams(decodedBody);
        dataType = params.get('dataType') || dataType;
        sname = params.get('sname') || sname;
        code = params.get('code') || code;
        console.log('Decoded GBK body:', { dataType, sname, code });
      }
    }
  } catch (error) {
    console.error('GBK decode error:', error);
  }

  console.log('WeatherTV /getData Request:', { dataType, sname, code });

  // 检查必要参数
  if (!dataType) {
    console.log('Missing dataType parameter');
    res.status(400).send('<error>Missing dataType parameter</error>');
    return;
  }

  if (!sname) {
    console.log('Missing sname parameter');
    res.status(400).send('<error>Missing sname parameter</error>');
    return;
  }

  // 识别应用类型
  let appType: AppType = AppType.WEATHER_TV;
  if (code === '50532E') {
    appType = AppType.WEATHER_WIDGET;
  } else if (code === '1D765B') {
    appType = AppType.WEATHER_TV;
  }
  console.log('Identified app type:', appType);

  // 通过城市名称获取城市 ID
  let actualCityId: string;
  try {
    const cityInfo = await weatherApi.getWeather(sname);
    if (!cityInfo.city) {
      console.log('City info not found for:', sname);
      res.status(404).send('<error>City not found</error>');
      return;
    }
    actualCityId = cityInfo.city.id;
  } catch (error) {
    console.error('Failed to get city info:', error);
    res.status(500).send('<error>Failed to get city info</error>');
    return;
  }

  // 检查数据库缓存
  const cachedWeatherData = await zteCache.getWeatherData(
    actualCityId,
    dataType
  );
  if (cachedWeatherData) {
    console.log('Returning cached data for', actualCityId, dataType);
    res.set('Content-Type', 'application/xml');
    res.send(cachedWeatherData.xmlData);
    return;
  }

  // 检查内存缓存
  const cacheKey = `${sname}_${dataType}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log('Returning memory cached data for', cacheKey);
    // 更新数据库缓存
    const cacheDuration = await zteCache.getCacheDuration(dataType);
    await zteCache.createOrUpdateWeatherData(
      actualCityId,
      dataType,
      cachedData,
      cacheDuration
    );

    res.set('Content-Type', 'application/xml');
    res.send(cachedData);
    return;
  }

  // 调用和风天气 API
  console.log('Calling weather API for', sname);
  let weatherData: ZteWeatherData;
  try {
    const apiData = await weatherApi.getWeather(sname);

    // 确保数据符合 ZteWeatherData 格式
    weatherData = {
      now: apiData.now,
      forecast: apiData.forecast || {
        daily: [],
        updateTime: new Date().toISOString(),
      },
      hourly: apiData.hourly,
      indices: apiData.indices,
      city: apiData.city || { id: actualCityId, name: sname },
      updateTime: apiData.updateTime,
    };
    console.log('Weather API response received successfully');
  } catch (error) {
    console.error('Weather API failed after retries:', error);
    // 返回默认数据，避免客户端 FC
    weatherData = {
      now: {
        temp: '0',
        icon: '100',
        text: 'Unknown',
        humidity: '0',
        pressure: '0',
        windDir: '0',
        windSpeed: '0',
        windScale: '0',
        obsTime: new Date().toISOString(),
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
        name: sname,
      },
    };
    console.log('Using default weather data');
  }

  // 转换数据格式
  console.log('Transforming data for', dataType, 'and app type', appType);
  const xmlData = dataTransform.toWidgetXml(weatherData, dataType, appType);
  console.log('Data transformed successfully, XML length:', xmlData.length);

  // 缓存数据到内存
  cache.set(cacheKey, xmlData);
  console.log('Data cached in memory for', cacheKey);

  // 缓存数据到数据库
  const cacheDuration = await zteCache.getCacheDuration(dataType);
  await zteCache.createOrUpdateWeatherData(
    actualCityId,
    dataType,
    xmlData,
    cacheDuration
  );
  console.log('Data cached in database for', actualCityId, dataType);

  res.set('Content-Type', 'application/xml');
  res.send(xmlData);
}

// ============================================
// 路由处理
// ============================================

/**
 * POST /zte/getweatheru.asmx/getData
 * WeatherTV 主天气数据接口
 */
router.post('/getData', async (req, res) => {
  try {
    await handleWeatherDataRequest(req, res);
  } catch (error) {
    console.error('Error in /getData:', error);
    res.status(500).send('<error>Internal server error</error>');
  }
});

/**
 * POST /zte/getweatheru.asmx/getStationList
 * 城市列表接口（POST 方式）
 * WeatherTV 期望返回：逗号分隔的城市名字符串
 */
router.post('/getStationList', async (req, res) => {
  try {
    const { flag } = req.body;
    console.log('City List POST Request:', { flag });

    if (flag === 'allcity') {
      const cityList = await generateCityList();
      res.set('Content-Type', 'text/plain');
      res.send(cityList);
      return;
    }

    res.status(400).send('error');
  } catch (error) {
    console.error('Error in /getStationList POST:', error);
    res.status(500).send('error');
  }
});

/**
 * GET /zte/getweatheru.asmx/getStationList
 * 城市列表接口（GET 方式，WeatherWidget 下载用）
 */
router.get('/getStationList', async (req, res) => {
  try {
    console.log('City List GET Request');
    const cityList = await generateCityList();
    res.set('Content-Type', 'text/plain');
    res.send(cityList);
  } catch (error) {
    console.error('Error in /getStationList GET:', error);
    res.status(500).send('error');
  }
});

export default router;
