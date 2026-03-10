/**
 * HTC AccuWeather 城市列表缓存服务
 * 每 3 天从和风天气 API 拉取城市数据，缓存到数据库
 */

import prisma from '@/config/database.js';
import axios from 'axios';

/**
 * 从和风天气 API 获取城市列表并缓存到数据库
 */
export async function syncCityListFromAPI(): Promise<number> {
  console.log(
    '[HTC Accu City Sync] Starting city list sync from QWeather API...'
  );

  try {
    const cities = await getRealCityListFromAPI();

    // 批量插入/更新城市数据
    let updatedCount = 0;
    const now = BigInt(Date.now());

    for (const city of cities) {
      try {
        await prisma.htcAccuCity.upsert({
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
            country: '中国',
            state: '',
            createdAt: now,
            updatedAt: now,
          },
        });
        updatedCount++;
      } catch (error) {
        console.error(
          `[HTC Accu City Sync] Failed to sync city ${city.name}:`,
          error
        );
      }
    }

    console.log(
      `[HTC Accu City Sync] Successfully synced ${updatedCount} cities`
    );
    return updatedCount;
  } catch (error) {
    console.error('[HTC Accu City Sync] Failed to sync city list:', error);
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
  console.log(
    '[HTC Accu City Sync] Fetching city list from QWeather GitHub...'
  );

  try {
    // 下载和风天气的中国城市代码 CSV
    const csvUrl =
      'https://raw.githubusercontent.com/qwd/LocationList/master/China-City-List-latest.csv';

    const response = await axios.get(csvUrl, {
      responseType: 'text',
    });

    const cities = parseCSV(response.data);
    console.log(`[HTC Accu City Sync] Parsed ${cities.length} cities from CSV`);

    return cities;
  } catch (error) {
    console.error('[HTC Accu City Sync] Failed to fetch city list:', error);
    throw error;
  }
}

/**
 * 解析 CSV 文件
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

    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 7) continue;

    const columns = matches.map(m => m.replace(/^"|"$/g, '').trim());

    const cityId = columns[0];
    const cityName = columns[2];
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

export default {
  syncCityListFromAPI,
};
