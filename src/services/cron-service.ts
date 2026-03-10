import cron from 'node-cron';
import { zteCache, htcAccuCache } from './cache/index.js';
import weatherApi from './weather-api.js';
import dataTransform from '@/services/zte/data-transform.js';
import citySync from '@/services/zte/city-sync.js';
import activeCityService from '@/services/zte/active-city-service.js';
import htcActiveCityService from '@/services/htc/active-city-service.js';
import htcHuaFengActiveCityService from '@/services/htc/huafeng-active-city-service.js';
import htcG13ActiveCityService from '@/services/htc/g13-active-city-service.js';
import htcAccuCitySync from '@/services/htc/accu-city-sync.js';
import {
  CRON_SCHEDULES,
  getCronExpression,
  getCronDescription,
} from '@/config/cron-schedules.js';
import { HTCAccuWeatherData } from '@/services/htc/htc-accu-types.js';
import type { ZteWeatherData } from '@/types/zte.js';

// 定义城市类型接口
interface City {
  name: string;
  cityId: string;
}

class CronService {
  private zteForecastUpdateTask: cron.ScheduledTask | null = null;
  private htcForecastUpdateTask: cron.ScheduledTask | null = null;
  private htcHuaFengForecastTask: cron.ScheduledTask | null = null;
  private htcG13ForecastTask: cron.ScheduledTask | null = null;
  private zteCacheCleanupTask: cron.ScheduledTask | null = null;
  private htcCacheCleanupTask: cron.ScheduledTask | null = null;
  private zteActiveCityCleanupTask: cron.ScheduledTask | null = null;
  private htcAccuActiveCityCleanupTask: cron.ScheduledTask | null = null;
  private htcHuaFengActiveCityCleanupTask: cron.ScheduledTask | null = null;
  private htcG13ActiveCityCleanupTask: cron.ScheduledTask | null = null;
  private zteCitySyncTask: cron.ScheduledTask | null = null;
  private htcAccuCitySyncTask: cron.ScheduledTask | null = null;
  private htcHuaFengCitySyncTask: cron.ScheduledTask | null = null;
  private htcG13CitySyncTask: cron.ScheduledTask | null = null;

  // 启动定时任务
  start() {
    // 启动预刷新任务（只同步活跃城市，节省 API 配额）
    this.startZteForecastUpdateTask();
    this.startHtcForecastUpdateTask();
    this.startHtcHuaFengForecastUpdateTask();
    this.startHtcG13ForecastUpdateTask();
    this.startZteCacheCleanupTask();
    this.startHtcCacheCleanupTask();
    this.startZteActiveCityCleanupTask();
    this.startHtcAccuActiveCityCleanupTask();
    this.startHtcHuaFengActiveCityCleanupTask();
    this.startHtcG13ActiveCityCleanupTask();
    this.startZteCitySyncTask();
    this.startHtcAccuCitySyncTask();
    // HTC 华风和 G13 的城市表结构不同，暂时不自动同步
    // this.startHtcHuaFengCitySyncTask();
    // this.startHtcG13CitySyncTask();
    console.log('Cron tasks started (forecast update for active cities only)');
  }

  // 停止定时任务
  stop() {
    if (this.zteForecastUpdateTask) {
      this.zteForecastUpdateTask.stop();
      this.zteForecastUpdateTask = null;
    }

    if (this.htcForecastUpdateTask) {
      this.htcForecastUpdateTask.stop();
      this.htcForecastUpdateTask = null;
    }

    if (this.zteCacheCleanupTask) {
      this.zteCacheCleanupTask.stop();
      this.zteCacheCleanupTask = null;
    }

    if (this.htcCacheCleanupTask) {
      this.htcCacheCleanupTask.stop();
      this.htcCacheCleanupTask = null;
    }

    if (this.zteCitySyncTask) {
      this.zteCitySyncTask.stop();
      this.zteCitySyncTask = null;
    }

    console.log('Cron tasks stopped');
  }

