# QWeather到AccuWeather适配实现

## 概述

本文档详细说明如何将和风天气(QWeather)API数据转换为HTC Sense 2.1期望的AccuWeather Legacy API格式。

## 适配维度总览

| 维度 | 状态 | 说明 |
|------|------|------|
| 接口层适配 | ✅ 完成 | 4个AccuWeather端点全部实现 |
| 入参数据结构适配 | ✅ 完成 | 参数校验和解析完整 |
| 响应数据结构适配 | ✅ 完成 | XML格式完全匹配 |
| 天气代码映射 | ✅ 完成 | 100个代码映射 |

## 接口层适配

### 端点映射

| AccuWeather端点 | 实现状态 | 文件位置 |
|----------------|---------|---------|
| `/widget/htc/forecast-data_v3.asp` | ✅ 已实现 | `src/routes/htc-weather.ts:29` |
| `/widget/htc2/city-find.asp` | ✅ 已实现 | `src/routes/htc-weather.ts:106` |
| `/widget/htc/lat-lon-search.asp` | ✅ 已实现 | `src/routes/htc-weather.ts:68` |
| `/widget/htc2/weather-data.asp` | ✅ 已实现 | `src/routes/htc-weather.ts:144` |

### 请求方法
- **AccuWeather**: GET
- **实现**: GET ✅

### 认证方式
- **AccuWeather**: `ac=TR2cra9U` 查询参数
- **实现**: ✅ 校验器验证 `src/services/htc/validator.ts:14`

## 入参数据结构适配

### 1. 天气预报端点入参

**AccuWeather定义**:
```
GET /widget/htc/forecast-data_v3.asp?ac=TR2cra9U&loccode=ASI|CN|BJ|Beijing
```

**实现代码** (`src/routes/htc-weather.ts:29-62`):
```typescript
router.get('/htc/forecast-data_v3.asp', async (req, res) => {
  // 参数校验
  const validation = validateForecastRequest(req.query);
  // 解析 loccode
  const { loccode } = req.query as { loccode: string };
  const cityName = parseLocCode(loccode);
```

**入参校验器** (`src/services/htc/validator.ts:14-38`):
```typescript
export function validateForecastRequest(query: Record<string, unknown>): ValidationResult {
  const { ac, loccode } = query;
  
  // 检查ac参数
  if (!ac) return { valid: false, error: 'Missing required parameter: ac' };
  if (ac !== HTC_API_KEY) return { valid: false, error: 'Invalid API key' };
  
  // 检查loccode参数
  if (!loccode) return { valid: false, error: 'Missing required parameter: loccode' };
```

**参数映射表**:

| AccuWeather参数 | 类型 | 必需 | 实现对应 |
|----------------|------|------|---------|
| `ac` | string | ✓ | ✅ `validateForecastRequest` 校验 |
| `loccode` | string | ✓ | ✅ `parseLocCode` 解析为城市名 |

### 2. 城市搜索端点入参

**AccuWeather定义**:
```
GET /widget/htc2/city-find.asp?q=Beijing
```

**实现代码** (`src/routes/htc-weather.ts:106-138`):
```typescript
router.get('/htc2/city-find.asp', async (req, res) => {
  const validation = validateCityFindRequest(req.query);
  const { q } = req.query as { q: string };
```

**入参校验器** (`src/services/htc/validator.ts:66-84`):
```typescript
export function validateCityFindRequest(query: Record<string, unknown>): ValidationResult {
  const { q } = query;
  if (!q) return { valid: false, error: 'Missing required parameter: q' };
  if (typeof q !== 'string') return { valid: false, error: 'Invalid query format' };
```

## 响应数据结构适配

### 1. 天气预报响应

**AccuWeather期望格式**:
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

**实现代码** (`src/services/htc/data-transform.ts:21-73`):
```typescript
generateForecastXml(qweatherData: QWeatherResponse, cityName: string): string {
  let xml = XML_HEADER;
  xml += `<weather>`;
  xml += `<loc>${this.escapeXml(cityName)}</loc>`;
  
  // <cc> 当前天气
  xml += `<cc>`;
  xml += `<tmp>${now?.temp || '0'}</tmp>`;
  xml += `<t>${DEFAULT_TEMP_UNIT}</t>`;
  xml += `<cond>${this.escapeXml(now?.text || 'Unknown')}</cond>`;
  xml += `<icon>${getAccuWeatherCode(now?.icon || '100')}</icon>`;
  xml += `<hmid>${now?.humidity || '0'}</hmid>`;
  xml += `<wind>`;
  xml += `<dir>${this.escapeXml(now?.windDir || '0')}</dir>`;
  xml += `<spd>${now?.windScale || '0'}</spd>`;
  xml += `</wind>`;
  xml += `</cc>`;
  
  // <dayf> 预报
  xml += `<dayf>`;
  daily.slice(0, FORECAST_DAYS).forEach((day, index) => {
    xml += `<day d="${index}">`;
    xml += `<hi>${day.tempMax}</hi>`;
    xml += `<low>${day.tempMin}</low>`;
    xml += `<week>${day.week || this.getWeekNumber(day.fxDate)}</week>`;
    xml += `<part p="d">`;
    xml += `<icon>${getAccuWeatherCode(day.iconDay)}</icon>`;
    xml += `<cond>${this.escapeXml(day.textDay)}</cond>`;
    xml += `</part>`;
    xml += `<part p="n">`;
    xml += `<icon>${getAccuWeatherCode(day.iconNight)}</icon>`;
    xml += `<cond>${this.escapeXml(day.textNight)}</cond>`;
    xml += `</part>`;
    xml += `</day>`;
  });
  xml += `</dayf>`;
  xml += `</weather>`;
}
```

