# Runtime Review: device-registry-refactor-新设备平滑接入

> 运行时验证纠偏文档。在 checklist 通过、代码部署后，通过用户反馈或运行时日志发现的遗漏问题。
> 当前为预实施阶段，本 Review 定义运行时验证框架和预期行为。

## Review 元信息

- **关联方案 review**: `.qoder/reviews/device-registry-refactor-新设备平滑接入-review-v1.md`
- **关联实现 review**: `.qoder/reviews/device-registry-refactor-新设备平滑接入-review-implementation-v1.md`
- **关联 checklist**: （Spec 阶段产出）
- **Review 时间**: 2026-07-25
- **触发方式**: 预实施——定义验证框架

---

## 1. 运行时验证清单（预定义）

实施完成后逐项验证：

### 1.1 启动验证

| # | 验证项 | 预期 | 命令/方法 |
|---|--------|------|----------|
| 1 | `npm run dev` 启动成功 | 无 crash，端口 1888 监听 | `curl http://localhost:1888/` |
| 2 | 启动日志无异常 | 无 `Error` 或 `UnhandledPromiseRejection` | 查看终端输出 |
| 3 | DeviceRegistry 初始化日志 | 4 设备注册成功 + Cron 任务注册数 | 日志含 `DeviceRegistry: registered N devices` |

### 1.2 端点兼容性验证

| # | 端点 | 方法 | 预期状态码 | 验证命令 |
|---|------|------|:---:|---------|
| 1 | `/zte/getweatheru.asmx/getData?cityId=xxx` | GET | 200 | `curl -s -o /dev/null -w '%{http_code}'` |
| 2 | `/htc-accu/...` | GET | 200 | 同上 |
| 3 | `/htc-huafeng/...` | GET | 200 | 同上 |
| 4 | `/htc-g13/...` | GET | 200 | 同上 |

### 1.3 Cron 验证

| # | 验证项 | 预期 | 方法 |
|---|--------|------|------|
| 1 | Cron 任务按周期执行 | 日志中有定时刷新记录 | 等待一个 cron 周期（5-15min） |
| 2 | HuaFeng/G13 预报更新写入缓存 | 缓存中有新数据 | 查询对应 WeatherCache 表 |
| 3 | `stop()` 后所有任务停止 | `started=false`，无残留 cron | 调用 `stop()` 后等一个周期 |

### 1.4 新设备接入流程验证（mock-device）

| # | 步骤 | 预期 | 验收 |
|---|------|------|------|
| 1 | `npx tsx scripts/scaffold-device.ts --name mock` | 输出 4 段 Prisma model | stdout 含 model MockWeatherCache 等 |
| 2 | 追加到 `prisma/schema.prisma` + `prisma db push` | 表创建成功 | `prisma validate` 通过 |
| 3 | 在 `src/config/devices.ts` 添加 DeviceDefinition | tsc 编译通过 | `tsc --noEmit` |
| 4 | 启动服务 + curl 端点 | HTTP 200 | `curl` 返回正确格式 |

---

## 2. 已知风险点（实施时重点关注）

| # | 风险 | 影响 | 缓解措施 |
|---|------|------|---------|
| 1 | 各设备 router 导出格式不一致 | `applyRoutes` 失败 | Spec 阶段逐设备验证，必要时统一导出 |
| 2 | HuaFeng/G13 的 DataTransform 函数签名与接口不匹配 | 类型错误或运行时异常 | Task 2.1 定义 DeviceDefinition 时验证 |
| 3 | `cron-service.ts` 重构后 Cron 调度时序偏差 | 缓存更新时机变化 | 对比改造前后 Cron 日志时间戳 |
| 4 | `stop()` 遍历注册表漏掉动态注册的任务 | 进程退出后 Cron 残留 | `stop()` 后检查 `cronTasks.size === 0` |

---

## 3. 回滚预案

如运行时发现不可接受的兼容性问题：

1. **双轨运行**：保留 DeviceRegistry 代码，临时恢复 `server.ts` 和 `cron-service.ts` 原始手动注册
2. **Git revert**：4 轮每轮独立 commit，可逐轮回滚
3. **数据无影响**：不涉及数据库迁移，回滚无数据风险

---

## 4. 回流确认

- [ ] 实施中发现的接口契约问题回流至 `review-implementation-v1.md`
- [ ] 新增设备 checklist 实际走通后更新 Plan §四 的引导流程
- [ ] 运行时异常记录审计日志（`record_dev_operation`）

---

*Runtime Review v1 | 2026-07-25 | 关联 Plan: device-registry-refactor-新设备平滑接入-plan-v1*