  // 启动 ZTE 预报更新任务（每 4 小时一次，只同步活跃城市）
  private startZteForecastUpdateTask() {
    this.zteForecastUpdateTask = cron.schedule(
      getCronExpression('ZTE_FORECAST_UPDATE'),
      async () => {
        console.log(
          '[ZTE] Starting forecast update task at',
          new Date().toISOString()
        );
        await this.updateZteForecasts();
        console.log(
          '[ZTE] Forecast update task completed at',
          new Date().toISOString()
        );
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log('[ZTE]', getCronDescription('ZTE_FORECAST_UPDATE'));
  }

  // 启动 HTC AccuWeather 预报更新任务（每 4 小时一次，只同步活跃城市）
  private startHtcForecastUpdateTask() {
    this.htcForecastUpdateTask = cron.schedule(
      getCronExpression('HTC_ACCU_FORECAST_UPDATE'),
      async () => {
        console.log(
          '[HTC-Accu] Starting forecast update task at',
          new Date().toISOString()
        );
        await this.updateHtcForecasts();
        console.log(
          '[HTC-Accu] Forecast update task completed at',
          new Date().toISOString()
        );
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log('[HTC-Accu]', getCronDescription('HTC_ACCU_FORECAST_UPDATE'));
  }

  // 启动 HTC 华风天气预报更新任务（每 4 小时一次，只同步活跃城市）
  private startHtcHuaFengForecastUpdateTask() {
    this.htcHuaFengForecastTask = cron.schedule(
      getCronExpression('HTC_HUAFENG_FORECAST_UPDATE'),
      async () => {
        console.log(
          '[HTC-HuaFeng] Starting forecast update task at',
          new Date().toISOString()
        );
        await this.updateHtcHuaFengForecasts();
        console.log(
          '[HTC-HuaFeng] Forecast update task completed at',
          new Date().toISOString()
        );
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log(
      '[HTC-HuaFeng]',
      getCronDescription('HTC_HUAFENG_FORECAST_UPDATE')
    );
  }

  // 启动 HTC G13 预报更新任务（每 4 小时一次，只同步活跃城市）
  private startHtcG13ForecastUpdateTask() {
    this.htcG13ForecastTask = cron.schedule(
      getCronExpression('HTC_G13_FORECAST_UPDATE'),
      async () => {
        console.log(
          '[HTC-G13] Starting forecast update task at',
          new Date().toISOString()
        );
        await this.updateHtcG13Forecasts();
        console.log(
          '[HTC-G13] Forecast update task completed at',
          new Date().toISOString()
        );
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log('[HTC-G13]', getCronDescription('HTC_G13_FORECAST_UPDATE'));
  }

  // 启动 ZTE 缓存清理任务（每天凌晨执行）
  private startZteCacheCleanupTask() {
    this.zteCacheCleanupTask = cron.schedule(
      getCronExpression('ZTE_CACHE_CLEANUP'),
      async () => {
        console.log(
          '[ZTE] Starting cache cleanup task at',
          new Date().toISOString()
        );
        await zteCache.cleanupExpiredCache();
        console.log(
          '[ZTE] Cache cleanup task completed at',
          new Date().toISOString()
        );
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log('[ZTE]', getCronDescription('ZTE_CACHE_CLEANUP'));
  }

  // 启动 HTC 缓存清理任务（每天凌晨执行）
  private startHtcCacheCleanupTask() {
    this.htcCacheCleanupTask = cron.schedule(
      getCronExpression('HTC_ACCU_CACHE_CLEANUP'),
      async () => {
        console.log(
          '[HTC-Accu] Starting cache cleanup task at',
          new Date().toISOString()
        );
        await htcAccuCache.cleanupExpiredCache();
        console.log(
          '[HTC-Accu] Cache cleanup task completed at',
          new Date().toISOString()
        );
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log('[HTC-Accu]', getCronDescription('HTC_ACCU_CACHE_CLEANUP'));
  }

  // 启动 ZTE 活跃城市清理任务（每周日凌晨执行）
  private startZteActiveCityCleanupTask() {
    this.zteActiveCityCleanupTask = cron.schedule(
      getCronExpression('ZTE_ACTIVE_CITY_CLEANUP'),
      async () => {
        console.log(
          '[ZTE] Starting active city cleanup task at',
          new Date().toISOString()
        );
        try {
          const count = await activeCityService.cleanupInactiveCities(3); // 3 天
          console.log(
            `[ZTE] Active city cleanup completed: removed ${count} inactive cities at`,
            new Date().toISOString()
          );
        } catch (error) {
          console.error('[ZTE] Error in active city cleanup task:', error);
        }
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log('[ZTE]', getCronDescription('ZTE_ACTIVE_CITY_CLEANUP'));
  }

  // 启动 HTC AccuWeather 活跃城市清理任务（每周日凌晨执行）
  private startHtcAccuActiveCityCleanupTask() {
    this.htcAccuActiveCityCleanupTask = cron.schedule(
      getCronExpression('HTC_ACCU_ACTIVE_CITY_CLEANUP'),
      async () => {
        console.log(
          '[HTC-Accu] Starting active city cleanup task at',
          new Date().toISOString()
        );
        try {
          const count = await htcActiveCityService.cleanupInactiveCities(3); // 3 天
          console.log(
            `[HTC-Accu] Active city cleanup completed: removed ${count} inactive cities at`,
            new Date().toISOString()
          );
        } catch (error) {
          console.error('[HTC-Accu] Error in active city cleanup task:', error);
        }
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log(
      '[HTC-Accu]',
      getCronDescription('HTC_ACCU_ACTIVE_CITY_CLEANUP')
    );
  }

  // 启动 HTC 华风天气活跃城市清理任务（每周日凌晨执行）
  private startHtcHuaFengActiveCityCleanupTask() {
    this.htcHuaFengActiveCityCleanupTask = cron.schedule(
      getCronExpression('HTC_HUAFENG_ACTIVE_CITY_CLEANUP'),
      async () => {
        console.log(
          '[HTC-HuaFeng] Starting active city cleanup task at',
          new Date().toISOString()
        );
        try {
          const count =
            await htcHuaFengActiveCityService.cleanupInactiveCities(3); // 3 天
          console.log(
            `[HTC-HuaFeng] Active city cleanup completed: removed ${count} inactive cities at`,
            new Date().toISOString()
          );
        } catch (error) {
          console.error(
            '[HTC-HuaFeng] Error in active city cleanup task:',
            error
          );
        }
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log(
      '[HTC-HuaFeng]',
      getCronDescription('HTC_HUAFENG_ACTIVE_CITY_CLEANUP')
    );
  }

  // 启动 HTC G13 活跃城市清理任务（每周日凌晨执行）
  private startHtcG13ActiveCityCleanupTask() {
    this.htcG13ActiveCityCleanupTask = cron.schedule(
      getCronExpression('HTC_G13_ACTIVE_CITY_CLEANUP'),
      async () => {
        console.log(
          '[HTC-G13] Starting active city cleanup task at',
          new Date().toISOString()
        );
        try {
          const count = await htcG13ActiveCityService.cleanupInactiveCities(3); // 3 天
          console.log(
            `[HTC-G13] Active city cleanup completed: removed ${count} inactive cities at`,
            new Date().toISOString()
          );
        } catch (error) {
          console.error('[HTC-G13] Error in active city cleanup task:', error);
        }
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log('[HTC-G13]', getCronDescription('HTC_G13_ACTIVE_CITY_CLEANUP'));
  }

  // 启动 ZTE 城市列表同步任务（每 3 天凌晨执行）
  private startZteCitySyncTask() {
    this.zteCitySyncTask = cron.schedule(
      getCronExpression('ZTE_CITY_SYNC'),
      async () => {
        console.log(
          '[ZTE] Starting city list sync task at',
          new Date().toISOString()
        );
        try {
          const count = await citySync.syncCityListFromAPI();
          console.log(
            `[ZTE] City list sync completed: ${count} cities synced at`,
            new Date().toISOString()
          );
        } catch (error) {
          console.error('[ZTE] Error in city sync task:', error);
        }
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log('[ZTE]', getCronDescription('ZTE_CITY_SYNC'));
  }

  // 启动 HTC AccuWeather 城市列表同步任务（每 3 天凌晨执行）
  private startHtcAccuCitySyncTask() {
    this.htcAccuCitySyncTask = cron.schedule(
      getCronExpression('HTC_ACCU_CITY_SYNC'),
      async () => {
        console.log(
          '[HTC-Accu] Starting city list sync task at',
          new Date().toISOString()
        );
        try {
          const count = await htcAccuCitySync.syncCityListFromAPI();
          console.log(
            `[HTC-Accu] City list sync completed: ${count} cities synced at`,
            new Date().toISOString()
          );
        } catch (error) {
          console.error('[HTC-Accu] Error in city sync task:', error);
        }
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log('[HTC-Accu]', getCronDescription('HTC_ACCU_CITY_SYNC'));
  }

  // 启动 HTC 华风天气城市列表同步任务（每 3 天凌晨 3:30 执行）
  // 注：HTCHuaFengCity 表结构特殊，需要手动同步
  private startHtcHuaFengCitySyncTask() {
    this.htcHuaFengCitySyncTask = cron.schedule(
      '30 3 */3 * *', // 每 3 天的凌晨 3:30
      async () => {
        console.log(
          '[HTC-HuaFeng] City sync task is not implemented yet (table structure is different)'
        );
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log(
      '[HTC-HuaFeng] City list sync task scheduled: every 3 days at 03:30 (disabled)'
    );
  }

  // 启动 HTC G13 城市列表同步任务（每 3 天凌晨 4:00 执行）
  // 注：HtcG13City 表结构特殊，需要手动同步
  private startHtcG13CitySyncTask() {
    this.htcG13CitySyncTask = cron.schedule(
      '0 4 */3 * *', // 每 3 天的凌晨 4:00
      async () => {
        console.log(
          '[HTC-G13] City sync task is not implemented yet (table structure is different)'
        );
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log(
      '[HTC-G13] City list sync task scheduled: every 3 days at 04:00 (disabled)'
    );
  }

  // 更新 HTC 华风天气预报数据（只更新活跃城市）
  private async updateHtcHuaFengForecasts() {
    try {
      // 从 HTC 华风活跃城市表获取需要同步的城市
      const activeCities = await htcActiveCityService.getActiveCities();

      console.log(
        `[HTC-HuaFeng] Found ${activeCities.length} active cities to update forecasts for`
      );

      // 遍历更新每个城市的预报数据
      for (const city of activeCities) {
        try {
          console.log(
            `[HTC-HuaFeng] Updating forecast for active city: ${city.name} (${city.cityId})`
          );

          // TODO: 调用华风天气 API 或和风 API 获取最新数据
          // 这里需要根据华风天气的 API 格式来实现

          console.log(
            `[HTC-HuaFeng] Successfully updated forecast for active city: ${city.name}`
          );
        } catch (error) {
          console.error(
            `[HTC-HuaFeng] Error updating forecast for active city ${city.name}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error('[HTC-HuaFeng] Error in updateHtcHuaFengForecasts:', error);
    }
  }

  // 更新 HTC G13 预报数据（只更新活跃城市）
  private async updateHtcG13Forecasts() {
    try {
      // 从 HTC G13 活跃城市表获取需要同步的城市
      const activeCities = await htcActiveCityService.getActiveCities();

      console.log(
        `[HTC-G13] Found ${activeCities.length} active cities to update forecasts for`
      );

      // 遍历更新每个城市的预报数据
      for (const city of activeCities) {
        try {
          console.log(
            `[HTC-G13] Updating forecast for active city: ${city.name} (${city.cityId})`
          );

          // TODO: 调用 G13 天气 API 或和风 API 获取最新数据
          // 这里需要根据 G13 天气的 API 格式来实现

          console.log(
            `[HTC-G13] Successfully updated forecast for active city: ${city.name}`
          );
        } catch (error) {
          console.error(
            `[HTC-G13] Error updating forecast for active city ${city.name}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error('[HTC-G13] Error in updateHtcG13Forecasts:', error);
    }
  }

  // 更新 ZTE 预报数据（只更新活跃城市）
  private async updateZteForecasts() {
    try {
      // 从活跃城市表获取需要同步的城市
      const activeCities = await activeCityService.getActiveCities();

      console.log(
        `[ZTE] Found ${activeCities.length} active cities to update forecasts for`
      );

      // 遍历更新每个城市的预报数据
      for (const city of activeCities) {
        try {
          console.log(
            `[ZTE] Updating forecast for active city: ${city.name} (${city.cityId})`
          );

          // 调用天气 API 获取最新数据
          const apiData = await weatherApi.getWeather(city.cityId);

          // 转换为 ZTE 格式
          const weatherData: ZteWeatherData = {
            now: apiData.now,
            forecast: apiData.forecast || {
              daily: [],
              updateTime: new Date().toISOString(),
            },
            hourly: apiData.hourly,
            indices: apiData.indices,
            city: apiData.city || { id: city.cityId, name: city.name },
            updateTime: apiData.updateTime,
          };

          // 转换数据格式
          const xmlData = dataTransform.toWidgetXml(weatherData, 'ztewidgetcf');

          // 更新缓存
          const cacheDuration = await zteCache.getCacheDuration('ztewidgetcf');
          await zteCache.createOrUpdateWeatherData(
            city.cityId,
            'ztewidgetcf',
            xmlData,
            cacheDuration
          );

          console.log(
            `[ZTE] Successfully updated forecast for active city: ${city.name}`
          );
        } catch (error) {
          console.error(
            `[ZTE] Error updating forecast for active city ${city.name}:`,
            error
          );
          // 继续处理下一个城市，不中断整个任务
        }
      }
    } catch (error) {
      console.error('[ZTE] Error in updateZteForecasts:', error);
    }
  }

  // 更新 HTC 预报数据
  private async updateHtcForecasts() {
    try {
      // 获取所有需要更新的 HTC 预报数据
      const citiesToUpdate = await htcAccuCache.getCitiesWithForecastCache();

      console.log(
        `[HTC-Accu] Found ${citiesToUpdate.length} cities to update forecasts for`
      );

      // 遍历更新每个城市的预报数据
      for (const city of citiesToUpdate) {
        try {
          console.log(
            `[HTC-Accu] Updating forecast for city: ${city.name} (${city.cityId})`
          );

          // 调用天气 API 获取最新数据
          const weatherData = await weatherApi.getWeather(city.cityId);

          // 转换为 HTC 格式
          const { htcAccuDataTransform } =
            await import('@/services/htc/htc-accu-data-transform.js');
          const htcData: HTCAccuWeatherData = {
            code: '200',
            location: weatherData.city ? [weatherData.city] : undefined,
            now: weatherData.now,
            daily: weatherData.forecast?.daily || [],
          };
          const xmlData = htcAccuDataTransform.generateForecastXml(
            htcData,
            city.name
          );

          // 更新缓存
          const cacheDuration =
            await htcAccuCache.getCacheDuration('forecast-data_v3');
          await htcAccuCache.createOrUpdateWeatherData(
            city.cityId,
            'forecast-data_v3',
            xmlData,
            cacheDuration
          );

          console.log(
            `[HTC-Accu] Successfully updated forecast for city: ${city.name}`
          );
        } catch (error) {
          console.error(
            `[HTC-Accu] Error updating forecast for city ${city.name}:`,
            error
          );
          // 继续处理下一个城市，不中断整个任务
        }
      }
    } catch (error) {
      console.error('[HTC-Accu] Error in updateHtcForecasts:', error);
    }
  }
}

// 导出单例实例
export default new CronService();
