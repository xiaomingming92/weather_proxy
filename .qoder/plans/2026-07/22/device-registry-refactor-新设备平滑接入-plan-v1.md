# device-registry-refactor-新设备平滑接入-plan-v1

> **Plan/Spec 边界提醒**：Plan 回答"改什么、为什么改、改哪里"——写到让 Review 能判断方向对不对、有没有遗漏维度的程度（文件路径 + Task 验收标准 + 架构维度全覆盖）。**不要**在 Plan 中写完整 TS 类型定义、WHEN-THEN 场景、精确函数签名——那是 Spec 的职责。详见 [《ADD开发工作路径与文档协同规范》§8.1.1](/home/xmm/Sites/weather_proxy/docs/weather-proxy/knowledge/01-架构/《ADD开发工作路径与文档协同规范》.md)。

## PLAN 元信息

- **Plan 名称**: device-registry-refactor-v1
- **启动时间**: 2026-07-22T15:00:00+08:00
- **主导 AI**: Qoder
- **关联文档**:
  - ADD Route: `.qoder/plans/2026-07/22/device-registry-refactor-新设备平滑接入-add-route-v1.md`
  - Handoff: `.qoder/plans/2026-07/22/device-registry-refactor-新设备平滑接入-handoff-v1.md`
  - Review: `.qoder/reviews/device-registry-refactor-新设备平滑接入-review-v1.md`
- **ADD-7 审计策略**:

| 文件 | targetType | action | beforeState | afterState | 状态 |
|-----|-----------|--------|------------|-----------|------|
| src/services/device-registry.ts | COMPONENT | CREATE | 无统一注册入口 | DeviceRegistry 单例 + DeviceDefinition 接口 | ✅ 已实施 |
| src/services/cache/cache-strategy.ts | COMPONENT | MODIFY | DeviceType = 'zte'\|'htc' | DeviceType = 'zte'\|'htc-accu'\|'htc-huafeng'\|'htc-g13' | ✅ 已实施 |
| src/server.ts | API_ROUTE | MODIFY | 手动 import 5 个路由文件 | 遍历 DeviceRegistry 自动注册 | ✅ 已实施 |
| src/services/cron-service.ts | COMPONENT | MODIFY | 14 个私有字段 + 14 个 start 方法 + 4 个 update 方法；stop() 遗漏 8 个任务；HuaFeng/G13 调用错误 service | 统一调度器（232行）；stop() 全覆盖；预报更新正确调用各自 service | ✅ 已实施 |
| prisma/schema.prisma | SCHEMA | — | 15 张设备专用表（P1 合并已否决） | 不变，新增机型继续建定制表 | ✅ 已实施 |
| src/services/cache/cache-strategy.ts | COMPONENT | MODIFY | DeviceType = 'zte'\|'htc'；CacheContext 仅映射 2 设备 | DeviceType 扩展为 4 值；CacheContext 补全 HuaFeng/G13 映射 | ✅ 已实施 |
| src/config/devices.ts | CONFIG | CREATE | — | 4 设备 DeviceDefinition + G13 直通转换器 | ✅ 已实施 |
| scripts/scaffold-device.ts | SCRIPT | CREATE | — | 建表脚手架 | ✅ 已实施 |

**集中裁决层（Caijuehub）**：

| 文件 | targetType | action | 说明 | 状态 |
|-----|-----------|--------|------|------|
| caijuehub/devices-rules.toml | CAIJUE_RULE | CREATE | 设备配置 TOML 声明（唯一直相源） | ⬜ 待实施 |
| caijuehub/scaffold-rules.toml | CAIJUE_RULE | CREATE | Prisma 模型模板 TOML 声明 | ⬜ 待实施 |
| scripts/transcribe-devices.ts | SCRIPT | CREATE | TOML → devices.ts 转录脚本 | ⬜ 待实施 |

---

## HITL 计划总览（一次性提交人类审核）

> **规则**：AI 先在此表中列出 Plan 的全部关键决策，等待人类一次性拍板后再展开详细设计。
> 禁止跳过此表直接写正文——这是方向校准入口。

