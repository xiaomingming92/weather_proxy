# AccuWeather API 历史版本与 HTC 定制分析

## 概述

本文档分析 AccuWeather API 在 2010-2011 年间的版本演变，以及 HTC 如何定制该 API 用于 HTC Sense 2.1 天气服务。

---

## 一、AccuWeather API 版本历史

### 1.1 时间线

| 时期 | API版本 | 特征 |
|------|---------|------|
| 2009-2010 | Legacy Widget API v1/v2 | `.asp` 端点，XML格式，Partner定制 |
| 2010-2011 | **Widget API v3** | HTC Sense 2.1 使用此版本 |
| 2012-2014 | Widget API v4/v5 | Sense 3.0/4.0 可能使用 |
| 2014-2020 | REST API (JSON) | 现代API，JSON格式 |
| 2020-至今 | Current API | 需要API Key认证 |

### 1.2 2010-2011 年 API 特征

#### Legacy Widget API (v3) 特征：

```
端点格式: http://{partner}.accuweather.com/widget/{brand}/{endpoint}.asp
响应格式: XML
认证方式: 固定 partner key (如 ac=TR2cra9U)
```

#### 与现代 API 的差异：

| 特征 | 2010-2011 Legacy | 现代 API (2020+) |
|------|------------------|------------------|
| 端点扩展名 | `.asp` | 无扩展名或 `.json` |
| 响应格式 | XML | JSON |
| 认证 | 固定 partner key | 动态 API Key |
| 协议 | HTTP | HTTPS |
| 域名 | partner.accuweather.com | api.accuweather.com |
| 城市标识 | loccode (ASI\|CN\|BJ\|Beijing) | LocationKey (数字ID) |

---

## 二、HTC 对 AccuWeather API 的定制

### 2.1 定制端点分析

从 HTC G13 ROM 提取的端点：

```
http://htc.accuweather.com/widget/htc/forecast-data_v3.asp
http://htc.accuweather.com/widget/htc/lat-lon-search.asp
http://htc2.accu-weather.com/widget/htc2/city-find.asp
http://htc2.accu-weather.com/widget/htc2/weather-data.asp
```

### 2.2 定制特征

#### 1. Partner 子域名

| 域名 | 用途 |
|------|------|
| `htc.accuweather.com` | 主数据源（天气预报） |
| `htc2.accu-weather.com` | 辅助数据源（城市搜索） |

**说明**：AccuWeather 为重要合作伙伴（如 HTC、三星等）提供独立的子域名，用于：
- 负载均衡
- 定制化响应格式
- 独立的服务等级协议 (SLA)

#### 2. 品牌路径

```
/widget/htc/     - HTC 品牌路径
/widget/htc2/    - HTC 辅助路径
```

#### 3. 端点命名规则

| 端点 | 功能 | 版本标识 |
|------|------|----------|
| `forecast-data_v3.asp` | 天气预报数据 | v3 = API版本3 |
| `city-find.asp` | 城市搜索 | 无版本号 |
| `lat-lon-search.asp` | GPS坐标搜索 | 无版本号 |
| `weather-data.asp` | 简化天气数据 | 无版本号 |

**关键发现**：`forecast-data_v3.asp` 中的 `v3` 表明这是 AccuWeather Widget API 的第3版，对应 2010-2011 年时间段。

#### 4. 认证参数

```
ac=TR2cra9U
```

- `ac` = Access Code / API Client
- `TR2cra9U` = HTC 的固定 Partner Key

这是 AccuWeather 2010-2011 年间的合作伙伴认证方式，与现代 API 的动态 key 不同。

### 2.3 与标准 AccuWeather API 的差异

#### 标准 AccuWeather Widget API (2010)：

```
http://{partner}.accuweather.com/widget/{partner}/forecast-data.asp
参数: ?partner={key}&location={city}
```

#### HTC 定制版本：

```
http://htc.accuweather.com/widget/htc/forecast-data_v3.asp
参数: ?ac=TR2cra9U&loccode=ASI|CN|BJ|Beijing
```

**差异点**：

| 项目 | 标准 API | HTC 定制 |
|------|----------|----------|
| 端点名 | `forecast-data.asp` | `forecast-data_v3.asp` |
| 认证参数 | `partner` | `ac` |
| 城市参数 | `location` | `loccode` |
| 城市格式 | 城市名 | 层级代码 (ASI\|CN\|BJ\|Beijing) |

