# device-registry-refactor — 4 轮原子事务交接手册

> **适用场景**：4 轮原子事务变更，每轮独立收敛。通过 DeviceRegistry 抽象层消除 server.ts / cron-service.ts / cache-strategy.ts 的设备硬编码依赖。
>
> **用途**：每个新对话开始时，把对应轮次章节粘贴给 LLM。

---

## 全局元信息

- **父 Plan**: `device-registry-refactor-新设备平滑接入-plan-v1.md`
- **原子事务拓扑**: `device-registry-refactor-新设备平滑接入-add-route-v1.md`
- **Review**: `.qoder/reviews/device-registry-refactor-新设备平滑接入-review-v1.md`
- **目标仓库**: `$HOME/Sites/weather_proxy`
- **总文件数**: 9 个文件（新建 3 + 修改 6）
- **轮次数**: 4 轮局部闭包
- **DPS**: 108 🟢

```
第1轮 ── 基础设施（DeviceRegistry + DeviceType 扩展）
           │
           ▼
第2轮 ── 路由迁移（设备配置 + server.ts 自动注册 + curl 验证）
           │
           ▼
第3轮 ── Cron 重构 + Bug 修复（精简 ~200 行 + stop() + service 修正）
           │
           ▼
第4轮 ── Cache 统一 + 脚手架（HuaFeng/G13 纳入策略 + scaffold-device.ts）
```

---

## 原子事务边界说明

- **轮次级闭包**：每轮文件集合形成独立边界，不跨轮修改同一文件。
- **独立验证**：每轮可通过 `tsc --noEmit` + `npm run lint` 独立验证。
- 轮次 1.1/1.3 互不依赖，可并行。
- 轮次 4.2（脚手架）完全独立，可与轮次 2/3 并行。
- 轮次 4 是前 3 轮收敛后的收尾，前 3 轮禁止提前实现脚手架。

### 交接手册与 spec 的优先级

- 本 handoff 是新对话的入口索引。具体实现细节以 spec/tasks/checklist 为准。
- 如果 handoff 摘要与 spec 存在颗粒度差异，以 spec 为准。

---

## 第1轮：基础设施

### 你当前的位置

你是第 1 轮。上游无（本轮为起点）。

### 原子事务目标

三个 Task：
- **Task 1.1**: DeviceDefinition + DataTransformer 接口（新建 `src/services/device-registry.ts`）
- **Task 1.2**: DeviceRegistry 单例实现（同上文件）
- **Task 1.3**: DeviceType + CacheContext 扩展（`src/services/cache/cache-strategy.ts`）

### 你要改的文件

| 文件 | 操作 | 改什么 |
|------|------|--------|
| `src/services/device-registry.ts` | 新建 | DeviceDefinition 接口（name/basePath/dataTransform/cronConfig/cacheStrategy/activeCityService）+ DataTransformer 接口 + DeviceRegistry 单例（register/getAll/applyRoutes/applyCronTasks） |
| `src/types/device-registry.ts` | 新建 | DeviceType 字面量联合类型（如有需要独立 types 文件） |
| `src/services/cache/cache-strategy.ts` | 修改 | `DeviceType = 'zte'\|'htc'` → `'zte'\|'htc-accu'\|'htc-huafeng'\|'htc-g13'` |

### 关键契约

- `DeviceRegistry` 单例导出，四个方法返回 void
- `DeviceType` 为字面量联合类型，不引入 Prisma enum
- `applyRoutes(app)` 遍历注册表调用 `app.use(device.basePath, device.router)`

### 高风险误区

- 禁止在轮次 1 中注册具体设备（那是轮次 2 的任务）
- 禁止提前修改 server.ts 或 cron-service.ts

### ADD-7 审计记录

| action | targetType | targetId | 说明 | 状态 |
|--------|-----------|----------|------|:--:|
| `SOURCE_CREATED` | COMPONENT | `src/services/device-registry.ts` | DeviceRegistry 单例 | 待记录 |
| `SOURCE_MODIFIED` | COMPONENT | `src/services/cache/cache-strategy.ts` | DeviceType 扩展 | 待记录 |

**恢复关键词**：
```text
query_audit_logs({ keyword: "DEVICE_REGISTRY" })
→ 返回全部本轮审计记录
```

### 验证标准

- [ ] `tsc --noEmit` 零类型错误
- [ ] `npm run lint` 零新增 warning

