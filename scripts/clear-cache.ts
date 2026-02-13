/*
 * @Author       : Z2-WIN\xmm wujixmm@gmail.com
 * @Date         : 2026-02-13 09:54:44
 * @LastEditors  : Z2-WIN\xmm wujixmm@gmail.com
 * @LastEditTime : 2026-02-13 10:02:26
 * @FilePath     : \decompile\weather_proxy\scripts\clear-cache.ts
 * @Description  :
 */
import prismaCache from '../src/services/prisma-cache.js';

async function clearCache() {
  try {
    console.log('Clearing all weather data cache...');
    const result = await prismaCache.clearWeatherData();
    console.log(`Deleted ${result.deletedCount} records`);
    process.exit(0);
  } catch (error) {
    console.error('Error clearing cache:', error);
    process.exit(1);
  }
}

clearCache();