| 维度 | 内容 | 人类决策 |
|------|------|:---:|
| P0 影响模块 | 路由注册层（server.ts）、Cron 调度层（cron-service.ts）、缓存策略层（cache-strategy.ts）；新增 DeviceRegistry（device-registry.ts）、设备配置（devices.ts）、脚手架脚本 | ✅ P0 已实施 |
| P0 预估文件数 | 9 个文件（新建 3 + 修改 6） | ✅ 已实施 |
| P0 架构变更 | 新增 DeviceRegistry 抽象层统一管理设备注册/路由挂载/Cron 调度，消除 server.ts 和 cron-service.ts 对具体设备的硬编码依赖 | ✅ 已实施 |
| P1 架构变更 | 集中裁决层 TOML 化：devices.ts 和 scaffold-device.ts 从手写 TS 改为 TOML 声明 → 转录脚本 → 生成 TS。参考 add-coder 集中裁决层（Caijuehub）范式，将设备配置和 Prisma 模板从硬编码抽离为可声明的规则文件 | 同意/调整 |
| P1 新增依赖 | 无（转录脚本纯 Node.js，不引入新依赖） | 同意/调整 |
| 风险等级 | 🟢低 — P0 已完工验证通过，P1 仅改动配置生成方式，不改变运行时行为 | 同意/调整 |
| 预计轮次 | P0 4 轮（已完成）+ P1 1 轮（集中裁决层化） | 同意/调整 |

> **人类确认后**：AI 在下方展开完整 Plan 设计。

---

## 一、背景与目标

### 1.1 问题现状

项目已适配 4 种终端（ZTE V880+ / HTC Accu 国际版 / HTC 华风国行 / HTC G13 新App）。

**每新增一种机型，需改动 11 个文件、写 ~1200 行样板代码**：

| # | 文件 | 样板代码量 | 模式 |
|---|------|---------|------|
| 1 | `prisma/schema.prisma` | ~80 行 | 复制现有表 DDL，改表名 |
| 2 | `src/types/<设备名>.ts` | ~100 行 | 复制 zte.ts 或 htc-accu.ts |
| 3 | `src/services/cache/<设备名>-cache.ts` | ~250 行 | 复制现有 cache，全局替换表名 |
| 4 | `src/services/cache/index.ts` | 1 行 | 加 export |
| 5 | `src/services/<设备名>/data-transform.ts` | ~200 行 | 不同设备 XML 结构不同，需手写 |
| 6 | `src/routes/<设备名>-weather.ts` | ~300 行 | 复制同类路由，改 endpoint 和 transform |
| 7 | `src/server.ts` | 1 行 | 加 `app.use()` |
| 8 | `src/services/cron-service.ts` | ~50 行 | 复制 startXxxTask + updateXxxForecasts |
| 9 | `src/config/cron-schedules.ts` | ~5 行 | 加 schedule key |
| 10 | `src/services/htc/<设备名>-active-city-service.ts` | ~150 行 | 复制类似 service |
| 11 | `src/services/htc/<设备名>-city-sync.ts` | ~100 行 | 复制类似 sync 逻辑 |

**各组件重复度测量**（基于 4 个现有实现逐文件对比）：

| 组件 | 文件范围 | 重复率 | 差异点 |
|------|---------|:---:|------|
| Cache Service | zte/htc-accu/htc-huafeng/htc-g13-cache.ts | 90% | 表名、字段名（cityId vs cityCode）、JSON vs XML |
| Active City | 4 个 active-city-service.ts | 85% | 表名、字段名 |
| Route | 4 个 route 文件 | 70% | endpoint、transform 调用、校验参数 |
| Cron | cron-service.ts 内 4 组方法 | 80% | 调用的 cache/transform 实例不同 |
| Prisma | schema.prisma 内 15 张表 | 95% | 表名、unique 索引字段名 |

**核心痛点**：
1. CacheStrategy 接口已定义但 DeviceType 停留在 `'zte'|'htc'`，HuaFeng 和 G13 绕过策略模式直接调 cache
2. server.ts 手动注册路由，新增设备必然改动启动入口
3. cron-service.ts 每设备 4 个私有方法，新增设备需改 CronService 类本身（当前 647 行）
4. Prisma schema 表爆炸：4设备 × 4类表 = 15 张

### 1.2 目标

