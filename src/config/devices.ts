/**
 * 设备配置 — 消费集中裁决层策略数据
 *
 * 修改设备：编辑 caijuehub/devices-rules.toml → npm run generate → 重启
 * 本文件为 USER CODE，不随 npm run generate 自动修改。
 */

import { deviceRegistry } from '@/services/device-registry.js';
import type {
  DeviceDefinition,
  DataTransformer,
} from '@/services/device-registry.js';
import type { CacheStrategy } from '@/services/cache/cache-strategy.js';
import { DEVICE_REGISTRY } from '@/caijuehub/strategies/devices.strategy.js';

// ============================================
// 已知模块映射（router 路径 → import()）
// ============================================

const routerModules: Record<string, () => Promise<{ default: unknown }>> = {
  '@/routes/zte-weather.js': () => import('@/routes/zte-weather.js'),
  '@/routes/htc-accu-weather.js': () => import('@/routes/htc-accu-weather.js'),
  '@/routes/htc-huafeng-weather.js': () =>
    import('@/routes/htc-huafeng-weather.js'),
  '@/routes/htc-g13-weather.js': () => import('@/routes/htc-g13-weather.js'),
};

const cacheModules: Record<string, () => Promise<unknown>> = {
  '@/services/cache/zte-cache.js': async () =>
    (await import('@/services/cache/index.js')).zteCache,
  '@/services/cache/htc-accu-cache.js': async () =>
    (await import('@/services/cache/index.js')).htcAccuCache,
  '@/services/cache/htc-huafeng-cache.js': async () =>
    (await import('@/services/cache/index.js')).htcHuaFengCache,
  '@/services/cache/htc-g13-cache.js': async () =>
    (await import('@/services/cache/index.js')).htcG13Cache,
};

const transformModules: Record<string, () => Promise<unknown>> = {
  '@/services/zte/data-transform.js': () =>
    import('@/services/zte/data-transform.js'),
  '@/services/htc/htc-accu-data-transform.js': () =>
    import('@/services/htc/htc-accu-data-transform.js'),
  '@/services/htc/htc-huafeng-data-transform.js': () =>
    import('@/services/htc/htc-huafeng-data-transform.js'),
};

const serviceModules: Record<string, () => Promise<{ default: unknown }>> = {
  '@/services/zte/active-city-service.js': () =>
    import('@/services/zte/active-city-service.js'),
  '@/services/htc/active-city-service.js': () =>
    import('@/services/htc/active-city-service.js'),
  '@/services/htc/huafeng-active-city-service.js': () =>
    import('@/services/htc/huafeng-active-city-service.js'),
  '@/services/htc/g13-active-city-service.js': () =>
    import('@/services/htc/g13-active-city-service.js'),
};

// G13 直通转换器
const g13PassThrough: DataTransformer = {
  transform(data: unknown, _cityName: string): string {
    return JSON.stringify(data);
  },
};

// ============================================
// 按策略数据注册设备
// ============================================

async function registerAll() {
  for (const d of DEVICE_REGISTRY) {
    const [routerMod, cache, transform, svc] = await Promise.all([
      routerModules[d.router]?.(),
      cacheModules[d.cache]?.(),
      d.dataTransform === 'passThrough'
        ? Promise.resolve(g13PassThrough)
        : transformModules[d.dataTransform]?.(),
      serviceModules[d.activeCityService]?.(),
    ]);

    const device: DeviceDefinition = {
      name: d.name as DeviceDefinition['name'],
      basePath: d.basePath,
      router: (routerMod as { default: unknown })
        ?.default as DeviceDefinition['router'],
      dataTransform:
        d.dataTransform === 'passThrough'
          ? g13PassThrough
          : (((
              transform as {
                htcAccuDataTransform?: unknown;
                htcHuaFengDataTransform?: unknown;
                default?: unknown;
              }
            )?.htcAccuDataTransform ||
              (
                transform as {
                  htcAccuDataTransform?: unknown;
                  htcHuaFengDataTransform?: unknown;
                  default?: unknown;
                }
              )?.htcHuaFengDataTransform ||
              (transform as { default: unknown })
                ?.default) as unknown as DataTransformer),
      cronConfig: d.cron,
      cacheStrategy: cache as unknown as CacheStrategy,
      activeCityService: (svc as { default: unknown })
        ?.default as DeviceDefinition['activeCityService'],
    };

    deviceRegistry.register(device);
  }
  console.log(
    `[Devices] Registered ${DEVICE_REGISTRY.length} devices (from caijuehub strategy)`
  );
}

// 注册为可等待的 Promise，供 server.ts 在 applyRoutes 前 await，避免异步竞态
// 使用方式: import { deviceRegistration } from './config/devices.js'; await deviceRegistration;
export const deviceRegistration: Promise<void> = registerAll();
