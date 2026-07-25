// ZTE 专用缓存服务
// 独立于 HTC 缓存，使用 ZteWeatherCache 表

import prisma from '@/config/database.js';

// ZTE 天气数据缓存接口
interface ZteWeatherCache {
  id: number;
  cityId: string;
  dataType: string;
  xmlData: string;
  timestamp: bigint;
  expiresAt: bigint;
  cacheDuration: number;
  createdAt: bigint;
  updatedAt: bigint;
}

// ZTE 城市接口
interface ZteCity {
  id: number;
  name: string;
  cityId: string;
  stationId: string | null;
  longitude: string | null;
  latitude: string | null;
  postcode: string | null;
  sunrise: string | null;
  sunset: string | null;
  createdAt: bigint;
  updatedAt: bigint;
}

class ZteCacheService {
  // ============================================
  // 城市信息缓存
  // ============================================

  async getCityByName(name: string): Promise<ZteCity | null> {
    try {
      return await prisma.zteCity.findUnique({
        where: { name },
      });
    } catch (error) {
      console.error('[ZTE] Error getting city by name:', error);
      return null;
    }
  }

  async getCityById(cityId: string): Promise<ZteCity | null> {
    try {
      return await prisma.zteCity.findUnique({
        where: { cityId },
      });
    } catch (error) {
      console.error('[ZTE] Error getting city by id:', error);
      return null;
    }
  }

  async createCity(
    name: string,
    cityId: string,
    extraInfo?: {
      stationId?: string;
      longitude?: string;
      latitude?: string;
      postcode?: string;
    }
  ): Promise<ZteCity> {
    try {
      const currentTimestamp = BigInt(Date.now());
      return await prisma.zteCity.upsert({
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
      console.error('[ZTE] Error creating city:', error);
      throw error;
    }
  }

  // ============================================
  // 天气数据缓存
  // ============================================

  async getWeatherData(
    cityId: string,
    dataType: string
  ): Promise<ZteWeatherCache | null> {
    try {
      const weatherData = await prisma.zteWeatherCache.findUnique({
        where: {
          cityId_dataType: { cityId, dataType },
        },
      });

      // 检查缓存是否过期
      if (weatherData) {
        const currentTimestamp = BigInt(Date.now());
        if (weatherData.expiresAt > currentTimestamp) {
          console.log(`[ZTE] Cache hit for ${cityId}/${dataType}`);
          return weatherData as ZteWeatherCache;
        }
        console.log(`[ZTE] Cache expired for ${cityId}/${dataType}`);
      }

      return null;
    } catch (error) {
      console.error('[ZTE] Error getting weather data:', error);
      return null;
    }
  }

  async createOrUpdateWeatherData(
    cityId: string,
    dataType: string,
    xmlData: string,
    expiresInMinutes: number
  ): Promise<ZteWeatherCache> {
    try {
      const timestamp = BigInt(Date.now());
      const expiresAt = timestamp + BigInt(expiresInMinutes * 60 * 1000);

      const weatherData = await prisma.zteWeatherCache.upsert({
        where: {
          cityId_dataType: { cityId, dataType },
        },
        update: {
          xmlData,
          timestamp,
          expiresAt,
          updatedAt: timestamp,
        },
        create: {
          cityId,
          dataType,
          xmlData,
          timestamp,
          expiresAt,
          cacheDuration: expiresInMinutes,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });

      console.log(`[ZTE] Cache updated for ${cityId}/${dataType}`);
      return weatherData as ZteWeatherCache;
    } catch (error) {
      console.error('[ZTE] Error creating or updating weather data:', error);
      throw error;
    }
  }

  // ============================================
  // 缓存策略配置
  // ============================================

  async getCacheDuration(dataType: string): Promise<number> {
    try {
      // 实时查询缓存时间（3分钟）
      if (dataType === 'ztev3widgetskall' || dataType === 'ztewidgetsk') {
        return 3;
      }

      // 多天预警缓存时间（12小时）
      if (dataType === 'ztewidgetcf') {
        return 720;
      }

      // 主数据缓存（30分钟）
      if (dataType === 'zte') {
        return 30;
      }

      // 默认缓存时间（10分钟）
      return 10;
    } catch (error) {
      console.error('[ZTE] Error getting cache duration:', error);
      return 10;
    }
  }

  // ============================================
  // 缓存清理
  // ============================================

  async cleanupExpiredCache(): Promise<void> {
    try {
      const currentTimestamp = BigInt(Date.now());
      const result = await prisma.zteWeatherCache.deleteMany({
        where: {
          expiresAt: { lte: currentTimestamp },
        },
      });
      console.log(`[ZTE] Cleaned up ${result.count} expired cache entries`);
    } catch (error) {
      console.error('[ZTE] Error cleaning up expired cache:', error);
    }
  }

  async clearWeatherData(
    beforeTimestamp?: bigint
  ): Promise<{ deletedCount: number }> {
    try {
      let result;
      if (beforeTimestamp) {
        result = await prisma.zteWeatherCache.deleteMany({
          where: {
            createdAt: { lte: beforeTimestamp },
          },
        });
      } else {
        result = await prisma.zteWeatherCache.deleteMany({});
      }
      console.log(`[ZTE] Deleted ${result.count} weather data records`);
      return { deletedCount: result.count };
    } catch (error) {
      console.error('[ZTE] Error clearing weather data:', error);
      throw error;
    }
  }

  // ============================================
  // 获取有预报缓存的城市列表
  // ============================================

  async getCitiesWithForecastCache(): Promise<ZteCity[]> {
    const cities: ZteCity[] = [];
    try {
      const currentTimestamp = BigInt(Date.now());
      const weatherData = await prisma.zteWeatherCache.findMany({
        where: {
          dataType: 'ztewidgetcf',
          expiresAt: { gt: currentTimestamp },
        },
        select: {
          cityId: true,
        },
        distinct: ['cityId'],
      });

      for (const data of weatherData) {
        const city = await prisma.zteCity.findUnique({
          where: { cityId: data.cityId },
        });
        if (city) {
          cities.push(city);
        }
      }
    } catch (error) {
      console.error('[ZTE] Error getting cities with forecast cache:', error);
    }
    return cities;
  }
}

// 导出单例实例
export default new ZteCacheService();
