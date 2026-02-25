// 缓存策略接口定义
// 使用策略模式统一 ZTE 和 HTC 的缓存操作

// ============================================
// 通用类型定义
// ============================================

export interface CacheCity {
  id: number;
  name: string;
  cityId: string;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface CacheWeatherData {
  id: number;
  cityId: string;
  xmlData: string;
  timestamp: bigint;
  expiresAt: bigint;
  cacheDuration: number;
  createdAt: bigint;
  updatedAt: bigint;
}

// ============================================
// 缓存策略接口
// ============================================

export interface CacheStrategy {
  // 城市信息缓存
  getCityByName(name: string): Promise<CacheCity | null>;
  getCityById(cityId: string): Promise<CacheCity | null>;
  createCity(
    name: string,
    cityId: string,
    extraInfo?: Record<string, string>
  ): Promise<CacheCity>;

  // 天气数据缓存
  getWeatherData(
    cityId: string,
    dataType: string
  ): Promise<CacheWeatherData | null>;
  createOrUpdateWeatherData(
    cityId: string,
    dataType: string,
    xmlData: string,
    expiresInMinutes: number
  ): Promise<CacheWeatherData>;

  // 缓存策略配置
  getCacheDuration(dataType: string): Promise<number>;

  // 缓存清理
  cleanupExpiredCache(): Promise<void>;
  clearWeatherData(beforeTimestamp?: bigint): Promise<{ deletedCount: number }>;

  // 获取有预报缓存的城市列表
  getCitiesWithForecastCache(): Promise<CacheCity[]>;
}

// ============================================
// 策略上下文
// ============================================

import zteCache from './zte-cache.js';
import htcAccuCache from './htc-accu-cache.js';

export type DeviceType = 'zte' | 'htc';

export class CacheContext {
  private strategy: CacheStrategy;

  constructor(deviceType: DeviceType) {
    if (deviceType === 'zte') {
      this.strategy = zteCache as unknown as CacheStrategy;
    } else if (deviceType === 'htc') {
      this.strategy = htcAccuCache as unknown as CacheStrategy;
    } else {
      throw new Error(`Unknown device type: ${deviceType}`);
    }
  }

  // 城市信息缓存
  async getCityByName(name: string): Promise<CacheCity | null> {
    return this.strategy.getCityByName(name);
  }

  async getCityById(cityId: string): Promise<CacheCity | null> {
    return this.strategy.getCityById(cityId);
  }

  async createCity(
    name: string,
    cityId: string,
    extraInfo?: Record<string, string>
  ): Promise<CacheCity> {
    return this.strategy.createCity(name, cityId, extraInfo);
  }

  // 天气数据缓存
  async getWeatherData(
    cityId: string,
    dataType: string
  ): Promise<CacheWeatherData | null> {
    return this.strategy.getWeatherData(cityId, dataType);
  }

  async createOrUpdateWeatherData(
    cityId: string,
    dataType: string,
    xmlData: string,
    expiresInMinutes: number
  ): Promise<CacheWeatherData> {
    return this.strategy.createOrUpdateWeatherData(
      cityId,
      dataType,
      xmlData,
      expiresInMinutes
    );
  }

  // 缓存策略配置
  async getCacheDuration(dataType: string): Promise<number> {
    return this.strategy.getCacheDuration(dataType);
  }

  // 缓存清理
  async cleanupExpiredCache(): Promise<void> {
    return this.strategy.cleanupExpiredCache();
  }

  async clearWeatherData(
    beforeTimestamp?: bigint
  ): Promise<{ deletedCount: number }> {
    return this.strategy.clearWeatherData(beforeTimestamp);
  }

  // 获取有预报缓存的城市列表
  async getCitiesWithForecastCache(): Promise<CacheCity[]> {
    return this.strategy.getCitiesWithForecastCache();
  }
}

// 工厂函数
export function createCacheStrategy(deviceType: DeviceType): CacheContext {
  return new CacheContext(deviceType);
}