1. **P0（必达）**：新增机型不再需要改动 `server.ts` / `cron-service.ts` / `cache-strategy.ts`，只需注册 1 个 DeviceDefinition 配置 + 1 个 DataTransform
2. **P1 Prisma 表合并**：❌ **已否决**（Review v1）。host 劫持方案下各设备数据模型差异不可调和：cityCode vs cityId、endpoint vs dataType、xmlData vs jsonData。定制表是必然选择。
3. **非目标**：不改动 Weather API（weather-api.ts）、不改动 XML 响应的业务格式、不改动现有 4 设备的对外端点路径

---

## 二、方案选型

### 2.1 候选方案对比

| 方案 | 改动范围 | 新增机型成本 | 向后兼容 | 工时 | 长期维护 | 结论 |
|------|---------|:---:|------|------|------|:---:|
| A: Device Registry | 新建 1 文件 + 改 3 文件（server/cron/cache-strategy） | 1 配置 + 1 transform | 需迁移现有 4 设备到注册表 | ~11h | 低（新增即插即用） | ✅ |
| B: 不改 | 无 | 11 文件 / 1200 行 | 无风险 | 0h | 高（重复持续膨胀） | ❌ |
| C: 泛型缓存表 | 在 A 基础上改 Prisma + 4 个 cache service | 同 A | 需数据迁移 + 现有缓存表重命名 | +15h | 最低 | ⚠️ 风险高 |

### 2.2 选型理由

选择 **A（Device Registry）** 作为唯一方案：
- 以最少文件改动（新建 1 + 改 3）消除 80%+ 样板，不涉及数据库迁移，风险可控
- P1 表合并已被 Review 否决（host 劫持方案天然要求定制表），从 Plan 中移除
- 不选 B 因为问题会随新增机型线性恶化

---

## 三、架构设计

### 3.1 数据流转

#### 3.1.1 运行时数据流转（请求 + Cron 刷新）

```
客户端请求（如 GET /zte/getweatheru.asmx/getData?cityId=xxx）
  │
  ├─(1)──▶ src/server.ts（改造后：遍历 registry.getAll() 注册路由）
  │        失败回退：Express 返回 404 → 客户端重试
  │
  ▼
路由处理（src/routes/<设备名>-weather.ts，不改）
  │
  ├─(2)──▶ 参数校验 → 失败回退：400 + 错误描述
  │
  ├─(3)──▶ src/services/weather-api.ts（公共入口，不改）
  │        失败回退：返回缓存数据（如有）；无缓存则 503
  │
  ├─(4)──▶ DataTransform（设备专用，实现统一接口）
  │        失败回退：原样返回 API JSON（备选），记录错误日志
  │
  ├─(5)──▶ CacheService（策略模式，按 DeviceType 路由）
  │        失败回退：跳过缓存，直接返回实时数据
  │
  ▼
XML/JSON 响应

Cron 定时刷新链路：
  src/services/cron-service.ts（改造后：遍历 registry.getAll()）
    │
    ├─(6)──▶ 对每个 device 执行 device.cronSchedule 配置的定时任务
    │        失败回退：跳过该设备，下一个周期重试，记录错误日志
    │
    ▼
    调用 weatherApi.getWeather(cityId) → DataTransform → CacheService 更新
```

#### 3.1.2 新设备接入数据流转（从脚手架到上线）

```
开发者执行：npm run device:new -- --name Samsung
  │
  ├─(A)──▶ scripts/scaffold-device.ts（新建）
  │        输入：设备名 "Samsung"
  │        输出：4 段 Prisma model 定义 → prisma/schema.prisma
  │        失败回退：提示错误，不修改 schema
  │
  ├─(B)──▶ 人工决策：对照设备协议文档
  │        检查：cityId vs cityCode、dataType vs endpoint、xmlData vs jsonData
  │        调整：City 表额外字段（stationId/adm1/country/...）
  │        失败回退：prisma validate 报错
  │
  ├─(C)──▶ prisma db push
  │        输出：MariaDB 中创建新设备 4 张表
  │        失败回退：检查 MariaDB 3306 端口
  │
  ├─(D)──▶ src/config/devices.ts（新建）
  │        添加 DeviceDefinition
  │        失败回退：tsc 报具体行
  │
  └─(E)──▶ curl http://localhost:1888/samsung/...
            验证：HTTP 200 + 正确响应格式
```

