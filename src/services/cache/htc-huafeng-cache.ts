// HTC华风天气（国行HTC）专用缓存服务
// 独立于 AccuWeather 国际版和 ZTE 缓存

import prisma from '@/config/database.js';

// HTC华风天气数据缓存接口
interface HTCHuaFengWeatherCache {
  id: number;
  cityCode: string;
  xmlData: string;
  timestamp: bigint;
  expiresAt: bigint;
  cacheDuration: number;
  createdAt: bigint;
  updatedAt: bigint;
}

// HTC华风城市接口
interface HTCHuaFengCity {
  id: number;
  cityCode: string;
  name: string;
  qweatherId: string | null;
  latitude: string | null;
  longitude: string | null;
  province: string | null;
  country: string | null;
  createdAt: bigint;
  updatedAt: bigint;
}

class HTCHuaFengCacheService {
  // ============================================
  // 城市信息缓存
  // ============================================

  async getCityByCode(cityCode: string): Promise<HTCHuaFengCity | null> {
    try {
      // @ts-ignore - Prisma generates camelCase accessor
      return await prisma.hTCHuaFengCity.findUnique({
        where: { cityCode },
      });
    } catch (error) {
      console.error('[HTC-HuaFeng] Error getting city by code:', error);
      return null;
    }
  }

  async getCityByName(name: string): Promise<HTCHuaFengCity | null> {
    try {
      // @ts-ignore - Prisma generates camelCase accessor
      return await prisma.hTCHuaFengCity.findFirst({
        where: { name },
      });
    } catch (error) {
      console.error('[HTC-HuaFeng] Error getting city by name:', error);
      return null;
    }
  }

  async createCity(
    cityCode: string,
    name: string,
    extraInfo?: {
      qweatherId?: string;
      latitude?: string;
      longitude?: string;
      province?: string;
      country?: string;
    }
  ): Promise<HTCHuaFengCity> {
    try {
      const currentTimestamp = BigInt(Date.now());
      // @ts-ignore - Prisma generates camelCase accessor
      return await prisma.hTCHuaFengCity.upsert({
        where: { cityCode },
        update: {
          name,
          ...extraInfo,
          updatedAt: currentTimestamp,
        },
        create: {
          cityCode,
          name,
          ...extraInfo,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        },
      });
    } catch (error) {
      console.error('[HTC-HuaFeng] Error creating city:', error);
      throw error;
    }
  }

  // ============================================
  // 天气数据缓存
  // ============================================

  async getWeatherData(
    cityCode: string
  ): Promise<HTCHuaFengWeatherCache | null> {
    try {
      // @ts-ignore - Prisma generates camelCase accessor
      const weatherData = await prisma.hTCHuaFengWeatherCache.findUnique({
        where: { cityCode },
      });

      // 检查缓存是否过期
      if (weatherData) {
        const currentTimestamp = BigInt(Date.now());
        if (weatherData.expiresAt > currentTimestamp) {
          console.log(`[HTC-HuaFeng] Cache hit for ${cityCode}`);
          return weatherData as HTCHuaFengWeatherCache;
        }
        console.log(`[HTC-HuaFeng] Cache expired for ${cityCode}`);
      }

      return null;
    } catch (error) {
      console.error('[HTC-HuaFeng] Error getting weather data:', error);
      return null;
    }
  }