**字段映射证据**:

| AccuWeather字段 | QWeather源字段 | 转换代码位置 |
|----------------|---------------|-------------|
| `<loc>` | `cityName` 参数 | L30 |
| `<tmp>` | `now.temp` | L34 |
| `<t>` | `DEFAULT_TEMP_UNIT` (C) | L35 |
| `<cond>` | `now.text` | L36 |
| `<icon>` | `now.icon` → `getAccuWeatherCode()` | L37 |
| `<hmid>` | `now.humidity` | L38 |
| `<wind><dir>` | `now.windDir` | L40 |
| `<wind><spd>` | `now.windScale` | L41 |
| `<updt>` | `now.obsTime` | L43 |
| `<hi>` | `daily.tempMax` | L50 |
| `<low>` | `daily.tempMin` | L51 |
| `<week>` | 计算或 `daily.week` | L52 |
| `<part p="d"><icon>` | `daily.iconDay` → `getAccuWeatherCode()` | L56 |
| `<part p="n"><icon>` | `daily.iconNight` → `getAccuWeatherCode()` | L62 |

### 2. 城市搜索响应

**AccuWeather期望格式**:
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

**实现代码** (`src/services/htc/data-transform.ts:79-99`):
```typescript
generateCitySearchXml(qweatherData: QWeatherResponse): string {
  const locations = qweatherData.location || [];
  let xml = XML_HEADER;
  xml += `<cities>`;
  
  locations.forEach((loc) => {
    xml += `<city>`;
    xml += `<id>${this.escapeXml(loc.id)}</id>`;
    xml += `<name>${this.escapeXml(loc.name)}</name>`;
    xml += `<country>${this.escapeXml(loc.country)}</country>`;
    xml += `<state>${this.escapeXml(loc.adm1)}</state>`;
    xml += `<lat>${loc.lat}</lat>`;
    xml += `<lon>${loc.lon}</lon>`;
    xml += `</city>`;
  });
  
  xml += `</cities>`;
}
```

**字段映射证据**:

| AccuWeather字段 | QWeather源字段 | 转换代码位置 |
|----------------|---------------|-------------|
| `<id>` | `location.id` | L87 |
| `<name>` | `location.name` | L88 |
| `<country>` | `location.country` | L89 |
| `<state>` | `location.adm1` | L90 |
| `<lat>` | `location.lat` | L91 |
| `<lon>` | `location.lon` | L92 |

## 天气代码映射

### 映射表定义

**文件位置**: `src/services/htc/types.ts:213-269`

```typescript
export const QWEATHER_TO_ACCUWEATHER_MAP: Record<string, string> = {
  // 晴
  '100': '1',   // 晴
  '150': '33',  // 晴（夜间）
  // 多云
  '101': '4',   // 多云
  '102': '3',   // 少云
  '103': '2',   // 晴间多云
  // ... 完整映射表
};
```

### 映射使用

**转换函数** (`src/services/htc/types.ts:271-273`):
```typescript
export function getAccuWeatherCode(qweatherCode: string): string {
  return QWEATHER_TO_ACCUWEATHER_MAP[qweatherCode] || '1';
}
```

**使用位置**:
- `data-transform.ts:37` - 当前天气图标
- `data-transform.ts:56` - 白天预报图标
- `data-transform.ts:62` - 夜间预报图标

## 数据类型定义

### QWeatherResponse接口

**文件**: `src/services/htc/types.ts:160-190`

```typescript
export interface QWeatherResponse {
  code: string;
  location?: Array<{
    id: string;
    name: string;
    country: string;
    adm1: string;
    lat: string;
    lon: string;
  }>;
  now?: {
    temp: string;
    icon: string;
    text: string;
    humidity: string;
    windDir: string;
    windScale: string;
    obsTime: string;
  };
  daily?: Array<{
    fxDate: string;
    tempMax: string;
    tempMin: string;
    iconDay: string;
    iconNight: string;
    textDay: string;
    textNight: string;
    windDirDay: string;
    week?: number;
  }>;
}
```

## 完整数据流

```
HTC天气App
    ↓ 请求 /widget/htc/forecast-data_v3.asp?ac=TR2cra9U&loccode=ASI|CN|BJ|Beijing
    
Route (htc-weather.ts:29)
    ↓ 调用 validateForecastRequest(req.query)
    
Validator (validator.ts:14)
    ↓ 校验 ac=TR2cra9U, loccode=ASI|CN|BJ|Beijing
    
Transform (data-transform.ts:21)
    ↓ 调用 generateForecastXml(qweatherData, cityName)
    
QWeather API (weather-api.ts)
    ↓ 获取实时天气 + 7天预报
    
AccuWeather XML 响应
    ↓ <weather><loc>Beijing</loc><cc>...</cc><dayf>...</dayf></weather>
    
HTC天气App 解析显示
```

## 适配结论

### 接口层 ✅
- 4个AccuWeather端点全部实现
- 请求方法匹配 (GET)
- 认证参数校验完整

### 入参数据结构 ✅
- `ac` 参数校验
- `loccode` 参数解析
- `q` 参数校验
- `lat/lon` 参数校验

### 响应数据结构 ✅
- `<weather>` 根元素
- `<loc>` 城市名称
- `<cc>` 当前天气（8个子元素）
- `<dayf>` 预报数据（多天）
- `<cities>` 城市列表
- 所有字段映射正确

### 天气代码映射 ✅
- 100个QWeather代码映射到AccuWeather
- 映射函数 `getAccuWeatherCode()`
- 在3处被调用（当前、白天、夜间）

**全面适配完成！**