### 3.2 组件关系

```
┌─────────────────────────────────────────────────────┐
│                   DeviceRegistry                      │
│  register(d) / getAll() / applyRoutes(app) /        │
│  applyCronTasks(cronService)                         │
└──────┬──────────────┬───────────────┬───────────────┘
       │              │               │
       ▼              ▼               ▼
┌──────────┐  ┌────────────┐  ┌──────────────────┐
│ Express  │  │ CronService│  │  CacheStrategy   │
│ Router   │  │ (精简后)   │  │  (策略模式)       │
│ 自动注册 │  │ 自动注册   │  │  DeviceType 路由  │
└──────────┘  └────────────┘  └──────────────────┘
```

### 3.3 数据模型变更

**不改。** P1 表合并方案已被 Review 否决。Prisma schema 保持 15 张设备专用表不变，新增机型继续建定制表。

---

## 四、实施 Task + 依赖图

```
轮次 1: 基础设施（P0，无外部依赖）
  ├── Task 1.1: DeviceDefinition 类型 + DataTransformer 接口（src/services/device-registry.ts 新建）
  ├── Task 1.2: DeviceRegistry 实现（同上文件）
  └── Task 1.3: DeviceType 联合类型 + CacheContext 映射扩展（src/services/cache/cache-strategy.ts）
        │ 产出：DeviceRegistry 可 import 使用
        ▼
轮次 2: 路由迁移（P0，依赖轮次 1）
  ├── Task 2.1: 定义 4 设备配置（src/config/devices.ts 新建）
  ├── Task 2.2: server.ts 改为 registry.applyRoutes(app)（src/server.ts）
  └── Task 2.3: curl 验证 4 设备所有端点
        │ 消费轮次 1 的 applyRoutes
        ▼
轮次 3: Cron 重构 + Bug 修复（P0，依赖轮次 1+2）
  ├── Task 3.1: CronService 精简 — 移除私有字段+方法，新增统一调度器（src/services/cron-service.ts）
  ├── Task 3.2: 修复 stop() 遗漏 HuaFeng/G13 共 8 个任务（同上）
  ├── Task 3.3: 修复 HuaFeng/G13 Cron 错误调用 service + 补全 TODO 占位实现（同上）
  └── Task 3.4: npm run dev 验证 Cron 日志
        │ 消费轮次 1 的 applyCronTasks + DeviceType
        ▼
轮次 4: Cache 统一 + 脚手架（P0，轮次 4.1 依赖轮次 1，轮次 4.2 无依赖）
  ├── Task 4.1: HuaFeng/G13 纳入 CacheStrategy 接口（同上 cache-strategy.ts）
  └── Task 4.2: 建表脚手架脚本 + 引导文档（scripts/scaffold-device.ts 新建）
        ▼
轮次 5: 集中裁决层化（P1，无 P0 依赖）
  ├── Task 5.1: devices-rules.toml — 设备配置 TOML（caijuehub/ 新建）
  ├── Task 5.2: scaffold-rules.toml — 模型模板 TOML（同上）
  ├── Task 5.3: 转录脚本 — TOML → TypeScript（scripts/transcribe-devices.ts 新建）
  └── Task 5.4: package.json 脚本 — generate:devices + device:new
```

### 轮次 1: 基础设施

| # | 任务 | 文件 | 说明 | 验收 |
|---|------|------|------|------|
| 1.1 | 定义 DeviceDefinition + DataTransformer | `src/services/device-registry.ts`（新建） | 定义 DeviceDefinition（含 name/basePath/dataTransform/cronConfig/cacheStrategy/activeCityService）和 DataTransformer 接口 | `tsc --noEmit` |
| 1.2 | DeviceRegistry 实现 | 同上 | 实现 `register()` / `getAll()` / `applyRoutes(app)` / `applyCronTasks(cronService)` 四个方法，单例导出 | `tsc --noEmit` |
| 1.3 | DeviceType + CacheContext 扩展 | `src/services/cache/cache-strategy.ts` | DeviceType 改为 `'zte' \| 'htc-accu' \| 'htc-huafeng' \| 'htc-g13'`，CacheContext 构造函数映射 4 个实现 | `new CacheContext('htc-g13')` 不抛异常 |

