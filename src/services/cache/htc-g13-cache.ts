// HTC G13 新天气 App 专用缓存服务
// 使用 JSON 格式存储，不使用 XML

import prisma from '@/config/database.js';

// HTC G13 天气数据缓存接口
interface HtcG13WeatherCache {
  id: number;
  cityId: string;
  jsonData: string;
  timestamp: bigint;
  expiresAt: bigint;
  cacheDuration: number;
  createdAt: bigint;
  updatedAt: bigint;
}

// HTC G13 城市接口
interface HtcG13City {
  id: number;
  name: string;
  cityId: string;
  latitude: string | null;
  longitude: string | null;
  adm1: string | null;
  createdAt: bigint;
  updatedAt: bigint;
}

class HtcG13CacheService {
  // ============================================
  // 城市信息缓存
  // ============================================

  async getCityByName(name: string): Promise<HtcG13City | null> {
    try {
      return (await prisma.htcG13City.findUnique({
        where: { name },
      })) as HtcG13City | null;
    } catch (error) {
      console.error('[HTC-G13] Error getting city by name:', error);
      return null;
    }
  }

  async getCityById(cityId: string): Promise<HtcG13City | null> {
    try {
      return (await prisma.htcG13City.findUnique({
        where: { cityId },
      })) as HtcG13City | null;
    } catch (error) {
      console.error('[HTC-G13] Error getting city by id:', error);
      return null;
    }
  }

  async createCity(
    name: string,
    cityId: string,
    extraInfo?: {
      latitude?: string;
      longitude?: string;
      adm1?: string;
    }
  ): Promise<HtcG13City> {
    try {
      const currentTimestamp = BigInt(Date.now());
      return (await prisma.htcG13City.upsert({
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
      })) as HtcG13City;
    } catch (error) {
      console.error('[HTC-G13] Error creating city:', error);
      throw error;
    }
  }

  // ============================================
  // 天气数据缓存
  // ============================================

  async getWeatherData(cityId: string): Promise<HtcG13WeatherCache | null> {
    try {
      const weatherData = await prisma.htcG13WeatherCache.findUnique({
        where: { cityId },
      });

      // 检查缓存是否过期
      if (weatherData) {
        const currentTimestamp = BigInt(Date.now());
        if (weatherData.expiresAt > currentTimestamp) {
          console.log(`[HTC-G13] Cache hit for ${cityId}`);
          return weatherData as HtcG13WeatherCache;
        }
        console.log(`[HTC-G13] Cache expired for ${cityId}`);
      }

      return null;
    } catch (error) {
      console.error('[HTC-G13] Error getting weather data:', error);
      return null;
    }
  }

  async createOrUpdateWeatherData(
    cityId: string,
    jsonData: string,
    expiresInMinutes: number
  ): Promise<HtcG13WeatherCache> {
    try {
      const timestamp = BigInt(Date.now());
      const expiresAt = timestamp + BigInt(expiresInMinutes * 60 * 1000);

      const weatherData = await prisma.htcG13WeatherCache.upsert({
        where: { cityId },
        update: {
          jsonData,
          timestamp,
          expiresAt,
          updatedAt: timestamp,
        },
        create: {
          cityId,
          jsonData,
          timestamp,
          expiresAt,
          cacheDuration: expiresInMinutes,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });

      console.log(`[HTC-G13] Cache updated for ${cityId}`);
      return weatherData as HtcG13WeatherCache;
    } catch (error) {
      console.error(
        '[HTC-G13] Error creating or updating weather data:',
        error
      );
      throw error;
    }
  }

  // ============================================
  // 缓存策略配置
  // ============================================

  async getCacheDuration(): Promise<number> {
    // 默认缓存30分钟
    return 30;
  }

  // ============================================
  // 缓存清理
  // ============================================

  async cleanupExpiredCache(): Promise<void> {
    try {
      const currentTimestamp = BigInt(Date.now());
      const result = await prisma.htcG13WeatherCache.deleteMany({
        where: {
          expiresAt: { lte: currentTimestamp },
        },
      });
      console.log(`[HTC-G13] Cleaned up ${result.count} expired cache entries`);
    } catch (error) {
      console.error('[HTC-G13] Error cleaning up expired cache:', error);
    }
  }

  async clearWeatherData(
    beforeTimestamp?: bigint
  ): Promise<{ deletedCount: number }> {
    try {
      let result;
      if (beforeTimestamp) {
        result = await prisma.htcG13WeatherCache.deleteMany({
          where: {
            createdAt: { lte: beforeTimestamp },
          },
        });
      } else {
        result = await prisma.htcG13WeatherCache.deleteMany({});
      }
      console.log(`[HTC-G13] Deleted ${result.count} weather data records`);
      return { deletedCount: result.count };
    } catch (error) {
      console.error('[HTC-G13] Error clearing weather data:', error);
      throw error;
    }
  }
}

// 导出单例实例
export default new HtcG13CacheService();
