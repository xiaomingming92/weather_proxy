# 天气代理服务 (Weather Proxy)

## 项目介绍

天气代理服务是一个基于 TypeScript 和 Express.js 开发的中间件服务，主要用于：

- 集成 Qweather的API，获取全球天气数据
- 为不同应用类型（如 V880的 WeatherWidget、WeatherTV_V880）提供标准化的 XML 格式天气数据
- 实现多层缓存机制，提高响应速度并减少 API 调用
- 提供 RESTful API 接口，方便其他应用集成

## 功能特性

- **多应用支持**：同时支持 WeatherWidget 和 WeatherTV 等多种应用类型
- **数据格式转换**：将 Qweather API 返回的 JSON 格式数据转换为应用所需的 XML 格式
- **多层缓存**：实现内存缓存和 Prisma 数据库缓存双层缓存机制
- **定时任务**：支持定时更新天气数据
- **健康检查**：提供健康检查端点，方便监控服务状态
- **错误处理**：完善的错误处理和日志记录机制

## 技术栈

- **TypeScript**：类型安全的 JavaScript 超集
- **Express.js**：轻量级 Web 框架
- **Prisma ORM**：现代数据库 ORM 工具
- **MariaDB**：关系型数据库
- **Axios**：HTTP 客户端
- **node-cron**：定时任务库
- **node-cache**：内存缓存库
- **xmlbuilder2**：XML 构建工具
- **ESLint + Prettier**：代码质量和格式化工具

## 项目结构

```
weather_proxy/
├── src/
│   ├── config/         # 配置文件
│   ├── routes/         # 路由
│   │   ├── weather.ts  # 天气数据接口
│   │   └── config.ts   # 配置接口
│   ├── services/       # 服务层
│   │   ├── data-transform.ts    # 数据格式转换
│   │   ├── weather-api.ts       # 天气 API 调用
│   │   ├── cache.ts             # 内存缓存
│   │   ├── prisma-cache.ts      # 数据库缓存
│   │   ├── cron-service.ts      # 定时任务
│   │   └── time-utils.ts        # 时间工具
│   ├── types/          # 类型定义
│   ├── server.ts       # 服务器入口
│   └── utils/          # 工具函数
├── .trae/documents/    # 项目文档
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript 配置
├── tsconfig.prod.json  # 生产环境 TypeScript 配置
└── README.md           # 项目说明
```

## 快速开始

### 环境要求

- Node.js ^24.11.0(volta) & prod下的pm2
- Prisma&@prisma/adapter-mariadb
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 配置说明

1. 复制 `.env.example` 文件为 开发环境`.env`;复制 `.env.example` 文件为生产环境`.env.prod`
2. 配置环境变量：
   - `DATABASE_URL`：数据库连接字符串
   - `QWEATHER_API_KEY`：和风天气 API 密钥
   - `APIHost`: 和风天气API主机地址，在和风天气控制台-项目管理-项目设置中查看
   - `PORT`：服务端口
   - `HOST`：服务主机

### 启动服务

**开发环境：**

```bash
npm run dev
```

**生产环境：**

```bash
npm run build
npm run pm2:start
```

## API 接口

### 天气数据接口

**请求 URL：** `/api/weather`

**请求方法：** GET

**请求参数：**

| 参数名 | 类型 | 必需 | 描述 |
|-------|------|------|------|
| dataType | string | 是 | 数据类型，如 CURRENT_WEATHER、FORECAST_WEATHER 等 |
| sname | string | 否 | 城市名称 |
| cityId | string | 否 | 城市 ID |
| location | string | 否 | 经纬度坐标，格式为 "经度,纬度" |
| code | string | 否 | 应用类型代码，50532E 为 WeatherWidget，1D765B 为 WeatherTV |

**响应格式：** XML

**示例请求：**

```bash
curl "http://localhost:1888/api/weather?dataType=CURRENT_WEATHER&sname=北京&code=50532E"
```

### 健康检查接口

**请求 URL：** `/health`

**请求方法：** GET

