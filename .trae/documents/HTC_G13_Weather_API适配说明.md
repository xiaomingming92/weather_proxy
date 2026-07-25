# HTC Weather API 适配说明

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

为HTC G13手机（Android 2.3）的天气应用提供代理服务，将原生的AccuWeather API请求转发到和风天气(QWeather)API，并转换响应格式。

### 背景

- **设备**: HTC G13 (Wildfire S)
- **系统**: Android 2.3.5 (Gingerbread)
- **HTC Sense**: 2.1 (ro.htc.common.version = 2.1.0.0)
- **原API**: AccuWeather Widget API v3 (2010-2011 Legacy API, 已下线)
- **新API**: 和风天气 (QWeather)
- **代理服务器**: 8.153.104.150 (VPS)

**重要**: HTC 使用的是 2010-2011 年的 AccuWeather Legacy API (`forecast-data_v3.asp`)，这是 HTC 定制的 Partner API，与现代 AccuWeather API 完全不同。详细分析见 [AccuWeather API分析与适配背景](./HTC_G13/01_AccuWeather_API分析与适配背景.md)。

### 工作原理

```
HTC天气App → 请求AccuWeather API
    ↓
Hosts劫持 → 指向 8.153.104.150
    ↓
Weather Proxy服务 → 转发到和风天气API
    ↓
数据转换 → AccuWeather格式
    ↓
HTC天气App ← XML响应
```

---

## 文档结构

```
weather_proxy/.trae/documents/
├── HTC_G13/
│   ├── 01_AccuWeather_API分析与适配背景.md      # API版本历史、HTC定制分析
│   ├── 02_QWeather到AccuWeather适配实现.md      # 接口层、数据结构适配
│   ├── 03_AccuWeather天气代码对照表.md          # 44个天气代码映射
│   ├── 04_HTC_ROM二进制分析方法.md              # ROM字符串提取方法
│   └── old/                                     # 归档的旧文档
├── HTC_G13_Weather_API适配说明.md               # 本文件（入口文档）
└── 和风天气API接口文档.md                        # 和风API详细文档
```

### 文档阅读指南

| 文档 | 内容 | 阅读建议 |
|------|------|---------|
| [01_AccuWeather_API分析与适配背景](./HTC_G13/01_AccuWeather_API分析与适配背景.md) | API版本演变、HTC定制深度分析 | 先读，了解背景 |
| [02_QWeather到AccuWeather适配实现](./HTC_G13/02_QWeather到AccuWeather适配实现.md) | 接口层、入参/响应数据结构适配 | 核心实现文档 |
| [03_AccuWeather天气代码对照表](./HTC_G13/03_AccuWeather天气代码对照表.md) | 44个AccuWeather代码、QWeather映射 | 参考文档 |
| [04_HTC_ROM二进制分析方法](./HTC_G13/04_HTC_ROM二进制分析方法.md) | ROM分析方法、字符串提取 | 技术参考 |

---

## 架构设计

### 服务架构

```
weather_proxy/
├── src/
│   ├── routes/
│   │   ├── htc-weather.ts      # HTC路由 (/widget/*)
│   │   └── weather.ts          # V880路由 (/api/*)
│   ├── services/
│   │   ├── htc/                # HTC服务
│   │   │   ├── data-transform.ts   # 数据转换器
│   │   │   ├── types.ts            # 类型定义
│   │   │   └── validator.ts        # 参数校验
│   │   ├── weather-api.ts      # 和风API客户端
│   │   └── cache.ts            # 缓存服务
│   └── server.ts
└── scripts/
    └── extract_strings.py      # ROM分析脚本
```

### 数据流

```
用户操作 → HTC路由 → 校验器 → 和风API → 转换器 → XML响应
```

---

## API端点

### 已实现端点

| 端点 | 路径 | 方法 | 状态 | 说明 |
|------|------|------|------|------|
| 天气预报 | `/widget/htc/forecast-data_v3.asp` | GET | ✅ | 获取城市天气 |
| 城市搜索 | `/widget/htc2/city-find.asp` | GET | ✅ | 搜索城市列表 |
| 经纬度搜索 | `/widget/htc/lat-lon-search.asp` | GET | ✅ | GPS定位(备用) |
| 天气数据 | `/widget/htc2/weather-data.asp` | GET | ✅ | 简化版天气(备用) |

### 核心端点详解

#### 1. 天气预报

**请求**
```
GET /widget/htc/forecast-data_v3.asp?ac=TR2cra9U&loccode=ASI|CN|BJ|Beijing
```

**参数**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| ac | string | ✓ | API密钥，固定值 `TR2cra9U` |
| loccode | string | ✓ | 城市代码，如 `ASI\|CN\|BJ\|Beijing` |

**响应** (XML)
```xml
<?xml version="1.0" encoding="utf-8"?>
<weather>
  <loc>Beijing</loc>
  <cc>
    <tmp>24</tmp>
    <t>C</t>
    <cond>Sunny</cond>
    <icon>1</icon>
    <hmid>45</hmid>
    <wind><dir>NE</dir><spd>3</spd></wind>
    <updt>2025-02-23 14:30:00</updt>
  </cc>
  <dayf>
    <day d="0">
      <hi>28</hi>
      <low>18</low>
      <week>1</week>
      <part p="d"><icon>2</icon><cond>Partly Cloudy</cond></part>
      <part p="n"><icon>33</icon><cond>Clear</cond></part>
    </day>
  </dayf>
</weather>
```