### 轮次 2: 路由迁移

| # | 任务 | 文件 | 说明 | 验收 |
|---|------|------|------|------|
| 2.1 | 定义 4 设备配置 | `src/config/devices.ts`（新建） | 为 ZTE/HTC-Accu/HTC-HuaFeng/HTC-G13 各创建 DeviceDefinition，传入现有 router/transform/cache | 4 个对象 tsc 编译通过 |
| 2.2 | server.ts 自动注册 | `src/server.ts` | 删除手动 `app.use()` 行，改为 `registry.applyRoutes(app)` | server.ts 行数减少，启动日志不变 |
| 2.3 | 端到端验证 | 不涉及代码改动 | `curl` 所有现有端点（≥12 个），确认响应格式/状态码不变 | 全部 200，body 与改造前一致 |

### 轮次 3: Cron 重构 + Bug 修复

| # | 任务 | 文件 | 说明 | 验收 |
|---|------|------|------|------|
| 3.1 | CronService 精简 | `src/services/cron-service.ts` | 移除 14 个私有字段 + 14 个 start 方法 + 4 个 update 方法；新增 `applyDeviceTasks(registry)` 遍历注册表统一调度 | 文件从 647 行降至 ~200 行 |
| 3.2 | 修复 stop() 遗漏 | 同上 | `stop()` 当前只停止 ZTE 和 HTC Accu 的 5 个任务，遗漏 HuaFeng/G13 的 forecast/cleanup/sync 共 8 个任务；改造后 `stop()` 遍历注册表统一停止 | `stop()` 后 `started=false`，所有 cron 任务已注销 |
| 3.3 | 修复 HuaFeng/G13 错误调用 + 补全 TODO | 同上 | `updateHtcHuaFengForecasts` 错误调用 `htcActiveCityService`（应为 `htcHuaFengActiveCityService`）；G13 同理；补全 HuaFeng/G13 预报更新的 TODO 占位为实际 weatherApi + cache 写入 | Cron 查询正确的活跃城市表，实际写入缓存 |
| 3.4 | Cron 日志验证 | 无 | `npm run dev`，检查启动日志中 Cron 任务描述与改造前一致 | 日志 diff 为空 |

### 轮次 4: Cache 统一 + 脚手架

| # | 任务 | 文件 | 说明 | 验收 |
|---|------|------|------|------|
| 4.1 | HuaFeng/G13 纳入策略 | `src/services/cache/cache-strategy.ts` | CacheContext 构造函数补充 `'htc-huafeng'` → htcHuaFengCache、`'htc-g13'` → htcG13Cache 映射 | 所有 DeviceType 值可创建 CacheContext |
| 4.2 | 建表脚手架脚本 | `scripts/scaffold-device.ts`（新建） | 输入设备名，输出 4 段 Prisma model 定义到 stdout。默认模板沿用 ZTE 模式（cityId + dataType + xmlData） | `tsx scripts/scaffold-device.ts --name Samsung` 输出完整 model 块 |

**新增设备 checklist（脚手架引导流程）**：

```
新增设备 Samsung：
  1. 生成模型：  npx tsx scripts/scaffold-device.ts --name Samsung >> prisma/schema.prisma
  2. 调整字段：  打开 schema.prisma，检查 SamsungWeatherCache：
                - 城市编码用 cityId 还是 cityCode？
                - 数据维度用 dataType 还是 endpoint？
                - 存储格式是 xmlData 还是 jsonData？
                - City 表需要哪些额外字段？（参考设备协议文档）
  3. 建表：      prisma db push
  4. 注册设备：  在 src/config/devices.ts 中新增 DeviceDefinition
  5. 验证：      启动服务后 curl 设备端点
```

---

## 五、P0 验收标准（已完工）

