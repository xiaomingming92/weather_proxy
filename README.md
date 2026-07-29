# 天气代理服务 (Weather Proxy)

> 🌐 🀄中文 | 🔤 [English](README.en.md)

> 有些老伙计，硬件还硬朗，只是被时间忘了。

## 它们是谁

**中兴 V880（Blade / 刀锋）**。2010 年，充话费送的「千元神机」。高通 MSM7227 单核 600MHz，256MB RAM，3.5 寸电容屏——放在今天连个网页都打不开，但当年它是多少人的第一台智能机。国外 Orange 版给了 512MB 运存，国内却只有 256MB——就为这，论坛里诞生了海量的刷机包。CM7、MIUI、乐蛙，搞机党们晚上不睡觉地刷，「V880 刷不死，就怕你手残」是那代人的接头暗号。日销量一度仅次于 iPhone 4，60 多个国家卖爆——但 15 年过去了，它的天气服务早就停了。

**HTC G13（Wildfire S / 野火 S）**。2011 年，HTC 还是「安卓之王」。鹅卵石机身，3.2 寸屏，Sense 2.1 那个会翻页的时钟和雨刷动画，是智能手机 UX 设计的巅峰——不是冷冰冰的功能，是「人情味」。HTC 天气应用在 2025 年 12 月 18 日正式关停，伺服器一关，屏幕上的雨滴动画永远定格。

这些设备硬件完好，只是软件服务被时代抛弃了。**它们不配被扔进抽屉。**

## 这个项目做什么

- 🌤️ **救回天气** — 通过代理服务，让 V880 和 G13 重新收到实时天气数据
- 🕐 **同步时间** — 配合 [timeSync](https://github.com/xiaomingming92/timeSync) 授时服务，老设备时间不准的问题也能一并解决
- 🔧 **集中裁决层（Caijuehub）** — 设备配置从硬编码 TypeScript 升级为 TOML 声明式规则，新增机型只需 10 行配置

本项目仅限技术讨论，不涉及法律讨论和商业用途。

---

## 📹 真机演示

> 🚧 真机视频即将上传，敬请期待。

<!--
  GitHub 网页编辑此处：把 mp4 直接拖拽进编辑框，
  生成的 user-attachments 链接单独占一行粘贴在下方，即可渲染为内嵌播放器。
-->
<!-- DEMO_VIDEO_PLACEHOLDER -->

---

## 技术细节

> 架构设计、集中裁决层、14 端点清单、适配指南、ADD范式中人机协作部分演进证据链 → [docs/weather-proxy/knowledge/02-规范/DEVELOPMENT.md](docs/weather-proxy/knowledge/02-规范/DEVELOPMENT.md)

---

## 技术栈

- **TypeScript** + **Express.js** — 服务主体
- **Prisma ORM** — MariaDB（天气数据）+ PostgreSQL（devlog 审计）
- **QWeather API** — 上游数据源
- **node-cron** — 定时刷新
- **Smol TOML** — 集中裁决层规则解析
- **Vitest** — 单元测试（45 用例全覆盖）
- **Podman** — 容器化数据库

## 快速开始

```bash
# 环境要求：Node.js ^24.11 + MariaDB + PostgreSQL (podman)

# 安装
npm install

# 启动数据库
npm run podman-add-coder-up

# 建表（自动备份 → prisma db push）
bash scripts/db-ensure.sh postgresql podman --migrate

# 启动
npm run dev
```

**配置 `.env.development`**：

```env
WEATHER_DATABASE_URL="mysql://<user>:<password>@localhost:3306/weather-proxy"
DATABASE_URL="postgresql://<user>:<password>@localhost:5433/weather-proxy"
QWEATHER_API_KEY=你的和风天气API密钥
APIHost=https://api.qweather.com
```

## 项目结构

```
weather_proxy/
├── src/
│   ├── caijuehub/            ← 集中裁决层（三层架构）
│   │   ├── caijue.toml        ←   索引：注册裁决入口
│   │   ├── transcribe.ts      ←   引擎：TOML → 策略文件
│   │   ├── devices-rules.toml ←   规则：设备注册声明
│   │   ├── scaffold-rules.toml←   规则：Prisma 模板声明
│   │   └── strategies/        ←   策略：GENERATED 数据
│   ├── config/                ← 配置（devices.ts 消费策略数据）
│   ├── routes/                ← 4 设备路由（14 端点）
│   ├── services/              ← 业务层
│   │   ├── device-registry.ts ←   DeviceRegistry 单例
│   │   ├── cache/             ←   缓存策略模式
│   │   └── cron-service.ts    ←   统一调度器（232 行）
│   └── server.ts              ← Express 入口
├── scripts/
│   ├── scaffold-device.ts     ← Prisma 模型脚手架
│   └── db-ensure.sh           ← 数据库初始化 + 备份
├── prisma/
│   ├── schema.prisma          ← 天气数据（MariaDB）
│   └── add/schema.prisma      ← 审计数据（PostgreSQL）
├── APK/                       ← 已修改 APK（仅调试用）
├── .qoder/                    ← ADD 工作流产物
│   ├── plans/                 ←   计划文档
│   ├── reviews/               ←   评审文档
│   └── specs/                 ←   规格文档
└── tests/                     ← Vitest 测试
```

## 联系方式

- 项目维护者：[xiaomingming92](https://github.com/xiaomingming92)
- 邮箱：wujixmm@gmail.com