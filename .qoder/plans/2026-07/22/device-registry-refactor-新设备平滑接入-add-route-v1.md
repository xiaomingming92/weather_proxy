# device-registry-refactor-新设备平滑接入-add-route-v1

> **定位**：Plan → ADD Step执行映射。不重复 Plan 的架构设计和 Specs 的任务细节。

**绑定**：Plan: `.qoder/plans/2026-07/22/device-registry-refactor-新设备平滑接入-plan-v1.md` · Review: `.qoder/reviews/device-registry-refactor-新设备平滑接入-review-v1.md` · Handoff: `.qoder/plans/2026-07/22/device-registry-refactor-新设备平滑接入-handoff-v1.md`

---

## Step 0：文档先行

- [x] DPS 通过（108/100）
- [x] Review 三元组就绪（review-v1 + review-implementation-v1 + review-runtime-v1）
- [x] Specs 三元组就绪（spec.md + tasks.md + checklist.md）
- [x] 项目文档无需更新（find_related_docs 未匹配到受影响文档）

---

## Step 1：审计打点定义

> weather_proxy 为 Express API 服务，无 agent-audit 基础设施。审计通过 `record_dev_operation` MCP 工具落库。

| 字面量 | 使用场景 | Task |
|-------|---------|------|
| `DEVICE_REGISTRY_CREATE` | DeviceDefinition 接口 + DeviceRegistry 单例创建 | 1.1/1.2 |
| `DEVICE_TYPE_EXPAND` | DeviceType 联合类型扩展为 4 值 | 1.3 |
| `DEVICE_CONFIG_DEFINE` | 4 设备 DeviceDefinition 配置定义 | 2.1 |
| `SERVER_AUTO_ROUTE` | server.ts 改为 registry.applyRoutes(app) | 2.2 |
| `CRON_UNIFIED_SCHEDULER` | CronService 精简为统一调度器 | 3.1 |
| `CRON_STOP_FIX` | 修复 stop() 遗漏 HuaFeng/G13 共 8 个任务 | 3.2 |
| `CRON_FORECAST_FIX` | 修复 service 错误调用 + 补全 TODO 实现 | 3.3 |
| `CACHE_STRATEGY_EXPAND` | CacheContext 补充 HuaFeng/G13 映射 | 4.1 |
| `DEVICE_SCAFFOLD_CREATE` | 建表脚手架脚本生成 | 4.2 |
| `CAIJUE_DEVICES_RULES` | devices-rules.toml 设备配置 TOML | 5.1 |
| `CAIJUE_SCAFFOLD_RULES` | scaffold-rules.toml 模板 TOML | 5.2 |
| `CAIJUE_TRANSCRIBE` | 转录脚本：TOML → TypeScript | 5.3 |

---

## Step 3：Task 映射表

| # | Task | 文件 | 审计记录 | 新增字面量 | 依赖 | 状态 |
|---|------|------|-----------|-----------|------|------|
| 1.1 | DataTransformer + DeviceDefinition | src/services/device-registry.ts（新建） | record_dev_operation | — | 无 | ⬜ |
| 1.2 | DeviceRegistry 实现 | 同上 | record_dev_operation | DEVICE_REGISTRY_CREATE | 1.1 | ⬜ |
| 1.3 | DeviceType + CacheContext 扩展 | src/services/cache/cache-strategy.ts | record_dev_operation | DEVICE_TYPE_EXPAND | 无 | ⬜ |
| 2.1 | 4 设备配置定义 | src/config/devices.ts（新建） | record_dev_operation | DEVICE_CONFIG_DEFINE | 1.2 | ⬜ |
| 2.2 | server.ts 自动注册 | src/server.ts | record_dev_operation | SERVER_AUTO_ROUTE | 2.1 | ⬜ |
| 2.3 | curl 端点验证 | 无代码改动 | — | — | 2.2 | ⬜ |
| 3.1 | CronService 精简 | src/services/cron-service.ts | record_dev_operation | CRON_UNIFIED_SCHEDULER | 1.2 | ⬜ |
| 3.2 | 修复 stop() 遗漏 | 同上 | record_dev_operation | CRON_STOP_FIX | 3.1 | ⬜ |
| 3.3 | 修复错误调用 + 补全 TODO | 同上 | record_dev_operation | CRON_FORECAST_FIX | 3.1 | ⬜ |
| 3.4 | Cron 日志验证 | 无代码改动 | — | — | 3.1-3.3 | ⬜ |
| 4.1 | CacheContext 扩展 | src/services/cache/cache-strategy.ts | record_dev_operation | CACHE_STRATEGY_EXPAND | 1.3 | ⬜ |
| 4.2 | 建表脚手架脚本 | scripts/scaffold-device.ts（新建） | record_dev_operation | DEVICE_SCAFFOLD_CREATE | 无 | ⬜ |
| 5.1 | devices-rules.toml | caijuehub/devices-rules.toml（新建） | record_dev_operation | CAIJUE_DEVICES_RULES | 无 | ⬜ |
| 5.2 | scaffold-rules.toml | caijuehub/scaffold-rules.toml（新建） | record_dev_operation | CAIJUE_SCAFFOLD_RULES | 5.1 | ⬜ |
| 5.3 | 转录脚本 | scripts/transcribe-devices.ts（新建） | record_dev_operation | CAIJUE_TRANSCRIBE | 5.1,5.2 | ⬜ |
| 5.4 | package.json 脚本 | package.json | — | — | 5.3 | ⬜ |

### 依赖拓扑

```
轮次 1: 基础设施
  1.1 → 1.2
  1.3 (独立)

轮次 2: 路由迁移（依赖轮次 1）
  1.2 → 2.1 → 2.2 → 2.3

轮次 3: Cron 重构（依赖轮次 1+2）
  1.2 → 3.1 → 3.2
              → 3.3
              → 3.4（验证）

轮次 4: Cache 统一 + 脚手架
  1.3 → 4.1
  4.2 (独立)

轮次 5: 集中裁决层 TOML 化 [P1]
  5.1 + 5.2 → 5.3 → 5.4
```

---

## 附录：文件清单

| 文件 | 操作 | Task | targetType | ADD-7 状态 |
|------|------|------|-----------|------------|
| src/services/device-registry.ts | CREATE | 1.1/1.2 | COMPONENT | ✅ |
| src/config/devices.ts | CREATE | 2.1 | CONFIG | ✅ → P1 改为生成 |
| src/server.ts | MODIFY | 2.2 | API_ROUTE | ✅ |
| src/services/cron-service.ts | MODIFY | 3.1-3.3 | COMPONENT | ✅ |
| src/services/cache/cache-strategy.ts | MODIFY | 1.3/4.1 | COMPONENT | ✅ |
| scripts/scaffold-device.ts | CREATE | 4.2 | SCRIPT | ✅ |
| prisma/schema.prisma | — | — | SCHEMA | 不改 |
| caijuehub/devices-rules.toml | CREATE | 5.1 | CAIJUE_RULE | ⬜ |
| caijuehub/scaffold-rules.toml | CREATE | 5.2 | CAIJUE_RULE | ⬜ |
| scripts/transcribe-devices.ts | CREATE | 5.3 | SCRIPT | ⬜ |

---

*add-route v1 | 2026-07-25 | planKeyword: device-registry-refactor*
