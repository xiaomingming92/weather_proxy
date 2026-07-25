# HTC 天气原版接口适配分析

## 1. 接口概述

HTC G13 国行版使用**华风天气**接口（非 AccuWeather 国际版），这是专门为中国市场定制的天气服务。

**华风天气端点：**
```
http://htc-mobile.mywtv.cn/getweatheru.asmx/getData?dataType=htc&code=ED926B&sname={城市代码}
```

**代理路由文件：** `weather_proxy/src/routes/htc-huafeng-weather.ts`

## 2. 华风天气与 AccuWeather 的区别

| 对比项 | 华风天气（国行） | AccuWeather（国际版） |
|--------|----------------|---------------------|
| **服务端点** | `htc-mobile.mywtv.cn` | `api.accuweather.com` |
| **数据格式** | 自定义 XML | AccuWeather XML |
| **城市代码** | 华风专用代码（如 01011712） | AccuWeather LocationKey |
| **天气代码** | 0-36（华风代码） | 1-54（AccuWeather 代码） |
| **响应语言** | 中文 | 英文 |
| **覆盖范围** | 中国大陆 | 全球 |

## 3. 华风天气接口详情

### 3.1 请求端点

```
GET /getweatheru.asmx/getData?dataType=htc&code=ED926B&sname=01011712
```

**入参：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dataType | string | 是 | 数据类型，固定值：`htc` |
| code | string | 是 | 认证码，固定值：`ED926B` |
| sname | string | 是 | 城市代码，如 `01011712`（南京） |

### 3.2 响应 XML 格式

```xml
<?xml version="1.0" encoding="utf-8"?>
<root>
  <CityMeteor CityName="南京">
    <StationInfo StationID="01011712" Longitude="118.7969" Latitude="32.0603"/>
    <CF ReportTime="2025-03-03 14:30:00">
      <Period TimeStart="2025-03-03 00:00:00" TimeEnd="2025-03-03 23:59:59" 
              Weather="1" Tmax="28" Tmin="15" Week="1" WindDir="东南风" WindPower="3"/>
    </CF>
    <SK>
      <Info Weather="1" Temperature="25" WindDir="东南风" WindPower="3" WindSpeed="12" Humidity="45"/>
    </SK>
  </CityMeteor>
</root>
```

**字段说明：**
| XML 字段 | 说明 | 示例值 |
|----------|------|--------|
| `CityMeteor.CityName` | 城市名称 | "南京" |
| `StationInfo.StationID` | 站点ID/城市代码 | "01011712" |
| `CF.ReportTime` | 报告时间 | "2025-03-03 14:30:00" |
| `CF.Period.Weather` | 天气状况代码（0-36） | "1"（多云） |
| `CF.Period.Tmax` | 最高温度 | "28" |
| `CF.Period.Tmin` | 最低温度 | "15" |
| `CF.Period.Week` | 星期（1-7，周一=1） | "1" |
| `SK.Info.Weather` | 当前天气代码（0-36） | "1" |
| `SK.Info.Temperature` | 当前温度 | "25" |
| `SK.Info.Humidity` | 湿度 | "45" |

## 4. 天气代码映射

### 4.1 华风天气代码（0-36）

**映射文件：** `weather_proxy/src/services/htc/htc-huafeng-types.ts`

| 华风代码 | 中文描述 | 适用场景 |
|---------|---------|---------|
| 0 | 晴 | 晴天 |
| 1 | 多云 | 多云天气 |
| 2 | 阴 | 阴天 |
| 3 | 雨 | 一般性降雨 |
| 4 | 雷阵雨 | 雷雨天气 |
| 5 | 雾 | 雾天 |
| 6 | 雪 | 降雪 |
| 7 | 雨夹雪 | 雨夹雪 |
| 8 | 小雨 | 小雨 |
| 9 | 中雨 | 中雨 |
| 10 | 大雨 | 大雨 |
| 11 | 暴雨 | 暴雨 |
| 12 | 大暴雨 | 大暴雨 |
| 13 | 特大暴雨 | 特大暴雨 |
| 14 | 冻雨 | 冻雨 |
| 15 | 阵雪 | 阵雪 |
| 16 | 阵性降水 | 阵性降水 |
| 17 | 阵性雨夹雪 | 阵性雨夹雪 |
| 18 | 冰雹 | 冰雹 |
| 19 | 浮尘 | 浮尘 |
| **20** | **扬沙** | **扬沙** ← 扬州问题代码 |
| 21 | 强沙尘暴 | 强沙尘暴 |
| 22 | 霾 | 霾 |
| 23 | 雾凇 | 雾凇 |
| 24 | 雨凇 | 雨凇 |
| 25 | 沙尘暴 | 沙尘暴 |
| 26 | 强沙尘暴 | 强沙尘暴 |
| 27 | 龙卷风 | 龙卷风 |
| 28 | 飑线 | 飑线 |
| 29 | 轻雾 | 轻雾 |
| 30 | 大雾 | 大雾 |
| 31 | 浓雾 | 浓雾 |
| 32 | 强浓雾 | 强浓雾 |
| 33 | 特强浓雾 | 特强浓雾 |
| 34 | 霾 | 霾 |
| 35 | 中度霾 | 中度霾 |
| 36 | 重度霾 | 重度霾 |

