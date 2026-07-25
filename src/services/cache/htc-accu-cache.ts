// HTC AccuWeather 国际版专用缓存服务
// 独立于 ZTE 缓存和 HTC HuaFeng 缓存

import prisma from '@/config/database.js';

// HTC AccuWeather 天气数据缓存接口
interface HTCAccuWeatherCache {
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

// HTC AccuWeather 城市接口
interface HTCAccuCity {
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

class HTCAccuCacheService {
  // ============================================
  // 城市信息缓存
  // ============================================

  async getCityByName(name: string): Promise<HTCAccuCity | null> {
    try {
      return await prisma.htcAccuCity.findUnique({
        where: { name },
      });
    } catch (error) {
      console.error('[HTC-Accu] Error getting city by name:', error);
      return null;
    }
  }

  async getCityById(cityId: string): Promise<HTCAccuCity | null> {
    try {
      return await prisma.htcAccuCity.findUnique({
        where: { cityId },
      });
    } catch (error) {
      console.error('[HTC-Accu] Error getting city by id:', error);
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
  ): Promise<HTCAccuCity> {
    try {
      const currentTimestamp = BigInt(Date.now());
      return await prisma.htcAccuCity.upsert({
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
      console.error('[HTC-Accu] Error creating city:', error);
      throw error;
    }
  }

  // ============================================
  // 天气数据缓存
  // ============================================

  async getWeatherData(
    cityId: string,
    endpoint: string
  ): Promise<HTCAccuWeatherCache | null> {
    try {
      const weatherData = await prisma.htcAccuWeatherCache.findUnique({
        where: {
          cityId_endpoint: { cityId, endpoint },
        },
      });

      // 检查缓存是否过期
      if (weatherData) {
        const currentTimestamp = BigInt(Date.now());
        if (weatherData.expiresAt > currentTimestamp) {
          console.log(`[HTC-Accu] Cache hit for ${cityId}/${endpoint}`);
          return weatherData as HTCAccuWeatherCache;
        }
        console.log(`[HTC-Accu] Cache expired for ${cityId}/${endpoint}`);
      }

      return null;
    } catch (error) {
      console.error('[HTC-Accu] Error getting weather data:', error);
      return null;
    }
  }

  async createOrUpdateWeatherData(
    cityId: string,
    endpoint: string,
    xmlData: string,
    expiresInMinutes: number
  ): Promise<HTCAccuWeatherCache> {
    try {
      const timestamp = BigInt(Date.now());
      const expiresAt = timestamp + BigInt(expiresInMinutes * 60 * 1000);

      const weatherData = await prisma.htcAccuWeatherCache.upsert({
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

      console.log(`[HTC-Accu] Cache updated for ${cityId}/${endpoint}`);
      return weatherData as HTCAccuWeatherCache;
    } catch (error) {
      console.error(
        '[HTC-Accu] Error creating or updating weather data:',
        error
      );
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
      console.error('[HTC-Accu] Error getting cache duration:', error);
      return 30;
    }
  }

  // ============================================
  // 缓存清理
  // ============================================

  async cleanupExpiredCache(): Promise<void> {
    try {
      const currentTimestamp = BigInt(Date.now());
      const result = await prisma.htcAccuWeatherCache.deleteMany({
        where: {
          expiresAt: { lte: currentTimestamp },
        },
      });
      console.log(
        `[HTC-Accu] Cleaned up ${result.count} expired cache entries`
      );
    } catch (error) {
      console.error('[HTC-Accu] Error cleaning up expired cache:', error);
    }
  }

  async clearWeatherData(
    beforeTimestamp?: bigint
  ): Promise<{ deletedCount: number }> {
    try {
      let result;
      if (beforeTimestamp) {
        result = await prisma.htcAccuWeatherCache.deleteMany({
          where: {
            createdAt: { lte: beforeTimestamp },
          },
        });
      } else {
        result = await prisma.htcAccuWeatherCache.deleteMany({});
      }
      console.log(`[HTC-Accu] Deleted ${result.count} weather data records`);
      return { deletedCount: result.count };
    } catch (error) {
      console.error('[HTC-Accu] Error clearing weather data:', error);
      throw error;
    }
  }

  // ============================================
  // 获取有预报缓存的城市列表
  // ============================================

  async getCitiesWithForecastCache(): Promise<HTCAccuCity[]> {
    const cities: HTCAccuCity[] = [];
    try {
      const currentTimestamp = BigInt(Date.now());
      const weatherData = await prisma.htcAccuWeatherCache.findMany({
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
        const city = await prisma.htcAccuCity.findUnique({
          where: { cityId: data.cityId },
        });
        if (city) {
          cities.push(city);
        }
      }
    } catch (error) {
      console.error(
        '[HTC-Accu] Error getting cities with forecast cache:',
        error
      );
    }
    return cities;
  }
}

// 导出单例实例
export default new HTCAccuCacheService();