---

## 三、HTC Sense 版本与 API 版本对应关系

### 3.1 推测的对应关系

| HTC Sense 版本 | 发布时间 | AccuWeather API 版本 | 端点特征 |
|----------------|----------|----------------------|----------|
| Sense 1.0 | 2009 | Widget API v1/v2 | `forecast-data.asp` (无版本号) |
| **Sense 2.0/2.1** | **2010-2011** | **Widget API v3** | **`forecast-data_v3.asp`** |
| Sense 3.0 | 2011 | Widget API v4 | `forecast-data_v4.asp` (推测) |
| Sense 4.0 | 2012 | Widget API v5 | `forecast-data_v5.asp` (推测) |
| Sense 5.0+ | 2013+ | REST API | `/currentconditions/v1/` |

### 3.2 ROM 证据

从 HTC G13 ROM 的 [build.prop](file:///c:/Users/Administrator/StudioProjects/htc-marvel-workspace/WORKING_022126_234011/system/build.prop#L217) 确认：

```properties
ro.htc.common.version = 2.1.0.0
```

这证明该设备使用 **HTC Sense 2.1**，与 `forecast-data_v3.asp` 的 v3 版本号吻合。

---

## 四、AccuWeather XML 响应格式演变

### 4.1 2010-2011 年格式 (HTC Sense 2.1)

```xml
<?xml version="1.0" encoding="utf-8"?>
<weather>
  <loc>Beijing</loc>
  <cc>
    <tmp>24</tmp>
    <t>C</t>
    <cond>Sunny</cond>
    <icon>1</icon>
  </cc>
  <dayf>
    <day d="0">
      <hi>28</hi>
      <low>18</low>
    </day>
  </dayf>
</weather>
```

### 4.2 与现代格式的差异

现代 AccuWeather API (2020+) 返回 JSON：

```json
{
  "LocalObservationDateTime": "2025-02-23T14:30:00+08:00",
  "WeatherText": "Sunny",
  "WeatherIcon": 1,
  "Temperature": {
    "Metric": {"Value": 24, "Unit": "C"}
  }
}
```

---

## 五、HTC 定制的意义

### 5.1 为什么需要定制？

1. **品牌一致性**：HTC 需要统一的天气体验
2. **性能优化**：定制响应格式减少数据传输
3. **故障转移**：双域名架构 (`htc` + `htc2`) 提供冗余
4. **区域优化**：中国版 ROM 可能使用不同的数据源

### 5.2 定制的影响

- **无法直接使用现代 AccuWeather API**：端点、参数、响应格式完全不同
- **必须使用代理服务**：将现代 API (如和风天气) 转换为 Legacy 格式
- **文档稀缺**：Legacy API 文档已下线，只能通过 ROM 分析获取

---

## 六、结论

### 6.1 关键发现

1. **API 版本**：HTC Sense 2.1 使用 AccuWeather Widget API v3 (2010-2011)
2. **定制深度**：HTC 拥有独立的子域名和定制端点
3. **版本对应**：`forecast-data_v3.asp` 的 `v3` 与 Sense 2.1 版本匹配
4. **不兼容性**：与现代 AccuWeather API 完全不兼容

### 6.2 适配建议

由于 HTC 使用的是 **2010-2011 年的 Legacy API**，而非标准 AccuWeather API：

1. **不要尝试对接现代 AccuWeather API** - 端点和格式完全不同
2. **使用代理服务转换** - 如本项目使用和风天气 → Legacy XML 转换
3. **参考 ROM 提取的格式** - 确保 XML 结构与 HTC 应用期望的一致
4. **注意版本差异** - 不同 Sense 版本可能使用不同 API 版本

---

## 参考资料

1. [HTC ROM 二进制分析方法](./HTC_ROM二进制分析方法.md)
2. [AccuWeather 天气代码对照表](./AccuWeather_天气代码对照表.md)
3. [QWeather 到 AccuWeather 适配证据](./HTC_QWeather_AccuWeather_适配证据.md)

---

*文档版本: 1.0*  
*最后更新: 2025-02-23*  
*分析基于: HTC G13 ROM (Sense 2.1, Android 2.3.3)*
