# WeatherWidget API适配说明

## 目标

本文档详细说明适配后的天气API响应结构，确保WeatherWidget能够正确解析和显示天气数据。

## API端点

### 基础URL

```
http://localhost:1888/api/weather
```

### 请求参数

| 参数名 | 类型 | 必需 | 说明 |
|-------|------|------|------|
| sname | string | 否 | 城市名称，例如：北京（与WeatherWidget的`NowCityName`对应） |
| cityId | string | 否 | 城市ID，例如：101010100（与WeatherWidget的`NowCityId`对应） |
| location | string | 否 | 经纬度，格式：`经度,纬度`，例如：`116.4074,39.9042` |
| dataType | string | 是 | 数据类型，支持以下值：<br>- `ztev3widgetskall` 或 `ztewidgetsk`：当前天气<br>- `ztewidgetcf`：天气预报 |
| code | string | 否 | 预留参数 |

### 与WeatherWidget兼容性

API设计完全兼容WeatherWidget的位置信息处理方式：

1. **城市名称**：对应WeatherWidget的`NowCityName`配置
2. **城市ID**：对应WeatherWidget的`NowCityId`配置
3. **经纬度**：作为扩展功能，WeatherWidget本身不直接使用

### WeatherWidget请求流程

WeatherWidget的天气数据请求流程如下：

1. **获取配置**：`WeatherService`从`WeatherSetting`获取主城市ID
2. **构建URI**：使用城市ID构建ContentProvider URI
3. **查询数据**：通过ContentResolver查询本地WeatherProvider
4. **处理结果**：`QueryHandler`处理查询结果，解析为`WeatherItem`对象
5. **更新UI**：将解析的数据更新到Widget UI上

### 配置城市参数逻辑

1. **获取主城市**：
   - `WeatherSetting.getMainCity()`从配置数据库查询`configname = 'main_city'`的记录
   - 获取主城市ID并存储在`mainCity`字段中

2. **存储配置**：
   - 城市信息存储在`SharedPreferences`中，键为`NowCityId`和`NowCityName`
   - 这些值在应用重启后仍然有效

3. **使用配置**：
   - `WeatherService.getCityNamesAndIds()`将主城市信息读入`checkedNames`列表
   - 遍历该列表，对每个城市进行天气数据请求
   - `TypeBWeatherWidget.queryWeatherByCity()`使用这些配置进行本地数据库查询

## 响应结构

### 1. 当前天气响应 (`ztev3widgetskall`/`ztewidgetsk`)

#### XML结构

```xml
<?xml version="1.0" encoding="utf-8"?>
<weather>
  <city>城市名称</city>
  <temp>当前温度</temp>
  <weather>天气代码</weather>
  <reporttime>更新时间</reporttime>
</weather>
```

#### 字段说明

| 字段名 | 类型 | 说明 | 示例值 |
|-------|------|------|--------|
| city | string | 城市名称 | 北京 |
| temp | string | 当前温度，单位：摄氏度 | 1 |
| weather | string | 天气代码，与WeatherWidget匹配 | 5 |
| reporttime | string | 更新时间，ISO格式 | 2026-02-05T09:43:40.829Z |

### 2. 天气预报响应 (`ztewidgetcf`)

#### XML结构

```xml
<?xml version="1.0" encoding="utf-8"?>
<weather>
  <city>城市名称</city>
  <reporttime>更新时间</reporttime>
  <startTime1>第一天开始时间</startTime1>
  <endTime1>第一天结束时间</endTime1>
  <week1>第一天星期</week1>
  <condition1>第一天天气代码</condition1>
  <tempMin1>第一天最低温度</tempMin1>
  <tempMax1>第一天最高温度</tempMax1>
  <startTime2>第二天开始时间</startTime2>
  <endTime2>第二天结束时间</endTime2>
  <week2>第二天星期</week2>
  <condition2>第二天天气代码</condition2>
  <tempMin2>第二天最低温度</tempMin2>
  <tempMax2>第二天最高温度</tempMax2>
</weather>
```

#### 字段说明

| 字段名 | 类型 | 说明 | 示例值 |
|-------|------|------|--------|
| city | string | 城市名称 | 北京 |
| reporttime | string | 更新时间，ISO格式 | 2026-02-05T17:42+08:00 |
| startTime1 | string | 第一天开始时间 | 2026-02-05 00:00:00 |
| endTime1 | string | 第一天结束时间 | 2026-02-05 23:59:59 |
| week1 | string | 第一天星期 | 周四 |
| condition1 | string | 第一天天气代码，与WeatherWidget匹配 | 5 |
| tempMin1 | string | 第一天最低温度，单位：摄氏度 | -2 |
| tempMax1 | string | 第一天最高温度，单位：摄氏度 | 2 |
| startTime2 | string | 第二天开始时间 | 2026-02-06 00:00:00 |
| endTime2 | string | 第二天结束时间 | 2026-02-06 23:59:59 |
| week2 | string | 第二天星期 | 周五 |
| condition2 | string | 第二天天气代码，与WeatherWidget匹配 | 5 |
| tempMin2 | string | 第二天最低温度，单位：摄氏度 | -3 |
| tempMax2 | string | 第二天最高温度，单位：摄氏度 | 1 |

## 示例响应

### 1. 当前天气响应示例

```xml
<?xml version="1.0" encoding="utf-8"?>
<weather>
  <city>北京</city>
  <temp>1</temp>
  <weather>5</weather>
  <reporttime>2026-02-05T09:43:40.829Z</reporttime>
</weather>
```

### 2. 天气预报响应示例

