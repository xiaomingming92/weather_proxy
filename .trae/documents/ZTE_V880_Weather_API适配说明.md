# V880 Weather API 适配说明

## 目录

1. [项目概述](#项目概述)
2. [文档结构](#文档结构)
3. [架构设计](#架构设计)
4. [API端点](#api端点)
5. [数据映射](#数据映射)
6. [实现状态](#实现状态)
7. [测试计划](#测试计划)
8. [参考资料](#参考资料)

---

## 项目概述

### 目标

为中兴V880手机（Android 2.2）的天气应用提供代理服务，将原生的天气API请求转发到和风天气(QWeather)API，并转换响应格式。

### 背景

- **设备**: 中兴V880 (Blade)
- **系统**: Android 2.2 (Froyo)
- **原API**: 华风第一代API标准 (已下线)
  - 华风集团与美国AccuWeather合资的华风爱科提供
  - 中央气象台数据独家授权
- **新API**: 和风天气 (QWeather)
- **代理服务器**: 8.153.104.150 (VPS)

### 工作原理

```
V880天气App → 请求中兴天气API
    ↓
Hosts劫持 → 指向 8.153.104.150
    ↓
Weather Proxy服务 → 转发到和风天气API
    ↓
数据转换 → V880 XML格式
    ↓
V880天气App ← XML响应
```

---

## 文档结构

```
weather_proxy/.trae/documents/
├── ZTE_V880/
│   ├── 01_第一阶段-基础服务搭建.md              # Node.js服务搭建、API端点
│   ├── 02_第二阶段-WeatherTV精准适配.md         # XML结构、策略模式、任务清单
│   ├── 03_WeatherTV_XML解析组件分析.md          # Handler类、数据类结构
│   ├── 04_WeatherWidget数据流转分析.md          # 架构组件、触发机制
│   ├── 05_ORM与数据库设计.md                    # Prisma Schema、类型定义
│   ├── 06_附加功能-时间同步方案.md              # 时间同步实现
│   └── old/                                     # 归档的旧文档
├── ZTE_V880_Weather_API适配说明.md              # 本文件（入口文档）
└── 和风天气API接口文档.md                        # 和风API详细文档
```

### 文档阅读指南

| 文档 | 内容 | 阅读建议 |
|------|------|---------|
| [01_第一阶段-基础服务搭建](./ZTE_V880/01_第一阶段-基础服务搭建.md) | Node.js服务搭建、API端点、响应结构 | 先读，了解基础 |
| [02_第二阶段-WeatherTV精准适配](./ZTE_V880/02_第二阶段-WeatherTV精准适配.md) | XML结构要求、策略模式、任务清单 | 核心实现文档 |
| [03_WeatherTV_XML解析组件分析](./ZTE_V880/03_WeatherTV_XML解析组件分析.md) | Handler类、数据类结构、Network类 | 技术细节 |
| [04_WeatherWidget数据流转分析](./ZTE_V880/04_WeatherWidget数据流转分析.md) | 架构组件、触发机制、缓存机制 | 数据流分析 |
| [05_ORM与数据库设计](./ZTE_V880/05_ORM与数据库设计.md) | Prisma Schema、迁移脚本、缓存策略 | 数据库设计 |
| [06_附加功能-时间同步方案](./ZTE_V880/06_附加功能-时间同步方案.md) | 时间同步背景、实现步骤、数据流 | 附加功能 |

---

## 架构设计

### 服务架构

```
weather_proxy/
├── src/
│   ├── routes/
│   │   ├── weather.ts          # V880路由 (/api/*)
│   │   └── htc-weather.ts      # HTC路由 (/widget/*)
│   ├── services/
│   │   ├── v880/               # V880服务
│   │   │   ├── data-transform.ts   # 数据转换器
│   │   │   └── types.ts            # 类型定义
│   │   ├── weather-api.ts      # 和风API客户端
│   │   └── cache.ts            # 缓存服务
│   └── server.ts
└── scripts/
    └── extract_strings.py      # ROM分析脚本
```

### 数据流

```
用户操作 → V880路由 → 校验器 → 和风API → 转换器 → XML响应
```

---

## API端点

### 已实现端点

| 端点 | 路径 | 方法 | 状态 | 说明 |
|------|------|------|------|------|
| 天气数据 | `/api/weather` | GET/POST | ✅ | 获取天气数据 |

### 核心端点详解

#### 1. 天气数据端点

**请求**
```
GET /api/weather?sname=北京&dataType=ztewidgetsk&code=50532E
```

**参数**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| sname | string | 否 | 城市名称，如"北京" |
| cityId | string | 否 | 城市ID，如"101010100" |
| location | string | 否 | 经纬度，格式：`经度,纬度` |
| dataType | string | 是 | 数据类型：ztewidgetsk/ztewidgetcf/ztev3widgetskall/ztev3widgetcfall |
| code | string | 否 | 预留参数 |

**dataType说明**
| 值 | 说明 |
|-----|------|
| `ztewidgetsk` | Widget实况（简化版） |
| `ztewidgetcf` | Widget预报（简化版） |
| `ztev3widgetskall` | Widget实况（完整版） |
| `ztev3widgetcfall` | Widget预报（完整版） |
| `zte` | 主天气数据（完整） |
| `allcity` | 城市列表 |

**响应** (XML)
```xml
<?xml version="1.0" encoding="utf-8"?>
<CityMeteor>
  <CityName>北京</CityName>
  <SK>
    <Info>
      <Temp>24</Temp>
      <WD>东北风</WD>
      <WS>3级</WS>
      <SD>45%</SD>
      <WSE>3</WSE>
      <Time>14:30</Time>
    </Info>
  </SK>
  <CF>
    <Period>
      <Date>2025-02-23</Date>
      <High>28</High>
      <Low>18</Low>
      <DayType>多云</DayType>
      <NightType>晴</NightType>
    </Period>
  </CF>
</CityMeteor>
```

---

## 数据映射

### 天气代码映射

和风天气代码 → V880天气代码

| 和风代码 | 描述 | V880代码 | 描述 |
|---------|------|---------|------|
| 100 | 晴 | 0 | 晴 |
| 101 | 多云 | 1 | 多云 |
| 305 | 小雨 | 13 | 小雨 |
| 400 | 小雪 | 27 | 小雪 |
| ... | ... | ... | ... |

**完整映射表**: [03_WeatherTV_XML解析组件分析](./ZTE_V880/03_WeatherTV_XML解析组件分析.md)

### 字段映射

| V880字段 | 和风字段 | 说明 |
|---------|---------|------|
| `<Temp>` | `now.temp` | 当前温度 |
| `<WD>` | `now.windDir` | 风向 |
| `<WS>` | `now.windScale` | 风力 |
| `<SD>` | `now.humidity` | 湿度 |
| `<High>` | `daily.tempMax` | 最高温 |
| `<Low>` | `daily.tempMin` | 最低温 |

**详细映射**: [02_第二阶段-WeatherTV精准适配](./ZTE_V880/02_第二阶段-WeatherTV精准适配.md)

---

## 实现状态

### ✅ 已完成功能

- [x] API端点实现
- [x] 参数校验器
- [x] 数据转换器
- [x] 天气代码映射（50+个代码）
- [x] XML格式生成
- [x] 错误处理

### ⚠️ 待验证功能

- [ ] 与真实V880应用兼容性
- [ ] XML字段顺序
- [ ] 图标显示匹配

---

## 测试计划

### 本地测试

```bash
# 启动服务
npm run dev

# 测试实况天气
curl "http://localhost:1888/api/weather?sname=北京&dataType=ztewidgetsk"

# 测试预报天气
curl "http://localhost:1888/api/weather?sname=北京&dataType=ztewidgetcf"

# 测试完整数据
curl "http://localhost:1888/api/weather?sname=北京&dataType=ztev3widgetskall"
```

### 设备测试

1. 修改V880的hosts文件
2. 打开天气应用
3. 验证天气显示

---

## 参考资料

### 技术文档

1. **和风天气API文档**: https://dev.qweather.com/docs/api/
2. **V880 ROM分析**: 从APK提取的接口定义

### 项目文档

| 文档 | 说明 | 路径 |
|------|------|------|
| [01_第一阶段-基础服务搭建](./ZTE_V880/01_第一阶段-基础服务搭建.md) | Node.js服务搭建、API端点 | ZTE_V880/ |
| [02_第二阶段-WeatherTV精准适配](./ZTE_V880/02_第二阶段-WeatherTV精准适配.md) | XML结构、策略模式、任务清单 | ZTE_V880/ |
| [03_WeatherTV_XML解析组件分析](./ZTE_V880/03_WeatherTV_XML解析组件分析.md) | Handler类、数据类结构 | ZTE_V880/ |
| [04_WeatherWidget数据流转分析](./ZTE_V880/04_WeatherWidget数据流转分析.md) | 架构组件、触发机制 | ZTE_V880/ |
| [05_ORM与数据库设计](./ZTE_V880/05_ORM与数据库设计.md) | Prisma Schema、缓存策略 | ZTE_V880/ |
| [06_附加功能-时间同步方案](./ZTE_V880/06_附加功能-时间同步方案.md) | 时间同步实现 | ZTE_V880/ |
| [和风天气API接口文档](./和风天气API接口文档.md) | 和风API详细文档 | 根文档 |

### 代码位置

- **路由**: `src/routes/weather.ts`
- **转换器**: `src/services/v880/data-transform.ts`
- **类型定义**: `src/services/v880/types.ts`

---

## 附录

### 与HTC对比

| 特性 | V880 | HTC |
|------|------|-----|
| 交互方式 | 配置主城市 | 手动搜索添加 |
| 城市标识 | cityId/sname | loccode |
| API端点 | `/api/weather` | `/widget/htc/*` |
| 响应格式 | 自定义XML | AccuWeather XML |
| 请求方法 | GET/POST | GET |

---

*文档版本: 1.1*  
*最后更新: 2025-02-24*