---

## 第2轮：路由迁移

### 你当前的位置

你是第 2 轮。上游第1轮已完成 DeviceRegistry 基础设施。

### 上游已完成

- `src/services/device-registry.ts` 已创建（DeviceDefinition + DeviceRegistry 单例）
- `src/services/cache/cache-strategy.ts` DeviceType 已扩展为 4 值

### 原子事务目标

三个 Task：
- **Task 2.1**: 为 ZTE/HTC-Accu/HTC-HuaFeng/HTC-G13 各创建 DeviceDefinition（新建 `src/config/devices.ts`）
- **Task 2.2**: server.ts 删除手动 `app.use()`，改为 `registry.applyRoutes(app)`
- **Task 2.3**: curl 验证所有 12+ 端点响应不变

### 你要改的文件

| 文件 | 操作 | 改什么 |
|------|------|--------|
| `src/config/devices.ts` | 新建 | 4 个 DeviceDefinition 对象，传入现有 router/transform/cache/activeCityService |
| `src/server.ts` | 修改 | 删除手动 import + app.use()，改为 import registry + applyRoutes(app) |

### 关键契约

- 各设备 router 必须 `export default router`（如有不一致需先统一 export 签名）
- 端点路径不变：`/zte/getweatheru.asmx/...`、`/htc-accu/...` 等
- server.ts 启动日志格式不变（如有变化需记录为偏离）

### 高风险误区

- 禁止修改路由文件本身的业务逻辑
- 禁止改 endpoint 路径
- curl 验证必须覆盖全部 12+ 端点

### ADD-7 审计记录

| action | targetType | targetId | 说明 | 状态 |
|--------|-----------|----------|------|:--:|
| `SOURCE_CREATED` | CONFIG | `src/config/devices.ts` | 4 设备配置 | 待记录 |
| `SOURCE_MODIFIED` | API_ROUTE | `src/server.ts` | 自动路由注册 | 待记录 |

### 验证标准

- [ ] `tsc --noEmit` 零类型错误
- [ ] curl 全部 12+ 端点返回 200，body 与改造前一致（不含时间戳字段）
- [ ] `npm run dev` 启动日志不变

---

## 第3轮：Cron 重构 + Bug 修复

### 你当前的位置

你是第 3 轮。上游第1-2轮已完成。

### 上游已完成

- DeviceRegistry 基础设施就绪
- server.ts 已改为自动路由注册
- 4 设备配置已定义

### 原子事务目标

四个 Task：
- **Task 3.1**: CronService 精简 — 移除 14 私有字段 + 14 start 方法 + 4 update 方法，新增统一调度器
- **Task 3.2**: 修复 stop() 遗漏 HuaFeng/G13 共 8 个任务
- **Task 3.3**: 修复 service 错误调用 + 补全 TODO 为实际 weatherApi + cache 写入
- **Task 3.4**: `npm run dev` 验证 Cron 日志

### 你要改的文件

| 文件 | 操作 | 改什么 |
|------|------|--------|
| `src/services/cron-service.ts` | 修改 | 移除旧方法；新增 `applyDeviceTasks(registry)` 遍历注册表；stop() 遍历注册表；修正 service 调用 |

### 关键契约

- 文件从 647 行降至 ~200 行
- `stop()` 后 `started=false`，所有 cron 已注销
- 修复: `updateHtcHuaFengForecasts` 调 `htcHuaFengActiveCityService`（非 `htcActiveCityService`），G13 同理
- HuaFeng/G13 预报更新不再是 TODO 占位，实际调 weatherApi + 写 cache

### 高风险误区

- 禁止遗漏任何 cron 任务的 stop() 注销
- 禁止保留旧的私有字段和 start 方法

### ADD-7 审计记录

| action | targetType | targetId | 说明 | 状态 |
|--------|-----------|----------|------|:--:|
| `SOURCE_MODIFIED` | COMPONENT | `src/services/cron-service.ts` | Cron 统一调度器 | 待记录 |

### 验证标准

- [ ] `cron-service.ts` ≤ 250 行
- [ ] `stop()` 后 `started=false`
- [ ] Cron 日志中 HuaFeng/G13 预报更新为实际 API 调用
- [ ] `npm run dev` 无异常，Cron 日志与改造前一致

---

## 第4轮：Cache 统一 + 脚手架

