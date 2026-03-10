/**
 * ZTE 城市列表缓存服务
 * 每天定时从和风天气 API 拉取城市数据，缓存到数据库
 */

import prisma from '@/config/database.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * 从和风天气 API 获取城市列表并缓存到数据库
 */
export async function syncCityListFromAPI(): Promise<number> {
  console.log('[ZTE City Sync] Starting city list sync from QWeather API...');

  try {
    const cities = await getRealCityListFromAPI();

    // 批量插入/更新城市数据
    let updatedCount = 0;
    const now = BigInt(Date.now());

    for (const city of cities) {
      try {
        await prisma.zteCity.upsert({
          where: { name: city.name },
          update: {
            cityId: city.id,
            latitude: city.lat,
            longitude: city.lon,
            updatedAt: now,
          },
          create: {
            name: city.name,
            cityId: city.id,
            latitude: city.lat,
            longitude: city.lon,
            stationId: city.id, // 使用和风城市 ID 作为站点 ID
            sunrise: '06:00', // 默认值
            sunset: '18:00',
            createdAt: now,
            updatedAt: now,
          },
        });
        updatedCount++;
      } catch (error) {
        console.error(
          `[ZTE City Sync] Failed to sync city ${city.name}:`,
          error
        );
      }
    }

    console.log(`[ZTE City Sync] Successfully synced ${updatedCount} cities`);
    return updatedCount;
  } catch (error) {
    console.error('[ZTE City Sync] Failed to sync city list:', error);
    throw error;
  }
}

/**
 * 从和风天气 API 获取真实城市列表
 * 使用和风天气提供的城市代码 CSV 文件
 */
async function getRealCityListFromAPI(): Promise<
  Array<{ name: string; id: string; lat: string; lon: string }>
> {
  console.log('[ZTE City Sync] Fetching city list from QWeather GitHub...');

  try {
    // 下载和风天气的中国城市代码 CSV
    // 正确的 GitHub URL
    const csvUrl =
      'https://raw.githubusercontent.com/qwd/LocationList/master/China-City-List-latest.csv';

    const response = await axios.get(csvUrl, {
      responseType: 'text',
    });

    const cities = parseCSV(response.data);
    console.log(`[ZTE City Sync] Parsed ${cities.length} cities from CSV`);

    return cities;
  } catch (error) {
    console.error('[ZTE City Sync] Failed to fetch city list:', error);
    throw error;
  }
}

/**
 * 解析 CSV 文件
 * CSV 格式：ID,City,CN,Province,En,Lat,Lon,Alt
 * 例如：101010100，北京，北京，中国，Beijing，39.9042，116.4074，51
 */
function parseCSV(
  csvContent: string
): Array<{ name: string; id: string; lat: string; lon: string }> {
  const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
  const cities: Array<{ name: string; id: string; lat: string; lon: string }> =
    [];

  // 跳过标题行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 解析 CSV 行（处理引号内的逗号）
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 7) continue;

    // 移除引号
    const columns = matches.map(m => m.replace(/^"|"$/g, '').trim());

    // CSV 列：ID,City,CN,Province,En,Lat,Lon,Alt
    const cityId = columns[0];
    const cityName = columns[2]; // 使用中文名
    const lat = columns[5];
    const lon = columns[6];

    if (cityId && cityName && lat && lon) {
      cities.push({
        name: cityName,
        id: cityId,
        lat: lat,
        lon: lon,
      });
    }
  }

  return cities;
}

/**
 * 从数据库获取城市列表（逗号分隔格式）
 */
export async function getCityListFromDB(): Promise<string> {
  try {
    const cities = await prisma.zteCity.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    const cityNames = cities.map((city: { name: string }) => city.name);
    return cityNames.join(',');
  } catch (error) {
    console.error('[ZTE City DB] Failed to get city list:', error);
    throw error;
  }
}

/**
 * 检查数据库是否有城市数据
 */
export async function hasCityData(): Promise<boolean> {
  try {
    const count = await prisma.zteCity.count();
    return count > 0;
  } catch (error) {
    console.error('[ZTE City DB] Failed to check city data:', error);
    return false;
  }
}

/**
 * 获取城市数量
 */
export async function getCityCount(): Promise<number> {
  try {
    return await prisma.zteCity.count();
  } catch (error) {
    console.error('[ZTE City DB] Failed to get city count:', error);
    return 0;
  }
}

export default {
  syncCityListFromAPI,
  getCityListFromDB,
  hasCityData,
  getCityCount,
};
