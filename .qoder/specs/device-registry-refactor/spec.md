# DeviceRegistry 重构 — 新设备平滑接入 Spec

## Why

项目已适配 4 种终端（ZTE V880+ / HTC Accu / HTC HuaFeng / HTC G13），每新增一种机型需改动 11 个文件、~1200 行样板代码。server.ts、cron-service.ts、cache-strategy.ts 对具体设备存在硬编码依赖，导致新增设备时必然改动这三个核心模块。

## What Changes

新增 DeviceRegistry 抽象层，统一管理设备注册/路由挂载/Cron 调度。改造后新增机型只需 1 个 DeviceDefinition 配置 + 1 个 DataTransform 函数，不再触碰 server.ts / cron-service.ts / cache-strategy.ts。

## Impact

| 文件 | 操作 | 影响 |
|------|------|------|
| `src/services/device-registry.ts` | 新建 | DeviceRegistry 单例 + DeviceDefinition 接口 + DataTransformer 接口 |
| `src/types/device-registry.ts` | 新建 | DeviceType 字面量联合类型 |
| `src/config/devices.ts` | 新建 | ZTE/HTC-Accu/HTC-HuaFeng/HTC-G13 的 DeviceDefinition |
| `src/server.ts` | 修改 | 手动 app.use() → registry.applyRoutes(app) |
| `src/services/cron-service.ts` | 修改 | 647 行 → ~200 行，统一调度器 |
| `src/services/cache/cache-strategy.ts` | 修改 | DeviceType 扩展 + CacheContext 补全映射 |
| `scripts/scaffold-device.ts` | 新建 | 建表脚手架 |
| `prisma/schema.prisma` | 不改 | 保持 15 张设备专用表 |

**P1 集中裁决层**：

| 文件 | 操作 | 影响 |
|------|------|------|
| `caijuehub/devices-rules.toml` | 新建 | 设备配置 TOML（唯一直相源），替代手写 devices.ts |
| `caijuehub/scaffold-rules.toml` | 新建 | Prisma 模型模板 TOML（default / htc-g13 / htc-huafeng） |
| `scripts/transcribe-devices.ts` | 新建 | 转录脚本：TOML → devices.ts + 模板常量 |
| `src/config/devices.ts` | 改为生成 | 从手写变为 `npm run generate:devices` 自动生成 |

## ADDED Requirements

### Requirement: DeviceRegistry 统一注册

#### Scenario: 新设备注册

- **WHEN** 开发者在 `src/config/devices.ts` 中新增一个 DeviceDefinition 对象
- **THEN** 设备的路由自动注册到 Express、Cron 任务自动注册到 CronService、缓存策略自动可用
- **AND** 无需修改 `server.ts` / `cron-service.ts` / `cache-strategy.ts`

### Requirement: DeviceType 扩展

#### Scenario: HuaFeng/G13 纳入策略模式

- **WHEN** 代码使用 `new CacheContext('htc-huafeng')` 或 `new CacheContext('htc-g13')`
- **THEN** 返回对应的 Cache 实现（htcHuaFengCache / htcG13Cache），不再抛异常

### Requirement: Cron 统一调度

#### Scenario: CronService 精简

- **WHEN** 服务启动
- **THEN** CronService 遍历 DeviceRegistry 注册所有设备的定时任务
- **AND** `stop()` 遍历注册表停止所有任务，无残留
- **AND** 文件行数从 647 降至 ~200

### Requirement: Bug 修复

#### Scenario: HuaFeng/G13 Cron 修复

- **WHEN** HuaFeng 预报更新定时任务触发
- **THEN** 调用 `htcHuaFengActiveCityService`（非 `htcActiveCityService`）
- **AND** 实际调用 weatherApi 获取数据并写入缓存（非 TODO 占位）
- **AND** G13 同理修正

### Requirement: 建表脚手架

#### Scenario: 新设备建表

- **WHEN** 开发者执行 `tsx scripts/scaffold-device.ts --name Samsung`
- **THEN** 输出 4 段 Prisma model 定义到 stdout（WeatherCache / ActiveCity / City / CachePolicy）
- **AND** 默认模板沿用 ZTE 模式（cityId + dataType + xmlData）

### Requirement: 集中裁决层 TOML 化

#### Scenario: 设备配置声明式管理

- **WHEN** 开发者在 `caijuehub/devices-rules.toml` 中新增一条 `[[device]]` 配置
- **THEN** 运行 `npm run generate:devices` 自动生成 `src/config/devices.ts`
- **AND** 无需手写 TypeScript import 路径和对象字面量

#### Scenario: Prisma 模板声明式扩展

- **WHEN** 新设备使用非默认数据模型（如 jsonData 替代 xmlData）
- **THEN** 在 `caijuehub/scaffold-rules.toml` 中定义新模板或继承已有模板
- **AND** `scripts/scaffold-device.ts --template <name>` 按模板输出 model
- **AND** 无需修改脚手架脚本代码
# device-registry-refactor Spec

## 1. 数据模型

### 1.1 DeviceDefinition

```typescript
type DeviceType = 'zte' | 'htc-accu' | 'htc-huafeng' | 'htc-g13'

interface DataTransformer {
  transform(data: WeatherData, cityName: string): string
}

interface DeviceDefinition {
  name: DeviceType
  basePath: string
  router: express.Router
  dataTransform: DataTransformer
  cronConfig: {
    forecastUpdate: string
    cacheCleanup: string
    activeCityCleanup: string
    citySync?: string
  }
  cacheStrategy: CacheStrategy
  activeCityService: {
    getActiveCities(): Promise<City[]>
    recordActiveCity(name: string, cityId: string): Promise<void>
    cleanupInactiveCities(days: number): Promise<number>
  }
}
```

### 1.2 DeviceRegistry

```typescript
class DeviceRegistry {
  private devices: Map<string, DeviceDefinition>

  register(device: DeviceDefinition): void
  getAll(): DeviceDefinition[]
  applyRoutes(app: express.Express): void
  applyCronTasks(cronService: CronService): void
}
```

## 2. 接口规范

### 2.1 路由自动注册

applyRoutes 遍历所有已注册设备，为每个 device 挂载 `app.use(device.basePath, device.router)`。

### 2.2 Cron 自动注册

applyCronTasks 遍历所有已注册设备，为每个 device 创建 4 个 cron 任务（forecastUpdate / cacheCleanup / activeCityCleanup / citySync）。调度参数从 device.cronConfig 读取。

### 2.3 脚手架

scaffold-device.ts 接收参数：
- `--name <DeviceName>`（必填，PascalCase）
- `--output <path>`（可选，默认 stdout）

输出 4 段 Prisma model 定义（WeatherCache/City/ActiveCity/CachePolicy）。

## 3. 边界条件

- DeviceType 扩展时需同步更新 CacheContext 构造函数映射
- 脚手架生成的 model 默认使用 ZTE 模式字段（cityId/dataType/xmlData）
- City 表额外字段需人工根据设备协议调整
- Prisma schema 保持 15 张设备专用表（不合并）
