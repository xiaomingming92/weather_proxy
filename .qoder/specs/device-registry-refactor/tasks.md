# Tasks

> **验证规范**：每个 Task 完成时必须附带双检证据（`tsc --noEmit` = 0 错误 + `npm run lint` = 0 新增）。可选补充 `curl` 验证。

## Preconditions

- [x] Plan 已生成
- [x] Spec 已就绪
- [x] Review 三元组已就绪
- [x] DPS 通过 (108)

---

## 第1轮：基础设施

- [x] Task 1.1: DeviceDefinition + DataTransformer 接口 — 验证: `tsc --noEmit` = 0 ✅
  - [ ] 定义 DeviceType 字面量联合类型
  - [ ] 定义 DataTransformer 接口（transform 方法签名）
  - [ ] 定义 DeviceDefinition 接口（name/basePath/router/dataTransform/cronConfig/cacheStrategy/activeCityService）
- [x] Task 1.2: DeviceRegistry 实现 — 验证: `tsc --noEmit` = 0 ✅
  - [ ] 实现 register(device) 方法
  - [ ] 实现 getAll() 方法
  - [ ] 实现 applyRoutes(app) 方法
  - [ ] 实现 applyCronTasks(cronService) 方法
  - [ ] 单例导出
- [x] Task 1.3: DeviceType + CacheContext 扩展 — 验证: `new CacheContext('htc-g13')` 不抛异常 ✅
  - [ ] DeviceType 改为 `'zte' | 'htc-accu' | 'htc-huafeng' | 'htc-g13'`
  - [ ] CacheContext 构造函数补全 4 个映射（Task 4.1 先占位，本轮仅扩展类型）

## 第2轮：路由迁移

- [x] Task 2.1: 4 设备配置定义 — 验证: `tsc --noEmit` = 0 ✅
  - [ ] ZTE DeviceDefinition
  - [ ] HTC-Accu DeviceDefinition
  - [ ] HTC-HuaFeng DeviceDefinition
  - [ ] HTC-G13 DeviceDefinition
- [x] Task 2.2: server.ts 自动注册 — 验证: 启动日志不变 ✅
  - [ ] 删除手动 import + app.use() 行
  - [ ] 改为 registry.applyRoutes(app)
- [ ] Task 2.3: curl 端点验证 — 验证: 所有端点 200
  - [ ] curl /zte/... 
  - [ ] curl /htc-accu/...
  - [ ] curl /htc-huafeng/...
  - [ ] curl /htc-g13/...

## 第3轮：Cron 重构 + Bug 修复

- [x] Task 3.1: CronService 精简 — 验证: 文件 ≤ 250 行 ✅
  - [x] 移除 14 个私有字段
  - [x] 移除 14 个 start 方法
  - [x] 移除 4 个 update 方法
  - [x] 新增 applyDeviceTasks(registry) 统一调度器
- [x] Task 3.2: 修复 stop() 遗漏 — 验证: stop() 后 started=false ✅
  - [x] stop() 遍历注册表停止所有任务
  - [x] 补全 HuaFeng/G13 的 forecast/cleanup/sync 共 8 个任务
- [x] Task 3.3: 修复错误调用 + 补全 TODO — 验证: Cron 日志含实际 API 调用 ✅
  - [x] updateHtcHuaFengForecasts 调用 htcHuaFengActiveCityService
  - [x] updateHtcG13Forecasts 调用 htcG13ActiveCityService
  - [x] 补全 HuaFeng/G13 预报更新为 weatherApi + cache 写入
- [ ] Task 3.4: Cron 日志验证 — 验证: 日志 diff 为空
  - [ ] npm run dev 启动
  - [ ] 检查 Cron 任务描述与改造前一致

## 第4轮：Cache 统一 + 脚手架

- [x] Task 4.1: CacheContext 补全映射 — 验证: 所有 DeviceType 可创建 CacheContext ✅
  - [ ] `'htc-huafeng'` → htcHuaFengCache
  - [ ] `'htc-g13'` → htcG13Cache
- [x] Task 4.2: 建表脚手架脚本 — 验证: `tsx scripts/scaffold-device.ts --name Samsung` 输出 4 段 model ✅
  - [ ] 接收 --name 参数
  - [ ] 输出 WeatherCache / ActiveCity / City / CachePolicy model 定义
  - [ ] 默认模板 ZTE 模式（cityId + dataType + xmlData）

## Task Dependencies