### 4.2 和风天气 → 华风天气 映射

```typescript
// 沙尘相关映射
'800': 19, // 浮尘
'801': 20, // 扬沙 ← 扬州问题根源
'802': 25, // 沙尘暴
'803': 26, // 强沙尘暴
'804': 27, // 龙卷风
```

## 5. 扬州天气显示"扬沙"问题分析

### 5.1 问题现象

扬州天气在手机上显示为"扬沙"，但扬州正常情况下应该是晴天或多云。

### 5.2 问题根源

**映射链路：**
```
和风天气 API
    ↓ 返回代码 801（扬沙）
QWEATHER_TO_HUAFENG_MAP['801'] = 20
    ↓ 映射为华风代码 20
华风代码 20 = "扬沙"
    ↓ 显示在手机上
用户看到"扬沙"
```

### 5.3 可能原因

1. **和风天气 API 返回错误代码**：扬州的城市代码可能被错误匹配到了其他有沙尘的城市
2. **PM2.5 数据干扰**：和风天气可能将空气质量数据（PM2.5 超标）误报为天气状况（扬沙）
3. **数据源问题**：和风天气的数据源可能混淆了天气状况和空气质量

### 5.4 问题定位

根据代码分析，扬州显示"扬沙"是因为：
- **和风天气返回了代码 `801`（扬沙）**
- **映射到华风代码 `20`（扬沙）**
- **华风代码 `20` 的中文描述是"扬沙"**

**注意：** 这是和风天气 API 的数据问题，不是映射逻辑问题。映射表正确地将 801 映射为 20（扬沙）。

### 5.5 解决方案建议

1. **后端校验**（可选）：对于江南城市（扬州、苏州、杭州等），如果返回扬沙/沙尘代码，可以记录日志并考虑修正
2. **前端提示**：在 App 中显示天气时，可以添加数据来源说明
3. **联系和风天气**：反馈数据质量问题，请求修正扬州等城市的天气数据

## 6. 数据转换流程

```
HTC G13 国行版天气请求
    ↓ GET /getweatheru.asmx/getData?sname=01011712
    
代理服务 (htc-huafeng-weather.ts)
    ↓ 解析城市代码
    
调用和风天气 API (weather-api.ts)
    ↓ 获取实时天气 + 预报
    
数据转换 (htc-huafeng-data-transform.ts)
    ↓ 生成华风 XML 格式
    
华风 XML 响应
    ↓ <root><CityMeteor>...</CityMeteor></root>
    
HTC G13 解析显示
```

## 7. 与国际版（AccuWeather）的区别

### 7.1 接口差异

| 项目 | 华风天气（国行） | AccuWeather（国际版） |
|------|----------------|---------------------|
| **端点** | `/getweatheru.asmx/getData` | `/widget/htc/forecast-data_v3.asp` |
| **认证** | `code=ED926B` | `ac=TR2cra9U` |
| **城市标识** | `sname={华风代码}` | `loccode=ASI\|CN\|省\|城市` |
| **响应格式** | 华风 XML | AccuWeather XML |

### 7.2 XML 格式差异

**华风 XML：**
```xml
<root>
  <CityMeteor CityName="南京">
    <CF>...</CF>  <!-- 预报 -->
    <SK>...</SK>  <!-- 实况 -->
  </CityMeteor>
</root>
```

**AccuWeather XML：**
```xml
<weather>
  <loc>Beijing</loc>
  <cc>...</cc>    <!-- 当前天气 -->
  <dayf>...</dayf> <!-- 预报 -->
</weather>
```

## 8. 相关文件

| 文件 | 说明 |
|------|------|
| `src/routes/htc-huafeng-weather.ts` | 华风天气路由处理 |
| `src/services/htc/htc-huafeng-data-transform.ts` | 华风 XML 数据转换 |
| `src/services/htc/htc-huafeng-types.ts` | 华风天气类型定义和代码映射 |
| `src/services/htc/huafeng-city-codes-from-source.json` | 华风城市代码映射表 |

## 9. 注意事项

1. **国行与国际版区别**：国行 HTC G13 使用华风天气，国际版使用 AccuWeather
2. **城市代码不同**：华风使用专用城市代码（如 01011712），需要单独维护映射表
3. **天气代码范围**：华风代码 0-36，AccuWeather 代码 1-54
4. **XML 格式不同**：两种接口返回完全不同的 XML 结构
5. **数据质量**：部分城市（如扬州）可能出现天气代码错误，需要关注
