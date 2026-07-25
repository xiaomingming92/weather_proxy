/**
 * DeviceRegistry — 统一设备注册中心
 *
 * 消除 server.ts / cron-service.ts / cache-strategy.ts 对具体设备的硬编码依赖。
 * 新增机型只需注册一个 DeviceDefinition + 一个 DataTransform。
 */
import type { Router, Express } from 'express';
import type { CacheStrategy } from './cache/cache-strategy.js';

// ============================================
// DeviceType — 字面量联合类型（唯一真相源）
// ============================================

export type DeviceType = 'zte' | 'htc-accu' | 'htc-huafeng' | 'htc-g13';

// ============================================
// 接口定义
// ============================================

/** 数据转换器：将 QWeather API 原始数据转为设备专用格式 */
export interface DataTransformer {
  transform(data: unknown, cityName: string): string;
}

/** 活跃城市服务接口 */
export interface ActiveCityService {
  getActiveCities(): Promise<Array<{ name: string; cityId: string }>>;
  cleanupInactiveCities(days: number): Promise<number>;
}

/** Cron 调度配置 */
export interface CronConfig {
  forecastUpdate: string;
  cacheCleanup: string;
  activeCityCleanup: string;
  citySync?: string;
}

/** 设备定义 — 注册一个设备的全部元信息 */
export interface DeviceDefinition {
  name: DeviceType;
  basePath: string;
  router: Router;
  dataTransform: DataTransformer;
  cronConfig: CronConfig;
  cacheStrategy: CacheStrategy;
  activeCityService: ActiveCityService;
}

// ============================================
// CronService 消费接口（避免循环依赖）
// ============================================

export interface CronServiceConsumer {
  applyDeviceTasks(registry: DeviceRegistry): void;
}

// ============================================
// DeviceRegistry 单例
// ============================================

class DeviceRegistry {
  private devices = new Map<DeviceType, DeviceDefinition>();

  /** 注册一个设备 */
  register(device: DeviceDefinition): void {
    if (this.devices.has(device.name)) {
      throw new Error(`[DeviceRegistry] Device already registered: ${device.name}`);
    }
    this.devices.set(device.name, device);
    console.log(`[DeviceRegistry] Registered: ${device.name} → ${device.basePath}`);
  }

  /** 获取所有已注册设备 */
  getAll(): DeviceDefinition[] {
    return Array.from(this.devices.values());
  }

  /** 按名称获取设备 */
  get(name: DeviceType): DeviceDefinition | undefined {
    return this.devices.get(name);
  }

  /** 自动注册路由：遍历设备列表挂载 Express Router */
  applyRoutes(app: Express): void {
    for (const device of this.devices.values()) {
      app.use(device.basePath, device.router);
      console.log(`[DeviceRegistry] Route mounted: ${device.basePath}`);
    }
  }

  /** 自动注册 Cron 任务：委托 CronService 遍历设备列表 */
  applyCronTasks(cronService: CronServiceConsumer): void {
    cronService.applyDeviceTasks(this);
    console.log(`[DeviceRegistry] Cron tasks registered for ${this.devices.size} devices`);
  }

  /** 重置注册表（仅测试用） */
  _reset(): void {
    this.devices.clear();
  }
}

/** 全局单例 */
export const deviceRegistry = new DeviceRegistry();
