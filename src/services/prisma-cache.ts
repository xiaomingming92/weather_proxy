// Prisma缓存服务实现
// 支持实时查询和多天预警缓存策略

// 导入数据库配置
import prisma from '../config/database.js';

// 定义城市类型接口
interface City {
  id: number;
  name: string;
  cityId: string;
  createdAt: bigint;
  updatedAt: bigint;
}

// 定义天气数据类型接口
interface WeatherData {
  id: number;
  cityId: string;
  dataType: string;
  xmlData: string;
  timestamp: bigint;
  timezone: string;
  expiresAt: bigint;
  createdAt: bigint;
  updatedAt: bigint;
}

// 定义缓存配置类型接口
interface CacheConfig {
  id: number;
  key: string;
  value: string;
  description: string | null;
  createdAt: bigint;
  updatedAt: bigint;
}

class PrismaCacheService {
  // 城市信息缓存
  async getCityByName(name: string): Promise<City | null> {
    try {
      return await prisma.city.findUnique({
        where: { name },
      });
    } catch (error) {
      console.error('Error getting city by name:', error);
      return null;
    }
  }

  async getCityById(cityId: string): Promise<City | null> {
    try {
      return await prisma.city.findUnique({
        where: { cityId },
      });
    } catch (error) {
      console.error('Error getting city by id:', error);
      return null;
    }
  }

  async createCity(name: string, cityId: string): Promise<City> {
    try {
      const currentTimestamp = BigInt(Date.now());
      return await prisma.city.upsert({
        where: { name },
        update: { cityId, updatedAt: currentTimestamp },
        create: {
          name,
          cityId,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        },
      });
    } catch (error) {
      console.error('Error creating city:', error);
      throw error;
    }
  }

  // 天气数据缓存
  async getWeatherData(
    cityId: string,
    dataType: string,
    appType: string = 'unknown'
  ): Promise<WeatherData | null> {
    try {
      const weatherData = await prisma.weatherData.findUnique({
        where: { cityId_dataType_appType: { cityId, dataType, appType } },
      });

      // 检查缓存是否过期（使用时间戳比较）
      if (weatherData) {
        const currentTimestamp = BigInt(Date.now());
        const expiresAtBigInt = BigInt(weatherData.expiresAt);
        if (expiresAtBigInt > currentTimestamp) {
          return weatherData as WeatherData;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting weather data:', error);
      return null;
    }
  }

  async createOrUpdateWeatherData(
    cityId: string,
    dataType: string,
    xmlData: string,
    expiresInMinutes: number,
    appType: string = 'unknown'
  ): Promise<WeatherData> {
    try {
      const timestamp = BigInt(Date.now());
      const expiresAt = timestamp + BigInt(expiresInMinutes * 60 * 1000);

      const weatherData = await prisma.weatherData.upsert({
        where: { cityId_dataType_appType: { cityId, dataType, appType } },
        update: {
          xmlData,
          timestamp,
          expiresAt,
          updatedAt: timestamp,
        },
        create: {
          cityId,
          dataType,
          appType,
          xmlData,
          timestamp,
          expiresAt,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });

      return weatherData as WeatherData;
    } catch (error) {
      console.error('Error creating or updating weather data:', error);
      throw error;
    }
  }

  // 缓存配置管理
  async getCacheConfig(key: string): Promise<CacheConfig | null> {
    try {
      return await prisma.cacheConfig.findUnique({
        where: { key },
      });
    } catch (error) {
      console.error('Error getting cache config:', error);
      return null;
    }
  }

  async setCacheConfig(
    key: string,
    value: string,
    description?: string
  ): Promise<CacheConfig> {
    try {
      const currentTimestamp = BigInt(Date.now());
      return await prisma.cacheConfig.upsert({
        where: { key },
        update: { value, description, updatedAt: currentTimestamp },
        create: {
          key,
          value,
          description,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        },
      });
    } catch (error) {
      console.error('Error setting cache config:', error);
      throw error;
    }
  }

  // 获取所有缓存配置
  async getAllCacheConfigs(): Promise<CacheConfig[]> {
    try {
      return await prisma.cacheConfig.findMany();
    } catch (error) {
      console.error('Error getting all cache configs:', error);
      return [];
    }
  }

  // 删除缓存配置
  async deleteCacheConfig(key: string): Promise<void> {
    try {
      await prisma.cacheConfig.delete({
        where: { key },
      });
    } catch (error) {
      console.error('Error deleting cache config:', error);
      throw error;
    }
  }

  // 获取缓存时间配置
  async getCacheDuration(dataType: string): Promise<number> {
    try {
      // 实时查询缓存时间（3分钟）
      if (dataType === 'ztev3widgetskall' || dataType === 'ztewidgetsk') {
        const config = await this.getCacheConfig('realtime_cache_duration');
        return config ? parseInt(config.value) : 3;
      }

      // 多天预警缓存时间（12小时）
      if (dataType === 'ztewidgetcf') {
        const config = await this.getCacheConfig('forecast_cache_duration');
        return config ? parseInt(config.value) : 720;
      }

      // 默认缓存时间（10分钟）
      return 10;
    } catch (error) {
      console.error('Error getting cache duration:', error);
      return 10;
    }
  }

  // 清理过期缓存
  async cleanupExpiredCache(): Promise<void> {
    try {
      const currentTimestamp = BigInt(Date.now());
      await prisma.weatherData.deleteMany({
        where: {
          expiresAt: { lte: currentTimestamp },
        },
      });
      console.log('Expired cache cleaned up');
    } catch (error) {
      console.error('Error cleaning up expired cache:', error);
    }
  }

  // 关闭Prisma客户端
  async close(): Promise<void> {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error closing cache service:', error);
    }
  }

  // 获取有预报缓存的城市列表
  async getCitiesWithForecastCache(): Promise<City[]> {
    try {
      const currentTimestamp = BigInt(Date.now());
      // 查询有预报缓存的城市
      const weatherData = await prisma.weatherData.findMany({
        where: {
          dataType: 'ztewidgetcf',
          expiresAt: { gt: currentTimestamp },
        },
        select: {
          cityId: true,
        },
        distinct: ['cityId'],
      });

      // 获取对应的城市信息
      const cities: City[] = [];
      for (const data of weatherData) {
        const city = await prisma.city.findUnique({
          where: { cityId: data.cityId },
        });
        if (city) {
          cities.push(city);
        }
      }

      return cities;
    } catch (error) {
      console.error('Error getting cities with forecast cache:', error);
      return [];
    }
  }
}

// 导出单例实例
export default new PrismaCacheService();