```xml
<?xml version="1.0" encoding="utf-8"?>
<weather>
  <city>北京</city>
  <reporttime>2026-02-05T17:42+08:00</reporttime>
  <startTime1>2026-02-05 00:00:00</startTime1>
  <endTime1>2026-02-05 23:59:59</endTime1>
  <week1>周四</week1>
  <condition1>5</condition1>
  <tempMin1>-2</tempMin1>
  <tempMax1>2</tempMax1>
  <startTime2>2026-02-06 00:00:00</startTime2>
  <endTime2>2026-02-06 23:59:59</endTime2>
  <week2>周五</week2>
  <condition2>5</condition2>
  <tempMin2>-3</tempMin2>
  <tempMax2>1</tempMax2>
</weather>
```

## 数据结构映射

### WeatherWidget数据结构与API响应映射

#### 1. 当前天气数据 (`WeatherCurrentCondition`)

| WeatherWidget字段 | API响应字段 | 说明 |
|-----------------|------------|------|
| cityName | city | 城市名称 |
| reportTime | reporttime | 报告时间 |
| condition | weather | 天气代码 |
| temp | temp | 当前温度 |

#### 2. 天气预报数据 (`WeatherForecastCondition`)

| WeatherWidget字段 | API响应字段 | 说明 |
|-----------------|------------|------|
| cityName | city | 城市名称 |
| reportTime | reporttime | 报告时间 |
| startTime1 | startTime1 | 第一天开始时间 |
| endTime1 | endTime1 | 第一天结束时间 |
| week1 | week1 | 第一天星期 |
| condition1 | condition1 | 第一天天气代码 |
| tempMin1 | tempMin1 | 第一天最低温度 |
| tempMax1 | tempMax1 | 第一天最高温度 |
| startTime2 | startTime2 | 第二天开始时间 |
| endTime2 | endTime2 | 第二天结束时间 |
| week2 | week2 | 第二天星期 |
| condition2 | condition2 | 第二天天气代码 |
| tempMin2 | tempMin2 | 第二天最低温度 |
| tempMax2 | tempMax2 | 第二天最高温度 |

### 天气代码映射

API使用的天气代码与WeatherWidget期望的代码已经进行了映射，确保完全匹配。映射表如下：

| 和风天气代码 | WeatherWidget代码 | 天气状态 |
|------------|----------------|----------|
| 100 | 0 | 晴 |
| 101 | 1 | 多云 |
| 102 | 2 | 少云 |
| 103 | 3 | 晴间多云 |
| 104 | 4 | 阴 |
| 150 | 5 | 晴 |
| 151 | 6 | 多云 |
| 152 | 7 | 阴 |
| 300 | 8 | 雨 |
| 301 | 9 | 雨 |
| 302 | 10 | 雨 |
| 303 | 11 | 雨 |
| 304 | 12 | 雨 |
| 305 | 13 | 雨 |
| 306 | 14 | 雨 |
| 307 | 15 | 雨 |
| 308 | 16 | 雨 |
| 309 | 17 | 雨 |
| 310 | 18 | 雨 |
| 311 | 19 | 雨 |
| 312 | 20 | 雨 |
| 313 | 21 | 雨 |
| 314 | 22 | 雨 |
| 315 | 23 | 雨 |
| 316 | 24 | 雨 |
| 317 | 25 | 雨 |
| 318 | 26 | 雨 |
| 400 | 27 | 雪 |
| 401 | 28 | 雪 |
| 402 | 29 | 雪 |
| 403 | 30 | 雪 |
| 404 | 31 | 雪 |
| 405 | 32 | 雪 |
| 406 | 33 | 雪 |
| 407 | 34 | 雪 |
| 500 | 35 | 雾 |
| 501 | 36 | 雾 |
| 502 | 37 | 雾 |
| 503 | 38 | 雾 |
| 504 | 39 | 雾 |
| 507 | 40 | 雾 |
| 508 | 41 | 雾 |
| 600 | 42 | 风 |
| 601 | 43 | 风 |
| 602 | 44 | 风 |
| 700 | 45 | 霾 |
| 701 | 46 | 霾 |
| 702 | 47 | 霾 |
| 703 | 48 | 霾 |
| 704 | 49 | 霾 |
| 705 | 50 | 霾 |
| 706 | 51 | 霾 |
| 707 | 52 | 霾 |
| 708 | 53 | 霾 |
| 800 | 54 | 沙尘 |
| 801 | 55 | 沙尘 |
| 802 | 56 | 沙尘 |
| 803 | 57 | 沙尘 |
| 804 | 58 | 沙尘 |

## 技术实现

### 数据转换

天气API代理服务使用`data-transform.ts`文件中的`DataTransform`类来转换数据格式：

1. **当前天气转换**：`generateCurrentWeatherXml`方法
2. **天气预报转换**：`generateForecastXml`方法

### 错误处理

API具有完善的错误处理机制，确保在各种情况下都能返回有效的响应：

1. **参数错误**：当缺少必要参数时，返回400错误
2. **城市未找到**：当城市名称不存在时，返回500错误
3. **API错误**：当调用和风天气API失败时，返回500错误

## 测试方法

### 1. 测试当前天气

```bash
curl "http://localhost:1888/api/weather?sname=北京&dataType=ztev3widgetskall"
```

### 2. 测试天气预报

```bash
curl "http://localhost:1888/api/weather?sname=北京&dataType=ztewidgetcf"
```

### 3. 测试缓存

多次请求相同城市，验证响应速度是否有提升。

## 总结

适配后的天气API响应结构完全符合WeatherWidget的期望，确保WeatherWidget能够正确解析和显示天气数据。API提供了当前天气和天气预报两种数据类型，支持通过城市名称查询天气信息。

通过详细的字段映射和天气代码映射，确保了数据的准确性和一致性。同时，API具有完善的错误处理机制，提高了系统的稳定性和可靠性。