```
1.1 → 1.2 → 2.1 → 2.2 → 2.3
1.3 → 4.1
1.2 → 3.1 → 3.2 → 3.3 → 3.4
(独立) 4.2

## 第5轮：集中裁决层 TOML 化 [P1]

- [ ] Task 5.1: devices-rules.toml — 验证: `npm run generate:devices` 产出 devices.ts，tsc 通过
  - [ ] 迁移 4 设备 DeviceDefinition 到 TOML
  - [ ] 定义 passThrough 等特殊标记
- [ ] Task 5.2: scaffold-rules.toml — 验证: `--template htc-g13` 输出正确
  - [ ] 定义 default / htc-g13 / htc-huafeng 三个模板
  - [ ] 模板继承机制（inherits = "default"）
- [ ] Task 5.3: 转录脚本 — 验证: 生成文件与当前手写版 diff 为空
  - [ ] TOML 解析 → TypeScript 代码生成
  - [ ] 模板常量注入到 scaffold-device.ts
- [ ] Task 5.4: package.json 脚本 — 验证: `npm run generate:devices` 可执行
  - [ ] 新增 `generate:devices` 脚本
  - [ ] 新增 `device:new` 快捷脚本

### 依赖拓扑

```
1.1 → 1.2 → 2.1 → 2.2 → 2.3
1.3 → 4.1
1.2 → 3.1 → 3.2 → 3.3 → 3.4
(独立) 4.2

P1: 5.1 + 5.2 → 5.3 → 5.4
```

## Verification

- [x] `npx tsc --noEmit` 通过（P0 轮次）
- [ ] `npm run lint` 零新增 warning
- [ ] 现有 4 设备所有 12+ 端点 curl 200
- [x] cron-service.ts ≤ 250 行（232 行）
- [x] stop() 覆盖所有任务
- [ ] `npm run generate:devices` 产出与手写版 behavior 一致
# device-registry-refactor Tasks

## Task 1: 基础设施

### 1.1 DataTransformer 接口 + DeviceDefinition 类型 [T]
- 文件: src/services/device-registry.ts（新建）
- 验收: tsc --noEmit
- WHEN: 文件创建后
- THEN: DataTransformer 和 DeviceDefinition 可被 import

### 1.2 DeviceRegistry 实现 [T]
- 文件: 同上
- 验收: tsc --noEmit，单例导出
- WHEN: register() 调用后
- THEN: getAll() 返回已注册设备列表

### 1.3 DeviceType + CacheContext 扩展 [T]
- 文件: src/services/cache/cache-strategy.ts
- 验收: new CacheContext('htc-g13') 不抛异常
- WHEN: DeviceType 类型更新
- THEN: 4 个设备类型均可创建 CacheContext

## Task 2: 路由迁移

### 2.1 4 设备配置定义 [T]
- 文件: src/config/devices.ts（新建）
- 验收: 4 个 DeviceDefinition 对象编译通过

### 2.2 server.ts 自动注册 [T]
- 文件: src/server.ts
- 验收: 删除手动 import，改为 registry.applyRoutes(app)
- WHEN: 服务启动
- THEN: 所有设备端点可达

### 2.3 端到端验证 [R]
- 文件: 无
- 验收: curl 所有端点，响应 body 与改造前一致

## Task 3: Cron 重构 + Bug 修复

### 3.1 CronService 精简 [T]
- 文件: src/services/cron-service.ts
- 验收: 647 行 → ~200 行，tsc --noEmit

### 3.2 修复 stop() 遗漏 [T]
- 文件: 同上
- 验收: stop() 后所有 cron 任务已注销

### 3.3 修复 HuaFeng service 调用 [T]
- 文件: 同上
- 验收: updateHtcHuaFengForecasts 调用 htcHuaFengActiveCityService

### 3.4 修复 G13 + 补全实现 [T]
- 文件: 同上
- 验收: updateHtcG13Forecasts 调用 htcG13ActiveCityService，实际写入缓存

### 3.5 Cron 日志验证 [R]
- 文件: 无
- 验收: npm run dev 日志与改造前一致

## Task 4: Cache 统一

### 4.1 CacheContext 扩展 [T]
- 文件: cache-strategy.ts
- 验收: htc-huafeng/htc-g13 映射可用

## Task 5: 建表脚手架

### 5.1 脚手架生成器 [T]
- 文件: scripts/scaffold-device.ts（新建）
- 验收: --name Samsung 输出 4 段 model 块