**响应格式：** JSON

## 配置说明

### 环境变量配置

| 环境变量 | 描述 | 默认值 |
|---------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务端口 | 1888 |
| HOST | 服务主机 | localhost |
| DATABASE_URL | 数据库连接字符串 | - |
| QWEATHER_API_KEY | 和风天气 API 密钥 | - |

### 数据库配置

使用 Prisma ORM 连接 MariaDB 数据库，配置文件为 `prisma/schema.prisma`。

### 缓存配置

- **内存缓存**：默认缓存时间为 30 分钟
- **数据库缓存**：根据数据类型设置不同的缓存时间

## 文档树总览

### 项目文档

| 文档名称 | 描述 | 链接 |
|---------|------|------|
| Prismas使用文档.md | Prisma ORM 的使用说明文档 | [查看](./.trae/documents/Prismas使用文档.md) |
| Prisma持久化缓存实现计划.md | 基于 Prisma 的持久化缓存实现方案 | [查看](./.trae/documents/Prisma持久化缓存实现计划.md) |
| TypeScript项目优化与自动化部署配置.md | TypeScript 项目的优化和自动化部署配置指南 | [查看](./.trae/documents/TypeScript项目优化与自动化部署配置.md) |
| WeatherWidgetAPI适配说明.md | WeatherWidget 应用的 API 适配说明 | [查看](./.trae/documents/WeatherWidgetAPI适配说明.md) |
| WeatherWidget数据流转分析.md | WeatherWidget 应用的数据流转过程分析 | [查看](./.trae/documents/WeatherWidget数据流转分析.md) |
| WeatherWidget数据结构适配计划.md | WeatherWidget 应用的数据结构适配方案 | [查看](./.trae/documents/WeatherWidget数据结构适配计划.md) |
| plan_20260211_005937.md | 项目计划文档 | [查看](./.trae/documents/plan_20260211_005937.md) |
| 优化天气数据转换逻辑与和风天气API集成.md | 天气数据转换逻辑优化和和风天气 API 集成方案 | [查看](./.trae/documents/优化天气数据转换逻辑与和风天气API集成.md) |
| 修复WeatherTV_V880+ _数据未成功下载！_错误.md | 修复 WeatherTV_V880+ 应用数据下载错误的方案 | [查看](./.trae/documents/修复WeatherTV_V880+ _数据未成功下载！_错误.md) |
| 分析并优化天气数据响应.md | 天气数据响应的分析和优化方案 | [查看](./.trae/documents/分析并优化天气数据响应.md) |
| 恢复WeatherWidget数据功能方案.md | 恢复 WeatherWidget 应用数据功能的方案 | [查看](./.trae/documents/恢复WeatherWidget数据功能方案.md) |
| 添加缺失的天气API接口.md | 添加缺失的天气 API 接口的方案 | [查看](./.trae/documents/添加缺失的天气API接口.md) |
| 解决PrismaClient初始化问题并正确连接MySQL数据库.md | 解决 PrismaClient 初始化问题和数据库连接方案 | [查看](./.trae/documents/解决PrismaClient初始化问题并正确连接MySQL数据库.md) |
| 天气API供应商.md | 天气 API 供应商关系说明文档 | [查看](./.trae/documents/天气API供应商.md) |

## 部署说明

### 开发环境部署

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run dev`
3. 服务将运行在 `http://localhost:1888`

### 生产环境部署

1. 安装依赖：`npm install`
2. 构建项目：`npm run build`
3. 启动服务：`npm run pm2:start`
4. 服务将以 PM2 守护进程方式运行

### PM2 配置

- **启动服务**：`npm run pm2:start`
- **停止服务**：`npm run pm2:stop`
- **重启服务**：`npm run pm2:restart`

## 许可证

MIT License

## 联系方式

- 项目维护者：[xiaomingming92](https://github.com/xiaomingming92)
- 邮箱：wujixmm@gmail.com

---

*本项目基于 TypeScript 和 Express.js 开发，旨在为不同应用提供标准化的天气数据服务。*