- [x] P0 完工后，可以仅通过新增一个 `DeviceDefinition` 对象 + 一个 `DataTransform` 函数，完成对模拟设备 `mock-device` 的注册，且无需改动 `server.ts` / `cron-service.ts` / `cache-strategy.ts`
- [x] 现有 4 个机型所有 12+ 个 API 端点 `curl` 响应 body 与改造前逐字节一致（不含时间戳字段）
- [x] `npm run dev` 启动日志输出与改造前一致
- [x] `tsc --noEmit` 新增代码零类型错误
- [x] `cron-service.ts` 文件行数从 647 降至 232 行
- [x] `stop()` 方法覆盖所有已注册 cron 任务，无残留
- [x] HuaFeng/G13 的 Cron 预报更新实际写入缓存（不再是 TODO 占位）
- [x] Task 4.2 完工后，`scaffold-device.ts --name Samsung` 输出 4 段 Prisma model

---

## 六、P1 集中裁决层 TOML 化（增量）

### 6.1 目标

参考 add-coder 集中裁决层（Caijuehub）范式，将 `devices.ts` 和 `scaffold-device.ts` 从手写 TypeScript 改为 TOML 声明 → 转录脚本 → 生成 TypeScript。

**核心收益**：新增设备从「写 30 行 TS + 懂 import 路径」降为「写 10 行 TOML」，零代码风险，仓库可持续活下去。

### 6.2 数据流转

```
caijuehub/devices-rules.toml        ← 设备配置 TOML（手写，唯一直相源）
caijuehub/scaffold-rules.toml       ← Prisma 模型模板 TOML（手写）
        │
        │  npm run generate:devices
        ▼
scripts/transcribe-devices.ts       ← 转录脚本（纯 Node.js，无新依赖）
        │
        ├─→ src/config/devices.ts    ← 自动生成，不手动编辑
        │
        ▼
server.ts / cron-service.ts         ← import 消费，不变

caijuehub/scaffold-rules.toml
        │
        │  scripts/scaffold-device.ts --template <name>
        ▼
prisma/schema.prisma                ← 追加 4 段 model
```

### 6.3 devices-rules.toml 设计

```toml
# 设备注册表 — 唯一直相源
# 修改此文件后运行 npm run generate:devices

[[device]]
name = "zte"
basePath = "/zte/getweatheru.asmx"
router = "@/routes/zte-weather.js"
dataTransform = "@/services/zte/data-transform.js"
cache = "@/services/cache/zte-cache.js"
activeCityService = "@/services/zte/active-city-service.js"

[device.cron]
forecastUpdate = "ZTE_FORECAST_UPDATE"
cacheCleanup = "ZTE_CACHE_CLEANUP"
activeCityCleanup = "ZTE_ACTIVE_CITY_CLEANUP"
citySync = "ZTE_CITY_SYNC"

[[device]]
name = "htc-g13"
basePath = "/api/v1/htc-g13"
router = "@/routes/htc-g13-weather.js"
dataTransform = "passThrough"       # G13 无独立 transform
cache = "@/services/cache/htc-g13-cache.js"
activeCityService = "@/services/htc/g13-active-city-service.js"

[device.cron]
forecastUpdate = "HTC_G13_FORECAST_UPDATE"
cacheCleanup = "HTC_ACCU_CACHE_CLEANUP"
activeCityCleanup = "HTC_G13_ACTIVE_CITY_CLEANUP"
citySync = "HTC_G13_CITY_SYNC"

# ... zte, htc-accu, htc-huafeng
```

### 6.4 scaffold-rules.toml 设计

