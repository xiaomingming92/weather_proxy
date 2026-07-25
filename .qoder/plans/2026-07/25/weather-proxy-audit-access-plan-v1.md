# weather-proxy-audit-access-plan-v1

> **Plan/Spec 边界提醒**：Plan 回答"改什么、为什么改、改哪里"。**不要**在 Plan 中写完整类型定义、WHEN-THEN 场景、精确函数签名——那是 Spec 的职责。

## PLAN 元信息

- **Plan 名称**: weather-proxy-audit-access-v1
- **启动时间**: 2026-07-25T16:00:00+08:00
- **主导 AI**: Qoder
- **参考项目**: [codein2027](https://github.com/xiaomingming92/codein2027) — ADD-3/4/5 审计范式实现
- **关联文档**:
  - ADD 规范: `docs/大田精准耕播智能决策系统/knowledge/02-规范/《开发操作审计存档规范》.md`（codein2027）
  - ADD 案例: `docs/哲学理论/add-paradigm-case-study.md`（codein2027）

## HITL 计划总览（一次性提交人类审核）

| 维度 | 内容 | 人类决策 |
|------|------|:---:|
| 影响模块 | 新增 audit-logger.ts（通用审计日志器）、weather-api.ts（API 调用审计）、cron-service.ts（Cron 任务审计）、cache-strategy.ts（缓存命中审计） | 同意/调整 |
| 预估文件数 | 3 个文件（新建 1 + 修改 3） | 同意/调整 |
| 架构变更 | 新增三通道审计日志基础设施（console + file + DB），按 ADD-3/4/5 标准植入业务环节 | 同意/调整 |
| 新增依赖 | 无（复用现有 Prisma + fs） | 同意/调整 |
| 风险等级 | 🟢低 — 纯增量，不改变现有业务逻辑，仅新增可观测性 | 同意/调整 |
| 预计轮次 | 3 轮（基础设施 → 业务植入 → 审计验证） | 同意/调整 |

---

## 一、背景与目标

### 1.1 问题现状

weather_proxy 在 ADD-7（record_dev_operation）方面已具备基础设施，但缺少：

| ADD 原则 | 要求 | 现状 |
|----------|------|------|
| **ADD-3** 最小可观测单元 | 每个关键操作有 start/end 阶段标记 | ❌ Cron/API/Cache 全无 |
| **ADD-4** 三通道输出 | console + file + DB | ❌ 只有 console.log |
| **ADD-5** 审计数据回写 | 审计结果写入业务表 | ❌ 完全缺失 |

**参考 codein2027 实践**：
- RAG 索引系统 9 阶段：`SYNC_START → SCAN → DETECT_CHANGES → VECTORIZE_CHUNK → DONE`
- 日志格式：`[CHAT-PERSIST] [ISO时间] [阶段] 详情 | {JSON extra}`
- 三通道：`console.log` + `logs/chat-persistence/chat-persist.log` + Prisma AuditLog 表

### 1.2 目标

1. **P0**：建立通用审计日志基础设施（audit-logger.ts），支持三通道输出
2. **P0**：在 weather-api.ts / cron-service.ts / cache-strategy.ts 植入 ADD-3 阶段标记
3. **P0**：每次关键操作落库 AuditLog 表（ADD-5），支持 query_audit_logs 回溯

---

## 二、实施 Task + 依赖图

```
轮次 1: 基础设施（P0，无外部依赖）
  ├── Task 1.1: 创建 src/lib/audit-logger.ts（三通道审计日志器）
  └── Task 1.2: 定义 AuditPhase 枚举（天气业务阶段）
        │
        ▼
轮次 2: 业务植入（P0，依赖轮次 1）
  ├── Task 2.1: weather-api.ts 植入 API 调用审计
  ├── Task 2.2: cron-service.ts 植入 Cron 任务审计
  └── Task 2.3: cache-strategy.ts 植入缓存命中审计
        │
        ▼
轮次 3: 审计验证（P0，依赖轮次 2）
  ├── Task 3.1: 验证三通道日志输出
  └── Task 3.2: query_audit_logs 回查验证
```

### 轮次 1: 基础设施

| # | 任务 | 文件 | 说明 | 验收 |
|---|------|------|------|------|
| 1.1 | 审计日志器 | `src/lib/audit-logger.ts`（新建） | 实现 auditLog(phase, detail, extra?) 三通道输出；参考 codein2027 agent-audit-logger.ts 同构设计 | `tsc --noEmit` = 0 |
| 1.2 | 审计阶段枚举 | 同上 | 定义 WeatherAuditPhase：API_REQUEST / API_RESPONSE / API_ERROR / CRON_FORECAST_START / CRON_FORECAST_CITY / CRON_FORECAST_DONE / CACHE_HIT / CACHE_MISS / CACHE_WRITE | `tsc --noEmit` = 0 |

### 轮次 2: 业务植入

| # | 任务 | 文件 | 说明 | 验收 |
|---|------|------|------|------|
| 2.1 | API 审计 | `src/services/weather-api.ts` | getWeather() 入口植入 API_REQUEST，返回时植入 API_RESPONSE，异常时植入 API_ERROR，extra 含 cityId/duration/httpStatus | 日志文件可见 `[WEATHER-API]` 前缀 |
| 2.2 | Cron 审计 | `src/services/cron-service.ts` | updateForecasts() 入口植入 CRON_FORECAST_START，每城市植入 CRON_FORECAST_CITY，完成植入 CRON_FORECAST_DONE，extra 含 device/cityCount/duration | 日志文件可见 `[CRON]` 前缀 |
| 2.3 | Cache 审计 | `src/services/cache/cache-strategy.ts` | getWeatherData() 命中植入 CACHE_HIT，未命中植入 CACHE_MISS，createOrUpdate 植入 CACHE_WRITE，extra 含 deviceType/cityId/dataType | 日志文件可见 `[CACHE]` 前缀 |

### 轮次 3: 审计验证

| # | 任务 | 文件 | 说明 | 验收 |
|---|------|------|------|------|
| 3.1 | 日志输出验证 | 无 | 启动服务后发起请求 + 等待 Cron，检查 `logs/` 目录三通道输出 | 三文件均有内容 |
| 3.2 | 审计回查 | 无 | `query_audit_logs({ keyword: "WEATHER_API" })` 可查到 API 调用记录 | MCP 工具返回正确结果 |

---

## 三、验收标准

- [ ] `src/lib/audit-logger.ts` 三通道输出正常工作
- [ ] `logs/weather-api.log` / `logs/cron.log` / `logs/cache.log` 有内容
- [ ] `query_audit_logs` 可回溯历史 API 调用、Cron 任务、缓存操作
- [ ] `tsc --noEmit` = 0，`npm run lint` 零新增 warning
- [ ] 现有 4 设备端点 curl 行为不变（纯增量，不影响业务逻辑）

---

## 四、关联文档

| 文档 | 路径 |
|------|------|
| ADD 审计规范 | `codein2027/docs/大田精准耕播智能决策系统/knowledge/02-规范/《开发操作审计存档规范》.md` |
| ADD 案例参考 | `codein2027/docs/哲学理论/add-paradigm-case-study.md` |
| DeviceRegistry Plan | `.qoder/plans/2026-07/22/device-registry-refactor-新设备平滑接入-plan-v1.md` |

---

*Plan v1 | 2026-07-25 | planKeyword: weather-proxy-audit-access*
