# Plan Review: weather-proxy-device-smooth-add-adapter-plan-v1

## Review 元信息

- **Review 对象**: `.qoder/plans/2026-07/22/weather_proxy-new-device-smooth-adapter-plan-v1.md`
- **对比方案**: 方案 A（Device Registry）vs 方案 C（泛型缓存表，P1叠加）
- **Review 时间**: 2026-07-23
- **Review 类型**: 方案选型 + 数据模型决策
- **前置阅读**: 同上 Plan 文档、`prisma/schema.prisma`、`src/services/cron-service.ts`、`src/services/cache/cache-strategy.ts`

---

## 1. 问题复现

项目已适配 4 种终端，每新增一种机型需改动 11 个文件、~1200 行样板代码。Plan 提出通过 Device Registry 消除样板、通过泛型缓存表减少 Prisma 模型数。

本 Review 聚焦：P0（Device Registry）方向是否正确，P1（Prisma 表合并）是否可行。

---

## 2. 方案对比

### 2.1 方案 A：Device Registry（P0）

**核心思路**：统一代码注册模式（DeviceDefinition → DeviceRegistry → 自动注册路由/Cron/缓存），不改数据模型。

**验证结果**：

| 维度 | 计划声称 | 实际验证 | 判定 |
|------|---------|---------|:--:|
| CacheStrategy DeviceType | `'zte'\|'htc'`，HuaFeng/G13 绕过策略 | ✅ 属实：`cache-strategy.ts:L71` 仅 `'zte'\|'htc'`，HuaFeng/G13 直接 import cache 实例 | ✅ |
| server.ts 手动注册 | 5 行 `app.use()` | ✅ 属实：`server.ts:L27-31` 共 5 行设备路由 + 1 行 config 路由 | ✅ |
| CronService 私有方法数 | 12 个 startXxxTask + 4 个 updateXxxForecasts | ⚠️ 实际 14 个 start 方法（含被注释的 HuaFeng/G13 citySync），需在 Spec 中明确 | ⚠️ |
| CronService 行数 | ~639 行 | ✅ 实际 647 行 | ✅ |

**额外发现**：
- `cron-service.ts:L70-98` `stop()` 方法只停止了 ZTE 和 HTC Accu 任务，遗漏 HuaFeng/G13，重构时顺带修复
- `cron-service.ts:L457` `updateHtcHuaFengForecasts()` 错误调用了 `htcActiveCityService` 而非 `htcHuaFengActiveCityService`（L492 的 G13 同样 bug）
- `cron-service.ts:L470,L505` HuaFeng 和 G13 的更新逻辑是 TODO 占位

**结论**：P0 方向 ✅ 正确，方案 A 切实可行，以上额外发现可在实施时一并修复。

---

### 2.2 方案 C：Prisma 表合并（P1 叠加）

**核心思路**：将 4 设备 × 4 类表 = 16 张（实际 15）合并为 ~6 张通用表，加 `deviceType` 列。

**Plan 声称 vs 实际 Schema**：

Plan L152 写"现有（16 张表）"，实际 Prisma schema 中设备专用表为 15 张：

| 设备 | WeatherCache | ActiveCity | City | CachePolicy | 小计 |
|------|:--:|:--:|:--:|:--:|:--:|
| ZTE | ZteWeatherCache | ZteActiveCity | ZteCity | ZteCachePolicy | 4 |
| HTC Accu | HtcAccuWeatherCache | HtcAccuActiveCity | HtcAccuCity | HtcAccuCachePolicy | 4 |
| HTC HuaFeng | HTCHuaFengWeatherCache | HtcHuaFengActiveCity | HTCHuaFengCity | HtcHuaFengCachePolicy | 4 |
| HTC G13 | HtcG13WeatherCache | HtcG13ActiveCity | HtcG13City | — | **3** |

G13 无 CachePolicy（Plan 自己也承认 L159）。

**实际字段差异**（核心否决依据）：

| 维度 | ZTE | HTC Accu | HTC HuaFeng | HTC G13 |
|------|-----|----------|-------------|---------|
| 城市标识字段 | `cityId` | `cityId` | **`cityCode`**（华风编码） | `cityId` |
| 数据类型维度 | `dataType` | **`endpoint`** | **无** | **无** |
| 存储格式 | `xmlData` | `xmlData` | `xmlData` | **`jsonData`** |
| City 表额外字段 | stationId,postcode,sunrise,sunset | country,state | qweatherId,province,country | adm1 |
| WeatherCache 唯一约束 | `[cityId,dataType]` | `[cityId,endpoint]` | `[cityCode]` | `[cityId]` |

