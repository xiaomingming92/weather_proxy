import cron from 'node-cron';
import prismaCache from './prisma-cache.js';
import weatherApi from './weather-api.js';
import dataTransform from './data-transform.js';

// 定义城市类型接口
interface City {
  name: string;
  cityId: string;
}

class CronService {
  private forecastUpdateTask: cron.ScheduledTask | null = null;
  private cacheCleanupTask: cron.ScheduledTask | null = null;

  // 启动定时任务
  start() {
    this.startForecastUpdateTask();
    this.startCacheCleanupTask();
    console.log('Cron tasks started');
  }

  // 停止定时任务
  stop() {
    if (this.forecastUpdateTask) {
      this.forecastUpdateTask.stop();
      this.forecastUpdateTask = null;
    }

    if (this.cacheCleanupTask) {
      this.cacheCleanupTask.stop();
      this.cacheCleanupTask = null;
    }

    console.log('Cron tasks stopped');
  }

  // 启动预报更新任务（每小时一次）
  private startForecastUpdateTask() {
    // 每小时的第0分钟执行
    this.forecastUpdateTask = cron.schedule(
      '0 * * * *',
      async () => {
        console.log(
          'Starting forecast update task at',
          new Date().toISOString()
        );
        await this.updateAllForecasts();
        console.log(
          'Forecast update task completed at',
          new Date().toISOString()
        );
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log('Forecast update task scheduled: every hour at minute 0');
  }

  // 启动缓存清理任务（每天凌晨执行）
  private startCacheCleanupTask() {
    // 每天凌晨0点执行
    this.cacheCleanupTask = cron.schedule(
      '0 0 * * *',
      async () => {
        console.log('Starting cache cleanup task at', new Date().toISOString());
        await prismaCache.cleanupExpiredCache();
        console.log(
          'Cache cleanup task completed at',
          new Date().toISOString()
        );
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    console.log('Cache cleanup task scheduled: every day at 00:00');
  }

  // 更新所有预报数据
  private async updateAllForecasts() {
    try {
      // 获取所有需要更新的预报数据
      // 注意：这里需要在prisma-cache.ts中添加相应的方法
      // 暂时使用模拟数据，实际实现需要查询数据库
      const citiesToUpdate = await this.getCitiesWithForecastCache();

      console.log(
        `Found ${citiesToUpdate.length} cities to update forecasts for`
      );

      // 遍历更新每个城市的预报数据
      for (const city of citiesToUpdate) {
        try {
          console.log(
            `Updating forecast for city: ${city.name} (${city.cityId})`
          );

          // 调用天气API获取最新数据
          const weatherData = await weatherApi.getWeather(city.cityId);

          // 转换数据格式
          const xmlData = dataTransform.toWidgetXml(weatherData, 'ztewidgetcf');

          // 更新缓存
          const cacheDuration =
            await prismaCache.getCacheDuration('ztewidgetcf');
          await prismaCache.createOrUpdateWeatherData(
            city.cityId,
            'ztewidgetcf',
            xmlData,
            cacheDuration
          );

          console.log(`Successfully updated forecast for city: ${city.name}`);
        } catch (error) {
          console.error(
            `Error updating forecast for city ${city.name}:`,
            error
          );
          // 继续处理下一个城市，不中断整个任务
        }
      }
    } catch (error) {
      console.error('Error in updateAllForecasts:', error);
    }
  }

  // 获取有预报缓存的城市列表
  private async getCitiesWithForecastCache(): Promise<City[]> {
    try {
      // 使用prisma-cache中的方法获取有预报缓存的城市列表
      return await prismaCache.getCitiesWithForecastCache();
    } catch (error) {
      console.error('Error getting cities with forecast cache:', error);
      return [];
    }
  }
}

// 导出单例实例
export default new CronService();
