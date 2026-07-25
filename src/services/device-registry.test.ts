import { describe, it, expect, beforeEach } from 'vitest';
import {
  deviceRegistry,
  type DeviceDefinition,
  type DataTransformer,
  type CronServiceConsumer,
} from './device-registry.js';
import type { Router, Express } from 'express';

// ============================================
// Mock helpers
// ============================================

function mockRouter(): Router {
  return { use: () => {}, get: () => {}, post: () => {} } as unknown as Router;
}

function mockDataTransform(): DataTransformer {
  return { transform: (data: unknown, _: string) => JSON.stringify(data) };
}

function mockDevice(name: string, basePath: string): DeviceDefinition {
  return {
    name: name as DeviceDefinition['name'],
    basePath,
    router: mockRouter(),
    dataTransform: mockDataTransform(),
    cronConfig: {
      forecastUpdate: 'TEST_FORECAST',
      cacheCleanup: 'TEST_CLEANUP',
      activeCityCleanup: 'TEST_ACTIVE',
    },
    cacheStrategy: {} as any,
    activeCityService: {
      getActiveCities: async () => [],
      cleanupInactiveCities: async () => 0,
    },
  };
}

// ============================================
// Tests
// ============================================

describe('DeviceRegistry', () => {
  beforeEach(() => {
    deviceRegistry._reset();
  });

  describe('register()', () => {
    it('应成功注册一个新设备', () => {
      const device = mockDevice('zte', '/zte');
      expect(() => deviceRegistry.register(device)).not.toThrow();
    });

    it('重复注册同一设备应抛出错误', () => {
      const device = mockDevice('zte', '/zte');
      deviceRegistry.register(device);
      expect(() => deviceRegistry.register(device)).toThrow(
        'Device already registered'
      );
    });
  });

  describe('get()', () => {
    it('应返回已注册的设备', () => {
      const device = mockDevice('htc-g13', '/api/v1/htc-g13');
      deviceRegistry.register(device);
      const found = deviceRegistry.get('htc-g13');
      expect(found).toBeDefined();
      expect(found!.basePath).toBe('/api/v1/htc-g13');
    });

    it('未注册的设备应返回 undefined', () => {
      expect(deviceRegistry.get('htc-huafeng' as any)).toBeUndefined();
    });
  });
  
  describe('getAll()', () => {
    it('应返回所有已注册设备', () => {
      deviceRegistry._reset();
      deviceRegistry.register(mockDevice('zte', '/zte'));
      deviceRegistry.register(mockDevice('htc-accu', '/widget'));
      expect(deviceRegistry.getAll().length).toBe(2);
    });
  });

  describe('applyRoutes()', () => {
    it('应为每个设备挂载路由', () => {
      const mounted: string[] = [];
      const app = {
        use: (path: string) => {
          mounted.push(path);
        },
      } as unknown as Express;

      deviceRegistry.register(mockDevice('zte', '/zte'));
      deviceRegistry.register(mockDevice('htc-g13', '/api/v1/htc-g13'));
      deviceRegistry.applyRoutes(app);

      expect(mounted).toContain('/zte');
      expect(mounted).toContain('/api/v1/htc-g13');
    });
  });

  describe('applyCronTasks()', () => {
    it('应委托 CronService 注册任务', () => {
      let called = false;
      const cronService: CronServiceConsumer = {
        applyDeviceTasks: (_registry) => {
          called = true;
        },
      };

      deviceRegistry.register(mockDevice('zte', '/zte'));
      deviceRegistry.applyCronTasks(cronService);
      expect(called).toBe(true);
    });
  });
});

describe('CacheContext (cache-strategy)', () => {
  it('所有 4 个 DeviceType 均应可创建 CacheContext', async () => {
    const { CacheContext } = await import('./cache/cache-strategy.js');
    const types = ['zte', 'htc-accu', 'htc-huafeng', 'htc-g13'] as const;

    for (const t of types) {
      expect(() => new CacheContext(t)).not.toThrow();
    }
  });
});

describe('scaffold-device', () => {
  it('应输出 4 段 Prisma model', async () => {
    const { execSync } = await import('child_process');
    const output = execSync(
      'npx tsx scripts/scaffold-device.ts --name Samsung',
      { encoding: 'utf-8' }
    );
    const modelCount = (output.match(/^model\s+\w+/gm) || []).length;
    expect(modelCount).toBe(4);
    expect(output).toContain('SamsungWeatherCache');
    expect(output).toContain('SamsungActiveCity');
    expect(output).toContain('SamsungCity');
    expect(output).toContain('SamsungCachePolicy');
  });
});