  async createOrUpdateWeatherData(
    cityCode: string,
    xmlData: string,
    expiresInMinutes: number = 30
  ): Promise<HTCHuaFengWeatherCache> {
    try {
      const timestamp = BigInt(Date.now());
      const expiresAt = timestamp + BigInt(expiresInMinutes * 60 * 1000);

      // @ts-ignore - Prisma generates camelCase accessor
      const weatherData = await prisma.hTCHuaFengWeatherCache.upsert({
        where: { cityCode },
        update: {
          xmlData,
          timestamp,
          expiresAt,
          updatedAt: timestamp,
        },
        create: {
          cityCode,
          xmlData,
          timestamp,
          expiresAt,
          cacheDuration: expiresInMinutes,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });

      console.log(`[HTC-HuaFeng] Cache updated for ${cityCode}`);
      return weatherData as HTCHuaFengWeatherCache;
    } catch (error) {
      console.error(
        '[HTC-HuaFeng] Error creating or updating weather data:',
        error
      );
      throw error;
    }
  }

  // ============================================
  // 缓存策略配置
  // ============================================

  async getCacheDuration(dataType: string = 'default'): Promise<number> {
    try {
      // @ts-ignore - Prisma generates camelCase accessor
      const policy = await prisma.hTCHuaFengCachePolicy.findUnique({
        where: { dataType },
      });

      if (policy) {
        return policy.duration;
      }
    } catch (error) {
      console.error('[HTC-HuaFeng] Error getting cache duration:', error);
    }

    // 默认缓存10分钟
    return 10;
  }

  // ============================================
  // 缓存清理
  // ============================================

  async cleanupExpiredCache(): Promise<void> {
    try {
      const currentTimestamp = BigInt(Date.now());
      // @ts-ignore - Prisma generates camelCase accessor
      const result = await prisma.hTCHuaFengWeatherCache.deleteMany({
        where: {
          expiresAt: { lte: currentTimestamp },
        },
      });
      console.log(
        `[HTC-HuaFeng] Cleaned up ${result.count} expired cache entries`
      );
    } catch (error) {
      console.error('[HTC-HuaFeng] Error cleaning up expired cache:', error);
    }
  }

  async clearWeatherData(
    beforeTimestamp?: bigint
  ): Promise<{ deletedCount: number }> {
    try {
      let result;
      if (beforeTimestamp) {
        // @ts-ignore - Prisma generates camelCase accessor
        result = await prisma.hTCHuaFengWeatherCache.deleteMany({
          where: {
            createdAt: { lte: beforeTimestamp },
          },
        });
      } else {
        // @ts-ignore - Prisma generates camelCase accessor
        result = await prisma.hTCHuaFengWeatherCache.deleteMany({});
      }
      console.log(`[HTC-HuaFeng] Deleted ${result.count} weather data records`);
      return { deletedCount: result.count };
    } catch (error) {
      console.error('[HTC-HuaFeng] Error clearing weather data:', error);
      throw error;
    }
  }

  // ============================================
  // 获取有缓存的城市列表
  // ============================================

  async getCitiesWithCache(): Promise<HTCHuaFengCity[]> {
    const cities: HTCHuaFengCity[] = [];
    try {
      const currentTimestamp = BigInt(Date.now());
      // @ts-ignore - Prisma generates camelCase accessor
      const weatherData = await prisma.hTCHuaFengWeatherCache.findMany({
        where: {
          expiresAt: { gt: currentTimestamp },
        },
        select: {
          cityCode: true,
        },
        distinct: ['cityCode'],
      });

      for (const data of weatherData) {
        // @ts-ignore - Prisma generates camelCase accessor
        const city = await prisma.hTCHuaFengCity.findUnique({
          where: { cityCode: data.cityCode },
        });
        if (city) {
          cities.push(city);
        }
      }
    } catch (error) {
      console.error('[HTC-HuaFeng] Error getting cities with cache:', error);
    }
    return cities;
  }

  // ============================================
  // 批量导入城市数据
  // ============================================

  async batchImportCities(
    cities: Array<{
      cityCode: string;
      name: string;
      qweatherId?: string;
      latitude?: string;
      longitude?: string;
      province?: string;
    }>
  ): Promise<{ imported: number; errors: number }> {
    let imported = 0;
    let errors = 0;

    for (const city of cities) {
      try {
        await this.createCity(city.cityCode, city.name, {
          qweatherId: city.qweatherId,
          latitude: city.latitude,
          longitude: city.longitude,
          province: city.province,
        });
        imported++;
      } catch (error) {
        console.error(
          `[HTC-HuaFeng] Error importing city ${city.cityCode}:`,
          error
        );
        errors++;
      }
    }

    console.log(
      `[HTC-HuaFeng] Batch import completed: ${imported} imported, ${errors} errors`
    );
    return { imported, errors };
  }
}

// 导出单例实例
export default new HTCHuaFengCacheService();
