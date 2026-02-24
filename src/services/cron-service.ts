import cron from 'node-cron';
import { zteCache, htcCache } from './cache/index.js';
import weatherApi from './weather-api.js';
import dataTransform from '@/services/zte/data-transform.js';
import { HtcWeatherData } from '@/types/index.js';

// 定义城市类型接口
interface City {
  name: string;
  cityId: string;
}

class CronService {
  private zteForecastUpdateTask: cron.ScheduledTask | null = null;
  private htcForecastUpdateTask: cron.ScheduledTask | null = null;
  private zteCacheCleanupTask: cron.ScheduledTask | null = null;
  private htcCacheCleanupTask: cron.ScheduledTask | null = null;

  // 启动定时任务
  start() {
    this.startZteForecastUpdateTask();
    this.startHtcForecastUpdateTask();
    this.startZteCacheCleanupTask();
    this.startHtcCacheCleanupTask();
    console.log('Cron tasks started');
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

    console.log('Cron tasks stopped');
  }

  // 启动ZTE预报更新任务（每小时一次）
  private startZteForecastUpdateTask() {
    // 每小时的第0分钟执行
    this.zteForecastUpdateTask = cron.schedule(
      '0 * * * *',
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

    console.log('[ZTE] Forecast update task scheduled: every hour at minute 0');
  }

  // 启动HTC预报更新任务（每小时一次）
  private startHtcForecastUpdateTask() {
    // 每小时的第30分钟执行（与ZTE错开）
    this.htcForecastUpdateTask = cron.schedule(
      '30 * * * *',
      async () => {
        console.log(
          '[HTC] Starting forecast update task at',
          new Date().toISOString()
        );
        await this.updateHtcForecasts();
        console.log(
          '[HTC] Forecast update task completed at',
          new Date().toISOString()
        );
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log(
      '[HTC] Forecast update task scheduled: every hour at minute 30'
    );
  }

  // 启动ZTE缓存清理任务（每天凌晨执行）
  private startZteCacheCleanupTask() {
    // 每天凌晨0点执行
    this.zteCacheCleanupTask = cron.schedule(
      '0 0 * * *',
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

    console.log('[ZTE] Cache cleanup task scheduled: every day at 00:00');
  }

  // 启动HTC缓存清理任务（每天凌晨执行）
  private startHtcCacheCleanupTask() {
    // 每天凌晨1点执行（与ZTE错开）
    this.htcCacheCleanupTask = cron.schedule(
      '0 1 * * *',
      async () => {
        console.log(
          '[HTC] Starting cache cleanup task at',
          new Date().toISOString()
        );
        await htcCache.cleanupExpiredCache();
        console.log(
          '[HTC] Cache cleanup task completed at',
          new Date().toISOString()
        );
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log('[HTC] Cache cleanup task scheduled: every day at 01:00');
  }

  // 更新ZTE预报数据
  private async updateZteForecasts() {
    try {
      // 获取所有需要更新的ZTE预报数据
      const citiesToUpdate = await this.getZteCitiesWithForecastCache();

      console.log(
        `[ZTE] Found ${citiesToUpdate.length} cities to update forecasts for`
      );

      // 遍历更新每个城市的预报数据
      for (const city of citiesToUpdate) {
        try {
          console.log(
            `[ZTE] Updating forecast for city: ${city.name} (${city.cityId})`
          );

          // 调用天气API获取最新数据
          const weatherData = await weatherApi.getWeather(city.cityId);

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
            `[ZTE] Successfully updated forecast for city: ${city.name}`
          );
        } catch (error) {
          console.error(
            `[ZTE] Error updating forecast for city ${city.name}:`,
            error
          );
          // 继续处理下一个城市，不中断整个任务
        }
      }
    } catch (error) {
      console.error('[ZTE] Error in updateZteForecasts:', error);
    }
  }

  // 更新HTC预报数据
  private async updateHtcForecasts() {
    try {
      // 获取所有需要更新的HTC预报数据
      const citiesToUpdate = await this.getHtcCitiesWithForecastCache();

      console.log(
        `[HTC] Found ${citiesToUpdate.length} cities to update forecasts for`
      );

      // 遍历更新每个城市的预报数据
      for (const city of citiesToUpdate) {
        try {
          console.log(
            `[HTC] Updating forecast for city: ${city.name} (${city.cityId})`
          );

          // 调用天气API获取最新数据
          const weatherData = await weatherApi.getWeather(city.cityId);

          // 转换为 HTC 格式
          const { htcDataTransform } =
            await import('@/services/htc/data-transform.js');
          const htcData: HtcWeatherData = {
            code: '200',
            location: weatherData.city ? [weatherData.city] : undefined,
            now: weatherData.now,
            daily: weatherData.forecast?.daily || [],
          };
          const xmlData = htcDataTransform.generateForecastXml(
            htcData,
            city.name
          );

          // 更新缓存
          const cacheDuration =
            await htcCache.getCacheDuration('forecast-data_v3');
          await htcCache.createOrUpdateWeatherData(
            city.cityId,
            'forecast-data_v3',
            xmlData,
            cacheDuration
          );

          console.log(
            `[HTC] Successfully updated forecast for city: ${city.name}`
          );
        } catch (error) {
          console.error(
            `[HTC] Error updating forecast for city ${city.name}:`,
            error
          );
          // 继续处理下一个城市，不中断整个任务
        }
      }
    } catch (error) {
      console.error('[HTC] Error in updateHtcForecasts:', error);
    }
  }

  // 获取ZTE有预报缓存的城市列表
  private async getZteCitiesWithForecastCache(): Promise<City[]> {
    try {
      return await zteCache.getCitiesWithForecastCache();
    } catch (error) {
      console.error('[ZTE] Error getting cities with forecast cache:', error);
      return [];
    }
  }

  // 获取HTC有预报缓存的城市列表
  private async getHtcCitiesWithForecastCache(): Promise<City[]> {
    try {
      return await htcCache.getCitiesWithForecastCache();
    } catch (error) {
      console.error('[HTC] Error getting cities with forecast cache:', error);
      return [];
    }
  }
}

// 导出单例实例
export default new CronService();
