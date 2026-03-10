/**
 * HTC AccuWeather 活跃城市服务
 * 管理用户真实请求的城市列表
 */

import prisma from '@/config/database.js';

/**
 * 添加或更新活跃城市
 * 当用户请求某个城市的天气时调用
 */
export async function addOrUpdateActiveCity(
  name: string,
  cityId: string,
  longitude?: string,
  latitude?: string
): Promise<void> {
  const now = BigInt(Date.now());

  try {
    await prisma.htcAccuActiveCity.upsert({
      where: { name: name },
      update: {
        cityId: cityId,
        longitude: longitude,
        latitude: latitude,
        lastRequestAt: now,
        requestCount: { increment: 1 },
        updatedAt: now,
      },
      create: {
        name: name,
        cityId: cityId,
        longitude: longitude,
        latitude: latitude,
        lastRequestAt: now,
        requestCount: 1,
        createdAt: now,
        updatedAt: now,
      },
    });

    console.log(
      `[HTC Active City] Added/Updated active city: ${name} (${cityId})`
    );
  } catch (error) {
    console.error('[HTC Active City] Error adding active city:', error);
    throw error;
  }
}

/**
 * 获取所有活跃城市
 * 用于定时同步天气数据
 */
export async function getActiveCities(): Promise<
  Array<{ name: string; cityId: string }>
> {
  try {
    const cities = await prisma.htcAccuActiveCity.findMany({
      select: {
        name: true,
        cityId: true,
      },
      orderBy: {
        lastRequestAt: 'desc',
      },
    });

    return cities.map(city => ({
      name: city.name,
      cityId: city.cityId,
    }));
  } catch (error) {
    console.error('[HTC Active City] Error getting active cities:', error);
    return [];
  }
}

/**
 * 获取活跃城市数量
 */
export async function getActiveCityCount(): Promise<number> {
  try {
    return await prisma.htcAccuActiveCity.count();
  } catch (error) {
    console.error('[HTC Active City] Error getting active city count:', error);
    return 0;
  }
}

/**
 * 清理长时间未请求的城市
 * 删除超过 3 天未请求的城市
 */
export async function cleanupInactiveCities(
  daysThreshold: number = 3
): Promise<number> {
  const now = Date.now();
  const threshold = now - daysThreshold * 24 * 60 * 60 * 1000;
  const thresholdBigInt = BigInt(threshold);

  try {
    const deleted = await prisma.htcAccuActiveCity.deleteMany({
      where: {
        lastRequestAt: {
          lt: thresholdBigInt,
        },
      },
    });

    console.log(
      `[HTC Active City] Cleaned up ${deleted.count} inactive cities (not requested in ${daysThreshold} days)`
    );
    return deleted.count;
  } catch (error) {
    console.error(
      '[HTC Active City] Error cleaning up inactive cities:',
      error
    );
    return 0;
  }
}

/**
 * 获取活跃城市统计数据
 */
export async function getActiveCityStats(): Promise<{
  total: number;
  topCities: Array<{ name: string; requestCount: number }>;
}> {
  try {
    const total = await prisma.htcAccuActiveCity.count();

    const topCities = await prisma.htcAccuActiveCity.findMany({
      select: {
        name: true,
        requestCount: true,
      },
      orderBy: {
        requestCount: 'desc',
      },
      take: 10,
    });

    return {
      total,
      topCities: topCities.map(city => ({
        name: city.name,
        requestCount: city.requestCount,
      })),
    };
  } catch (error) {
    console.error('[HTC Active City] Error getting stats:', error);
    return { total: 0, topCities: [] };
  }
}

export default {
  addOrUpdateActiveCity,
  getActiveCities,
  getActiveCityCount,
  cleanupInactiveCities,
  getActiveCityStats,
};
