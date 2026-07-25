# weather_proxy 技术文档

> 架构设计、集中裁决层、端点清单、适配指南、历史证据链。

## 目录

- [核心能力](#核心能力)
- [现有端点（14 个）](#现有端点14-个)
- [新设备适配指南](#新设备适配指南)
- [历史存档](#历史存档)

---

## 核心能力

### 集中裁决层（Caijuehub）

三层架构，参考 add-coder 范式：

```
src/caijuehub/
├── caijue.toml              ← 索引：注册裁决入口
├── transcribe.ts            ← 引擎：TOML → 策略文件
├── devices-rules.toml       ← 规则：设备注册声明
├── scaffold-rules.toml      ← 规则：Prisma 模板声明
└── strategies/              ← 策略：GENERATED + USER CODE 双区块
    ├── devices.strategy.ts
    └── scaffold.strategy.ts
```

修改流程：编辑 `*-rules.toml` → `npm run generate` → 策略生效。

消费链路：

```
devices-rules.toml → transcribe.ts → devices.strategy.ts
                                           ↓ import { DEVICE_REGISTRY }
                                     src/config/devices.ts（USER CODE）
                                           ↓ deviceRegistry.register()
                                     server.ts / cron-service.ts
```

### DeviceRegistry 统一调度

消除 server.ts / cron-service.ts / cache-strategy.ts 对具体设备的硬编码依赖。4 设备 14 端点全部通过 `deviceRegistry.applyRoutes(app)` 一行自动挂载。

## 现有端点（14 个）

### ZTE V880+（WeatherTV / WeatherWidget）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/zte/getweatheru.asmx/getData` | 获取天气数据 |
| POST | `/zte/getweatheru.asmx/getStationList` | 城市列表 |
| GET | `/zte/getweatheru.asmx/getStationList` | 城市列表（GET） |
| GET | `/zte/getweatheru.asmx/getadv.asmx/getAdvs` | 广告位 |

### HTC AccuWeather（国际版）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/widget/htc2/city-find.asp` | 城市搜索 |
| GET | `/widget/htc2/weather-data.asp` | 天气数据 |
| GET | `/widget/htc/forecast-data_v3.asp` | 预报数据 |
| GET | `/widget/htc/lat-lon-search.asp` | 经纬度查询 |

### HTC 华风天气（国行）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/getweatheru.asmx/getData` | 获取天气数据 |
| POST | `/getweatheru.asmx/getData` | 获取天气数据 |

### HTC G13（JSON RESTful）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/htc-g13/weather` | 天气数据（JSON） |
| GET | `/api/v1/htc-g13/cities` | 城市搜索 |
| GET | `/api/v1/htc-g13/health` | 健康检查 |

### 通用

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 服务健康检查 |
| GET | `/api/weather` | WeatherWidget 原始适配 |

## 新设备适配指南

### 方案 A：APK 反编译 + URL 替换

适用于 APK 可获取、能反编译的设备。

```
获取设备原版 APK → apktool/jadx 反编译 → 替换 URL → 重新签名
```

APK 目录提供已修改的 WeatherTV_V880+_Mod.apk 和 WeatherWidget_Mod.apk（仅限本地调试）。

### 方案 B：Host 劫持转发

适用于 APK 不可获取或无法反编译的设备。

```
设备 DNS 指向本项目 → App 请求被劫持 → 代理转发 QWeather → 返回
```

`hosts_htc_g13` 文件为 HTC G13 host 劫持配置示例。

> ⚠️ 本项目仅限技术讨论，不涉及法律讨论和商业用途。

### 新增设备流程（集中裁决层）

编辑 `caijuehub/devices-rules.toml` 加 10 行 TOML → `npm run generate` → 重启。

## 历史存档

`.trae/` 保留了 ADD 范式与人机协作工作流的早期探索证据，main 分支上保持原名以确保证据链连续。

> **证据链与演进关系**
>
> 仓库初始化：`2026-02-06`（commit `6f9c11d`「Initial commit」）。`.trae/` 首次引入：`2026-02-06`（commit `83954df`「feat: init」）。
>
> **各文件首次提交时间**：
>
> ```
> 2026-02-24  .trae/rules/project_rules.md
> 2026-02-24  .trae/specs/event-driven-weather-arch/{spec,tasks,checklist}.md
> 2026-02-25  .trae/specs/vps-db-backup-restore/{spec,tasks,checklist}.md
> 2026-03-11  .trae/specs/zte-citylist-api/{spec,tasks,checklist}.md
> ```
>
> **57 个文件清单**（`.trae/` 完整目录）：
>
> - **specs/**（9 文件）— 3 组 ADD 三元组：`event-driven-weather-arch` / `vps-db-backup-restore` / `zte-citylist-api`
> - **rules/**（1 文件）— `project_rules.md`（4 行 TS 编码规范）
> - **documents/**（47 文件）— ZTE_V880(17) / HTC_G13(21) / prisma(3) / ci&cd(2) / adb(2) / API文档(3)
>
> **与 Trae IDE 的时间线对照**：
>
> | 日期 | Trae | weather_proxy `.trae/` |
> |------|------|------------------------|
> | 2025.03 | v0.1.2 国内版首发 | — |
> | 2025.05 | v0.6.0 规则系统上线（`project_rules.md`） | — |
> | **2026.02.06** | — | **仓库 init，`.trae/` 首次引入** |
> | **2026.02.24** | — | **3 组 ADD 三元组 + rules 提交** |
>
> **关键事实**：spec/tasks/checklist 三元组模式源自开源项目 [OpenSpec](https://github.com/Fission-AI/OpenSpec)（Fission-AI，2025.10 首发，60.8k⭐）。GitHub Spec Kit 于 `2026.02.04` 通过 PR #1560 正式支持 Trae IDE。Trae 中国版 Spec 模式于 `2026-02-24` 正式上线（火山引擎开发者文档）。weather_proxy 在同一天将 3 组 ADD 三元组提交至 `.trae/specs/`，是 SDD 模式的首批实践者。
>
> **更深层的 ADD 范式渊源**：ADD 思想准备始于 **2014 年**，首次哲学理论提交于 `2026-01-09`。weather_proxy 是 ADD 范式从理论到工程实践的第一个落地项目。详见 [codein2027/README.md §关于首创](https://github.com/xiaomingming92/codein2027#关于首创)。

**演进路径**：

```
.trae/specs/ + rules/ + documents/     ← 2026.02 雏形
        │
        ▼
.qoder/plans/ + reviews/ + specs/      ← 2026.07 标准化
        │
        ▼
caijuehub/*.toml → generate            ← 声明式配置
```

**7 维对比**（`.trae/` 2026.02 → `.qoder/` 2026.07）：

| 维度 | 早期 `.trae/` | 当前 `.qoder/` |
|------|---------------|---------------|
| 术语 | `Phase` 阶段 | `轮次` 原子闭包 |
| 证据 | 无分类 | `[T]`编译期 / `[R]`运行时 / `[E]`静态检查 |
| Spec | 简单描述 | WHY/WHAT/ADDED Requirements + WHEN-THEN |
| Tasks | 平铺 checklist | 4 轮依赖 DAG + 验证证据要求 |
| Rules | 4 行 TS 规范 | 完整 project_rules + schema + forbidden_terms |
| 配置 | 硬编码 TS | 集中裁决层 TOML → `generate` |
| 门禁 | 无 | DPS 三级文档评分 |

ADD 范式本身不以 AI 人机编程为必要条件。