#### 2. 城市搜索

**请求**
```
GET /widget/htc2/city-find.asp?q=Beijing
```

**参数**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| q | string | ✓ | 搜索关键词 |

**响应** (XML)
```xml
<?xml version="1.0" encoding="utf-8"?>
<cities>
  <city>
    <id>ASI|CN|BJ|Beijing</id>
    <name>Beijing</name>
    <country>China</country>
    <state>Beijing</state>
    <lat>39.9042</lat>
    <lon>116.4074</lon>
  </city>
</cities>
```

---

## 数据映射

### 天气代码映射

和风天气代码 → AccuWeather代码

| 和风代码 | 描述 | AccuWeather | 描述 |
|---------|------|-------------|------|
| 100 | 晴 | 1 | Sunny |
| 101 | 多云 | 4 | Intermittent Clouds |
| 305 | 小雨 | 18 | Rain |
| 400 | 小雪 | 22 | Snow |
| ... | ... | ... | ... |

**完整映射表**: [AccuWeather天气代码对照表](./HTC_G13/03_AccuWeather天气代码对照表.md)

### 字段映射

| AccuWeather | 和风字段 | 说明 |
|-------------|---------|------|
| `<tmp>` | `now.temp` | 当前温度 |
| `<icon>` | `now.icon` | 天气图标代码 |
| `<cond>` | `now.text` | 天气描述 |
| `<hmid>` | `now.humidity` | 湿度 |
| `<hi>` | `daily.tempMax` | 最高温 |
| `<low>` | `daily.tempMin` | 最低温 |

**详细映射**: [QWeather到AccuWeather适配实现](./HTC_G13/02_QWeather到AccuWeather适配实现.md)

---

## 实现状态

### ✅ 已完成功能

- [x] 4个API端点实现
- [x] 参数校验器
- [x] 数据转换器
- [x] 天气代码映射（100+个代码）
- [x] XML格式生成
- [x] 错误处理

### ⚠️ 待验证功能

- [ ] 与真实HTC应用兼容性
- [ ] XML字段顺序
- [ ] 图标显示匹配

### ⏸️ 暂不实现

- GPS定位（HTC应用未使用）
- 多数据源切换

---

## 测试计划

### 本地测试

```bash
# 启动服务
npm run dev

# 测试城市搜索
curl "http://localhost:1888/widget/htc2/city-find.asp?q=上海"

# 测试天气预报
curl "http://localhost:1888/widget/htc/forecast-data_v3.asp?ac=TR2cra9U&loccode=ASI%7CCN%7CSH%7CShanghai"
```

### 设备测试

1. 修改G13的hosts文件
2. 打开HTC天气应用
3. 添加城市测试
4. 验证天气显示

---

## 参考资料

### 技术文档

1. **和风天气API文档**: https://dev.qweather.com/docs/api/
2. **AccuWeather API**: https://developer.accuweather.com/

### 项目文档

| 文档 | 说明 | 路径 |
|------|------|------|
| [01_AccuWeather_API分析与适配背景](./HTC_G13/01_AccuWeather_API分析与适配背景.md) | API版本演变、HTC定制分析 | HTC_G13/ |
| [02_QWeather到AccuWeather适配实现](./HTC_G13/02_QWeather到AccuWeather适配实现.md) | 接口层、数据结构适配 | HTC_G13/ |
| [03_AccuWeather天气代码对照表](./HTC_G13/03_AccuWeather天气代码对照表.md) | 44个天气代码映射 | HTC_G13/ |
| [04_HTC_ROM二进制分析方法](./HTC_G13/04_HTC_ROM二进制分析方法.md) | ROM分析方法 | HTC_G13/ |
| [和风天气API接口文档](./和风天气API接口文档.md) | 和风API详细文档 | 根文档 |

### 重要说明

**HTC 使用的是 2010-2011 年的 Legacy AccuWeather API，与现代 API 完全不兼容。**

详细分析请参考 [01_AccuWeather_API分析与适配背景](./HTC_G13/01_AccuWeather_API分析与适配背景.md)，主要差异包括：

| 特征 | HTC Sense 2.1 (2011) | 现代 AccuWeather API |
|------|----------------------|----------------------|
| 端点 | `forecast-data_v3.asp` | `/currentconditions/v1/{locationKey}` |
| 格式 | XML | JSON |
| 认证 | 固定 `ac=TR2cra9U` | 动态 API Key |
| 协议 | HTTP | HTTPS |

### 代码位置

- **路由**: `src/routes/htc-weather.ts`
- **转换器**: `src/services/htc/data-transform.ts`
- **类型定义**: `src/services/htc/types.ts`
- **校验器**: `src/services/htc/validator.ts`
- **分析脚本**: `scripts/extract_strings.py`

---

## 附录

### 用户交互流程

```
打开应用 → 显示默认城市天气
    ↓
点击"添加城市" → 打开搜索界面
    ↓
输入城市名 → 实时搜索建议
    ↓
选择城市 → 保存并显示天气
```

### 与V880对比

| 特性 | V880 | HTC |
|------|------|-----|
| 交互方式 | 配置主城市 | 手动搜索添加 |
| 城市标识 | cityId | loccode |
| API端点 | `/api/weather` | `/widget/htc/*` |
| 响应格式 | 自定义XML | AccuWeather XML |

---

*文档版本: 1.1*  
*最后更新: 2025-02-24*
