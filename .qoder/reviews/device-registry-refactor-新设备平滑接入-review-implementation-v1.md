# Implementation Review: device-registry-refactor-新设备平滑接入

## Review 元信息

- **Review 对象**: Plan 四轮实施的代码变更
- **关联方案 review**: `.qoder/reviews/device-registry-refactor-新设备平滑接入-review-v1.md`
- **Review 时间**: 2026-07-25
- **Review 类型**: 实现 review（ADD 0.1.2）
- **前置阅读**: Plan v1、现有 `src/server.ts`、`src/services/cron-service.ts`、`src/services/cache/cache-strategy.ts`、`prisma/schema.prisma`

---

## HITL 发现总览（一次性提交人类审核）

| # | 严重度 | 检查维度 | 发现摘要 | 建议措施 | 人类决策 |
|---|:---:|------|---------|---------|:---:|
| 1 | 🟡 中 | 契约 | DeviceDefinition 接口需与现有路由签名对齐，各设备 router 导出格式不统一 | Spec 阶段逐设备验证 router 导出签名 | 接受/拒绝/修改 |
| 2 | 🟡 中 | 数据模型 | Prisma schema 中 DeviceType 无枚举约束，cache-strategy.ts 中 DeviceType 为字面量联合类型 | 建议保持字面量联合类型为真相源，不引入 Prisma enum | 接受/拒绝/修改 |
| 3 | 🟢 低 | 环境 | DATABASE_URL 和 MariaDB 3306 端口需在 dev 环境可用 | 使用 `db-ensure.sh` 幂等启动 | 接受/拒绝/修改 |

> **人类确认后**：AI 在下方逐章节展开详细检查。

---

## 1. 跨模块接口契约

Plan 新增 `DeviceRegistry` 需与现有模块签名对齐：

| 接口 | 消费方 | 期望类型 | 提供方 | 实际类型 | 匹配? |
|-----|--------|---------|--------|---------|:---:|
| `DeviceDefinition.router` | `registry.applyRoutes(app)` | `express.Router` | `src/routes/zte-weather.ts` | `export default router` | ⚠️ 待核实 |
| `DeviceDefinition.router` | 同上 | `express.Router` | `src/routes/htc-accu-weather.ts` | `export default router` | ⚠️ 待核实 |
| `DeviceDefinition.router` | 同上 | `express.Router` | `src/routes/htc-huafeng-weather.ts` | `export default router` | ⚠️ 待核实 |
| `DeviceDefinition.router` | 同上 | `express.Router` | `src/routes/htc-g13-weather.ts` | `export default router` | ⚠️ 待核实 |
| `DataTransformer` | `registry` + route handler | `(data: unknown) => unknown` | 各设备 `data-transform.ts` | 需在 Spec 定义精确签名 | ⚠️ 待 Spec |

- [ ] 核实现有 4 个路由文件的 `export default` 签名一致性
- [ ] 定义 `DataTransformer` 接口的输入/输出类型（不是 `unknown`）

---

## 2. 数据模型约束

### 2.1 DeviceType 联合类型

当前 `cache-strategy.ts` 中 `DeviceType = 'zte' | 'htc'`。Plan Task 1.3 扩展为 `'zte' | 'htc-accu' | 'htc-huafeng' | 'htc-g13'`。

**设计建议**：
- 保持字面量联合类型为唯一真相源，不引入 Prisma enum
- Prisma schema 中各设备表名（如 `ZteWeatherCache`）与 DeviceType 值的映射关系需文档化

### 2.2 Prisma Schema

- ✅ Plan 正确保留了 15 张设备专用表（P1 合并已否决）
- ⚠️ 脚手架脚本 `scaffold-device.ts` 生成的 DDL 需与现有表结构保持一致（cityId vs cityCode、xmlData vs jsonData）

### 2.3 CacheContext 映射

```typescript
// 当前（cache-strategy.ts:L71）
'zte' → zteCache
'htc' → htcAccuCache

// 目标
'zte'      → zteCache
'htc-accu'  → htcAccuCache
'htc-huafeng' → htcHuaFengCache
'htc-g13'  → htcG13Cache
```

- [ ] 验证 HuaFeng 和 G13 的 Cache 类实现了与 ZTE/HTC-Accu 相同的接口

---

## 3. 环境变量加载链

| 组件 | 依赖 | 验证方式 |
|------|------|---------|
| MCP Server | `DATABASE_URL`（MariaDB） | `echo $DATABASE_URL` 在 MCP 进程中可用 |
| Express Server | `NODE_ENV=development` | `npm run dev` → 端口 1888 |
| Cron Tasks | 同 Express Server 环境 | Cron 日志写入相同 log 目录 |

- [ ] `DATABASE_URL` 在 MCP 子进程中可访问（已通过 PROJECT_ROOT 配置保证）

---

## 4. 类型安全

| 检查项 | 范围 | 标准 |
|--------|------|------|
| `tsc --noEmit` | 全项目 | 零错误 |
| `DeviceRegistry` 泛型 | `register<T extends DeviceDefinition>()` | 类型推导正确，不丢失设备特化信息 |
| `DataTransformer` 接口 | 4 个现有 transform + 未来新增 | 输入输出类型安全，不用 `any` |

---

## 5. 兼容性

- ✅ 现有 4 设备所有端点路径不变（如 `GET /zte/getweatheru.asmx/getData`）
- ✅ Cron 调度行为等价，仅实现方式从硬编码改为遍历注册表
- ✅ 响应 Content-Type 不变（各设备 XML/JSON 格式不变）
- ⚠️ `server.ts` 启动日志格式可能微调（从逐个 `app.use` 改为遍历注册），需确认不影响监控

---

## 6. 关联 Checklist

- [ ] 4 设备路由文件 `export default` 签名一致
- [ ] HuaFeng/G13 Cache 类实现与 ZTE/HTC-Accu 相同接口
- [ ] `tsc --noEmit` 零类型错误
- [ ] Cron 日志中 HuaFeng/G13 预报更新为实际 API 调用（非 TODO 占位）
- [ ] 脚手架脚本生成的 Prisma model 语法通过 `prisma validate`

---

*Implementation Review v1 | 2026-07-25 | 关联 Plan: device-registry-refactor-新设备平滑接入-plan-v1*
