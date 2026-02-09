// Prisma缓存服务实现
// 支持实时查询和多天预警缓存策略

import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
// import mariadb from 'mariadb/promise';

// 加载环境变量
// dotenv.config();

// 验证环境变量
try {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
} catch (error) {
  console.error('Error creating database pool:', error);
  throw error;
}

// 创建PrismaMariaDb适配器
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);

// 定义城市类型接口
interface City {
  id: number;
  name: string;
  cityId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 定义天气数据类型接口
interface WeatherData {
  id: number;
  cityId: string;
  dataType: string;
  xmlData: string;
  createdAt: Date;
  expiresAt: Date;
}

// 定义缓存配置类型接口
interface CacheConfig {
  id: number;
  key: string;
  value: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 创建Prisma客户端实例
const prisma = new PrismaClient({
  adapter,
});

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
      return await prisma.city.upsert({
        where: { name },
        update: { cityId, updatedAt: new Date() },
        create: { name, cityId },
      });
    } catch (error) {
      console.error('Error creating city:', error);
      throw error;
    }
  }

  // 天气数据缓存
  async getWeatherData(
    cityId: string,
    dataType: string
  ): Promise<WeatherData | null> {
    try {
      const weatherData = await prisma.weatherData.findUnique({
        where: { cityId_dataType: { cityId, dataType } },
      });

      // 检查缓存是否过期
      if (weatherData && weatherData.expiresAt > new Date()) {
        return weatherData;
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
    expiresInMinutes: number
  ): Promise<WeatherData> {
    try {
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      return await prisma.weatherData.upsert({
        where: { cityId_dataType: { cityId, dataType } },
        update: { xmlData, expiresAt },
        create: { cityId, dataType, xmlData, expiresAt },
      });
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
      return await prisma.cacheConfig.upsert({
        where: { key },
        update: { value, description, updatedAt: new Date() },
        create: { key, value, description },
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
      await prisma.weatherData.deleteMany({
        where: {
          expiresAt: { lte: new Date() },
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
      // 查询有预报缓存的城市
      const weatherData = await prisma.weatherData.findMany({
        where: {
          dataType: 'ztewidgetcf',
          expiresAt: { gt: new Date() },
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