### 你当前的位置

你是第 4 轮。上游第1-3轮已完成。

### 上游已完成

- DeviceRegistry 基础设施 + 路由自动注册 + Cron 统一调度器
- 所有 Bug 已修复

### 原子事务目标

两个 Task：
- **Task 4.1**: CacheContext 补充 HuaFeng/G13 映射（`src/services/cache/cache-strategy.ts`）
- **Task 4.2**: 建表脚手架脚本（新建 `scripts/scaffold-device.ts`）

### 你要改的文件

| 文件 | 操作 | 改什么 |
|------|------|--------|
| `src/services/cache/cache-strategy.ts` | 修改 | CacheContext 构造函数补充 `'htc-huafeng'`→htcHuaFengCache、`'htc-g13'`→htcG13Cache 映射 |
| `scripts/scaffold-device.ts` | 新建 | 输入设备名，输出 4 段 Prisma model 定义到 stdout |

### 关键契约

- 脚手架默认模板沿用 ZTE 模式（cityId + dataType + xmlData）
- `tsx scripts/scaffold-device.ts --name Samsung` 输出完整 model 块
- 所有 DeviceType 值可创建 CacheContext（`new CacheContext('htc-g13')` 不抛异常）

### ADD-7 审计记录

| action | targetType | targetId | 说明 | 状态 |
|--------|-----------|----------|------|:--:|
| `SOURCE_MODIFIED` | COMPONENT | `src/services/cache/cache-strategy.ts` | CacheContext 扩展 | 待记录 |
| `SOURCE_CREATED` | SCRIPT | `scripts/scaffold-device.ts` | 建表脚手架 | 待记录 |

### 验证标准

- [ ] 所有 DeviceType 值可创建 CacheContext
- [ ] `tsx scripts/scaffold-device.ts --name Samsung` 输出完整 model 块
- [ ] 按新增设备 checklist 以 mock-device 走通全流程

---

## 每轮收敛判定补充规则

### checklist 证据要求

- [ ] 全部项已勾选（不得空勾选、"推测通过"）
- [ ] 每项勾选有可验证证据（编译输出/curl 结果/日志片段）
- [ ] 未执行项保留为 `- [ ]`，注明"待运行时验证"

### 收敛声明规则

当前轮次 AI 不得自行声明"本轮已收敛"。收敛声明只能由开发者或 Review AI 做出。

---

## §7 实际产出与偏离

| 项 | 计划 | 实际 | 偏离说明 |
|------|------|------|------|
| — | — | — | 待实施后填写 |

## §8 验证结果

| 检查项 | 结果 | 证据 |
|------|:--:|------|
| — | — | 待实施后填写 |

## §9 后置确认

- [ ] tasks.md 全部 4 轮 12 Task 已完成
- [ ] checklist.md 全部可验证项已勾选
- [ ] ADD-7 `query_audit_logs` 回查确认落库
- [ ] 新增设备 checklist 以 mock-device 走通

---

## 附录：每轮启动模板

新对话开始时，粘贴以下内容 + 对应轮次章节给 LLM：

```text
## 上下文

你在执行 weather_proxy DeviceRegistry 重构的 [第N轮]。
上游 [第1轮~第N-1轮] 已完成。
先读 .qoder/plans/2026-07/22/device-registry-refactor-新设备平滑接入-handoff-v1.md 的 <第N轮> 章节。

## 启动操作

1. 执行 session-init SKILL（.qoder/skills/session-init/SKILL.md）
2. 执行 add-paradigm SKILL
3. 读本轮对应 spec/tasks/checklist
4. 按 tasks.md 顺序执行代码修改
5. 每完成一个 Task：逐项验证 → 附证据 → 勾选 checklist
6. 每完成一个文件修改：record_dev_operation 写入 ADD-7 审计
7. 完成后：query_audit_logs 回查确认落库

## 关键提醒

- 当前执行的是 [第N轮]/4
- 当前轮次是一个原子工程事务，不允许拆到下一轮补齐
- handoff 是入口索引；具体实现以 spec/tasks/checklist 为准
- 禁止自行声明收敛
- 禁止提前实现下一轮的核心内容
```

---

### 脱敏要求

Handoff 文档中禁止出现硬编码的数据库密码、API Key 等凭据值。

---

*handoff v1 | 2026-07-25 | planKeyword: device-registry-refactor*
