// HTC 专用缓存服务
// 独立于 ZTE 缓存，使用 HtcWeatherCache 表

import prisma from '@/config/database.js';

// HTC 天气数据缓存接口
interface HtcWeatherCache {
  id: number;
  cityId: string;
  endpoint: string;
  xmlData: string;
  timestamp: bigint;
  expiresAt: bigint;
  cacheDuration: number;
  createdAt: bigint;
  updatedAt: bigint;
}

// HTC 城市接口
interface HtcCity {
  id: number;
  name: string;
  cityId: string;
  latitude: string | null;
  longitude: string | null;
  country: string | null;
  state: string | null;
  createdAt: bigint;
  updatedAt: bigint;
}

class HtcCacheService {
  // ============================================
  // 城市信息缓存
  // ============================================

  async getCityByName(name: string): Promise<HtcCity | null> {
    try {
      return await prisma.htcCity.findUnique({
        where: { name },
      });
    } catch (error) {
      console.error('[HTC] Error getting city by name:', error);
      return null;
    }
  }

  async getCityById(cityId: string): Promise<HtcCity | null> {
    try {
      return await prisma.htcCity.findUnique({
        where: { cityId },
      });
    } catch (error) {
      console.error('[HTC] Error getting city by id:', error);
      return null;
    }
  }

  async createCity(
    name: string,
    cityId: string,
    extraInfo?: {
      latitude?: string;
      longitude?: string;
      country?: string;
      state?: string;
    }
  ): Promise<HtcCity> {
    try {
      const currentTimestamp = BigInt(Date.now());
      return await prisma.htcCity.upsert({
        where: { name },
        update: {
          cityId,
          ...extraInfo,
          updatedAt: currentTimestamp,
        },
        create: {
          name,
          cityId,
          ...extraInfo,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        },
      });
    } catch (error) {
      console.error('[HTC] Error creating city:', error);
      throw error;
    }
  }

  // ============================================
  // 天气数据缓存
  // ============================================

  async getWeatherData(
    cityId: string,
    endpoint: string
  ): Promise<HtcWeatherCache | null> {
    try {
      const weatherData = await prisma.htcWeatherCache.findUnique({
        where: {
          cityId_endpoint: { cityId, endpoint },
        },
      });

      // 检查缓存是否过期
      if (weatherData) {
        const currentTimestamp = BigInt(Date.now());
        if (weatherData.expiresAt > currentTimestamp) {
          console.log(`[HTC] Cache hit for ${cityId}/${endpoint}`);
          return weatherData as HtcWeatherCache;
        }
        console.log(`[HTC] Cache expired for ${cityId}/${endpoint}`);
      }

      return null;
    } catch (error) {
      console.error('[HTC] Error getting weather data:', error);
      return null;
    }
  }

  async createOrUpdateWeatherData(
    cityId: string,
    endpoint: string,
    xmlData: string,
    expiresInMinutes: number
  ): Promise<HtcWeatherCache> {
    try {
      const timestamp = BigInt(Date.now());
      const expiresAt = timestamp + BigInt(expiresInMinutes * 60 * 1000);

      const weatherData = await prisma.htcWeatherCache.upsert({
        where: {
          cityId_endpoint: { cityId, endpoint },
        },
        update: {
          xmlData,
          timestamp,
          expiresAt,
          updatedAt: timestamp,
        },
        create: {
          cityId,
          endpoint,
          xmlData,
          timestamp,
          expiresAt,
          cacheDuration: expiresInMinutes,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });

      console.log(`[HTC] Cache updated for ${cityId}/${endpoint}`);
      return weatherData as HtcWeatherCache;
    } catch (error) {
      console.error('[HTC] Error creating or updating weather data:', error);
      throw error;
    }
  }

  // ============================================
  // 缓存策略配置
  // ============================================

  async getCacheDuration(endpoint: string): Promise<number> {
    try {
      // 天气预报缓存（30分钟）
      if (endpoint === 'forecast-data_v3') {
        return 30;
      }

      // 城市搜索缓存（24小时）
      if (endpoint === 'city-find') {
        return 1440;
      }

      // 经纬度搜索缓存（1小时）
      if (endpoint === 'lat-lon-search') {
        return 60;
      }

      // 天气数据缓存（30分钟）
      if (endpoint === 'weather-data') {
        return 30;
      }

      // 默认缓存时间（30分钟）
      return 30;
    } catch (error) {
      console.error('[HTC] Error getting cache duration:', error);
      return 30;
    }
  }

  // ============================================
  // 缓存清理
  // ============================================

  async cleanupExpiredCache(): Promise<void> {
    try {
      const currentTimestamp = BigInt(Date.now());
      const result = await prisma.htcWeatherCache.deleteMany({
        where: {
          expiresAt: { lte: currentTimestamp },
        },
      });
      console.log(`[HTC] Cleaned up ${result.count} expired cache entries`);
    } catch (error) {
      console.error('[HTC] Error cleaning up expired cache:', error);
    }
  }

  async clearWeatherData(
    beforeTimestamp?: bigint
  ): Promise<{ deletedCount: number }> {
    try {
      let result;
      if (beforeTimestamp) {
        result = await prisma.htcWeatherCache.deleteMany({
          where: {
            createdAt: { lte: beforeTimestamp },
          },
        });
      } else {
        result = await prisma.htcWeatherCache.deleteMany({});
      }
      console.log(`[HTC] Deleted ${result.count} weather data records`);
      return { deletedCount: result.count };
    } catch (error) {
      console.error('[HTC] Error clearing weather data:', error);
      throw error;
    }
  }

  // ============================================
  // 获取有预报缓存的城市列表
  // ============================================

  async getCitiesWithForecastCache(): Promise<HtcCity[]> {
    const cities: HtcCity[] = [];
    try {
      const currentTimestamp = BigInt(Date.now());
      const weatherData = await prisma.htcWeatherCache.findMany({
        where: {
          endpoint: 'forecast-data_v3',
          expiresAt: { gt: currentTimestamp },
        },
        select: {
          cityId: true,
        },
        distinct: ['cityId'],
      });

      for (const data of weatherData) {
        const city = await prisma.htcCity.findUnique({
          where: { cityId: data.cityId },
        });
        if (city) {
          cities.push(city);
        }
      }
    } catch (error) {
      console.error('[HTC] Error getting cities with forecast cache:', error);
    }
    return cities;
  }
}

// 导出单例实例
export default new HtcCacheService();