这些差异不是"列名不一样"——是**数据模型本身不同**。Plan L162-165 的 P1 目标 model 定义（`deviceType,cityId,dataType,xmlData`）与 HuaFeng（cityCode, 无 dataType）和 G13（jsonData, 无 dataType）的矛盾无法调和。

**host 劫持方案的本质约束**：

每种终端 App 发请求到不同 endpoint、期望不同响应格式、用不同城市编码体系。这是**四个独立的数据产品共用一个代理入口**，共享的只有 weather-api.ts 这一个上游数据源。定制表让每个设备的数据模型清晰独立，新增机型只需建新表 + 写新 transform，不影响已有设备。强硬合并只会得到一个充满 nullable 字段、业务逻辑被 `if deviceType ===` 充斥的"万能表"，违背"即插即用"的设计目标。

---

## 3. 决策结论

| 决策项 | 结论 | 理由 |
|--------|------|------|
| **P0 Device Registry** | ✅ **接受** | 统一代码注册模式，消除 80%+ 样板，风险可控，不涉及数据库迁移 |
| **P1 Prisma 表合并** | ❌ **否决** | host 劫持方案天然要求定制表；各设备字段差异不可调和；合并违背"新增机型不被已有结构束缚"的 P0 设计目标 |
| **Plan 微调项** | ⚠️ **修正** | 表数量 16→15；方法计数核实；City 表不在合并范围 |

---

## 4. 影响评估

### 4.1 受影响文件（P0 实施范围）

| 文件 | 改动 | 风险 |
|------|------|------|
| `src/services/device-registry.ts` | **新建** | 低 |
| `src/config/devices.ts` | **新建** | 低 |
| `src/server.ts` | 删除手动 import，改为 `registry.applyRoutes(app)` | 中（需验证所有端点） |
| `src/services/cron-service.ts` | 删除 14 个私有字段 + 14 个 start 方法 + 4 个 update 方法，新增统一调度器 | 中（需验证 Cron 日志） |
| `src/services/cache/cache-strategy.ts` | DeviceType 扩展为 4 值，CacheContext 补充 HuaFeng/G13 映射 | 低 |

**不再需要改动的文件**（P0 收益）：

| 文件 | 当前 | P0 后 |
|------|------|------|
| `src/server.ts` | 每设备 1 行 `app.use()` | ❌ 不再改动 |
| `src/services/cron-service.ts` | 每设备 ~50 行样板 | ❌ 不再改动 |
| `src/services/cache/cache-strategy.ts` | 硬编码 2 个设备 | ❌ 不再改动 |
| `prisma/schema.prisma` | 15 张设备专用表 | ✅ **保留**（不合并） |

### 4.2 数据流影响

- 现有 4 设备的请求/响应/缓存格式不变
- Cron 刷新链路改为遍历注册表，行为等价
- P1 被否决，数据库无迁移需求

### 4.3 回滚风险

- Device Registry 是代码级抽象，不涉及数据迁移，回滚成本低
- 如出现兼容问题，可临时恢复手动注册而保留 Registry 代码（双轨运行）

---

## 5. Plan 修正项清单

| # | 位置 | 问题 | 修正 |
|---|------|------|------|
| 1 | L152 | 表数量 16 → 实际 15 | 改为"15 张设备专用表" |
| 2 | L161 | "~6 张表"但只列出 4 个 model | 删除或注明 City 表不在合并范围 |
| 3 | L222 | "12 个 startXxxTask"实际 14 个 | 核实后修正 |
| 4 | §三 L147-166 | P1 合并方案整体 | 标记为"否决：host 劫持方案要求定制表" |
| 5 | Task 5 L196-199 | P1 Prisma 合并任务 | 删除或标记为 CANCELLED |

---

## 6. 关联 Checklist

- [ ] P0 完工后，仅通过新增 `DeviceDefinition` + `DataTransform` 完成新设备注册，不碰 `server.ts`/`cron-service.ts`/`cache-strategy.ts`
- [ ] 现有 4 设备所有端点 `curl` 响应 body 与改造前一致
- [ ] `cron-service.ts` 行数从 647 → ~200
- [ ] `stop()` 方法补全 HuaFeng/G13 任务停止逻辑
- [ ] `updateHtcHuaFengForecasts` 和 `updateHtcG13Forecasts` 修正错误调用的 service

---

*Review v1 | 2026-07-23 | 关联 Plan: weather-proxy-device-smooth-add-adapter-plan-v1*
