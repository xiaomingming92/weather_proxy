import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import weatherApi from './weather-api.js';
import {
  getCronExpression,
  getCronDescription,
} from '@/config/cron-schedules.js';
import { deviceRegistry, type DeviceDefinition } from './device-registry.js';
import type { ZteWeatherData } from '@/types/zte.js';
import type { HTCAccuWeatherData } from '@/services/htc/htc-accu-types.js';

class CronService {
  private started = false;
  private tasks: ScheduledTask[] = [];

  // ============================================
  // 生命周期
  // ============================================

  start() {
    if (this.started) {
      console.warn('Cron tasks already started, skipping duplicate registration');
      return;
    }
    this.started = true;
    this.applyDeviceTasks(deviceRegistry);
    console.log(`Cron tasks started for ${deviceRegistry.getAll().length} devices`);
  }

  stop() {
    for (const task of this.tasks) {
      task.stop();
    }
    this.tasks = [];
    this.started = false;
    console.log('Cron tasks stopped');
  }

  // ============================================
  // 统一调度器（替代 14 个私有 start 方法）
  // ============================================

  applyDeviceTasks(registry: typeof deviceRegistry) {
    for (const device of registry.getAll()) {
      const cfg = device.cronConfig;

      // 预报更新
      this.scheduleTask(cfg.forecastUpdate, device, () =>
        this.updateForecasts(device)
      );

      // 缓存清理
      this.scheduleTask(cfg.cacheCleanup, device, () =>
        device.cacheStrategy.cleanupExpiredCache()
      );

      // 活跃城市清理
      this.scheduleTask(cfg.activeCityCleanup, device, async () => {
        const count = await device.activeCityService.cleanupInactiveCities(3);
        console.log(
          `[${device.name}] Cleaned ${count} inactive cities`
        );
      });

      // 城市同步（可选）
      if (cfg.citySync) {
        this.scheduleCitySync(device, cfg.citySync);
      }
    }
  }

  // ============================================
  // 调度辅助
  // ============================================

  private scheduleTask(
    scheduleKey: string,
    device: DeviceDefinition,
    fn: () => Promise<void>
  ) {
    const task = cron.schedule(
      getCronExpression(scheduleKey),
      async () => {
        console.log(`[${device.name}] Task starting: ${scheduleKey}`);
        try {
          await fn();
        } catch (error) {
          console.error(`[${device.name}] Task error (${scheduleKey}):`, error);
        }
        console.log(`[${device.name}] Task completed: ${scheduleKey}`);
      },
      { timezone: 'Asia/Shanghai' }
    );
    this.tasks.push(task);
    console.log(`[${device.name}] ${getCronDescription(scheduleKey)}`);
  }

  // ============================================
  // 预报更新（通用模式 + 设备特化 transform）
  // ============================================

  private async updateForecasts(device: DeviceDefinition) {
    const activeCities = await device.activeCityService.getActiveCities();
    console.log(
      `[${device.name}] Updating forecasts for ${activeCities.length} cities`
    );

    for (const city of activeCities) {
      try {
        const apiData = await weatherApi.getWeather(city.cityId);
        let xmlData: string;

        if (device.name === 'zte') {
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
          const { default: zteTransform } = await import(
            '@/services/zte/data-transform.js'
          );
          xmlData = zteTransform.toWidgetXml(weatherData, 'ztewidgetcf');
        } else if (device.name === 'htc-accu') {
          const { htcAccuDataTransform: accuTransform } = await import(
            '@/services/htc/htc-accu-data-transform.js'
          );
          const htcData: HTCAccuWeatherData = {
            code: '200',
            location: apiData.city ? [apiData.city] : undefined,
            now: apiData.now,
            daily: apiData.forecast?.daily || [],
          };
          xmlData = accuTransform.generateForecastXml(htcData, city.name);
        } else if (device.name === 'htc-huafeng') {
          const { htcHuaFengDataTransform: huafengTransform } = await import(
            '@/services/htc/htc-huafeng-data-transform.js'
          );
          const htcData: HTCAccuWeatherData = {
            code: '200',
            location: apiData.city ? [apiData.city] : undefined,
            now: apiData.now,
            daily: apiData.forecast?.daily || [],
          };
          // HTCHuaFengDataTransform 使用 generateTestXml 方法
          xmlData = (huafengTransform as any).generateTestXml
            ? (huafengTransform as any).generateTestXml(htcData, city.name)
            : JSON.stringify(htcData);
        } else {
          // htc-g13: 返回 JSON
          xmlData = JSON.stringify({
            code: '200',
            city: apiData.city,
            now: apiData.now,
            daily: apiData.forecast?.daily || [],
            hourly: apiData.hourly,
            updateTime: apiData.updateTime,
          });
        }

        // 写入缓存
        const cacheDuration = await device.cacheStrategy.getCacheDuration(
          'forecast'
        );
        await device.cacheStrategy.createOrUpdateWeatherData(
          city.cityId,
          'forecast',
          xmlData,
          cacheDuration
        );
      } catch (error) {
        console.error(
          `[${device.name}] Error updating ${city.name}:`,
          error
        );
      }
    }
  }

  // ============================================
  // 城市同步（设备特化，延迟导入避免循环依赖）
  // ============================================

  private scheduleCitySync(device: DeviceDefinition, _scheduleKey: string) {
    if (device.name === 'zte') {
      const key = 'ZTE_CITY_SYNC';
      const task = cron.schedule(
        getCronExpression(key),
        async () => {
          try {
            const { default: citySync } = await import(
              '@/services/zte/city-sync.js'
            );
            const count = await citySync.syncCityListFromAPI();
            console.log(`[ZTE] City sync: ${count} cities`);
          } catch (error) {
            console.error('[ZTE] City sync error:', error);
          }
        },
        { timezone: 'Asia/Shanghai' }
      );
      this.tasks.push(task);
      console.log(`[ZTE] ${getCronDescription(key)}`);
    } else if (device.name === 'htc-accu') {
      const key = 'HTC_ACCU_CITY_SYNC';
      const task = cron.schedule(
        getCronExpression(key),
        async () => {
          try {
            const { default: accuCitySync } = await import(
              '@/services/htc/accu-city-sync.js'
            );
            const count = await accuCitySync.syncCityListFromAPI();
            console.log(`[HTC-Accu] City sync: ${count} cities`);
          } catch (error) {
            console.error('[HTC-Accu] City sync error:', error);
          }
        },
        { timezone: 'Asia/Shanghai' }
      );
      this.tasks.push(task);
      console.log(`[HTC-Accu] ${getCronDescription(key)}`);
    }
    // HuaFeng/G13 城市表结构特殊，暂时不自动同步
  }
}

export default new CronService();