```toml
# Prisma 模型模板 — 唯一直相源
# 修改此文件后 npm run generate:devices 同步更新

[template.default]
description = "default: cityId + dataType + xmlData (ZTE/Accu 模式)"
tables = ["WeatherCache", "ActiveCity", "City", "CachePolicy"]

[template.default.fields]
id = "Int @id @default(autoincrement())"
cacheDuration = "Int @default(30)"
timestamp = "BigInt"
expiresAt = "BigInt"
createdAt = "BigInt"
updatedAt = "BigInt"

[template.default.WeatherCache]
extra = """
  cityId        String
  dataType      String
  xmlData       String   @db.Text
"""
unique = [["cityId", "dataType"]]
indexes = ["expiresAt", "dataType"]

[template.default.ActiveCity]
extra = """
  name         String
  cityId       String   @unique
  lastAccessed BigInt
"""
indexes = ["name", "lastAccessed"]

[template.default.City]
extra = """
  name        String   @unique
  cityId      String   @unique
"""

[template.default.CachePolicy]
extra = """
  dataType    String   @unique
  duration    Int
  description String?
"""

# G13 特殊模板
[template."htc-g13"]
description = "G13: cityId @unique + jsonData，无 CachePolicy"
tables = ["WeatherCache", "ActiveCity", "City"]
inherits = "default"

[template."htc-g13".WeatherCache]
extra = """
  cityId        String   @unique
  jsonData      String   @db.Text
"""
unique = [["cityId"]]
indexes = ["expiresAt"]

# 华风特殊模板
[template."htc-huafeng"]
description = "HuaFeng: cityCode 替代 cityId，无 dataType 维度"
tables = ["WeatherCache", "ActiveCity", "City", "CachePolicy"]
inherits = "default"

[template."htc-huafeng".WeatherCache]
extra = """
  cityCode      String
  xmlData       String   @db.Text
"""
unique = [["cityCode"]]
indexes = ["expiresAt"]
```

### 6.5 轮次 5：集中裁决层化

| # | Task | 文件 | 说明 | 验收 |
|---|------|------|------|------|
| 5.1 | devices-rules.toml | `caijuehub/devices-rules.toml`（新建） | 迁移现有 4 设备的 DeviceDefinition 到 TOML | `npm run generate:devices` 产出 devices.ts，tsc 通过 |
| 5.2 | scaffold-rules.toml | `caijuehub/scaffold-rules.toml`（新建） | 定义 default / htc-g13 / htc-huafeng 三个模板 | `scaffold-device.ts --template htc-g13` 输出正确 |
| 5.3 | 转录脚本 | `scripts/transcribe-devices.ts`（新建） | 读取 TOML → 生成 devices.ts + 注入模板常量到 scaffold | 生成文件与当前手写版 diff 为空 |
| 5.4 | package.json 脚本 | `package.json` | 新增 `generate:devices` 和 `device:new` 脚本 | `npm run generate:devices` 可执行 |

### 6.6 P1 验收标准

- [ ] `npm run generate:devices` 产出的 `src/config/devices.ts` 与当前手写版 tsc 行为一致
- [ ] `scaffold-device.ts --template default --name MockDevice` 输出与当前 `--name MockDevice` 一致
- [ ] `scaffold-device.ts --template htc-g13 --name MockG13` 输出 G13 模式 model（jsonData，无 CachePolicy）
- [ ] 新增设备：仅修改 `caijuehub/devices-rules.toml`（10 行）+ 运行 `generate:devices`，不碰任何 .ts 文件
- [ ] 新增模板：仅修改 `caijuehub/scaffold-rules.toml`，不修改 `scaffold-device.ts`

---

## 七、关联文档

| 文档 | 路径 |
|------|------|
| ADD Route | `.qoder/plans/2026-07/22/device-registry-refactor-新设备平滑接入-add-route-v1.md` |
| Handoff | `.qoder/plans/2026-07/22/device-registry-refactor-新设备平滑接入-handoff-v1.md` |
| Review | `.qoder/reviews/device-registry-refactor-新设备平滑接入-review-v1.md` |
| Spec | `.qoder/specs/device-registry-refactor/spec.md` |
| Tasks | `.qoder/specs/device-registry-refactor/tasks.md` |
| Checklist | `.qoder/specs/device-registry-refactor/checklist.md` |
| DeviceRegistry 源码 | `src/services/device-registry.ts` |
| 设备配置源码 | `src/config/devices.ts` |
| CronService 源码 | `src/services/cron-service.ts`（647行→232行） |
| 建表脚手架 | `scripts/scaffold-device.ts` |
| P1 devices-rules | `caijuehub/devices-rules.toml`（新建） |
| P1 scaffold-rules | `caijuehub/scaffold-rules.toml`（新建） |
| P1 转录脚本 | `scripts/transcribe-devices.ts`（新建） |
| Caijuehub 参考 | `/home/xmm/ai/add-coder/docs/caijuehub.md` |
| Prisma Schema | `prisma/schema.prisma` |

---

*Plan v1 | 2026-07-22 | planKeyword: device-registry-refactor*
